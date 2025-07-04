import { sql } from 'drizzle-orm';
import { db } from './db';

// This file creates indexes for frequently queried fields to improve performance
export async function createDatabaseIndexes() {
  if (!db) {
    console.log("⚠️  No database connection, skipping index creation");
    return;
  }

  try {
    console.log("📇 Creating database indexes for performance optimization...");

    // User indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)`);

    // Hotel indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(location)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels(price_per_night)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating DESC)`);

    // Trip package indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trip_packages_location ON trip_packages(location)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trip_packages_status ON trip_packages(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trip_packages_price ON trip_packages(price)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_trip_packages_recommended ON trip_packages(is_recommended)`);

    // Booking indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_trip_package_id ON bookings(trip_package_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date DESC)`);

    // Review indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_trip_package_id ON reviews(trip_package_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC)`);

    // Travel document indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_travel_documents_user_id ON travel_documents(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_travel_documents_type ON travel_documents(document_type)`);

    console.log("✅ Database indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  }
}

// Run index creation on module load
createDatabaseIndexes();