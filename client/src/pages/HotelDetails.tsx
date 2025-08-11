import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Calendar,
  Check,
  CreditCard,
  Phone,
  User,
  CalendarDays,
  Clock,
  DollarSign,
  Bed
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface Hotel {
  id: number;
  name: string;
  location: string;
  description: string;
  price: string;
  imageUrl: string;
  rating: string;
  tags: string[];
  amenities: string[];
  includes: string[];
  createdAt: string;
}

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple state variables
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [specialRequests, setSpecialRequests] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const hotelId = parseInt(id || '0');

  // Fetch hotel details
  const { data: hotelsResponse, isLoading } = useQuery({
    queryKey: ['/api/hotels'],
    queryFn: async () => {
      const response = await fetch('/api/hotels', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      return response.json();
    },
  });

  const hotels = hotelsResponse?.data || [];
  const hotel = hotels.find((h: Hotel) => h.id === hotelId);

  // Available room types
  const roomTypes = [
    {
      id: 'standard',
      name: "Standard Room",
      size: "25 m²",
      capacity: "2 guests",
      beds: "1 Queen bed",
      price: hotel?.price || "0",
      features: ["Free WiFi", "Air conditioning", "Private bathroom", "TV"],
      description: "Comfortable room with essential amenities.",
      available: 5
    },
    {
      id: 'deluxe',
      name: "Deluxe Room",
      size: "35 m²",
      capacity: "3 guests",
      beds: "1 King bed + sofa",
      price: hotel ? (parseFloat(hotel.price) * 1.3).toFixed(0) : "0",
      features: ["Free WiFi", "Air conditioning", "Mini bar", "City view", "Room service"],
      description: "Spacious room with premium amenities and city view.",
      available: 3
    },
    {
      id: 'suite',
      name: "Executive Suite",
      size: "55 m²",
      capacity: "4 guests",
      beds: "1 King bed + living area",
      price: hotel ? (parseFloat(hotel.price) * 2).toFixed(0) : "0",
      features: ["Free WiFi", "Living area", "Kitchenette", "Balcony", "Premium service"],
      description: "Luxury suite with separate living area and premium services.",
      available: 2
    }
  ];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('/api/bookings', 'POST', bookingData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful!",
        description: "Your hotel booking has been confirmed. You will receive a confirmation email shortly.",
      });
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalPrice = () => {
    const selectedRoom = roomTypes.find(room => room.id === roomType);
    const nights = calculateNights();
    if (!selectedRoom || !nights) return 0;
    return parseFloat(selectedRoom.price) * nights;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to complete your booking.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!customerName || !customerEmail || !checkIn || !checkOut) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedRoom = roomTypes.find(room => room.id === roomType);
    const nights = calculateNights();
    const totalPrice = calculateTotalPrice();

    const bookingData = {
      hotelId: hotel.id,
      type: 'hotel',
      status: 'pending',
      amount: totalPrice.toString(),
      checkIn: new Date(checkIn).toISOString(),
      checkOut: new Date(checkOut).toISOString(),
      guests: guests,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      specialRequests: specialRequests,
      emergencyContact: emergencyContact,
      emergencyPhone: emergencyPhone,
      transportDetails: JSON.stringify({
        roomType: selectedRoom?.name,
        nights: nights,
        paymentMethod: paymentMethod
      })
    };

    createBookingMutation.mutate(bookingData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hotel Not Found</h1>
          <p className="text-muted-foreground mb-6">The hotel you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => navigate('/hotels')}>Browse All Hotels</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/hotels')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hotels
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hotel Information */}
          <div>
            <Card>
              <CardContent className="p-0">
                {hotel.imageUrl && (
                  <div className="relative h-64 overflow-hidden rounded-t-lg">
                    <img 
                      src={hotel.imageUrl} 
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    {hotel.rating && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{hotel.rating}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{hotel.location}</span>
                    </div>
                  </div>

                  {hotel.description && (
                    <p className="text-muted-foreground mb-6">{hotel.description}</p>
                  )}

                  {/* Amenities */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Hotel Amenities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {hotel.amenities.map((amenity: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {hotel.tags && hotel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hotel.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book Your Stay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Customer Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Guest Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerEmail">Email Address *</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerPhone">Phone Number</Label>
                        <Input
                          id="customerPhone"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <select 
                          value={guests.toString()} 
                          onChange={(e) => setGuests(parseInt(e.target.value))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="1">1 Guest</option>
                          <option value="2">2 Guests</option>
                          <option value="3">3 Guests</option>
                          <option value="4">4 Guests</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Check-in/Check-out */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Stay Duration
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="checkIn">Check-in Date *</Label>
                        <Input
                          id="checkIn"
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkOut">Check-out Date *</Label>
                        <Input
                          id="checkOut"
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    {calculateNights() > 0 && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Duration
                          </span>
                          <span className="font-medium">{calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Room Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      Room Selection
                    </h3>
                    
                    <div className="space-y-3">
                      {roomTypes.map((room) => (
                        <div key={room.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          roomType === room.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="roomType"
                              value={room.id}
                              checked={roomType === room.id}
                              onChange={(e) => setRoomType(e.target.value)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label className="flex-1 cursor-pointer" onClick={() => setRoomType(room.id)}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{room.name}</h4>
                                  <p className="text-sm text-muted-foreground">{room.size} • {room.capacity} • {room.beds}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{room.description}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {room.features.slice(0, 3).map((feature, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg">${room.price}</div>
                                  <div className="text-xs text-muted-foreground">per night</div>
                                  <div className="text-xs text-green-600 mt-1">
                                    {room.available} available
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit"
                          checked={paymentMethod === 'credit'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <Label>Credit Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="debit"
                          checked={paymentMethod === 'debit'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <Label>Debit Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <Label>PayPal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pay_at_hotel"
                          checked={paymentMethod === 'pay_at_hotel'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <Label>Pay at Hotel</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Contact (Optional)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContact"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="+1 (555) 987-6543"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requirements or requests..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Price Summary */}
                  {calculateNights() > 0 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Booking Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{roomTypes.find(r => r.id === roomType)?.name} x {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</span>
                          <span>${(calculateTotalPrice()).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taxes & Fees</span>
                          <span>Included</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>${calculateTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={createBookingMutation.isPending || calculateNights() <= 0}
                  >
                    {createBookingMutation.isPending ? (
                      "Processing Booking..."
                    ) : (
                      `Book Now - $${calculateTotalPrice().toFixed(2)}`
                    )}
                  </Button>

                  {calculateNights() <= 0 && checkIn && checkOut && (
                    <p className="text-sm text-destructive text-center">
                      Please select valid check-in and check-out dates.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}