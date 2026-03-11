import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, DollarSign, Filter, Loader2 } from "lucide-react";
import { type Trip, type TripFilterData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SearchFilter() {
  const [filters, setFilters] = useState<TripFilterData>({
    country: "",
    minPrice: undefined,
    maxPrice: undefined,
    minDuration: undefined,
    maxDuration: undefined,
    tags: [],
  });
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const { toast } = useToast();

  const { data: allTrips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["/api/trips"],
  });

  const searchTrips = async () => {
    setIsSearching(true);
    try {
      // Build filter data, removing empty values
      const filterData: TripFilterData = {};
      if (filters.country?.trim()) filterData.country = filters.country.trim();
      if (filters.minPrice !== undefined && filters.minPrice > 0) filterData.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) filterData.maxPrice = filters.maxPrice;
      if (filters.minDuration !== undefined && filters.minDuration > 0) filterData.minDuration = filters.minDuration;
      if (filters.maxDuration !== undefined && filters.maxDuration > 0) filterData.maxDuration = filters.maxDuration;
      if (filters.tags && filters.tags.length > 0) filterData.tags = filters.tags;

      const response = await apiRequest("/api/trips/filter", "POST", filterData);
      setSearchResults(response.data || []);
      setHasSearched(true);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Unable to filter trips.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      country: "",
      minPrice: undefined,
      maxPrice: undefined,
      minDuration: undefined,
      maxDuration: undefined,
      tags: [],
    });
    setSelectedTag("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags?.includes(tag)) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), tag],
      });
      setSelectedTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters({
      ...filters,
      tags: filters.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const displayTrips = hasSearched ? searchResults : ((allTrips as any)?.data || []);
  const isLoading = isLoadingTrips || isSearching;

  // Common travel tags for quick selection
  const commonTags = [
    "adventure", "beach", "mountain", "culture", "food", "nature", 
    "luxury", "budget", "family", "romance", "wildlife", "historical",
    "city", "desert", "tropical", "winter", "summer"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Search & Filter Trips
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find your perfect adventure with our advanced search filters
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Refine your search results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Country Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Country/Location</label>
                  <Input
                    placeholder="e.g., India, USA, Japan"
                    value={filters.country || ""}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range ($)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      min="0"
                      value={filters.minPrice || ""}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        minPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      min="0"
                      value={filters.maxPrice || ""}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                  </div>
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (Days)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      min="1"
                      value={filters.minDuration || ""}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        minDuration: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      min="1"
                      value={filters.maxDuration || ""}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        maxDuration: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                    />
                  </div>
                </div>

                {/* Tag Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Trip Type</label>
                  <Select value={selectedTag} onValueChange={addTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {commonTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Tags */}
                  {filters.tags && filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={searchTrips}
                    disabled={isSearching}
                    className="w-full"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Apply Filters
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>

                {/* Filter Summary */}
                <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
                  {hasSearched ? (
                    <>Showing {searchResults.length} filtered results</>
                  ) : (
                    <>Showing all {(allTrips as any)?.data?.length || 0} trips</>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayTrips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    {hasSearched ? "No trips found" : "No trips available"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {hasSearched 
                      ? "Try adjusting your filters to see more results"
                      : "There are currently no trips available"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayTrips.map((trip: Trip) => (
                  <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {trip.imageUrl && (
                      <div className="h-48 bg-gray-200 dark:bg-gray-700">
                        <img
                          src={trip.imageUrl}
                          alt={trip.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg line-clamp-2">{trip.title}</h3>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ${parseFloat(trip.price).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">per person</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{trip.location}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{trip.duration} days</span>
                        </div>
                      </div>

                      {trip.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {trip.description}
                        </p>
                      )}

                      {trip.tags && trip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {trip.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {trip.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{trip.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button className="w-full" size="sm">
                        View Details
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
}