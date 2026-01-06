
import { useState } from 'react';
import { Search, MapPin, Users, Clock, Filter, Eye, BarChart } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TouristCrowdMap = () => {
  const [activeFilter, setActiveFilter] = useState<string>('region');
  const [searchQuery, setSearchQuery] = useState('');

  const crowdZones = [
    { id: 1, name: 'Times Square', level: 'High', x: '45%', y: '30%' },
    { id: 2, name: 'Central Park', level: 'Medium', x: '60%', y: '25%' },
    { id: 3, name: 'Brooklyn Bridge', level: 'High', x: '70%', y: '45%' },
    { id: 4, name: 'Museum District', level: 'Low', x: '35%', y: '35%' },
    { id: 5, name: 'Greenwich Village', level: 'Medium', x: '40%', y: '50%' }
  ];

  const filterOptions = [
    { id: 'region', label: 'View by Region', icon: MapPin },
    { id: 'popular', label: 'Popular Spots', icon: Users },
    { id: 'feedback', label: 'Live Feedback', icon: BarChart }
  ];

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500/30 border-red-500';
      case 'Medium': return 'bg-yellow-500/30 border-yellow-500';
      case 'Low': return 'bg-green-500/30 border-green-500';
      default: return 'bg-gray-500/30 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tourist & Crowd Map
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Navigate popular destinations with real-time crowd insights and find the perfect time to visit.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md ml-auto mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search Place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground"
          />
        </div>

        {/* Map Section */}
        <div className="relative w-full h-[600px] mb-8 rounded-lg overflow-hidden shadow-xl">
          {/* Blurred grayscale map background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 backdrop-blur-sm"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 20%, rgba(120, 120, 120, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(100, 100, 100, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(140, 140, 140, 0.1) 0%, transparent 50%)
              `,
              filter: 'grayscale(100%)'
            }}
          />

          {/* Crowd Zones Overlay */}
          {crowdZones.map((zone) => (
            <div
              key={zone.id}
              className={`absolute animate-fade-in transition-all duration-300 hover:scale-110 cursor-pointer ${getCrowdColor(zone.level)} rounded-full border-2 p-3 backdrop-blur-sm`}
              style={{
                left: zone.x,
                top: zone.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="text-center">
                <div className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {zone.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {zone.level}
                </div>
              </div>
            </div>
          ))}

          {/* Map Legend */}
          <Card className="absolute bottom-4 left-4 p-4 bg-card/90 backdrop-blur-sm border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Crowd Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>
          </Card>

          {/* Filter Toggles */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {filterOptions.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeFilter === filter.id
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-card/80 text-muted-foreground hover:bg-card border border-border'
                  }`}
                  aria-label={filter.label}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <button className="flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-3 rounded-md font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02]" aria-label="Explore this tool">
            <MapPin className="w-4 h-4" />
            Plan Visit
          </button>
          
          <button className="flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-3 rounded-md font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02]" aria-label="Explore this tool">
            <Clock className="w-4 h-4" />
            Avoid Rush Hours
          </button>
          
          <button className="flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-3 rounded-md font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02]" aria-label="Explore this tool">
            <Eye className="w-4 h-4" />
            Find Nearby Calm Places
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Real-time crowd data helps you make informed decisions about when and where to visit popular destinations. 
            Avoid the crowds or embrace the energy - the choice is yours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TouristCrowdMap;
