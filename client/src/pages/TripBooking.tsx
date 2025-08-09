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
import { Calendar, MapPin, CreditCard, Users, Phone, Mail, Car } from "lucide-react";
import { bookingFormSchema, type Trip, type Hotel, type BookingFormData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TripBooking() {
  const [, navigate] = useLocation();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const { data: trips } = useQuery({
    queryKey: ["/api/trips"],
  });

  const { data: hotels } = useQuery({
    queryKey: ["/api/hotels"],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: BookingFormData) => apiRequest("/api/bookings", "POST", data),
    onSuccess: () => {
      toast({
        title: "Booking Successful!",
        description: "Your booking has been confirmed. Check your email for details.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error processing your booking.",
        variant: "destructive",
      });
    },
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

    const bookingData = {
      ...data,
      tripId: selectedTrip?.id || null,
      hotelId: selectedHotel?.id || null,
      type: selectedTrip ? "trip" : "hotel",
      amount: selectedTrip ? selectedTrip.price : selectedHotel?.price || "0",
    };

    createBookingMutation.mutate(bookingData);
  };

  const calculateTotal = () => {
    const basePrice = selectedTrip ? parseFloat(selectedTrip.price) : selectedHotel ? parseFloat(selectedHotel.price) : 0;
    const guests = form.watch("guests") || 1;
    return (basePrice * guests).toFixed(2);
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
                  {Array.isArray(trips) && trips.map((trip: Trip) => (
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
                  {Array.isArray(hotels) && hotels.map((hotel: Hotel) => (
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
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Now Button */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CreditCard className="h-4 w-4" />
                      <span>Secure payment processing (Demo mode)</span>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createBookingMutation.isPending || (!selectedTrip && !selectedHotel)}
                    >
                      {createBookingMutation.isPending ? "Processing..." : `Book Now - $${calculateTotal()}`}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}