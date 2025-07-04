
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Users, Eye } from "lucide-react";

const LiveCrowdHeatmaps = () => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const locations = [
    { value: "mumbai", name: "Mumbai", flag: "🏙️" },
    { value: "delhi", name: "Delhi", flag: "🏛️" },
    { value: "bangalore", name: "Bangalore", flag: "🌆" },
    { value: "goa", name: "Goa", flag: "🏖️" },
    { value: "kerala", name: "Kerala", flag: "🌴" },
    { value: "rajasthan", name: "Rajasthan", flag: "🏰" }
  ];

  const crowdData = {
    mumbai: {
      spots: [
        { name: "Gateway of India", crowd: "high", status: "Very Busy", color: "red" },
        { name: "Marine Drive", crowd: "medium", status: "Moderate", color: "yellow" },
        { name: "Juhu Beach", crowd: "low", status: "Peaceful", color: "green" },
        { name: "Colaba Market", crowd: "high", status: "Crowded", color: "red" }
      ],
      hiddenGems: [
        { name: "Worli Fort", description: "Historic fort with sea views, rarely crowded" },
        { name: "Mahim Nature Park", description: "Urban oasis perfect for morning walks" },
        { name: "Khotachiwadi Village", description: "Portuguese heritage village in the heart of the city" }
      ]
    },
    goa: {
      spots: [
        { name: "Baga Beach", crowd: "high", status: "Party Central", color: "red" },
        { name: "Anjuna Beach", crowd: "medium", status: "Moderate", color: "yellow" },
        { name: "Palolem Beach", crowd: "low", status: "Serene", color: "green" },
        { name: "Calangute Beach", crowd: "high", status: "Tourist Hub", color: "red" }
      ],
      hiddenGems: [
        { name: "Butterfly Beach", description: "Secluded beach accessible by boat" },
        { name: "Divar Island", description: "Peaceful island with Portuguese charm" },
        { name: "Chorao Island", description: "Bird sanctuary and mangrove forests" }
      ]
    }
  };

  const handleCheck = () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setTimeout(() => {
      setData(crowdData[selectedLocation] || crowdData.mumbai);
      setLoading(false);
    }, 1000);
  };

  const getCrowdIcon = (crowd) => {
    switch(crowd) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Select Location</Label>
          <Select onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a destination" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  <div className="flex items-center space-x-2">
                    <span>{location.flag}</span>
                    <span>{location.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCheck} 
          className="w-full"
          disabled={!selectedLocation || loading}
        >
          {loading ? "Checking..." : "Check Live Status"}
        </Button>
      </div>

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Crowd Status */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Current Crowd Status
              </h3>
              <div className="space-y-3">
                {data.spots.map((spot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCrowdIcon(spot.crowd)}</span>
                      <div>
                        <p className="font-medium">{spot.name}</p>
                        <p className="text-sm text-muted-foreground">{spot.status}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${spot.color === 'red' ? 'border-red-500 text-red-600' : ''}
                        ${spot.color === 'yellow' ? 'border-yellow-500 text-yellow-600' : ''}
                        ${spot.color === 'green' ? 'border-green-500 text-green-600' : ''}
                      `}
                    >
                      {spot.crowd}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hidden Gems */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                This Week's Hidden Gems
              </h3>
              <div className="space-y-4">
                {data.hiddenGems.map((gem, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{gem.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{gem.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveCrowdHeatmaps;
