import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  CreditCard,
  Lock,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Plane,
  Train,
  Bus,
  Hotel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PriceDisplay } from '@/components/ui/price-display';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SEOHead } from '@/components/ui/seo-head';

const paymentSchema = z.object({
  cardHolderName: z.string().min(2, 'Cardholder name is required'),
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(19, 'Invalid card number'),
  expiryMonth: z.string().min(2, 'Expiry month is required'),
  expiryYear: z.string().min(4, 'Expiry year is required'),
  cvv: z.string().min(3, 'CVV must be 3-4 digits').max(4, 'CVV must be 3-4 digits'),
  billingAddress: z.string().min(5, 'Billing address is required'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Booking {
  id: string;
  tripId: string | null;
  hotelId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  transportMode: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  amount: string;
  status: string;
  currency: string | null;
  tripTitle?: string;
  tripLocation?: string;
  tripImageUrl?: string;
  hotelName?: string;
  hotelLocation?: string;
  hotelImageUrl?: string;
}

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardHolderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingAddress: '',
      city: '',
      zipCode: '',
      country: '',
    },
  });

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error('Booking ID is required');
      
      let lastError: Error | null = null;
      
      // First try direct booking endpoint (new endpoint)
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('[PaymentPage] Booking loaded from /api/bookings/:id:', result.data);
            return result.data as Booking;
          } else {
            console.warn('[PaymentPage] Booking endpoint returned success=false:', result.message);
            lastError = new Error(result.message || 'Failed to fetch booking');
          }
        } else {
          const errorText = await response.text().catch(() => '');
          console.error(`[PaymentPage] Booking endpoint failed: ${response.status} ${response.statusText}`, errorText);
          lastError = new Error(`Failed to fetch booking: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.error('[PaymentPage] Error fetching from booking endpoint:', error);
        lastError = error instanceof Error ? error : new Error('Network error');
      }
      
      // Fallback: try dashboard endpoint which includes trip/hotel details
      try {
        const dashboardResponse = await fetch('/api/bookings/dashboard', {
          credentials: 'include',
        });
        
        if (dashboardResponse.ok) {
          const dashboardResult = await dashboardResponse.json();
          if (dashboardResult.success && dashboardResult.data) {
            // Search in all booking arrays
            const allBookings = [
              ...(dashboardResult.data.upcoming || []),
              ...(dashboardResult.data.completed || []),
              ...(dashboardResult.data.cancelled || []),
              ...(dashboardResult.data.all || [])
            ];
            const foundBooking = allBookings.find((b: Booking) => b.id === bookingId);
            
            if (foundBooking) {
              console.log('[PaymentPage] Booking found in dashboard data:', foundBooking);
              return foundBooking as Booking;
            } else {
              console.warn(`[PaymentPage] Booking ${bookingId} not found in dashboard data`);
            }
          }
        } else {
          const errorText = await dashboardResponse.text().catch(() => '');
          console.error(`[PaymentPage] Dashboard endpoint failed: ${dashboardResponse.status} ${dashboardResponse.statusText}`, errorText);
        }
      } catch (error: any) {
        console.error('[PaymentPage] Error fetching from dashboard endpoint:', error);
      }
      
      // If both fail, throw the most descriptive error
      throw lastError || new Error('Booking not found. Please ensure you are logged in and the booking exists.');
    },
    enabled: !!bookingId,
    retry: 2, // Retry up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      if (!bookingId) throw new Error('Booking ID is required');
      if (!booking) throw new Error('Booking details not loaded');

      console.log('[PaymentPage] Submitting payment for booking:', bookingId);
      
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...data,
            bookingId,
            amount: parseFloat(booking.amount),
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Payment failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = `Payment failed: ${response.status} ${response.statusText}`;
          }
          
          console.error('[PaymentPage] Payment failed:', errorMessage, response.status);
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[PaymentPage] Payment successful:', result);
        return result;
      } catch (error: any) {
        console.error('[PaymentPage] Payment error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred during payment processing');
      }
    },
    onSuccess: (data) => {
      console.log('[PaymentPage] Payment mutation success, navigating to confirmation');
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed and payment processed.",
      });
      // Navigate to confirmation page
      navigate(`/confirmation/${bookingId}`);
    },
    onError: (error: Error) => {
      console.error('[PaymentPage] Payment mutation error:', error);
      let errorMessage = error.message;
      
      // Provide more helpful error messages
      if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
        errorMessage = 'Authentication required. Please log in and try again.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'You are not authorized to make this payment.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Booking not found. Please check your booking ID.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onPaymentSubmit = (data: PaymentForm) => {
    processPaymentMutation.mutate(data);
  };

  const getTransportIcon = (mode: string | null) => {
    if (!mode) return null;
    switch (mode.toLowerCase()) {
      case 'bus':
        return <Bus className="h-4 w-4" />;
      case 'train':
        return <Train className="h-4 w-4" />;
      case 'flight':
        return <Plane className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTransportCost = (mode: string | null) => {
    if (!mode) return 0;
    switch (mode.toLowerCase()) {
      case 'bus':
        return 50;
      case 'train':
        return 100;
      case 'flight':
        return 300;
      default:
        return 0;
    }
  };

  if (bookingLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (bookingError || (!booking && !bookingLoading)) {
    const errorMessage = bookingError instanceof Error 
      ? bookingError.message 
      : 'The booking you are looking for does not exist or could not be loaded.';
    
    // Check if it's a 404 error (route not found)
    const is404Error = errorMessage.includes('404') || errorMessage.includes('Not Found');
    const isServerError = errorMessage.includes('500') || errorMessage.includes('Internal Server Error');
    
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Unable to Load Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {is404Error 
                  ? "The booking endpoint could not be found. This may indicate the server needs to be restarted."
                  : isServerError
                  ? "The server encountered an error while loading your booking. Please try again."
                  : errorMessage}
              </p>
              
              {is404Error && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <strong>Tip:</strong> If you just made changes to the server code, please restart the server for the changes to take effect.
                </div>
              )}
              
              {bookingError && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <strong>Error Details:</strong> {bookingError.message}
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Retry Loading
                </Button>
                <Button onClick={() => navigate('/trips')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Trips
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="default">
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Booking Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The booking could not be loaded. Please try again or contact support.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="default">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(booking.amount);
  const transportCost = getTransportCost(booking.transportMode);

  return (
    <div className="min-h-screen bg-background py-16">
      <SEOHead 
        title={`Payment - Booking ${bookingId} | ExploreNow`}
        description="Complete your booking payment"
      />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
            <p className="text-muted-foreground">Review your booking and proceed with payment</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Booking Summary - Left Column */}
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.tripTitle && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Trip</div>
                      <div className="font-semibold">{booking.tripTitle}</div>
                      {booking.tripLocation && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {booking.tripLocation}
                        </div>
                      )}
                    </div>
                  )}

                  {booking.hotelName && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Hotel className="h-3 w-3" />
                        Hotel
                      </div>
                      <div className="font-semibold">{booking.hotelName}</div>
                      {booking.hotelLocation && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {booking.hotelLocation}
                        </div>
                      )}
                    </div>
                  )}

                  {booking.transportMode && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Transport</div>
                      <div className="flex items-center gap-2">
                        {getTransportIcon(booking.transportMode)}
                        <span className="capitalize">{booking.transportMode}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <div>Check-in: {booking.checkIn}</div>
                        <div>Check-out: {booking.checkOut}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <PriceDisplay price={totalAmount} originalCurrency={booking.currency || 'USD'} />
                    </div>
                    {transportCost > 0 && (
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Includes transport:</span>
                        <span>${transportCost}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form - Right Column */}
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                    <p className="text-muted-foreground">Your payment is secure and encrypted</p>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                        {/* Card Information */}
                        <div className="space-y-4">
                          <h3 className="font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Card Information
                          </h3>
                          
                          <FormField
                            control={paymentForm.control}
                            name="cardHolderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cardholder Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234 5678 9012 3456" maxLength={19} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={paymentForm.control}
                              name="expiryMonth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Month</FormLabel>
                                  <FormControl>
                                    <Input placeholder="MM" maxLength={2} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="expiryYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year</FormLabel>
                                  <FormControl>
                                    <Input placeholder="YYYY" maxLength={4} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="cvv"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CVV</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" maxLength={4} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Billing Address */}
                        <div className="space-y-4">
                          <h3 className="font-medium">Billing Address</h3>
                          
                          <FormField
                            control={paymentForm.control}
                            name="billingAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main Street" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={paymentForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="New York" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="10001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={paymentForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="United States" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="flex-1"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                          
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={processPaymentMutation.isPending}
                          >
                            {processPaymentMutation.isPending ? (
                              <>
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                                Processing Payment...
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Pay {booking.currency || 'USD'} {totalAmount.toFixed(2)}
                              </>
                            )}
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          This is a demo payment form. No real payment will be processed.
                        </p>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

