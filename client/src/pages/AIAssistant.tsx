import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, MessageCircle, MapPin, Lightbulb, Loader2, Send, Sparkles } from "lucide-react";

// Schemas
const assistantSchema = z.object({
  query: z.string().min(1, "Please enter your travel question"),
  location: z.string().optional(),
  budget: z.string().optional(),
  travelDates: z.string().optional(),
  groupSize: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().min(1, "Please enter a message"),
});

type AssistantFormData = z.infer<typeof assistantSchema>;
type ChatFormData = z.infer<typeof chatSchema>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  category?: string;
  confidence?: number;
}

interface TravelAssistance {
  query: string;
  response: string;
  category: 'planning' | 'booking' | 'destination' | 'general';
  confidence: number;
  relatedSuggestions: string[];
  aiPowered: boolean;
  timestamp: string;
}

interface DestinationInsights {
  destination: string;
  overview: string;
  attractions: string[];
  cuisine: string[];
  culture: string;
  budget: {
    low: string;
    medium: string;
    high: string;
  };
  bestTime: string;
  tips: string[];
  aiPowered: boolean;
  generatedAt: string;
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [selectedDestination, setSelectedDestination] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assistantForm = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      query: "",
      location: "",
      budget: "",
      travelDates: "",
      groupSize: "",
    },
  });

  const chatForm = useForm<ChatFormData>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: "",
    },
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Travel Assistant Mutation
  const assistantMutation = useMutation({
    mutationFn: async (data: AssistantFormData) => {
      const userContext = {
        location: data.location,
        budget: data.budget ? Number(data.budget) : undefined,
        travelDates: data.travelDates,
        groupSize: data.groupSize ? Number(data.groupSize) : undefined,
      };

      return apiRequest("/api/ai/assistant", {
        method: "POST",
        body: JSON.stringify({
          query: data.query,
          userContext,
        }),
      });
    },
    onSuccess: (data: TravelAssistance) => {
      toast({
        title: "AI Response Ready",
        description: `Confidence: ${data.confidence}% | Category: ${data.category}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to get AI assistance",
        variant: "destructive",
      });
    },
  });

  // Chat Mutation
  const chatMutation = useMutation({
    mutationFn: async (data: ChatFormData) => {
      return apiRequest("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: data.message,
          conversationHistory: chatHistory,
          userLocation: assistantForm.getValues("location"),
          userBudget: assistantForm.getValues("budget"),
          userTravelDates: assistantForm.getValues("travelDates"),
          userGroupSize: assistantForm.getValues("groupSize"),
        }),
      });
    },
    onSuccess: (response: any) => {
      const userMessage: ChatMessage = {
        role: 'user',
        content: chatForm.getValues("message"),
        timestamp: new Date().toISOString(),
      };
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        category: response.category,
        confidence: response.confidence,
      };

      setChatHistory(prev => [...prev, userMessage, assistantMessage]);
      chatForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error?.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Destination Insights Query
  const { data: destinationInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/ai/destination', selectedDestination],
    enabled: !!selectedDestination,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const onAssistantSubmit = (data: AssistantFormData) => {
    assistantMutation.mutate(data);
  };

  const onChatSubmit = (data: ChatFormData) => {
    if (data.message.trim()) {
      chatMutation.mutate(data);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    chatForm.setValue("message", suggestion);
    chatMutation.mutate({ message: suggestion });
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
              <Form {...assistantForm}>
                <form onSubmit={assistantForm.handleSubmit(onAssistantSubmit)} className="space-y-4">
                  <FormField
                    control={assistantForm.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Travel Question</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Ask anything about travel: destinations, planning, booking, cultural tips, best times to visit..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={assistantForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Location (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., New York" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={assistantForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="e.g., 2000" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={assistantForm.control}
                      name="travelDates"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Travel Dates (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., March 2024" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={assistantForm.control}
                      name="groupSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Size (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="e.g., 2" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={assistantMutation.isPending} className="w-full">
                    {assistantMutation.isPending ? (
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
              </Form>
            </CardContent>
          </Card>

          {/* Assistant Response */}
          {assistantMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Response</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{assistantMutation.data.category}</Badge>
                    <Badge variant={assistantMutation.data.confidence > 80 ? "default" : "outline"}>
                      {assistantMutation.data.confidence}% confidence
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{assistantMutation.data.response}</p>
                </div>
                
                {assistantMutation.data.relatedSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Questions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {assistantMutation.data.relatedSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => assistantForm.setValue("query", suggestion)}
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
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Chat with AI
              </CardTitle>
              <CardDescription>
                Have a conversation with our AI travel expert
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4 mb-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with your AI travel assistant!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.role === 'assistant' && message.confidence && (
                            <div className="mt-2 flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {message.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {message.confidence}% confidence
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <Form {...chatForm}>
                <form onSubmit={chatForm.handleSubmit(onChatSubmit)} className="flex gap-2">
                  <FormField
                    control={chatForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Type your travel question..."
                            disabled={chatMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={chatMutation.isPending} size="icon">
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>
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
                  <label className="text-sm font-medium mb-2 block">Choose a destination</label>
                  <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a destination or type a custom one" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularDestinations.map((dest) => (
                        <SelectItem key={dest} value={dest}>
                          {dest}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Input
                    placeholder="Or type a custom destination..."
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Insights Results */}
          {insightsLoading && (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Generating AI insights for {selectedDestination}...</p>
              </CardContent>
            </Card>
          )}

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

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Attractions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {destinationInsights.attractions.map((attraction, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          {attraction}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Local Cuisine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {destinationInsights.cuisine.map((dish, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          {dish}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Budget Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Budget:</span>
                      <span>{destinationInsights.budget.low}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Mid-range:</span>
                      <span>{destinationInsights.budget.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Luxury:</span>
                      <span>{destinationInsights.budget.high}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Time to Visit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{destinationInsights.bestTime}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cultural Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{destinationInsights.culture}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insider Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {destinationInsights.tips.map((tip, index) => (
                      <li key={index} className="flex gap-3">
                        <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}