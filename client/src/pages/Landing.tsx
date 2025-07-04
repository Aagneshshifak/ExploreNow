
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Hotel, Compass, FileCheck, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/ui/optimized-image";
import keralaImage from "@assets/photo-1602216056096-3b40cc0c9944_1751613047403.jpeg";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Optimized Background Image with progressive loading */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
            alt="Mountain landscape"
            className="absolute inset-0"
            width={1920}
            height={1080}
            priority={true}
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Discover India's
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Hidden Gems
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Embark on extraordinary journeys across India's most breathtaking destinations with expertly crafted experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg" asChild>
              <Link to="/trip-planner">
                Plan Your Trip
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg" asChild>
              <Link to="/hotels">
                Explore Hotels
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Start Your Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover amazing destinations and plan your perfect trip with our comprehensive travel tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Plan Your Trip */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Compass className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Plan Your Trip</h3>
                <p className="text-muted-foreground mb-6">Build your dream itinerary in minutes.</p>
                <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Link to="/trip-planner">
                    Start Planning
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Explore Hotels */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl bg-gradient-to-br from-white to-orange-50/50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Hotel className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Hotels & Stays</h3>
                <p className="text-muted-foreground mb-6">Find perfect accommodations for your journey.</p>
                <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                  <Link to="/hotels">
                    Browse Hotels
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Travel Tools */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl bg-gradient-to-br from-white to-green-50/50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Smart Tools</h3>
                <p className="text-muted-foreground mb-6">AI-powered travel planning and discovery tools.</p>
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                  <Link to="/tools">
                    Explore Tools
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Travel Services */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl bg-gradient-to-br from-white to-purple-50/50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Visa Enquiry</h3>
                <p className="text-muted-foreground mb-6">Check visa rules & get help for any destination.</p>
                <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  <Link to="/tools">
                    Check Visa
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose ExploreNow
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the difference with our premium travel platform designed for modern explorers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Personalized Experiences</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                AI-powered recommendations tailored to your travel style, interests, and budget for unforgettable journeys.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Trusted & Secure</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Verified partners, secure bookings, and 24/7 support ensure your peace of mind throughout your travels.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Book hotels, plan itineraries, and manage your trips in seconds with our intuitive platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Featured Destinations
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover handpicked destinations that offer the perfect blend of adventure, culture, and natural beauty.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Kerala Backwaters */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl overflow-hidden bg-white border-0 shadow-lg">
              <div className="relative h-48">
                <OptimizedImage
                  src={keralaImage}
                  alt="Kerala Backwaters"
                  className="h-full w-full"
                  width={400}
                  height={300}
                />
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">4.8</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">Kerala, India</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Kerala Backwaters</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Serene backwaters and lush greenery
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">₹15,000</span>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ladakh Adventures */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl overflow-hidden bg-white border-0 shadow-lg">
              <div className="relative h-48">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
                  alt="Ladakh Adventures"
                  className="h-full w-full"
                  width={400}
                  height={300}
                />
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">4.9</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">Ladakh, India</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ladakh Adventures</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  High altitude desert landscapes
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">₹25,000</span>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Goa Beaches */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl overflow-hidden bg-white border-0 shadow-lg">
              <div className="relative h-48">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2"
                  alt="Goa Beaches"
                  className="h-full w-full"
                  width={400}
                  height={300}
                />
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">4.7</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">Goa, India</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Goa Beaches</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Golden beaches and vibrant culture
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">₹12,000</span>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rajasthan Heritage */}
            <Card className="group hover:scale-105 transition-transform duration-200 hover:shadow-xl overflow-hidden bg-white border-0 shadow-lg">
              <div className="relative h-48">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1587135941948-670b381f08ce"
                  alt="Rajasthan Heritage"
                  className="h-full w-full"
                  width={400}
                  height={300}
                />
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">4.8</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">Rajasthan, India</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Rajasthan Heritage</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Majestic palaces and ancient fortresses
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">₹20,000</span>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
