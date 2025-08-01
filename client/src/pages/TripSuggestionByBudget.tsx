import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, IndianRupee, Plane, Train, Car, Compass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trip {
  id: string;
  title: string;
  destination: string;
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
  image: string;
  highlights: string[];
  transportMode: 'flight' | 'train' | 'bus' | 'car';
  category: string;
}

const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'Serene Himalayan Escape',
    destination: 'Manali, Himachal Pradesh',
    price: 4200,
    duration: '5 Days',
    rating: 4.8,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&crop=center',
    highlights: ['Mountain Views', 'Adventure Sports', 'Local Culture'],
    transportMode: 'bus',
    category: 'Adventure'
  },
  {
    id: '2',
    title: 'Golden Triangle Discovery',
    destination: 'Delhi - Agra - Jaipur',
    price: 4800,
    duration: '6 Days',
    rating: 4.6,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop&crop=center',
    highlights: ['Historical Sites', 'Cultural Heritage', 'Local Cuisine'],
    transportMode: 'train',
    category: 'Cultural'
  },
  {
    id: '3',
    title: 'Tropical Beach Paradise',
    destination: 'Goa Beach Resort',
    price: 3900,
    duration: '4 Days',
    rating: 4.7,
    reviewCount: 189,
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=300&fit=crop&crop=center',
    highlights: ['Beach Activities', 'Water Sports', 'Nightlife'],
    transportMode: 'flight',
    category: 'Beach'
  },
  {
    id: '4',
    title: 'Mystic Valley Adventure',
    destination: 'Kasol, Himachal Pradesh',
    price: 3200,
    duration: '4 Days',
    rating: 4.5,
    reviewCount: 98,
    image: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=400&h=300&fit=crop&crop=center',
    highlights: ['Trekking', 'Riverside Camps', 'Peaceful Nature'],
    transportMode: 'bus',
    category: 'Nature'
  },
  {
    id: '5',
    title: 'Royal Rajasthan Experience',
    destination: 'Udaipur, Rajasthan',
    price: 4500,
    duration: '5 Days',
    rating: 4.9,
    reviewCount: 267,
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=300&fit=crop&crop=center',
    highlights: ['Royal Palaces', 'Lake Views', 'Traditional Arts'],
    transportMode: 'train',
    category: 'Heritage'
  },
  {
    id: '6',
    title: 'Backwater Bliss',
    destination: 'Alleppey, Kerala',
    price: 3600,
    duration: '3 Days',
    rating: 4.4,
    reviewCount: 142,
    image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&h=300&fit=crop&crop=center',
    highlights: ['Houseboat Stay', 'Scenic Views', 'Local Cuisine'],
    transportMode: 'flight',
    category: 'Nature'
  }
];

const TripSuggestionByBudget = () => {
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [interests, setInterests] = useState('');
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSuggestTrips = async () => {
    if (!budget) {
      toast({
        title: "Budget Required",
        description: "Please enter your total budget to get trip suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const budgetNum = parseFloat(budget);
    let trips = mockTrips.filter(trip => trip.price <= budgetNum * 1.1); // 10% tolerance

    // Apply filters
    if (location) {
      trips = trips.filter(trip => 
        trip.destination.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (duration) {
      trips = trips.filter(trip => trip.duration.includes(duration));
    }
    
    if (transportMode) {
      trips = trips.filter(trip => trip.transportMode === transportMode);
    }
    
    if (interests) {
      trips = trips.filter(trip => 
        trip.category.toLowerCase().includes(interests.toLowerCase()) ||
        trip.highlights.some(highlight => 
          highlight.toLowerCase().includes(interests.toLowerCase())
        )
      );
    }

    setFilteredTrips(trips);
    setIsSearching(false);
    setHasSearched(true);

    if (trips.length === 0) {
      toast({
        title: "No Trips Found",
        description: "Try adjusting your budget or filters to see more options.",
      });
    } else {
      toast({
        title: "Trips Found!",
        description: `Found ${trips.length} trip${trips.length > 1 ? 's' : ''} matching your criteria.`,
      });
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'train': return <Train className="h-4 w-4" />;
      case 'bus': 
      case 'car': return <Car className="h-4 w-4" />;
      default: return <Compass className="h-4 w-4" />;
    }
  };

  const formatBudgetMatch = (tripPrice: number, userBudget: number) => {
    const percentage = (tripPrice / userBudget) * 100;
    return {
      text: `₹${tripPrice.toLocaleString()} / ₹${userBudget.toLocaleString()}`,
      isWithinBudget: tripPrice <= userBudget,
      percentage: Math.round(percentage)
    };
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display mb-4">Trip Suggestions by Budget</h1>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Discover amazing trips that fit your budget. Enter your total budget and preferences 
            to get personalized recommendations.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-12 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-heading">Find Your Perfect Trip</CardTitle>
            <CardDescription>
              Enter your budget and optional filters to get personalized trip suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Budget - Required */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium">
                  Total Budget <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-10"
                    aria-label="Enter your total budget in Indian Rupees"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Preferred Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Himachal, Goa"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                    aria-label="Enter preferred destination"
                  />
                </div>
              </div>

              {/* Duration Filter */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Trip Duration
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger aria-label="Select trip duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="4">4 Days</SelectItem>
                    <SelectItem value="5">5 Days</SelectItem>
                    <SelectItem value="6">6 Days</SelectItem>
                    <SelectItem value="7">7+ Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transport Mode Filter */}
              <div className="space-y-2">
                <Label htmlFor="transport" className="text-sm font-medium">
                  Transport Mode
                </Label>
                <Select value={transportMode} onValueChange={setTransportMode}>
                  <SelectTrigger aria-label="Select transport mode">
                    <SelectValue placeholder="Select transport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interests Filter */}
              <div className="space-y-2">
                <Label htmlFor="interests" className="text-sm font-medium">
                  Interests
                </Label>
                <Input
                  id="interests"
                  placeholder="e.g., Adventure, Beach, Culture"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  aria-label="Enter your travel interests"
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSuggestTrips}
                disabled={isSearching}
                size="lg"
                className="px-8 py-4 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
                aria-label="Search for trip suggestions based on your criteria"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Searching Trips...
                  </>
                ) : (
                  'Suggest Trips'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="animate-scale-in">
            {filteredTrips.length > 0 ? (
              <>
                <div className="mb-8 text-center">
                  <h2 className="text-heading mb-2">
                    {filteredTrips.length} Trip{filteredTrips.length > 1 ? 's' : ''} Found
                  </h2>
                  <p className="text-muted-foreground">
                    Perfect matches for your budget of ₹{parseFloat(budget).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTrips.map((trip) => {
                    const budgetMatch = formatBudgetMatch(trip.price, parseFloat(budget));
                    
                    return (
                      <Card key={trip.id} className="group hover-lift overflow-hidden">
                        {/* Trip Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={trip.image}
                            alt={trip.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 filter grayscale"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between text-white">
                              <Badge variant="secondary" className="bg-black/40 text-white border-white/20">
                                {trip.category}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                {getTransportIcon(trip.transportMode)}
                                <span className="text-sm capitalize">{trip.transportMode}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          {/* Trip Header */}
                          <div className="mb-4">
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {trip.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">{trip.destination}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{trip.duration}</span>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                                <span className="text-sm font-medium">{trip.rating}</span>
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({trip.reviewCount})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Highlights */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {trip.highlights.slice(0, 3).map((highlight, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {highlight}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Budget Match */}
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-muted-foreground">Matched Budget:</span>
                              <span className={`text-sm font-medium ${
                                budgetMatch.isWithinBudget ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                              }`}>
                                {budgetMatch.percentage}% of budget
                              </span>
                            </div>
                            <div className="text-lg font-semibold">
                              {budgetMatch.text}
                            </div>
                          </div>

                          {/* Price and CTA */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold">₹{trip.price.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">per person</div>
                            </div>
                            <Button
                              variant="default"
                              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                              aria-label={`Explore ${trip.title} trip details`}
                            >
                              Explore Trip
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-heading mb-2">No Trips Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We couldn't find trips matching your criteria. Try adjusting your budget or filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBudget('');
                      setLocation('');
                      setDuration('');
                      setTransportMode('');
                      setInterests('');
                      setHasSearched(false);
                      setFilteredTrips([]);
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripSuggestionByBudget;