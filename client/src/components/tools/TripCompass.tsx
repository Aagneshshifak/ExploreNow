
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star } from "lucide-react";

const TripCompass = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [isSwipeMode, setIsSwipeMode] = useState(true);

  const destinations = [
    {
      id: 1,
      name: "Santorini, Greece",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400",
      fact: "Famous for its stunning blue-domed churches and romantic sunsets",
      rating: 4.8,
      type: "Island Paradise"
    },
    {
      id: 2,
      name: "Kyoto, Japan",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400",
      fact: "Home to over 2,000 temples and traditional wooden houses",
      rating: 4.9,
      type: "Cultural Heritage"
    },
    {
      id: 3,
      name: "Banff, Canada",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
      fact: "Pristine wilderness with turquoise lakes and snow-capped mountains",
      rating: 4.7,
      type: "Nature Adventure"
    },
    {
      id: 4,
      name: "Marrakech, Morocco",
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73dc6?w=400",
      fact: "The 'Red City' with vibrant souks and stunning architecture",
      rating: 4.6,
      type: "Exotic Culture"
    },
    {
      id: 5,
      name: "Bali, Indonesia",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400",
      fact: "Tropical paradise with ancient temples and emerald rice terraces",
      rating: 4.8,
      type: "Tropical Retreat"
    }
  ];

  const handleSwipe = (direction) => {
    const destination = destinations[currentCard];
    
    if (direction === "right" && destination) {
      setSavedPlaces([...savedPlaces, destination]);
    }
    
    if (currentCard < destinations.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      setIsSwipeMode(false);
    }
  };

  const resetSwipe = () => {
    setCurrentCard(0);
    setSavedPlaces([]);
    setIsSwipeMode(true);
  };

  if (!isSwipeMode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Great Taste!</h3>
            <p className="text-muted-foreground mb-4">
              You've saved {savedPlaces.length} amazing destinations
            </p>
            <Button onClick={resetSwipe} className="w-full">
              Discover More Places
            </Button>
          </CardContent>
        </Card>

        {savedPlaces.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Saved Favorites</h3>
              <div className="space-y-3">
                {savedPlaces.map((place) => (
                  <div key={place.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <img 
                      src={place.image} 
                      alt={place.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{place.name}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(place.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{place.rating}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{place.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const currentDestination = destinations[currentCard];

  if (!currentDestination) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No more destinations to show!</p>
        <Button onClick={resetSwipe} className="mt-4">Start Over</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Trip Compass™</h3>
        <p className="text-sm text-muted-foreground">
          Swipe right to save • Swipe left to skip
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="relative">
          <img 
            src={currentDestination.image} 
            alt={currentDestination.name}
            className="w-full h-48 object-cover"
          />
          <Badge className="absolute top-4 right-4 bg-black/70 text-white">
            {currentDestination.type}
          </Badge>
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold">{currentDestination.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{currentDestination.rating}</span>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">{currentDestination.fact}</p>
          
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex-1 border-red-200 hover:bg-red-50"
              onClick={() => handleSwipe("left")}
            >
              <X className="w-5 h-5 mr-2 text-red-500" />
              Skip
            </Button>
            <Button 
              size="lg" 
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => handleSwipe("right")}
            >
              <Heart className="w-5 h-5 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        {currentCard + 1} of {destinations.length} destinations
      </div>
    </div>
  );
};

export default TripCompass;
