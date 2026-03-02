import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Sparkles, Calendar, CreditCard } from "lucide-react";
import { graphqlClient, executeMutation } from "../lib/graphql";
import Lottie from "lottie-react";

// Success animation data (you can replace this with your actual animation file)
const successAnim = {
  "v": "5.7.4",
  "fr": 60,
  "ip": 0,
  "op": 180,
  "w": 512,
  "h": 512,
  "nm": "Success Check",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Check",
      "sr": 1,
      "ks": {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ind": 0,
              "ty": "sh",
              "ix": 1,
              "ks": {
                "a": 0,
                "k": {
                  "i": [[0, 0], [0, 0], [0, 0]],
                  "o": [[0, 0], [0, 0], [0, 0]],
                  "v": [[-100, 0], [-33, 67], [100, -100]],
                  "c": false
                }
              }
            },
            {
              "ty": "st",
              "c": {"a": 0, "k": [0, 1, 0, 1]},
              "o": {"a": 0, "k": 100},
              "w": {"a": 0, "k": 20},
              "lc": 2,
              "lj": 2
            },
            {
              "ty": "tr",
              "p": {"a": 0, "k": [0, 0]},
              "a": {"a": 0, "k": [0, 0]},
              "s": {"a": 0, "k": [100, 100]},
              "r": {"a": 0, "k": 0},
              "o": {"a": 0, "k": 100},
              "sk": {"a": 0, "k": 0},
              "sa": {"a": 0, "k": 0}
            }
          ],
          "nm": "Check Path",
          "mn": "ADBE Vector Group",
          "hd": false
        }
      ],
      "ip": 0,
      "op": 180,
      "st": 0,
      "bm": 0
    }
  ]
};

const CREATE_BOOKING = `
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      id
      customerName
      tripId
      hotelId
      totalCost
      status
    }
  }
`;

interface Trip {
  id: string;
  title: string;
  location: string;
  price: number;
  imageUrl?: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  price: number;
  rating?: number;
}

interface BookNowPageProps {
  trip?: Trip;
  hotel?: Hotel;
}

export default function BookNowPage({ trip: propTrip, hotel: propHotel }: BookNowPageProps) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(propTrip || null);
  const [hotel, setHotel] = useState<Hotel | null>(propHotel || null);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [availableHotels, setAvailableHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    customerName: "",
    email: "",
    phone: "",
    transport: "flight",
    checkIn: "",
    checkOut: "",
    guests: 1
  });

  // Fetch trips and hotels if not provided as props
  useEffect(() => {
    const fetchData = async () => {
      if (!propTrip || !propHotel) {
        setLoading(true);
        try {
          // Fetch trips
          const tripsResponse = await fetch('/api/trips');
          if (tripsResponse.ok) {
            const tripsData = await tripsResponse.json();
            setAvailableTrips(tripsData.data || []);
          }

          // Fetch hotels
          const hotelsResponse = await fetch('/api/hotels');
          if (hotelsResponse.ok) {
            const hotelsData = await hotelsResponse.json();
            setAvailableHotels(hotelsData.data || []);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [propTrip, propHotel]);

  // Set trip and hotel from URL parameters if available
  useEffect(() => {
    const tripId = params.tripId || searchParams.get('tripId');
    const hotelId = params.hotelId || searchParams.get('hotelId');

    if (tripId && availableTrips.length > 0) {
      const selectedTrip = availableTrips.find(t => t.id === tripId);
      if (selectedTrip) setTrip(selectedTrip);
    }

    if (hotelId && availableHotels.length > 0) {
      const selectedHotel = availableHotels.find(h => h.id === hotelId);
      if (selectedHotel) setHotel(selectedHotel);
    }
  }, [params, searchParams, availableTrips, availableHotels]);

  const createBooking = async (variables: any) => {
    return await executeMutation(CREATE_BOOKING, variables);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));
  };

  const calculateTotalCost = () => {
    if (!trip || !hotel) return 0;
    const transportCosts = {
      flight: 300,
      train: 100,
      bus: 50,
      car: 150
    };
    return trip.price + hotel.price + transportCosts[bookingDetails.transport as keyof typeof transportCosts];
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      if (window.confirm("You need to sign in to make a booking. Would you like to sign in now?")) {
        navigate('/login', { state: { from: { pathname: '/book-now' } } });
      }
      return;
    }
    
    if (!trip || !hotel) {
      alert("Please select both a trip and hotel before booking.");
      return;
    }
    
    setConfirming(true);
    
    try {
      const result = await createBooking({
        input: {
          tripId: trip.id.toString(),
          hotelId: hotel.id.toString(),
          customerName: bookingDetails.customerName,
          email: bookingDetails.email,
          phone: bookingDetails.phone,
          transport: bookingDetails.transport,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
          guests: bookingDetails.guests,
          totalCost: calculateTotalCost(),
        }
      });

      if (result.data?.createBooking) {
        // Redirect to confirmation page
        navigate(`/confirmation/${result.data.createBooking.id}`);
      } else {
        alert("Booking failed: " + ((result as any).error?.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Booking failed: " + (err.message || "Unknown error"));
    } finally {
      setConfirming(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading booking options...</p>
        </div>
      </div>
    );
  }

  // Show trip/hotel selection if not provided
  if (!trip || !hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-card rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-white dark:text-black p-6">
              <h1 className="text-3xl font-bold">Select Your Trip & Hotel</h1>
              <p className="text-blue-100 dark:text-blue-900 mt-2">Choose your destination and accommodation</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6">
              {/* Trip Selection */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Select Trip</h2>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const selectedTrip = availableTrips.find(t => t.id === e.target.value);
                    setTrip(selectedTrip || null);
                  }}
                  value={trip?.id || ''}
                >
                  <option value="">Choose a trip...</option>
                  {availableTrips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} - {t.location} (${t.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hotel Selection */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Select Hotel</h2>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const selectedHotel = availableHotels.find(h => h.id === e.target.value);
                    setHotel(selectedHotel || null);
                  }}
                  value={hotel?.id || ''}
                >
                  <option value="">Choose a hotel...</option>
                  {availableHotels.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} - {h.location} (${h.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <button
                onClick={() => navigate('/trips')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
              >
                Browse All Trips
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <Lottie 
              animationData={successAnim} 
              loop={false} 
              className="w-32 h-32 mb-6" 
            />
            <h1 className="text-3xl font-bold text-green-600 mb-4">Booking Confirmed! 🎉</h1>
            <p className="text-gray-600 text-center mb-6">
              Your booking has been successfully created. Check your email for confirmation details.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
              <h3 className="font-semibold text-green-800 mb-2">Booking Summary:</h3>
              <p className="text-sm text-green-700">Trip: {trip.title}</p>
              <p className="text-sm text-green-700">Hotel: {hotel.name}</p>
              <p className="text-sm text-green-700">Total Cost: ${calculateTotalCost()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 relative">
      {/* Blur Overlay for non-authenticated users */}
      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Sign In to Book</CardTitle>
              <CardDescription className="text-base mt-2">
                Please sign in to complete your booking and secure your amazing trip!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">With an account, you can:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Book trips and hotels
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    Secure payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Track your bookings
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/login', { state: { from: { pathname: '/book-now' } } })}
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/signup', { state: { from: { pathname: '/book-now' } } })}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Create Account
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account? Sign up for free!
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-white dark:text-black p-6">
            <h1 className="text-3xl font-bold">Complete Your Booking</h1>
            <p className="text-blue-100 dark:text-blue-900 mt-2">Final step to secure your amazing trip!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Left Panel - Trip & Hotel Details */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Trip Details</h2>
                <div className="flex items-center space-x-4">
                  {trip.imageUrl && (
                    <img 
                      src={trip.imageUrl} 
                      alt={trip.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{trip.title}</h3>
                    <p className="text-gray-600">{trip.location}</p>
                    <p className="text-blue-600 font-semibold">${trip.price}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Hotel Details</h2>
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{hotel.name}</h3>
                    <p className="text-gray-600">{hotel.location}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-blue-600 font-semibold">${hotel.price}</p>
                      {hotel.rating && (
                        <span className="text-yellow-500">★ {hotel.rating}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Cost Breakdown</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trip Cost:</span>
                    <span>${trip.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hotel Cost:</span>
                    <span>${hotel.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span>${bookingDetails.transport === 'flight' ? 300 : bookingDetails.transport === 'train' ? 100 : bookingDetails.transport === 'bus' ? 50 : 150}</span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${calculateTotalCost()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Booking Form */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Booking Details</h2>
              
              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={bookingDetails.customerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={bookingDetails.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingDetails.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Preference *
                  </label>
                  <select
                    name="transport"
                    value={bookingDetails.transport}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="flight">Flight ($300)</option>
                    <option value="train">Train ($100)</option>
                    <option value="bus">Bus ($50)</option>
                    <option value="car">Car ($150)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      name="checkIn"
                      value={bookingDetails.checkIn}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      name="checkOut"
                      value={bookingDetails.checkOut}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests *
                  </label>
                  <select
                    name="guests"
                    value={bookingDetails.guests}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={confirming}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-white dark:text-black py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-500 dark:hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {confirming ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Confirming Booking...
                    </div>
                  ) : (
                    `Confirm Booking - $${calculateTotalCost()}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
