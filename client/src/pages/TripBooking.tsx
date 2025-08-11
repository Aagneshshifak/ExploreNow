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
  CheckCircle
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

type BookingForm = z.infer<typeof bookingSchema>;

interface Trip {
  id: number;
  title: string;
  location: string;
  description: string;
  price: number;
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
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const form = useForm<BookingForm>({
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
    queryKey: ['/api/hotels'],
    queryFn: async () => {
      const response = await fetch('/api/hotels', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch hotels');
      const result = await response.json();
      return result.data as Hotel[];
    },
  });

  // Calculate total cost
  const calculateTotalCost = () => {
    const tripCost = trip?.price || 0;
    const hotelCost = selectedHotel ? 
      (hotels?.find(h => h.id === selectedHotel)?.price || 0) * form.watch('guests') : 0;
    const transportCost = {
      bus: 50,
      train: 100,
      flight: 300
    }[form.watch('transportType')] || 0;

    return tripCost + hotelCost + transportCost;
  };

  // Create booking mutation
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
      setBookingId(data.data.id);
      setStep('confirmation');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingForm) => {
    const totalCost = calculateTotalCost();
    createBookingMutation.mutate({
      ...data,
      hotelId: selectedHotel || undefined,
      cost: totalCost,
    });
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
                  <span className="capitalize">{form.getValues('transportType')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{form.getValues('guests')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{new Date(form.getValues('checkIn')).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{new Date(form.getValues('checkOut')).toLocaleDateString()}</span>
                </div>
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
                    <PriceDisplay price={trip.price} originalCurrency="USD" />
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Customer Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </h3>
                      
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                      </div>

                      <FormField
                        control={form.control}
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
                      disabled={createBookingMutation.isPending || !selectedHotel}
                    >
                      {createBookingMutation.isPending ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Creating Booking...
                        </>
                      ) : (
                        'Confirm Booking'
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
      </div>
    </div>
  );
}