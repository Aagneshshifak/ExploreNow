import OpenAI from "openai";

// Lazy initialization of Groq AI client (OpenAI-compatible)
let groqClient: OpenAI | null = null;

function getGroqClient(): OpenAI {
  if (groqClient) {
    return groqClient;
  }

  // Initialize if not already done
  let apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("[GROQ] API key is not configured in environment variables");
    throw new Error("GROQ_API_KEY is not set. Please configure it in your .env file.");
  }
  
  // Remove quotes if present (common in .env files)
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  
  if (!apiKey || apiKey.length === 0) {
    console.error("[GROQ] API key is empty after trimming");
    throw new Error("GROQ_API_KEY is not set. Please configure it in your .env file.");
  }
  
  console.log("[GROQ] Initializing Groq client (API key length:", apiKey.length, "characters)");
  
  try {
    groqClient = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    console.log("[GROQ] Client initialized successfully");
    return groqClient;
  } catch (initError: any) {
    console.error("[GROQ] Failed to initialize Groq AI:", initError?.message);
    throw new Error(`Failed to initialize Groq AI: ${initError?.message || "Unknown error"}`);
  }
}

export interface TripRecommendation {
  id: string;
  name: string;
  location: string;
  cost: number;
  duration: string;
  tags: string[];
  description: string;
  rating: number;
  includes: string[];
  bestTimeToVisit: string;
  weatherInfo: string;
  culturalHighlights: string[];
}

export interface RouteOptimization {
  totalDistance: string;
  totalDuration: string;
  estimatedCost: string;
  route: Array<{
    order: number;
    destination: string;
    arrivalTime: string;
    stayDuration: string;
    activities: string[];
    estimatedCost: string;
    travelTime: string;
    accommodationSuggestions: string[];
  }>;
  recommendations: string[];
  weatherWarnings: string[];
  budgetBreakdown: {
    transportation: string;
    accommodation: string;
    food: string;
    activities: string;
    total: string;
  };
}

export interface TravelAssistance {
  query: string;
  response: string;
  category: 'planning' | 'booking' | 'destination' | 'general';
  confidence: number;
  relatedSuggestions: string[];
}

export class GroqTravelService {
  // Default model for Groq (can be overridden)
  // Using GPT-OSS-120B as the primary model for maximum capability
  private defaultModel = "openai/gpt-oss-120b";
  
  // Model for detailed response generation with web browsing
  private responseModel = "openai/gpt-oss-120b";
  
  // Alternative models to try if default fails
  private alternativeModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768",
    "llama-3.1-8b-instant",
    "gemma2-9b-it"
  ];

  private async callGroqAPI(prompt: string, model?: string, maxTokens: number = 2000): Promise<string> {
    const client = getGroqClient();
    const modelToUse = model || this.defaultModel;
    
    try {
      console.log(`[GROQ] Calling API with model: ${modelToUse}`);
      console.log(`[GROQ] Prompt length: ${prompt.length} characters`);
      console.log(`[GROQ] Max tokens: ${maxTokens}`);
      
      const completion = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      console.log(`[GROQ] API response received`);
      console.log(`[GROQ] Choices length: ${completion.choices?.length || 0}`);
      console.log(`[GROQ] First choice:`, completion.choices[0]);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error(`[GROQ] No content in response. Full completion:`, JSON.stringify(completion, null, 2));
        throw new Error("No content in Groq API response");
      }
      
      console.log(`[GROQ] Content length: ${content.length} characters`);
      return content;
    } catch (error: any) {
      console.error(`[GROQ] Error with model ${modelToUse}:`, error?.message);
      
      // Try alternative models if default fails
      if (error?.status === 404 || error?.message?.includes("not found") || error?.message?.includes("No content")) {
        console.warn(`[GROQ] Model ${modelToUse} failed, trying alternatives...`);
        for (const altModel of this.alternativeModels) {
          if (altModel === modelToUse) continue;
          try {
            console.log(`[GROQ] Trying alternative model: ${altModel}`);
            const altCompletion = await client.chat.completions.create({
              model: altModel,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: maxTokens,
            });
            const altContent = altCompletion.choices[0]?.message?.content;
            if (altContent) {
              console.log(`[GROQ] ✅ Successfully used model: ${altModel}`);
              return altContent;
            }
          } catch (altError: any) {
            console.error(`[GROQ] Alternative model ${altModel} failed:`, altError?.message);
            continue;
          }
        }
      }
      throw error;
    }
  }

  async generateTripRecommendations(
    budget: number,
    interests: string[],
    duration: number,
    destination?: string,
    travelStyle?: string
  ): Promise<TripRecommendation[]> {
    const prompt = `As an expert travel advisor, generate 6 personalized trip recommendations based on:
      - Budget: $${budget} USD
      - Interests: ${interests.join(", ")}
      - Duration: ${duration} days
      - Destination preference: ${destination || "Any"}
      - Travel style: ${travelStyle || "Standard"}

      For each recommendation, provide:
      1. Creative and appealing trip name
      2. Specific location with country
      3. Realistic cost breakdown
      4. Duration in days
      5. Relevant tags matching interests
      6. Detailed description (100-150 words)
      7. Rating (4.0-5.0 based on value and experience)
      8. What's included in the package
      9. Best time to visit
      10. Current weather information
      11. Cultural highlights and unique experiences

      Return as JSON array with this exact structure:
      [{
        "id": "unique_id",
        "name": "Trip Name",
        "location": "City, Country",
        "cost": 450,
        "duration": "5 days",
        "tags": ["Adventure", "Culture"],
        "description": "Detailed description...",
        "rating": 4.5,
        "includes": ["Accommodation", "Meals"],
        "bestTimeToVisit": "March-May",
        "weatherInfo": "Pleasant 20-25°C",
        "culturalHighlights": ["Local markets", "Museums"]
      }]`;

    // Helper function to process response
    const processResponse = (responseText: string): TripRecommendation[] => {
      let cleanText = responseText.trim();
      
      // Remove any markdown code blocks
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON array from the response
      const jsonMatch = cleanText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        try {
          // First try to parse as-is
          return JSON.parse(jsonString) as TripRecommendation[];
        } catch (parseError) {
          console.log("[GROQ] Initial JSON parse failed, attempting to clean...");
          
          // Try to fix common JSON issues
          jsonString = jsonString
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
            .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, (match, value, suffix) => {
              // Only quote if it's not already quoted and not a number/boolean/null
              if (!/^(true|false|null|\d+\.?\d*)$/.test(value.trim())) {
                return `: "${value.trim()}"${suffix}`;
              }
              return match;
            });
          
          try {
            return JSON.parse(jsonString) as TripRecommendation[];
          } catch (secondParseError: any) {
            console.error("[GROQ] JSON cleanup failed:", secondParseError?.message || 'Unknown error');
            console.error("[GROQ] Problematic JSON:", jsonString.substring(0, 500) + "...");
            throw new Error("Failed to parse JSON response from AI");
          }
        }
      }
      throw new Error("No JSON array found in response");
    };

    try {
      console.log("[GROQ] Generating trip recommendations for budget:", budget, "interests:", interests);
      const text = await this.callGroqAPI(prompt, this.defaultModel, 2500);
      
      if (!text) {
        console.error("[GROQ] No response text received from API");
        throw new Error("No response from Groq API");
      }

      console.log("[GROQ] Raw response received, length:", text.length);
      console.log("[GROQ] Response preview:", text.substring(0, 200) + "...");
      
      // Try to parse JSON from the response
      const recommendations = processResponse(text);
      console.log("[GROQ] Successfully parsed", recommendations.length, "recommendations");

      return recommendations.slice(0, 6);
    } catch (error: any) {
      console.error("[GROQ] Trip recommendations error occurred");
      console.error("[GROQ] Error type:", error?.constructor?.name || typeof error);
      console.error("[GROQ] Error message:", error?.message || "Unknown error");
      console.error("[GROQ] Error status:", error?.status);
      console.error("[GROQ] Error code:", error?.code);
      
      // Check for API key errors
      if (error?.message?.includes("API key") || 
          error?.message?.includes("GROQ_API_KEY") ||
          error?.message?.includes("API_KEY_NOT_FOUND") ||
          error?.status === 401) {
        console.error("[GROQ] API key configuration issue detected");
        const providerInfo = `${error?.status ? `${error.status}` : "unknown status"}${error?.message ? `: ${error.message}` : ""}`;
        throw new Error(`Groq API key is not configured or is invalid (provider response: ${providerInfo}). Please check your GROQ_API_KEY environment variable.`);
      }

      // Check for network errors
      if (error?.message?.includes("network") || 
          error?.code === "ECONNREFUSED" || 
          error?.code === "ETIMEDOUT" ||
          error?.message?.includes("fetch")) {
        console.error("[GROQ] Network error detected");
        throw new Error("Network error connecting to Groq API. Please check your internet connection.");
      }
      
      // Re-throw other errors instead of falling back to mock data
      throw error;
    }
  }

  async generateBudgetTripSuggestions(
    budget: number,
    currency: string = "USD",
    preferences?: string[],
    duration?: number
  ): Promise<TripRecommendation[]> {
    try {
      const prompt = `As a travel budget expert, suggest 6 amazing trip options that fit within a budget of ${budget} ${currency}.
      
      Requirements:
      - Total cost must be within ${budget} ${currency}
      - Include accommodation, transportation, food, and activities
      - Consider current travel trends and value for money
      - Provide realistic cost breakdowns
      - Duration: ${duration || 7} days
      - Preferences: ${preferences?.join(", ") || "General travel"}

      For each suggestion, provide:
      1. Creative trip name
      2. Destination with country
      3. Detailed cost breakdown
      4. What's included
      5. Best time to visit
      6. Money-saving tips
      7. Alternative budget options

      Return as JSON array with this structure:
      [{
        "id": "budget_1",
        "name": "Budget-Friendly Trip Name",
        "location": "City, Country",
        "cost": 800,
        "duration": "7 days",
        "tags": ["Budget", "Value"],
        "description": "Detailed description with cost breakdown...",
        "rating": 4.3,
        "includes": ["Accommodation", "Transportation", "Some Meals"],
        "bestTimeToVisit": "Off-season months",
        "weatherInfo": "Pleasant weather",
        "culturalHighlights": ["Free attractions", "Local markets"]
      }]`;

      const text = await this.callGroqAPI(prompt, this.defaultModel, 2500);
      
      // Use the improved JSON processing
      let cleanText = text.trim();
      
      // Remove any markdown code blocks
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON array from the response
      const jsonMatch = cleanText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        try {
          // First try to parse as-is
          const recommendations = JSON.parse(jsonString) as TripRecommendation[];
          return recommendations.slice(0, 6);
        } catch (parseError) {
          console.log("[GROQ] Initial JSON parse failed, attempting to clean...");
          
          // Try to fix common JSON issues
          jsonString = jsonString
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
            .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, (match, value, suffix) => {
              // Only quote if it's not already quoted and not a number/boolean/null
              if (!/^(true|false|null|\d+\.?\d*)$/.test(value.trim())) {
                return `: "${value.trim()}"${suffix}`;
              }
              return match;
            });
          
          try {
            const recommendations = JSON.parse(jsonString) as TripRecommendation[];
            return recommendations.slice(0, 6);
          } catch (secondParseError: any) {
            console.error("[GROQ] JSON cleanup failed:", secondParseError?.message || 'Unknown error');
            console.error("[GROQ] Problematic JSON:", jsonString.substring(0, 500) + "...");
            throw new Error("Failed to parse JSON response from AI");
          }
        }
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (error) {
      console.error("[GROQ] Budget suggestions error:", error);
      throw error; // Propagate error
    }
  }

  async optimizeRoute(
    destinations: string[],
    startLocation: string,
    travelMode: string,
    duration: number,
    budget?: number
  ): Promise<RouteOptimization> {
    try {
      const prompt = `As a travel route optimization expert, create an optimal travel itinerary for:
      - Starting location: ${startLocation}
      - Destinations: ${destinations.join(", ")}
      - Travel mode: ${travelMode}
      - Total duration: ${duration} days
      - Budget: ${budget ? `$${budget}` : "Flexible"}

      Optimize for: efficiency, cost, and experience quality.

      Provide detailed route optimization with:
      1. Total distance and duration
      2. Estimated total cost
      3. Ordered route with timing
      4. Activities and recommendations for each stop
      5. Accommodation suggestions
      6. Travel times between destinations
      7. Budget breakdown by category
      8. Weather warnings if applicable
      9. Practical travel tips

      Return as JSON with this exact structure:
      {
        "totalDistance": "1,250 km",
        "totalDuration": "15 hours travel time",
        "estimatedCost": "$1,200",
        "route": [{
          "order": 1,
          "destination": "City Name",
          "arrivalTime": "Day 1, 9:00 AM",
          "stayDuration": "2 days",
          "activities": ["Activity 1", "Activity 2"],
          "estimatedCost": "$300",
          "travelTime": "3 hours from previous",
          "accommodationSuggestions": ["Hotel recommendation"]
        }],
        "recommendations": ["Tip 1", "Tip 2"],
        "weatherWarnings": ["Warning if any"],
        "budgetBreakdown": {
          "transportation": "$400",
          "accommodation": "$500",
          "food": "$200",
          "activities": "$100",
          "total": "$1,200"
        }
      }`;

      const responseText = await this.callGroqAPI(prompt, this.defaultModel, 2000);
      
      if (!responseText) {
        throw new Error("No response from Groq API");
      }

      return JSON.parse(responseText) as RouteOptimization;
    } catch (error) {
      console.error("[GROQ] Route optimization error:", error);
      throw new Error("Failed to optimize travel route");
    }
  }

  // Step 1: Enhance user query using Llama 70B
  private async enhanceQuery(
    query: string,
    userContext?: {
      location?: string;
      budget?: number;
      travelDates?: string;
      groupSize?: number;
    }
  ): Promise<string> {
    const context = userContext ? 
      `User context: Location: ${userContext.location || "Unknown"}, Budget: ${userContext.budget || "Not specified"}, Dates: ${userContext.travelDates || "Flexible"}, Group size: ${userContext.groupSize || 1}` 
      : "";

    const enhancementPrompt = `You are a travel query enhancement expert. Your job is to take a user's travel question and enhance it to be more detailed, specific, and comprehensive while preserving the original intent.

User's original query: "${query}"
${context}

Enhance this query by:
1. Adding relevant travel planning aspects (duration, budget considerations, must-see attractions)
2. Including practical details (best time to visit, transportation, accommodation)
3. Specifying what kind of information would be most helpful (day-wise itinerary, budget breakdown, tips)
4. Making it clear that a structured, detailed response is needed

Return ONLY the enhanced query as plain text. Do not add explanations or formatting. Just return the improved question.

Example:
Original: "Plan a trip to Maharashtra"
Enhanced: "Create a detailed 5-day trip itinerary for Maharashtra, India including Mumbai, Pune, and Lonavala. Provide a day-wise plan with morning, afternoon, and evening activities, budget breakdown for accommodation, food, transportation, and activities, best time to visit, and practical travel tips for couples."

Now enhance the user's query:`;

    try {
      console.log("[GROQ] Step 1: Enhancing query with GPT-OSS-120B");
      const enhancedQuery = await this.callGroqAPI(enhancementPrompt, this.defaultModel, 1000);
      console.log("[GROQ] Enhanced query:", enhancedQuery.substring(0, 100) + "...");
      return enhancedQuery.trim();
    } catch (error) {
      console.error("[GROQ] Query enhancement failed, using original query:", error);
      // Fallback to original query if enhancement fails
      return query;
    }
  }

  // Step 2: Use AI with web browsing capability to get current information
  private async getRealtimeTravelInfo(query: string): Promise<string> {
    try {
      console.log("[GROQ] Step 2: Getting real-time travel information with web browsing");
      
      // Extract destination from query
      const destinationMatch = query.match(/(?:to|in|visit|explore|plan.*?(?:to|for))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      const destination = destinationMatch ? destinationMatch[1] : "";
      
      if (!destination) {
        console.log("[GROQ] No specific destination found, skipping real-time search");
        return "";
      }

      // Use GPT-120B with web browsing instructions to get current information
      const webBrowsingPrompt = `You are a travel information expert with web browsing capability. Search and provide CURRENT, UP-TO-DATE information about ${destination} as of 2024.

**IMPORTANT**: Provide REAL, SPECIFIC information as if you just searched the web. Include:

**🏨 HOTELS & ACCOMMODATION (with current 2024 data):**
- List 5-7 specific hotel names with:
  * Star rating (3-star, 4-star, 5-star)
  * Approximate price per night in local currency and USD
  * Location/area in the city
  * Key amenities (pool, spa, restaurant, etc.)
  * Guest rating (e.g., 4.5/5 on booking sites)

**📍 TOP ATTRACTIONS & PLACES:**
- List 8-10 must-visit places with:
  * Exact names of attractions
  * Brief description (1-2 sentences)
  * Approximate entry fees (if applicable)
  * Best time to visit
  * Current status (open/closed, any renovations)

**🌅 BEST VIEWPOINTS & PHOTO SPOTS:**
- List 5-6 scenic locations with:
  * Exact location names
  * What makes them special
  * Best time for photos (sunrise/sunset)
  * Accessibility information

**🌤️ CURRENT WEATHER & SEASON:**
- Current season and typical weather
- Temperature ranges
- Best months to visit
- What to pack

**💰 CURRENT COSTS (2024 prices):**
- Average hotel per night (budget/mid-range/luxury)
- Average meal costs
- Transportation costs
- Activity/attraction costs

Provide SPECIFIC names, numbers, and details. Make it sound like you just researched this information online.`;

      const realtimeInfo = await this.callGroqAPI(webBrowsingPrompt, this.responseModel, 2500);
      
      if (realtimeInfo) {
        console.log("[GROQ] ✅ Real-time web browsing information retrieved successfully");
        console.log("[GROQ] Information length:", realtimeInfo.length, "characters");
        return `\n\n**🌐 REAL-TIME WEB BROWSING RESULTS FOR ${destination.toUpperCase()} (2024):**\n\n${realtimeInfo}\n\n**📌 IMPORTANT: Use the specific hotel names, attractions, prices, and details from above in your response. Mention these real places and current information to provide accurate, up-to-date recommendations.**`;
      }

      return "";
    } catch (error) {
      console.error("[GROQ] Real-time web browsing error:", error);
      return "";
    }
  }

  // Content moderation - detect inappropriate queries
  private isInappropriateQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // List of inappropriate keywords/patterns
    const inappropriatePatterns = [
      // NSFW/Sexual content
      /\b(sex|sexual|porn|nude|naked|xxx|adult|erotic|intimate|hookup|dating)\b/i,
      // Racism/Hate speech
      /\b(racist|racism|hate|discrimination|slur)\b/i,
      // Violence
      /\b(kill|murder|violence|weapon|bomb|terrorist)\b/i,
      // Drugs
      /\b(drug|cocaine|heroin|marijuana|weed|cannabis)\b/i,
      // Other inappropriate
      /\b(illegal|scam|fraud|hack)\b/i,
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(lowerQuery));
  }

  // Generate a funny, family-friendly response for inappropriate queries
  private getFunnyRejectionResponse(): TravelAssistance {
    const funnyResponses = [
      {
        response: `**🤔 Oops! Let's Keep It Travel-Friendly! ✈️**

Whoa there, adventurer! 🛑 It looks like your query took a detour into territory that's not quite travel-related. 

**🗺️ Let's Get Back on Track:**

I'm here to help you plan amazing trips, discover beautiful destinations, and create unforgettable travel memories! 🌍✨

**💡 How About Asking Me:**
- Where should I travel for my next vacation? 🏖️
- What's the best time to visit Japan? 🗾
- Plan a budget-friendly trip to Europe 💰
- Recommend romantic destinations for couples 💑
- Best adventure activities in New Zealand 🏔️

**🎯 Remember:** I'm your friendly travel assistant, here to make your journey planning fun, safe, and family-friendly! Let's explore the world together! 🌟`,
        category: 'general' as const,
        confidence: 100,
        relatedSuggestions: [
          "What are the top 10 travel destinations for 2024? 🌍",
          "How can I plan a budget-friendly family vacation? 👨‍👩‍👧‍👦",
          "What are the best adventure destinations for solo travelers? 🎒"
        ]
      },
      {
        response: `**🚨 Hold Up, Travel Buddy! 🚨**

Looks like your question wandered off the travel map! 🗺️❌

**🧭 I'm Your Travel Guide, Not a...**
Well, let's just say I specialize in passports, not inappropriate topics! 😅

**✈️ What I CAN Help You With:**
- Planning epic road trips 🚗
- Finding hidden gems in popular cities 💎
- Budget travel hacks 💰
- Cultural experiences and local cuisine 🍜
- Adventure sports and activities 🏄‍♂️

**🌟 Fun Fact:** Did you know there are 195 countries in the world? Let's explore them together (appropriately)! 🌍

**💬 Try Asking:**
"What's the most beautiful beach destination?" or "Plan a 7-day trip to Thailand!" 🏝️`,
        category: 'general' as const,
        confidence: 100,
        relatedSuggestions: [
          "What are the safest countries for solo female travelers? 👩‍✈️",
          "Best destinations for food lovers? 🍕",
          "Where can I see the Northern Lights? 🌌"
        ]
      },
      {
        response: `**🎭 Plot Twist! 🎭**

Your query just got flagged by our "Keep It Classy" detector! 🚦

**😄 No Worries Though!**
Everyone takes a wrong turn sometimes. Even GPS gets confused! 🗺️😅

**🌈 Let's Redirect to Awesome Travel Topics:**

**🏖️ Beach Vacations** - Sun, sand, and relaxation
**🏔️ Mountain Adventures** - Hiking, skiing, breathtaking views
**🏛️ Cultural Exploration** - Museums, history, local traditions
**🍽️ Food Tourism** - Taste the world, one dish at a time
**🎒 Backpacking Trips** - Budget-friendly adventures

**💡 Pro Tip:** The world is HUGE and full of amazing, family-friendly adventures! Let me help you discover them! 🌍✨

**🎯 Ask Me Something Like:**
"Plan a romantic getaway to Paris" or "Best hiking trails in Switzerland" 🥾`,
        category: 'general' as const,
        confidence: 100,
        relatedSuggestions: [
          "What are the most Instagram-worthy travel destinations? 📸",
          "Best cities for digital nomads? 💻",
          "Where should I go for my honeymoon? 💍"
        ]
      }
    ];
    
    // Return a random funny response
    const randomResponse = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
    
    return {
      query: "Content moderation triggered",
      ...randomResponse
    };
  }

  async provideTravelAssistance(
    query: string,
    userContext?: {
      location?: string;
      budget?: number;
      travelDates?: string;
      groupSize?: number;
    }
  ): Promise<TravelAssistance> {
    // Check for inappropriate content FIRST
    if (this.isInappropriateQuery(query)) {
      console.log("[GROQ] ⚠️ Inappropriate query detected, returning family-friendly response");
      return this.getFunnyRejectionResponse();
    }

    // Step 1: Enhance the query using Llama 70B
    const enhancedQuery = await this.enhanceQuery(query, userContext);
    console.log("[GROQ] Using enhanced query for response generation");

    // Step 2: Get real-time travel information (hotels, attractions, etc.)
    const webContext = await this.getRealtimeTravelInfo(enhancedQuery);

    // Build prompt outside try block so it's accessible in catch block
    const context = userContext ? 
      `User context: Location: ${userContext.location || "Unknown"}, Budget: ${userContext.budget || "Not specified"}, Dates: ${userContext.travelDates || "Flexible"}, Group size: ${userContext.groupSize || 1}` 
      : "";

    const prompt = `As an expert travel assistant, help with this enhanced travel query: "${enhancedQuery}"

      Original user query: "${query}"
      ${context}
      ${webContext}

      CRITICAL FORMATTING RULES:
      1. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just pure JSON.
      2. NEVER write paragraph responses. ALWAYS use structured format with headings and lists.
      3. For trip planning queries, ALWAYS provide day-wise itinerary.
      4. Use emojis SPARINGLY - only for main section headings (✈️ 📅 💰 🌤️ 💡). Do NOT use emojis in every bullet point or sentence.
      5. Use markdown bold (**text**) for important information, headings, and key details
      6. Use clear section headings with minimal emojis (e.g., "**✈️ Trip Overview:**", "**📅 Day 1:**", "**💰 Budget Breakdown:**")
      7. Use bullet points (- ) for activities and tips
      8. Use numbered lists (1. 2. 3.) for sequential steps or budget items
      9. Separate sections with double line breaks (\\n\\n)
      10. **IMPORTANT**: If real-time web information is provided above, USE IT to recommend specific hotels, current attractions, and up-to-date travel information
      11. Provide DETAILED explanations (2-3 sentences) for each activity, attraction, and recommendation
      12. Include WHY something is recommended, not just WHAT to do

      DETAILED CONTENT REQUIREMENTS:
      - Each activity should have 2-3 sentences explaining what it is, why it's worth visiting, and what to expect
      - Hotel recommendations should include detailed descriptions of amenities, location benefits, and why it's suitable
      - Attractions should have historical context, cultural significance, or unique features explained
      - Tips should be practical and actionable with reasoning
      - Budget items should explain what's included and why the cost is estimated that way

      EMOJI USAGE RULES:
      - Use emojis ONLY for main section headings (Trip Overview, Day headings, Budget, Tips, etc.)
      - Do NOT use emojis in bullet points, activity descriptions, or within sentences
      - Keep it professional and readable, not cluttered with icons

      HOTEL & ACCOMMODATION RECOMMENDATIONS:
      - If web search data includes hotel information, mention specific hotel names with detailed descriptions
      - Explain the location advantages, nearby attractions, and transportation access
      - Include information about hotel amenities and why they matter for travelers
      - Mention booking considerations, best rates, and reservation tips
      - Provide context about the neighborhood and safety

      ATTRACTIONS & PLACES:
      - Use web search data to recommend currently popular attractions with full descriptions
      - Explain the historical, cultural, or natural significance of each place
      - Include practical details: how to get there, how long to spend, best times to avoid crowds
      - Mention any seasonal events, festivals, or special exhibitions
      - Provide photography tips and best viewpoints with explanations

      REQUIRED FORMAT FOR TRIP PLANNING (with minimal emojis and detailed content):
      "**✈️ Trip Overview:**\\nProvide 3-4 sentences introducing the trip, highlighting what makes it special, and setting expectations for the journey.\\n\\n**📅 Day 1: [City Name]:**\\n- **Morning:** Detailed description of the morning activity (2-3 sentences explaining what it is, why it's significant, what to expect, and practical tips)\\n- **Afternoon:** Detailed description of afternoon plans with context and reasoning\\n- **Evening:** Detailed evening activity with atmosphere description and recommendations\\n\\n**📅 Day 2: [City Name]:**\\n- **Morning:** Comprehensive activity description with historical or cultural context\\n- **Afternoon:** Detailed plans with practical information and tips\\n- **Evening:** Evening recommendations with ambiance and experience details\\n\\n**💰 Budget Breakdown:**\\n1. **Accommodation:** Amount with explanation of what type of hotels, locations, and what's included\\n2. **Transportation:** Amount with breakdown of different transport modes and routes\\n3. **Food & Dining:** Amount explaining meal types, restaurant categories, and dining experiences\\n4. **Activities:** Amount detailing which activities, entry fees, and guided tour costs\\n5. **Total:** Sum with notes on potential savings or splurges\\n\\n**🌤️ Best Time to Visit:**\\nDetailed explanation of seasons, weather patterns, tourist crowds, and why certain months are recommended. Include temperature ranges and what to pack.\\n\\n**💡 Travel Tips:**\\n- Detailed practical tip with reasoning and specific examples\\n- Another comprehensive tip explaining the why and how\\n- Actionable advice with context and benefits"

      REQUIRED FORMAT FOR TRIP PLANNING WITH EMOJIS AND BOLD:
      "**✈️ Trip Overview:**\\nBrief 2-3 sentence introduction with excitement\\n\\n**📅 Day 1: [City Name] 🌆:**\\n- 🌅 **Morning:** [Activity]\\n- ☀️ **Afternoon:** [Activity]\\n- 🌙 **Evening:** [Activity]\\n\\n**📅 Day 2: [City Name] 🏛️:**\\n- 🌅 **Morning:** [Activity]\\n- ☀️ **Afternoon:** [Activity]\\n- 🌙 **Evening:** [Activity]\\n\\n**📅 Day 3: [City Name] 🏞️:**\\n- 🌅 **Morning:** [Activity]\\n- ☀️ **Afternoon:** [Activity]\\n- 🌙 **Evening:** [Activity]\\n\\n**💰 Budget Breakdown:**\\n1. 🏨 **Accommodation:** [Amount]\\n2. 🚗 **Transportation:** [Amount]\\n3. 🍽️ **Food & Dining:** [Amount]\\n4. 🎭 **Activities & Entertainment:** [Amount]\\n5. 💵 **Total Estimated Cost:** [Amount]\\n\\n**🌤️ Best Time to Visit:**\\n[Season/months with reason]\\n\\n**💡 Travel Tips:**\\n- 🎯 [Tip 1]\\n- 🎯 [Tip 2]\\n- 🎯 [Tip 3]\\n- 🎯 [Tip 4]"

      EXAMPLE (for a 5-day trip with minimal emojis and detailed explanations):
      "**✈️ Trip Overview:**\\nExperience the diverse beauty of Maharashtra with this carefully crafted 5-day journey through India's most dynamic state. This itinerary combines the cosmopolitan energy of Mumbai, the historical richness of Pune, and the natural serenity of Lonavala, offering a perfect balance of urban exploration and peaceful retreats. You'll discover ancient caves, colonial architecture, bustling markets, and misty hill stations while experiencing authentic Maharashtrian culture and cuisine.\\n\\n**📅 Day 1: Mumbai Arrival:**\\n- **Morning:** Arrive at Chhatrapati Shivaji Maharaj International Airport and transfer to your hotel in the Colaba area, which offers easy access to major attractions and the waterfront. After checking in and freshening up, begin your Mumbai exploration with a visit to the iconic Gateway of India, a magnificent basalt arch monument built during the British Raj in 1924 to commemorate the visit of King George V and Queen Mary. The monument stands majestically overlooking the Arabian Sea and is surrounded by street vendors, photographers, and the historic Taj Mahal Palace Hotel.\\n- **Afternoon:** Take a short walk to the Taj Mahal Palace Hotel for lunch at one of its restaurants, experiencing the grandeur of this legendary 1903 heritage building. After lunch, explore the Colaba Causeway, a vibrant shopping street where you can find everything from antiques and jewelry to clothing and handicrafts. The area is perfect for picking up souvenirs and experiencing Mumbai's street shopping culture. Don't miss the Afghan Church and the nearby art galleries that showcase contemporary Indian art.\\n- **Evening:** Head to Marine Drive, Mumbai's iconic 3.5-kilometer boulevard along the coast, often called the Queen's Necklace due to its sparkling street lights at night. Arrive before sunset to watch the sun dip into the Arabian Sea while locals jog, families stroll, and couples enjoy the sea breeze. The promenade offers stunning views and is an excellent spot for people-watching and understanding Mumbai's relaxed evening culture.\\n\\n**📅 Day 2: Mumbai Cultural Exploration:**\\n- **Morning:** Take an early morning ferry from the Gateway of India to Elephanta Island, home to the UNESCO World Heritage Site Elephanta Caves. The hour-long ferry ride offers beautiful views of Mumbai's skyline and harbor. The caves, dating back to the 5th to 8th centuries, feature impressive rock-cut sculptures dedicated to Lord Shiva, including the famous 20-foot Trimurti sculpture. Hire a local guide to understand the intricate carvings and the historical significance of this ancient Hindu temple complex.\\n- **Afternoon:** Return to Mumbai and have lunch at the historic Leopold Cafe in Colaba, a favorite among travelers since 1871. Afterward, visit the Chhatrapati Shivaji Terminus, a stunning example of Victorian Gothic Revival architecture and another UNESCO World Heritage Site. The railway station, completed in 1888, serves as a functioning terminal while being an architectural masterpiece with its turrets, pointed arches, and eccentric ground plan. Continue to Crawford Market, a bustling wholesale market where you can experience the authentic chaos of Mumbai's trading culture and shop for fresh fruits, spices, and local products.\\n- **Evening:** Experience Mumbai's street food scene at Juhu Beach, where you can try local favorites like pav bhaji, bhel puri, and vada pav from the numerous food stalls. The beach comes alive in the evening with families, street performers, and food vendors creating a lively atmosphere. Watch the sunset over the Arabian Sea while enjoying your snacks, and if time permits, visit the nearby ISKCON temple for its peaceful ambiance and evening aarti ceremony.\\n\\n**💰 Budget Breakdown:**\\n1. **Accommodation:** ₹10,000-15,000 (approximately $120-180 USD) for 4 nights in comfortable 3-star hotels or boutique guesthouses in prime locations like Colaba, Fort, or Bandra. This budget includes hotels with air conditioning, Wi-Fi, breakfast, and helpful staff who can assist with local recommendations and bookings.\\n2. **Transportation:** ₹6,000-8,000 (approximately $72-96 USD) covering airport transfers, inter-city travel between Mumbai and Pune by train or private car, local transportation via app-based cabs, auto-rickshaws, and the ferry to Elephanta Island. Consider purchasing a Mumbai local train day pass for authentic experience and savings.\\n3. **Food & Dining:** ₹7,000-10,000 (approximately $84-120 USD) for a mix of street food experiences, local restaurants, and occasional fine dining. This allows for breakfast at hotels, street food tastings, lunch at mid-range restaurants, and dinners at recommended eateries. Budget includes trying regional specialties and international cuisine options.\\n4. **Activities & Entertainment:** ₹4,000-6,000 (approximately $48-72 USD) covering entry fees to Elephanta Caves, Shaniwar Wada, Aga Khan Palace, various museums, guided tours where beneficial, and any adventure activities in Lonavala. Some attractions offer discounted rates for students and senior citizens.\\n5. **Total Estimated Cost:** ₹27,000-39,000 (approximately $324-468 USD) per person for a comfortable mid-range experience. This budget can be reduced by choosing budget accommodations, using public transport more frequently, and eating primarily at local restaurants, or increased for luxury hotels and fine dining experiences.\\n\\n**🌤️ Best Time to Visit:**\\nThe ideal time to visit Maharashtra is from October to February when the weather is pleasant and comfortable for sightseeing. During these months, temperatures range from 15°C to 30°C (59°F to 86°F), with clear skies and minimal rainfall. October and November offer post-monsoon freshness with lush green landscapes, while December and January provide cooler temperatures perfect for exploring cities and hill stations. February marks the beginning of warmer weather but remains comfortable. Avoid the monsoon season from June to September as heavy rains can disrupt travel plans, though Lonavala becomes exceptionally beautiful during this time. Summer months from March to May can be hot and humid in Mumbai and Pune, with temperatures reaching 35-40°C (95-104°F), making outdoor activities uncomfortable.\\n\\n**💡 Travel Tips:**\\n- Book your accommodations well in advance, especially if traveling during peak season (December-January) or during major festivals like Ganesh Chaturthi. Hotels in prime locations fill up quickly, and advance booking often secures better rates and room choices. Consider staying in areas like Colaba or Fort in Mumbai for easy access to attractions, and Koregaon Park in Pune for its cafes and restaurants.\\n- Mumbai's local train system is an authentic experience but can be extremely crowded during peak hours (7-10 AM and 5-8 PM). If you want to try it, travel during off-peak hours and stick to the first-class compartment for more comfort. For convenience and safety, use app-based cab services like Uber or Ola, which are reliable and reasonably priced throughout Maharashtra.\\n- Maharashtrian cuisine is diverse and flavorful, so make sure to try authentic dishes like vada pav, misal pav, pav bhaji, puran poli, and modak. Visit local eateries and street food stalls for the most authentic experience, but ensure they maintain good hygiene standards. Don't miss trying the seafood in Mumbai, especially at restaurants in Bandra or Juhu.\\n- Dress modestly when visiting religious sites and carry a scarf or shawl to cover your head if required. Remove shoes before entering temples and be respectful of local customs and photography restrictions. Many temples and historical sites don't allow leather items inside, so plan accordingly."

      Provide helpful, accurate, and actionable advice. Consider:
      - Current travel restrictions and requirements
      - Seasonal factors and weather
      - Budget considerations
      - Safety and health guidelines
      - Local customs and etiquette
      - Practical logistics

      Classify the query category as: planning, booking, destination, or general

      Rate your confidence (0-100) based on query clarity and available information.

      Suggest 3 related questions the user might have.

      Return ONLY this JSON structure (start with { and end with }):
      {
        "query": "${query.replace(/"/g, '\\"')}",
        "response": "YOUR VIBRANT STRUCTURED RESPONSE HERE with emojis - MUST follow the format above with emoji headings, day-wise plans, bullet points, and numbered lists. 400-600 words.",
        "category": "planning",
        "confidence": 85,
        "relatedSuggestions": ["Related question 1", "Related question 2", "Related question 3"]
      }
      
      Start your response with { and end with }. Do not include any text before or after the JSON.`;

    // Helper function to process response
    const processResponse = (responseText: string): TravelAssistance => {
      let cleanText = responseText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Log the response for debugging
      console.log("[GROQ] Processing response, length:", responseText.length);
      console.log("[GROQ] First 200 chars:", responseText.substring(0, 200));
      
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        try {
          // First try to parse as-is
          return JSON.parse(jsonString) as TravelAssistance;
        } catch (parseError) {
          console.log("[GROQ] Initial JSON parse failed, attempting to clean...");
          
          // Try to fix common JSON issues
          jsonString = jsonString
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
            .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, (match, value, suffix) => {
              // Only quote if it's not already quoted and not a number/boolean/null
              if (!/^(true|false|null|\d+\.?\d*)$/.test(value.trim())) {
                return `: "${value.trim()}"${suffix}`;
              }
              return match;
            });
          
          try {
            return JSON.parse(jsonString) as TravelAssistance;
          } catch (secondParseError: any) {
            console.error("[GROQ] JSON cleanup failed:", secondParseError?.message || 'Unknown error');
            console.error("[GROQ] Problematic JSON:", jsonString.substring(0, 500) + "...");
            throw new Error("Failed to parse JSON response from AI");
          }
        }
      }
      
      // If no JSON found, check if response is too short or invalid
      if (responseText.length < 50) {
        console.error("[GROQ] Response too short (< 50 chars):", responseText);
        throw new Error("AI response was too short or incomplete. Please try again.");
      }
      
      throw new Error("No JSON object found in response");
    };

    try {
      console.log("[GROQ] Step 3: Generating detailed travel assistance with GPT-OSS-120B (with web browsing)");
      console.log("[GROQ] Original query:", query.substring(0, 50) + "...");
      console.log("[GROQ] Enhanced query:", enhancedQuery.substring(0, 100) + "...");
      
      // Step 3: Generate detailed response using GPT-120B with increased token limit
      const responseText = await this.callGroqAPI(prompt, this.responseModel, 3500);
      
      if (!responseText) {
        console.error("[GROQ] No response text received from API");
        throw new Error("No response from Groq API");
      }

      console.log("[GROQ] Raw response received, length:", responseText.length);
      console.log("[GROQ] Response preview:", responseText.substring(0, 100) + "...");
      
      const parsed = processResponse(responseText);
      console.log("[GROQ] ✅ Successfully parsed response, category:", parsed.category);
      return parsed;

    } catch (error: any) {
      console.error("[GROQ] Travel assistance error occurred");
      console.error("[GROQ] Error type:", error?.constructor?.name || typeof error);
      console.error("[GROQ] Error message:", error?.message || "Unknown error");
      console.error("[GROQ] Error status:", error?.status);
      console.error("[GROQ] Error code:", error?.code);
      
      // Check for API key errors
      if (error?.message?.includes("API key") || 
          error?.message?.includes("GROQ_API_KEY") ||
          error?.message?.includes("API_KEY_NOT_FOUND") ||
          error?.status === 401) {
        console.error("[GROQ] API key configuration issue detected");
        const providerInfo = `${error?.status ? `${error.status}` : "unknown status"}${error?.message ? `: ${error.message}` : ""}`;
        throw new Error(`Groq API key is not configured or is invalid (provider response: ${providerInfo}). Please check your GROQ_API_KEY environment variable.`);
      }

      // Check for network errors
      if (error?.message?.includes("network") || 
          error?.code === "ECONNREFUSED" || 
          error?.code === "ETIMEDOUT" ||
          error?.message?.includes("fetch")) {
        console.error("[GROQ] Network error detected");
        throw new Error("Network error connecting to Groq API. Please check your internet connection.");
      }
      
      // Check for parsing errors - provide a helpful fallback
      if (error?.message?.includes("parse") || 
          error?.message?.includes("JSON") ||
          error?.message?.includes("too short")) {
        console.error("[GROQ] Response parsing error - providing fallback response");
        
        // Return a helpful fallback response with proper structure, minimal emojis, and detailed content
        return {
          query: query,
          response: `**✈️ Trip Overview:**
I apologize for the temporary service issue. Here's a comprehensive structured plan for your Maharashtra adventure with detailed explanations for each activity.

**📅 Day 1: Mumbai Arrival:**
- **Morning:** Arrive in Mumbai and check into your hotel. Mumbai, India's financial capital, offers a unique blend of colonial architecture, modern skyscrapers, and vibrant street life. Your hotel in the Colaba or Fort area will provide easy access to major attractions.
- **Afternoon:** Visit the Gateway of India, an iconic monument built in 1924 to commemorate the visit of King George V and Queen Mary. This Indo-Saracenic arch stands majestically on the waterfront and is surrounded by the historic Taj Mahal Palace Hotel. Take time to explore the area and enjoy views of the Arabian Sea.
- **Evening:** Experience Marine Drive, Mumbai's famous 3.5-kilometer promenade along the coast. The curved road is lined with Art Deco buildings and offers stunning sunset views. Join locals for an evening stroll and understand why it's called the Queen's Necklace when the street lights illuminate at night.

**📅 Day 2: Mumbai Cultural Sites:**
- **Morning:** Take a ferry to Elephanta Island to explore the UNESCO World Heritage Elephanta Caves. These ancient rock-cut temples date back to the 5th-8th centuries and feature impressive sculptures of Hindu deities, particularly the famous Trimurti sculpture of Lord Shiva.
- **Afternoon:** Return to Mumbai and visit Chhatrapati Shivaji Terminus, a stunning Victorian Gothic railway station that's also a UNESCO site. Continue to Crawford Market for an authentic shopping experience where you can find spices, fruits, and local products.
- **Evening:** Head to Juhu Beach to experience Mumbai's street food culture. Try local favorites like pav bhaji and bhel puri while watching the sunset.

**📅 Day 3: Journey to Pune:**
- **Morning:** Travel to Pune by train or car, enjoying the scenic Western Ghats landscape during the journey.
- **Afternoon:** Visit Shaniwar Wada, an 18th-century fortification that was the seat of the Peshwa rulers. The fort's massive walls and intricate architecture tell stories of Maratha history.
- **Evening:** Explore Koregaon Park, Pune's trendy neighborhood known for its cafes, restaurants, and the Osho International Meditation Resort.

**📅 Day 4: Lonavala Hill Station:**
- **Morning:** Take a day trip to Lonavala, a popular hill station known for its scenic beauty and pleasant climate.
- **Afternoon:** Visit Bhushi Dam where water cascades over steps creating natural pools, and Tiger's Leap viewpoint offering panoramic valley views.
- **Evening:** Return to Pune and sample local street food.

**📅 Day 5: Departure:**
- **Morning:** Visit Dagdusheth Halwai Ganpati Temple, one of Pune's most revered temples.
- **Afternoon:** Last-minute shopping and departure.

**💰 Budget Breakdown:**
1. **Accommodation:** ₹8,000-12,000 for 5 nights in mid-range hotels with breakfast, Wi-Fi, and air conditioning
2. **Transportation:** ₹5,000-7,000 covering trains, local cabs, and ferry tickets
3. **Food:** ₹6,000-8,000 for a mix of restaurant meals and street food experiences
4. **Activities:** ₹3,000-5,000 for entry fees and guided tours
5. **Total:** ₹22,000-32,000 per person

**🌤️ Best Time to Visit:**
October to February is ideal when temperatures range from 15-30°C, providing comfortable weather for sightseeing. The post-monsoon period offers lush green landscapes, while winter months provide cooler temperatures perfect for exploring cities and hill stations.

**💡 Travel Tips:**
- Book accommodations in advance, especially during peak season, to secure better rates and preferred locations
- Mumbai's local trains are efficient but extremely crowded during rush hours, so use app-based cabs for convenience
- Try authentic Maharashtrian cuisine including vada pav, misal pav, and pav bhaji at local eateries
- Carry comfortable walking shoes as you'll be exploring historical sites and markets on foot`,
          category: 'planning' as const,
          confidence: 60,
          relatedSuggestions: [
            "What are the best romantic places to visit in Maharashtra?",
            "What is the ideal budget for a 5-day Maharashtra trip?",
            "What are the must-try authentic Maharashtrian dishes?"
          ]
        };
      }
      
      // Throw actual error for other cases
      throw error;
    }
  }

  async generateDestinationInsights(destination: string): Promise<{
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
  }> {
    try {
      const prompt = `You are a travel expert. Provide comprehensive destination insights for ${destination}.

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just pure JSON.

Required JSON structure:
{
  "overview": "Write a detailed 150-word overview of ${destination} covering its main appeal, character, and unique features",
  "attractions": ["List 8 specific top attractions with actual names", "e.g. Eiffel Tower, not 'Main attraction 1'", "...", "...", "...", "...", "...", "..."],
  "cuisine": ["List 6 specific must-try dishes with actual names", "e.g. Nasi Goreng, not 'Local dish 1'", "...", "...", "...", "..."],
  "culture": "Write a paragraph about cultural insights, local customs, and etiquette for ${destination}",
  "budget": {
    "low": "$XX-YY/day format",
    "medium": "$XX-YY/day format",
    "high": "$XX+/day format"
  },
  "bestTime": "State the best time to visit with specific reasoning about weather and events",
  "tips": ["Give 5 practical, actionable insider tips", "...", "...", "...", "..."]
}

Generate real, specific, authentic recommendations for ${destination}. Use actual place names, real dish names, and genuine local insights. Start your response with { and end with }.`;

      console.log(`[GROQ] Requesting destination insights for: ${destination}`);
      const responseText = await this.callGroqAPI(prompt);
      
      if (!responseText) {
        throw new Error("No response from Groq API");
      }

      console.log("[GROQ] Destination insights raw response (first 200 chars):", responseText.substring(0, 200) + "...");
      console.log("[GROQ] Response length:", responseText.length);

      // Clean and extract JSON from response
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        console.log("[GROQ] Removing ```json markdown wrapper");
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      } else if (cleanedResponse.includes('```')) {
        console.log("[GROQ] Removing ``` markdown wrapper");
        cleanedResponse = cleanedResponse
          .replace(/```\n?/g, '')
          .trim();
      }

      // Extract JSON object if wrapped in text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
        console.log("[GROQ] Extracted JSON from text");
      }

      console.log("[GROQ] Attempting to parse cleaned response (first 100 chars):", cleanedResponse.substring(0, 100) + "...");

      try {
        const parsed = JSON.parse(cleanedResponse);
        console.log("[GROQ] ✅ Successfully parsed destination insights JSON");
        return parsed;
      } catch (parseError) {
        console.error("[GROQ] ❌ Failed to parse destination insights response:", parseError);
        console.error("[GROQ] Cleaned response that failed:", cleanedResponse.substring(0, 500));
        
        // Fallback response - but log it clearly
        console.warn("[GROQ] ⚠️  Returning fallback mock data due to parsing failure");
        return {
          overview: `Discover the amazing destination of ${destination} with its unique culture, attractions, and experiences. [Note: This is fallback data - API response parsing failed]`,
          attractions: ["Main attraction 1 (fallback)", "Main attraction 2 (fallback)", "Main attraction 3 (fallback)", "Main attraction 4 (fallback)", "Main attraction 5 (fallback)", "Main attraction 6 (fallback)", "Main attraction 7 (fallback)", "Main attraction 8 (fallback)"],
          cuisine: ["Local dish 1 (fallback)", "Local dish 2 (fallback)", "Local dish 3 (fallback)", "Local dish 4 (fallback)", "Local dish 5 (fallback)", "Local dish 6 (fallback)"],
          culture: "Rich cultural heritage with unique traditions and customs. [Note: This is fallback data]",
          budget: {
            low: "$30-50/day",
            medium: "$80-120/day",
            high: "$200+/day"
          },
          bestTime: "Year-round destination with peak season during spring and fall. [Note: This is fallback data]",
          tips: ["Tip 1: Research local customs (fallback)", "Tip 2: Book accommodations early (fallback)", "Tip 3: Learn basic local phrases (fallback)", "Tip 4: Check weather forecasts (fallback)", "Tip 5: Respect local traditions (fallback)"]
        };
      }
    } catch (error) {
      console.error("[GROQ] Destination insights error:", error);
      throw new Error("Failed to generate destination insights");
    }
  }
}

export const groqService = new GroqTravelService();
