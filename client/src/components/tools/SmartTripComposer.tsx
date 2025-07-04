
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Calendar } from "lucide-react";

const SmartTripComposer = () => {
  const [formData, setFormData] = useState({
    destination: "",
    interests: "",
    budget: "",
    duration: "",
    travelers: 1
  });
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  const budgetRanges = [
    { value: "budget", label: "Budget (₹5,000 - 15,000)", icon: "💰" },
    { value: "moderate", label: "Moderate (₹15,000 - 35,000)", icon: "💵" },
    { value: "luxury", label: "Luxury (₹35,000+)", icon: "💎" }
  ];

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock itinerary generation
      const mockItinerary = {
        destination: formData.destination,
        totalCost: formData.budget === "budget" ? 12000 : formData.budget === "moderate" ? 25000 : 45000,
        days: [
          {
            day: 1,
            title: "Arrival & Local Exploration",
            activities: [
              { time: "10:00 AM", activity: "Hotel Check-in", type: "accommodation" },
              { time: "2:00 PM", activity: "Local Market Visit", type: "sightseeing" },
              { time: "7:00 PM", activity: "Welcome Dinner", type: "dining" }
            ]
          },
          {
            day: 2,
            title: "Cultural Immersion",
            activities: [
              { time: "9:00 AM", activity: "Heritage Site Tour", type: "sightseeing" },
              { time: "1:00 PM", activity: "Traditional Lunch", type: "dining" },
              { time: "4:00 PM", activity: "Art Gallery Visit", type: "culture" },
              { time: "8:00 PM", activity: "Cultural Show", type: "entertainment" }
            ]
          },
          {
            day: 3,
            title: "Adventure & Relaxation",
            activities: [
              { time: "8:00 AM", activity: "Adventure Activity", type: "adventure" },
              { time: "12:00 PM", activity: "Scenic Lunch", type: "dining" },
              { time: "3:00 PM", activity: "Spa Session", type: "wellness" },
              { time: "6:00 PM", activity: "Sunset Views", type: "sightseeing" }
            ]
          }
        ],
        hotels: [
          { name: "Heritage Grand Hotel", rating: 4.5, price: 3500 },
          { name: "Cultural Stay Inn", rating: 4.2, price: 2800 }
        ]
      };
      
      setItinerary(mockItinerary);
      setLoading(false);
    }, 2000);
  };

  const getActivityIcon = (type) => {
    const icons = {
      accommodation: "🏨",
      sightseeing: "📸",
      dining: "🍽️",
      culture: "🎭",
      entertainment: "🎪",
      adventure: "🏔️",
      wellness: "🧘‍♀️"
    };
    return icons[type] || "📍";
  };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-4">
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            placeholder="e.g., Rajasthan, Kerala, Himachal Pradesh"
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="interests">Your Interests</Label>
          <Textarea
            id="interests"
            placeholder="e.g., Culture, Adventure, Food, Photography, History"
            value={formData.interests}
            onChange={(e) => setFormData({...formData, interests: e.target.value})}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Budget Range</Label>
            <Select onValueChange={(value) => setFormData({...formData, budget: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    <div className="flex items-center space-x-2">
                      <span>{range.icon}</span>
                      <span>{range.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="30"
              placeholder="e.g., 5"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Composing Your Perfect Trip..." : "Generate Smart Itinerary"}
        </Button>
      </form>

      {itinerary && (
        <div className="space-y-6 animate-fade-in">
          {/* Trip Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Your {itinerary.destination} Adventure</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <DollarSign className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="font-semibold">₹{itinerary.totalCost.toLocaleString()}</p>
                </div>
                <div>
                  <Calendar className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{itinerary.days.length} Days</p>
                </div>
                <div>
                  <Clock className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="font-semibold">{itinerary.days.reduce((acc, day) => acc + day.activities.length, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Itinerary */}
          {itinerary.days.map((day) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Day {day.day}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{activity.activity}</p>
                          <Badge variant="outline" className="text-xs">
                            {activity.time}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Recommended Hotels */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Hotels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {itinerary.hotels.map((hotel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{hotel.name}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`text-xs ${i < Math.floor(hotel.rating) ? 'text-yellow-500' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{hotel.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{hotel.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button className="flex-1">
              Book All
            </Button>
            <Button variant="outline" className="flex-1">
              Customize Itinerary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTripComposer;
