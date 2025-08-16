import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, MessageCircle, MapPin, Lightbulb, Loader2, Send, Sparkles } from "lucide-react";

interface AssistanceResponse {
  response: string;
  category: string;
  confidence: number;
  relatedSuggestions: string[];
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistanceResponse | null>(null);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationInsights, setDestinationInsights] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userContext: { location, budget: budget ? Number(budget) : undefined }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResponse(data.data);
          toast({
            title: "AI Response Ready",
            description: `Category: ${data.data.category}`,
          });
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error("Failed to get AI response");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI assistance",
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistant">Travel Assistant</TabsTrigger>
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
                  <div className="flex gap-2">
                    <Badge variant="secondary">{response.category}</Badge>
                    <Badge variant={response.confidence > 80 ? "default" : "outline"}>
                      {response.confidence}% confidence
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{response.response}</p>
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
    </div>
  );
}