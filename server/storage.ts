import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  users, trips, hotels, bookings, reviews,
  type User, type InsertUser,
  type Trip, type InsertTrip,
  type Hotel, type InsertHotel,
  type Booking, type InsertBooking,
  type Review, type InsertReview
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trip methods
  getAllTrips(): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<boolean>;
  
  // Hotel methods
  getAllHotels(): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<boolean>;
  
  // Booking methods
  getAllBookings(): Promise<Booking[]>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  
  // Review methods
  getReviews(type?: 'trip' | 'hotel', itemId?: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getUserReviews(userId: string): Promise<Review[]>;
  getItemReviews(type: 'trip' | 'hotel', itemId: string): Promise<Review[]>;
  
  // Analytics methods
  getAnalytics(): Promise<{
    totalTrips: number;
    totalHotels: number;
    totalBookings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Trip methods
  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(trips).orderBy(desc(trips.createdAt));
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
    return result[0];
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const result = await db.insert(trips).values(trip).returning();
    return result[0];
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const result = await db.update(trips).set(trip).where(eq(trips.id, id)).returning();
    return result[0];
  }

  async deleteTrip(id: number): Promise<boolean> {
    const result = await db.delete(trips).where(eq(trips.id, id)).returning();
    return result.length > 0;
  }

  // Hotel methods
  async getAllHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    return result[0];
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const result = await db.insert(hotels).values(hotel).returning();
    return result[0];
  }

  async updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const result = await db.update(hotels).set(hotel).where(eq(hotels.id, id)).returning();
    return result[0];
  }

  async deleteHotel(id: number): Promise<boolean> {
    const result = await db.delete(hotels).where(eq(hotels.id, id)).returning();
    return result.length > 0;
  }



  // Booking methods
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.bookingDate));
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.bookingDate));
  }

  async getUserBookingsWithDetails(userId: number): Promise<(Booking & { trip?: Trip; hotel?: Hotel })[]> {
    const userBookings = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      tripId: bookings.tripId,
      hotelId: bookings.hotelId,
      type: bookings.type,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
      bookingDate: bookings.bookingDate,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      tripTitle: trips.title,
      tripLocation: trips.location,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
    })
    .from(bookings)
    .leftJoin(trips, eq(bookings.tripId, trips.id))
    .leftJoin(hotels, eq(bookings.hotelId, hotels.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.bookingDate));

    return userBookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      tripId: booking.tripId,
      hotelId: booking.hotelId,
      type: booking.type,
      status: booking.status,
      totalPrice: booking.totalPrice,
      bookingDate: booking.bookingDate,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      trip: booking.tripId ? {
        id: booking.tripId,
        title: booking.tripTitle!,
        location: booking.tripLocation!,
        description: null,
        price: "0",
        imageUrl: null,
        duration: null,
        createdAt: null,
      } : undefined,
      hotel: booking.hotelId ? {
        id: booking.hotelId,
        name: booking.hotelName!,
        location: booking.hotelLocation!,
        description: null,
        price: "0",
        imageUrl: null,
        rating: null,
        amenities: null,
        createdAt: null,
      } : undefined,
    }));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  // Update booking status
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Review methods
  async getReviews(type?: 'trip' | 'hotel', itemId?: string): Promise<Review[]> {
    if (type && itemId) {
      if (type === 'trip') {
        return await db.select().from(reviews)
          .where(eq(reviews.tripId, itemId))
          .orderBy(desc(reviews.createdAt));
      } else {
        return await db.select().from(reviews)
          .where(eq(reviews.hotelId, itemId))
          .orderBy(desc(reviews.createdAt));
      }
    } else if (type) {
      return await db.select().from(reviews)
        .where(eq(reviews.type, type))
        .orderBy(desc(reviews.createdAt));
    }
    
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const reviewId = Math.random().toString(36).substring(2, 15);
    const result = await db.insert(reviews).values({
      ...review,
      id: reviewId
    }).returning();
    return result[0];
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getItemReviews(type: 'trip' | 'hotel', itemId: string): Promise<Review[]> {
    if (type === 'trip') {
      return await db.select().from(reviews)
        .where(eq(reviews.tripId, itemId))
        .orderBy(desc(reviews.createdAt));
    } else {
      return await db.select().from(reviews)
        .where(eq(reviews.hotelId, itemId))
        .orderBy(desc(reviews.createdAt));
    }
  }

  // Analytics methods
  async getAnalytics(): Promise<{
    totalTrips: number;
    totalHotels: number;
    totalBookings: number;
  }> {
    const [tripsResult, hotelsResult, bookingsResult] = await Promise.all([
      db.select().from(trips),
      db.select().from(hotels),
      db.select().from(bookings)
    ]);

    return {
      totalTrips: tripsResult.length,
      totalHotels: hotelsResult.length,
      totalBookings: bookingsResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
