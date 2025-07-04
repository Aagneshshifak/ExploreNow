import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  MapPin, 
  Download, 
  X, 
  Star,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  hotelName: string;
  location: string;
  image: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  totalPrice: number;
  bookingDate: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  rating?: number;
  hasReview?: boolean;
}

const MyBookings = () => {
  const [bookings] = useState<Booking[]>([
    {
      id: "EXP2024001",
      hotelName: "Taj Lake Palace",
      location: "Udaipur, Rajasthan",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
      checkIn: new Date("2024-03-15"),
      checkOut: new Date("2024-03-18"),
      guests: 2,
      rooms: 1,
      totalPrice: 55500,
      bookingDate: new Date("2024-02-10"),
      status: 'confirmed'
    },
    {
      id: "EXP2024002",
      hotelName: "Backwater Retreat",
      location: "Alleppey, Kerala",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
      checkIn: new Date("2024-02-20"),
      checkOut: new Date("2024-02-23"),
      guests: 4,
      rooms: 2,
      totalPrice: 25500,
      bookingDate: new Date("2024-01-15"),
      status: 'completed',
      rating: 4,
      hasReview: true
    },
    {
      id: "EXP2024003",
      hotelName: "The Oberoi Amarvilas",
      location: "Agra, Uttar Pradesh",
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
      checkIn: new Date("2024-01-10"),
      checkOut: new Date("2024-01-12"),
      guests: 2,
      rooms: 1,
      totalPrice: 49000,
      bookingDate: new Date("2023-12-20"),
      status: 'completed',
      hasReview: false
    },
    {
      id: "EXP2024004",
      hotelName: "Goa Beach Resort",
      location: "Calangute, Goa",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
      checkIn: new Date("2023-12-25"),
      checkOut: new Date("2023-12-28"),
      guests: 3,
      rooms: 2,
      totalPrice: 18600,
      bookingDate: new Date("2023-11-30"),
      status: 'cancelled'
    }
  ]);

  const upcomingBookings = bookings.filter(booking => booking.status === 'confirmed');
  const pastBookings = bookings.filter(booking => booking.status === 'completed' || booking.status === 'cancelled');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="shadow-soft hover:shadow-elegant transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 relative">
            <img 
              src={booking.image} 
              alt={booking.hotelName}
              className="w-full h-48 md:h-full object-cover"
            />
            <Badge 
              className={`absolute top-4 left-4 ${getStatusColor(booking.status)} border`}
            >
              <span className="flex items-center space-x-1">
                {getStatusIcon(booking.status)}
                <span className="capitalize">{booking.status}</span>
              </span>
            </Badge>
          </div>
          
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{booking.hotelName}</h3>
                <div className="flex items-center text-muted-foreground text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.location}
                </div>
                <p className="text-sm text-muted-foreground">
                  Booking ID: {booking.id}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ₹{booking.totalPrice.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.rooms} room{booking.rooms > 1 ? 's' : ''} • {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Check-in</p>
                  <p className="text-sm text-muted-foreground">
                    {format(booking.checkIn, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Check-out</p>
                  <p className="text-sm text-muted-foreground">
                    {format(booking.checkOut, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {booking.status === 'completed' && booking.rating && (
              <div className="flex items-center mb-4">
                <span className="text-sm text-muted-foreground mr-2">Your rating:</span>
                <div className="flex">
                  {renderStars(booking.rating)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {booking.status === 'confirmed' && (
                <>
                  <Button variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                  <Button size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" />
                    Download Voucher
                  </Button>
                </>
              )}
              
              {booking.status === 'completed' && (
                <>
                  <Button size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                  {!booking.hasReview && (
                    <Button variant="outline" size="sm">
                      <Star className="w-4 h-4 mr-2" />
                      Leave a Review
                    </Button>
                  )}
                </>
              )}
              
              {booking.status === 'cancelled' && (
                <Button size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-r from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Your Bookings
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage and view your past and upcoming trips
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="grid w-full md:w-96 grid-cols-2">
            <TabsTrigger value="upcoming" className="flex items-center space-x-2">
              <span>Upcoming Trips</span>
              {upcomingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center space-x-2">
              <span>Past Trips</span>
              {pastBookings.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pastBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingBookings.length === 0 ? (
              <Card className="text-center p-12">
                <CardContent className="p-0">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No upcoming trips</h3>
                  <p className="text-muted-foreground mb-6">
                    It looks like you don't have any upcoming bookings. Ready to plan your next adventure?
                  </p>
                  <Button className="bg-primary hover:bg-primary-glow text-primary-foreground">
                    Browse Hotels
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastBookings.length === 0 ? (
              <Card className="text-center p-12">
                <CardContent className="p-0">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No past trips</h3>
                  <p className="text-muted-foreground">
                    Your travel history will appear here once you complete your trips.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground mb-4">
                  Showing {pastBookings.length} completed trips
                </div>
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyBookings;