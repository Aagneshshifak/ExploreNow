import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon, MapPin, Star, Heart, Camera, Mountain, Utensils, TreePine, Globe, Clock, Plane } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import parisImage from "@assets/pexels-jarod-17350906_1751612926611.jpg";

interface Destination {
  id: number;
  name: string;
  location: string;
  image: string;
  description: string;
  price: string;
  rating: number;
  categories: string[];
}

const TripPlanner = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [budget, setBudget] = useState([50000]);
  const [interests, setInterests] = useState<string[]>([]);
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("india");
  const [packageCategory, setPackageCategory] = useState("all");
  const [showResults, setShowResults] = useState(false);

  const interestOptions = [
    { id: "adventure", label: "Adventure", icon: <Mountain className="w-4 h-4" /> },
    { id: "nature", label: "Nature", icon: <TreePine className="w-4 h-4" /> },
    { id: "wellness", label: "Wellness", icon: <Heart className="w-4 h-4" /> },
    { id: "food", label: "Food", icon: <Utensils className="w-4 h-4" /> },
    { id: "luxury", label: "Luxury", icon: <Star className="w-4 h-4" /> },
    { id: "heritage", label: "Heritage", icon: <Camera className="w-4 h-4" /> },
  ];

  const packageCategories = [
    { id: "all", label: "All Packages" },
    { id: "domestic", label: "Domestic" },
    { id: "international", label: "International" },
    { id: "budget", label: "Budget" },
    { id: "luxury", label: "Luxury" },
    { id: "group", label: "Group Tours" },
    { id: "weekend", label: "Weekend Getaways" }
  ];

  const featuredPackages = [
    // Indian Packages
    {
      id: 1,
      name: "Royal Rajasthan",
      tagline: "Jaipur, Udaipur & Jodhpur Heritage Trail",
      duration: "7D/6N",
      price: "₹45,000",
      priceUSD: "$540",
      image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "India",
      flag: "🇮🇳",
      category: ["domestic", "luxury", "heritage"],
      inclusions: ["hotel", "food", "transport", "guide"],
      visa: false,
      travelTime: "2 hr flight from Delhi"
    },
    {
      id: 2,
      name: "Goa Beach & Culture",
      tagline: "Sun, Sand & Portuguese Legacy",
      duration: "4D/3N",
      price: "₹25,000",
      priceUSD: "$300",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "India",
      flag: "🇮🇳",
      category: ["domestic", "budget", "weekend"],
      inclusions: ["hotel", "transport"],
      visa: false,
      travelTime: "1.5 hr flight from Mumbai"
    },
    {
      id: 3,
      name: "Soul of the Himalayas",
      tagline: "Himachal & Leh Adventure",
      duration: "8D/7N",
      price: "₹55,000",
      priceUSD: "$660",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "India",
      flag: "🇮🇳",
      category: ["domestic", "adventure", "nature"],
      inclusions: ["hotel", "food", "transport", "guide"],
      visa: false,
      travelTime: "1 hr flight to Leh from Delhi"
    },
    {
      id: 4,
      name: "Backwaters of Kerala",
      tagline: "Alleppey, Munnar & Kochi Experience",
      duration: "5D/4N",
      price: "₹35,000",
      priceUSD: "$420",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "India",
      flag: "🇮🇳",
      category: ["domestic", "nature", "wellness"],
      inclusions: ["hotel", "food", "transport"],
      visa: false,
      travelTime: "2.5 hr flight from Delhi"
    },
    // International Packages
    {
      id: 5,
      name: "Romantic Paris Getaway",
      tagline: "Eiffel Tower, Seine Cruise & Museums",
      duration: "5D/4N",
      price: "₹1,25,000",
      priceUSD: "$1,500",
      image: parisImage,
      country: "France",
      flag: "🇫🇷",
      category: ["international", "luxury", "honeymoon"],
      inclusions: ["hotel", "food", "transport"],
      visa: true,
      travelTime: "8.5 hr flight from Mumbai"
    },
    {
      id: 6,
      name: "Thailand Budget Explorer",
      tagline: "Bangkok, Phuket & Krabi Adventure",
      duration: "6D/5N",
      price: "₹65,000",
      priceUSD: "$780",
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "Thailand",
      flag: "🇹🇭",
      category: ["international", "budget", "adventure"],
      inclusions: ["hotel", "transport"],
      visa: false,
      travelTime: "3.5 hr flight from Delhi"
    },
    {
      id: 7,
      name: "Dubai Luxury Experience",
      tagline: "Burj Khalifa, Desert Safari & Marina",
      duration: "4D/3N",
      price: "₹85,000",
      priceUSD: "$1,020",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "UAE",
      flag: "🇦🇪",
      category: ["international", "luxury", "weekend"],
      inclusions: ["hotel", "food", "transport", "guide"],
      visa: false,
      travelTime: "3 hr flight from Mumbai"
    },
    {
      id: 8,
      name: "Bali Wellness Retreat",
      tagline: "Ubud, Seminyak & Temple Experience",
      duration: "5D/4N",
      price: "₹75,000",
      priceUSD: "$900",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      country: "Indonesia",
      flag: "🇮🇩",
      category: ["international", "wellness", "nature"],
      inclusions: ["hotel", "food", "transport"],
      visa: false,
      travelTime: "5.5 hr flight from Mumbai"
    }
  ];

  const handleInterestChange = (interestId: string, checked: boolean) => {
    if (checked) {
      setInterests([...interests, interestId]);
    } else {
      setInterests(interests.filter(id => id !== interestId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Plan Your Perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Global Adventure
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tell us your preferences and let our intelligent system craft the perfect itinerary for your dream vacation.
          </p>
        </div>
      </section>

      {/* Trip Planning Form */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elegant glass-effect">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-semibold">Trip Details</CardTitle>
              <p className="text-muted-foreground">Fill in your preferences to get personalized recommendations</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Location & Country Selection */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start-location">Starting Location</Label>
                    <Select value={startLocation} onValueChange={setStartLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Where are you starting from?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="kolkata">Kolkata</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Travel Preference</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Domestic or International?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">🇮🇳 Domestic (India)</SelectItem>
                        <SelectItem value="international">🌍 International</SelectItem>
                        <SelectItem value="both">✈️ Open to Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination Preference</Label>
                    <Select value={destination} onValueChange={setDestination}>
                      <SelectTrigger>
                        <SelectValue placeholder="Which region interests you?" />
                      </SelectTrigger>
                      <SelectContent>
                        {country === "india" && (
                          <>
                            <SelectItem value="north">North India</SelectItem>
                            <SelectItem value="south">South India</SelectItem>
                            <SelectItem value="west">West India</SelectItem>
                            <SelectItem value="east">East India</SelectItem>
                            <SelectItem value="northeast">Northeast India</SelectItem>
                          </>
                        )}
                        {country === "international" && (
                          <>
                            <SelectItem value="asia">Asia Pacific</SelectItem>
                            <SelectItem value="europe">Europe</SelectItem>
                            <SelectItem value="middle-east">Middle East</SelectItem>
                            <SelectItem value="americas">Americas</SelectItem>
                          </>
                        )}
                        <SelectItem value="anywhere">Surprise Me!</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-4">
                  <Label>What interests you? (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {interestOptions.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest.id}
                          checked={interests.includes(interest.id)}
                          onCheckedChange={(checked) => 
                            handleInterestChange(interest.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={interest.id} 
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          {interest.icon}
                          <span>{interest.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="space-y-4">
                  <Label>Budget per person (₹)</Label>
                  <div className="px-4">
                    <Slider
                      value={budget}
                      onValueChange={setBudget}
                      max={500000}
                      min={5000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>₹5,000</span>
                      <span className="font-semibold text-primary">₹{budget[0].toLocaleString()}</span>
                      <span>₹5,00,000+</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gradient-primary text-primary-foreground">
                  Find My Perfect Trip
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Tourist Packages */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">🌟 Featured Tourist Packages</h2>
            <p className="text-xl text-muted-foreground">
              Discover curated packages for Indian and international destinations
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {packageCategories.map((category) => (
              <Button
                key={category.id}
                variant={packageCategory === category.id ? "default" : "outline"}
                onClick={() => setPackageCategory(category.id)}
                className="rounded-full px-6 py-2"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Featured Packages Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPackages
              .filter(pkg => 
                packageCategory === "all" || 
                pkg.category.includes(packageCategory)
              )
              .map((pkg) => (
                <Card key={pkg.id} className="group overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border-0">
                  <div className="relative overflow-hidden">
                    <img 
                      src={pkg.image} 
                      alt={pkg.name}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Country Flag & Duration */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                        <span className="text-lg mr-1">{pkg.flag}</span>
                        <span className="text-sm font-medium text-gray-800">{pkg.country}</span>
                      </div>
                      <div className="bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-primary-foreground font-medium text-sm">{pkg.duration}</span>
                      </div>
                    </div>

                    {/* Visa Badge */}
                    {pkg.visa && (
                      <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white text-xs font-medium">Visa Required</span>
                      </div>
                    )}

                    {/* Price Display */}
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-lg font-bold text-gray-800">{pkg.price}</div>
                        <div className="text-xs text-gray-600">{pkg.priceUSD}</div>
                      </div>
                    </div>

                    {/* Travel Time */}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Clock className="w-3 h-3 text-white mr-1" />
                      <span className="text-white text-xs">{pkg.travelTime}</span>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{pkg.tagline}</p>
                    
                    {/* Inclusions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.inclusions.map((inclusion) => (
                        <span key={inclusion} className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center">
                          {inclusion === "hotel" && "🏨"}
                          {inclusion === "food" && "🍽️"}
                          {inclusion === "transport" && "🚗"}
                          {inclusion === "guide" && "👨‍🏫"}
                          <span className="ml-1 capitalize">{inclusion}</span>
                        </span>
                      ))}
                    </div>

                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {pkg.category.slice(0, 2).map((cat) => (
                        <span key={cat} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full capitalize">
                          {cat}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:border-primary group-hover:text-primary"
                      >
                        See Details
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TripPlanner;