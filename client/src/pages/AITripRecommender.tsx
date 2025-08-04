import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star,
  Users,
  Calendar,
  Sparkles,
  Filter,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
// Note: Using fetch directly since apiRequest might not be available
// import { apiRequest } from '@/lib/queryClient';

interface TripRecommendation {
  id: number;
  name: string;
  location: string;
  cost: number;
  duration: string;
  tags: string[];
  description: string;
  rating: number;
  includes: string[];
}

interface RecommendationResponse {
  trips: TripRecommendation[];
  totalFound: number;
  searchCriteria: {
    budget?: number;
    interests?: string[];
    duration?: string;
    destination?: string;
  };
}

const interestOptions = [
  'Beach', 'Mountains', 'Adventure', 'Culture', 'Heritage', 'Nature',
  'Nightlife', 'Relaxation', 'Snow', 'Architecture', 'Food', 'Wildlife',
  'Backwaters', 'Spiritual', 'Photography', 'Trekking'
];

export default function AITripRecommender() {
  const [budget, setBudget] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();

  const recommendMutation = useMutation({
    mutationFn: async (data: {
      budget?: number;
      interests?: string[];
      duration?: string;
      destination?: string;
    }) => {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }
      
      const result = await response.json();
      return result.data as RecommendationResponse;
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to get trip recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSearch = () => {
    const searchData = {
      budget: budget ? parseInt(budget) : undefined,
      interests: selectedInterests.length > 0 ? selectedInterests : undefined,
      duration: duration || undefined,
      destination: destination || undefined,
    };

    recommendMutation.mutate(searchData);
  };

  const results = recommendMutation.data;

  return (
    <div className="min-h-screen bg-background py-16">
      <Helmet>
        <title>AI Trip Recommender - ExploreNow</title>
        <meta name="description" content="Get personalized travel recommendations powered by AI. Find perfect trips based on your budget, interests, and preferences with ExploreNow's intelligent recommendation engine." />
        <meta name="keywords" content="AI travel recommendations, personalized trips, travel AI, smart travel suggestions, trip planning AI, ExploreNow AI" />
        <meta property="og:title" content="AI Trip Recommender - ExploreNow" />
        <meta property="og:description" content="Get personalized travel recommendations powered by AI" />
        <link rel="canonical" href="https://explorenow.replit.app/ai-recommender" />
      </Helmet>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">AI Trip Recommender</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Let our AI find the perfect trips based on your budget, interests, and preferences
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Tell us what you're looking for</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Budget (USD)</span>
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </Label>
                  <Input
                    id="duration"
                    placeholder="e.g. 5 days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Destination (Optional)</span>
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g. India, Europe"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Your Interests</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {interestOptions.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        selectedInterests.includes(interest)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={recommendMutation.isPending}
                className="w-full md:w-auto"
                size="lg"
              >
                {recommendMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Finding trips...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Results Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Found {results.totalFound} trips for you
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results.searchCriteria.budget && (
                    <Badge variant="secondary">
                      Budget: ${results.searchCriteria.budget}
                    </Badge>
                  )}
                  {results.searchCriteria.duration && (
                    <Badge variant="secondary">
                      Duration: {results.searchCriteria.duration}
                    </Badge>
                  )}
                  {results.searchCriteria.interests && results.searchCriteria.interests.length > 0 && (
                    <Badge variant="secondary">
                      Interests: {results.searchCriteria.interests.join(', ')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Trip Cards */}
              {results.trips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.trips.map((trip) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Trip Header */}
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{trip.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{trip.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{trip.duration}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{trip.rating}</span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground">
                              {trip.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {trip.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Includes */}
                            {trip.includes && trip.includes.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Includes:</h4>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {trip.includes.map((item, index) => (
                                    <li key={index} className="flex items-center space-x-1">
                                      <span className="w-1 h-1 bg-primary rounded-full"></span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Price and Action */}
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="text-2xl font-bold text-primary">
                                ${trip.cost}
                              </div>
                              <Button size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No trips found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your budget or interests to find more options
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Call to Action */}
          {!results && (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Ready to discover your next adventure?</h3>
              <p className="text-muted-foreground mb-6">
                Fill in your preferences above and let our AI find the perfect trips for you
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}