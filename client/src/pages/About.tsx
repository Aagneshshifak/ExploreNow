import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Award, Heart, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Link } from "react-router-dom";
const About = () => {
  const teamMembers = [{
    name: "Arjun Mehta",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    description: "Travel enthusiast with 15+ years in hospitality"
  }, {
    name: "Priya Sharma",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1494790108755-2616c0763c9f?w=300",
    description: "Expert in luxury travel and customer experience"
  }, {
    name: "Vikram Singh",
    role: "Technology Lead",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    description: "Building seamless digital travel experiences"
  }, {
    name: "Anisha Patel",
    role: "Destination Expert",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    description: "Discovering India's hidden gems for 10+ years"
  }];
  const whyChooseUsFeatures = [{
    icon: <Shield className="w-8 h-8" />,
    title: "Trusted & Secure",
    description: "Your safety and security are our top priorities. All our partners are verified and transactions are protected."
  }, {
    icon: <Users className="w-8 h-8" />,
    title: "Local Experts",
    description: "Our team consists of local travel experts who know India's hidden gems and cultural nuances."
  }, {
    icon: <Award className="w-8 h-8" />,
    title: "Award Winning",
    description: "Recognized as India's leading tourism platform with multiple industry awards for excellence."
  }, {
    icon: <Heart className="w-8 h-8" />,
    title: "24/7 Support",
    description: "Round-the-clock customer support to ensure your journey is smooth from start to finish."
  }];
  return <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920')"
      }}>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About ExploreNow
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Connecting India's Hidden Wonders to the World
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                At ExploreNow, we believe that travel has the power to transform lives, build bridges between cultures, 
                and create lasting memories. Our mission is to make India's incredible diversity and beauty accessible 
                to every traveler while supporting local communities and promoting sustainable tourism.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                We're committed to providing authentic experiences that go beyond the typical tourist trail, 
                helping you discover the real India through the eyes of locals who call this amazing country home.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Supporting local tourism and communities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Promoting sustainable and responsible travel</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Providing secure and seamless digital bookings</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600" alt="Indian culture and heritage" className="w-full h-96 object-cover rounded-lg shadow-elegant" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-lg"></div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose ExploreNow?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're more than just a booking platform - we're your travel partners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsFeatures.map((feature, index) => <Card key={index} className="text-center p-8 shadow-soft hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[{
            number: "50,000+",
            label: "Happy Travelers"
          }, {
            number: "500+",
            label: "Destinations"
          }, {
            number: "2,000+",
            label: "Partner Hotels"
          }, {
            number: "4.8/5",
            label: "Average Rating"
          }].map((stat, index) => <div key={index} className="space-y-2">
                <h3 className="text-4xl font-bold text-primary">{stat.number}</h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Partner With Us?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Whether you're a traveler looking for your next adventure or a hotel partner wanting to join our network, 
            we'd love to hear from you.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="p-6 text-left">
              <h3 className="text-lg font-semibold mb-4">For Travelers</h3>
              <p className="text-muted-foreground mb-4">
                Have questions about your booking or need travel advice? Our support team is here to help.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+91 9876543210</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>support@explorenow.com</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 text-left">
              <h3 className="text-lg font-semibold mb-4">For Hotel Partners</h3>
              <p className="text-muted-foreground mb-4">
                Join our network of premium hotels and reach travelers across India and beyond.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+91 9876543211</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>partners@explorenow.com</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trip-planner">
              <Button size="lg" className="bg-primary hover:bg-primary-glow text-primary-foreground px-8 py-4">
                Start Your Journey
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-4">
              Partner With Us
            </Button>
          </div>
        </div>
      </section>
    </div>;
};
export default About;