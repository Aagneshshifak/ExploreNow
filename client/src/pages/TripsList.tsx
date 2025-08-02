import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Star,
  Calendar,
  Users,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface Trip {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  duration: number;
  tags: string[];
  includes: string[];
  imageUrl: string | null;
  createdAt: string;
}

export default function TripsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const { toast } = useToast();

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['/api/trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      
      const result = await response.json();
      return result.data as Trip[];
    },
  });

  const filteredTrips = trips?.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = !priceFilter || trip.price <= parseFloat(priceFilter);
    
    return matchesSearch && matchesPrice;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Error Loading Trips</h2>
            <p className="text-muted-foreground">
              There was an issue loading trips. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Explore Amazing Trips</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover curated travel experiences from around the world
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="flex items-center space-x-1">
                    <Search className="h-4 w-4" />
                    <span>Search Trips</span>
                  </Label>
                  <Input
                    id="search"
                    placeholder="Search by title, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Max Price (USD)</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g. 2000"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setPriceFilter('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip' : 'Trips'} Available
            </h2>
          </div>

          {/* Trip Cards */}
          {filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
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
                          <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{trip.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{trip.duration} days</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {trip.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {trip.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Includes */}
                        {trip.includes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Includes:</h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {trip.includes.slice(0, 3).map((item, index) => (
                                <li key={index} className="flex items-center space-x-1">
                                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                                  <span>{item}</span>
                                </li>
                              ))}
                              {trip.includes.length > 3 && (
                                <li className="text-xs text-muted-foreground">
                                  +{trip.includes.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Price and Action */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-2xl font-bold text-primary">
                            ${trip.price}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Booking Feature",
                                description: "Trip booking functionality coming soon!",
                              });
                            }}
                          >
                            Book Now
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No trips found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}