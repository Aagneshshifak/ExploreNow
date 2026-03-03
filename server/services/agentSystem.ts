import OpenAI from "openai";
import { groqService } from "./groqService";

// Agent Types
export type AgentType = 
  | "orchestrator" 
  | "planning" 
  | "information" 
  | "booking" 
  | "translation" 
  | "currency"
  | "tool_executor";

// Agent Response Interface
export interface AgentResponse {
  agentType: AgentType;
  success: boolean;
  data: any;
  message: string;
  nextAgent?: AgentType;
  toolsUsed?: string[];
  confidence: number;
}

// Task Interface
export interface AgentTask {
  id: string;
  type: string;
  query: string;
  context?: any;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: any;
}

// Base Agent Class
export abstract class BaseAgent {
  protected name: string;
  protected type: AgentType;
  protected capabilities: string[];
  
  constructor(name: string, type: AgentType, capabilities: string[]) {
    this.name = name;
    this.type = type;
    this.capabilities = capabilities;
  }

  abstract canHandle(query: string, context?: any): boolean;
  abstract execute(query: string, context?: any): Promise<AgentResponse>;

  getName(): string {
    return this.name;
  }

  getType(): AgentType {
    return this.type;
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }
}

// Orchestrator Agent - Routes requests to appropriate agents
export class OrchestratorAgent extends BaseAgent {
  private agents: Map<AgentType, BaseAgent>;

  constructor() {
    super("Orchestrator", "orchestrator", [
      "route_requests",
      "coordinate_agents",
      "combine_results"
    ]);
    this.agents = new Map();
  }

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getType(), agent);
  }

  canHandle(query: string): boolean {
    return true; // Orchestrator handles all queries
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[ORCHESTRATOR] Analyzing query:", query.substring(0, 50) + "...");

    // Analyze query to determine which agent(s) to use
    const analysis = await this.analyzeQuery(query, context);
    
    console.log("[ORCHESTRATOR] Query analysis:", analysis);

    // Execute with appropriate agent(s)
    if (analysis.requiresMultipleAgents) {
      return await this.executeMultiAgentTask(query, analysis.agents, context);
    } else {
      return await this.executeSingleAgentTask(query, analysis.primaryAgent, context);
    }
  }

  private async analyzeQuery(query: string, context?: any): Promise<{
    primaryAgent: AgentType;
    agents: AgentType[];
    requiresMultipleAgents: boolean;
    reasoning: string;
  }> {
    const lowerQuery = query.toLowerCase();

    // Multi-agent scenarios
    if (lowerQuery.includes("plan") && (lowerQuery.includes("visa") || lowerQuery.includes("currency"))) {
      return {
        primaryAgent: "planning",
        agents: ["planning", "information", "currency"],
        requiresMultipleAgents: true,
        reasoning: "Trip planning with additional requirements"
      };
    }

    // Single agent scenarios
    if (lowerQuery.includes("translate") || lowerQuery.includes("translation")) {
      return {
        primaryAgent: "translation",
        agents: ["translation"],
        requiresMultipleAgents: false,
        reasoning: "Translation request"
      };
    }

    if (lowerQuery.includes("convert") && (lowerQuery.includes("currency") || lowerQuery.includes("usd") || lowerQuery.includes("eur"))) {
      return {
        primaryAgent: "currency",
        agents: ["currency"],
        requiresMultipleAgents: false,
        reasoning: "Currency conversion request"
      };
    }

    if (lowerQuery.includes("book") || lowerQuery.includes("reservation") || lowerQuery.includes("reserve")) {
      return {
        primaryAgent: "booking",
        agents: ["booking", "information"],
        requiresMultipleAgents: true,
        reasoning: "Booking request with information needs"
      };
    }

    if (lowerQuery.includes("hotel") || lowerQuery.includes("attraction") || lowerQuery.includes("restaurant") || lowerQuery.includes("about")) {
      return {
        primaryAgent: "information",
        agents: ["information"],
        requiresMultipleAgents: false,
        reasoning: "Information request"
      };
    }

    // Default to planning agent for trip-related queries
    return {
      primaryAgent: "planning",
      agents: ["planning"],
      requiresMultipleAgents: false,
      reasoning: "General travel planning request"
    };
  }

  private async executeSingleAgentTask(
    query: string, 
    agentType: AgentType, 
    context?: any
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentType);
    
    if (!agent) {
      return {
        agentType: "orchestrator",
        success: false,
        data: null,
        message: `Agent ${agentType} not available`,
        confidence: 0
      };
    }

    console.log(`[ORCHESTRATOR] Delegating to ${agentType} agent`);
    return await agent.execute(query, context);
  }

  private async executeMultiAgentTask(
    query: string,
    agentTypes: AgentType[],
    context?: any
  ): Promise<AgentResponse> {
    console.log(`[ORCHESTRATOR] Executing multi-agent task with: ${agentTypes.join(", ")}`);

    const results: AgentResponse[] = [];
    let combinedContext = { ...context };

    // Execute agents in sequence, passing context between them
    for (const agentType of agentTypes) {
      const agent = this.agents.get(agentType);
      
      if (agent) {
        const result = await agent.execute(query, combinedContext);
        results.push(result);
        
        // Add result to context for next agent
        combinedContext = {
          ...combinedContext,
          [`${agentType}_result`]: result.data
        };
      }
    }

    // Combine results
    return await this.combineResults(query, results);
  }

  private async combineResults(query: string, results: AgentResponse[]): Promise<AgentResponse> {
    console.log("[ORCHESTRATOR] Combining results from multiple agents");

    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return {
        agentType: "orchestrator",
        success: false,
        data: null,
        message: "All agents failed to process the request",
        confidence: 0
      };
    }

    // Combine data from all successful agents
    const combinedData = successfulResults.reduce((acc, result) => {
      return {
        ...acc,
        [result.agentType]: result.data
      };
    }, {});

    const toolsUsed = successfulResults.flatMap(r => r.toolsUsed || []);

    return {
      agentType: "orchestrator",
      success: true,
      data: combinedData,
      message: `Successfully processed request using ${successfulResults.length} agent(s)`,
      toolsUsed,
      confidence: Math.min(...successfulResults.map(r => r.confidence))
    };
  }
}

// Planning Agent - Handles trip planning
export class PlanningAgent extends BaseAgent {
  constructor() {
    super("Planning Agent", "planning", [
      "trip_planning",
      "itinerary_creation",
      "route_optimization",
      "budget_planning"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["plan", "trip", "itinerary", "visit", "travel to", "vacation", "tour"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[PLANNING AGENT] Processing trip planning request");

    try {
      // Enhance query to ensure comprehensive response like AI Assistant
      const enhancedQuery = `${query}

Please provide a comprehensive travel plan including:
- Transportation options with costs and durations
- Specific hotel recommendations across budget tiers
- Day-by-day itinerary with morning, afternoon, and evening activities
- Detailed budget breakdown by category
- Best time to visit with weather information
- Safety tips and required documents
- Local transportation options
- Restaurant recommendations
- Insider tips and hidden gems

Provide detailed, actionable information in a well-structured format.`;

      // Use existing groqService for trip planning
      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext, context?.db);

      return {
        agentType: "planning",
        success: true,
        data: result,
        message: "Trip plan generated successfully",
        toolsUsed: ["groq_ai", "web_search", "database"],
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[PLANNING AGENT] Error:", error);
      return {
        agentType: "planning",
        success: false,
        data: null,
        message: error.message || "Failed to generate trip plan",
        confidence: 0
      };
    }
  }
}

// Information Agent - Handles queries about destinations, hotels, etc.
export class InformationAgent extends BaseAgent {
  constructor() {
    super("Information Agent", "information", [
      "destination_info",
      "hotel_search",
      "attraction_details",
      "restaurant_recommendations"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["hotel", "attraction", "restaurant", "about", "information", "tell me", "what is"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[INFORMATION AGENT] Processing information request");

    try {
      // Enhance query to ensure comprehensive response
      const enhancedQuery = `${query}

Please provide comprehensive information including:
- Specific hotel names with ratings, prices, and amenities
- Top attractions with descriptions and entry fees
- Restaurant recommendations with cuisine types
- Best time to visit and weather information
- Transportation options and local transit
- Cultural highlights and insider tips
- Practical information for travelers

Provide detailed, specific information with real names and current data.`;

      // Use groqService for information queries
      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext, context?.db);

      return {
        agentType: "information",
        success: true,
        data: result,
        message: "Information retrieved successfully",
        toolsUsed: ["groq_ai", "web_search", "database"],
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[INFORMATION AGENT] Error:", error);
      return {
        agentType: "information",
        success: false,
        data: null,
        message: error.message || "Failed to retrieve information",
        confidence: 0
      };
    }
  }
}

// Booking Agent - Handles booking-related queries
export class BookingAgent extends BaseAgent {
  constructor() {
    super("Booking Agent", "booking", [
      "hotel_booking",
      "flight_booking",
      "activity_booking",
      "reservation_management"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["book", "reserve", "reservation", "booking"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[BOOKING AGENT] Processing booking request");

    try {
      // Enhance query for comprehensive booking guidance
      const enhancedQuery = `${query}

Provide comprehensive booking guidance including:
- Best booking platforms and websites
- Step-by-step booking process
- Tips for getting the best deals and discounts
- What to watch out for (hidden fees, cancellation policies)
- Best time to book for lowest prices
- Payment options and security tips
- Confirmation and documentation needed
- Customer service and support information

Give detailed, actionable advice with specific platform recommendations.`;

      // For now, provide booking guidance using AI
      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext, context?.db);

      return {
        agentType: "booking",
        success: true,
        data: result,
        message: "Booking guidance provided successfully",
        toolsUsed: ["groq_ai", "web_search"],
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[BOOKING AGENT] Error:", error);
      return {
        agentType: "booking",
        success: false,
        data: null,
        message: error.message || "Failed to process booking request",
        confidence: 0
      };
    }
  }
}

// Translation Agent - Handles translation requests
export class TranslationAgent extends BaseAgent {
  constructor() {
    super("Translation Agent", "translation", [
      "text_translation",
      "language_detection",
      "phrase_translation"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["translate", "translation", "how do you say", "in spanish", "in french"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[TRANSLATION AGENT] Processing translation request");

    try {
      // Enhance query for comprehensive translation
      const enhancedQuery = `${query}

Provide comprehensive translation including:
- Accurate translation with proper grammar
- Pronunciation guide (phonetic spelling)
- Cultural context and usage notes
- Formal vs informal variations if applicable
- Common phrases related to the translation
- Tips for using the phrase appropriately
- Regional variations if any

Make it practical and useful for travelers.`;

      // Use AI for translation
      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext);

      return {
        agentType: "translation",
        success: true,
        data: result,
        message: "Translation completed successfully",
        toolsUsed: ["groq_ai"],
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[TRANSLATION AGENT] Error:", error);
      return {
        agentType: "translation",
        success: false,
        data: null,
        message: error.message || "Failed to translate",
        confidence: 0
      };
    }
  }
}

// Currency Agent - Handles currency conversion
export class CurrencyAgent extends BaseAgent {
  constructor() {
    super("Currency Agent", "currency", [
      "currency_conversion",
      "exchange_rates",
      "budget_conversion"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["convert", "currency", "exchange rate", "usd", "eur", "gbp", "inr"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[CURRENCY AGENT] Processing currency conversion request");

    try {
      // Enhance query for comprehensive currency information
      const enhancedQuery = `${query}

Provide comprehensive currency information including:
- Current exchange rate with exact conversion
- Historical rate trends (if rates are favorable now)
- Best places to exchange currency (banks, ATMs, exchange offices)
- Tips for getting the best exchange rates
- Fees and commissions to watch out for
- Using credit cards vs cash abroad
- ATM withdrawal tips and fees
- Currency exchange apps and tools
- When to exchange (before travel vs at destination)

Give practical, money-saving advice for travelers.`;

      // Use AI for currency conversion with current rates
      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext);

      return {
        agentType: "currency",
        success: true,
        data: result,
        message: "Currency conversion completed successfully",
        toolsUsed: ["groq_ai", "web_search"],
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[CURRENCY AGENT] Error:", error);
      return {
        agentType: "currency",
        success: false,
        data: null,
        message: error.message || "Failed to convert currency",
        confidence: 0
      };
    }
  }
}

// Agent System Manager
export class AgentSystemManager {
  private orchestrator: OrchestratorAgent;
  private initialized: boolean = false;

  constructor() {
    this.orchestrator = new OrchestratorAgent();
  }

  initialize(): void {
    if (this.initialized) {
      console.log("[AGENT SYSTEM] Already initialized");
      return;
    }

    console.log("[AGENT SYSTEM] Initializing multi-agent system...");

    // Register all agents
    this.orchestrator.registerAgent(new PlanningAgent());
    this.orchestrator.registerAgent(new InformationAgent());
    this.orchestrator.registerAgent(new BookingAgent());
    this.orchestrator.registerAgent(new TranslationAgent());
    this.orchestrator.registerAgent(new CurrencyAgent());

    this.initialized = true;
    console.log("[AGENT SYSTEM] Multi-agent system initialized successfully");
  }

  async processQuery(query: string, context?: any): Promise<AgentResponse> {
    if (!this.initialized) {
      this.initialize();
    }

    console.log("[AGENT SYSTEM] Processing query:", query.substring(0, 50) + "...");
    return await this.orchestrator.execute(query, context);
  }

  getStatus(): { initialized: boolean; agentCount: number } {
    return {
      initialized: this.initialized,
      agentCount: 5 // Planning, Information, Booking, Translation, Currency
    };
  }
}

// Export singleton instance
export const agentSystem = new AgentSystemManager();
