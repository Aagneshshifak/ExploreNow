
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  FileCheck, 
  Compass, 
  Route, 
  FolderOpen, 
  Shield,
  MapPin,
  IndianRupee,
  Globe,
  Navigation
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  category: string;
  tag: string;
}

const tools: Tool[] = [
  {
    id: 'expense-estimator',
    title: 'Expense Estimator',
    description: 'Calculate and breakdown your trip costs with detailed budget planning tools',
    path: '/tools/expense-estimator',
    icon: Calculator,
    category: 'planning',
    tag: 'Planning Tool'
  },
  {
    id: 'trip-suggestion-by-budget',
    title: 'Trip Suggestion by Budget',
    description: 'Get personalized trip recommendations based on your budget and preferences',
    path: '/tools/trip-suggestion-by-budget',
    icon: IndianRupee,
    category: 'planning',
    tag: 'Smart Suggestion'
  },
  {
    id: 'visa-checker',
    title: 'Visa Checker',
    description: 'Check visa requirements based on your nationality and destination',
    path: '/tools/visa-checker',
    icon: FileCheck,
    category: 'essentials',
    tag: 'Travel Essential'
  },
  {
    id: 'document-wallet',
    title: 'Document Wallet',
    description: 'Securely store and manage your travel documents in one place',
    path: '/tools/document-wallet',
    icon: FolderOpen,
    category: 'essentials',
    tag: 'Security Tool'
  },
  {
    id: 'text-translator',
    title: 'Text Translator',
    description: 'Instantly translate words or phrases into your preferred language — perfect for travelers on the go',
    path: '/tools/text-translator',
    icon: Globe,
    category: 'essentials',
    tag: 'Language Helper'
  },
  {
    id: 'route-finder',
    title: 'Route Finder',
    description: 'Compare transportation options and find the best routes for your journey',
    path: '/tools/route-finder',
    icon: Route,
    category: 'navigation',
    tag: 'Navigation Tool'
  },
  {
    id: 'travel-compass',
    title: 'Travel Compass',
    description: 'Discover new destinations with our interactive exploration tool',
    path: '/tools/compass',
    icon: Compass,
    category: 'navigation',
    tag: 'Discovery Tool'
  },
  {
    id: 'tourist-crowd-map',
    title: 'Tourist & Crowd Map',
    description: 'Navigate popular destinations with real-time crowd insights and perfect timing',
    path: '/tools/tourist-crowd-map',
    icon: MapPin,
    category: 'navigation',
    tag: 'Local Insights'
  },
  {
    id: 'explore-guide',
    title: 'Explore Guide',
    description: 'Your smart travel companion — get local routes, places to visit, and tips based on your current location',
    path: '/tools/explore-guide',
    icon: Navigation,
    category: 'navigation',
    tag: 'Travel Assistant'
  },
  {
    id: 'trip-recommender',
    title: 'Trip Recommender',
    description: 'Get personalized travel recommendations based on your budget, interests, and duration preferences',
    path: '/tools/recommend-trip',
    icon: MapPin,
    category: 'planning',
    tag: 'Smart Suggestion'
  },
  {
    id: 'local-explorer',
    title: 'Local Explorer',
    description: 'Discover amazing local spots, hidden gems, and authentic experiences near your location',
    path: '/tools/explorer',
    icon: Navigation,
    category: 'navigation',
    tag: 'Local Guide'
  },
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'Manage users, content, and system settings with administrative controls',
    path: '/admin/dashboard',
    icon: Shield,
    adminOnly: true,
    category: 'admin',
    tag: 'Admin Control'
  }
];

const Tools = () => {
  const [userType, setUserType] = useState<string>('traveler');

  useEffect(() => {
    // In a real app, this would come from your auth context/state
    // For demo purposes, you can temporarily set to 'admin' to see the admin dashboard
    const storedUserType = localStorage.getItem('userType') || 'traveler';
    setUserType(storedUserType);
  }, []);

  const visibleTools = tools.filter(tool => !tool.adminOnly || userType === 'admin');

  const groupedTools = visibleTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const categoryTitles = {
    planning: '✦ Planning Tools',
    essentials: '✦ Travel Essentials',
    navigation: '✦ Navigation & Discovery',
    admin: '✦ Administration'
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Travel Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our comprehensive suite of travel planning tools designed to make your journey seamless and memorable.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-12">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category} className="space-y-6">
              <h2 className="text-gray-600 dark:text-gray-400 text-sm font-semibold tracking-wide">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryTools.map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <Card 
                      key={tool.id} 
                      className="group hover:shadow-lg hover:scale-105 hover:ring-1 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-gray-600 transition-all duration-300 border-t-4 border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-black/90"
                    >
                      <CardHeader className="text-center pb-4">
                        <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md mb-2 inline-block">
                          {tool.tag}
                        </span>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                          <IconComponent className="w-8 h-8 text-foreground" />
                        </div>
                        <CardTitle className="text-xl text-card-foreground">
                          {tool.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Link to={tool.path} className="block">
                          <button 
                            className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-all duration-300"
                            aria-label={`Explore ${tool.title}`}
                          >
                            Explore
                          </button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {userType !== 'admin' && (
          <div className="text-center mt-12 p-6 bg-muted/50 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              Need access to administrative features? Contact your system administrator for elevated permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
