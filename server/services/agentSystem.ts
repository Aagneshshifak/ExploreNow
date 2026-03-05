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

// Planning Agent - Handles trip planning with database access and booking capabilities
export class PlanningAgent extends BaseAgent {
  constructor() {
    super("Planning Agent", "planning", [
      "trip_planning",
      "hotel_search",
      "booking_assistance",
      "database_query"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["plan", "trip", "book", "hotel", "visit", "travel to", "vacation", "tour", "find"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[PLANNING AGENT] Processing request with database access");

    try {
      const db = context?.db;
      let responseText = "";
      const toolsUsed: string[] = ["groq_ai"];

      // Check if this is a vague request that needs clarification
      const needsClarification = this.needsClarification(query, context?.conversationHistory);
      
      if (needsClarification) {
        // Ask clarifying questions instead of providing full plan
        responseText = this.generateClarifyingQuestions(query);
        
        return {
          agentType: "planning",
          success: true,
          data: {
            response: responseText,
            confidence: 95
          },
          message: "Asking for clarification",
          toolsUsed: ["conversation"],
          confidence: 95
        };
      }

      // Check if query involves hotels
      if (query.toLowerCase().includes("hotel") || query.toLowerCase().includes("accommodation")) {
        toolsUsed.push("database");
        
        // Extract location from query (simple extraction)
        const locationMatch = query.match(/in\s+([A-Za-z\s,]+?)(?:\s|$|\.|\?)/i);
        const location = locationMatch ? locationMatch[1].trim() : null;

        if (location && db) {
          try {
            // Query actual hotels from database
            const { eq, like, desc } = await import("drizzle-orm");
            const { hotels } = await import("@shared/schema");
            
            const hotelResults = await db
              .select()
              .from(hotels)
              .where(like(hotels.location, `%${location}%`))
              .orderBy(desc(hotels.rating))
              .limit(5);

            if (hotelResults.length > 0) {
              responseText += `## Available Hotels in ${location}\n\n`;
              responseText += `I found ${hotelResults.length} hotels in our database:\n\n`;
              
              hotelResults.forEach((hotel: any, index: number) => {
                responseText += `### ${index + 1}. ${hotel.name}\n`;
                responseText += `- **Location**: ${hotel.location}\n`;
                responseText += `- **Rating**: ${hotel.rating || 'N/A'}/5 ⭐\n`;
                responseText += `- **Price**: $${hotel.price}/night\n`;
                responseText += `- **Amenities**: ${hotel.amenities?.join(', ') || 'Standard amenities'}\n`;
                if (hotel.description) {
                  responseText += `- **Description**: ${hotel.description}\n`;
                }
                responseText += `\n**To book this hotel**, visit: [Book ${hotel.name}](/hotels/${hotel.id})\n\n`;
              });

              responseText += `\n---\n\n`;
            } else {
              responseText += `I couldn't find hotels in "${location}" in our database. Let me search for general information:\n\n`;
            }
          } catch (dbError) {
            console.error("[PLANNING AGENT] Database error:", dbError);
            responseText += `Note: Unable to access hotel database at the moment.\n\n`;
          }
        }
      }

      // Check if query involves trips
      if (query.toLowerCase().includes("trip") || query.toLowerCase().includes("package") || query.toLowerCase().includes("available")) {
        toolsUsed.push("database");
        
        if (db) {
          try {
            const { trips } = await import("@shared/schema");
            const { desc, like, or } = await import("drizzle-orm");
            
            // Extract location from query - improved patterns
            let location = null;
            const lowerQuery = query.toLowerCase();
            
            console.log("[PLANNING AGENT] Original query:", query);
            console.log("[PLANNING AGENT] Lowercase query:", lowerQuery);
            
            // First, try specific patterns that are more precise
            const patterns = [
              // "make the goa package", "create goa package" - capture word before package/trip/tour
              /(?:make|create|plan|show|find|get|tell)\s+(?:the|a|an)?\s*([A-Za-z\s]+?)\s+(?:package|trip|tour)/i,
              // "in Goa", "to Paris", "for India"
              /(?:in|to|for)\s+([A-Za-z\s,]+?)(?:\s+package|\s+trip|\s+tour|\s|$|\.|\?)/i,
              // "Goa package", "Paris trip" - word directly before package/trip/tour
              /\b([A-Za-z]+)\s+(?:package|trip|tour)/i,
              // "package to Goa", "trip to Paris"
              /(?:package|trip|tour)\s+(?:to|for|in)\s+([A-Za-z\s,]+?)(?:\s|$|\.|\?)/i,
              // "available in India", "trips in Goa"
              /available\s+(?:in|for|to)\s+([A-Za-z\s,]+?)(?:\s|$|\.|\?)/i,
            ];
            
            for (let i = 0; i < patterns.length; i++) {
              const pattern = patterns[i];
              const match = query.match(pattern);
              console.log(`[PLANNING AGENT] Pattern ${i + 1} test:`, pattern, "Match:", match);
              if (match && match[1]) {
                location = match[1].trim();
                console.log(`[PLANNING AGENT] Raw extracted location:`, location);
                // Remove common words that might have been captured
                location = location.replace(/\b(the|a|an|make|create|plan|show|find|get|tell|available|trip|package|tour)\b/gi, '').trim();
                console.log(`[PLANNING AGENT] After cleanup:`, location);
                // Only accept if we have a valid location name (at least 3 chars)
                if (location.length >= 3) {
                  console.log(`[PLANNING AGENT] ✅ Pattern ${i + 1} matched: ${pattern}, extracted: "${location}"`);
                  break;
                } else {
                  console.log(`[PLANNING AGENT] ❌ Location too short, continuing...`);
                  location = null; // Reset if too short
                }
              }
            }
            
            console.log("[PLANNING AGENT] Final extracted location:", location);
            
            let tripQuery;
            
            if (location) {
              // Filter by location if specified
              tripQuery = db
                .select()
                .from(trips)
                .where(
                  or(
                    like(trips.location, `%${location}%`),
                    like(trips.title, `%${location}%`)
                  )
                )
                .orderBy(desc(trips.id))
                .limit(10);
            } else {
              // Show all trips if no location specified
              tripQuery = db
                .select()
                .from(trips)
                .orderBy(desc(trips.id))
                .limit(5);
            }
            
            const tripResults = await tripQuery;
            
            console.log("[PLANNING AGENT] Found trips:", tripResults.length);

            if (tripResults.length > 0) {
              responseText += `## Available Trip Packages${location ? ` for ${location}` : ''}\n\n`;
              responseText += `Found ${tripResults.length} trip${tripResults.length > 1 ? 's' : ''}:\n\n`;
              
              tripResults.forEach((trip: any, index: number) => {
                responseText += `### ${index + 1}. ${trip.title}\n`;
                responseText += `- **Destination**: ${trip.location}\n`;
                responseText += `- **Duration**: ${trip.duration} days\n`;
                responseText += `- **Price**: $${trip.price}\n`;
                if (trip.description) {
                  responseText += `- **Description**: ${trip.description}\n`;
                }
                responseText += `\n[Book ${trip.title}](/trips/${trip.id})\n\n`;
              });

              responseText += `\n---\n\n`;
            }
            
            // If location was specified but no trips found
            if (location && tripResults.length === 0) {
              responseText += `## No Trips Found for ${location}\n\n`;
              responseText += `We don't currently have pre-packaged trips for ${location}.\n\n`;
              responseText += `**What you can do:**\n`;
              responseText += `1. Browse all [Trip Packages](/trips)\n`;
              responseText += `2. Check [Hotels in ${location}](/hotels)\n`;
              responseText += `3. Tell me your budget, dates, and interests - I'll help create a custom plan\n\n`;
              
              // Don't call groqService if we already have a complete response
              return {
                agentType: "planning",
                success: true,
                data: {
                  response: responseText,
                  confidence: 90
                },
                message: "No trips found for location",
                toolsUsed,
                confidence: 90
              };
            }
          } catch (dbError) {
            console.error("[PLANNING AGENT] Database error:", dbError);
          }
        }
      }

      // Create enhanced query without emoji formatting and with conversation context
      let contextPrompt = "";
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        contextPrompt = "\n\nPREVIOUS CONVERSATION:\n";
        context.conversationHistory.forEach((msg: any) => {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}...\n`;
        });
        contextPrompt += "\nBased on this conversation history, answer the current question directly and concisely.\n";
      }

      const enhancedQuery = `${query}${contextPrompt}

CRITICAL INSTRUCTIONS - YOU ARE A CONVERSATIONAL ASSISTANT:
- Do NOT create itineraries or day-by-day plans
- Do NOT use emoji icons
- Do NOT use section headers like "Quick Overview", "Getting to Rome", etc.
- Do NOT create tables or detailed schedules
- ONLY answer the specific question asked in a conversational way
- Maximum 150 words
- Be friendly and helpful
- If you need more information, ask a follow-up question

${responseText ? `\nDatabase results:\n${responseText}\n\nProvide a brief conversational response about these options (max 100 words):` : 'Provide a brief, conversational response (max 150 words):'}`;

      // Use groqService for AI-generated content with strict conversational mode
      const result = await groqService.provideTravelAssistance(
        enhancedQuery, 
        context?.userContext, 
        context?.db,
        true // conversationalMode - prevents detailed itineraries
      );

      // Combine database results with AI response
      const finalResponse = responseText + result.response;

      return {
        agentType: "planning",
        success: true,
        data: {
          response: finalResponse,
          confidence: result.confidence
        },
        message: "Request processed with database access",
        toolsUsed,
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error("[PLANNING AGENT] Error:", error);
      return {
        agentType: "planning",
        success: false,
        data: null,
        message: error.message || "Failed to process request",
        confidence: 0
      };
    }
  }

  private needsClarification(query: string, conversationHistory?: any[]): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Check if it's a vague request without details
    const vaguePatterns = [
      /^i (want|need) to (go|travel|visit)/i,
      /^plan.*trip/i,
      /^help.*plan/i,
      /^going to/i
    ];
    
    const isVague = vaguePatterns.some(pattern => pattern.test(query));
    
    if (!isVague) return false;
    
    // Check if user has already provided details in conversation
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-3).map((m: any) => m.content.toLowerCase()).join(' ');
      
      // If they've already mentioned budget, days, or people, don't ask again
      if (recentMessages.includes('budget') || 
          recentMessages.includes('days') || 
          recentMessages.includes('people') ||
          recentMessages.includes('person')) {
        return false;
      }
    }
    
    // Check if query already has details
    const hasDetails = /\d+\s*(day|night|week|month|people|person|dollar|\$|usd|budget)/i.test(query);
    
    return !hasDetails;
  }

  private generateClarifyingQuestions(query: string): string {
    const destination = this.extractDestination(query);
    
    let response = `Great! I'd love to help you plan your trip${destination ? ` to ${destination}` : ''}!\n\n`;
    response += `To create the perfect itinerary for you, I need a few details:\n\n`;
    response += `**1. How many days** are you planning to travel?\n`;
    response += `**2. What's your budget** (approximate per person)?\n`;
    response += `**3. How many people** will be traveling?\n`;
    response += `**4. What are your interests?** (e.g., adventure, culture, relaxation, food)\n\n`;
    response += `---\n\n`;
    response += `**Meanwhile, you can explore:**\n`;
    response += `- [Trip Packages](/trips) - Pre-planned itineraries with pricing\n`;
    response += `- [Hotels](/hotels)${destination ? ` in ${destination}` : ''} - Browse accommodations\n`;
    response += `- [AI Assistant](/ai-assistant) - Get instant recommendations\n\n`;
    response += `Just answer the questions above, and I'll create a personalized plan for you!`;
    
    return response;
  }

  private extractDestination(query: string): string | null {
    // Try to extract destination from query
    const patterns = [
      /to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /visit\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
}

// Information Agent - Handles queries about destinations, hotels, etc. with database access
export class InformationAgent extends BaseAgent {
  constructor() {
    super("Information Agent", "information", [
      "destination_info",
      "hotel_search",
      "attraction_details",
      "database_query"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["hotel", "attraction", "restaurant", "about", "information", "tell me", "what is", "show me", "find"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[INFORMATION AGENT] Processing information request with database");

    try {
      const db = context?.db;
      let responseText = "";
      const toolsUsed: string[] = ["groq_ai"];

      // Search hotels in database
      if (query.toLowerCase().includes("hotel")) {
        toolsUsed.push("database");
        
        if (db) {
          try {
            const { hotels } = await import("@shared/schema");
            const { desc, like, or } = await import("drizzle-orm");
            
            // Extract search terms
            const searchTerms = query.toLowerCase().match(/hotel[s]?\s+(?:in\s+)?([a-z\s,]+)/i);
            
            let hotelQuery = db.select().from(hotels).orderBy(desc(hotels.rating)).limit(10);
            
            if (searchTerms && searchTerms[1]) {
              const location = searchTerms[1].trim();
              hotelQuery = db
                .select()
                .from(hotels)
                .where(
                  or(
                    like(hotels.location, `%${location}%`),
                    like(hotels.name, `%${location}%`)
                  )
                )
                .orderBy(desc(hotels.rating))
                .limit(10);
            }

            const hotelResults = await hotelQuery;

            if (hotelResults.length > 0) {
              responseText += `## Hotels from Our Database\n\n`;
              responseText += `Found ${hotelResults.length} hotels:\n\n`;
              
              hotelResults.forEach((hotel: any, index: number) => {
                responseText += `### ${index + 1}. ${hotel.name}\n`;
                responseText += `**Location**: ${hotel.location}\n`;
                responseText += `**Rating**: ${hotel.rating || 'N/A'}/5 ⭐ (${hotel.reviewCount || 0} reviews)\n`;
                responseText += `**Price**: $${hotel.price} per night\n`;
                if (hotel.amenities) {
                  responseText += `**Amenities**: ${Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : hotel.amenities}\n`;
                }
                if (hotel.description) {
                  responseText += `**About**: ${hotel.description}\n`;
                }
                responseText += `\n[View Details & Book](/hotels/${hotel.id})\n\n`;
              });

              responseText += `---\n\n`;
            }
          } catch (dbError) {
            console.error("[INFORMATION AGENT] Database error:", dbError);
          }
        }
      }

      // Search trips in database
      if (query.toLowerCase().includes("trip") || query.toLowerCase().includes("package") || query.toLowerCase().includes("tour")) {
        toolsUsed.push("database");
        
        if (db) {
          try {
            const { trips } = await import("@shared/schema");
            const { desc, like, or } = await import("drizzle-orm");
            
            const searchTerms = query.toLowerCase().match(/(?:trip|tour|package)[s]?\s+(?:to\s+)?([a-z\s,]+)/i);
            
            let tripQuery = db.select().from(trips).orderBy(desc(trips.id)).limit(10);
            
            if (searchTerms && searchTerms[1]) {
              const location = searchTerms[1].trim();
              tripQuery = db
                .select()
                .from(trips)
                .where(
                  or(
                    like(trips.location, `%${location}%`),
                    like(trips.title, `%${location}%`)
                  )
                )
                .orderBy(desc(trips.id))
                .limit(10);
            }

            const tripResults = await tripQuery;

            if (tripResults.length > 0) {
              responseText += `## Available Trip Packages\n\n`;
              responseText += `Found ${tripResults.length} trips:\n\n`;
              
              tripResults.forEach((trip: any, index: number) => {
                responseText += `### ${index + 1}. ${trip.title}\n`;
                responseText += `**Destination**: ${trip.location}\n`;
                responseText += `**Duration**: ${trip.duration} days\n`;
                responseText += `**Price**: $${trip.price}\n`;
                if (trip.description) {
                  responseText += `**Description**: ${trip.description}\n`;
                }
                responseText += `\n[View Details & Book](/trips/${trip.id})\n\n`;
              });

              responseText += `---\n\n`;
            }
          } catch (dbError) {
            console.error("[INFORMATION AGENT] Database error:", dbError);
          }
        }
      }

      // Create enhanced query with conversation context
      let contextPrompt = "";
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        contextPrompt = "\n\nPREVIOUS CONVERSATION:\n";
        context.conversationHistory.forEach((msg: any) => {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}...\n`;
        });
        contextPrompt += "\nUse this context to provide a relevant answer.\n";
      }

      const enhancedQuery = `${query}${contextPrompt}

IMPORTANT INSTRUCTIONS:
- Do NOT use emoji icons
- Be direct and specific
- Answer ONLY what is asked
- Keep response under 300 words unless more detail is requested
- Focus on the exact question
- Provide actionable information
${responseText ? `\nI've already provided database results above. Add brief context:` : ''}`;

      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext, context?.db);

      const finalResponse = responseText + result.response;

      return {
        agentType: "information",
        success: true,
        data: {
          response: finalResponse,
          confidence: result.confidence
        },
        message: "Information retrieved from database and AI",
        toolsUsed,
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

// Booking Agent - Handles booking-related queries and guides through website booking
export class BookingAgent extends BaseAgent {
  constructor() {
    super("Booking Agent", "booking", [
      "booking_guidance",
      "website_navigation",
      "booking_process",
      "database_query"
    ]);
  }

  canHandle(query: string): boolean {
    const keywords = ["book", "reserve", "reservation", "booking", "how to book", "purchase"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[BOOKING AGENT] Processing booking request");

    try {
      const db = context?.db;
      let responseText = "";
      const toolsUsed: string[] = ["groq_ai", "website_knowledge"];

      // Provide website-specific booking guidance
      responseText += `## How to Book on ExploreNow\n\n`;
      
      if (query.toLowerCase().includes("hotel")) {
        responseText += `### Booking a Hotel:\n\n`;
        responseText += `1. **Browse Hotels**: Visit the [Hotels Page](/hotels) to see all available hotels\n`;
        responseText += `2. **Filter & Search**: Use filters to find hotels by location, price, and rating\n`;
        responseText += `3. **View Details**: Click on any hotel to see full details, amenities, and reviews\n`;
        responseText += `4. **Select Dates**: Choose your check-in and check-out dates\n`;
        responseText += `5. **Book Now**: Click the "Book Now" button and complete the payment\n`;
        responseText += `6. **Confirmation**: You'll receive a booking confirmation via email\n\n`;

        // Show available hotels
        if (db) {
          try {
            const { hotels } = await import("@shared/schema");
            const { desc } = await import("drizzle-orm");
            
            const topHotels = await db
              .select()
              .from(hotels)
              .orderBy(desc(hotels.rating))
              .limit(5);

            if (topHotels.length > 0) {
              responseText += `### Top Rated Hotels Available Now:\n\n`;
              topHotels.forEach((hotel: any, index: number) => {
                responseText += `${index + 1}. **${hotel.name}** - ${hotel.location} (${hotel.rating}/5 ⭐) - $${hotel.price}/night\n`;
                responseText += `   [Book This Hotel](/hotels/${hotel.id})\n\n`;
              });
            }
          } catch (dbError) {
            console.error("[BOOKING AGENT] Database error:", dbError);
          }
        }
      }

      if (query.toLowerCase().includes("trip") || query.toLowerCase().includes("package")) {
        responseText += `### Booking a Trip Package:\n\n`;
        responseText += `1. **Browse Trips**: Visit the [Trips Page](/trips) to explore all trip packages\n`;
        responseText += `2. **Compare Options**: Review different destinations, durations, and prices\n`;
        responseText += `3. **View Itinerary**: Click on a trip to see the detailed day-by-day itinerary\n`;
        responseText += `4. **Check Availability**: Select your preferred travel dates\n`;
        responseText += `5. **Book Package**: Click "Book Now" and proceed to payment\n`;
        responseText += `6. **Receive Details**: Get your complete trip details and booking confirmation\n\n`;

        // Show available trips
        if (db) {
          try {
            const { trips } = await import("@shared/schema");
            const { desc } = await import("drizzle-orm");
            
            const topTrips = await db
              .select()
              .from(trips)
              .orderBy(desc(trips.id))
              .limit(5);

            if (topTrips.length > 0) {
              responseText += `### Popular Trip Packages:\n\n`;
              topTrips.forEach((trip: any, index: number) => {
                responseText += `${index + 1}. **${trip.title}** - ${trip.location} (${trip.duration} days) - $${trip.price}\n`;
                responseText += `   [Book This Trip](/trips/${trip.id})\n\n`;
              });
            }
          } catch (dbError) {
            console.error("[BOOKING AGENT] Database error:", dbError);
          }
        }
      }

      responseText += `### Additional Features:\n\n`;
      responseText += `- **Dashboard**: View all your bookings at [My Dashboard](/dashboard)\n`;
      responseText += `- **Payment Options**: We accept all major credit cards and PayPal\n`;
      responseText += `- **Cancellation**: Free cancellation up to 24 hours before check-in\n`;
      responseText += `- **Support**: Contact us anytime for booking assistance\n\n`;
      responseText += `---\n\n`;

      // Add AI-generated booking tips with conversation context
      let contextPrompt = "";
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        contextPrompt = "\n\nPREVIOUS CONVERSATION:\n";
        context.conversationHistory.forEach((msg: any) => {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}...\n`;
        });
      }

      const enhancedQuery = `${query}${contextPrompt}

IMPORTANT INSTRUCTIONS:
- Do NOT use emoji icons
- Focus on practical booking advice
- Answer ONLY what is asked
- Keep response brief and focused (under 200 words)
- Mention best times to book for deals
- Include tips for getting the best prices
- Be specific and actionable

I've already provided website-specific booking instructions above. Add brief general booking tips:`;

      const result = await groqService.provideTravelAssistance(enhancedQuery, context?.userContext);

      const finalResponse = responseText + result.response;

      return {
        agentType: "booking",
        success: true,
        data: {
          response: finalResponse,
          confidence: result.confidence
        },
        message: "Booking guidance provided with website navigation",
        toolsUsed,
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
    const keywords = ["translate", "translation", "how do you say", "in spanish", "in french", "language"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[TRANSLATION AGENT] Processing translation request");

    try {
      const enhancedQuery = `${query}

IMPORTANT INSTRUCTIONS:
- Do NOT use emoji icons
- Provide accurate translation
- Include pronunciation guide in parentheses
- Add cultural context if relevant
- Keep format clean and simple
- Answer ONLY what is asked
- Be brief and focused

Provide the translation with context:`;

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
    const keywords = ["convert", "currency", "exchange rate", "usd", "eur", "gbp", "inr", "dollar", "price"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    console.log("[CURRENCY AGENT] Processing currency conversion request");

    try {
      const enhancedQuery = `${query}

IMPORTANT INSTRUCTIONS:
- Do NOT use emoji icons
- Provide exact conversion with current rates
- Show the calculation clearly
- Include tips for best exchange rates
- Be direct and specific
- Answer ONLY what is asked
- Keep response brief (under 150 words)

Provide currency information:`;

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
