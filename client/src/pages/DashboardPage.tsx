import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  TrendingUp, 
  Activity,
  Hotel,
  Plane,
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
  MessageSquare,
  Star,
  Crown,
  Coins,
  Gift,
  User,
  Settings,
  Search,
  Car,
  Wifi,
  Navigation,
  Building2,
  PlaneTakeoff,
  Car as CarIcon,
  Smartphone,
  Plus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

// Types
interface Booking {
  id: string;
  type: string;
  status: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  tripId?: string;
  tripTitle?: string;
  tripLocation?: string;
  tripImageUrl?: string;
  hotelId?: string;
  hotelName?: string;
  hotelLocation?: string;
  hotelImageUrl?: string;
}

interface DashboardData {
  upcoming: Booking[];
  completed: Booking[];
  cancelled: Booking[];
  stats: {
    totalBookings: number;
    totalSpent: number;
    upcomingTrips: number;
    completedTrips: number;
    cancelledTrips: number;
  };
}

// Mock Data (fallback)
const mockBookings: Booking[] = [
  {
    id: '1',
    type: 'trip',
    status: 'confirmed',
    amount: 1200,
    checkIn: '2024-03-15',
    checkOut: '2024-03-22',
    createdAt: '2024-01-15',
    tripId: '1',
    tripTitle: 'Paris Adventure',
    tripLocation: 'Paris, France',
    tripImageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    type: 'hotel',
    status: 'confirmed',
    amount: 800,
    checkIn: '2024-04-10',
    checkOut: '2024-04-15',
    createdAt: '2024-01-20',
    hotelId: '1',
    hotelName: 'Tokyo Grand Hotel',
    hotelLocation: 'Tokyo, Japan',
    hotelImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    type: 'trip',
    status: 'completed',
    amount: 900,
    checkIn: '2024-02-20',
    checkOut: '2024-02-23',
    createdAt: '2024-01-10',
    tripId: '2',
    tripTitle: 'New York Weekend',
    tripLocation: 'New York, USA',
    tripImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
  }
];

const planningCards = [
  { icon: Building2, label: 'Find Places to Stay', href: '/hotels' },
  { icon: Activity, label: 'Find Activities', href: '/activities' },
  { icon: PlaneTakeoff, label: 'Find Flights', href: '/flights' },
  { icon: CarIcon, label: 'Find Airport Transfer', href: '/transfers' },
  { icon: Car, label: 'Find Car Rentals', href: '/car-rentals' },
  { icon: Navigation, label: 'Find Transport Options', href: '/transport' },
  { icon: Smartphone, label: 'Find eSIM Cards', href: '/esim' },
];

const sidebarItems = [
  { icon: BookOpen, label: 'My Bookings', href: '/dashboard' },
  { icon: BookOpen, label: 'All Bookings', href: '/dashboard', active: true },
  { icon: Building2, label: 'Hotels', href: '/hotels' },
  { icon: PlaneTakeoff, label: 'Flights', href: '/flights' },
  { icon: Activity, label: 'Activities', href: '/activities' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Star, label: 'Reviews', href: '/reviews' },
  { icon: Crown, label: 'ExploreVIP', href: '/vip' },
  { icon: Coins, label: 'ExploreCash', href: '/cash' },
  { icon: Gift, label: 'Rewards', href: '/rewards' },
  { icon: User, label: 'Profile', href: '/profile' },
];

// Custom Hook
const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorSimulation, setErrorSimulation] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    
    if (errorSimulation) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bookings/dashboard', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data');
        }
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      // Fallback to mock data for development
      const dashboardData: DashboardData = {
        upcoming: mockBookings.filter(b => b.status === 'confirmed'),
        completed: mockBookings.filter(b => b.status === 'completed'),
        cancelled: mockBookings.filter(b => b.status === 'cancelled'),
        stats: {
          totalBookings: mockBookings.length,
          totalSpent: mockBookings.reduce((sum, b) => sum + b.amount, 0),
          upcomingTrips: mockBookings.filter(b => b.status === 'confirmed').length,
          completedTrips: mockBookings.filter(b => b.status === 'completed').length,
          cancelledTrips: mockBookings.filter(b => b.status === 'cancelled').length
        }
      };
      setData(dashboardData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [errorSimulation]);

  return {
    data,
    isLoading,
    isError,
    refetch: fetchData,
    errorSimulation,
    setErrorSimulation
  };
};

// Components

const Sidebar = ({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean; setIsCollapsed: (collapsed: boolean) => void }) => {
  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 border-r border-gray-700 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-white hover:bg-gray-700"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Dashboard</span>}
        </Button>
      </div>
      
      <nav className="mt-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <TooltipProvider key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <li>
                    <Button
                      variant={item.active ? "secondary" : "ghost"}
                      className={`w-full justify-start text-white hover:bg-gray-700 ${
                        item.active ? 'bg-gray-700' : ''
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span className="ml-2">{item.label}</span>}
                    </Button>
                  </li>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const statusColors = {
    confirmed: 'bg-blue-600',
    completed: 'bg-green-600',
    cancelled: 'bg-red-600',
    pending: 'bg-yellow-600',
  };

  const statusIcons = {
    confirmed: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    pending: Clock,
  };

  const StatusIcon = statusIcons[booking.status as keyof typeof statusIcons] || Clock;

  // Get booking details
  const title = booking.tripTitle || booking.hotelName || 'Booking';
  const location = booking.tripLocation || booking.hotelLocation || 'Location';
  const imageUrl = booking.tripImageUrl || booking.hotelImageUrl || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop';
  const type = booking.type === 'trip' ? 'Trip' : 'Hotel';

  return (
    <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <Badge className={`absolute top-3 right-3 ${statusColors[booking.status as keyof typeof statusColors]} text-white`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {booking.status}
          </Badge>
          <Badge className="absolute top-3 left-3 bg-gray-700 text-white">
            {type}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <div className="flex items-center text-gray-300 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {location}
          </div>
          <div className="flex items-center text-gray-300 mb-3">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">${booking.amount}</span>
            <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BookingList = ({ bookings }: { bookings: Booking[] }) => {
  const statusColors = {
    confirmed: 'bg-blue-600',
    completed: 'bg-green-600',
    cancelled: 'bg-red-600',
    pending: 'bg-yellow-600',
  };

  const statusIcons = {
    confirmed: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    pending: Clock,
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Booking List</h3>
      </div>
      <div className="divide-y divide-gray-700">
        {bookings.map((booking) => {
          const StatusIcon = statusIcons[booking.status as keyof typeof statusIcons] || Clock;
          const title = booking.tripTitle || booking.hotelName || 'Booking';
          const location = booking.tripLocation || booking.hotelLocation || 'Location';
          const imageUrl = booking.tripImageUrl || booking.hotelImageUrl || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop';
          const type = booking.type === 'trip' ? 'Trip' : 'Hotel';

          return (
            <div key={booking.id} className="p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="text-white font-medium">{title}</h4>
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      {location}
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-400 text-xs">
                      <span className="bg-gray-700 px-2 py-1 rounded">{type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-white">${booking.amount}</span>
                  <Badge className={`${statusColors[booking.status as keyof typeof statusColors]} text-white`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



const StartPlanningSection = () => (
  <div className="mt-12">
    <h2 className="text-2xl font-bold text-white mb-6">Start planning your next trip?</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {planningCards.map((card) => (
        <Card
          key={card.label}
          className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:from-gray-750 hover:to-gray-850 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer group"
        >
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <card.icon className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-white font-medium">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Main Component
export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, errorSimulation, setErrorSimulation } = useDashboardData();

  // Debug logging
  console.log('DashboardPage - User:', user);
  console.log('DashboardPage - Auth state:', { user, isLoading: false, isError });

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your trips and bookings</p>
          </div>

          {/* Debug and Test Controls */}
          <div className="mb-6 flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setErrorSimulation(!errorSimulation)}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              {errorSimulation ? 'Disable' : 'Enable'} Error Simulation
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/test', { credentials: 'include' });
                  const data = await response.json();
                  console.log('Auth test response:', data);
                  alert(JSON.stringify(data, null, 2));
                } catch (error) {
                  console.error('Auth test failed:', error);
                  alert('Auth test failed: ' + error);
                }
              }}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Test Auth
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Current user:', user);
                console.log('localStorage user:', localStorage.getItem('user'));
                alert(`User: ${JSON.stringify(user, null, 2)}\n\nlocalStorage: ${localStorage.getItem('user')}`);
              }}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Debug User
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="upcoming" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  Upcoming ({data?.stats.upcomingTrips || 0})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  Completed ({data?.stats.completedTrips || 0})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  Cancelled ({data?.stats.cancelledTrips || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-0">
                        <Skeleton className="w-full h-48 rounded-t-lg" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Alert className="bg-red-900/20 border-red-700 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load dashboard data
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      className="ml-4 border-red-600 text-red-200 hover:bg-red-800"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Show bookings based on active tab */}
                {(() => {
                  let bookings: Booking[] = [];
                  let isEmpty = false;
                  
                  switch (activeTab) {
                    case 'upcoming':
                      bookings = data?.upcoming || [];
                      isEmpty = bookings.length === 0;
                      break;
                    case 'completed':
                      bookings = data?.completed || [];
                      isEmpty = bookings.length === 0;
                      break;
                    case 'cancelled':
                      bookings = data?.cancelled || [];
                      isEmpty = bookings.length === 0;
                      break;
                    default:
                      bookings = data?.upcoming || [];
                      isEmpty = bookings.length === 0;
                  }
                  
                  if (isEmpty) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                          <Plane className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No {activeTab} bookings</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                          {activeTab === 'upcoming' && "You don't have any upcoming bookings yet."}
                          {activeTab === 'completed' && "You haven't completed any trips yet."}
                          {activeTab === 'cancelled' && "You don't have any cancelled bookings."}
                        </p>
                        <Button onClick={() => console.log('Explore bookings clicked')} className="bg-primary hover:bg-primary/90">
                          Explore Bookings
                        </Button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  );
                })()}
                
                <StartPlanningSection />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
