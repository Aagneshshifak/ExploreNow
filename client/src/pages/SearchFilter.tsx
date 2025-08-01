import { useState } from 'react';
import { Search, Filter, Star, MapPin, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const locations = [
  'All Locations',
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune',
  'Goa', 'Rajasthan', 'Kerala', 'Himachal Pradesh', 'Uttarakhand'
];

const durations = [
  { value: 'any', label: 'Any Duration' },
  { value: '1-3', label: '1-3 days' },
  { value: '4-7', label: '4-7 days' },
  { value: '8+', label: '8+ days' }
];

const mockResults = [
  {
    id: 1,
    title: 'Goa Beach Paradise',
    type: 'trip',
    price: 25000,
    rating: 4.5,
    location: 'Goa',
    duration: '5 days',
    description: 'Beautiful beaches, vibrant nightlife, and authentic Goan cuisine experience.'
  },
  {
    id: 2,
    title: 'Heritage Palace Hotel',
    type: 'hotel',
    price: 8500,
    rating: 4.7,
    location: 'Rajasthan',
    duration: 'per night',
    description: 'Luxury heritage hotel with royal treatment and traditional architecture.'
  },
  {
    id: 3,
    title: 'Mountain Adventure Trek',
    type: 'trip',
    price: 35000,
    rating: 4.8,
    location: 'Himachal Pradesh',
    duration: '8 days',
    description: 'Challenging mountain trek with breathtaking views and local culture.'
  },
  {
    id: 4,
    title: 'Urban Business Hotel',
    type: 'hotel',
    price: 5500,
    rating: 4.2,
    location: 'Mumbai',
    duration: 'per night',
    description: 'Modern hotel in the heart of the city with excellent business facilities.'
  },
  {
    id: 5,
    title: 'Kerala Backwaters Cruise',
    type: 'trip',
    price: 18000,
    rating: 4.6,
    location: 'Kerala',
    duration: '4 days',
    description: 'Serene backwaters cruise with traditional houseboat accommodation.'
  },
  {
    id: 6,
    title: 'Beachfront Resort',
    type: 'hotel',
    price: 12000,
    rating: 4.4,
    location: 'Goa',
    duration: 'per night',
    description: 'Luxury beachfront resort with spa, multiple pools, and water sports.'
  }
];

const SearchFilter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetRange, setBudgetRange] = useState([0]);
  const [selectedDuration, setSelectedDuration] = useState('any');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [minRating, setMinRating] = useState(0);
  const [results, setResults] = useState(mockResults);
  const [showFilters, setShowFilters] = useState(false);

  const maxBudget = 50000;

  const handleSearch = () => {
    let filteredResults = mockResults;

    // Filter by search query
    if (searchQuery.trim()) {
      filteredResults = filteredResults.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by budget
    if (budgetRange[0] > 0) {
      filteredResults = filteredResults.filter(item => item.price <= budgetRange[0]);
    }

    // Filter by location
    if (selectedLocation !== 'All Locations') {
      filteredResults = filteredResults.filter(item => item.location === selectedLocation);
    }

    // Filter by rating
    if (minRating > 0) {
      filteredResults = filteredResults.filter(item => item.rating >= minRating);
    }

    // Filter by duration (basic implementation)
    if (selectedDuration !== 'any') {
      filteredResults = filteredResults.filter(item => {
        if (selectedDuration === '1-3') return item.duration.includes('1') || item.duration.includes('2') || item.duration.includes('3');
        if (selectedDuration === '4-7') return item.duration.includes('4') || item.duration.includes('5') || item.duration.includes('6') || item.duration.includes('7');
        if (selectedDuration === '8+') return item.duration.includes('8') || item.duration.includes('9') || item.duration.includes('10');
        return true;
      });
    }

    setResults(filteredResults);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setBudgetRange([0]);
    setSelectedDuration('any');
    setSelectedLocation('All Locations');
    setMinRating(0);
    setResults(mockResults);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-foreground fill-current'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Search & Filter
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect trips and hotels tailored to your preferences and budget.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <Card className="border border-border bg-card shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by place, activity, or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-base"
                    aria-label="Search trips and hotels"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                    aria-label="Toggle filters"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                  <Button
                    onClick={handleSearch}
                    className="bg-foreground text-background hover:opacity-90 font-semibold"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="border border-border bg-card shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">Filters</CardTitle>
                <CardDescription>Narrow down your search results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Budget Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Budget (₹): {budgetRange[0] === 0 ? 'Any' : `₹${budgetRange[0].toLocaleString()}`}
                    </Label>
                    <Slider
                      value={budgetRange}
                      onValueChange={setBudgetRange}
                      max={maxBudget}
                      step={1000}
                      className="w-full"
                      aria-label="Budget range slider"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Duration</Label>
                    <RadioGroup value={selectedDuration} onValueChange={setSelectedDuration}>
                      {durations.map((duration) => (
                        <div key={duration.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={duration.value} id={duration.value} />
                          <Label htmlFor={duration.value} className="text-sm">
                            {duration.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Location */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger aria-label="Select location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      Minimum Rating: {minRating === 0 ? 'Any' : `${minRating}+ stars`}
                    </Label>
                    <Slider
                      value={[minRating]}
                      onValueChange={([value]) => setMinRating(value)}
                      max={5}
                      step={0.5}
                      className="w-full"
                      aria-label="Minimum rating slider"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="bg-foreground text-background hover:opacity-90">
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Search Results ({results.length})
              </h2>
            </div>

            {results.length === 0 ? (
              <Card className="border border-border bg-card">
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or filters to find what you're looking for.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item) => (
                  <Card key={item.id} className="border border-border bg-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                        {item.type === 'trip' ? (
                          <MapPin className="w-12 h-12 text-muted-foreground" />
                        ) : (
                          <DollarSign className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-card-foreground">{item.title}</CardTitle>
                        <Badge variant={item.type === 'trip' ? 'default' : 'outline'}>
                          {item.type}
                        </Badge>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">
                            ₹{item.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(item.rating)}
                          <span className="text-sm text-muted-foreground ml-1">
                            {item.rating}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.duration}
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        aria-label={`Explore ${item.title}`}
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;