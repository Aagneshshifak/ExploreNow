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
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const tripId = parseInt(params.id || '0');
  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Form setup with validation
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      specialRequests: '',
      emergencyContact: '',
      emergencyPhone: '',
      transportMode: 'flight',
      userId: user?.id || 0,
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
    }
  });

  // Set the price when trip data is loaded
  useEffect(() => {
    if (trip) {
      form.setValue('amount', trip.price);
    }
  }, [trip, form]);

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
        item: trip,
        type: 'trip',
        totalAmount: calculateTotal(),
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };
      setReceipt(bookingReceipt);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      toast({
        title: "✅ Booking Successful!",
        description: `Your trip has been booked. Booking ID: ${bookingReceipt.bookingNumber}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to process your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const calculateTotal = () => {
    if (!trip) return 0;
    const nights = calculateNights();
    const basePrice = parseFloat(trip.price);
    const guests = form.getValues('guests') || 1;
    return Math.round((basePrice * nights * guests) * 100) / 100;
  };

  const calculateNights = () => {
    const checkIn = form.getValues('checkIn');
    const checkOut = form.getValues('checkOut');
    
    if (!checkIn || !checkOut) return trip?.duration || 1;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const validateStep1 = () => {
    const values = form.getValues();
    return values.customerName && 
           values.customerEmail && 
           values.customerPhone && 
           values.checkIn && 
           values.checkOut &&
           values.emergencyContact &&
           values.emergencyPhone;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      form.trigger(['customerName', 'customerEmail', 'customerPhone', 'checkIn', 'checkOut', 'emergencyContact', 'emergencyPhone']);
      return;
    }
    setStep(step + 1);
  };

  const handleBookingSubmit = () => {
    setIsConfirmationOpen(true);
  };

  const confirmBooking = () => {
    setIsConfirmationOpen(false);
    createBooking.mutate(form.getValues());
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

TRIP DETAILS:
Trip: ${receipt.item.title}
Location: ${receipt.item.location}
Check-in: ${new Date(receipt.customerDetails.checkIn).toLocaleDateString()}
Check-out: ${new Date(receipt.customerDetails.checkOut).toLocaleDateString()}
Guests: ${receipt.customerDetails.guests}
Duration: ${calculateNights()} days

TRANSPORT:
Mode: ${receipt.customerDetails.transportMode || 'Not specified'}

PRICING:
Base Price: $${receipt.item.price}
Duration: ${calculateNights()} days
Guests: ${receipt.customerDetails.guests}
Total Amount: $${receipt.totalAmount}

Special Requests: ${receipt.customerDetails.specialRequests || 'None'}

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Trip Not Found</h1>
          <Button onClick={() => navigate('/trips')}>Browse Trips</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Book {trip.title} - ExploreNow</title>
        <meta name="description" content={`Book your trip to ${trip.location}. ${trip.description}`} />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/trips')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trips
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Book Your Trip</h1>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNum 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {stepNum}
                    </div>
                    {stepNum < 3 && <div className="w-8 h-0.5 bg-muted mx-2" />}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {step === 1 && "Personal Details"}
                {step === 2 && "Review & Payment"}
                {step === 3 && "Confirmation"}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Form {...form}>
                <form className="space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {/* Personal Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <User className="mr-2 h-5 w-5" />
                              Personal Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John Doe" {...field} />
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
                                    <FormLabel>Phone Number *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 (555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="customerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>

                        {/* Travel Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Calendar className="mr-2 h-5 w-5" />
                              Travel Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="checkIn"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Check-in Date *</FormLabel>
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
                                    <FormLabel>Check-out Date *</FormLabel>
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
                                    <FormLabel>Number of Travelers *</FormLabel>
                                    <Select 
                                      value={field.value?.toString()} 
                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select guests" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {[1,2,3,4,5,6,7,8].map(num => (
                                          <SelectItem key={num} value={num.toString()}>
                                            {num} {num === 1 ? 'Person' : 'People'}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Transport Preferences */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Plane className="mr-2 h-5 w-5" />
                              Transportation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FormField
                              control={form.control}
                              name="transportMode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred Transport Mode</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select transport" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {transportOptions.map(option => {
                                        const Icon = option.icon;
                                        return (
                                          <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center">
                                              <Icon className="mr-2 h-4 w-4" />
                                              {option.label}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>

                        {/* Emergency Contact */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Heart className="mr-2 h-5 w-5" />
                              Emergency Contact
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="emergencyContact"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Jane Doe" {...field} />
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
                                    <FormLabel>Emergency Contact Phone *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 (555) 987-6543" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Special Requests */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Info className="mr-2 h-5 w-5" />
                              Special Requests
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FormField
                              control={form.control}
                              name="specialRequests"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Special Requests (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Any special accommodations, dietary requirements, accessibility needs, etc."
                                      className="min-h-[100px]"
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
                          <Button 
                            onClick={handleNext}
                            size="lg"
                            className="min-w-[120px]"
                          >
                            Continue to Review
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
                        className="space-y-6"
                      >
                        {/* Review Booking Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Review Your Booking</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Customer Name</Label>
                                <p className="font-medium">{form.getValues('customerName')}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{form.getValues('customerEmail')}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Phone</Label>
                                <p className="font-medium">{form.getValues('customerPhone')}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Travelers</Label>
                                <p className="font-medium">{form.getValues('guests')} people</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Check-in</Label>
                                <p className="font-medium">{new Date(form.getValues('checkIn')).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Check-out</Label>
                                <p className="font-medium">{new Date(form.getValues('checkOut')).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <CreditCard className="mr-2 h-5 w-5" />
                              Payment Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">This is a demo booking system</span>
                                <Badge variant="outline">Demo Mode</Badge>
                              </div>
                              <p className="text-sm">No actual payment will be processed. Click "Book Now" to simulate a successful booking.</p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label>Cardholder Name</Label>
                                <Input placeholder="John Doe" disabled value="Demo User" />
                              </div>
                              <div>
                                <Label>Card Number</Label>
                                <Input placeholder="**** **** **** 1234" disabled value="**** **** **** 1234" />
                              </div>
                              <div>
                                <Label>Expiry Date</Label>
                                <Input placeholder="MM/YY" disabled value="12/25" />
                              </div>
                              <div>
                                <Label>CVV</Label>
                                <div className="flex">
                                  <Input 
                                    placeholder="***" 
                                    type={showPaymentDetails ? "text" : "password"} 
                                    disabled 
                                    value="123" 
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                                    className="ml-2"
                                  >
                                    {showPaymentDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            onClick={() => setStep(1)}
                            size="lg"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          
                          <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="lg"
                                className="min-w-[120px]"
                                disabled={createBooking.isPending}
                              >
                                {createBooking.isPending ? "Processing..." : "Book Now"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                                  Confirm Your Booking
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Are you sure you want to proceed with this booking?</p>
                                <div className="bg-muted p-4 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Amount:</span>
                                    <span className="font-bold text-lg">
                                      <PriceDisplay price={calculateTotal()} />
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-3">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setIsConfirmationOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={confirmBooking}
                                    disabled={createBooking.isPending}
                                    className="flex-1"
                                  >
                                    {createBooking.isPending ? "Processing..." : "Confirm Booking"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && receipt && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                      >
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        
                        <div>
                          <h2 className="text-3xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
                          <p className="text-muted-foreground">
                            Your trip booking has been successfully processed.
                          </p>
                        </div>

                        <Card className="text-left">
                          <CardHeader>
                            <CardTitle>Booking Receipt</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Booking Number</Label>
                                <p className="font-bold text-lg">{receipt.bookingNumber}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Booking Date</Label>
                                <p className="font-medium">{new Date(receipt.bookingDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Trip</Label>
                                <p className="font-medium">{receipt.item.title}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Location</Label>
                                <p className="font-medium">{receipt.item.location}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Duration</Label>
                                <p className="font-medium">{calculateNights()} days</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Total Amount</Label>
                                <p className="font-bold text-lg">
                                  <PriceDisplay price={receipt.totalAmount} />
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={downloadReceipt} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                          </Button>
                          <Button onClick={() => navigate('/dashboard/bookings')}>
                            View My Bookings
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/trips')}>
                            Browse More Trips
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Form>
            </div>

            {/* Trip Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trip.imageUrl && (
                    <img 
                      src={trip.imageUrl} 
                      alt={trip.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div>
                    <h3 className="font-bold text-lg">{trip.title}</h3>
                    <p className="text-muted-foreground flex items-center mt-1">
                      <MapPin className="mr-1 h-4 w-4" />
                      {trip.location}
                    </p>
                  </div>

                  {trip.description && (
                    <p className="text-sm text-muted-foreground">{trip.description}</p>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <PriceDisplay price={trip.price} />
                    </div>
                    
                    {step >= 1 && form.getValues('checkIn') && form.getValues('checkOut') && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{calculateNights()} days</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Travelers:</span>
                          <span>{form.getValues('guests')} people</span>
                        </div>
                      </>
                    )}

                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <PriceDisplay price={calculateTotal()} />
                    </div>
                  </div>

                  {trip.includes && trip.includes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">What's Included:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {trip.includes.map((item: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}