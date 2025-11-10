import { GoogleGenerativeAI } from "@google/generative-ai";

// Validate and initialize Gemini AI client
function initializeGeminiAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("[GEMINI] API key is not configured in environment variables");
    throw new Error("GEMINI_API_KEY is not set. Please configure it in your .env file.");
  }
  
  console.log("[GEMINI] Initializing with API key (length:", apiKey.length, "characters)");
  return new GoogleGenerativeAI(apiKey);
}

const genAI = initializeGeminiAI();

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

export class GeminiTravelService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  async generateTripRecommendations(
    budget: number,
    interests: string[],
    duration: number,
    destination?: string,
    travelStyle?: string
  ): Promise<TripRecommendation[]> {
    try {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON from the response
      let recommendations: TripRecommendation[] = [];
      try {
        // Clean the response text first
        let cleanText = text.trim();
        
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
          
          recommendations = JSON.parse(jsonString) as TripRecommendation[];
        } else {
          // Fallback: create mock recommendations
          recommendations = this.createMockRecommendations(budget, interests, duration, destination, travelStyle);
        }
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.error("Raw response text:", text);
        // Fallback: create mock recommendations
        recommendations = this.createMockRecommendations(budget, interests, duration, destination, travelStyle);
      }

      return recommendations.slice(0, 6);
    } catch (error) {
      console.error("Gemini trip recommendations error:", error);
      // Fallback: create mock recommendations
      return this.createMockRecommendations(budget, interests, duration, destination, travelStyle);
    }
  }

  private createMockRecommendations(
    budget: number,
    interests: string[],
    duration: number,
    destination?: string,
    travelStyle?: string
  ): TripRecommendation[] {
    const destinations = [
      { name: "Bali Adventure", location: "Bali, Indonesia", cost: budget * 0.8 },
      { name: "European Culture Tour", location: "Paris, France", cost: budget * 0.9 },
      { name: "Mountain Trekking", location: "Swiss Alps, Switzerland", cost: budget * 0.7 },
      { name: "Beach Paradise", location: "Maldives", cost: budget * 0.85 },
      { name: "City Explorer", location: "Tokyo, Japan", cost: budget * 0.75 },
      { name: "Desert Safari", location: "Dubai, UAE", cost: budget * 0.6 }
    ];

    return destinations.map((dest, index) => ({
      id: `ai-${index + 1}`,
      name: dest.name,
      location: dest.location,
      cost: dest.cost,
      duration: `${duration} days`,
      tags: interests,
      description: `Experience the perfect blend of ${interests.join(", ")} in ${dest.location}. This AI-curated trip offers an unforgettable journey tailored to your preferences and budget.`,
      rating: 4.2 + Math.random() * 0.8,
      includes: ["Accommodation", "Transportation", "Guided Tours", "Some Meals"],
      bestTimeToVisit: "Year-round",
      weatherInfo: "Varies by season",
      culturalHighlights: ["Local Markets", "Historical Sites", "Cultural Experiences"]
    }));
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let recommendations: TripRecommendation[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]) as TripRecommendation[];
        } else {
          recommendations = this.createBudgetMockRecommendations(budget, currency, preferences, duration);
        }
      } catch (parseError) {
        console.error("Budget JSON parsing error:", parseError);
        recommendations = this.createBudgetMockRecommendations(budget, currency, preferences, duration);
      }

      return recommendations.slice(0, 6);
    } catch (error) {
      console.error("Gemini budget suggestions error:", error);
      return this.createBudgetMockRecommendations(budget, currency, preferences, duration);
    }
  }

  private createBudgetMockRecommendations(
    budget: number,
    currency: string,
    preferences?: string[],
    duration?: number
  ): TripRecommendation[] {
    const budgetDestinations = [
      { name: "Thailand Backpacker", location: "Bangkok & Phuket, Thailand", cost: budget * 0.7 },
      { name: "Eastern Europe Explorer", location: "Prague & Budapest", cost: budget * 0.8 },
      { name: "India Cultural Journey", location: "Delhi & Jaipur, India", cost: budget * 0.6 },
      { name: "Mexico Beach Escape", location: "Cancun, Mexico", cost: budget * 0.75 },
      { name: "Morocco Desert Adventure", location: "Marrakech, Morocco", cost: budget * 0.65 },
      { name: "Vietnam Discovery", location: "Hanoi & Ho Chi Minh City", cost: budget * 0.55 }
    ];

    return budgetDestinations.map((dest, index) => ({
      id: `budget-${index + 1}`,
      name: dest.name,
      location: dest.location,
      cost: dest.cost,
      duration: `${duration || 7} days`,
      tags: ["Budget", "Value", ...(preferences || [])],
      description: `Perfect budget-friendly trip to ${dest.location} for ${budget} ${currency}. Includes accommodation, local transportation, and authentic cultural experiences.`,
      rating: 4.0 + Math.random() * 0.5,
      includes: ["Hostel/Hotel", "Local Transport", "Some Meals", "Cultural Activities"],
      bestTimeToVisit: "Off-season for better prices",
      weatherInfo: "Check local weather",
      culturalHighlights: ["Local Markets", "Free Walking Tours", "Cultural Sites"]
    }));
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

      const response = await this.model.generateContent(prompt);
      const responseText = response.response?.text();
      
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      try {
        return JSON.parse(responseText) as RouteOptimization;
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        // Fallback response
        return {
          totalDistance: "1,200 km",
          totalDuration: "14 days",
          estimatedCost: "$2,500",
          route: [
            {
              order: 1,
              destination: "Paris",
              arrivalTime: "Day 1",
              stayDuration: "3 days",
              activities: ["Visit Eiffel Tower", "Louvre Museum", "Notre-Dame"],
              estimatedCost: "$800",
              travelTime: "6 hours",
              accommodationSuggestions: ["Hotel A", "Hotel B"]
            }
          ],
          recommendations: ["Book flights early", "Pack for all weather"],
          weatherWarnings: ["Check weather forecasts"],
          budgetBreakdown: {
            transportation: "$600",
            accommodation: "$1,200",
            food: "$400",
            activities: "$300",
            total: "$2,500"
          }
        };
      }
    } catch (error) {
      console.error("Gemini route optimization error:", error);
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
      console.log("[GEMINI] Generating travel assistance for query:", query.substring(0, 50) + "...");
      const response = await this.model.generateContent(prompt);
      const responseText = response.response?.text();
      
      if (!responseText) {
        console.error("[GEMINI] No response text received from API");
        throw new Error("No response from Gemini API");
      }

      console.log("[GEMINI] Raw response received, length:", responseText.length);
      
      try {
        const parsed = processResponse(responseText);
        console.log("[GEMINI] Successfully parsed response, category:", parsed.category);
        return parsed;
      } catch (parseError: any) {
        console.error("[GEMINI] Failed to parse Gemini response:", parseError.message);
        console.error("[GEMINI] Raw response text:", responseText.substring(0, 500));
        // Fallback response
        return {
          query,
          response: "I'm here to help with your travel questions! Please ask me anything about destinations, planning, booking, or travel tips.",
          category: "general",
          confidence: 70,
          relatedSuggestions: [
            "What are the best travel destinations for my budget?",
            "How do I plan a trip efficiently?",
            "What should I pack for my destination?"
          ]
        };
      }
    } catch (error: any) {
      console.error("[GEMINI] Travel assistance error occurred");
      console.error("[GEMINI] Error type:", error?.constructor?.name || typeof error);
      console.error("[GEMINI] Error message:", error?.message || "Unknown error");
      console.error("[GEMINI] Error stack:", error?.stack);
      
      // Check for model not found errors (404)
      if (error?.message?.includes("404") || 
          error?.message?.includes("not found") || 
          error?.message?.includes("is not found for API version") ||
          error?.status === 404) {
        console.error("[GEMINI] Model not found error detected - trying alternative model");
        // Try with alternative model name
        try {
          const altModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
          const altResponse = await altModel.generateContent(prompt);
          const altResponseText = altResponse.response?.text();
          if (altResponseText) {
            const parsed = processResponse(altResponseText);
            console.log("[GEMINI] Successfully parsed response with alternative model");
            return parsed;
          }
        } catch (altError) {
          console.error("[GEMINI] Alternative model also failed:", altError);
        }
        throw new Error("Gemini model is not available. Please check your API key and model configuration.");
      }
      
      // Check for API key errors
      if (error?.message?.includes("API key") || 
          error?.message?.includes("GEMINI_API_KEY") ||
          error?.message?.includes("API_KEY_NOT_FOUND") ||
          error?.status === 401) {
        console.error("[GEMINI] API key configuration issue detected");
        throw new Error("Gemini API key is not configured or invalid. Please check your environment variables.");
      }
      
      // Check for quota/limit errors
      if (error?.message?.includes("quota") || 
          error?.message?.includes("limit") ||
          error?.status === 429) {
        console.error("[GEMINI] API quota/limit issue detected");
        throw new Error("Gemini API quota exceeded. Please try again later.");
      }
      
      // Check for network errors
      if (error?.message?.includes("network") || 
          error?.code === "ECONNREFUSED" || 
          error?.code === "ETIMEDOUT" ||
          error?.message?.includes("fetch")) {
        console.error("[GEMINI] Network error detected");
        throw new Error("Network error connecting to Gemini API. Please check your internet connection.");
      }
      
      // Generic error with more context
      const errorMessage = error?.message || "Failed to provide travel assistance";
      console.error("[GEMINI] Throwing error:", errorMessage);
      throw new Error(`Failed to provide travel assistance: ${errorMessage}`);
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
      const prompt = `Provide comprehensive travel insights for ${destination}. Include:
      
      1. Overview (150 words)
      2. Top 8 attractions/activities
      3. Must-try cuisine/dishes (6 items)
      4. Cultural notes and etiquette
      5. Daily budget estimates (low/medium/high)
      6. Best time to visit with reasoning
      7. 5 practical insider tips

      Return as JSON:
      {
        "overview": "Detailed destination overview...",
        "attractions": ["Attraction 1", "Attraction 2", ...],
        "cuisine": ["Dish 1", "Dish 2", ...],
        "culture": "Cultural insights...",
        "budget": {
          "low": "$30-50/day",
          "medium": "$80-120/day", 
          "high": "$200+/day"
        },
        "bestTime": "March to May for...",
        "tips": ["Tip 1", "Tip 2", ...]
      }`;

      const response = await this.model.generateContent(prompt);
      const responseText = response.response?.text();
      
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        // Fallback response
        return {
          overview: `Discover the amazing destination of ${destination} with its unique culture, attractions, and experiences.`,
          attractions: ["Main attraction 1", "Main attraction 2", "Main attraction 3", "Main attraction 4", "Main attraction 5", "Main attraction 6", "Main attraction 7", "Main attraction 8"],
          cuisine: ["Local dish 1", "Local dish 2", "Local dish 3", "Local dish 4", "Local dish 5", "Local dish 6"],
          culture: "Rich cultural heritage with unique traditions and customs.",
          budget: {
            low: "$30-50/day",
            medium: "$80-120/day",
            high: "$200+/day"
          },
          bestTime: "Year-round destination with peak season during spring and fall.",
          tips: ["Tip 1: Research local customs", "Tip 2: Book accommodations early", "Tip 3: Learn basic local phrases", "Tip 4: Check weather forecasts", "Tip 5: Respect local traditions"]
        };
      }
    } catch (error) {
      console.error("Gemini destination insights error:", error);
      throw new Error("Failed to generate destination insights");
    }
  }
}

export const geminiService = new GeminiTravelService();