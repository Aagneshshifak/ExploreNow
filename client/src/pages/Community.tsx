
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter } from "lucide-react";

const Community = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const tripExperiences = [
    {
      id: 1,
      title: "Golden Triangle with Goa Extension",
      author: "Alex Thompson",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop",
      duration: "10 Days",
      price: "₹55,000",
      likes: 312,
      category: "Cultural"
    },
    {
      id: 2,
      title: "Cultural Heritage Trail of Rajasthan",
      author: "Priya Sharma",
      authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5b5?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73dc6?w=400&h=300&fit=crop",
      duration: "8 Days",
      price: "₹45,000",
      likes: 234,
      category: "Heritage"
    },
    {
      id: 3,
      title: "Himalayan Adventure Circuit",
      author: "Rohit Kumar",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      duration: "12 Days",
      price: "₹65,000",
      likes: 189,
      category: "Adventure"
    },
    {
      id: 4,
      title: "Kerala Backwaters & Tea Gardens",
      author: "Maya Nair",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop",
      duration: "7 Days",
      price: "₹38,000",
      likes: 156,
      category: "Nature"
    },
    {
      id: 5,
      title: "Goa Beach & Spice Plantation Tour",
      author: "Carlos Silva",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      duration: "5 Days",
      price: "₹32,000",
      likes: 298,
      category: "Beach"
    },
    {
      id: 6,
      title: "Spiritual Journey Through Varanasi",
      author: "Ankit Sharma",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1567552020215-4ba467d4b72d?w=400&h=300&fit=crop",
      duration: "4 Days",
      price: "₹25,000",
      likes: 145,
      category: "Spiritual"
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-r from-muted/30 to-background">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Community
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trip Experiences
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover amazing itineraries shared by fellow travelers. Get inspired, copy their routes, or share your own adventures.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search trips or destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="heritage">Heritage</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="beach">Beach</SelectItem>
                <SelectItem value="spiritual">Spiritual</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Most Popular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trip Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tripExperiences.map((trip) => (
            <Card key={trip.id} className="overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 group">
              <div className="relative">
                <img 
                  src={trip.image} 
                  alt={trip.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-blue-600 text-white">
                  {trip.duration}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2"
                >
                  <Heart className="w-4 h-4" />
                  <span className="ml-1 text-sm">{trip.likes}</span>
                </Button>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={trip.authorAvatar} 
                    alt={trip.author}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-sm">{trip.author}</p>
                    <Badge variant="outline" className="text-xs">
                      {trip.category}
                    </Badge>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {trip.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{trip.price}</span>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;
