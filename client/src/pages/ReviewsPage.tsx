import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Star, 
  User, 
  Calendar,
  CheckCircle,
  MapPin,
  ThumbsUp,
  MessageSquare,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { DashboardSidebar } from '@/components/DashboardSidebar';

interface Review {
  id: string;
  userId: string;
  tripId?: string;
  hotelId?: string;
  bookingId?: string;
  type: 'trip' | 'hotel';
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ReviewsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'trip' | 'hotel'>('all');
  const [newReview, setNewReview] = useState({
    type: 'trip' as 'trip' | 'hotel',
    tripId: '',
    hotelId: '',
    rating: 5,
    title: '',
    comment: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/reviews', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      const response = await fetch(`/api/reviews?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const result = await response.json();
      return result.data as Review[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Added",
        description: "Your review has been posted successfully!",
      });
      setShowCreateForm(false);
      setNewReview({
        type: 'trip',
        tripId: '',
        hotelId: '',
        rating: 5,
        title: '',
        comment: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!newReview.title || !newReview.comment) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newReview.type === 'trip' && !newReview.tripId) {
      toast({
        title: "Missing Trip",
        description: "Please select a trip to review.",
        variant: "destructive",
      });
      return;
    }

    if (newReview.type === 'hotel' && !newReview.hotelId) {
      toast({
        title: "Missing Hotel",
        description: "Please select a hotel to review.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(newReview);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews?.filter(review => 
    filterType === 'all' || review.type === filterType
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-full">
          <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <main className="flex-1 py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Travel Reviews - ExploreNow</title>
        <meta name="description" content="Read authentic travel reviews and share your experiences. Find verified reviews from real travelers for trips, hotels, and destinations on ExploreNow." />
        <meta name="keywords" content="travel reviews, trip reviews, hotel reviews, verified reviews, travel experiences, ExploreNow reviews" />
        <meta property="og:title" content="Travel Reviews - ExploreNow" />
        <meta property="og:description" content="Read authentic travel reviews and share your experiences with the travel community" />
        <link rel="canonical" href="https://explorenow.replit.app/reviews" />
      </Helmet>
      <div className="flex h-full">
        <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 py-16">
          <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            Travel Reviews
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Read authentic reviews from fellow travelers and share your own experiences
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="trip">Trip Reviews</SelectItem>
                <SelectItem value="hotel">Hotel Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {user && (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Write Review
            </Button>
          )}
        </motion.div>

        {/* Create Review Form */}
        {showCreateForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Write a Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Review Type</Label>
                    <Select 
                      value={newReview.type} 
                      onValueChange={(value: 'trip' | 'hotel') => 
                        setNewReview({ ...newReview, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trip">Trip Review</SelectItem>
                        <SelectItem value="hotel">Hotel Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Select 
                      value={newReview.rating.toString()} 
                      onValueChange={(value) => 
                        setNewReview({ ...newReview, rating: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            <div className="flex items-center space-x-2">
                              <span>{rating}</span>
                              {renderStars(rating)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newReview.type === 'trip' && (
                  <div>
                    <Label htmlFor="tripId">Trip ID (optional)</Label>
                    <Input
                      id="tripId"
                      value={newReview.tripId}
                      onChange={(e) => setNewReview({ ...newReview, tripId: e.target.value })}
                      placeholder="Enter trip ID if you booked through the platform"
                    />
                  </div>
                )}

                {newReview.type === 'hotel' && (
                  <div>
                    <Label htmlFor="hotelId">Hotel ID (optional)</Label>
                    <Input
                      id="hotelId"
                      value={newReview.hotelId}
                      onChange={(e) => setNewReview({ ...newReview, hotelId: e.target.value })}
                      placeholder="Enter hotel ID if you booked through the platform"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Review Title</Label>
                  <Input
                    id="title"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Summarize your experience in a few words"
                  />
                </div>

                <div>
                  <Label htmlFor="comment">Your Review</Label>
                  <Textarea
                    id="comment"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your detailed experience..."
                    rows={4}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {createMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Posting...
                      </>
                    ) : (
                      'Post Review'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground">
                {filterType === 'all' 
                  ? 'Be the first to share your travel experience!'
                  : `No ${filterType} reviews available yet.`
                }
              </p>
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">Anonymous User</h4>
                            {review.isVerified && (
                              <Badge variant="secondary" className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Verified</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <Badge variant={review.type === 'trip' ? 'default' : 'secondary'}>
                          {review.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}