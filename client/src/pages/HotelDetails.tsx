import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Users, 
  Calendar,
  Wifi,
  Car,
  Utensils,
  ShoppingCart,
  Check,
  Info,
  Heart,
  Share2,
  Bath,
  Tv,
  Coffee,
  Wind
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceDisplay } from '@/components/ui/price-display';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
  const [isWishlisted, setIsWishlisted] = useState(false);

  const hotelId = parseInt(id || '0');

  // Fetch hotel details
  const { data: hotels, isLoading } = useQuery({
    queryKey: ['/api/hotels'],
  });

  const hotel = Array.isArray(hotels) ? hotels.find((h: Hotel) => h.id === hotelId) : null;

  // Mock room types (in a real app, this would come from the API)
  const roomTypes = [
    {
      id: 1,
      name: "Deluxe Room",
      size: "320 sq ft",
      capacity: "2 adults",
      price: hotel?.price,
      features: ["King bed", "City view", "Free WiFi", "Mini bar"],
      description: "Comfortable room with modern amenities and city view."
    },
    {
      id: 2,
      name: "Premium Suite",
      size: "580 sq ft",
      capacity: "2-4 adults",
      price: hotel ? (parseFloat(hotel.price) * 1.5).toString() : "0",
      features: ["Separate living area", "Ocean view", "Balcony", "Premium amenities"],
      description: "Spacious suite with separate living area and stunning ocean views."
    },
    {
      id: 3,
      name: "Executive Room",
      size: "420 sq ft",
      capacity: "2 adults",
      price: hotel ? (parseFloat(hotel.price) * 1.2).toString() : "0",
      features: ["Executive lounge access", "Complimentary breakfast", "Work desk", "Airport transfer"],
      description: "Business traveler's choice with executive privileges and enhanced services."
    }
  ];

  const handleBookNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to book this hotel.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    navigate(`/hotel/${hotelId}/book?type=hotel`);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: isWishlisted 
        ? "Hotel removed from your wishlist" 
        : "Hotel added to your wishlist",
    });
  };

  const shareHotel = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hotel?.name,
          text: hotel?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Hotel link copied to clipboard",
      });
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hotel Not Found</h1>
          <Button onClick={() => navigate('/hotels')}>Browse All Hotels</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{hotel.name} - ExploreNow</title>
        <meta name="description" content={hotel.description} />
        <meta property="og:title" content={`${hotel.name} - ExploreNow`} />
        <meta property="og:description" content={hotel.description} />
        <meta property="og:image" content={hotel.imageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-4 left-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hotels')}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotels
            </Button>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleWishlist}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareHotel}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-8 left-8 text-white">
            <div className="flex items-center mb-2">
              <div className="flex mr-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${parseFloat(hotel.rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-white/50'}`} 
                  />
                ))}
              </div>
              <span className="text-lg">{hotel.rating}/5</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-1" />
              {hotel.location}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    About This Hotel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {hotel.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hotel.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Tabs */}
              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue="rooms" className="w-full">
                    <TabsList className="w-full justify-start p-1 bg-muted rounded-none">
                      <TabsTrigger value="rooms" className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Rooms & Rates
                      </TabsTrigger>
                      <TabsTrigger value="amenities" className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        Amenities
                      </TabsTrigger>
                      <TabsTrigger value="policies" className="flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Policies
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rooms" className="p-6">
                      <div className="space-y-6">
                        {roomTypes.map((room, index) => (
                          <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border rounded-lg p-6"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{room.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{room.size}</span>
                                  <span>•</span>
                                  <span>{room.capacity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  <PriceDisplay price={room.price} originalCurrency="USD" />
                                </div>
                                <div className="text-sm text-muted-foreground">per night</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {room.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center text-sm">
                                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              onClick={handleBookNow}
                              className="w-full md:w-auto"
                            >
                              Book This Room
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="amenities" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Hotel Amenities */}
                        <div>
                          <h3 className="font-semibold text-lg mb-4 flex items-center">
                            <Wifi className="h-5 w-5 mr-2" />
                            Connectivity
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Free high-speed WiFi
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Business center
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Conference rooms
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 flex items-center">
                            <Utensils className="h-5 w-5 mr-2" />
                            Dining
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Restaurant
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Room service (24/7)
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Bar/lounge
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 flex items-center">
                            <Car className="h-5 w-5 mr-2" />
                            Transportation
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Airport shuttle
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Valet parking
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              Car rental desk
                            </li>
                          </ul>
                        </div>

                        {/* Display actual hotel amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h3 className="font-semibold text-lg mb-4">Hotel Features</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {hotel.amenities.map((amenity: string, idx: number) => (
                                <div key={idx} className="flex items-center text-sm">
                                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                  <span>{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="policies" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-green-600">Check-in/Check-out</h3>
                          <ul className="space-y-3">
                            <li className="flex justify-between text-sm">
                              <span className="font-medium">Check-in:</span>
                              <span>3:00 PM - 12:00 AM</span>
                            </li>
                            <li className="flex justify-between text-sm">
                              <span className="font-medium">Check-out:</span>
                              <span>12:00 PM</span>
                            </li>
                            <li className="flex justify-between text-sm">
                              <span className="font-medium">Early check-in:</span>
                              <span>Subject to availability</span>
                            </li>
                            <li className="flex justify-between text-sm">
                              <span className="font-medium">Late check-out:</span>
                              <span>Additional charges apply</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-blue-600">Cancellation Policy</h3>
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-start">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Free cancellation up to 24 hours before check-in</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Flexible rebooking options</span>
                            </li>
                            <li className="flex items-start">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>No charges for changes made 48+ hours in advance</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-purple-600">Pet Policy</h3>
                          <ul className="space-y-3 text-sm">
                            <li>Pets allowed with restrictions</li>
                            <li>Pet fee: $50 per night per pet</li>
                            <li>Maximum 2 pets per room</li>
                            <li>Service animals welcome</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-orange-600">Additional Policies</h3>
                          <ul className="space-y-3 text-sm">
                            <li>Minimum age for check-in: 18</li>
                            <li>Government-issued photo ID required</li>
                            <li>Security deposit may be required</li>
                            <li>Smoking prohibited in all rooms</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Book This Hotel</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        <PriceDisplay price={hotel.price} originalCurrency="USD" />
                      </div>
                      <div className="text-sm text-muted-foreground">per night</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${parseFloat(hotel.rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                      <span className="font-medium">{hotel.rating}/5 rating</span>
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    onClick={handleBookNow}
                    size="lg" 
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>

                  <div className="text-xs text-center text-muted-foreground">
                    Free cancellation up to 24 hours before check-in
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2 text-muted-foreground" />
                      WiFi
                    </span>
                    <span className="text-muted-foreground">Free</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                      Parking
                    </span>
                    <span className="text-muted-foreground">Valet Available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      Check-in
                    </span>
                    <span className="text-muted-foreground">3:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Check-out
                    </span>
                    <span className="text-muted-foreground">12:00 PM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}