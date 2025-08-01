import { useState } from 'react';
import { Navigation, MapPin, Clock, Cloud, ChevronDown, ChevronUp, Route } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

const ExploreGuide = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [expandedTips, setExpandedTips] = useState<{ [key: string]: boolean }>({});

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock city detection based on coordinates
          setSelectedCity("Current Location (San Francisco)");
          toast({
            title: "Location Found",
            description: "Using your current location for recommendations."
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to access your location. Please enter manually.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
    }
  };

  const handleFindRoute = () => {
    if (!fromLocation || !toLocation) {
      toast({
        title: "Missing Information",
        description: "Please enter both from and to locations.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Route Found",
      description: `Route from ${fromLocation} to ${toLocation} calculated.`
    });
  };

  const toggleTip = (tipId: string) => {
    setExpandedTips(prev => ({
      ...prev,
      [tipId]: !prev[tipId]
    }));
  };

  const recommendedPlaces = [
    {
      name: "Golden Gate Bridge",
      type: "Landmark",
      rating: 4.8,
      description: "Iconic suspension bridge with stunning views"
    },
    {
      name: "Fisherman's Wharf",
      type: "Attraction",
      rating: 4.5,
      description: "Historic waterfront district with shops and restaurants"
    },
    {
      name: "Alcatraz Island",
      type: "Historical Site",
      rating: 4.7,
      description: "Former federal prison with guided tours"
    },
    {
      name: "Union Square",
      type: "Shopping",
      rating: 4.3,
      description: "Premier shopping and dining destination"
    }
  ];

  const localTips = [
    {
      id: "transport",
      title: "Transportation Tips",
      content: "Use Muni for public transport. Cable cars are tourist attractions but slower for commuting. Uber/Lyft are convenient but can be expensive during peak hours."
    },
    {
      id: "dining",
      title: "Local Dining",
      content: "Try Mission District for authentic Mexican food, Chinatown for dim sum, and North Beach for Italian cuisine. Make reservations for popular restaurants."
    },
    {
      id: "safety",
      title: "Safety & Etiquette",
      content: "Avoid leaving items visible in cars. Dress in layers as weather changes quickly. Be respectful of homeless individuals and keep personal belongings secure."
    },
    {
      id: "timing",
      title: "Best Times to Visit",
      content: "Visit popular attractions early morning or late afternoon to avoid crowds. Summer evenings can be foggy and cold. September-October offers the best weather."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Navigation className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your smart travel companion — get local routes, places to visit, and tips based on your current location.
          </p>
        </div>

        {/* Location Input */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-card-foreground">Select Your Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Enter city or destination..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="flex-1"
                  aria-label="Enter city or destination"
                />
                <Button
                  onClick={handleUseMyLocation}
                  variant="outline"
                  className="bg-foreground text-background hover:opacity-90 font-semibold transition"
                  aria-label="Use my current location"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended Places */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">Recommended Places</CardTitle>
                <CardDescription>
                  Popular attractions and hidden gems in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedPlaces.map((place, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-card-foreground">{place.name}</h3>
                          <span className="text-sm text-muted-foreground">★ {place.rating}</span>
                        </div>
                        <p className="text-sm text-primary mb-2">{place.type}</p>
                        <p className="text-sm text-muted-foreground">{place.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Route Planner */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Route Planner
                </CardTitle>
                <CardDescription>
                  Find the best route between two locations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="from-location">
                      From
                    </label>
                    <Input
                      id="from-location"
                      placeholder="Starting location..."
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      aria-label="Starting location"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="to-location">
                      To
                    </label>
                    <Input
                      id="to-location"
                      placeholder="Destination..."
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      aria-label="Destination"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleFindRoute}
                  className="w-full bg-foreground text-background hover:opacity-90 font-semibold transition"
                  aria-label="Find route"
                >
                  Find Route
                </Button>
              </CardContent>
            </Card>

            {/* Local Tips */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">Local Tips</CardTitle>
                <CardDescription>
                  Insider knowledge from locals and experienced travelers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {localTips.map((tip) => (
                  <Collapsible key={tip.id} open={expandedTips[tip.id]} onOpenChange={() => toggleTip(tip.id)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left"
                        aria-label={`Toggle ${tip.title}`}
                      >
                        <span className="font-medium">{tip.title}</span>
                        {expandedTips[tip.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 px-4 pb-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tip.content}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Current Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">72°F</div>
                  <p className="text-muted-foreground mb-4">Partly Cloudy</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">High</p>
                      <p className="font-semibold text-foreground">75°F</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Low</p>
                      <p className="font-semibold text-foreground">65°F</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  aria-label="Find nearby restaurants"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Nearby Restaurants
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  aria-label="Find ATMs"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Find ATMs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  aria-label="Emergency contacts"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Emergency Contacts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreGuide;