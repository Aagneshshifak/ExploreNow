import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Star, 
  Trophy, 
  Coins, 
  Crown,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DashboardSidebar } from '@/components/DashboardSidebar';

export default function RewardsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rewards = [
    {
      id: 1,
      title: "First Trip",
      description: "Complete your first booking",
      points: 100,
      icon: <Star className="w-6 h-6" />,
      completed: true,
      color: "bg-yellow-500"
    },
    {
      id: 2,
      title: "Explorer",
      description: "Book 5 trips",
      points: 500,
      icon: <Trophy className="w-6 h-6" />,
      completed: false,
      progress: 3,
      total: 5,
      color: "bg-blue-500"
    },
    {
      id: 3,
      title: "Hotel Master",
      description: "Book 10 hotel stays",
      points: 750,
      icon: <Crown className="w-6 h-6" />,
      completed: false,
      progress: 2,
      total: 10,
      color: "bg-purple-500"
    },
    {
      id: 4,
      title: "Frequent Flyer",
      description: "Book 20 flights",
      points: 1000,
      icon: <Zap className="w-6 h-6" />,
      completed: false,
      progress: 1,
      total: 20,
      color: "bg-green-500"
    }
  ];

  const totalPoints = 1200;
  const nextTier = 2000;
  const progressPercentage = (totalPoints / nextTier) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full">
        <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rewards & Achievements</h1>
          <p className="text-muted-foreground">Earn points and unlock exclusive rewards</p>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Points</p>
                  <p className="text-3xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Current Tier</p>
                  <p className="text-2xl font-bold text-foreground">Explorer</p>
                </div>
                <Award className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Next Tier</p>
                  <p className="text-2xl font-bold text-foreground">Adventurer</p>
                  <p className="text-sm text-muted-foreground">{nextTier - totalPoints} points to go</p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground font-medium">Progress to Adventurer Tier</span>
                <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Explorer ({totalPoints} pts)</span>
              <span>Adventurer ({nextTier} pts)</span>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`bg-card border-border hover:border-accent transition-colors ${
                reward.completed ? 'ring-2 ring-green-500' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${reward.color}`}>
                      {reward.icon}
                    </div>
                    {reward.completed && (
                      <Badge className="bg-green-500 text-white">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-foreground text-lg">
                    {reward.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {reward.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-foreground font-semibold">{reward.points} points</span>
                    </div>
                  </div>
                  
                  {!reward.completed && reward.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{reward.progress}/{reward.total}</span>
                      </div>
                      <Progress 
                        value={(reward.progress / reward.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                  )}
                  
                  <Button 
                    className={`w-full mt-4 ${
                      reward.completed 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={!reward.completed}
                  >
                    {reward.completed ? 'Claimed' : 'In Progress'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Available Rewards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold">10% Off Next Booking</h3>
                    <p className="text-muted-foreground text-sm">Valid for any trip or hotel booking</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-foreground font-medium">500 points</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-border text-foreground hover:bg-accent"
                    disabled={totalPoints < 500}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold">Priority Support</h3>
                    <p className="text-muted-foreground text-sm">Get faster customer support</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-foreground font-medium">1000 points</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-border text-foreground hover:bg-accent"
                    disabled={totalPoints < 1000}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
