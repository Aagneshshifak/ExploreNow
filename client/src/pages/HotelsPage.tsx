import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Star, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface HotelBooking {
  id: string;
  type: string;
  status: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  hotelId?: string;
  hotelName?: string;
  hotelLocation?: string;
  hotelImageUrl?: string;
  hotelRating?: number;
  hotelPrice?: number;
  tripId?: string;
  tripTitle?: string;
  tripLocation?: string;
}

interface HotelData {
  hotels: HotelBooking[];
  totalHotels: number;
  totalSpent: number;
}

// Custom Hook
const useHotelData = () => {
  const [data, setData] = useState<HotelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const response = await fetch('/api/bookings/hotels', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotel data');
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch hotel data');
      }
    } catch (error) {
      console.error('Hotel data fetch error:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    isError,
    refetch: fetchData
  };
};

// Components
const HotelCard = ({ hotel }: { hotel: HotelBooking }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <Badge className={`${getStatusColor(hotel.status)} text-white`}>
                  {getStatusIcon(hotel.status)}
                  <span className="ml-1 capitalize">{hotel.status}</span>
                </Badge>
              </div>
              <CardTitle className="text-white text-lg">
                {hotel.hotelName || 'Hotel Booking'}
              </CardTitle>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{hotel.hotelLocation || hotel.tripLocation || 'Location not specified'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${hotel.amount}
              </div>
              {hotel.hotelRating && (
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{hotel.hotelRating}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Check-in: {new Date(hotel.checkIn).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Check-out: {new Date(hotel.checkOut).toLocaleDateString()}</span>
            </div>
            {hotel.tripTitle && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Part of: {hotel.tripTitle}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              View Details
            </Button>
            {hotel.status === 'confirmed' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-600 text-red-400 hover:bg-red-900"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export default function HotelsPage() {
  const { data, isLoading, isError, refetch } = useHotelData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="bg-red-900 border-red-700">
            <AlertDescription className="text-red-200">
              Failed to load hotel bookings. Please try again.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refetch} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const confirmedHotels = data?.hotels.filter(h => h.status === 'confirmed') || [];
  const completedHotels = data?.hotels.filter(h => h.status === 'completed') || [];
  const cancelledHotels = data?.hotels.filter(h => h.status === 'cancelled') || [];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Hotel Bookings</h1>
          <p className="text-gray-400">View and manage your hotel reservations and bookings</p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Hotels</p>
                    <p className="text-2xl font-bold text-white">{data.totalHotels}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-white">${data.totalSpent}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Upcoming</p>
                    <p className="text-2xl font-bold text-white">{confirmedHotels.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
              All ({data?.totalHotels || 0})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-gray-700">
              Confirmed ({confirmedHotels.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-700">
              Completed ({completedHotels.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-gray-700">
              Cancelled ({cancelledHotels.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {confirmedHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
