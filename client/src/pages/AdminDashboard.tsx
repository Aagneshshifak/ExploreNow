import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Hotel, 
  MapPin, 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  FileText,
  Image,
  Users,
  Star,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    title: '',
    location: '',
    images: '',
    summary: '',
    price: '',
    amenities: '',
    rating: ''
  });
  const [tripForm, setTripForm] = useState({
    destination: '',
    duration: '',
    price: '',
    summary: '',
    itinerary: '',
    included: '',
    difficulty: ''
  });
  
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleHotelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Hotel Submitted",
      description: "Hotel information has been submitted for review.",
    });
    setHotelForm({
      title: '',
      location: '',
      images: '',
      summary: '',
      price: '',
      amenities: '',
      rating: ''
    });
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Trip Submitted",
      description: "Trip information has been submitted for review.",
    });
    setTripForm({
      destination: '',
      duration: '',
      price: '',
      summary: '',
      itinerary: '',
      included: '',
      difficulty: ''
    });
  };

  const sidebarItems = [
    { id: 'new-hotel', label: 'Submit New Hotel', icon: Hotel },
    { id: 'new-trip', label: 'Submit New Trip', icon: MapPin },
    { id: 'review-hotels', label: 'Review Hotel Submissions', icon: Search },
    { id: 'review-trips', label: 'Review Trip Submissions', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden mr-2"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
            <h1 className="text-xl font-bold">ExploreNow Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0
        `}>
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-muted transition-colors"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
              <p className="text-muted-foreground">Manage hotels, trips, and submissions</p>
            </div>

            <Tabs defaultValue="new-hotel" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="new-hotel">📌 New Hotel</TabsTrigger>
                <TabsTrigger value="new-trip">📌 New Trip</TabsTrigger>
                <TabsTrigger value="review-hotels">🔍 Review Hotels</TabsTrigger>
                <TabsTrigger value="review-trips">🔍 Review Trips</TabsTrigger>
              </TabsList>

              {/* Submit New Hotel */}
              <TabsContent value="new-hotel">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Hotel className="w-5 h-5 mr-2" />
                      Submit New Hotel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleHotelSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Hotel Title</label>
                          <Input
                            value={hotelForm.title}
                            onChange={(e) => setHotelForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Grand Ocean Resort"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Location</label>
                          <Input
                            value={hotelForm.location}
                            onChange={(e) => setHotelForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Miami Beach, Florida"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Price per Night</label>
                          <Input
                            value={hotelForm.price}
                            onChange={(e) => setHotelForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="299"
                            type="number"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating</label>
                          <Input
                            value={hotelForm.rating}
                            onChange={(e) => setHotelForm(prev => ({ ...prev, rating: e.target.value }))}
                            placeholder="4.8"
                            type="number"
                            step="0.1"
                            max="5"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Images (URLs)</label>
                        <Textarea
                          value={hotelForm.images}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, images: e.target.value }))}
                          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Summary</label>
                        <Textarea
                          value={hotelForm.summary}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, summary: e.target.value }))}
                          placeholder="Luxury beachfront resort with stunning ocean views..."
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Amenities</label>
                        <Textarea
                          value={hotelForm.amenities}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, amenities: e.target.value }))}
                          placeholder="Free WiFi, Pool, Spa, Restaurant, Gym"
                          rows={3}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Hotel
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submit New Trip */}
              <TabsContent value="new-trip">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Submit New Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTripSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Destination</label>
                          <Input
                            value={tripForm.destination}
                            onChange={(e) => setTripForm(prev => ({ ...prev, destination: e.target.value }))}
                            placeholder="Bali, Indonesia"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Duration</label>
                          <Input
                            value={tripForm.duration}
                            onChange={(e) => setTripForm(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="7 Days, 6 Nights"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Price</label>
                          <Input
                            value={tripForm.price}
                            onChange={(e) => setTripForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="1299"
                            type="number"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                          <Input
                            value={tripForm.difficulty}
                            onChange={(e) => setTripForm(prev => ({ ...prev, difficulty: e.target.value }))}
                            placeholder="Easy, Moderate, Challenging"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Summary</label>
                        <Textarea
                          value={tripForm.summary}
                          onChange={(e) => setTripForm(prev => ({ ...prev, summary: e.target.value }))}
                          placeholder="Experience the magic of Bali with this comprehensive tour..."
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Itinerary</label>
                        <Textarea
                          value={tripForm.itinerary}
                          onChange={(e) => setTripForm(prev => ({ ...prev, itinerary: e.target.value }))}
                          placeholder="Day 1: Arrival in Denpasar..."
                          rows={6}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">What's Included</label>
                        <Textarea
                          value={tripForm.included}
                          onChange={(e) => setTripForm(prev => ({ ...prev, included: e.target.value }))}
                          placeholder="Flights, Hotels, Meals, Transportation, Guide"
                          rows={3}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Trip
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review Hotel Submissions */}
              <TabsContent value="review-hotels">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="w-5 h-5 mr-2" />
                      Review Hotel Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Input placeholder="Search hotels..." className="flex-1" />
                        <Button variant="outline">
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="text-center py-12 text-muted-foreground">
                        <Hotel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hotel submissions to review at this time.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review Trip Submissions */}
              <TabsContent value="review-trips">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="w-5 h-5 mr-2" />
                      Review Trip Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Input placeholder="Search trips..." className="flex-1" />
                        <Button variant="outline">
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trip submissions to review at this time.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}