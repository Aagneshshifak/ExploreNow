import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
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

// Bookings table  
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  tripId: integer("tripId").references(() => trips.id),
  hotelId: integer("hotelId").references(() => hotels.id),
  transportType: text("transportType").notNull(), // "bus", "train", "flight"
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("createdAt").defaultNow(),
  // Additional fields for enhanced functionality
  customerName: text("customerName"),
  customerEmail: text("customerEmail"),
  customerPhone: text("customerPhone"),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  guests: integer("guests").default(1),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  hotelId: integer("hotel_id").references(() => hotels.id),
  bookingId: text("booking_id").references(() => bookings.id),
  type: text("type").notNull(), // "trip" or "hotel"
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  comment: text("comment").notNull(),
  isVerified: boolean("is_verified").default(false), // true if user actually booked
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences table for travel recommendations
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferences: text("preferences").array(), // ["beach", "adventure", "culture", "food", "nature"]
  budget: decimal("budget", { precision: 10, scale: 2 }),
  preferredCurrency: text("preferred_currency").default("USD"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Translations table for multi-language support
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(), // translation key like "welcome_message"
  language: text("language").notNull(), // "fr", "de", "hi", "es", "ru", "zh", "ar", "pt"
  value: text("value").notNull(), // translated text
  category: text("category").default("general"), // "trips", "hotels", "ui", "general"
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip suggestions table for AI recommendations
export const tripSuggestions = pgTable("trip_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  reason: text("reason"), // why this trip was suggested
  score: decimal("score", { precision: 3, scale: 2 }), // recommendation confidence 0.00-1.00
  preferences: text("preferences").array(), // preferences that matched
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

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  isVerified: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});

export const insertTripSuggestionSchema = createInsertSchema(tripSuggestions).omit({
  id: true,
  createdAt: true,
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
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
export type InsertTripSuggestion = z.infer<typeof insertTripSuggestionSchema>;
export type TripSuggestion = typeof tripSuggestions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CurrencyConversionRequest = z.infer<typeof currencyConversionSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type TripFilterData = z.infer<typeof tripFilterSchema>;
export type BudgetFilterData = z.infer<typeof budgetFilterSchema>;
export type AIRecommendationData = z.infer<typeof aiRecommendationSchema>;
