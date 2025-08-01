import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, trips, hotels } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@explorenow.com")).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const adminPassword = await bcrypt.hash("admin123", 12);
      await db.insert(users).values({
        name: "Admin User",
        email: "admin@explorenow.com",
        password: adminPassword,
        role: "admin"
      });
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
    
    // Check if regular user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, "user@explorenow.com")).limit(1);
    
    if (existingUser.length === 0) {
      // Create regular user
      const userPassword = await bcrypt.hash("user123", 12);
      await db.insert(users).values({
        name: "John Doe",
        email: "user@explorenow.com", 
        password: userPassword,
        role: "user"
      });
      console.log("✅ Regular user created");
    } else {
      console.log("ℹ️ Regular user already exists");
    }
    
    // Check if trips already exist
    const existingTrips = await db.select().from(trips).limit(1);
    
    if (existingTrips.length === 0) {
      // Seed trips
      const sampleTrips = [
      {
        title: "Tropical Paradise in Bali",
        location: "Bali, Indonesia",
        description: "Experience the beauty of Bali with pristine beaches, cultural temples, and lush rice terraces.",
        price: "1299.99",
        imageUrl: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800",
        duration: 7
      },
      {
        title: "European Adventure",
        location: "Paris, Rome, Barcelona",
        description: "Discover the charm of Europe with visits to iconic cities and historical landmarks.",
        price: "2199.99",
        imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800",
        duration: 14
      },
      {
        title: "Safari Experience in Kenya",
        location: "Maasai Mara, Kenya",
        description: "Witness the Great Migration and explore the African wilderness.",
        price: "1899.99",
        imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
        duration: 10
      },
      {
        title: "Japanese Cultural Journey",
        location: "Tokyo, Kyoto, Osaka",
        description: "Immerse yourself in Japanese culture, traditions, and modern innovation.",
        price: "1699.99",
        imageUrl: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800",
        duration: 12
      }
      ];
      
      await db.insert(trips).values(sampleTrips);
      console.log("✅ Sample trips created");
    } else {
      console.log("ℹ️ Trips already exist");
    }
    
    // Check if hotels already exist
    const existingHotels = await db.select().from(hotels).limit(1);
    
    if (existingHotels.length === 0) {
      // Seed hotels
      const sampleHotels = [
      {
        name: "Grand Palace Resort",
        location: "Bali, Indonesia",
        description: "Luxury beachfront resort with traditional Balinese architecture and world-class amenities.",
        price: "299.99",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        rating: "4.8",
        amenities: ["Pool", "Spa", "Beach Access", "Restaurant", "WiFi"]
      },
      {
        name: "Parisian Boutique Hotel",
        location: "Paris, France",
        description: "Charming boutique hotel in the heart of Paris, near the Eiffel Tower.",
        price: "189.99",
        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        rating: "4.5",
        amenities: ["WiFi", "Room Service", "Concierge", "Bar"]
      },
      {
        name: "Safari Lodge Kenya",
        location: "Maasai Mara, Kenya",
        description: "Authentic safari lodge with stunning views of the African savanna.",
        price: "199.99",
        imageUrl: "https://images.unsplash.com/photo-1518107616985-bd48230d3b20?w=800",
        rating: "4.7",
        amenities: ["Game Drives", "Restaurant", "Bar", "WiFi", "Spa"]
      },
      {
        name: "Tokyo Modern Hotel",
        location: "Tokyo, Japan",
        description: "Contemporary hotel in Shibuya with easy access to Tokyo's attractions.",
        price: "149.99",
        imageUrl: "https://images.unsplash.com/photo-1555686306-3ab3d3e6fd35?w=800",
        rating: "4.6",
        amenities: ["WiFi", "Gym", "Restaurant", "Bar", "Metro Access"]
      },
      {
        name: "Mediterranean Vista Hotel",
        location: "Barcelona, Spain",
        description: "Stunning hotel with Mediterranean views and modern Spanish design.",
        price: "179.99",
        imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
        rating: "4.4",
        amenities: ["Pool", "Restaurant", "WiFi", "Terrace", "City Views"]
      }
      ];
      
      await db.insert(hotels).values(sampleHotels);
      console.log("✅ Sample hotels created");
    } else {
      console.log("ℹ️ Hotels already exist");
    }
    
    console.log("✅ Database seeding completed successfully!");
    console.log("🔐 Admin login: admin@explorenow.com / admin123");
    console.log("👤 User login: user@explorenow.com / user123");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}