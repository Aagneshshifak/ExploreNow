import { prisma } from './prisma';
import type { User, Trip, Hotel, Booking } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class PrismaStorage {
  // User methods
  async createUser(userData: {
    name?: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    return await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Trip methods
  async createTrip(tripData: {
    title: string;
    location: string;
    description?: string;
    price: number;
    duration: number;
    tags?: string[];
    includes?: string[];
    imageUrl?: string;
  }): Promise<Trip> {
    return await prisma.trip.create({
      data: {
        ...tripData,
        tags: tripData.tags || [],
        includes: tripData.includes || [],
      },
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTripById(id: string): Promise<Trip | null> {
    return await prisma.trip.findUnique({
      where: { id },
    });
  }

  async updateTrip(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip | null> {
    try {
      return await prisma.trip.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async deleteTrip(id: string): Promise<boolean> {
    try {
      await prisma.trip.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Hotel methods
  async createHotel(hotelData: {
    name: string;
    location: string;
    description?: string;
    price: number;
    rating: number;
    tags?: string[];
    includes?: string[];
    amenities?: string[];
    imageUrl?: string;
  }): Promise<Hotel> {
    return await prisma.hotel.create({
      data: {
        ...hotelData,
        tags: hotelData.tags || [],
        includes: hotelData.includes || [],
        amenities: hotelData.amenities || [],
      },
    });
  }

  async getAllHotels(): Promise<Hotel[]> {
    return await prisma.hotel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHotelById(id: string): Promise<Hotel | null> {
    return await prisma.hotel.findUnique({
      where: { id },
    });
  }

  async updateHotel(id: string, data: Partial<Omit<Hotel, 'id' | 'createdAt'>>): Promise<Hotel | null> {
    try {
      return await prisma.hotel.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async deleteHotel(id: string): Promise<boolean> {
    try {
      await prisma.hotel.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Booking methods
  async createBooking(bookingData: {
    userId: string;
    tripId?: string;
    hotelId?: string;
    type: string;
    amount: number;
    status?: string;
    checkIn?: Date;
    checkOut?: Date;
  }): Promise<Booking> {
    return await prisma.booking.create({
      data: bookingData,
    });
  }

  async getAllBookings(): Promise<(Booking & { user: User; trip?: Trip; hotel?: Hotel })[]> {
    return await prisma.booking.findMany({
      include: {
        user: true,
        trip: true,
        hotel: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserBookingsWithDetails(userId: string): Promise<(Booking & { trip?: Trip; hotel?: Hotel })[]> {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        trip: true,
        hotel: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { id },
    });
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | null> {
    try {
      return await prisma.booking.update({
        where: { id },
        data: { status },
      });
    } catch {
      return null;
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    try {
      await prisma.booking.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Analytics methods
  async getAnalytics(): Promise<{
    totalUsers: number;
    totalTrips: number;
    totalHotels: number;
    totalBookings: number;
    totalRevenue: number;
  }> {
    const [users, trips, hotels, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.hotel.count(),
      prisma.booking.findMany(),
    ]);

    const totalRevenue = bookings
      .filter((b: Booking) => b.status === 'confirmed')
      .reduce((sum: number, booking: Booking) => sum + booking.amount, 0);

    return {
      totalUsers: users,
      totalTrips: trips,
      totalHotels: hotels,
      totalBookings: bookings.length,
      totalRevenue,
    };
  }
}

export const storage = new PrismaStorage();