
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Train, Bus, Car, Zap, DollarSign } from "lucide-react";

const ExpensesDifferentiator = () => {
  const [mode, setMode] = useState("modes");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modesData, setModesData] = useState({
    from: "",
    to: "",
    travelers: 1,
    modes: []
  });

  const [routesData, setRoutesData] = useState({
    routeA: { from: "", to: "" },
    routeB: { from: "", to: "" },
    mode: "",
    travelers: 1
  });

  const travelModes = [
    { value: "flight", label: "Flight", icon: <Plane className="w-4 h-4" />, time: "2h", cost: 5000 },
    { value: "train", label: "Train", icon: <Train className="w-4 h-4" />, time: "12h", cost: 1500 },
    { value: "bus", label: "Bus", icon: <Bus className="w-4 h-4" />, time: "15h", cost: 800 },
    { value: "car", label: "Car", icon: <Car className="w-4 h-4" />, time: "8h", cost: 2000 }
  ];

  const handleCompareModes = () => {
    setLoading(true);
    setTimeout(() => {
      const results = travelModes
        .filter(mode => modesData.modes.includes(mode.value))
        .map(mode => ({
          ...mode,
          totalCost: mode.cost * modesData.travelers,
          distance: "450 km"
        }))
        .sort((a, b) => a.totalCost - b.totalCost);
      
      setComparison({ type: "modes", data: results });
      setLoading(false);
    }, 1000);
  };

  const handleCompareRoutes = () => {
    setLoading(true);
    setTimeout(() => {
      const selectedMode = travelModes.find(m => m.value === routesData.mode);
      const results = [
        {
          route: `${routesData.routeA.from} → ${routesData.routeA.to}`,
          ...selectedMode,
          totalCost: selectedMode.cost * routesData.travelers * 1.1,
          distance: "450 km"
        },
        {
          route: `${routesData.routeB.from} → ${routesData.routeB.to}`,
          ...selectedMode,
          totalCost: selectedMode.cost * routesData.travelers * 0.9,
          distance: "520 km"
        }
      ].sort((a, b) => a.totalCost - b.totalCost);
      
      setComparison({ type: "routes", data: results });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modes">Compare Modes</TabsTrigger>
          <TabsTrigger value="routes">Compare Routes</TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-modes">From</Label>
              <Input
                id="from-modes"
                placeholder="Delhi"
                value={modesData.from}
                onChange={(e) => setModesData({...modesData, from: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="to-modes">To</Label>
              <Input
                id="to-modes"
                placeholder="Mumbai"
                value={modesData.to}
                onChange={(e) => setModesData({...modesData, to: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelers-modes">Number of Travelers</Label>
            <Input
              id="travelers-modes"
              type="number"
              min="1"
              value={modesData.travelers}
              onChange={(e) => setModesData({...modesData, travelers: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <Label>Select Modes to Compare</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {travelModes.map((mode) => (
                <div key={mode.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={mode.value}
                    checked={modesData.modes.includes(mode.value)}
                    onChange={(e) => {
                      const modes = e.target.checked
                        ? [...modesData.modes, mode.value]
                        : modesData.modes.filter(m => m !== mode.value);
                      setModesData({...modesData, modes});
                    }}
                  />
                  <Label htmlFor={mode.value} className="flex items-center space-x-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleCompareModes} className="w-full" disabled={loading}>
            {loading ? "Comparing..." : "Compare Modes"}
          </Button>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Route A</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="From"
                  value={routesData.routeA.from}
                  onChange={(e) => setRoutesData({
                    ...routesData,
                    routeA: {...routesData.routeA, from: e.target.value}
                  })}
                />
                <Input
                  placeholder="To"
                  value={routesData.routeA.to}
                  onChange={(e) => setRoutesData({
                    ...routesData,
                    routeA: {...routesData.routeA, to: e.target.value}
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Route B</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="From"
                  value={routesData.routeB.from}
                  onChange={(e) => setRoutesData({
                    ...routesData,
                    routeB: {...routesData.routeB, from: e.target.value}
                  })}
                />
                <Input
                  placeholder="To"
                  value={routesData.routeB.to}
                  onChange={(e) => setRoutesData({
                    ...routesData,
                    routeB: {...routesData.routeB, to: e.target.value}
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Mode of Travel</Label>
              <Select onValueChange={(value) => setRoutesData({...routesData, mode: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
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
          </div>

          <Button onClick={handleCompareRoutes} className="w-full" disabled={loading}>
            {loading ? "Comparing..." : "Compare Routes"}
          </Button>
        </TabsContent>
      </Tabs>

      {comparison && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comparison Results</h3>
            <div className="space-y-4">
              {comparison.data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <div>
                      <div className="font-medium">
                        {comparison.type === "routes" ? item.route : item.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.distance} • {item.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">
                      ₹{item.totalCost.toLocaleString()}
                    </span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Cheapest
                      </Badge>
                    )}
                    {item.time === "2h" && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Zap className="w-3 h-3 mr-1" />
                        Fastest
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpensesDifferentiator;
