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
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  duration: integer("duration"), // in days
  createdAt: timestamp("created_at").defaultNow(),
});

// Hotels table
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // per night
  imageUrl: text("image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }), // 0.0 to 5.0
  amenities: text("amenities").array(), // array of amenities
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  hotelId: integer("hotel_id").references(() => hotels.id),
  type: text("type").notNull(), // "trip" or "hotel"
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "cancelled"
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  bookingDate: timestamp("booking_date").defaultNow(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tripId: text("trip_id").references(() => trips.id),
  hotelId: text("hotel_id").references(() => hotels.id),
  bookingId: text("booking_id").references(() => bookings.id),
  type: text("type").notNull(), // "trip" or "hotel"
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  comment: text("comment").notNull(),
  isVerified: boolean("is_verified").default(false), // true if user actually booked
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
  bookingDate: true,
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

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

// Currency conversion schema
export const currencyConversionSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3), // Currency code like "USD"
  to: z.string().length(3), // Currency code like "EUR"
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
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CurrencyConversionRequest = z.infer<typeof currencyConversionSchema>;
