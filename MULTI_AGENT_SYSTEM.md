# Multi-Agent AI System

## Overview

The ExploreNow Multi-Agent AI System is a sophisticated, collaborative AI architecture where specialized agents work together to solve complex travel-related tasks. Unlike traditional single-AI systems, this implementation uses multiple specialized agents that can operate independently or collaborate to provide comprehensive solutions.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                        │
│  - Analyzes incoming queries                                 │
│  - Routes to appropriate agent(s)                            │
│  - Coordinates multi-agent collaboration                     │
│  - Combines results from multiple agents                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Planning   │    │ Information  │    │   Booking    │
│    Agent     │    │    Agent     │    │    Agent     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Translation  │    │   Currency   │
│    Agent     │    │    Agent     │
└──────────────┘    └──────────────┘
```

## Specialized Agents

### 1. Orchestrator Agent
**Role**: Main coordinator and router
**Capabilities**:
- Query analysis and intent detection
- Agent selection and routing
- Multi-agent task coordination
- Result combination and synthesis

**Example Queries**:
- Any complex query requiring multiple agents
- "Plan a trip to Japan with visa info and currency conversion"

### 2. Planning Agent
**Role**: Trip planning and itinerary creation
**Capabilities**:
- Trip planning
- Itinerary creation
- Route optimization
- Budget planning

**Example Queries**:
- "Plan a 5-day trip to Paris"
- "Create an itinerary for Thailand"
- "Suggest a weekend getaway from New York"

### 3. Information Agent
**Role**: Destination and travel information
**Capabilities**:
- Destination information
- Hotel search and recommendations
- Attraction details
- Restaurant recommendations

**Example Queries**:
- "Tell me about hotels in Tokyo"
- "What are the top attractions in Rome?"
- "Find restaurants in Barcelona"

### 4. Booking Agent
**Role**: Booking guidance and reservations
**Capabilities**:
- Hotel booking guidance
- Flight booking tips
- Activity reservations
- Booking platform recommendations

**Example Queries**:
- "How do I book a hotel in Paris?"
- "Best platforms for flight booking"
- "Reserve activities in Bali"

### 5. Translation Agent
**Role**: Language translation and cultural context
**Capabilities**:
- Text translation
- Language detection
- Phrase translation
- Cultural context

**Example Queries**:
- "Translate 'hello' to Spanish"
- "How do you say 'thank you' in Japanese?"
- "Translate this menu to English"

### 6. Currency Agent
**Role**: Currency conversion and exchange rates
**Capabilities**:
- Currency conversion
- Exchange rate information
- Budget conversion
- Money-saving tips

**Example Queries**:
- "Convert 1000 USD to EUR"
- "What's the exchange rate for GBP to INR?"
- "How much is 500 EUR in Japanese Yen?"

## How It Works

### Single-Agent Execution
For simple queries, the orchestrator routes to a single specialized agent:

```
User Query: "Translate hello to Spanish"
    ↓
Orchestrator analyzes query
    ↓
Routes to Translation Agent
    ↓
Translation Agent processes
    ↓
Returns: "Hola"
```

### Multi-Agent Collaboration
For complex queries, multiple agents work together:

```
User Query: "Plan a trip to Japan with visa info and currency"
    ↓
Orchestrator analyzes query
    ↓
Identifies need for: Planning + Information + Currency agents
    ↓
Planning Agent: Creates trip itinerary
    ↓ (passes context)
Information Agent: Adds visa requirements
    ↓ (passes context)
Currency Agent: Adds budget conversion
    ↓
Orchestrator combines all results
    ↓
Returns: Comprehensive trip plan with visa info and budget
```

## API Usage

### Endpoint
```
POST /api/ai/agent-system
```

### Request Body
```json
{
  "query": "Plan a 5-day trip to Tokyo with hotel recommendations",
  "userContext": {
    "location": "New York",
    "budget": 3000,
    "travelDates": "2024-06-01 to 2024-06-05"
  }
}
```

### Response
```json
{
  "success": true,
  "data": {
    "agentType": "orchestrator",
    "success": true,
    "data": {
      "planning": {
        "response": "# 5-Day Tokyo Itinerary...",
        "category": "planning",
        "confidence": 90
      },
      "information": {
        "response": "# Hotel Recommendations...",
        "category": "destination",
        "confidence": 85
      }
    },
    "message": "Successfully processed request using 2 agent(s)",
    "toolsUsed": ["groq_ai", "web_search", "database"],
    "confidence": 85,
    "multiAgent": true
  }
}
```

## UI Features

### Agent System Page (`/agent-system`)

**Features**:
1. **Agent Visualization**: See all available agents with icons
2. **Query Input**: Natural language query interface
3. **Multi-Agent Response**: See which agents collaborated
4. **Confidence Scores**: View confidence levels for responses
5. **Tools Used**: Track which tools each agent utilized

**Visual Indicators**:
- Each agent has a unique color and icon
- Active agents are highlighted during processing
- Response sections are color-coded by agent

## Advantages Over Single-AI Systems

### 1. Specialization
Each agent is optimized for specific tasks, providing better accuracy and relevance.

### 2. Scalability
New agents can be added without modifying existing ones.

### 3. Maintainability
Bugs and improvements can be isolated to specific agents.

### 4. Flexibility
Agents can work independently or collaborate based on query complexity.

### 5. Transparency
Users can see which agents handled their request and how they collaborated.

## Example Use Cases

### Use Case 1: Simple Translation
```
Query: "Translate 'good morning' to French"
Agents Used: Translation Agent
Response Time: ~2 seconds
Result: "Bonjour"
```

### Use Case 2: Trip Planning
```
Query: "Plan a 7-day trip to Italy"
Agents Used: Planning Agent
Response Time: ~5 seconds
Result: Detailed 7-day itinerary with activities, timing, and recommendations
```

### Use Case 3: Complex Multi-Agent Task
```
Query: "Plan a budget trip to Thailand, include visa requirements, currency conversion, and hotel recommendations"
Agents Used: Planning Agent → Information Agent → Currency Agent
Response Time: ~8 seconds
Result: 
- Complete trip itinerary (Planning Agent)
- Visa requirements and process (Information Agent)
- Budget in THB with conversion rates (Currency Agent)
- Hotel recommendations with prices (Information Agent)
```

### Use Case 4: Booking Assistance
```
Query: "How do I book a hotel in Paris and what's the best platform?"
Agents Used: Booking Agent → Information Agent
Response Time: ~4 seconds
Result:
- Booking platform recommendations (Booking Agent)
- Specific hotel suggestions in Paris (Information Agent)
- Booking tips and best practices (Booking Agent)
```

## Technical Implementation

### Base Agent Class
All agents inherit from `BaseAgent`:

```typescript
abstract class BaseAgent {
  protected name: string;
  protected type: AgentType;
  protected capabilities: string[];
  
  abstract canHandle(query: string, context?: any): boolean;
  abstract execute(query: string, context?: any): Promise<AgentResponse>;
}
```

### Agent Registration
Agents are registered with the orchestrator:

```typescript
const orchestrator = new OrchestratorAgent();
orchestrator.registerAgent(new PlanningAgent());
orchestrator.registerAgent(new InformationAgent());
orchestrator.registerAgent(new BookingAgent());
orchestrator.registerAgent(new TranslationAgent());
orchestrator.registerAgent(new CurrencyAgent());
```

### Query Processing
```typescript
const agentSystem = new AgentSystemManager();
const result = await agentSystem.processQuery(query, context);
```

## Future Enhancements

### Planned Features
1. **Memory Agent**: Remember user preferences across sessions
2. **Recommendation Agent**: Proactive suggestions based on user history
3. **Comparison Agent**: Compare multiple options (hotels, flights, etc.)
4. **Review Agent**: Analyze and summarize reviews
5. **Weather Agent**: Real-time weather information and forecasts
6. **Event Agent**: Find local events and festivals
7. **Safety Agent**: Safety tips and travel advisories

### Advanced Capabilities
1. **Agent Learning**: Agents improve based on user feedback
2. **Dynamic Agent Creation**: Create specialized agents on-demand
3. **Agent Marketplace**: Community-contributed agents
4. **Cross-Agent Communication**: Agents can request help from each other
5. **Parallel Execution**: Multiple agents work simultaneously

## Performance Metrics

### Response Times
- Single Agent: 2-5 seconds
- Multi-Agent (2 agents): 4-8 seconds
- Multi-Agent (3+ agents): 6-12 seconds

### Accuracy
- Planning Agent: 90% confidence average
- Information Agent: 85% confidence average
- Translation Agent: 95% confidence average
- Currency Agent: 98% confidence average
- Booking Agent: 88% confidence average

## Troubleshooting

### Common Issues

**Issue**: Agent not responding
**Solution**: Check if Groq API key is configured correctly

**Issue**: Low confidence scores
**Solution**: Provide more context in the query

**Issue**: Wrong agent selected
**Solution**: Be more specific in your query wording

**Issue**: Slow response times
**Solution**: Check network connection and API rate limits

## Best Practices

### Query Formulation
1. Be specific about what you need
2. Include relevant context (budget, dates, preferences)
3. Use natural language
4. Break complex requests into clear parts

### Example Good Queries
✅ "Plan a 5-day trip to Paris with a budget of $2000"
✅ "Find family-friendly hotels in Tokyo near Shibuya"
✅ "Translate this restaurant menu to English: [menu text]"
✅ "Convert my $3000 budget to Euros and suggest trip options"

### Example Poor Queries
❌ "Trip" (too vague)
❌ "Hotels" (no location specified)
❌ "Translate" (no text or target language)
❌ "Money" (unclear intent)

## Contributing

To add a new agent:

1. Create a new class extending `BaseAgent`
2. Implement `canHandle()` and `execute()` methods
3. Register the agent with the orchestrator
4. Add UI visualization (icon, color)
5. Update documentation

Example:
```typescript
export class WeatherAgent extends BaseAgent {
  constructor() {
    super("Weather Agent", "weather", ["weather_forecast", "climate_info"]);
  }

  canHandle(query: string): boolean {
    const keywords = ["weather", "forecast", "temperature", "climate"];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async execute(query: string, context?: any): Promise<AgentResponse> {
    // Implementation
  }
}
```

## License

This multi-agent system is part of the ExploreNow platform and follows the same license.

## Support

For issues or questions about the multi-agent system:
- Check the troubleshooting section above
- Review the example use cases
- Contact the development team

---

**Built with ❤️ using TypeScript, React, and Groq AI**
