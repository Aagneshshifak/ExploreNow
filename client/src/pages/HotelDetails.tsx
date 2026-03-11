import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/hotels')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hotels
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Hotel Booking Page</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Hotel ID: {id}
          </p>
          <p className="text-muted-foreground">
            The comprehensive hotel booking interface with customer forms, room selection, 
            payment options, and real-time pricing is being finalized. This page will include:
          </p>
          <div className="mt-6 max-w-md mx-auto text-left space-y-2">
            <p>✓ Hotel information and amenities display</p>
            <p>✓ Guest information form</p>
            <p>✓ Check-in/check-out date selection</p>
            <p>✓ Room type selection (Standard, Deluxe, Suite)</p>
            <p>✓ Payment method options</p>
            <p>✓ Real-time price calculation</p>
            <p>✓ Complete booking submission</p>
          </div>
          <div className="mt-8">
            <Button onClick={() => navigate('/hotels')} size="lg">
              Browse All Hotels
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}