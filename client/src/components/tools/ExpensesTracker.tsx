
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Train, Bus, Car, Hotel, UtensilsCrossed, MapPin } from "lucide-react";

const ExpensesTracker = () => {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    travelers: 1,
    mode: "",
    class: "economy",
    addOns: {
      hotel: false,
      food: false,
      transport: false
    }
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const travelModes = [
    { value: "flight", label: "Flight", icon: <Plane className="w-4 h-4" /> },
    { value: "train", label: "Train", icon: <Train className="w-4 h-4" /> },
    { value: "bus", label: "Bus", icon: <Bus className="w-4 h-4" /> },
    { value: "car", label: "Car", icon: <Car className="w-4 h-4" /> }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const baseCosts = {
        flight: 5000,
        train: 1500,
        bus: 800,
        car: 2000
      };
      
      const baseCost = baseCosts[formData.mode as keyof typeof baseCosts] || 0;
      const classMutiplier = formData.class === "business" ? 2.5 : 1;
      const travelCost = baseCost * classMutiplier * formData.travelers;
      
      const hotelCost = formData.addOns.hotel ? 2000 * formData.travelers : 0;
      const foodCost = formData.addOns.food ? 500 * formData.travelers : 0;
      const transportCost = formData.addOns.transport ? 200 * formData.travelers : 0;
      
      const total = travelCost + hotelCost + foodCost + transportCost;
      
      setResult({
        distance: "450 km",
        duration: "6 hours",
        breakdown: {
          travel: travelCost,
          hotel: hotelCost,
          food: foodCost,
          transport: transportCost
        },
        total
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              placeholder="Delhi"
              value={formData.from}
              onChange={(e) => setFormData({...formData, from: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="Mumbai"
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="travelers">Number of Travelers</Label>
          <Input
            id="travelers"
            type="number"
            min="1"
            value={formData.travelers}
            onChange={(e) => setFormData({...formData, travelers: parseInt(e.target.value)})}
          />
        </div>

        <div>
          <Label>Travel Mode</Label>
          <Select onValueChange={(value) => setFormData({...formData, mode: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select travel mode" />
            </SelectTrigger>
            <SelectContent>
              {travelModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <div className="flex items-center space-x-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.mode === "flight" && (
          <div>
            <Label>Travel Class</Label>
            <Select onValueChange={(value) => setFormData({...formData, class: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          <Label>Add-ons</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotel"
                checked={formData.addOns.hotel}
                onCheckedChange={(checked) => 
                  setFormData({...formData, addOns: {...formData.addOns, hotel: !!checked}})
                }
              />
              <Label htmlFor="hotel" className="flex items-center space-x-2">
                <Hotel className="w-4 h-4" />
                <span>Include Hotel (₹2,000 per person)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="food"
                checked={formData.addOns.food}
                onCheckedChange={(checked) => 
                  setFormData({...formData, addOns: {...formData.addOns, food: !!checked}})
                }
              />
              <Label htmlFor="food" className="flex items-center space-x-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Include Food (₹500 per day)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="transport"
                checked={formData.addOns.transport}
                onCheckedChange={(checked) => 
                  setFormData({...formData, addOns: {...formData.addOns, transport: !!checked}})
                }
              />
              <Label htmlFor="transport" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Include Local Transport (₹200 per person)</span>
              </Label>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Calculating..." : "Calculate Expenses"}
        </Button>
      </form>

      {result && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium">{result.distance}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{result.duration}</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Travel:</span>
                  <span>₹{result.breakdown.travel.toLocaleString()}</span>
                </div>
                {result.breakdown.hotel > 0 && (
                  <div className="flex justify-between">
                    <span>Hotel:</span>
                    <span>₹{result.breakdown.hotel.toLocaleString()}</span>
                  </div>
                )}
                {result.breakdown.food > 0 && (
                  <div className="flex justify-between">
                    <span>Food:</span>
                    <span>₹{result.breakdown.food.toLocaleString()}</span>
                  </div>
                )}
                {result.breakdown.transport > 0 && (
                  <div className="flex justify-between">
                    <span>Local Transport:</span>
                    <span>₹{result.breakdown.transport.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-primary">
                <span>Total:</span>
                <span>₹{result.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpensesTracker;
