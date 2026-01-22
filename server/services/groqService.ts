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
  // Updated to use requested model
  private defaultModel = "openai/gpt-oss-20b";
  
  // Alternative models to try if default fails
  private alternativeModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "llama-3.1-70b-versatile" // Fallback (may be deprecated)
  ];

  private async callGroqAPI(prompt: string, model?: string): Promise<string> {
    const client = getGroqClient();
    const modelToUse = model || this.defaultModel;
    
    try {
      const completion = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq API response");
      }
      return content;
    } catch (error: any) {
      // Try alternative models if default fails
      if (error?.status === 404 || error?.message?.includes("not found")) {
        console.warn(`[GROQ] Model ${modelToUse} not found, trying alternatives...`);
        for (const altModel of this.alternativeModels) {
          if (altModel === modelToUse) continue;
          try {
            console.log(`[GROQ] Trying alternative model: ${altModel}`);
            const altCompletion = await client.chat.completions.create({
              model: altModel,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 2000,
            });
            const altContent = altCompletion.choices[0]?.message?.content;
            if (altContent) {
              console.log(`[GROQ] Successfully used model: ${altModel}`);
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
        
        // Try to fix common JSON issues
        jsonString = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, ': "$1"$2'); // Add quotes to unquoted string values
        
        return JSON.parse(jsonString) as TripRecommendation[];
      }
      throw new Error("No JSON array found in response");
    };

    try {
      console.log("[GROQ] Generating trip recommendations for budget:", budget, "interests:", interests);
      const text = await this.callGroqAPI(prompt);
      
      if (!text) {
        console.error("[GROQ] No response text received from API");
        throw new Error("No response from Groq API");
      }

      console.log("[GROQ] Raw response received, length:", text.length);
      
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

      const text = await this.callGroqAPI(prompt);
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
         const recommendations = JSON.parse(jsonMatch[0]) as TripRecommendation[];
         return recommendations.slice(0, 6);
      } else {
        throw new Error("Failed to parse budget trip suggestions");
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

      const responseText = await this.callGroqAPI(prompt);
      
      if (!responseText) {
        throw new Error("No response from Groq API");
      }

      return JSON.parse(responseText) as RouteOptimization;
    } catch (error) {
      console.error("[GROQ] Route optimization error:", error);
      throw new Error("Failed to optimize travel route");
    }
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
    // Build prompt outside try block so it's accessible in catch block
    const context = userContext ? 
      `User context: Location: ${userContext.location || "Unknown"}, Budget: ${userContext.budget || "Not specified"}, Dates: ${userContext.travelDates || "Flexible"}, Group size: ${userContext.groupSize || 1}` 
      : "";

    const prompt = `As an expert travel assistant, help with this travel query: "${query}"

      ${context}

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

      Return as JSON:
      {
        "query": "Original question",
        "response": "Detailed helpful response (200-300 words)",
        "category": "planning",
        "confidence": 85,
        "relatedSuggestions": ["Related question 1", "Related question 2", "Related question 3"]
      }`;

    // Helper function to process response
    const processResponse = (responseText: string): TravelAssistance => {
      let cleanText = responseText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        jsonString = jsonString
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, ': "$1"$2');
        return JSON.parse(jsonString) as TravelAssistance;
      }
      throw new Error("No JSON object found in response");
    };

    try {
      console.log("[GROQ] Generating travel assistance for query:", query.substring(0, 50) + "...");
      const responseText = await this.callGroqAPI(prompt);
      
      if (!responseText) {
        console.error("[GROQ] No response text received from API");
        throw new Error("No response from Groq API");
      }

      console.log("[GROQ] Raw response received, length:", responseText.length);
      
      const parsed = processResponse(responseText);
      console.log("[GROQ] Successfully parsed response, category:", parsed.category);
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
      
      // Throw actual error instead of returning mock
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
