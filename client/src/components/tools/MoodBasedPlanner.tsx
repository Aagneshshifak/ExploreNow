
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Waves, Mountain, Church, UtensilsCrossed, Music } from "lucide-react";

const MoodBasedPlanner = () => {
  const [selectedMood, setSelectedMood] = useState("");
  const [plan, setPlan] = useState(null);

  const moods = [
    {
      id: "party",
      name: "Party",
      icon: <PartyPopper className="w-8 h-8" />,
      emoji: "🎉",
      color: "bg-pink-500",
      description: "High-energy nightlife and festivals"
    },
    {
      id: "chill",
      name: "Chill",
      icon: <Waves className="w-8 h-8" />,
      emoji: "😌",
      color: "bg-blue-500",
      description: "Relaxing beaches and peaceful retreats"
    },
    {
      id: "adventure",
      name: "Adventure",
      icon: <Mountain className="w-8 h-8" />,
      emoji: "🔥",
      color: "bg-orange-500",
      description: "Thrilling activities and extreme sports"
    },
    {
      id: "spiritual",
      name: "Spiritual",
      icon: <Church className="w-8 h-8" />,
      emoji: "🧘",
      color: "bg-purple-500",
      description: "Sacred places and mindful experiences"
    },
    {
      id: "foodie",
      name: "Foodie",
      icon: <UtensilsCrossed className="w-8 h-8" />,
      emoji: "🍽️",
      color: "bg-green-500",
      description: "Culinary tours and local delicacies"
    }
  ];

  const moodPlans = {
    party: {
      places: ["Goa", "Mumbai", "Bangalore", "Manali"],
      activities: [
        "Beach parties and music festivals",
        "Nightclub hopping tours",
        "Live music venues",
        "Rooftop bar experiences",
        "DJ nights and dance events"
      ],
      playlist: "High Energy Party Hits",
      food: [
        "Street food crawls",
        "Late-night dining spots",
        "Trendy rooftop restaurants",
        "Beach shacks with live music"
      ],
      budget: "₹15,000 - 35,000",
      duration: "3-5 days"
    },
    chill: {
      places: ["Kerala Backwaters", "Rishikesh", "Udaipur", "Munnar"],
      activities: [
        "Spa and wellness retreats",
        "Houseboat stays",
        "Sunset watching",
        "Meditation sessions",
        "Nature walks and yoga"
      ],
      playlist: "Ambient Chill Vibes",
      food: [
        "Healthy organic cafes",
        "Traditional Ayurvedic meals",
        "Lakeside dining",
        "Tea plantation tours"
      ],
      budget: "₹10,000 - 25,000",
      duration: "4-7 days"
    },
    adventure: {
      places: ["Ladakh", "Himachal Pradesh", "Uttarakhand", "Rajasthan"],
      activities: [
        "Trekking and mountaineering",
        "River rafting adventures",
        "Desert safari experiences",
        "Rock climbing and rappelling",
        "Paragliding and zip-lining"
      ],
      playlist: "Adventure Rock Anthems",
      food: [
        "Mountain camp meals",
        "Local dhaba experiences",
        "Energy-rich trail foods",
        "Traditional hill station cuisine"
      ],
      budget: "₹20,000 - 40,000",
      duration: "5-10 days"
    },
    spiritual: {
      places: ["Varanasi", "Rishikesh", "Amritsar", "Bodh Gaya"],
      activities: [
        "Temple visits and prayers",
        "Meditation and yoga retreats",
        "Spiritual discourse sessions",
        "River Ganga ceremonies",
        "Pilgrimage walks"
      ],
      playlist: "Sacred Chants & Mantras",
      food: [
        "Prasadam and temple food",
        "Vegetarian thali experiences",
        "Ashram meal participation",
        "Traditional sattvic cuisine"
      ],
      budget: "₹8,000 - 20,000",
      duration: "3-7 days"
    },
    foodie: {
      places: ["Delhi", "Mumbai", "Kolkata", "Chennai"],
      activities: [
        "Street food tours",
        "Cooking classes with locals",
        "Market visits and spice tours",
        "Traditional restaurant experiences",
        "Food festival participation"
      ],
      playlist: "International Cafe Sounds",
      food: [
        "Regional specialties exploration",
        "Fine dining experiences",
        "Local market tastings",
        "Celebrity chef restaurants"
      ],
      budget: "₹12,000 - 30,000",
      duration: "3-6 days"
    }
  };

  const handleSelectMood = (moodId) => {
    setSelectedMood(moodId);
    setPlan(moodPlans[moodId]);
  };

  return (
    <div className="space-y-6">
      {!selectedMood ? (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">What's Your Travel Mood?</h3>
            <p className="text-muted-foreground">
              Choose your vibe and we'll create the perfect trip plan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moods.map((mood) => (
              <Card 
                key={mood.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => handleSelectMood(mood.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${mood.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                    {mood.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {mood.emoji} {mood.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{mood.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <span className="text-2xl">
                  {moods.find(m => m.id === selectedMood)?.emoji}
                </span>
                <span>Your {moods.find(m => m.id === selectedMood)?.name} Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Range</p>
                  <p className="font-semibold">{plan.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{plan.duration}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Places */}
          <Card>
            <CardHeader>
              <CardTitle>Perfect Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {plan.places.map((place, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {place}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Activities & Experiences</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.activities.map((activity, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Food */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5" />
                <span>Food Experiences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.food.map((food, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{food}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Playlist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Music className="w-5 h-5" />
                <span>Your Travel Playlist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{plan.playlist}</p>
                  <p className="text-sm text-muted-foreground">Curated for your mood</p>
                </div>
                <Button size="sm" className="ml-auto">
                  Listen Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button className="flex-1">
              Book This Plan
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setSelectedMood("")}>
              Choose Different Mood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodBasedPlanner;
