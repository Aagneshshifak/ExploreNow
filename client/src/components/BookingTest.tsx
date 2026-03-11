import React, { useState } from 'react';
import { executeMutation, CREATE_BOOKING_MUTATION } from '../lib/graphql';

interface BookingFormData {
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
}

const BookingTest: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    tripId: '5', // Maldives Overwater Villa
    hotelId: '2', // Ocean Breeze Resort
    customerName: '',
    email: '',
    phone: '',
    transport: 'flight',
    checkIn: '',
    checkOut: '',
    guests: 1,
    totalCost: 4489.99
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await executeMutation(CREATE_BOOKING_MUTATION, formData);
      
      if (error) {
        setResult({ success: false, message: (error as any)?.message || 'GraphQL error occurred' });
      } else {
        setResult(data.createBooking);
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' || name === 'totalCost' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">GraphQL Booking Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Trip ID</label>
            <input
              type="text"
              name="tripId"
              value={formData.tripId}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hotel ID</label>
            <input
              type="text"
              name="hotelId"
              value={formData.hotelId}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Transport</label>
            <select
              name="transport"
              value={formData.transport}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="flight">Flight</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
              <option value="car">Car</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Guests</label>
            <input
              type="number"
              name="guests"
              value={formData.guests}
              onChange={handleInputChange}
              min="1"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
            <input
              type="date"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
            <input
              type="date"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Cost</label>
          <input
            type="number"
            name="totalCost"
            value={formData.totalCost}
            onChange={handleInputChange}
            step="0.01"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <h3 className="font-semibold">{result.success ? 'Booking Created!' : 'Booking Failed'}</h3>
          <p className="mt-2">{result.message}</p>
          {result.booking && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium">Booking Details:</h4>
              <p>ID: {result.booking.id}</p>
              <p>Status: {result.booking.status}</p>
              <p>Payment Status: {result.booking.paymentStatus}</p>
              <p>Customer: {result.booking.customerName}</p>
              <p>Total Cost: ${result.booking.totalCost}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingTest;
