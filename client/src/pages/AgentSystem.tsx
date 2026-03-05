import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bot, 
  Loader2, 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign, 
  BookOpen,
  LogIn,
  Zap,
  Send,
  User,
  Trash2,
  MessageSquare,
  Plus,
  History
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agentType?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface AgentResponse {
  agentType: string;
  success: boolean;
  data: any;
  message: string;
  toolsUsed?: string[];
  confidence: number;
  multiAgent?: boolean;
}

export default function AgentSystem() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agentSystemConversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0 && !currentConversationId) {
          setCurrentConversationId(parsed[0].id);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('agentSystemConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConversations([newConv, ...conversations]);
    setCurrentConversationId(newConv.id);
    toast({
      title: "New Conversation",
      description: "Started a new conversation",
    });
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (currentConversationId === id) {
      setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem('agentSystemConversations', JSON.stringify(updated));
    toast({
      title: "Conversation Deleted",
      description: "Conversation removed from history",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter your travel question.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is logged in
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Create new conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: query.substring(0, 50) + (query.length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setConversations([newConv, ...conversations]);
      convId = newConv.id;
      setCurrentConversationId(convId);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toISOString()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === convId) {
        // Update title if it's the first message
        const newTitle = conv.messages.length === 0 
          ? query.substring(0, 50) + (query.length > 50 ? "..." : "")
          : conv.title;
        
        return {
          ...conv,
          title: newTitle,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return conv;
    }));

    setQuery("");
    setLoading(true);
    
    try {
      console.log("[AGENT SYSTEM UI] Sending request:", query.substring(0, 50) + "...");
      
      // Get conversation history for context
      const conversationHistory = currentConversation?.messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];
      
      const res = await fetch("/api/ai/agent-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversationHistory, // Pass conversation history
          userContext: {}
        }),
      });

      console.log("[AGENT SYSTEM UI] Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to process request");
      }

      const data = await res.json();
      console.log("[AGENT SYSTEM UI] Response data:", data);
      
      if (data.success && data.data) {
        // Extract response text
        let responseText = "";
        let agentType = data.data.agentType || "assistant";
        
        if (data.data.data && typeof data.data.data === 'object' && data.data.data.response) {
          responseText = data.data.data.response;
        } else if (data.data.response && typeof data.data.response === 'string') {
          responseText = data.data.response;
        } else {
          responseText = "I received your request but couldn't generate a proper response. Please try again.";
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
          agentType: agentType
        };

        setConversations(prev => prev.map(conv => {
          if (conv.id === convId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        }));
        
        toast({
          title: "Response Received",
          description: `Processed by ${agentType} agent`,
        });
      } else {
        throw new Error(data.message || "Failed to process request");
      }
    } catch (error: any) {
      console.error("[AGENT SYSTEM UI] Error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">{/* Increased from max-w-7xl */}
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
            AI Travel Assistant
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powered by multiple specialized AI agents working together to plan your perfect trip
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History ({conversations.length})
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sidebar - Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conversations</CardTitle>
                  <Button size="sm" variant="ghost" onClick={createNewConversation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conv.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                      }`}
                      onClick={() => setCurrentConversationId(conv.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {conv.messages.length} messages
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      {currentConversation?.title || "New Conversation"}
                    </CardTitle>
                    <CardDescription>
                      Chat with specialized AI travel agents
                    </CardDescription>
                  </div>
                  {!user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/login', { state: { from: { pathname: '/agent-system' } } })}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="p-0">
                <div className="h-[650px] overflow-y-auto p-6 space-y-4">{/* Increased from 500px to 650px */}
                  {!currentConversation || currentConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Ask me anything about travel planning, destinations, hotels, or get personalized recommendations
                      </p>
                    </div>
                  ) : (
                    <>
                      {currentConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0 border-b border-border pb-1" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                                    p: ({node, ...props}) => <p className="text-base leading-relaxed mb-2 font-medium" {...props} />,
                                    ul: ({node, ...props}) => <ul className="space-y-1 ml-4 mb-2 list-disc" {...props} />,
                                    ol: ({node, ...props}) => <ol className="space-y-1 ml-4 mb-2 list-decimal" {...props} />,
                                    li: ({node, ...props}) => <li className="text-base leading-relaxed font-medium" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                                    code: ({node, inline, ...props}: any) => 
                                      inline ? (
                                        <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono" {...props} />
                                      ) : (
                                        <code className="block p-2 bg-muted rounded text-xs font-mono overflow-x-auto" {...props} />
                                      ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-base font-medium">{message.content}</p>
                            )}
                            <p className="text-xs opacity-70 mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about travel destinations, hotels, planning tips..."
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button type="submit" disabled={loading || !query.trim()} size="lg">
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Conversation History ({conversations.length})
              </CardTitle>
              <CardDescription>
                View and manage your past conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation history yet</p>
                  <p className="text-sm mt-2">Start chatting to build your history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conv) => (
                    <Card key={conv.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{conv.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {conv.messages.length} messages • Last updated {new Date(conv.updatedAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentConversationId(conv.id);
                                // Switch to chat tab
                                const chatTab = document.querySelector('[value="chat"]') as HTMLElement;
                                chatTab?.click();
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteConversation(conv.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {conv.messages.length > 0 && (
                        <CardContent>
                          <div className="bg-muted/50 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Last message:</p>
                            <p className="text-muted-foreground line-clamp-2">
                              {conv.messages[conv.messages.length - 1].content}
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                type: "planning", 
                name: "Planning Agent", 
                icon: Calendar, 
                desc: "Creates comprehensive trip itineraries with day-by-day plans",
                color: "bg-blue-100 dark:bg-blue-900"
              },
              { 
                type: "information", 
                name: "Information Agent", 
                icon: BookOpen, 
                desc: "Provides detailed information about hotels, attractions, and destinations",
                color: "bg-green-100 dark:bg-green-900"
              },
              { 
                type: "booking", 
                name: "Booking Agent", 
                icon: MapPin, 
                desc: "Guides you through booking processes and finds the best deals",
                color: "bg-purple-100 dark:bg-purple-900"
              },
              { 
                type: "currency", 
                name: "Currency Agent", 
                icon: DollarSign, 
                desc: "Handles currency conversions and provides money-saving tips",
                color: "bg-yellow-100 dark:bg-yellow-900"
              },
            ].map((agent) => (
              <Card key={agent.type} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg ${agent.color} flex items-center justify-center`}>
                      <agent.icon className="h-6 w-6 text-black dark:text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">{agent.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-Powered
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Ask Your Question</p>
                  <p className="text-sm text-muted-foreground">Type your travel query in natural language</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">AI Routes to Best Agent</p>
                  <p className="text-sm text-muted-foreground">Our orchestrator selects the most suitable specialized agent</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Get Comprehensive Answer</p>
                  <p className="text-sm text-muted-foreground">Receive detailed, actionable travel information</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              You need to sign in to use the AI Travel Assistant and save your conversation history. 
              Create a free account to unlock all features!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Browsing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/login', { state: { from: { pathname: '/agent-system' } } })}>
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
