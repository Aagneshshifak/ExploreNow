import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PartyPopper, Waves, Mountain, Church, UtensilsCrossed, TreePine } from "lucide-react";

interface Answers {
  pace?: string;
  accommodation?: string;
  activity?: string;
  company?: string;
  budget?: string;
}

const TravelDNAQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState(null);

  const questions = [
    {
      id: "pace",
      question: "What's your ideal travel pace?",
      options: [
        { value: "fast", label: "Fast-paced, see everything", icon: "🏃‍♀️" },
        { value: "moderate", label: "Balanced mix of activities", icon: "🚶‍♀️" },
        { value: "slow", label: "Slow and immersive", icon: "🧘‍♀️" }
      ]
    },
    {
      id: "accommodation",
      question: "Where do you prefer to stay?",
      options: [
        { value: "luxury", label: "Luxury hotels", icon: "🏨" },
        { value: "boutique", label: "Boutique properties", icon: "🏡" },
        { value: "budget", label: "Budget-friendly options", icon: "🏨" }
      ]
    },
    {
      id: "activity",
      question: "What excites you most?",
      options: [
        { value: "party", label: "Nightlife & parties", icon: "🎉" },
        { value: "nature", label: "Nature & outdoors", icon: "🌲" },
        { value: "culture", label: "Culture & history", icon: "🏛️" },
        { value: "food", label: "Local cuisine", icon: "🍜" }
      ]
    },
    {
      id: "company",
      question: "Who do you travel with?",
      options: [
        { value: "solo", label: "Solo adventures", icon: "🎒" },
        { value: "friends", label: "With friends", icon: "👥" },
        { value: "family", label: "Family trips", icon: "👨‍👩‍👧‍👦" }
      ]
    },
    {
      id: "budget",
      question: "What's your budget style?",
      options: [
        { value: "luxury", label: "Money's no object", icon: "💎" },
        { value: "moderate", label: "Comfortable spending", icon: "💰" },
        { value: "budget", label: "Value for money", icon: "🪙" }
      ]
    }
  ];

  const personalities = {
    "party-luxury": {
      type: "The Luxe Party Animal",
      description: "You love high-end nightlife and premium experiences",
      destinations: ["Ibiza", "Dubai", "Las Vegas", "Monaco"],
      playlist: "High Energy Electronic Hits"
    },
    "nature-budget": {
      type: "The Eco Explorer",
      description: "You seek authentic nature experiences on a budget",
      destinations: ["Nepal", "Costa Rica", "New Zealand", "Norway"],
      playlist: "Acoustic Nature Vibes"
    },
    "culture-moderate": {
      type: "The Cultural Connoisseur",
      description: "You appreciate history, art, and local traditions",
      destinations: ["Japan", "Italy", "India", "Morocco"],
      playlist: "World Music Fusion"
    },
    "food-solo": {
      type: "The Solo Foodie",
      description: "You travel to taste the world's cuisines",
      destinations: ["Vietnam", "Thailand", "France", "Peru"],
      playlist: "International Cafe Sounds"
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const personalityKey = `${newAnswers.activity}-${newAnswers.budget}`;
      const personality = personalities[personalityKey] || personalities["culture-moderate"];
      setResult(personality);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TreePine className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{result.type}</h3>
            <p className="text-muted-foreground">{result.description}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Perfect Destinations for You</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {result.destinations.map((dest) => (
                  <Badge key={dest} variant="outline">{dest}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Your Travel Playlist</h4>
              <Badge className="bg-primary text-primary-foreground">
                🎵 {result.playlist}
              </Badge>
            </div>
          </div>

          <Button onClick={resetQuiz} className="w-full mt-6" variant="outline">
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Travel DNA Quiz</h3>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        
        <Progress value={(currentQuestion + 1) / questions.length * 100} className="w-full" />
        
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium mb-4">
              {questions[currentQuestion].question}
            </h4>
            
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleAnswer(option.value)}
                >
                  <span className="text-xl mr-3">{option.icon}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TravelDNAQuiz;
