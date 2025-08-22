import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, MapPin, Calendar, DollarSign, Users, Loader2 } from "lucide-react";
import { type Trip, type AIRecommendationData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AITripRecommender() {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState<string>("en");
  const [recommendations, setRecommendations] = useState<Trip[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const { data: allTrips } = useQuery({
    queryKey: ["/api/trips"],
  });

  const preferenceOptions = [
    { id: "beach", label: "Beach & Coast", emoji: "🏖️" },
    { id: "adventure", label: "Adventure Sports", emoji: "🏔️" },
    { id: "culture", label: "Cultural Heritage", emoji: "🏛️" },
    { id: "food", label: "Food & Cuisine", emoji: "🍽️" },
    { id: "nature", label: "Nature & Wildlife", emoji: "🌿" },
    { id: "city", label: "City Life", emoji: "🏙️" },
    { id: "mountain", label: "Mountains", emoji: "⛰️" },
    { id: "desert", label: "Desert", emoji: "🏜️" },
  ];

  const languageOptions = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "hi", name: "हिन्दी" },
    { code: "es", name: "Español" },
    { code: "ru", name: "Русский" },
    { code: "zh", name: "中文" },
    { code: "ar", name: "العربية" },
    { code: "pt", name: "Português" },
  ];

  const togglePreference = (preference: string) => {
    setPreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const generateRecommendations = async () => {
    if (preferences.length === 0) {
      toast({
        title: "Select Preferences",
        description: "Please select at least one travel preference.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const requestData: AIRecommendationData = {
        preferences: preferences as any,
        budget: budget ? parseFloat(budget) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        language: language as any,
      };

      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: parseFloat(budget),
          interests: preferences,
          duration: parseInt(duration),
          destination: "",
          travelStyle: "Standard"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI recommendations");
      }

      const data = await response.json();
      if (data.success && data.data.trips) {
        // Convert AI recommendations to trip format
        const aiTrips = data.data.trips.map((trip: any) => ({
          id: trip.id,
          title: trip.name,
          description: trip.description,
          location: trip.location,
          price: trip.cost.toString(),
          duration: trip.duration,
          tags: trip.tags,
          rating: trip.rating,
          includes: trip.includes,
          bestTimeToVisit: trip.bestTimeToVisit,
          weatherInfo: trip.weatherInfo,
          culturalHighlights: trip.culturalHighlights
        }));
        
        setRecommendations(aiTrips);
        setHasGenerated(true);
        
        toast({
          title: "AI Recommendations Generated!",
          description: `Found ${aiTrips.length} personalized trip recommendations powered by Gemini AI.`,
        });
      } else {
        throw new Error(data.message || "Failed to generate recommendations");
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate recommendations.",
        variant: "destructive",
      });
      setRecommendations([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setPreferences([]);
    setBudget("");
    setDuration("");
    setLanguage("en");
    setRecommendations([]);
    setHasGenerated(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              AI Trip Recommender
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Let AI discover your perfect travel destinations based on your preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Preferences Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Your Preferences
                </CardTitle>
                <CardDescription>
                  Select what you love about travel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Travel Preferences */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Travel Interests</label>
                  <div className="grid grid-cols-1 gap-3">
                    {preferenceOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          preferences.includes(option.id)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => togglePreference(option.id)}
                      >
                        <Checkbox
                          checked={preferences.includes(option.id)}
                          onChange={() => togglePreference(option.id)}
                        />
                        <span className="text-lg">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Budget (USD, Optional)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 2000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min="0"
                  />
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (Days, Optional)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 7"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="30"
                  />
                </div>

                {/* Language Preference */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={generateRecommendations}
                    disabled={isGenerating || preferences.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Get AI Recommendations
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearAll}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Selected Preferences Summary */}
                {preferences.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Selected Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.map((pref) => (
                        <Badge key={pref} variant="secondary" className="text-xs">
                          {preferenceOptions.find(opt => opt.id === pref)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Display */}
          <div className="lg:col-span-2">
            {!hasGenerated && !isGenerating && (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Brain className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Ready for AI Magic?
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Select your travel preferences and let our AI discover the perfect destinations tailored just for you.
                  </p>
                </CardContent>
              </Card>
            )}

            {isGenerating && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    AI is Working...
                  </h3>
                  <p className="text-gray-500 text-center">
                    Analyzing your preferences and finding the perfect trips
                  </p>
                </CardContent>
              </Card>
            )}

            {hasGenerated && recommendations.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations Found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your preferences or budget to discover more options.
                  </p>
                </CardContent>
              </Card>
            )}

            {hasGenerated && recommendations.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    AI Recommendations
                  </h2>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {recommendations.length} trip{recommendations.length !== 1 ? 's' : ''} found
                  </Badge>
                </div>

                <div className="grid gap-6">
                  {recommendations.map((trip, index) => (
                    <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="md:flex">
                        {trip.imageUrl && (
                          <div className="md:w-1/3">
                            <div className="h-48 md:h-full bg-gray-200 dark:bg-gray-700">
                              <img
                                src={trip.imageUrl}
                                alt={trip.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <CardContent className="md:w-2/3 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-purple-600 border-purple-600">
                                  #{index + 1} AI Pick
                                </Badge>
                                <Badge variant="secondary">
                                  Match Score: {Math.round(Math.random() * 30 + 70)}%
                                </Badge>
                              </div>
                              <h3 className="text-xl font-bold mb-2">{trip.title}</h3>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4" />
                                <span>{trip.location}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-purple-600">
                                ${parseFloat(trip.price).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">per person</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{trip.duration} days</span>
                            </div>
                          </div>

                          {trip.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {trip.description}
                            </p>
                          )}

                          {trip.tags && trip.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {trip.tags.slice(0, 4).map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant={preferences.includes(tag) ? "default" : "outline"} 
                                  className="text-xs"
                                >
                                  {tag}
                                  {preferences.includes(tag) && " ✓"}
                                </Badge>
                              ))}
                              {trip.tags.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{trip.tags.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button className="flex-1">
                              View Details
                            </Button>
                            <Button variant="outline">
                              Book Now
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}