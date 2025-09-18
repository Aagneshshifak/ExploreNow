import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Search, 
  Filter,
  Users,
  Wifi,
  Car,
  Coffee
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Hotel } from '@shared/schema';

interface HotelsResponse {
  success: boolean;
  data: Hotel[];
  message: string;
}

export default function HotelsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: hotelsResponse, isLoading, error } = useQuery<HotelsResponse>({
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

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hotel.description && hotel.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPrice = !priceFilter || parseFloat(hotel.price) <= parseFloat(priceFilter);
    
    return matchesSearch && matchesPrice;
  });

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
            <h2 className="text-2xl font-bold mb-4">Error Loading Hotels</h2>
            <p className="text-muted-foreground">
              There was an issue loading hotels. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Book Amazing Hotels
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find and book the perfect accommodation for your journey with our curated selection of hotels
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search hotels by name, location, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="Max price per night"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setPriceFilter('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-muted-foreground">
            {filteredHotels.length === hotels.length 
              ? `Showing all ${hotels.length} hotels`
              : `Showing ${filteredHotels.length} of ${hotels.length} hotels`
            }
          </p>
        </motion.div>

        {/* Hotels Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    className="h-full hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/hotel/${hotel.id}`)}
                  >
                    {/* Hotel Image */}
                    {hotel.imageUrl && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <img 
                          src={hotel.imageUrl} 
                          alt={hotel.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="text-lg font-semibold">{hotel.name}</h3>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <p className="text-sm opacity-90">{hotel.location}</p>
                          </div>
                        </div>
                        {hotel.rating && (
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{hotel.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Hotel Header (fallback if no image) */}
                        {!hotel.imageUrl && (
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{hotel.location}</span>
                              </div>
                              {hotel.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{hotel.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {hotel.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {hotel.description}
                          </p>
                        )}

                        {/* Tags */}
                        {hotel.tags && hotel.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {hotel.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {hotel.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{hotel.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Amenities Icons */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="flex items-center space-x-3 text-muted-foreground">
                            {hotel.amenities.includes('WiFi') && <Wifi className="h-4 w-4" />}
                            {hotel.amenities.includes('Parking') && <Car className="h-4 w-4" />}
                            {hotel.amenities.includes('Restaurant') && <Coffee className="h-4 w-4" />}
                            {hotel.amenities.includes('Swimming Pool') && <Users className="h-4 w-4" />}
                          </div>
                        )}

                        {/* Price and Book Button */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-2xl font-bold">${hotel.price}</span>
                              <span className="text-sm text-muted-foreground">/night</span>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/hotel/${hotel.id}/book`);
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
              <h3 className="text-lg font-medium mb-2">No hotels found</h3>
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