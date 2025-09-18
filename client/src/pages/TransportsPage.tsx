import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Plane, 
  Train, 
  Bus,
  MapPin, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface TransportBooking {
  id: string;
  type: string;
  status: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  transportType?: string;
  tripId?: string;
  tripTitle?: string;
  tripLocation?: string;
  tripImageUrl?: string;
}

interface TransportData {
  flights: TransportBooking[];
  trains: TransportBooking[];
  buses: TransportBooking[];
  allTransports: TransportBooking[];
  stats: {
    totalTransports: number;
    totalSpent: number;
    flightCount: number;
    trainCount: number;
    busCount: number;
  };
}

// Custom Hook
const useTransportData = () => {
  const [data, setData] = useState<TransportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const response = await fetch('/api/bookings/transports', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transport data');
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch transport data');
      }
    } catch (error) {
      console.error('Transport data fetch error:', error);
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
const TransportCard = ({ transport }: { transport: TransportBooking }) => {
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

  const getTransportIcon = (transportType?: string) => {
    switch (transportType) {
      case 'flight': return <Plane className="w-5 h-5 text-blue-400" />;
      case 'train': return <Train className="w-5 h-5 text-green-400" />;
      case 'bus': return <Bus className="w-5 h-5 text-orange-400" />;
      default: return <Car className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTransportLabel = (transportType?: string) => {
    switch (transportType) {
      case 'flight': return 'Flight';
      case 'train': return 'Train';
      case 'bus': return 'Bus';
      default: return 'Transport';
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
                {getTransportIcon(transport.transportType)}
                <Badge className={`${getStatusColor(transport.status)} text-white`}>
                  {getStatusIcon(transport.status)}
                  <span className="ml-1 capitalize">{transport.status}</span>
                </Badge>
              </div>
              <CardTitle className="text-white text-lg">
                {getTransportLabel(transport.transportType)} Booking
              </CardTitle>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{transport.tripLocation || 'Location not specified'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${transport.amount}
              </div>
              <div className="text-sm text-gray-400">
                {getTransportLabel(transport.transportType)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Departure: {new Date(transport.checkIn).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Return: {new Date(transport.checkOut).toLocaleDateString()}</span>
            </div>
            {transport.tripTitle && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>For: {transport.tripTitle}</span>
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
            {transport.status === 'confirmed' && (
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
export default function TransportsPage() {
  const { data, isLoading, isError, refetch } = useTransportData();

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
              Failed to load transport bookings. Please try again.
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

  const confirmedTransports = data?.allTransports.filter(t => t.status === 'confirmed') || [];
  const completedTransports = data?.allTransports.filter(t => t.status === 'completed') || [];
  const cancelledTransports = data?.allTransports.filter(t => t.status === 'cancelled') || [];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Transport Bookings</h1>
          <p className="text-gray-400">View and manage your flight, train, and bus bookings</p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Transports</p>
                    <p className="text-2xl font-bold text-white">{data.stats.totalTransports}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Flights</p>
                    <p className="text-2xl font-bold text-white">{data.stats.flightCount}</p>
                  </div>
                  <Plane className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Trains</p>
                    <p className="text-2xl font-bold text-white">{data.stats.trainCount}</p>
                  </div>
                  <Train className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Buses</p>
                    <p className="text-2xl font-bold text-white">{data.stats.busCount}</p>
                  </div>
                  <Bus className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
              All ({data?.stats.totalTransports || 0})
            </TabsTrigger>
            <TabsTrigger value="flights" className="data-[state=active]:bg-gray-700">
              Flights ({data?.stats.flightCount || 0})
            </TabsTrigger>
            <TabsTrigger value="trains" className="data-[state=active]:bg-gray-700">
              Trains ({data?.stats.trainCount || 0})
            </TabsTrigger>
            <TabsTrigger value="buses" className="data-[state=active]:bg-gray-700">
              Buses ({data?.stats.busCount || 0})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-gray-700">
              Confirmed ({confirmedTransports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.allTransports.map((transport) => (
                <TransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="flights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.flights.map((transport) => (
                <TransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trains" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.trains.map((transport) => (
                <TransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="buses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.buses.map((transport) => (
                <TransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {confirmedTransports.map((transport) => (
                <TransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
