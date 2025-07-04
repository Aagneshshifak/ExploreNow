import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  CalendarIcon,
  DollarSign,
  Percent,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Hotel {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  status: 'active' | 'inactive';
  bookings: number;
  revenue: number;
}

interface Booking {
  id: string;
  guestName: string;
  hotelName: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  amount: number;
}

interface Promotion {
  id: string;
  title: string;
  discount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'scheduled' | 'expired';
  hotels: string[];
}

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    discount: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    selectedHotels: [] as string[]
  });

  const stats = {
    totalBookings: 1247,
    occupancyRate: 78,
    activePromotions: 5,
    monthlyRevenue: 1850000
  };

  const hotels: Hotel[] = [
    {
      id: 'hotel-1',
      name: 'Taj Lake Palace',
      location: 'Udaipur, Rajasthan',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300',
      rating: 4.8,
      status: 'active',
      bookings: 89,
      revenue: 485000
    },
    {
      id: 'hotel-2',
      name: 'Backwater Retreat',
      location: 'Alleppey, Kerala',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300',
      rating: 4.6,
      status: 'active',
      bookings: 67,
      revenue: 235000
    },
    {
      id: 'hotel-3',
      name: 'The Oberoi Amarvilas',
      location: 'Agra, Uttar Pradesh',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300',
      rating: 4.9,
      status: 'inactive',
      bookings: 45,
      revenue: 312000
    }
  ];

  const bookings: Booking[] = [
    {
      id: 'BKG-001',
      guestName: 'Priya Sharma',
      hotelName: 'Taj Lake Palace',
      checkIn: new Date('2024-03-15'),
      checkOut: new Date('2024-03-18'),
      status: 'confirmed',
      amount: 55500
    },
    {
      id: 'BKG-002',
      guestName: 'Rajesh Kumar',
      hotelName: 'Backwater Retreat',
      checkIn: new Date('2024-03-14'),
      checkOut: new Date('2024-03-16'),
      status: 'completed',
      amount: 17000
    },
    {
      id: 'BKG-003',
      guestName: 'Anita Reddy',
      hotelName: 'The Oberoi Amarvilas',
      checkIn: new Date('2024-03-20'),
      checkOut: new Date('2024-03-22'),
      status: 'confirmed',
      amount: 49000
    }
  ];

  const promotions: Promotion[] = [
    {
      id: 'PROMO-001',
      title: 'Summer Special',
      discount: 20,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-30'),
      status: 'scheduled',
      hotels: ['hotel-1', 'hotel-2']
    },
    {
      id: 'PROMO-002',
      title: 'Weekend Getaway',
      discount: 15,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-31'),
      status: 'active',
      hotels: ['hotel-1']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreatePromotion = () => {
    // Handle promotion creation
    console.log('Creating promotion:', promotionForm);
    // Reset form
    setPromotionForm({
      title: '',
      discount: '',
      startDate: undefined,
      endDate: undefined,
      selectedHotels: []
    });
  };

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-8 px-4 bg-gradient-to-r from-muted/30 to-background border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hotel Partner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your properties, bookings, and promotions
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="hotels">My Hotels</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+3%</span> from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePromotions}</div>
                  <p className="text-xs text-muted-foreground">
                    2 expiring this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+8%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Hotels</h2>
              <Button className="bg-primary hover:bg-primary-glow text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add New Hotel
              </Button>
            </div>

            <div className="grid gap-6">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="shadow-soft hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48">
                        <img 
                          src={hotel.image} 
                          alt={hotel.name}
                          className="w-full h-32 md:h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{hotel.name}</h3>
                            <p className="text-muted-foreground text-sm">{hotel.location}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-sm">Rating: {hotel.rating}/5</span>
                            </div>
                          </div>
                          
                          <Badge className={getStatusColor(hotel.status)}>
                            {hotel.status}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="font-semibold">{hotel.bookings} bookings</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-semibold">₹{hotel.revenue.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Bookings</h2>
              <div className="flex space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold mb-1">{booking.guestName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{booking.hotelName}</p>
                        <p className="text-sm">
                          {format(booking.checkIn, "MMM dd")} - {format(booking.checkOut, "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">ID: {booking.id}</p>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <p className="text-lg font-semibold mt-2">₹{booking.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Create Promotion Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Promotion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Promotion Title</Label>
                    <Input
                      id="title"
                      value={promotionForm.title}
                      onChange={(e) => setPromotionForm({...promotionForm, title: e.target.value})}
                      placeholder="e.g., Summer Special Offer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Discount Percentage</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={promotionForm.discount}
                      onChange={(e) => setPromotionForm({...promotionForm, discount: e.target.value})}
                      placeholder="e.g., 20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !promotionForm.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {promotionForm.startDate ? format(promotionForm.startDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={promotionForm.startDate}
                            onSelect={(date) => setPromotionForm({...promotionForm, startDate: date})}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !promotionForm.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {promotionForm.endDate ? format(promotionForm.endDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={promotionForm.endDate}
                            onSelect={(date) => setPromotionForm({...promotionForm, endDate: date})}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>Select Hotels</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose hotels for this promotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreatePromotion} 
                    className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
                  >
                    Create Promotion
                  </Button>
                </CardContent>
              </Card>

              {/* Active Promotions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Promotions</h3>
                {promotions.map((promotion) => (
                  <Card key={promotion.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{promotion.title}</h4>
                        <Badge className={getStatusColor(promotion.status)}>
                          {promotion.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Percent className="w-4 h-4 mr-1" />
                          {promotion.discount}% off
                        </span>
                        <span>
                          {format(promotion.startDate, "MMM dd")} - {format(promotion.endDate, "MMM dd")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Applied to {promotion.hotels.length} hotel{promotion.hotels.length > 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Manage your account preferences and profile information.
                </p>
                <Button variant="outline">Edit Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;