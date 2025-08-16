import { eq, desc, and, lte, gte, inArray, ilike, asc } from "drizzle-orm";
import { db } from "./db";
import { 
  users, trips, hotels, bookings, reviews, userPreferences, translations, tripSuggestions, payments,
  type User, type InsertUser,
  type Trip, type InsertTrip,
  type Hotel, type InsertHotel,
  type Booking, type InsertBooking,
  type Review, type InsertReview,
  type Payment, type InsertPayment,
  type UserPreferences, type InsertUserPreferences,
  type Translation, type InsertTranslation,
  type TripSuggestion, type InsertTripSuggestion,
  type TripFilterData, type BudgetFilterData, type AIRecommendationData
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
  getBooking(id: string): Promise<Booking | undefined>;
  
  // Review methods
  getReviews(type?: 'trip' | 'hotel', itemId?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getUserReviews(userId: number): Promise<Review[]>;
  getItemReviews(type: 'trip' | 'hotel', itemId: number): Promise<Review[]>;
  
  // Analytics methods
  getAnalytics(): Promise<{
    totalTrips: number;
    totalHotels: number;
    totalBookings: number;
  }>;

  // User preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;

  // Trip filtering methods
  getFilteredTrips(filters: TripFilterData): Promise<Trip[]>;
  getTripsByBudget(budget: number, currency?: string): Promise<Trip[]>;
  getTripsByTags(tags: string[]): Promise<Trip[]>;
  
  // AI recommendation methods
  getRecommendedTrips(data: AIRecommendationData): Promise<Trip[]>;
  createTripSuggestion(suggestion: InsertTripSuggestion): Promise<TripSuggestion>;
  getUserSuggestions(userId: number): Promise<TripSuggestion[]>;

  // Translation methods
  getTranslations(language: string, category?: string): Promise<Translation[]>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByBookingId(bookingId: number): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
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

  async getHotelsByLocation(location: string): Promise<Hotel[]> {
    return await db.select().from(hotels)
      .where(ilike(hotels.location, `%${location}%`))
      .orderBy(desc(hotels.rating), asc(hotels.price));
  }



  // Booking methods
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getUserBookingsWithDetails(userId: number): Promise<(Booking & { trip?: Trip; hotel?: Hotel })[]> {
    const userBookings = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      tripId: bookings.tripId,
      hotelId: bookings.hotelId,
      type: bookings.type,
      status: bookings.status,
      amount: bookings.amount,
      currency: bookings.currency,
      createdAt: bookings.createdAt,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      guests: bookings.guests,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      customerPhone: bookings.customerPhone,
      specialRequests: bookings.specialRequests,
      emergencyContact: bookings.emergencyContact,
      emergencyPhone: bookings.emergencyPhone,
      transportMode: bookings.transportMode,
      transportDetails: bookings.transportDetails,
      tripTitle: trips.title,
      tripLocation: trips.location,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
    })
    .from(bookings)
    .leftJoin(trips, eq(bookings.tripId, trips.id))
    .leftJoin(hotels, eq(bookings.hotelId, hotels.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

    return userBookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      tripId: booking.tripId,
      hotelId: booking.hotelId,
      type: booking.type,
      status: booking.status,
      amount: booking.amount,
      currency: booking.currency,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      specialRequests: booking.specialRequests,
      emergencyContact: booking.emergencyContact,
      emergencyPhone: booking.emergencyPhone,
      transportMode: booking.transportMode,
      transportDetails: booking.transportDetails,
      createdAt: booking.createdAt,
      trip: booking.tripId ? {
        id: booking.tripId,
        title: booking.tripTitle!,
        location: booking.tripLocation!,
        description: null,
        price: "0",
        imageUrl: null,
        duration: null,
        tags: null,
        includes: null,
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
        tags: null,
        includes: null,
        amenities: null,
        createdAt: null,
      } : undefined,
    }));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Generate a UUID for the booking
    const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bookingWithId = { ...booking, id };
    const result = await db.insert(bookings).values(bookingWithId).returning();
    return result[0];
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  // Update booking status
  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Review methods
  async getReviews(type?: 'trip' | 'hotel', itemId?: number): Promise<Review[]> {
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
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getItemReviews(type: 'trip' | 'hotel', itemId: number): Promise<Review[]> {
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

  // User preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const result = await db.insert(userPreferences).values(preferences).returning();
    return result[0];
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const result = await db.update(userPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result[0];
  }

  // Trip filtering methods
  async getFilteredTrips(filters: TripFilterData): Promise<Trip[]> {
    let query = db.select().from(trips);
    
    const conditions = [];
    
    if (filters.country) {
      conditions.push(eq(trips.location, filters.country));
    }
    
    if (filters.minPrice !== undefined) {
      conditions.push(gte(trips.price, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(trips.price, filters.maxPrice.toString()));
    }
    
    if (filters.minDuration !== undefined) {
      conditions.push(gte(trips.duration, filters.minDuration));
    }
    
    if (filters.maxDuration !== undefined) {
      conditions.push(lte(trips.duration, filters.maxDuration));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getTripsByBudget(budget: number, currency: string = "USD"): Promise<Trip[]> {
    // For now, assume all prices are in USD, future enhancement would convert currencies
    return await db.select().from(trips)
      .where(lte(trips.price, budget.toString()))
      .orderBy(trips.price);
  }

  async getTripsByTags(tags: string[]): Promise<Trip[]> {
    // Using PostgreSQL array overlap operator - simplified version
    return await db.select().from(trips);
  }

  // AI recommendation methods
  async getRecommendedTrips(data: AIRecommendationData): Promise<Trip[]> {
    let query = db.select().from(trips);
    const conditions = [];

    // Filter by budget if provided
    if (data.budget !== undefined) {
      conditions.push(lte(trips.price, data.budget.toString()));
    }

    // Filter by duration if provided
    if (data.duration !== undefined) {
      conditions.push(lte(trips.duration, data.duration));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allTrips = await query;
    
    // Simple recommendation logic: filter trips that have tags matching user preferences
    const recommendedTrips = allTrips.filter(trip => {
      if (!trip.tags || trip.tags.length === 0) return false;
      return data.preferences.some(pref => trip.tags!.includes(pref));
    });

    return recommendedTrips.length > 0 ? recommendedTrips : allTrips.slice(0, 5);
  }

  async createTripSuggestion(suggestion: InsertTripSuggestion): Promise<TripSuggestion> {
    const result = await db.insert(tripSuggestions).values(suggestion).returning();
    return result[0];
  }

  async getUserSuggestions(userId: number): Promise<TripSuggestion[]> {
    return await db.select().from(tripSuggestions)
      .where(eq(tripSuggestions.userId, userId))
      .orderBy(desc(tripSuggestions.createdAt));
  }

  // Translation methods
  async getTranslations(language: string, category?: string): Promise<Translation[]> {
    let query = db.select().from(translations).where(eq(translations.language, language));
    
    if (category) {
      query = query.where(and(eq(translations.language, language), eq(translations.category, category)));
    }
    
    return await query;
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const result = await db.insert(translations).values(translation).returning();
    return result[0];
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByBookingId(bookingId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }
}

export const storage = new DatabaseStorage();
