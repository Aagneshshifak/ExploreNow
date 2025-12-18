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
  
  console.log("[GROQ] Initializing with API key (length:", apiKey.length, "characters)");
  console.log("[GROQ] API key starts with:", apiKey.substring(0, 10) + "...");
  
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

export class GeminiTravelService {
  // Default model for Groq (can be overridden)
  // Updated to use currently available models as of 2025
  private defaultModel = "llama-3.3-70b-versatile";
  
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
      let recommendations: TripRecommendation[] = [];
      try {
        recommendations = processResponse(text);
        console.log("[GROQ] Successfully parsed", recommendations.length, "recommendations");
      } catch (parseError: any) {
        console.error("[GROQ] JSON parsing error:", parseError.message);
        console.error("[GROQ] Raw response text:", text.substring(0, 500));
        // Only use mock recommendations for parsing errors, not API errors
        console.warn("[GROQ] Falling back to mock recommendations due to parsing error");
        recommendations = this.createMockRecommendations(budget, interests, duration, destination, travelStyle);
      }

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
        throw new Error("Groq API key is not configured or invalid. Please check your environment variables.");
      }
      
      // Check for quota/limit errors - return mock instead of throwing
      if (error?.status === 429 || 
          (error?.message?.toLowerCase().includes("quota") && error?.message?.toLowerCase().includes("exceeded")) ||
          (error?.message?.toLowerCase().includes("rate limit") && error?.message?.toLowerCase().includes("exceeded"))) {
        console.warn("[GROQ] API quota/limit exceeded - returning mock recommendations");
        console.warn("[GROQ] Quota error details:", error?.message);
        return this.createMockRecommendations(budget, interests, duration, destination, travelStyle);
      }
      
      // Check for network errors
      if (error?.message?.includes("network") || 
          error?.code === "ECONNREFUSED" || 
          error?.code === "ETIMEDOUT" ||
          error?.message?.includes("fetch")) {
        console.error("[GROQ] Network error detected");
        throw new Error("Network error connecting to Groq API. Please check your internet connection.");
      }
      
      // Generic error - fallback to mocks
      console.warn("[GROQ] Falling back to mock recommendations due to error");
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

      const text = await this.callGroqAPI(prompt);
      
      let recommendations: TripRecommendation[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]) as TripRecommendation[];
        } else {
          recommendations = this.createBudgetMockRecommendations(budget, currency, preferences, duration);
        }
      } catch (parseError) {
        console.error("[GROQ] Budget JSON parsing error:", parseError);
        recommendations = this.createBudgetMockRecommendations(budget, currency, preferences, duration);
      }

      return recommendations.slice(0, 6);
    } catch (error) {
      console.error("[GROQ] Budget suggestions error:", error);
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

      const responseText = await this.callGroqAPI(prompt);
      
      if (!responseText) {
        throw new Error("No response from Groq API");
      }

      try {
        return JSON.parse(responseText) as RouteOptimization;
      } catch (parseError) {
        console.error("[GROQ] Failed to parse route optimization response:", parseError);
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
      console.error("[GROQ] Route optimization error:", error);
      throw new Error("Failed to optimize travel route");
    }
  }

  /**
   * Generate a realistic mock travel assistance response when API quota is exceeded
   */
  private createMockTravelAssistance(
    query: string,
    userContext?: {
      location?: string;
      budget?: number;
      travelDates?: string;
      groupSize?: number;
    }
  ): TravelAssistance {
    const queryLower = query.toLowerCase();
    let category: 'planning' | 'booking' | 'destination' | 'general' = 'general';
    let response = '';
    let relatedSuggestions: string[] = [];

    // Determine category and generate contextual response
    if (queryLower.includes('plan') || queryLower.includes('itinerary') || queryLower.includes('trip')) {
      category = 'planning';
      const destination = query.match(/\b(goa|paris|tokyo|bali|dubai|mumbai|delhi|bangkok|singapore|new york|london|rome|barcelona|amsterdam|istanbul)\b/i)?.[0] || 'your destination';
      const budgetText = userContext?.budget ? ` with a budget of ${userContext.budget} ${userContext.location?.includes('India') ? 'INR' : 'USD'}` : '';
      const locationText = userContext?.location ? ` from ${userContext.location}` : '';
      
      response = `Here's a comprehensive travel plan for ${destination}${locationText}${budgetText}:

**Best Time to Visit:** ${destination.toLowerCase() === 'goa' ? 'October to March offers perfect weather with temperatures between 20-32°C. Avoid monsoon season (June-September).' : 'Spring and fall are ideal times with pleasant weather and fewer crowds.'}

**Duration Recommendation:** A ${destination.toLowerCase() === 'goa' ? '4-7 day' : '5-10 day'} trip would allow you to explore the main attractions comfortably.

**Key Attractions:** ${destination.toLowerCase() === 'goa' ? 'Visit beautiful beaches like Calangute and Baga, explore Portuguese heritage in Old Goa, enjoy water sports, and experience vibrant nightlife.' : 'Explore historical sites, local markets, cultural landmarks, and enjoy authentic cuisine.'}

**Accommodation:** ${userContext?.budget ? `With your budget, consider mid-range hotels or boutique stays. Book in advance for better rates.` : 'Book accommodations 2-3 months in advance for the best deals.'}

**Transportation:** ${locationText ? 'Look for direct flights or trains. Local transport includes taxis, auto-rickshaws, or rental vehicles.' : 'Research local transportation options including public transit, taxis, or car rentals.'}

**Tips:** Pack according to the season, carry local currency, learn basic local phrases, and respect local customs. ${destination.toLowerCase() === 'goa' ? 'Don\'t forget sunscreen and beach essentials!' : ''}`;

      relatedSuggestions = [
        `What are the must-visit places in ${destination}?`,
        `What's the best way to get around in ${destination}?`,
        `What should I pack for a trip to ${destination}?`
      ];
    } else if (queryLower.includes('book') || queryLower.includes('hotel') || queryLower.includes('flight')) {
      category = 'booking';
      response = `For booking your travel, I recommend:

**Booking Platforms:** Use reputable sites like Booking.com, Expedia, or direct airline/hotel websites. Compare prices across multiple platforms.

**Best Practices:**
- Book flights 6-8 weeks in advance for domestic, 2-3 months for international
- Hotels: Book 1-2 months ahead for better rates
- Check cancellation policies before booking
- Read recent reviews from verified travelers
- Consider travel insurance for international trips

**Money-Saving Tips:**
- Use incognito mode when searching to avoid price tracking
- Sign up for price alerts
- Consider flexible dates for better deals
- Look for package deals combining flights and hotels

**Verification:** Always verify booking confirmations and keep copies of receipts and confirmation numbers.`;

      relatedSuggestions = [
        "What's the best time to book flights?",
        "How can I find the best hotel deals?",
        "Should I book a package deal or separately?"
      ];
    } else if (queryLower.includes('where') || queryLower.includes('destination') || queryLower.includes('visit') || queryLower.includes('best place')) {
      category = 'destination';
      const budgetText = userContext?.budget ? ` within a budget of ${userContext.budget} ${userContext.location?.includes('India') ? 'INR' : 'USD'}` : '';
      response = `Based on your preferences${budgetText}, here are some excellent destination recommendations:

**For Beach Lovers:** Goa (India), Bali (Indonesia), Maldives, Phuket (Thailand)
**For Culture & History:** Paris (France), Rome (Italy), Kyoto (Japan), Istanbul (Turkey)
**For Adventure:** New Zealand, Switzerland, Nepal, Costa Rica
**For Budget Travel:** Thailand, Vietnam, Eastern Europe, India

**Considerations:**
- Weather and seasonality
- Visa requirements
- Local language and culture
- Safety and travel advisories
- Accessibility and transportation

**My Top Pick:** Based on your query, I'd recommend exploring destinations that match your interests. Research each destination's peak seasons, local customs, and must-see attractions before deciding.`;

      relatedSuggestions = [
        "What are the visa requirements for these destinations?",
        "What's the best time of year to visit?",
        "What are the must-see attractions?"
      ];
    } else {
      // General travel advice
      response = `I'm here to help with your travel question: "${query}"

Here's some helpful general travel advice:

**Planning Your Trip:**
- Research your destination thoroughly before booking
- Check travel advisories and entry requirements
- Plan your itinerary but leave room for spontaneity
- Budget for unexpected expenses (add 20% buffer)

**Safety & Health:**
- Check if vaccinations are required
- Get travel insurance
- Keep copies of important documents
- Register with your embassy if traveling internationally

**Money Matters:**
- Notify your bank about travel plans
- Carry multiple payment methods
- Research currency exchange rates
- Keep emergency cash

**Packing Smart:**
- Pack light and check airline baggage policies
- Bring essential medications
- Pack adapters for electronics
- Include weather-appropriate clothing

Feel free to ask more specific questions about destinations, planning, or booking!`;

      relatedSuggestions = [
        "How do I plan a budget-friendly trip?",
        "What travel documents do I need?",
        "What should I pack for my trip?"
      ];
    }

    return {
      query,
      response,
      category,
      confidence: 75,
      relatedSuggestions
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
      
      try {
        const parsed = processResponse(responseText);
        console.log("[GROQ] Successfully parsed response, category:", parsed.category);
        return parsed;
      } catch (parseError: any) {
        console.error("[GROQ] Failed to parse Groq response:", parseError.message);
        console.error("[GROQ] Raw response text:", responseText.substring(0, 500));
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
        throw new Error("Groq API key is not configured or invalid. Please check your environment variables.");
      }
      
      // Check for quota/limit errors - return mock response instead of throwing
      if (error?.status === 429 || 
          (error?.message?.toLowerCase().includes("quota") && error?.message?.toLowerCase().includes("exceeded")) ||
          (error?.message?.toLowerCase().includes("rate limit") && error?.message?.toLowerCase().includes("exceeded"))) {
        console.warn("[GROQ] API quota/limit exceeded - returning mock response for development");
        console.warn("[GROQ] Quota error details:", error?.message);
        // Return mock response instead of throwing error
        return this.createMockTravelAssistance(query, userContext);
      }
      
      // Check for network errors
      if (error?.message?.includes("network") || 
          error?.code === "ECONNREFUSED" || 
          error?.code === "ETIMEDOUT" ||
          error?.message?.includes("fetch")) {
        console.error("[GROQ] Network error detected");
        throw new Error("Network error connecting to Groq API. Please check your internet connection.");
      }
      
      // Generic error - return mock response
      console.warn("[GROQ] Returning mock response due to error");
      return this.createMockTravelAssistance(query, userContext);
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

export const geminiService = new GeminiTravelService();
