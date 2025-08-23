import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, ArrowLeft, Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { executeQuery } from '@/lib/graphql';

const BOOKING_QUERY = `
  query GetBooking($id: ID!) {
    booking(id: $id) {
      id
      tripId
      hotelId
      customerName
      email
      phone
      transport
      checkIn
      checkOut
      guests
      totalCost
      status
    }
  }
`;

interface Booking {
  id: string;
  tripId: string;
  hotelId: string;
  customerName: string;
  email: string;
  phone: string;
  transport: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalCost: number;
  status: string;
}

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setError('Booking ID is required');
        setLoading(false);
        return;
      }

      try {
        const result = await executeQuery(BOOKING_QUERY, { id });
        if (result.data?.booking) {
          setBooking(result.data.booking);
        } else {
          setError('Booking not found');
        }
      } catch (err: any) {
        setError('Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleDownloadReceipt = () => {
    if (!booking) return;
    
    const receipt = `
Booking Receipt
===============

Booking ID: ${booking.id}
Customer: ${booking.customerName}
Email: ${booking.email}
Phone: ${booking.phone}

Trip ID: ${booking.tripId}
Hotel ID: ${booking.hotelId}
Transport: ${booking.transport}

Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}

Total Cost: $${booking.totalCost}
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The booking you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-gray-600">Your trip has been successfully booked</p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <Badge variant="secondary" className="bg-white text-blue-600">
                  {booking.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {booking.customerName}</p>
                    <p><span className="font-medium">Email:</span> {booking.email}</p>
                    <p><span className="font-medium">Phone:</span> {booking.phone}</p>
                  </div>
                </div>

                {/* Trip Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Trip Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Trip ID:</span> {booking.tripId}
                    </p>
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium">Hotel ID:</span> {booking.hotelId}
                    </p>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="font-medium">Transport:</span> {booking.transport}
                    </p>
                  </div>
                </div>

                {/* Dates and Guests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dates & Guests</h3>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Check-in:</span> {booking.checkIn}
                    </p>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium">Check-out:</span> {booking.checkOut}
                    </p>
                    <p className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="font-medium">Guests:</span> {booking.guests}
                    </p>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Cost Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center text-2xl font-bold text-green-600">
                      <DollarSign className="w-6 h-6 mr-2" />
                      Total Cost: ${booking.totalCost}
                    </p>
                    <p className="text-sm text-gray-500">Booking ID: {booking.id}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t">
                <Button 
                  onClick={handleDownloadReceipt}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
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
