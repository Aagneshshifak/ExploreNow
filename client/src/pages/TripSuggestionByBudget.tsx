import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Search, MapPin, Calendar, Star, Users } from "lucide-react";
import { type Trip } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TripSuggestionByBudget() {
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const { data: allTrips } = useQuery({
    queryKey: ["/api/trips"],
  });

  const searchByBudget = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest("/api/trips/budget", "POST", {
        budget: parseFloat(budget),
        currency,
      });
      setSearchResults(response.data || []);
      setHasSearched(true);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Unable to search trips by budget.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchByBudget();
    }
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Find Trips by Budget
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover amazing destinations that fit perfectly within your budget
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Search
            </CardTitle>
            <CardDescription>
              Enter your budget to find trips that match your spending limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Maximum Budget
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onKeyPress={handleKeyPress}
                  min="0"
                  step="10"
                />
              </div>
              
              <div className="w-24">
                <label className="text-sm font-medium mb-2 block">
                  Currency
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={searchByBudget} 
                disabled={isSearching || !budget}
                className="px-8"
              >
                {isSearching ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Budget Tips */}
        <Card className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Budget Planning</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Include accommodation, meals, activities, and transport in your budget
                </p>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Flexible Dates</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Travel during off-peak seasons for better deals and lower costs
                </p>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Local Experiences</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Consider local destinations to maximize your budget's value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Search Results
              </h2>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {searchResults.length} trip{searchResults.length !== 1 ? 's' : ''} found
              </Badge>
            </div>

            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No trips found</h3>
                    <p>
                      No trips found within your budget of ${budget}. 
                      Try increasing your budget or check out our affordable options.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((trip) => (
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
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg line-clamp-2">{trip.title}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${formatPrice(trip.price)}
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

                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                        <div className="text-center">
                          <Badge 
                            variant="secondary" 
                            className="text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300"
                          >
                            Within Budget
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Trips Preview */}
        {!hasSearched && allTrips?.data && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              All Available Trips
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTrips.data.slice(0, 6).map((trip: Trip) => (
                <Card key={trip.id} className="overflow-hidden">
                  {trip.imageUrl && (
                    <div className="h-32 bg-gray-200 dark:bg-gray-700">
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
                    <h3 className="font-semibold mb-2 line-clamp-1">{trip.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.location}
                      </span>
                      <span className="font-bold text-lg text-blue-600">
                        ${formatPrice(trip.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}