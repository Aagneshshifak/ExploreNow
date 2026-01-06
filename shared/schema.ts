import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  createdAt: timestamp("createdAt").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  duration: integer("duration"), // in days
  tags: text("tags").array(),
  includes: text("includes").array(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Hotels table
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // per night
  imageUrl: text("imageUrl"),
  rating: decimal("rating", { precision: 2, scale: 1 }), // 0.0 to 5.0
  tags: text("tags").array(),
  includes: text("includes").array(),
  amenities: text("amenities").array(), // array of amenities
  createdAt: timestamp("createdAt").defaultNow(),
});

// Bookings table - Updated for Phase 1 (matching actual database structure)
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey(),
  userId: integer("userId").notNull(),
  tripId: varchar("tripId"),
  hotelId: varchar("hotelId"),
  type: varchar("type").notNull(),
  customerName: varchar("customerName").notNull(),
  customerEmail: varchar("customerEmail").notNull(),
  customerPhone: varchar("customerPhone").notNull(),
  transportMode: varchar("transportMode").notNull(),
  checkIn: date("checkIn").notNull(),
  checkOut: date("checkOut").notNull(),
  guests: integer("guests").notNull(),
  amount: numeric("amount").notNull(),
  status: varchar("status").default("confirmed"),
  createdAt: timestamp("createdAt").defaultNow(),
  specialRequests: varchar("specialRequests"),
  emergencyContact: varchar("emergencyContact"),
  emergencyPhone: varchar("emergencyPhone"),
  transportDetails: varchar("transportDetails"),
  currency: varchar("currency"),
});

// Payments table - Cleaned up
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: varchar("booking_id").notNull(), // Changed to varchar to match booking IDs
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull(),
  cardHolderName: text("card_holder_name").notNull(),
  cardLastFour: text("card_last_four").notNull(),
  cardType: text("card_type").notNull(), // Added card_type field
  expiryMonth: text("expiry_month").notNull(), // Card expiry month
  expiryYear: text("expiry_year").notNull(), // Card expiry year
  status: text("status").notNull().default("completed"),
  transactionId: text("transaction_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table - Cleaned up
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  hotelId: integer("hotel_id").references(() => hotels.id),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  isVerified: true,
});



// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(), // Allow role to be sent but make it optional
});

// Currency conversion schema
export const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3), // Currency code like "USD"
  to: z.string().length(3), // Currency code like "EUR"
});

// Enhanced booking form schema
export const bookingFormSchema = insertBookingSchema.extend({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest is required"),
  emergencyContact: z.string().min(2, "Emergency contact name is required"),
  emergencyPhone: z.string().min(10, "Emergency phone number is required"),
  transportMode: z.enum(["flight", "bus", "train", "car", "other"]).optional(),
  specialRequests: z.string().optional(),
});

// Payment form schema
export const paymentFormSchema = z.object({
  cardHolderName: z.string().min(2, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(19, "Invalid card number"),
  expiryMonth: z.string().min(2, "Expiry month is required"),
  expiryYear: z.string().min(4, "Expiry year is required"),
  cvv: z.string().min(3, "CVV must be 3-4 digits").max(4, "CVV must be 3-4 digits"),
  billingAddress: z.string().min(5, "Billing address is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

// Trip filtering schemas
export const tripFilterSchema = z.object({
  country: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minDuration: z.number().min(1).optional(),
  maxDuration: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

// Budget filtering schema
export const budgetFilterSchema = z.object({
  budget: z.number().min(0, "Budget must be positive"),
  currency: z.string().length(3).default("USD"),
});

// AI recommendation schema
export const aiRecommendationSchema = z.object({
  preferences: z.array(z.enum(["beach", "adventure", "culture", "food", "nature", "city", "mountain", "desert"])),
  budget: z.number().min(0).optional(),
  duration: z.number().min(1).optional(),
  language: z.enum(["en", "fr", "de", "hi", "es", "ru", "zh", "ar", "pt"]).default("en"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CurrencyConversionRequest = z.infer<typeof currencyConversionSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type TripFilterData = z.infer<typeof tripFilterSchema>;
export type BudgetFilterData = z.infer<typeof budgetFilterSchema>;
export type AIRecommendationData = z.infer<typeof aiRecommendationSchema>;
