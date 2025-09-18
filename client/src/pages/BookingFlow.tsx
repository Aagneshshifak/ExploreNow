import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Users, 
  MapPin, 
  Clock,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PriceDisplay } from '@/components/ui/price-display';
import { useCurrency } from '@/contexts/CurrencyContext';
import { graphqlClient } from '@/lib/graphql-client';
// import { apiRequest } from '@/lib/queryClient';

interface BookingDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  specialRequests?: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface BookingReceipt {
  id: string;
  bookingNumber: string;
  customerDetails: BookingDetails;
  item: any;
  type: 'trip' | 'hotel';
  totalAmount: number;
  bookingDate: string;
  status: string;
}

const CREATE_BOOKING_MUTATION = `
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      success
      message
      booking {
        id
        tripId
        hotelId
        customerName
        customerEmail
        customerPhone
        transportMode
        checkIn
        checkOut
        guests
        amount
        status
        currency
      }
    }
  }
`;

export default function BookingFlow() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { convertPrice, currency, exchangeRates, loading } = useCurrency();
  
  const searchParams = new URLSearchParams(location.search || '');
  const itemType = searchParams.get('type') as 'trip' | 'hotel';
  const itemId = parseInt(params.id || '0');

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  const [step, setStep] = useState(1);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  // Fetch item details (trip or hotel)
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: [`/api/${itemType}s`, itemId],
    queryFn: async () => {
      const response = await fetch(`/api/${itemType}s`);
      const result = await response.json();
      return result.data.find((item: any) => item.id === itemId);
    }
  });

  // Create booking mutation (GraphQL)
  const createBooking = useMutation({
    mutationFn: async (data: BookingDetails) => {
      const totalAmount = calculateTotal();
      
      // Prepare booking input for GraphQL
      const bookingInput = {
        tripId: itemType === 'trip' ? itemId.toString() : '',
        hotelId: itemType === 'hotel' ? itemId.toString() : '',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        transportMode: 'flight', // Default transport mode
        checkIn: data.checkInDate,
        checkOut: data.checkOutDate,
        guests: data.guests,
        amount: totalAmount,
        currency: 'USD'
      };

      try {
        const variables = { input: bookingInput };
        const result = await graphqlClient.request(CREATE_BOOKING_MUTATION, variables);

        if (!result.createBooking || !result.createBooking.success) {
          throw new Error(result.createBooking?.message || 'Failed to create booking');
        }

        return {
          success: true,
          data: result.createBooking.booking,
          message: result.createBooking.message
        };
      } catch (error) {
        console.error('GraphQL mutation error:', error);
        if (error instanceof Error) {
          throw new Error(`GraphQL booking failed: ${error.message}`);
        }
        throw new Error('GraphQL booking failed: Unknown error');
      }
    },
    onSuccess: (data) => {
      const bookingReceipt: BookingReceipt = {
        id: data.data.id,
        bookingNumber: `EN-${Date.now()}`,
        customerDetails: bookingDetails,
        item,
        type: itemType,
        totalAmount: calculateTotal(),
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };
      setReceipt(bookingReceipt);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Created Successfully! 🎉",
        description: data.message || "Your booking has been confirmed.",
      });
    },
    onError: (error: Error) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to process your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const calculateTotal = () => {
    if (!item) return 0;
    const nights = calculateNights();
    const basePrice = parseFloat(item.price);
    const guestMultiplier = itemType === 'hotel' ? bookingDetails.guests : 1;
    const totalInUSD = basePrice * nights * guestMultiplier;
    // Convert to user's selected currency
    return convertPrice(totalInUSD, 'USD');
  };

  const formatTotalPrice = () => {
    const total = calculateTotal();
    const currencyData = [
      { code: 'USD', symbol: '$' },
      { code: 'EUR', symbol: '€' },
      { code: 'GBP', symbol: '£' },
      { code: 'INR', symbol: '₹' },
      { code: 'JPY', symbol: '¥' },
      { code: 'CAD', symbol: 'C$' },
      { code: 'AUD', symbol: 'A$' },
      { code: 'CHF', symbol: 'CHF' },
      { code: 'CNY', symbol: '¥' },
      { code: 'KRW', symbol: '₩' },
    ].find(c => c.code === currency);
    
    const symbol = currencyData?.symbol || currency;
    
    // Debug log
    console.log('Currency conversion debug:', {
      currency,
      exchangeRates,
      total,
      item: item?.price,
      loading
    });
    
    if (currency === 'JPY' || currency === 'KRW') {
      return `${symbol}${Math.round(total).toLocaleString()}`;
    } else {
      return `${symbol}${total.toFixed(2)}`;
    }
  };

  const calculateNights = () => {
    if (!bookingDetails.checkInDate || !bookingDetails.checkOutDate) return 1;
    const checkIn = new Date(bookingDetails.checkInDate);
    const checkOut = new Date(bookingDetails.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleInputChange = (field: keyof BookingDetails, value: string | number) => {
    setBookingDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    return bookingDetails.customerName && 
           bookingDetails.customerEmail && 
           bookingDetails.customerPhone && 
           bookingDetails.checkInDate && 
           bookingDetails.checkOutDate &&
           bookingDetails.emergencyContact &&
           bookingDetails.emergencyPhone;
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    
    const receiptContent = `
EXPLORENOW BOOKING RECEIPT
=========================
Booking Number: ${receipt.bookingNumber}
Date: ${new Date(receipt.bookingDate).toLocaleDateString()}

CUSTOMER DETAILS:
Name: ${receipt.customerDetails.customerName}
Email: ${receipt.customerDetails.customerEmail}
Phone: ${receipt.customerDetails.customerPhone}

${itemType.toUpperCase()} DETAILS:
${itemType === 'trip' ? 'Trip' : 'Hotel'}: ${receipt.item.title || receipt.item.name}
Location: ${receipt.item.location}
Check-in: ${new Date(receipt.customerDetails.checkInDate).toLocaleDateString()}
Check-out: ${new Date(receipt.customerDetails.checkOutDate).toLocaleDateString()}
Guests: ${receipt.customerDetails.guests}
Nights: ${calculateNights()}

PRICING:
Base Price: ${currency}${convertPrice(receipt.item.price, 'USD').toFixed(2)}
Nights: ${calculateNights()}
Guests: ${receipt.customerDetails.guests}
Total Amount: ${currency}${receipt.totalAmount.toFixed(2)}

Status: ${receipt.status.toUpperCase()}

Thank you for booking with ExploreNow!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExploreNow-Receipt-${receipt.bookingNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <Helmet>
        <title>Book {item.title || item.name} - ExploreNow</title>
        <meta name="description" content={`Complete your booking for ${item.title || item.name} with secure payment and instant confirmation.`} />
      </Helmet>
      
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {step === 3 ? 'Booking Confirmation' : 'Complete Your Booking'}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 && 'Enter your details and travel dates'}
              {step === 2 && 'Review your booking details'}
              {step === 3 && 'Your booking has been confirmed'}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > num ? <CheckCircle className="h-4 w-4" /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > num ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Confirmation Modal */}
        {showPaymentConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Payment Confirmation</h3>
                <p className="text-muted-foreground">
                  Confirm your booking for {item?.title || item?.name}
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Trip:</span>
                    <span>{item?.title || item?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Guests:</span>
                    <span>{bookingDetails.guests}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Nights:</span>
                    <span>{calculateNights()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Amount:</span>
                    <span>{formatTotalPrice()}</span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  This is a demo booking. No actual payment will be processed.
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="flex-1"
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowPaymentConfirmation(false);
                    createBooking.mutate(bookingDetails);
                  }}
                  disabled={createBooking.isPending}
                  className="flex-1"
                  data-testid="button-confirm-payment"
                >
                  {createBooking.isPending ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                          id="customerName"
                          value={bookingDetails.customerName}
                          onChange={(e) => handleInputChange('customerName', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerEmail">Email Address *</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={bookingDetails.customerEmail}
                          onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Phone Number *</Label>
                        <Input
                          id="customerPhone"
                          value={bookingDetails.customerPhone}
                          onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guests">Number of Guests *</Label>
                        <Select
                          value={bookingDetails.guests.toString()}
                          onValueChange={(value) => handleInputChange('guests', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Guest' : 'Guests'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Travel Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="checkInDate">Check-in Date *</Label>
                        <Input
                          id="checkInDate"
                          type="date"
                          value={bookingDetails.checkInDate}
                          onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkOutDate">Check-out Date *</Label>
                        <Input
                          id="checkOutDate"
                          type="date"
                          value={bookingDetails.checkOutDate}
                          onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                          min={bookingDetails.checkInDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContact"
                          value={bookingDetails.emergencyContact}
                          onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                          placeholder="Emergency contact full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                        <Input
                          id="emergencyPhone"
                          value={bookingDetails.emergencyPhone}
                          onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                          placeholder="Emergency contact phone"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        value={bookingDetails.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        placeholder="Any special requests or requirements..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!validateStep1()}
                    size="lg"
                  >
                    Continue to Review
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Booking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Personal Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {bookingDetails.customerName}</p>
                          <p><strong>Email:</strong> {bookingDetails.customerEmail}</p>
                          <p><strong>Phone:</strong> {bookingDetails.customerPhone}</p>
                          <p><strong>Guests:</strong> {bookingDetails.guests}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Travel Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Check-in:</strong> {new Date(bookingDetails.checkInDate).toLocaleDateString()}</p>
                          <p><strong>Check-out:</strong> {new Date(bookingDetails.checkOutDate).toLocaleDateString()}</p>
                          <p><strong>Duration:</strong> {calculateNights()} nights</p>
                          <p><strong>Emergency Contact:</strong> {bookingDetails.emergencyContact}</p>
                        </div>
                      </div>
                    </div>
                    {bookingDetails.specialRequests && (
                      <div>
                        <h4 className="font-medium mb-2">Special Requests</h4>
                        <p className="text-sm">{bookingDetails.specialRequests}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back to Details
                  </Button>
                  <Button
                    onClick={() => setShowPaymentConfirmation(true)}
                    disabled={createBooking.isPending}
                    size="lg"
                    data-testid="button-confirm-booking"
                  >
                    {createBooking.isPending ? 'Processing...' : 'Book Now'}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && receipt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                    <p className="text-muted-foreground">Your booking has been successfully processed</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Booking Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Booking Number:</strong> {receipt.bookingNumber}</p>
                          <p><strong>Date:</strong> {new Date(receipt.bookingDate).toLocaleDateString()}</p>
                          <p><strong>Status:</strong> <Badge variant="default">Confirmed</Badge></p>
                        </div>
                        <div>
                          <p><strong>Total Amount:</strong> {formatTotalPrice()}</p>
                          <p><strong>Nights:</strong> {calculateNights()}</p>
                          <p><strong>Guests:</strong> {receipt.customerDetails.guests}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={downloadReceipt} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                        View My Bookings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Item Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">
                  {itemType === 'trip' ? 'Trip' : 'Hotel'} Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title || item.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                
                <div>
                  <h3 className="font-medium">{item.title || item.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {item.location}
                  </div>
                  {itemType === 'trip' && item.duration && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {item.duration} days
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Price:</span>
                    <span>
                      <PriceDisplay price={item.price} originalCurrency="USD" />
                      /{itemType === 'trip' ? 'person' : 'night'}
                    </span>
                  </div>
                  {bookingDetails.checkInDate && bookingDetails.checkOutDate && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Nights:</span>
                        <span>{calculateNights()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Guests:</span>
                        <span>{bookingDetails.guests}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatTotalPrice()}</span>
                      </div>
                    </>
                  )}
                </div>

                {item.includes && item.includes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Includes:</h4>
                    <ul className="text-sm space-y-1">
                      {item.includes.slice(0, 3).map((include: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                          {include}
                        </li>
                      ))}
                      {item.includes.length > 3 && (
                        <li className="text-muted-foreground">
                          +{item.includes.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}