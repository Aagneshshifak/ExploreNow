import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plane, Train, Car, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RouteOption {
  type: 'flight' | 'train' | 'road';
  duration: string;
  cost: string;
  details: string;
  emissions: string;
  icon: React.ElementType;
}

interface RouteResults {
  distance: string;
  options: RouteOption[];
}

export default function RouteFinder() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [results, setResults] = useState<RouteResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const findRoute = () => {
    if (!origin || !destination) return;

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResults: RouteResults = {
        distance: `${Math.floor(Math.random() * 2000 + 500)} km`,
        options: [
          {
            type: 'flight',
            duration: `${Math.floor(Math.random() * 8 + 2)}h ${Math.floor(Math.random() * 60)}m`,
            cost: `$${Math.floor(Math.random() * 500 + 200)}`,
            details: 'Direct flight • 1 stop • Multiple airlines available',
            emissions: `${Math.floor(Math.random() * 200 + 100)} kg CO₂`,
            icon: Plane
          },
          {
            type: 'train',
            duration: `${Math.floor(Math.random() * 12 + 8)}h ${Math.floor(Math.random() * 60)}m`,
            cost: `$${Math.floor(Math.random() * 200 + 80)}`,
            details: 'High-speed rail • Scenic route • Station to station',
            emissions: `${Math.floor(Math.random() * 50 + 20)} kg CO₂`,
            icon: Train
          },
          {
            type: 'road',
            duration: `${Math.floor(Math.random() * 16 + 12)}h ${Math.floor(Math.random() * 60)}m`,
            cost: `$${Math.floor(Math.random() * 150 + 50)}`,
            details: 'Driving • Fuel + tolls • Rest stops recommended',
            emissions: `${Math.floor(Math.random() * 150 + 80)} kg CO₂`,
            icon: Car
          }
        ]
      };

      setResults(mockResults);
      setIsSearching(false);
    }, 2000);
  };

  const getRouteColor = (type: string) => {
    const colors = {
      flight: 'border-blue-500/20 bg-blue-500/10',
      train: 'border-green-500/20 bg-green-500/10',
      road: 'border-orange-500/20 bg-orange-500/10'
    };
    return colors[type as keyof typeof colors] || 'border-muted bg-muted/10';
  };

  const getRouteIconColor = (type: string) => {
    const colors = {
      flight: 'text-blue-500',
      train: 'text-green-500',
      road: 'text-orange-500'
    };
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-display mb-4">Route Finder</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Compare travel options between cities. Get time estimates, costs, and environmental impact for flights, trains, and road trips.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Plan Your Route</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">From</Label>
                    <Input
                      id="origin"
                      placeholder="Enter origin city"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destination">To</Label>
                    <Input
                      id="destination"
                      placeholder="Enter destination city"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={findRoute}
                      disabled={!origin || !destination || isSearching}
                      className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Find travel routes between selected cities"
                    >
                      {isSearching ? 'Finding Routes...' : 'Find Route'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Route Map Placeholder */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-elegant-lg border-0">
                <CardContent className="p-0">
                  <div className="h-64 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* Mock Map */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(0,0,0,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]" />
                    </div>
                    
                    <div className="text-center z-10">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold">{origin} → {destination}</p>
                      <p className="text-sm text-muted-foreground">Distance: {results.distance}</p>
                    </div>

                    {/* Route Line */}
                    <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-primary/30 transform -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary rounded-full transform translate-x-1/2 -translate-y-1/2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Route Options */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">Travel Options</h2>
              <div className="grid grid-cols-1 gap-4">
                {results.options.map((option, index) => (
                  <Card key={index} className={`shadow-elegant border ${getRouteColor(option.type)}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center ${getRouteIconColor(option.type)}`}>
                            <option.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize text-lg">{option.type}</h3>
                            <p className="text-sm text-muted-foreground">{option.details}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs">Duration</span>
                              </div>
                              <p className="font-semibold">{option.duration}</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs">Cost</span>
                              </div>
                              <p className="font-semibold">{option.cost}</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">CO₂ Emissions</div>
                              <p className="text-sm font-medium">{option.emissions}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Results State */}
          {!results && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Enter your origin and destination to find the best travel routes
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}