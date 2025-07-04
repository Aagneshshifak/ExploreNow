import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  userType: text("user_type").notNull().default("user"), // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hotels table
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  address: text("address"),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  amenities: json("amenities").default([]),
  images: json("images").default([]),
  status: text("status").notNull().default("active"), // "active", "inactive", "maintenance"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip packages table
export const tripPackages = pgTable("trip_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  duration: text("duration").notNull(), // e.g., "5 days 4 nights"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  category: json("category").default([]), // e.g., ["adventure", "cultural", "beach"]
  inclusions: json("inclusions").default([]), // e.g., ["accommodation", "meals", "transport"]
  images: json("images").default([]),
  status: text("status").notNull().default("active"),
  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hotelId: integer("hotel_id"),
  tripPackageId: integer("trip_package_id"),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  guests: integer("guests").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "cancelled", "completed"
  bookingDate: timestamp("booking_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hotelId: integer("hotel_id"),
  tripPackageId: integer("trip_package_id"),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  dateStayed: timestamp("date_stayed"),
  helpful: integer("helpful").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel documents table
export const travelDocuments = pgTable("travel_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  documentType: text("document_type"), // "passport", "visa", "id", "insurance", etc.
  uploadDate: timestamp("upload_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  travelDocuments: many(travelDocuments),
}));

export const hotelsRelations = relations(hotels, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const tripPackagesRelations = relations(tripPackages, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  hotel: one(hotels, {
    fields: [bookings.hotelId],
    references: [hotels.id],
  }),
  tripPackage: one(tripPackages, {
    fields: [bookings.tripPackageId],
    references: [tripPackages.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  hotel: one(hotels, {
    fields: [reviews.hotelId],
    references: [hotels.id],
  }),
  tripPackage: one(tripPackages, {
    fields: [reviews.tripPackageId],
    references: [tripPackages.id],
  }),
}));

export const travelDocumentsRelations = relations(travelDocuments, ({ one }) => ({
  user: one(users, {
    fields: [travelDocuments.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripPackageSchema = createInsertSchema(tripPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  bookingDate: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelDocumentSchema = createInsertSchema(travelDocuments).omit({
  id: true,
  createdAt: true,
  uploadDate: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

export type InsertTripPackage = z.infer<typeof insertTripPackageSchema>;
export type TripPackage = typeof tripPackages.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertTravelDocument = z.infer<typeof insertTravelDocumentSchema>;
export type TravelDocument = typeof travelDocuments.$inferSelect;