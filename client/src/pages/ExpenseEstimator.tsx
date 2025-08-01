
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Plane, MapPin, Users, Calendar, Hotel, Utensils, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CostBreakdown {
  transport: number;
  hotel: number;
  food: number;
  activities: number;
  total: number;
}

export default function ExpenseEstimator() {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    days: '',
    travelers: ''
  });
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEstimate = () => {
    if (!formData.from || !formData.to || !formData.days || !formData.travelers) {
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation
    setTimeout(() => {
      const days = parseInt(formData.days);
      const travelers = parseInt(formData.travelers);
      
      // Base costs per person per day
      const baseCosts = {
        transport: 150 + Math.random() * 300,
        hotel: 80 + Math.random() * 200,
        food: 40 + Math.random() * 60,
        activities: 30 + Math.random() * 70
      };

      const calculated = {
        transport: Math.round(baseCosts.transport * travelers),
        hotel: Math.round(baseCosts.hotel * days * travelers),
        food: Math.round(baseCosts.food * days * travelers),
        activities: Math.round(baseCosts.activities * days * travelers),
        total: 0
      };
      
      calculated.total = calculated.transport + calculated.hotel + calculated.food + calculated.activities;
      
      setBreakdown(calculated);
      setIsCalculating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-display mb-4">Travel Expense Estimator</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Get a detailed breakdown of your travel costs including transport, accommodation, food, and activities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Trip Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    placeholder="Enter departure city"
                    value={formData.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    placeholder="Enter destination city"
                    value={formData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="days">Days</Label>
                    <Select onValueChange={(value) => handleInputChange('days', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(30)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i + 1 === 1 ? 'day' : 'days'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelers">Travelers</Label>
                    <Select onValueChange={(value) => handleInputChange('travelers', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select travelers" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i + 1 === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={calculateEstimate}
                  disabled={!formData.from || !formData.to || !formData.days || !formData.travelers || isCalculating}
                  className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition"
                  aria-label="Explore this tool"
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Estimate'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Plane className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Transport</span>
                        </div>
                        <span className="font-semibold">${breakdown.transport.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Hotel className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Hotel</span>
                        </div>
                        <span className="font-semibold">${breakdown.hotel.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Utensils className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Food</span>
                        </div>
                        <span className="font-semibold">${breakdown.food.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Activities</span>
                        </div>
                        <span className="font-semibold">${breakdown.activities.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between p-4 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <span className="text-lg font-semibold">Total Estimated Cost</span>
                        <span className="text-2xl font-bold text-primary">${breakdown.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      * Estimates are based on average costs and may vary based on season, preferences, and availability.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Fill in your trip details to get a cost breakdown
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
