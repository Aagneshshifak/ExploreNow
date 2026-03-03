import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bot, 
  Loader2, 
  Sparkles, 
  Network, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Languages, 
  BookOpen,
  LogIn,
  Zap
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [agentsUsed, setAgentsUsed] = useState<string[]>([]);

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

    setLoading(true);
    setResponse(null);
    setAgentsUsed([]);
    
    try {
      console.log("[AGENT SYSTEM UI] Sending request:", query.substring(0, 50) + "...");
      
      const res = await fetch("/api/ai/agent-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
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
        setResponse(data.data);
        
        // Extract agents used
        const agents: string[] = [];
        if (data.data.agentType) {
          agents.push(data.data.agentType);
        }
        if (data.data.data && typeof data.data.data === 'object') {
          Object.keys(data.data.data).forEach(key => {
            if (!agents.includes(key)) {
              agents.push(key);
            }
          });
        }
        setAgentsUsed(agents);
        
        toast({
          title: "Request Processed",
          description: `Processed by ${agents.length} agent(s)`,
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

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case "planning": return <Calendar className="h-4 w-4" />;
      case "information": return <BookOpen className="h-4 w-4" />;
      case "booking": return <MapPin className="h-4 w-4" />;
      case "currency": return <DollarSign className="h-4 w-4" />;
      case "translation": return <Languages className="h-4 w-4" />;
      case "orchestrator": return <Network className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case "planning": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "information": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "booking": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "currency": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "translation": return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300";
      case "orchestrator": return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const renderAgentResponse = (agentType: string, data: any) => {
    if (!data) return null;

    // If data has a response field (from groqService), render it
    if (data.response && typeof data.response === 'string') {
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-primary mt-6 mb-4 first:mt-0" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-primary mt-6 mb-3 first:mt-0 border-b border-border pb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="text-base leading-relaxed text-foreground mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="space-y-2 ml-6 mb-4 list-disc marker:text-primary" {...props} />,
              ol: ({node, ...props}) => <ol className="space-y-2 ml-6 mb-4 list-decimal marker:text-primary" {...props} />,
              li: ({node, ...props}) => <li className="text-base leading-relaxed text-foreground pl-2" {...props} />,
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full border-collapse border border-border rounded-lg" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-muted" {...props} />,
              tbody: ({node, ...props}) => <tbody className="divide-y divide-border" {...props} />,
              tr: ({node, ...props}) => <tr className="hover:bg-muted/50 transition-colors" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border border-border" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-foreground border border-border" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
              code: ({node, inline, ...props}: any) => 
                inline ? (
                  <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-primary" {...props} />
                ) : (
                  <code className="block p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                ),
            }}
          >
            {data.response}
          </ReactMarkdown>
        </div>
      );
    }

    // Otherwise, render as JSON
    return (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Auth Check */}
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
                Please sign in to access the Multi-Agent AI System.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/login', { state: { from: { pathname: '/agent-system' } } })}
                className="w-full"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Network className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Multi-Agent AI System</h1>
          <Zap className="h-6 w-6 text-yellow-500" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the power of collaborative AI agents working together to solve your travel needs.
        </p>
      </div>

      {/* Agent Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { type: "planning", name: "Planning", icon: Calendar },
          { type: "information", name: "Information", icon: BookOpen },
          { type: "booking", name: "Booking", icon: MapPin },
          { type: "currency", name: "Currency", icon: DollarSign },
          { type: "translation", name: "Translation", icon: Languages },
        ].map((agent) => (
          <Card key={agent.type} className="text-center">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${getAgentColor(agent.type)} flex items-center justify-center`}>
                <agent.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{agent.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Query Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ask Anything
          </CardTitle>
          <CardDescription>
            Our AI agents will collaborate to provide the best answer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'Plan a 5-day trip to Japan with visa info and currency conversion' or 'Translate hello to Spanish' or 'Find hotels in Paris'"
              className="min-h-[100px]"
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing with AI Agents...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-2" />
                  Process with Multi-Agent System
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                <span>Multi-Agent Response</span>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {agentsUsed.map((agent) => (
                  <Badge key={agent} className={`gap-1 ${getAgentColor(agent)}`}>
                    {getAgentIcon(agent)}
                    {agent}
                  </Badge>
                ))}
                <Badge variant={response.confidence > 80 ? "default" : "outline"}>
                  {response.confidence}% confidence
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 max-h-[600px] overflow-y-auto">
            {/* Render response based on structure */}
            {response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(response.data).map(([agentType, agentData]) => (
                  <div key={agentType} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getAgentColor(agentType)}>
                        {getAgentIcon(agentType)}
                        {agentType} Agent
                      </Badge>
                    </div>
                    {renderAgentResponse(agentType, agentData)}
                  </div>
                ))}
              </div>
            ) : (
              renderAgentResponse(response.agentType, response.data)
            )}

            {/* Tools Used */}
            {response.toolsUsed && response.toolsUsed.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Tools Used:</p>
                <div className="flex gap-2 flex-wrap">
                  {response.toolsUsed.map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Powered by Multi-Agent AI
              </span>
              <span className="text-xs">
                {agentsUsed.length} agent(s) collaborated
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
