import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Download, ArrowLeft, Calendar, Users, MapPin, DollarSign, Plane, Train, Bus, Hotel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PriceDisplay } from '@/components/ui/price-display';

interface Booking {
  id: string;
  tripId?: string | null;
  hotelId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  transportMode?: string | null;
  transportDetails?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  amount: string;
  status: string;
  currency?: string | null;
  tripTitle?: string;
  tripLocation?: string;
  tripImageUrl?: string;
  hotelName?: string;
  hotelLocation?: string;
  hotelImageUrl?: string;
}

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: booking, isLoading, error } = useQuery<Booking>({
    queryKey: ['booking', id],
    queryFn: async () => {
      if (!id) throw new Error('Booking ID is required');
      
      // First try direct booking endpoint (includes trip/hotel details)
      const response = await fetch(`/api/bookings/${id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data as Booking;
        }
      }
      
      // Fallback: try dashboard endpoint which includes trip/hotel details
      const dashboardResponse = await fetch('/api/bookings/dashboard', {
        credentials: 'include',
      });
      
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        if (dashboardResult.success && dashboardResult.data) {
          // Search in all booking arrays
          const allBookings = [
            ...(dashboardResult.data.upcoming || []),
            ...(dashboardResult.data.completed || []),
            ...(dashboardResult.data.cancelled || []),
            ...(dashboardResult.data.all || [])
          ];
          const foundBooking = allBookings.find((b: Booking) => b.id === id);
          
          if (foundBooking) {
            return foundBooking as Booking;
          }
        }
      }
      
      // If both fail, throw error
      if (!response.ok && !dashboardResponse.ok) {
        throw new Error(`Failed to fetch booking: ${response.status} ${response.statusText}`);
      }
      
      throw new Error('Booking not found');
    },
    enabled: !!id,
  });

  const getTransportIcon = (mode: string | null | undefined) => {
    if (!mode) return null;
    switch (mode.toLowerCase()) {
      case 'bus':
        return <Bus className="h-4 w-4" />;
      case 'train':
        return <Train className="h-4 w-4" />;
      case 'flight':
        return <Plane className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleDownloadReceipt = () => {
    if (!booking) return;
    
    const receipt = `
Booking Receipt
===============

Booking ID: ${booking.id}
Customer: ${booking.customerName}
Email: ${booking.customerEmail}
Phone: ${booking.customerPhone}

${booking.tripTitle ? `Trip: ${booking.tripTitle}` : ''}
${booking.tripLocation ? `Location: ${booking.tripLocation}` : ''}
${booking.hotelName ? `Hotel: ${booking.hotelName}` : ''}
${booking.hotelLocation ? `Hotel Location: ${booking.hotelLocation}` : ''}
${booking.transportMode ? `Transport: ${booking.transportMode}` : ''}

Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}

Total Cost: ${booking.currency || 'USD'} ${booking.amount}
Status: ${booking.status}

Thank you for choosing ExploreNow!
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-lg text-muted-foreground mt-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'The booking you are looking for does not exist.'}
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = parseFloat(booking.amount || '0');

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-muted-foreground">Your trip has been successfully booked</p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-white dark:text-black">
              <CardTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <Badge variant="secondary" className="bg-white dark:bg-black text-blue-600 dark:text-blue-400">
                  {booking.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {booking.customerName}</p>
                    <p><span className="font-medium">Email:</span> {booking.customerEmail}</p>
                    <p><span className="font-medium">Phone:</span> {booking.customerPhone}</p>
                  </div>
                </div>

                {/* Trip/Hotel Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Booking Details</h3>
                  <div className="space-y-2">
                    {booking.tripTitle && (
                      <p className="flex items-center">
                        <Plane className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">Trip:</span> {booking.tripTitle}
                        {booking.tripLocation && <span className="text-muted-foreground ml-2">({booking.tripLocation})</span>}
                      </p>
                    )}
                    {booking.hotelName && (
                      <p className="flex items-center">
                        <Hotel className="w-4 h-4 mr-2 text-green-600" />
                        <span className="font-medium">Hotel:</span> {booking.hotelName}
                        {booking.hotelLocation && <span className="text-muted-foreground ml-2">({booking.hotelLocation})</span>}
                      </p>
                    )}
                    {booking.transportMode && (
                      <p className="flex items-center">
                        {getTransportIcon(booking.transportMode)}
                        <span className="font-medium ml-2">Transport:</span> 
                        <span className="capitalize ml-2">{booking.transportMode}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Dates and Guests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Dates & Guests</h3>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Check-in:</span> {new Date(booking.checkIn).toLocaleDateString()}
                    </p>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                    <p className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="font-medium">Guests:</span> {booking.guests}
                    </p>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Cost Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center text-2xl font-bold text-green-600">
                      <DollarSign className="w-6 h-6 mr-2" />
                      Total: <PriceDisplay price={totalAmount} originalCurrency={booking.currency || 'USD'} />
                    </p>
                    <p className="text-sm text-muted-foreground">Booking ID: {booking.id}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t">
                <Button 
                  onClick={handleDownloadReceipt}
                  className="flex-1"
                  variant="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard?refresh=true')}
                  className="flex-1"
                >
                  View in Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
