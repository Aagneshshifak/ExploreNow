import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, numeric, index } from "drizzle-orm/pg-core";
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
export const trips = pgTable("trips",{
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
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Bookmarks table - New for protected routes feature
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tripId: integer("tripId").references(() => trips.id, { onDelete: "cascade" }),
  hotelId: integer("hotelId").references(() => hotels.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// User Preferences table - New for protected routes feature
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  language: varchar("language", { length: 5 }).default("en"),
  theme: varchar("theme", { length: 10 }).default("light"),
  notificationsEnabled: boolean("notificationsEnabled").default(true),
  emailNotifications: boolean("emailNotifications").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
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

// Tourist Spots table - Tourist & Crowd Map feature
export const touristSpots = pgTable("tourist_spots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  category: text("category").notNull(), // museum, beach, monument, park, religious_site, market, viewpoint
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  openingHours: text("opening_hours"), // e.g., "9:00 AM - 6:00 PM" or "24/7" or "Sunrise to Sunset"
  bestTimeToVisit: text("best_time_to_visit"), // e.g., "Early morning (6-9 AM)" or "Weekdays"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  countryCity: index("tourist_spots_country_city_idx").on(table.country, table.city),
}));

// Historical Crowd Data Points table
export const crowdDataPoints = pgTable("crowd_data_points", {
  id: serial("id").primaryKey(),
  spotId: integer("spot_id").notNull().references(() => touristSpots.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull(),
  crowdLevel: text("crowd_level").notNull(), // low, medium, high
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  month: integer("month").notNull(), // 0-11
  season: text("season").notNull(), // spring, summer, fall, winter
  isWeekend: boolean("is_weekend").notNull(),
  isHoliday: boolean("is_holiday").notNull(),
  weatherCondition: text("weather_condition"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  source: text("source").notNull(), // user_report, prediction, manual
}, (table) => ({
  spotIdTimestamp: index("crowd_data_points_spot_id_timestamp_idx").on(table.spotId, table.timestamp),
}));

// User Crowd Reports table
export const crowdReports = pgTable("crowd_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  spotId: integer("spot_id").notNull().references(() => touristSpots.id, { onDelete: "cascade" }),
  crowdLevel: text("crowd_level").notNull(), // low, medium, high
  reportedAt: timestamp("reported_at").defaultNow(),
  userLatitude: decimal("user_latitude", { precision: 10, scale: 7 }).notNull(),
  userLongitude: decimal("user_longitude", { precision: 10, scale: 7 }).notNull(),
  validated: boolean("validated").notNull().default(false),
});

// Prediction Cache table
export const predictionCache = pgTable("prediction_cache", {
  id: serial("id").primaryKey(),
  spotId: integer("spot_id").notNull().references(() => touristSpots.id, { onDelete: "cascade" }),
  predictedFor: timestamp("predicted_for").notNull(),
  crowdLevel: text("crowd_level").notNull(), // low, medium, high
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  spotIdPredictedFor: index("prediction_cache_spot_id_predicted_for_idx").on(table.spotId, table.predictedFor),
}));

// API Cache table
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  apiName: text("api_name").notNull(), // ipapi, openweather, nager
  response: text("response").notNull(), // JSON stringified response
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
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
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTouristSpotSchema = createInsertSchema(touristSpots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => data.name.trim().length > 0,
  { message: "Name cannot be empty or whitespace only", path: ["name"] }
).refine(
  (data) => data.country.trim().length > 0,
  { message: "Country cannot be empty or whitespace only", path: ["country"] }
).refine(
  (data) => data.city.trim().length > 0,
  { message: "City cannot be empty or whitespace only", path: ["city"] }
).refine(
  (data) => data.description.trim().length > 0,
  { message: "Description cannot be empty or whitespace only", path: ["description"] }
).refine(
  (data) => {
    const lat = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
    return !isNaN(lat) && lat >= -90 && lat <= 90;
  },
  { message: "Latitude must be between -90 and 90", path: ["latitude"] }
).refine(
  (data) => {
    const lon = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude;
    return !isNaN(lon) && lon >= -180 && lon <= 180;
  },
  { message: "Longitude must be between -180 and 180", path: ["longitude"] }
).refine(
  (data) => categorySchema.safeParse(data.category).success,
  { message: "Category must be one of: museum, beach, monument, park, religious_site, market, viewpoint", path: ["category"] }
);

export const insertCrowdDataPointSchema = createInsertSchema(crowdDataPoints).omit({
  id: true,
});

export const insertCrowdReportSchema = createInsertSchema(crowdReports).omit({
  id: true,
  reportedAt: true,
});

export const insertPredictionCacheSchema = createInsertSchema(predictionCache).omit({
  id: true,
  generatedAt: true,
});

export const insertApiCacheSchema = createInsertSchema(apiCache).omit({
  id: true,
  cachedAt: true,
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

// Tourist & Crowd Map schemas
export const categorySchema = z.enum(["museum", "beach", "monument", "park", "religious_site", "market", "viewpoint"]);

export const crowdLevelSchema = z.enum(["low", "medium", "high"]);

export const seasonSchema = z.enum(["spring", "summer", "fall", "winter"]);

export const dataSourceSchema = z.enum(["user_report", "prediction", "manual"]);

export const apiNameSchema = z.enum(["ipapi", "openweather", "nager"]);

export const touristSpotFilterSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  category: categorySchema.optional(),
  crowdLevel: crowdLevelSchema.optional(),
});

export const crowdReportSubmissionSchema = z.object({
  spotId: z.number().int().positive(),
  crowdLevel: crowdLevelSchema,
  userLatitude: z.number().min(-90).max(90),
  userLongitude: z.number().min(-180).max(180),
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
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CurrencyConversionRequest = z.infer<typeof currencyConversionSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type TripFilterData = z.infer<typeof tripFilterSchema>;
export type BudgetFilterData = z.infer<typeof budgetFilterSchema>;
export type AIRecommendationData = z.infer<typeof aiRecommendationSchema>;

// Tourist & Crowd Map types
export type InsertTouristSpot = z.infer<typeof insertTouristSpotSchema>;
export type TouristSpot = typeof touristSpots.$inferSelect;
export type InsertCrowdDataPoint = z.infer<typeof insertCrowdDataPointSchema>;
export type CrowdDataPoint = typeof crowdDataPoints.$inferSelect;
export type InsertCrowdReport = z.infer<typeof insertCrowdReportSchema>;
export type CrowdReport = typeof crowdReports.$inferSelect;
export type InsertPredictionCache = z.infer<typeof insertPredictionCacheSchema>;
export type PredictionCache = typeof predictionCache.$inferSelect;
export type InsertApiCache = z.infer<typeof insertApiCacheSchema>;
export type ApiCache = typeof apiCache.$inferSelect;

export type Category = z.infer<typeof categorySchema>;
export type CrowdLevel = z.infer<typeof crowdLevelSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type ApiName = z.infer<typeof apiNameSchema>;
export type TouristSpotFilterData = z.infer<typeof touristSpotFilterSchema>;
export type CrowdReportSubmissionData = z.infer<typeof crowdReportSubmissionSchema>;

// Augment Express User globally to resolve TypeScript errors across the backend
declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      password?: string;
      role?: string;
    }
  }
}

