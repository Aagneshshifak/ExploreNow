import { db } from "./db";
import { bookings, hotels, trips, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedBookings() {
  console.log("🌱 Seeding bookings...");
  
  // Find the test user
  const user = await db.query.users.findFirst({
    where: eq(users.email, "user@explorenow.com"),
  });

  if (!user) {
    console.error("❌ Test user not found. Please run seed.ts first.");
    return;
  }

  console.log(`👤 Found user: ${user.name} (${user.email})`);

  // Get all trips and hotels
  const allTrips = await db.select().from(trips);
  const allHotels = await db.select().from(hotels);

  if (allTrips.length === 0 || allHotels.length === 0) {
    console.error("❌ No trips or hotels found. Please run seed.ts first.");
    return;
  }

  // Check if bookings already exist for this user
  const existingBookings = await db.select().from(bookings).where(eq(bookings.userId, user.id));
  
  if (existingBookings.length > 0) {
    console.log("ℹ️ Bookings already exist for this user");
    console.log(`📊 Found ${existingBookings.length} existing bookings`);
    return;
  }

  const newBookings = [];

  // Create trip bookings
  for (let i = 0; i < Math.min(2, allTrips.length); i++) {
    const trip = allTrips[i];
    newBookings.push({
      userId: user.id,
      tripId: trip.id,
      hotelId: null,
      type: "trip" as const,
      status: i === 0 ? "confirmed" : "pending",
      totalPrice: trip.price,
      checkIn: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // Future dates
      checkOut: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000),
    });
  }

  // Create hotel bookings
  for (let i = 0; i < Math.min(2, allHotels.length); i++) {
    const hotel = allHotels[i];
    newBookings.push({
      userId: user.id,
      tripId: null,
      hotelId: hotel.id,
      type: "hotel" as const,
      status: i === 0 ? "confirmed" : "cancelled",
      totalPrice: (parseFloat(hotel.price) * 2).toString(), // 2 nights
      checkIn: new Date(Date.now() + (i + 3) * 7 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() + (i + 3) * 7 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000),
    });
  }

  if (newBookings.length > 0) {
    await db.insert(bookings).values(newBookings);
    console.log(`✅ ${newBookings.length} sample bookings inserted successfully.`);
    console.log("📊 Booking breakdown:");
    console.log(`   - Trip bookings: ${newBookings.filter(b => b.type === 'trip').length}`);
    console.log(`   - Hotel bookings: ${newBookings.filter(b => b.type === 'hotel').length}`);
  } else {
    console.log("⚠️ No bookings created");
  }
}

// Run the seeding function
seedBookings().catch(console.error);