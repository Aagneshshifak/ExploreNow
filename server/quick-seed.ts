import { db } from "./db";
import { users, trips, hotels } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function quickSeed() {
  console.log("🌱 Quick seeding database...");
  
  try {
    // Create admin user if not exists
    const adminExists = await db.select().from(users).where(eq(users.email, "admin@explorenow.com"));
    if (adminExists.length === 0) {
      const adminPassword = await bcrypt.hash("admin123", 12);
      await db.insert(users).values({
        name: "Admin User",
        email: "admin@explorenow.com",
        password: adminPassword,
        role: "admin"
      });
      console.log("✅ Admin user created");
    }

    // Insert sample trips
    await db.insert(trips).values([
      {
        title: "Tropical Paradise in Bali",
        location: "Bali, Indonesia",
        description: "Experience the beauty of Bali with pristine beaches, cultural temples, and lush rice terraces.",
        price: "1299.99",
        imageUrl: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1200&h=800&fit=crop&q=80",
        duration: 7,
        tags: ["Beach", "Culture", "Adventure"],
        includes: ["Luxury resort accommodation", "Daily breakfast", "Temple tours", "Airport transfers"]
      },
      {
        title: "European Grand Tour",
        location: "Paris, Rome, Barcelona",
        description: "Discover the charm of Europe with visits to iconic cities and historical landmarks.",
        price: "2199.99",
        imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop&q=80",
        duration: 14,
        tags: ["Culture", "History", "Architecture"],
        includes: ["4-star hotel accommodation", "High-speed train tickets", "Museum passes", "Guided tours"]
      },
      {
        title: "African Safari Adventure",
        location: "Maasai Mara, Kenya",
        description: "Witness the Great Migration and explore the African wilderness.",
        price: "1899.99",
        imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=800&fit=crop&q=80",
        duration: 8,
        tags: ["Safari", "Wildlife", "Adventure"],
        includes: ["Safari lodge accommodation", "Game drives", "Professional guide", "All meals"]
      },
      {
        title: "Swiss Alps Expedition",
        location: "Zermatt, Switzerland",
        description: "Majestic peaks and pristine landscapes in the heart of the Alps.",
        price: "2499.99",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80",
        duration: 6,
        tags: ["Mountains", "Adventure", "Luxury"],
        includes: ["Luxury chalet accommodation", "Cable car passes", "Hiking guide", "Gourmet meals"]
      },
      {
        title: "Maldives Overwater Villa",
        location: "Maldives",
        description: "Ultimate luxury in an overwater villa with crystal clear waters.",
        price: "3299.99",
        imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=800&fit=crop&q=80",
        duration: 5,
        tags: ["Luxury", "Beach", "Romance"],
        includes: ["Overwater villa", "Private butler", "Spa treatments", "Water sports"]
      }
    ]);
    console.log("✅ Trips inserted");

    // Insert sample hotels
    await db.insert(hotels).values([
      {
        name: "The Grand Palace",
        location: "Paris, France",
        description: "Luxury hotel in the heart of Paris with stunning city views.",
        price: "450.00",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop&q=80",
        rating: 4.8,
        tags: ["Luxury", "City Center", "Historic"],
        includes: ["Daily breakfast", "Spa access", "Concierge service"],
        amenities: ["Spa", "Fine Dining", "City Views", "Fitness Center"]
      },
      {
        name: "Ocean Breeze Resort",
        location: "Maldives",
        description: "Beachfront resort with private beach and water activities.",
        price: "890.00",
        imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop&q=80",
        rating: 4.9,
        tags: ["Beach", "Resort", "Luxury"],
        includes: ["All meals", "Water sports", "Spa access"],
        amenities: ["Private Beach", "Water Villa", "Diving", "Restaurant"]
      },
      {
        name: "Mountain Lodge",
        location: "Colorado, USA",
        description: "Cozy mountain lodge with ski access and beautiful views.",
        price: "320.00",
        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80",
        rating: 4.7,
        tags: ["Mountains", "Ski", "Nature"],
        includes: ["Breakfast", "Ski pass", "Equipment rental"],
        amenities: ["Ski Access", "Fireplace", "Mountain Views", "Restaurant"]
      }
    ]);
    console.log("✅ Hotels inserted");

    console.log("🎉 Database seeded successfully!");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

quickSeed();