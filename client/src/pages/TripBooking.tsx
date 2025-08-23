import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Calendar,
  Users,
  Phone,
  Mail,
  User,
  Plane,
  Train,
  Bus,
  CheckCircle,
  CreditCard,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PriceDisplay } from '@/components/ui/price-display';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEOHead } from '@/components/ui/seo-head';
import { graphqlClient, CREATE_BOOKING_MUTATION } from '@/lib/graphql-client';

const bookingSchema = z.object({
  tripId: z.number().optional(),
  hotelId: z.number().optional(),
  transportType: z.enum(['bus', 'train', 'flight']),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  guests: z.number().min(1, 'At least 1 guest is required').max(10, 'Maximum 10 guests allowed'),
});

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

type BookingForm = z.infer<typeof bookingSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

interface Trip {
  id: number;
  title: string;
  location: string;
  description: string;
  price: string;
  duration: number;
  tags: string[];
  includes: string[];
  imageUrl: string | null;
}

interface Hotel {
  id: number;
  name: string;
  location: string;
  description: string;
  price: number;
  rating: number;
  tags: string[];
  includes: string[];
  amenities: string[];
  imageUrl: string | null;
}

export default function TripBooking() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'booking' | 'payment' | 'confirmation'>('booking');
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [useGraphQL, setUseGraphQL] = useState(false); // Toggle between REST and GraphQL

  const bookingForm = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      tripId: tripId ? parseInt(tripId) : undefined,
      transportType: 'flight',
      guests: 1,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      checkIn: '',
      checkOut: '',
    },
  });

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

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['/api/trips', tripId],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${tripId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trip');
      const result = await response.json();
      return result.data as Trip;
    },
    enabled: !!tripId,
  });

  // Fetch available hotels
  const { data: hotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ['/api/hotels/location', trip?.location],
    queryFn: async () => {
      if (!trip?.location) return [];
      const response = await fetch(`/api/hotels/location/${encodeURIComponent(trip.location)}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch hotels for this location');
      const result = await response.json();
      return result.data as Hotel[];
    },
    enabled: !!trip?.location,
  });

  // Calculate total cost
  const calculateTotalCost = () => {
    const tripCost = trip?.price ? parseFloat(trip.price) : 0;
    const hotelCost = selectedHotel ? 
      (hotels?.find(h => h.id === selectedHotel)?.price || 0) * bookingForm.watch('guests') : 0;
    const transportCost = {
      bus: 50,
      train: 100,
      flight: 300
    }[bookingForm.watch('transportType')] || 0;

    return tripCost + hotelCost + transportCost;
  };

  // Create booking mutation (REST)
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingForm & { cost: number }) => {
      const response = await fetch('/api/bookings/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Booking created successfully:', data);
      setBookingId(data.data.id);
      setStep('payment');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Created! 🎉",
        description: "Please proceed to payment to complete your booking.",
      });
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create booking mutation (GraphQL)
  const createBookingGraphQLMutation = useMutation({
    mutationFn: async (data: BookingForm & { cost: number }) => {
      const bookingInput = {
        tripId: tripId?.toString() || '',
        hotelId: data.hotelId?.toString() || '',
        customerName: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        transport: data.transportType,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        totalCost: data.cost
      };

      const variables = { input: bookingInput };
      const result = await graphqlClient.request(CREATE_BOOKING_MUTATION, variables);

      if (!result.createBooking.success) {
        throw new Error(result.createBooking.message || 'Failed to create booking');
      }

      return {
        success: true,
        data: result.createBooking.booking,
        message: result.createBooking.message
      };
    },
    onSuccess: (data) => {
      console.log('GraphQL Booking created successfully:', data);
      setBookingId(data.data.id);
      setStep('payment');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Created! 🎉",
        description: "Please proceed to payment to complete your booking.",
      });
    },
    onError: (error) => {
      console.error('GraphQL Booking error:', error);
      toast({
        title: "Booking Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          bookingId,
          amount: calculateTotalCost(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentId(data.data.payment.id);
      setStep('confirmation');
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed and payment processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onBookingSubmit = (data: BookingForm) => {
    const totalCost = calculateTotalCost();
    const bookingData = {
      ...data,
      hotelId: selectedHotel || undefined,
      cost: totalCost,
    };
    
    if (useGraphQL) {
      createBookingGraphQLMutation.mutate(bookingData);
    } else {
      createBookingMutation.mutate(bookingData);
    }
  };

  const onPaymentSubmit = (data: PaymentForm) => {
    processPaymentMutation.mutate(data);
  };

  if (tripLoading || hotelsLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Trip Not Found</h1>
            <Button onClick={() => navigate('/trips')}>Browse Trips</Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-background py-16">
        <SEOHead 
          title={`Booking Confirmed - ${trip.title} | ExploreNow`}
          description="Your booking has been confirmed successfully. Get ready for an amazing trip!"
        />
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Your booking for {trip.title} has been successfully confirmed.
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Booking ID:</span>
                  <span className="font-mono">#{bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trip:</span>
                  <span>{trip.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span>{trip.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span className="capitalize">{bookingForm.getValues('transportType')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{bookingForm.getValues('guests')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{new Date(bookingForm.getValues('checkIn')).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{new Date(bookingForm.getValues('checkOut')).toLocaleDateString()}</span>
                </div>
                {paymentId && (
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span className="font-mono text-sm">#{paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Cost:</span>
                  <PriceDisplay price={calculateTotalCost()} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => navigate('/trips')}
              size="lg"
              className="w-full"
            >
              Done
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step indicator component
  const StepIndicator = () => {
    const getStepStatus = (currentStep: string, targetStep: string) => {
      const steps = ['booking', 'payment', 'confirmation'];
      const currentIndex = steps.indexOf(currentStep);
      const targetIndex = steps.indexOf(targetStep);
      
      if (currentIndex > targetIndex) return 'completed';
      if (currentIndex === targetIndex) return 'active';
      return 'pending';
    };

    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${getStepStatus(step, 'booking') === 'completed' || getStepStatus(step, 'booking') === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepStatus(step, 'booking') === 'active' ? 'bg-primary border-primary text-white' : getStepStatus(step, 'booking') === 'completed' ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
              {getStepStatus(step, 'booking') === 'completed' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="hidden sm:block">Booking Details</span>
          </div>
          <div className="w-8 h-0.5 bg-muted-foreground"></div>
          <div className={`flex items-center space-x-2 ${getStepStatus(step, 'payment') === 'completed' || getStepStatus(step, 'payment') === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepStatus(step, 'payment') === 'active' ? 'bg-primary border-primary text-white' : getStepStatus(step, 'payment') === 'completed' ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
              {getStepStatus(step, 'payment') === 'completed' ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="hidden sm:block">Payment</span>
          </div>
          <div className="w-8 h-0.5 bg-muted-foreground"></div>
          <div className={`flex items-center space-x-2 ${getStepStatus(step, 'confirmation') === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepStatus(step, 'confirmation') === 'active' ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
              {getStepStatus(step, 'confirmation') === 'active' ? <CheckCircle className="h-4 w-4" /> : '3'}
            </div>
            <span className="hidden sm:block">Confirmation</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <SEOHead 
        title={`Book ${trip.title} | ExploreNow`}
        description={`Book your trip to ${trip.location}. ${trip.description}`}
      />
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/trips')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Button>

        <StepIndicator />

        {/* Booking Details Step */}
        {step === 'booking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
          {/* Trip Summary */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {trip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trip.imageUrl && (
                    <img
                      src={trip.imageUrl}
                      alt={trip.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {trip.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {trip.duration} days
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <PriceDisplay price={parseFloat(trip.price)} originalCurrency="USD" />
                  </div>
                  <p className="text-sm text-muted-foreground">{trip.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Hotel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotels?.slice(0, 3).map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedHotel === hotel.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedHotel(hotel.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{hotel.name}</h4>
                          <p className="text-sm text-muted-foreground">{hotel.location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm">★</span>
                            <span className="text-sm">{hotel.rating}</span>
                          </div>
                        </div>
                        <PriceDisplay price={hotel.price} originalCurrency="USD" className="text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...bookingForm}>
                  <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-6">
                    {/* Customer Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </h3>
                      
                      <FormField
                        control={bookingForm.control}
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
                        control={bookingForm.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bookingForm.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Travel Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Travel Details</h3>

                      <FormField
                        control={bookingForm.control}
                        name="transportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transport Preference</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="bus" id="bus" />
                                  <Label htmlFor="bus" className="flex items-center gap-2">
                                    <Bus className="h-4 w-4" />
                                    Bus ($50)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="train" id="train" />
                                  <Label htmlFor="train" className="flex items-center gap-2">
                                    <Train className="h-4 w-4" />
                                    Train ($100)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="flight" id="flight" />
                                  <Label htmlFor="flight" className="flex items-center gap-2">
                                    <Plane className="h-4 w-4" />
                                    Flight ($300)
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={bookingForm.control}
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
                          control={bookingForm.control}
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
                      </div>

                      <FormField
                        control={bookingForm.control}
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Guests</FormLabel>
                            <FormControl>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select guests" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num} Guest{num > 1 ? 's' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* API Toggle */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-medium">API Method:</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant={!useGraphQL ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUseGraphQL(false)}
                          >
                            REST
                          </Button>
                          <Button
                            type="button"
                            variant={useGraphQL ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUseGraphQL(true)}
                          >
                            GraphQL
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Cost:</span>
                        <PriceDisplay price={calculateTotalCost()} originalCurrency="USD" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={(createBookingMutation.isPending || createBookingGraphQLMutation.isPending) || !selectedHotel}
                    >
                      {(createBookingMutation.isPending || createBookingGraphQLMutation.isPending) ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Creating Booking via {useGraphQL ? 'GraphQL' : 'REST'}...
                        </>
                      ) : (
                        `Confirm Booking (${useGraphQL ? 'GraphQL' : 'REST'})`
                      )}
                    </Button>

                    {!selectedHotel && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please select a hotel to continue
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
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
                    {/* Payment Summary */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Trip Cost:</span>
                          <PriceDisplay price={trip ? parseFloat(trip.price) : 0} originalCurrency="USD" />
                        </div>
                        {selectedHotel && (
                          <div className="flex justify-between">
                            <span>Hotel Cost:</span>
                            <PriceDisplay price={(hotels?.find(h => h.id === selectedHotel)?.price || 0) * bookingForm.watch('guests')} originalCurrency="USD" />
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Transport:</span>
                          <span>${{
                            bus: 50,
                            train: 100,
                            flight: 300
                          }[bookingForm.watch('transportType')]}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total:</span>
                          <PriceDisplay price={calculateTotalCost()} originalCurrency="USD" />
                        </div>
                      </div>
                    </div>

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
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('booking')}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Booking
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
                            Pay ${calculateTotalCost()}
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
        )}
      </div>
    </div>
  );
}