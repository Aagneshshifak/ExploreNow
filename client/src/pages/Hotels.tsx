
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Star, 
  Wifi, 
  Coffee, 
  Car, 
  Snowflake, 
  Dumbbell, 
  Waves,
  Filter,
  SlidersHorizontal
} from "lucide-react";

interface Hotel {
  id: number;
  name: string;
  location: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  amenities: string[];
  isRecommended?: boolean;
  distance?: string;
}

const Hotels = () => {
  const [priceRange, setPriceRange] = useState([5000, 25000]);
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const amenityOptions = [
    { id: "wifi", label: "Wi-Fi", icon: <Wifi className="w-4 h-4" /> },
    { id: "breakfast", label: "Breakfast", icon: <Coffee className="w-4 h-4" /> },
    { id: "parking", label: "Parking", icon: <Car className="w-4 h-4" /> },
    { id: "ac", label: "AC", icon: <Snowflake className="w-4 h-4" /> },
    { id: "gym", label: "Gym", icon: <Dumbbell className="w-4 h-4" /> },
    { id: "pool", label: "Pool", icon: <Waves className="w-4 h-4" /> },
  ];

  const hotels: Hotel[] = [
    {
      id: 1,
      name: "Taj Lake Palace",
      location: "Udaipur, Rajasthan",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
      price: 18500,
      originalPrice: 22000,
      rating: 4.9,
      reviews: 1247,
      amenities: ["wifi", "breakfast", "parking", "ac", "pool"],
      isRecommended: true,
      distance: "2.1 km from city center"
    },
    {
      id: 2,
      name: "Backwater Retreat",
      location: "Alleppey, Kerala",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
      price: 8500,
      rating: 4.7,
      reviews: 892,
      amenities: ["wifi", "breakfast", "ac"],
      distance: "1.5 km from backwaters"
    },
    {
      id: 3,
      name: "The Oberoi Amarvilas",
      location: "Agra, Uttar Pradesh",
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
      price: 24500,
      originalPrice: 28000,
      rating: 4.8,
      reviews: 2156,
      amenities: ["wifi", "breakfast", "parking", "ac", "gym", "pool"],
      isRecommended: true,
      distance: "600m from Taj Mahal"
    },
    {
      id: 4,
      name: "Goa Beach Resort",
      location: "Calangute, Goa",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
      price: 6200,
      rating: 4.5,
      reviews: 743,
      amenities: ["wifi", "breakfast", "pool"],
      distance: "50m from beach"
    },
    {
      id: 5,
      name: "Himalayan Lodge",
      location: "Manali, Himachal Pradesh",
      image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400",
      price: 4500,
      rating: 4.6,
      reviews: 567,
      amenities: ["wifi", "breakfast", "parking", "ac"],
      distance: "3.2 km from Mall Road"
    },
    {
      id: 6,
      name: "Heritage Haveli",
      location: "Jaisalmer, Rajasthan",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
      price: 7800,
      rating: 4.4,
      reviews: 456,
      amenities: ["wifi", "breakfast", "ac"],
      distance: "1.8 km from fort"
    }
  ];

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    } else {
      setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
    }
  };

  const getAmenityIcon = (amenityId: string) => {
    const amenity = amenityOptions.find(opt => opt.id === amenityId);
    return amenity?.icon;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-r from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover handpicked hotels across India's most beautiful destinations
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 space-y-6">
            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              
              {/* Enhanced Price Range */}
              <div className="space-y-6 mb-6">
                <Label className="text-base font-medium">Price Range (per night)</Label>
                <div className="px-2 py-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50000}
                    min={1000}
                    step={500}
                    className="w-full"
                    showTooltip={true}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-4 px-1">
                    <div className="flex flex-col items-start">
                      <span className="text-xs uppercase tracking-wide">Min</span>
                      <span className="font-semibold text-foreground">₹{priceRange[0].toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs uppercase tracking-wide">Max</span>
                      <span className="font-semibold text-foreground">₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-3 mb-6">
                <Label>Star Rating</Label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="any">Any Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-3 mb-6">
                <Label>Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rajasthan">Rajasthan</SelectItem>
                    <SelectItem value="kerala">Kerala</SelectItem>
                    <SelectItem value="goa">Goa</SelectItem>
                    <SelectItem value="himachal">Himachal Pradesh</SelectItem>
                    <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="space-y-3">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={(checked) => 
                          handleAmenityChange(amenity.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={amenity.id} 
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        {amenity.icon}
                        <span>{amenity.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort and Mobile Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <span className="text-muted-foreground">
                  {hotels.length} hotels found
                </span>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hotel Grid */}
            <div className="grid gap-6">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="group overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative md:w-80">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-48 md:h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {hotel.isRecommended && (
                        <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{hotel.name}</h3>
                          <div className="flex items-center text-muted-foreground text-sm mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {hotel.location}
                          </div>
                          {hotel.distance && (
                            <p className="text-sm text-muted-foreground">{hotel.distance}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {hotel.originalPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              ₹{hotel.originalPrice.toLocaleString()}
                            </p>
                          )}
                          <p className="text-2xl font-bold text-primary">
                            ₹{hotel.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">per night</p>
                        </div>
                      </div>

                      <div className="flex items-center mb-4">
                        <div className="flex mr-2">
                          {renderStars(hotel.rating)}
                        </div>
                        <span className="text-sm font-medium mr-2">{hotel.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({hotel.reviews} reviews)
                        </span>
                      </div>

                      <div className="flex items-center mb-4 space-x-3">
                        {hotel.amenities.slice(0, 4).map((amenity) => (
                          <div key={amenity} className="text-muted-foreground" title={amenity}>
                            {getAmenityIcon(amenity)}
                          </div>
                        ))}
                        {hotel.amenities.length > 4 && (
                          <span className="text-sm text-muted-foreground">
                            +{hotel.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button className="bg-primary hover:bg-primary-glow text-primary-foreground">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Hotels;
