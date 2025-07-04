
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExpensesTracker from "@/components/tools/ExpensesTracker";
import ExpensesDifferentiator from "@/components/tools/ExpensesDifferentiator";
import VisaWizard from "@/components/tools/VisaWizard";
import TravelDNAQuiz from "@/components/tools/TravelDNAQuiz";
import LiveCrowdHeatmaps from "@/components/tools/LiveCrowdHeatmaps";
import TripCompass from "@/components/tools/TripCompass";
import SmartTripComposer from "@/components/tools/SmartTripComposer";
import ExploreNowPass from "@/components/tools/ExploreNowPass";
import MoodBasedPlanner from "@/components/tools/MoodBasedPlanner";


const Tools = () => {
  const [activeTab, setActiveTab] = useState("expenses");

  const toolCategories = [
    {
      id: "expenses",
      name: "Travel Planning",
      tools: [
        { id: "tracker", name: "Expenses Tracker", component: <ExpensesTracker /> },
        { id: "differentiator", name: "Expenses Differentiator", component: <ExpensesDifferentiator /> },
        { id: "composer", name: "Smart Trip Composer", component: <SmartTripComposer /> }
      ]
    },
    {
      id: "discovery",
      name: "Discovery & Exploration",
      tools: [
        { id: "compass", name: "Trip Compass™", component: <TripCompass /> },
        { id: "heatmaps", name: "Live Crowd Heatmaps", component: <LiveCrowdHeatmaps /> },
        { id: "mood", name: "Mood-Based Planner", component: <MoodBasedPlanner /> }
      ]
    },
    {
      id: "personal",
      name: "Personalization",
      tools: [
        { id: "dna", name: "Travel DNA Quiz", component: <TravelDNAQuiz /> },
        { id: "pass", name: "ExploreNow Pass", component: <ExploreNowPass /> }
      ]
    },
    {
      id: "services",
      name: "Travel Services",
      tools: [
        { id: "visa", name: "Visa Wizard", component: <VisaWizard /> }
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-r from-muted/30 to-background">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Smart Travel Tools
              </span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our comprehensive suite of AI-powered travel planning tools designed to make your journey seamless and memorable
          </p>
        </div>
      </section>

      {/* Tools Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            {toolCategories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {toolCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {category.tools.map((tool) => (
                  <Card key={tool.id} className="shadow-soft hover:shadow-elegant transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{tool.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tool.component}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Tools;
