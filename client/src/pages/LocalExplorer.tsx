import { useState } from 'react';
import { MapPin, Star, Navigation, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const interestTypes = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'heritage', label: 'Heritage Sites' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'adventure', label: 'Adventure Activities' },
  { value: 'nature', label: 'Nature & Parks' },
  { value: 'culture', label: 'Cultural Attractions' }
];

const mockSpots = [
  {
    id: 1,
    name: 'Local Spice Market',
    description: 'Authentic local spices and traditional ingredients with friendly vendors',
    category: 'food',
    rating: 4.5,
    distance: '0.8 km away'
  },
  {
    id: 2,
    name: 'Heritage Palace Museum',
    description: 'Historical palace showcasing local royal history and artifacts',
    category: 'heritage',
    rating: 4.7,
    distance: '1.2 km away'
  },
  {
    id: 3,
    name: 'Artisan Craft Center',
    description: 'Local handicrafts and traditional art pieces made by local artisans',
    category: 'shopping',
    rating: 4.3,
    distance: '0.5 km away'
  },
  {
    id: 4,
    name: 'Adventure Sports Hub',
    description: 'Rock climbing, zip-lining, and other thrilling outdoor activities',
    category: 'adventure',
    rating: 4.6,
    distance: '2.1 km away'
  }
];

const LocalExplorer = () => {
  const [currentLocation, setCurrentLocation] = useState('');
  const [interestType, setInterestType] = useState('');
  const [spots, setSpots] = useState<typeof mockSpots>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleAutoDetectLocation = () => {
    setIsDetectingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock reverse geocoding
          setCurrentLocation('Mumbai, Maharashtra');
          setIsDetectingLocation(false);
          toast({
            title: "Location Detected",
            description: "Your current location has been detected."
          });
        },
        () => {
          setIsDetectingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to detect location. Please enter manually.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsDetectingLocation(false);
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  const handleShowLocalSpots = async () => {
    if (!currentLocation || !interestType) {
      toast({
        title: "Missing Information",
        description: "Please provide your location and interest type.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const filteredSpots = mockSpots.filter(spot => 
        spot.category === interestType || interestType === 'all'
      );
      setSpots(filteredSpots.length > 0 ? filteredSpots : mockSpots.slice(0, 2));
      setIsLoading(false);
      toast({
        title: "Local Spots Found!",
        description: `Discovered ${filteredSpots.length || 2} great spots near you.`
      });
    }, 1500);
  };

  const handleGetDirections = (spotName: string) => {
    toast({
      title: "Directions",
      description: `Opening directions to ${spotName}...`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Navigation className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Local Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing local spots, hidden gems, and authentic experiences near your location.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <Card className="border border-border bg-card shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-card-foreground">Find Local Spots</CardTitle>
              <CardDescription>
                Tell us where you are and what interests you to discover local attractions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="location">
                  Current Location
                </label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Enter your current location"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="flex-1"
                    aria-label="Current location"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAutoDetectLocation}
                    disabled={isDetectingLocation}
                    className="whitespace-nowrap"
                    aria-label="Auto-detect current location"
                  >
                    {isDetectingLocation ? "Detecting..." : "Use My Location"}
                  </Button>
                </div>
              </div>

              {/* Interest Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="interest-type">
                  Interest Type
                </label>
                <Select value={interestType} onValueChange={setInterestType}>
                  <SelectTrigger id="interest-type" aria-label="Select interest type">
                    <SelectValue placeholder="What are you interested in?" />
                  </SelectTrigger>
                  <SelectContent>
                    {interestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show Local Spots Button */}
              <Button
                onClick={handleShowLocalSpots}
                disabled={isLoading}
                className="w-full bg-foreground text-background hover:opacity-90 font-semibold"
                aria-label="Show local spots"
              >
                {isLoading ? "Finding Local Spots..." : "Show Local Spots"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {spots.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Local Spots Near You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spots.map((spot) => (
                  <Card key={spot.id} className="border border-border bg-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl text-card-foreground">{spot.name}</CardTitle>
                      <CardDescription>{spot.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{spot.rating}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{spot.distance}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleGetDirections(spot.name)}
                        aria-label={`Get directions to ${spot.name}`}
                      >
                        Get Directions
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

export default LocalExplorer;