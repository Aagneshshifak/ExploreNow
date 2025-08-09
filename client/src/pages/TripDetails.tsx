import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  Camera,
  Plane,
  Hotel,
  Utensils,
  ShoppingCart,
  Check,
  Info,
  Heart,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceDisplay } from '@/components/ui/price-display';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Trip {
  id: number;
  title: string;
  location: string;
  description: string;
  price: string;
  imageUrl: string;
  duration: number;
  tags: string[];
  includes: string[];
  createdAt: string;
}

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const tripId = parseInt(id || '0');

  // Fetch trip details
  const { data: trips, isLoading } = useQuery({
    queryKey: ['/api/trips'],
  });

  const trip = trips?.find((t: Trip) => t.id === tripId);

  // Mock detailed itinerary data (in a real app, this would come from the API)
  const itinerary = [
    {
      day: 1,
      title: "Arrival & Delhi Exploration",
      activities: ["Airport pickup", "Hotel check-in", "India Gate visit", "Connaught Place shopping"],
      meals: ["Welcome dinner"],
      accommodation: "Heritage Hotel Delhi"
    },
    {
      day: 2,
      title: "Delhi Sightseeing",
      activities: ["Red Fort", "Jama Masjid", "Chandni Chowk", "Humayun's Tomb"],
      meals: ["Breakfast", "Traditional lunch", "Dinner"],
      accommodation: "Heritage Hotel Delhi"
    },
    {
      day: 3,
      title: "Delhi to Agra",
      activities: ["Early morning drive to Agra", "Taj Mahal visit", "Agra Fort exploration"],
      meals: ["Breakfast", "Lunch", "Dinner"],
      accommodation: "Luxury Hotel Agra"
    },
    {
      day: 4,
      title: "Agra to Jaipur",
      activities: ["Fatehpur Sikri visit", "Drive to Jaipur", "Local market exploration"],
      meals: ["Breakfast", "Lunch", "Rajasthani dinner"],
      accommodation: "Palace Hotel Jaipur"
    },
    {
      day: 5,
      title: "Jaipur Sightseeing",
      activities: ["Amber Fort", "City Palace", "Hawa Mahal", "Jantar Mantar"],
      meals: ["Breakfast", "Royal lunch", "Dinner"],
      accommodation: "Palace Hotel Jaipur"
    },
    {
      day: 6,
      title: "Departure",
      activities: ["Hotel check-out", "Last-minute shopping", "Airport transfer"],
      meals: ["Breakfast"],
      accommodation: null
    }
  ];

  const handleBookNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to book this trip.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    navigate(`/trip/${tripId}/book?type=trip`);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: isWishlisted 
        ? "Trip removed from your wishlist" 
        : "Trip added to your wishlist",
    });
  };

  const shareTrip = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip?.title,
          text: trip?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Trip link copied to clipboard",
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

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Trip Not Found</h1>
          <Button onClick={() => navigate('/trips')}>Browse All Trips</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{trip.title} - ExploreNow</title>
        <meta name="description" content={trip.description} />
        <meta property="og:title" content={`${trip.title} - ExploreNow`} />
        <meta property="og:description" content={trip.description} />
        <meta property="og:image" content={trip.imageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={trip.imageUrl}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-4 left-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/trips')}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
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
              onClick={shareTrip}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
            <div className="flex items-center space-x-4 text-lg">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-1" />
                {trip.location}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-1" />
                {trip.duration} Days
              </div>
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
                    About This Trip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {trip.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {trip.tags?.map((tag: string) => (
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
                  <Tabs defaultValue="itinerary" className="w-full">
                    <TabsList className="w-full justify-start p-1 bg-muted rounded-none">
                      <TabsTrigger value="itinerary" className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Day-by-Day Itinerary
                      </TabsTrigger>
                      <TabsTrigger value="includes" className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        What's Included
                      </TabsTrigger>
                      <TabsTrigger value="hotels" className="flex items-center">
                        <Hotel className="h-4 w-4 mr-2" />
                        Accommodations
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="itinerary" className="p-6">
                      <div className="space-y-6">
                        {itinerary.map((day) => (
                          <motion.div
                            key={day.day}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: day.day * 0.1 }}
                            className="border-l-2 border-primary pl-6 relative"
                          >
                            <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full"></div>
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h3 className="font-semibold text-lg mb-2">
                                Day {day.day}: {day.title}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-sm text-primary mb-2 flex items-center">
                                    <Camera className="h-4 w-4 mr-1" />
                                    Activities
                                  </h4>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {day.activities.map((activity, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-medium text-sm text-primary mb-2 flex items-center">
                                    <Utensils className="h-4 w-4 mr-1" />
                                    Meals
                                  </h4>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {day.meals.map((meal, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                        {meal}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {day.accommodation && (
                                <div className="mt-4 pt-4 border-t border-border">
                                  <h4 className="font-medium text-sm text-primary mb-1 flex items-center">
                                    <Hotel className="h-4 w-4 mr-1" />
                                    Accommodation
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{day.accommodation}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="includes" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-green-600">What's Included</h3>
                          <ul className="space-y-3">
                            {trip.includes?.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-center text-sm">
                                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                            <li className="flex items-center text-sm">
                              <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                              <span>Professional English-speaking guide</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                              <span>All entry fees to monuments</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                              <span>Travel insurance</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-4 text-red-600">Not Included</h3>
                          <ul className="space-y-3">
                            <li className="flex items-center text-sm">
                              <span className="w-4 h-4 border border-red-500 rounded mr-3 flex-shrink-0"></span>
                              <span>International flights</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <span className="w-4 h-4 border border-red-500 rounded mr-3 flex-shrink-0"></span>
                              <span>Personal expenses</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <span className="w-4 h-4 border border-red-500 rounded mr-3 flex-shrink-0"></span>
                              <span>Tips and gratuities</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <span className="w-4 h-4 border border-red-500 rounded mr-3 flex-shrink-0"></span>
                              <span>Alcoholic beverages</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="hotels" className="p-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Heritage Hotel Delhi</CardTitle>
                              <div className="flex items-center">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-muted-foreground">5-Star</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">
                                Luxurious heritage property in the heart of Delhi with modern amenities.
                              </p>
                              <div className="text-xs text-muted-foreground">
                                <strong>Amenities:</strong> WiFi, Pool, Spa, Restaurant, Room Service
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Luxury Hotel Agra</CardTitle>
                              <div className="flex items-center">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-muted-foreground">5-Star</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">
                                Premium hotel with stunning views of the Taj Mahal from select rooms.
                              </p>
                              <div className="text-xs text-muted-foreground">
                                <strong>Amenities:</strong> Taj View, WiFi, Pool, Restaurant, Concierge
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Palace Hotel Jaipur</CardTitle>
                              <div className="flex items-center">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-muted-foreground">Palace Hotel</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">
                                Authentic royal palace converted into a luxury hotel with regal architecture.
                              </p>
                              <div className="text-xs text-muted-foreground">
                                <strong>Amenities:</strong> Royal Suites, WiFi, Pool, Spa, Cultural Shows
                              </div>
                            </CardContent>
                          </Card>
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
                    <span>Book This Trip</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        <PriceDisplay price={trip.price} originalCurrency="USD" />
                      </div>
                      <div className="text-sm text-muted-foreground">per person</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p className="text-muted-foreground">{trip.duration} Days</p>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-medium">Group Size</span>
                      </div>
                      <p className="text-muted-foreground">2-8 People</p>
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
                    Free cancellation up to 24 hours before departure
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
                      <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                      Transportation
                    </span>
                    <span className="text-muted-foreground">AC Vehicle</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Hotel className="h-4 w-4 mr-2 text-muted-foreground" />
                      Accommodation
                    </span>
                    <span className="text-muted-foreground">5-Star Hotels</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Utensils className="h-4 w-4 mr-2 text-muted-foreground" />
                      Meals
                    </span>
                    <span className="text-muted-foreground">Breakfast & Dinner</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      Guide
                    </span>
                    <span className="text-muted-foreground">English Speaking</span>
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