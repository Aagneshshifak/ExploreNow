import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
  private model = "gemini-2.5-flash";

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

      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                location: { type: "string" },
                cost: { type: "number" },
                duration: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                rating: { type: "number" },
                includes: { type: "array", items: { type: "string" } },
                bestTimeToVisit: { type: "string" },
                weatherInfo: { type: "string" },
                culturalHighlights: { type: "array", items: { type: "string" } }
              },
              required: ["id", "name", "location", "cost", "duration", "tags", "description", "rating", "includes"]
            }
          }
        },
        contents: prompt,
      });

      const recommendations = JSON.parse(response.text || "[]") as TripRecommendation[];
      return recommendations.slice(0, 6);
    } catch (error) {
      console.error("Gemini trip recommendations error:", error);
      throw new Error("Failed to generate AI trip recommendations");
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

      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              totalDistance: { type: "string" },
              totalDuration: { type: "string" },
              estimatedCost: { type: "string" },
              route: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    destination: { type: "string" },
                    arrivalTime: { type: "string" },
                    stayDuration: { type: "string" },
                    activities: { type: "array", items: { type: "string" } },
                    estimatedCost: { type: "string" },
                    travelTime: { type: "string" },
                    accommodationSuggestions: { type: "array", items: { type: "string" } }
                  }
                }
              },
              recommendations: { type: "array", items: { type: "string" } },
              weatherWarnings: { type: "array", items: { type: "string" } },
              budgetBreakdown: {
                type: "object",
                properties: {
                  transportation: { type: "string" },
                  accommodation: { type: "string" },
                  food: { type: "string" },
                  activities: { type: "string" },
                  total: { type: "string" }
                }
              }
            }
          }
        },
        contents: prompt,
      });

      return JSON.parse(response.text || "{}") as RouteOptimization;
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
    try {
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

      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
              response: { type: "string" },
              category: { type: "string", enum: ["planning", "booking", "destination", "general"] },
              confidence: { type: "number" },
              relatedSuggestions: { type: "array", items: { type: "string" } }
            },
            required: ["query", "response", "category", "confidence", "relatedSuggestions"]
          }
        },
        contents: prompt,
      });

      return JSON.parse(response.text || "{}") as TravelAssistance;
    } catch (error) {
      console.error("Gemini travel assistance error:", error);
      throw new Error("Failed to provide travel assistance");
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

      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: "application/json"
        },
        contents: prompt,
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini destination insights error:", error);
      throw new Error("Failed to generate destination insights");
    }
  }
}

export const geminiService = new GeminiTravelService();