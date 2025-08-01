import { useState } from 'react';
import { MapPin, Clock, DollarSign, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const interests = [
  'Beaches', 'Adventure', 'Culture', 'Food', 'Nature', 'History', 
  'Shopping', 'Nightlife', 'Photography', 'Wellness'
];

const durations = [
  { value: '1-3', label: '1-3 days' },
  { value: '4-7', label: '4-7 days' },
  { value: '8+', label: '8+ days' }
];

const mockRecommendations = [
  {
    id: 1,
    destination: 'Goa Beach Paradise',
    description: 'Pristine beaches with vibrant culture and delicious seafood',
    budgetRange: '₹15,000 - ₹25,000',
    duration: '4-7 days',
    rating: 4.5
  },
  {
    id: 2,
    destination: 'Himachal Adventure Trek',
    description: 'Mountain adventures with breathtaking views and local culture',
    budgetRange: '₹20,000 - ₹35,000',
    duration: '8+ days',
    rating: 4.8
  },
  {
    id: 3,
    destination: 'Rajasthan Cultural Tour',
    description: 'Royal palaces, vibrant markets, and rich heritage sites',
    budgetRange: '₹18,000 - ₹30,000',
    duration: '4-7 days',
    rating: 4.6
  }
];

const TripRecommender = () => {
  const [budget, setBudget] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [recommendations, setRecommendations] = useState<typeof mockRecommendations>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGetRecommendations = async () => {
    if (!budget || selectedInterests.length === 0 || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsLoading(false);
      toast({
        title: "Recommendations Ready!",
        description: "Found 3 trips matching your preferences."
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trip Recommender
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized travel recommendations based on your budget, interests, and duration preferences.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <Card className="border border-border bg-card shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-card-foreground">Tell Us Your Preferences</CardTitle>
              <CardDescription>
                Share your travel budget, interests, and duration to get tailored recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="budget">
                  Travel Budget (₹)
                </label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter your budget in rupees"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="text-base"
                  aria-label="Travel budget in rupees"
                />
              </div>

              {/* Interests Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Interests (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="duration">
                  Duration
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" aria-label="Select trip duration">
                    <SelectValue placeholder="Select trip duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Get Recommendations Button */}
              <Button
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="w-full bg-foreground text-background hover:opacity-90 font-semibold text-lg py-6"
                aria-label="Get trip recommendations"
              >
                {isLoading ? "Finding Recommendations..." : "Get Recommendations"}
              </Button>
            </CardContent>
          </Card>

          {/* Recommendations Results */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Recommended Trips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((trip) => (
                  <Card key={trip.id} className="border border-border bg-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg text-card-foreground">{trip.destination}</CardTitle>
                      <CardDescription>{trip.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{trip.budgetRange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{trip.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{trip.rating}/5</span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        aria-label={`Explore ${trip.destination}`}
                      >
                        Explore Trip
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripRecommender;