import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Bot, MessageCircle, MapPin, Lightbulb, Loader2, Send, Sparkles, Bookmark, BookmarkCheck, Trash2, LogIn } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AssistanceResponse {
  response: string;
  category: string;
  confidence: number;
  relatedSuggestions: string[];
  query?: string;
  timestamp?: string;
}

interface SavedResponse {
  id: string;
  query: string;
  response: AssistanceResponse;
  savedAt: string;
}

export default function AIAssistant() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistanceResponse | null>(null);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationInsights, setDestinationInsights] = useState<any>(null);
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Load saved responses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aiAssistantBookmarks');
    if (saved) {
      try {
        setSavedResponses(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage
  const saveBookmark = () => {
    if (!response || !currentQuery) return;
    
    // Check if user is logged in
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    const newBookmark: SavedResponse = {
      id: Date.now().toString(),
      query: currentQuery,
      response: response,
      savedAt: new Date().toISOString()
    };
    
    const updated = [newBookmark, ...savedResponses];
    setSavedResponses(updated);
    localStorage.setItem('aiAssistantBookmarks', JSON.stringify(updated));
    
    toast({
      title: "Bookmark Saved",
      description: "Response saved to your bookmarks",
    });
  };

  // Delete bookmark
  const deleteBookmark = (id: string) => {
    const updated = savedResponses.filter(b => b.id !== id);
    setSavedResponses(updated);
    localStorage.setItem('aiAssistantBookmarks', JSON.stringify(updated));
    
    toast({
      title: "Bookmark Removed",
      description: "Response removed from bookmarks",
    });
  };

  // Check if current response is bookmarked
  const isBookmarked = () => {
    return savedResponses.some(b => b.query === currentQuery && b.response.response === response?.response);
  };

  // Format text to remove markdown bold syntax
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove ** bold markers
      .replace(/\*(.+?)\*/g, '$1') // Remove * italic markers
      .replace(/‑/g, '-') // Replace non-breaking hyphens
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a travel question.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null); // Clear previous response
    
    try {
      console.log("[AI ASSISTANT] Sending request:", { query: query.substring(0, 50) + "...", location, budget });
      
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userContext: { location, budget: budget ? Number(budget) : undefined }
        }),
      });

      console.log("[AI ASSISTANT] Response status:", res.status, res.statusText);

      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      
      if (!res.ok) {
        let errorMessage = `Request failed: ${res.status} ${res.statusText}`;
        
        if (isJson) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("[AI ASSISTANT] Error response:", errorData);
          } catch (parseError) {
            console.error("[AI ASSISTANT] Failed to parse error response");
            const text = await res.text();
            console.error("[AI ASSISTANT] Error response text:", text);
          }
        } else {
          const text = await res.text();
          console.error("[AI ASSISTANT] Non-JSON error response:", text);
        }
        
        throw new Error(errorMessage);
      }

      if (!isJson) {
        const text = await res.text();
        console.error("[AI ASSISTANT] Non-JSON response received:", text);
        throw new Error("Server returned an invalid response format");
      }

      const data = await res.json();
      console.log("[AI ASSISTANT] Response data:", { success: data.success, hasData: !!data.data });
      
      if (data.success && data.data) {
        setResponse(data.data);
        setCurrentQuery(query); // Save the query for bookmarking
        toast({
          title: "AI Response Ready",
          description: `Category: ${data.data.category || "General"}`,
        });
      } else {
        throw new Error(data.message || "Failed to get AI response");
      }
    } catch (error: any) {
      console.error("[AI ASSISTANT] Error occurred:", error);
      console.error("[AI ASSISTANT] Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Provide user-friendly error messages
      let errorTitle = "Error";
      let errorDescription = error.message || "Failed to get AI assistance";
      
      if (error.message?.includes("API key") || error.message?.includes("not configured")) {
        errorTitle = "Service Unavailable";
        errorDescription = "AI service is not configured. Please contact support.";
      } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
        errorTitle = "Service Limit Reached";
        errorDescription = "AI service quota exceeded. Please try again later.";
      } else if (error.message?.includes("network") || error.message?.includes("connect")) {
        errorTitle = "Connection Error";
        errorDescription = "Unable to connect to AI service. Please check your internet connection and try again.";
      } else if (error.message?.includes("Failed to fetch")) {
        errorTitle = "Network Error";
        errorDescription = "Unable to reach the server. Please check your connection and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationSubmit = async () => {
    if (!selectedDestination.trim()) return;

    setDestinationLoading(true);
    try {
      const res = await fetch(`/api/ai/destination/${encodeURIComponent(selectedDestination)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDestinationInsights(data.data);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error("Failed to get destination insights");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get destination insights",
        variant: "destructive",
      });
    } finally {
      setDestinationLoading(false);
    }
  };

  const popularDestinations = [
    "Paris, France", "Tokyo, Japan", "New York, USA", "Bali, Indonesia",
    "London, UK", "Rome, Italy", "Bangkok, Thailand", "Sydney, Australia"
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      {/* Blur Overlay for non-authenticated users */}
      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Sign In Required</CardTitle>
              <CardDescription className="text-base mt-2">
                Please sign in to access the AI Travel Assistant and save your personalized travel recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">With an account, you can:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Get AI-powered travel advice
                  </li>
                  <li className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-blue-500" />
                    Save your favorite responses
                  </li>
                  <li className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    Access personalized recommendations
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/login', { state: { from: { pathname: '/ai-assistant' } } })}
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/signup', { state: { from: { pathname: '/ai-assistant' } } })}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Create Account
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account? Sign up for free!
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login Banner for non-authenticated users - Hidden when overlay is shown */}
      {!user && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 opacity-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Sign in to unlock all features
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Save bookmarks, access personalized recommendations, and more!
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/login', { state: { from: { pathname: '/ai-assistant' } } })}
              variant="default"
              size="sm"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Bot className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Travel Assistant</h1>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get intelligent travel advice, personalized recommendations, and instant answers to your travel questions powered by advanced AI.
        </p>
      </div>

      <Tabs defaultValue="assistant" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assistant">Travel Assistant</TabsTrigger>
          <TabsTrigger value="bookmarks">
            Bookmarks ({savedResponses.length})
          </TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="insights">Destination Insights</TabsTrigger>
        </TabsList>

        {/* Travel Assistant Tab */}
        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Ask Your Travel Question
              </CardTitle>
              <CardDescription>
                Get personalized travel advice based on your preferences and needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Travel Question</label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about travel: destinations, planning, booking, cultural tips, best times to visit..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Current Location (Optional)</label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., New York"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Budget (Optional)</label>
                    <Input
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      type="number"
                      placeholder="e.g., 2000"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting AI Response...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Get AI Assistance
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Assistant Response */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Response</span>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveBookmark}
                      disabled={isBookmarked()}
                    >
                      {isBookmarked() ? (
                        <>
                          <BookmarkCheck className="h-4 w-4 mr-1" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Badge variant="secondary">{response.category}</Badge>
                    <Badge variant={response.confidence > 80 ? "default" : "outline"}>
                      {response.confidence}% confidence
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-6 rounded-lg border border-border">
                  <div className="prose prose-sm max-w-none text-foreground">
                    {formatText(response.response).split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4 last:mb-0 leading-relaxed text-base text-foreground">
                        {paragraph.split('\n').map((line, lineIdx) => (
                          <span key={lineIdx}>
                            {line}
                            {lineIdx < paragraph.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
                
                {response.relatedSuggestions && response.relatedSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Questions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.relatedSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setQuery(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Responses ({savedResponses.length})
              </CardTitle>
              <CardDescription>
                Your bookmarked AI travel assistance responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedResponses.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookmarks yet</p>
                  <p className="text-sm mt-2">Save helpful responses to access them later</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedResponses.map((saved) => (
                    <Card key={saved.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{saved.query}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Saved on {new Date(saved.savedAt).toLocaleDateString()} at {new Date(saved.savedAt).toLocaleTimeString()}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBookmark(saved.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 p-4 rounded-lg border border-border text-sm">
                          <div className="prose prose-sm max-w-none text-foreground">
                            {formatText(saved.response.response).split('\n\n').slice(0, 2).map((paragraph, idx) => (
                              <p key={idx} className="mb-2 last:mb-0 text-foreground">
                                {paragraph.length > 200 ? paragraph.substring(0, 200) + '...' : paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="secondary" className="text-xs">{saved.response.category}</Badge>
                          <Badge variant="outline" className="text-xs">{saved.response.confidence}% confidence</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Chat with AI
              </CardTitle>
              <CardDescription>
                Have a conversation with our AI travel expert (Feature coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chat functionality is being enhanced and will be available soon!</p>
                <p className="text-sm mt-2">Use the Travel Assistant tab for now to get AI help.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Destination Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Destination Insights
              </CardTitle>
              <CardDescription>
                Get comprehensive AI-powered insights about any destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Enter a destination</label>
                  <Input
                    placeholder="Type any destination (e.g., Paris, Tokyo, Bali)..."
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                  />
                </div>
                
                <Button onClick={handleDestinationSubmit} disabled={destinationLoading || !selectedDestination.trim()} className="w-full">
                  {destinationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Destination Insights
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Destination Insights Results */}
          {destinationInsights && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{destinationInsights.destination}</CardTitle>
                  <CardDescription>AI-Generated Destination Overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{destinationInsights.overview}</p>
                </CardContent>
              </Card>

              {destinationInsights.attractions && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Attractions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {destinationInsights.attractions.map((attraction: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            {attraction}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {destinationInsights.cuisine && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Local Cuisine</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {destinationInsights.cuisine.map((dish: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-600 rounded-full" />
                              {dish}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {destinationInsights.tips && (
                <Card>
                  <CardHeader>
                    <CardTitle>Insider Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {destinationInsights.tips.map((tip: string, index: number) => (
                        <li key={index} className="flex gap-3">
                          <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to save bookmarks and access personalized features. 
              Create a free account to unlock all features!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Browsing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/login', { state: { from: { pathname: '/ai-assistant' } } })}>
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}