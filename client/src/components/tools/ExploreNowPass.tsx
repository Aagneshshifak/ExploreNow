
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Coins, Zap, Gift, Star } from "lucide-react";

const ExploreNowPass = () => {
  const [selectedTier, setSelectedTier] = useState("free");

  const tiers = [
    {
      id: "free",
      name: "Explorer",
      price: "Free",
      color: "bg-gray-100",
      features: [
        "Access to basic itineraries",
        "Travel coins on booking (1% cashback)",
        "Community reviews access",
        "Basic trip planning tools",
        "Email support"
      ],
      limitations: [
        "Limited to 3 saved trips",
        "Basic search filters",
        "Standard customer support"
      ]
    },
    {
      id: "premium",
      name: "Wanderer Plus",
      price: "₹999/month",
      originalPrice: "₹1,499",
      color: "bg-gradient-to-br from-primary to-primary-glow",
      popular: true,
      features: [
        "Unlimited custom planning assistance",
        "Early access to hidden packages",
        "Personal travel concierge",
        "Premium travel coins (3% cashback)",
        "Exclusive member-only deals",
        "Priority customer support",
        "Advanced trip customization",
        "Offline trip access",
        "Premium partner benefits"
      ],
      perks: [
        "Free airport lounge access (4 visits/year)",
        "Complimentary travel insurance",
        "Expert-curated experiences"
      ]
    }
  ];

  const memberStats = {
    coinsEarned: 2450,
    tripsBooked: 12,
    moneySaved: 15680,
    level: "Gold Explorer"
  };

  return (
    <div className="space-y-6">
      {/* Membership Tiers */}
      <div className="grid gap-6 md:grid-cols-2">
        {tiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative overflow-hidden transition-all duration-300 ${
              selectedTier === tier.id ? 'ring-2 ring-primary shadow-lg' : ''
            } ${tier.popular ? 'border-primary' : ''}`}
          >
            {tier.popular && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <CardHeader className={`${tier.color} ${tier.id === 'premium' ? 'text-white' : ''}`}>
              <CardTitle className="flex items-center justify-between">
                <span>{tier.name}</span>
                {tier.id === 'premium' && <Star className="w-5 h-5" />}
              </CardTitle>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{tier.price}</span>
                  {tier.originalPrice && (
                    <span className="text-sm line-through opacity-70">{tier.originalPrice}</span>
                  )}
                </div>
                {tier.id === 'premium' && (
                  <p className="text-sm opacity-90">Save ₹6,000 annually</p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features Included</h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {tier.perks && (
                  <div>
                    <h4 className="font-medium mb-2 text-primary">Exclusive Perks</h4>
                    <ul className="space-y-2">
                      {tier.perks.map((perk, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Gift className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-primary">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  className={`w-full ${
                    tier.id === 'premium' 
                      ? 'bg-primary hover:bg-primary-glow' 
                      : 'variant-outline'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span>Your Explorer Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{memberStats.coinsEarned.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Travel Coins</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{memberStats.tripsBooked}</p>
              <p className="text-sm text-muted-foreground">Trips Booked</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">₹{memberStats.moneySaved.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Money Saved</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-purple-600">{memberStats.level}</p>
              <p className="text-sm text-muted-foreground">Member Level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Coins Section */}
      <Card>
        <CardHeader>
          <CardTitle>Redeem Travel Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">₹500 Discount Voucher</p>
                <p className="text-sm text-muted-foreground">Valid on bookings above ₹5,000</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">1,000 Coins</p>
                <Button size="sm" disabled={memberStats.coinsEarned < 1000}>
                  Redeem
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">₹1,000 Discount Voucher</p>
                <p className="text-sm text-muted-foreground">Valid on bookings above ₹10,000</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">2,000 Coins</p>
                <Button size="sm" disabled={memberStats.coinsEarned < 2000}>
                  Redeem
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExploreNowPass;
