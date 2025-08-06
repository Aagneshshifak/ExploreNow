import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  Plane,
  Bus,
  Train,
  Car,
  Info,
  Heart,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PriceDisplay } from '@/components/ui/price-display';
import { bookingFormSchema, type BookingFormData, type Trip, type Hotel } from '@shared/schema';

interface BookingReceipt {
  id: string;
  bookingNumber: string;
  customerDetails: BookingFormData;
  item: Trip;
  type: 'trip';
  totalAmount: number;
  bookingDate: string;
  status: string;
}

const transportOptions = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'car', label: 'Car/Taxi', icon: Car },
  { value: 'other', label: 'Other', icon: MapPin },
];

export default function TripBooking() {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const tripId = parseInt(params.id || '0');
  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form setup with validation
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      specialRequests: '',
      emergencyContact: '',
      emergencyPhone: '',
      transportMode: 'flight',
      userId: 0,
      type: 'trip',
      tripId: tripId,
      amount: '0',
    },
  });

  // Fetch trip details
  const { data: trip, isLoading } = useQuery({
    queryKey: ['/api/trips', tripId],
    queryFn: async () => {
      const response = await fetch('/api/trips');
      const result = await response.json();
      return result.data.find((item: Trip) => item.id === tripId);
    },
    enabled: !authLoading
  });

  // Calculate total with service fee
  const calculateTotal = () => {
    if (!trip) return 0;
    const basePrice = trip.price;
    const serviceFee = basePrice * 0.05; // 5% service fee
    return Math.round((basePrice + serviceFee) * 100) / 100;
  };

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: calculateTotal(),
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create booking');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const bookingReceipt: BookingReceipt = {
        id: data.data.id,
        bookingNumber: `TRV-${Date.now()}`,
        customerDetails: form.getValues(),
        item: trip!,
        type: 'trip',
        totalAmount: calculateTotal(),
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };
      
      setReceipt(bookingReceipt);
      setStep(3);
      setIsConfirmationOpen(true);
      toast({
        title: "Booking Confirmed!",
        description: "Your trip has been successfully booked.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
            form.setValue('customerName', data.data.name || '');
            form.setValue('customerEmail', data.data.email || '');
            form.setValue('userId', data.data.id || 0);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [form]);

  // Set the price when trip data is loaded
  useEffect(() => {
    if (trip) {
      form.setValue('amount', trip.price);
    }
  }, [trip, form]);

  // Handle form submission
  const onSubmit = (data: BookingFormData) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      createBooking.mutate(data);
    }
  };

  // Download receipt
  const downloadReceipt = () => {
    if (!receipt) return;
    
    const receiptContent = `
BOOKING RECEIPT
===============

Booking Number: ${receipt.bookingNumber}
Date: ${new Date(receipt.bookingDate).toLocaleDateString()}

CUSTOMER DETAILS
---------------
Name: ${receipt.customerDetails.customerName}
Email: ${receipt.customerDetails.customerEmail}
Phone: ${receipt.customerDetails.customerPhone}

TRIP DETAILS
-----------
Trip: ${receipt.item.title}
Location: ${receipt.item.location}
Duration: ${receipt.item.duration} days
Check-in: ${receipt.customerDetails.checkIn}
Check-out: ${receipt.customerDetails.checkOut}
Guests: ${receipt.customerDetails.guests}

PAYMENT SUMMARY
--------------
Trip Price: $${receipt.item.price.toString()}
Service Fee (5%): $${(Number(receipt.item.price) * 0.05).toFixed(2)}
Total Amount: $${receipt.totalAmount}

Status: ${receipt.status.toUpperCase()}

Thank you for booking with ExploreNow!
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-receipt-${receipt.bookingNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Trip Not Found</h1>
          <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/trips')}>Back to Trips</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Book {trip.title} - ExploreNow</title>
        <meta name="description" content={`Book your trip to ${trip.location}. Complete your booking in 3 easy steps with secure payment.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/trips')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Book Your Trip</h1>
            <p className="text-muted-foreground">Complete your booking in 3 easy steps</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${step >= stepNumber 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                    }
                  `}>
                    {step > stepNumber ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-px mx-2 ${step > stepNumber ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-8 mt-2">
              <span className={`text-sm ${step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Personal Details
              </span>
              <span className={`text-sm ${step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Review & Payment
              </span>
              <span className={`text-sm ${step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Confirmation
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Personal Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customerEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="checkIn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-in Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="checkOut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-out Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="guests"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Guests</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="transportMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Transportation</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select transportation mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {transportOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center space-x-2">
                                        <option.icon className="h-4 w-4" />
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Emergency contact full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact Phone</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="Emergency contact phone" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Requests (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special dietary requirements, accessibility needs, or other requests..."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button type="submit" size="lg">
                        Continue to Review
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Trip Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <span>Trip Details</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{trip.title}</h3>
                            <p className="text-muted-foreground">{trip.location}</p>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{trip.duration} days</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{form.watch('guests')} guests</span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">{trip.description}</p>

                          {trip.includes && trip.includes.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Includes:</h4>
                              <ul className="text-sm space-y-1">
                                {trip.includes.map((item: string, index: number) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Booking Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5" />
                            <span>Booking Summary</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Trip Price</span>
                              <PriceDisplay price={trip.price} originalCurrency="USD" />
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Service Fee (5%)</span>
                              <PriceDisplay price={trip.price * 0.05} originalCurrency="USD" />
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                              <span>Total</span>
                              <PriceDisplay price={calculateTotal()} originalCurrency="USD" />
                            </div>
                          </div>

                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">Payment Information</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              This is a demo booking system. No actual payment will be processed.
                              Your booking will be confirmed immediately upon submission.
                            </p>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span>{form.watch('customerName')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span>{form.watch('customerEmail')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-in:</span>
                              <span>{form.watch('checkIn')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-out:</span>
                              <span>{form.watch('checkOut')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Details
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={createBooking.isPending}
                      >
                        {createBooking.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Confirm Booking
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>

          {/* Confirmation Modal */}
          <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span>Booking Confirmed!</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {receipt?.bookingNumber}
                  </div>
                  <p className="text-muted-foreground">
                    Your booking has been confirmed. A confirmation email has been sent to your email address.
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button onClick={downloadReceipt} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="w-full"
                  >
                    View My Bookings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}