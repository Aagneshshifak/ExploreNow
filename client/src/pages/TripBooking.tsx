import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, CreditCard, Users, Phone, Mail, Car, CheckCircle, Download } from "lucide-react";
import { bookingFormSchema, type Trip, type Hotel, type BookingFormData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";

interface BookingReceipt {
  id: string;
  bookingNumber: string;
  customerDetails: any;
  item: Trip | Hotel;
  type: 'trip' | 'hotel';
  totalAmount: number;
  bookingDate: string;
  status: string;
}

export default function TripBooking() {
  const [, navigate] = useLocation();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { convertPrice, currency } = useCurrency();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guests: 1,
      transportMode: "flight",
      type: "trip",
      status: "pending",
      amount: "0",
    },
  });

  // Fetch trips and hotels
  const { data: tripsResponse, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const response = await fetch('/api/trips', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      
      const result = await response.json();
      return result;
    },
  });

  const { data: hotelsResponse, isLoading: hotelsLoading, error: hotelsError } = useQuery({
    queryKey: ["/api/hotels"],
    queryFn: async () => {
      const response = await fetch('/api/hotels', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const result = await response.json();
      return result;
    },
  });

  const trips = tripsResponse?.data || [];
  const hotels = hotelsResponse?.data || [];



  // Create booking mutation with detailed API call
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const totalAmount = calculateTotalAmount();
      const selectedItem = selectedTrip || selectedHotel;
      
      const bookingData = {
        [selectedTrip ? 'tripId' : 'hotelId']: selectedItem?.id,
        type: selectedTrip ? 'trip' : 'hotel',
        checkInDate: data.checkIn,
        checkOutDate: data.checkOut,
        guests: data.guests,
        customerDetails: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          specialRequests: data.specialRequests
        },
        amount: totalAmount,
        currency: currency
      };
      
      const response = await fetch('/api/bookings/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Booking failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const selectedItem = selectedTrip || selectedHotel;
      const bookingReceipt: BookingReceipt = {
        id: data.data.id,
        bookingNumber: `EN-${Date.now()}`,
        customerDetails: form.getValues(),
        item: selectedItem!,
        type: selectedTrip ? 'trip' : 'hotel',
        totalAmount: calculateTotalAmount(),
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };
      setReceipt(bookingReceipt);
      setShowPaymentConfirmation(false);
      setShowBookingConfirmation(true);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to process your booking. Please try again.",
        variant: "destructive",
      });
      setShowPaymentConfirmation(false);
    }
  });

  const onSubmit = (data: BookingFormData) => {
    if (!selectedTrip && !selectedHotel) {
      toast({
        title: "Selection Required",
        description: "Please select a trip or hotel to book.",
        variant: "destructive",
      });
      return;
    }

    if (!data.checkIn || !data.checkOut) {
      toast({
        title: "Dates Required",
        description: "Please select check-in and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    // Show payment confirmation modal instead of directly submitting
    setShowPaymentConfirmation(true);
  };

  const handlePaymentConfirmation = () => {
    const formData = form.getValues();
    createBookingMutation.mutate(formData);
  };

  const calculateTotal = () => {
    const basePrice = selectedTrip ? parseFloat(selectedTrip.price) : selectedHotel ? parseFloat(selectedHotel.price) : 0;
    const guests = form.watch("guests") || 1;
    return (basePrice * guests).toFixed(2);
  };

  const calculateTotalAmount = () => {
    const basePrice = selectedTrip ? parseFloat(selectedTrip.price) : selectedHotel ? parseFloat(selectedHotel.price) : 0;
    const guests = form.watch("guests") || 1;
    const totalInUSD = basePrice * guests;
    // Convert to user's selected currency
    return convertPrice(totalInUSD, 'USD');
  };

  const formatTotalPrice = () => {
    const total = calculateTotalAmount();
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
    return `${symbol}${total.toFixed(2)}`;
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

${receipt.type.toUpperCase()} DETAILS:
${receipt.type === 'trip' ? 'Trip' : 'Hotel'}: ${receipt.type === 'trip' ? (receipt.item as Trip).title : (receipt.item as Hotel).name}
Location: ${receipt.item.location}
Check-in: ${new Date(receipt.customerDetails.checkIn).toLocaleDateString()}
Check-out: ${new Date(receipt.customerDetails.checkOut).toLocaleDateString()}
Guests: ${receipt.customerDetails.guests}

PRICING:
Total Amount: ${formatTotalPrice()}

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Book Your Journey
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete your booking with our simple and secure process
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Selection Cards */}
          <div className="space-y-6">
            {/* Trip Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Select a Trip
                </CardTitle>
                <CardDescription>Choose your destination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {tripsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Loading trips...</p>
                    </div>
                  ) : tripsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 dark:text-red-400">Error loading trips</p>
                    </div>
                  ) : !trips || trips.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No trips available</p>
                    </div>
                  ) : trips.map((trip: Trip) => (
                    <div
                      key={trip.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTrip?.id === trip.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedTrip(trip);
                        setSelectedHotel(null);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{trip.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{trip.location}</p>
                          <p className="text-sm text-gray-500 mt-1">{trip.duration} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${trip.price}</p>
                          <p className="text-xs text-gray-500">per person</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Or Select a Hotel
                </CardTitle>
                <CardDescription>Book accommodation only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {hotelsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Loading hotels...</p>
                    </div>
                  ) : hotelsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 dark:text-red-400">Error loading hotels</p>
                    </div>
                  ) : !hotels || hotels.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No hotels available</p>
                    </div>
                  ) : hotels.map((hotel: Hotel) => (
                      <div
                        key={hotel.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedHotel?.id === hotel.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setSelectedTrip(null);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{hotel.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{hotel.location}</p>
                            <p className="text-sm text-gray-500 mt-1">Rating: {hotel.rating}/5</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${hotel.price}</p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
              <CardDescription>Fill in your information to complete the booking</CardDescription>
              
              {/* Selection Status */}
              {(selectedTrip || selectedHotel) ? (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {selectedTrip ? `Trip Selected: ${selectedTrip.title}` : `Hotel Selected: ${selectedHotel?.name}`}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Location: {selectedTrip ? selectedTrip.location : selectedHotel?.location}
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Please select a trip or hotel first</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Choose from the options on the left to proceed with booking
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Customer Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                            <Input type="email" placeholder="john@example.com" {...field} />
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
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dates and Guests */}
                  <div className="grid md:grid-cols-3 gap-4">
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
                          <FormLabel>Guests</FormLabel>
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

                  {/* Transport Preferences */}
                  <FormField
                    control={form.control}
                    name="transportMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transport Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transport mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flight">Flight</SelectItem>
                            <SelectItem value="bus">Bus</SelectItem>
                            <SelectItem value="train">Train</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Emergency Contact */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact" {...field} />
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
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Special Requests */}
                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special requirements or requests..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total Cost Display */}
                  {(selectedTrip || selectedHotel) && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>Base Price:</span>
                        <span>${selectedTrip ? selectedTrip.price : selectedHotel?.price}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Guests:</span>
                        <span>{form.watch("guests") || 1}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatTotalPrice()}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Now Button */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CreditCard className="h-4 w-4" />
                      <span>Secure payment processing (Demo mode)</span>
                    </div>

                    {/* Selection Required Message */}
                    {(!selectedTrip && !selectedHotel) && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-medium">Selection Required</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Please select a trip or hotel above to enable booking
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createBookingMutation.isPending || (!selectedTrip && !selectedHotel)}
                    >
                      {createBookingMutation.isPending 
                        ? "Processing..." 
                        : (!selectedTrip && !selectedHotel)
                          ? "Select Trip or Hotel to Continue"
                          : `Book Now - ${formatTotalPrice()}`
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">Confirm Payment</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Item:</span>
                <span className="font-medium">
                  {selectedTrip ? selectedTrip.title : selectedHotel?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span>{selectedTrip ? selectedTrip.location : selectedHotel?.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span>{form.getValues('checkIn')}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span>{form.getValues('checkOut')}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span>{form.getValues('guests')}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Total Amount:</span>
                <span>{formatTotalPrice()}</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Secure Payment Processing</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Your payment will be processed securely. All booking details will be stored in our database.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentConfirmation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePaymentConfirmation}
                disabled={createBookingMutation.isPending}
                className="flex-1"
              >
                {createBookingMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Booking Confirmation Receipt */}
      {showBookingConfirmation && receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your reservation has been successfully processed
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-3">Booking Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Booking Number:</span>
                  <span className="font-mono">{receipt.bookingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>{receipt.type === 'trip' ? 'Trip' : 'Hotel'}:</span>
                  <span className="font-medium">{receipt.type === 'trip' ? (receipt.item as Trip).title : (receipt.item as Hotel).name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span>{receipt.item.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{new Date(receipt.customerDetails.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{new Date(receipt.customerDetails.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{receipt.customerDetails.guests}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total Paid:</span>
                  <span>{formatTotalPrice()}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2">What's Next?</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• A confirmation email has been sent to {receipt.customerDetails.customerEmail}</li>
                <li>• Your booking details are saved in your dashboard</li>
                <li>• Download your receipt for your records</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={downloadReceipt}
                className="flex-1 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
              <Button
                onClick={() => {
                  setShowBookingConfirmation(false);
                  navigate('/dashboard');
                }}
                className="flex-1"
              >
                View Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}