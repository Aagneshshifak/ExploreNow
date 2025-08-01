import { motion } from 'framer-motion';
import { ArrowRight, Star, MapPin, Calendar, Users, Shield, Award, Globe, Quote, Plane, DollarSign, CheckCircle, Clock, HeadphonesIcon, CreditCard, Lock, Navigation, Calculator, FolderOpen, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/LazyImage';
import heroBackground from '@/assets/hero-background.jpg';
export default function Home() {
  const featuredDestinations = [{
    id: 1,
    name: 'Santorini, Greece',
    description: 'Whitewashed villages and azure seas',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
    price: 'From $2,890',
    rating: 4.9,
    duration: '7 days'
  }, {
    id: 2,
    name: 'Tokyo, Japan',
    description: 'Modern metropolis meets ancient tradition',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    price: 'From $3,250',
    rating: 4.8,
    duration: '10 days'
  }, {
    id: 3,
    name: 'Swiss Alps',
    description: 'Majestic peaks and pristine landscapes',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 'From $4,120',
    rating: 4.9,
    duration: '8 days'
  }];
  const featuredHotels = [{
    id: 1,
    name: 'The Grand Palace',
    location: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    price: '$450/night',
    rating: 4.8,
    amenities: ['Spa', 'Fine Dining', 'City Views']
  }, {
    id: 2,
    name: 'Ocean Breeze Resort',
    location: 'Maldives',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    price: '$890/night',
    rating: 4.9,
    amenities: ['Private Beach', 'Water Villa', 'Diving']
  }, {
    id: 3,
    name: 'Mountain Lodge',
    location: 'Colorado, USA',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
    price: '$320/night',
    rating: 4.7,
    amenities: ['Ski Access', 'Fireplace', 'Mountain Views']
  }];
  const features = [{
    icon: Lock,
    title: 'Secure Booking System',
    description: 'Your payments and personal data are protected with bank-level security encryption'
  }, {
    icon: Navigation,
    title: 'Curated Trip Packages',
    description: 'Handpicked destinations and experiences crafted by our travel experts'
  }, {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Tailored platform experience for both travelers and administrators'
  }, {
    icon: FolderOpen,
    title: 'Digital Travel Wallet',
    description: 'Manage all your booking confirmations, tickets, and travel documents in one place'
  }];
  const travelerTools = [{
    icon: Calculator,
    title: 'Expense Tracker',
    description: 'Estimate your travel cost with transport, food, stay & activity breakdown.',
    action: 'Try Estimator',
    href: '/tools/expense-estimator'
  }, {
    icon: Globe,
    title: 'Visa Requirement Checker',
    description: 'Check if a visa is needed for your destination based on nationality.',
    action: 'Check Visa',
    href: '/tools/visa-checker'
  }, {
    icon: Compass,
    title: 'Travel Compass',
    description: 'Get curated destination suggestions based on your travel preferences.',
    action: 'Explore Destinations',
    href: '/tools/compass'
  }, {
    icon: MapPin,
    title: 'Route Finder',
    description: 'Visualize and plan the best travel route from your location to the destination.',
    action: 'Find Route',
    href: '/tools/route-finder'
  }];
  const testimonials = [{
    id: 1,
    name: 'Sarah Chen',
    role: 'Travel Enthusiast',
    content: 'ExploreNow transformed our family vacation into an unforgettable adventure. The attention to detail and personalized service exceeded all expectations.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face&auto=format',
    rating: 5
  }, {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'Business Traveler',
    content: 'Professional, efficient, and incredibly thorough. ExploreNow takes care of every detail so I can focus on what matters most to me.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format',
    rating: 5
  }, {
    id: 3,
    name: 'Emma Thompson',
    role: 'Digital Nomad',
    content: 'The curated experiences and seamless booking process make ExploreNow my go-to platform for discovering authentic travel destinations.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face&auto=format',
    rating: 5
  }];
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{
      backgroundImage: `url(${heroBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 dark:bg-white/20" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }}>
            <h1 className="text-hero text-white dark:text-black mb-6 leading-tight font-light">
              Plan. Book. Explore.
            </h1>
            <p className="text-body-large text-white/90 dark:text-black/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Premium travel experiences curated for the modern explorer. 
              From hidden gems to iconic destinations, let us craft your perfect journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Sign up for ExploreNow">
                <Link to="/signup">
                  Sign Up
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Explore travel trips">
                <Link to="/trips">Explore Trips</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Login to your account">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Subtle floating elements */}
        <motion.div className="absolute top-20 left-10 w-20 h-20 bg-white/5 dark:bg-black/5 rounded-full blur-xl" animate={{
        y: [0, -20, 0],
        x: [0, 10, 0]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute bottom-32 right-16 w-32 h-32 bg-white/3 dark:bg-black/3 rounded-full blur-2xl" animate={{
        y: [0, 20, 0],
        x: [0, -15, 0]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">Why Choose ExploreNow?</h2>
            <p className="text-body text-muted-foreground max-w-3xl mx-auto">
              We're not just another travel booking platform. We're your trusted partner 
              in creating extraordinary travel experiences that exceed expectations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="group">
                <Card className="border-0 shadow-lg dark:shadow-white/10 hover:shadow-xl dark:hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 bg-white dark:bg-black">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-300">
                      <feature.icon className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-black dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-24 bg-gradient-linear">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">Featured Destinations</h2>
            <p className="text-body text-muted-foreground max-w-3xl mx-auto">
              Handpicked destinations that promise unforgettable experiences and stunning landscapes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations.map((destination, index) => <motion.div key={destination.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="hover-lift border-0 shadow-elegant-lg overflow-hidden">
                  <div className="relative h-64 bg-muted">
                    <LazyImage 
                      src={destination.image} 
                      alt={destination.name} 
                      className="w-full h-full grayscale hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-1">
                      <span className="text-yellow-500 dark:text-yellow-400">★</span>
                      <span className="text-sm font-medium text-zinc-950">{destination.rating}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-subheading mb-2">{destination.name}</h3>
                    <p className="text-caption text-muted-foreground mb-4">
                      {destination.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{destination.duration}</span>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {destination.price}
                      </span>
                    </div>
                    <Button asChild className="w-full bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="View destination details">
                      <Link to={`/trips/${destination.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="View all travel destinations">
              <Link to="/trips">
                View All Destinations
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">Top-Rated Hotels</h2>
            <p className="text-body text-muted-foreground max-w-3xl mx-auto">
              Stay at the world's finest hotels and resorts, carefully selected for exceptional service and amenities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel, index) => <motion.div key={hotel.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="hover-lift border-0 shadow-elegant-lg overflow-hidden">
                  <div className="relative h-64 bg-muted">
                    <LazyImage 
                      src={hotel.image} 
                      alt={hotel.name} 
                      className="w-full h-full grayscale hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-1">
                      <span className="text-yellow-500 dark:text-yellow-400">★</span>
                      <span className="text-sm font-medium text-zinc-950">{hotel.rating}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-subheading mb-1">{hotel.name}</h3>
                    <div className="flex items-center space-x-1 mb-4">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-caption text-muted-foreground">{hotel.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities.map(amenity => <span key={amenity} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">
                          {amenity}
                        </span>)}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-foreground">
                        {hotel.price}
                      </span>
                    </div>
                    <Button asChild className="w-full bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Book hotel now">
                      <Link to={`/hotels/${hotel.id}`}>Book Now</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="View all hotels">
              <Link to="/hotels">
                View All Hotels
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Traveler Tools Section */}
      <section className="py-24 bg-gradient-linear">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">Your All-in-One Travel Assistant</h2>
            <p className="text-body text-muted-foreground max-w-3xl mx-auto">
              Essential tools to help you plan and prepare for your perfect journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {travelerTools.map((tool, index) => <motion.div key={tool.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="group">
                <Card className="border border-black/10 dark:border-white/10 shadow-lg dark:shadow-white/10 hover:shadow-xl dark:hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 bg-white dark:bg-black h-full">
                  <CardContent className="p-8 text-center flex flex-col h-full">
                    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-300">
                      <tool.icon className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-black dark:text-white">{tool.title}</h3>
                    <p className="text-sm text-black/70 dark:text-white/70 mb-8 leading-relaxed flex-grow">
                      {tool.description}
                    </p>
                    <Button asChild className="w-full bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-colors duration-300">
                      <Link to={tool.href} aria-label={`Try ${tool.title}`}>
                        {tool.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">What Our Travelers Say</h2>
            <p className="text-body text-muted-foreground max-w-3xl mx-auto">
              Real experiences from real travelers who chose ExploreNow for their adventures.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <motion.div key={testimonial.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="hover-lift border-0 shadow-elegant-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-foreground fill-current" />)}
                    </div>
                    <Quote className="w-8 h-8 text-muted-foreground mb-4" />
                    <p className="text-body mb-6 leading-relaxed text-foreground">
                      "{testimonial.content}"
                    </p>
                     <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                         <LazyImage 
                           src={testimonial.image} 
                           alt={testimonial.name} 
                           className="w-full h-full object-cover grayscale"
                         />
                       </div>
                      <div>
                        <h4 className="font-medium text-foreground">{testimonial.name}</h4>
                        <p className="text-caption">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }}>
            <h2 className="text-display mb-6">Start Your Journey Now</h2>
            <p className="text-body-large opacity-90 mb-12 max-w-2xl mx-auto">
              Sign up and plan your next adventure today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Get started with ExploreNow">
                <Link to="/signup">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>;
}