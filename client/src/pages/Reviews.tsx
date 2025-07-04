import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star,
  ThumbsUp,
  Filter,
  Send,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  hotelName: string;
  rating: number;
  reviewText: string;
  dateStayed: Date;
  datePosted: Date;
  helpful: number;
  verified: boolean;
}

interface UserBooking {
  id: string;
  hotelName: string;
  location: string;
  checkOut: Date;
  hasReview: boolean;
}

const Reviews = () => {
  const [newReview, setNewReview] = useState({
    booking: '',
    rating: 0,
    reviewText: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');

  const userBookings: UserBooking[] = [
    {
      id: 'BKG-001',
      hotelName: 'Taj Lake Palace',
      location: 'Udaipur, Rajasthan',
      checkOut: new Date('2024-02-20'),
      hasReview: false
    },
    {
      id: 'BKG-002',
      hotelName: 'Backwater Retreat',
      location: 'Alleppey, Kerala',
      checkOut: new Date('2024-01-15'),
      hasReview: true
    }
  ];

  const existingReviews: Review[] = [
    {
      id: 'REV-001',
      userName: 'Priya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616c0763c9f?w=100',
      hotelName: 'Taj Lake Palace',
      rating: 5,
      reviewText: 'Absolutely magical experience! The lake views from our room were breathtaking. The heritage architecture combined with modern luxury creates an unforgettable atmosphere. The staff attention to detail was exceptional, and the boat ride to the hotel felt like entering a fairy tale. The spa treatments were divine, and every meal was a culinary masterpiece. This place truly lives up to its reputation as one of the world\'s most romantic hotels.',
      dateStayed: new Date('2024-02-10'),
      datePosted: new Date('2024-02-15'),
      helpful: 24,
      verified: true
    },
    {
      id: 'REV-002',
      userName: 'Rajesh Kumar',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      hotelName: 'Backwater Retreat',
      rating: 4,
      reviewText: 'A peaceful escape into nature\'s embrace. The houseboat experience was unique and the traditional Kerala cuisine was outstanding. The sunset views over the backwaters were spectacular. Staff was friendly and helpful throughout our stay. Only minor issue was the wifi connectivity, but honestly, it was nice to disconnect for a while. Would definitely recommend for anyone seeking tranquility.',
      dateStayed: new Date('2024-02-05'),
      datePosted: new Date('2024-02-08'),
      helpful: 18,
      verified: true
    },
    {
      id: 'REV-003',
      userName: 'Anita Reddy',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      hotelName: 'The Oberoi Amarvilas',
      rating: 5,
      reviewText: 'Waking up to the view of Taj Mahal from our room was a dream come true! The hotel perfectly balances luxury with the spiritual essence of Agra. Every detail is meticulously crafted - from the Mughal-inspired architecture to the exquisite dining experiences. The pool area with its Taj Mahal backdrop is simply stunning. The concierge helped us plan the perfect itinerary. An experience we\'ll treasure forever.',
      dateStayed: new Date('2024-01-28'),
      datePosted: new Date('2024-02-02'),
      helpful: 31,
      verified: true
    },
    {
      id: 'REV-004',
      userName: 'Vikram Singh',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      hotelName: 'Goa Beach Resort',
      rating: 4,
      reviewText: 'Great beachfront location with direct access to the pristine beach. The rooms were spacious and well-maintained with beautiful ocean views. The infinity pool overlooking the Arabian Sea was a highlight. Beach service was excellent with comfortable loungers and quick food delivery. The seafood restaurant served some of the freshest catch we\'ve had. Perfect for a relaxing beach vacation.',
      dateStayed: new Date('2024-01-20'),
      datePosted: new Date('2024-01-25'),
      helpful: 15,
      verified: true
    },
    {
      id: 'REV-005',
      userName: 'Meera Patel',
      hotelName: 'Himalayan Lodge',
      rating: 3,
      reviewText: 'Decent mountain retreat with good views of the valley. The location is peaceful and great for nature lovers. Rooms were clean but could use some updating. The restaurant had limited options but the local Himachali dishes were tasty. Staff was courteous. The trek arrangements were well organized. Good value for money, though don\'t expect luxury amenities.',
      dateStayed: new Date('2024-01-12'),
      datePosted: new Date('2024-01-18'),
      helpful: 8,
      verified: false
    }
  ];

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-5 h-5 ${
          i < rating 
            ? 'text-yellow-500 fill-current' 
            : interactive 
              ? 'text-gray-300 hover:text-yellow-400 cursor-pointer' 
              : 'text-gray-300'
        } ${interactive ? 'transition-colors' : ''}`}
        onClick={() => interactive && onRatingChange && onRatingChange(i + 1)}
      />
    ));
  };

  const handleSubmitReview = () => {
    if (newReview.booking && newReview.rating > 0 && newReview.reviewText.trim()) {
      setSubmitted(true);
      // Reset form after successful submission
      setTimeout(() => {
        setNewReview({ booking: '', rating: 0, reviewText: '' });
        setSubmitted(false);
      }, 2000);
    }
  };

  const filteredReviews = existingReviews
    .filter(review => filterRating === 'all' || review.rating.toString() === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return b.datePosted.getTime() - a.datePosted.getTime();
      }
    });

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-r from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Reviews & Experiences
          </h1>
          <p className="text-xl text-muted-foreground">
            Share your travel experiences and read authentic reviews from fellow travelers
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Review Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Leave a Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      Review Submitted!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Thank you for sharing your experience. Your review will be published shortly.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select Your Booking
                      </label>
                      <Select value={newReview.booking} onValueChange={(value) => 
                        setNewReview({...newReview, booking: value})
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a recent stay" />
                        </SelectTrigger>
                        <SelectContent>
                          {userBookings
                            .filter(booking => !booking.hasReview)
                            .map((booking) => (
                            <SelectItem key={booking.id} value={booking.id}>
                              {booking.hotelName} - {format(booking.checkOut, "MMM yyyy")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Your Rating
                      </label>
                      <div className="flex space-x-1">
                        {renderStars(newReview.rating, true, (rating) => 
                          setNewReview({...newReview, rating})
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Share Your Experience
                      </label>
                      <Textarea
                        value={newReview.reviewText}
                        onChange={(e) => setNewReview({...newReview, reviewText: e.target.value})}
                        placeholder="Tell other travelers about your stay. What made it special? What could be improved?"
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button 
                      onClick={handleSubmitReview}
                      disabled={!newReview.booking || newReview.rating === 0 || !newReview.reviewText.trim()}
                      className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating-high">Highest Rated</SelectItem>
                  <SelectItem value="rating-low">Lowest Rated</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reviews */}
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="shadow-soft hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.userAvatar} alt={review.userName} />
                        <AvatarFallback>
                          {review.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{review.userName}</h3>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified Stay
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{review.hotelName}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Stayed {format(review.dateStayed, "MMM yyyy")}
                            </p>
                          </div>
                        </div>

                        <p className="text-foreground leading-relaxed mb-4">
                          {review.reviewText}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Helpful ({review.helpful})
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Posted {format(review.datePosted, "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <Card className="text-center p-12">
                <CardContent className="p-0">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more reviews.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;