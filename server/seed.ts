import 'dotenv/config';
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
      // Seed trips with unique, location-specific images
      const sampleTrips = [
        {
          title: "Tropical Paradise in Bali",
          location: "Bali, Indonesia",
          description: "Experience the beauty of Bali with pristine beaches, cultural temples, and lush rice terraces. Discover hidden waterfalls and traditional villages.",
          price: "1299.99",
          imageUrl: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1200&h=800&fit=crop&q=80",
          duration: 7,
          tags: ["Beach", "Culture", "Adventure", "Wellness"],
          includes: ["Luxury resort accommodation", "Daily breakfast", "Temple tours", "Rice terrace hiking", "Traditional cooking class", "Airport transfers"]
        },
        {
          title: "European Grand Tour",
          location: "Paris, Rome, Barcelona",
          description: "Discover the charm of Europe with visits to iconic cities and historical landmarks. Experience world-class art, cuisine, and architecture.",
          price: "2199.99",
          imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop&q=80",
          duration: 14,
          tags: ["Culture", "History", "Architecture", "Food"],
          includes: ["4-star hotel accommodation", "High-speed train tickets", "Museum passes", "Guided city tours", "Wine tasting sessions", "All breakfasts"]
        },
        {
          title: "African Safari Adventure",
          location: "Maasai Mara, Kenya",
          description: "Witness the Great Migration and explore the African wilderness. Experience close encounters with the Big Five in their natural habitat.",
          price: "1899.99",
          imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=800&fit=crop&q=80",
          duration: 10,
          tags: ["Wildlife", "Adventure", "Nature", "Photography"],
          includes: ["Safari lodge accommodation", "All meals included", "Game drives", "Professional guide", "Park entrance fees", "Photography workshop"]
        },
        {
          title: "Swiss Alps Expedition",
          location: "Zermatt, Switzerland",
          description: "Explore the majestic Swiss Alps with breathtaking mountain views, pristine hiking trails, and charming alpine villages.",
          price: "1699.99",
          imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80",
          duration: 8,
          tags: ["Mountains", "Adventure", "Nature", "Hiking"],
          includes: ["Mountain lodge accommodation", "Guided hiking tours", "Cable car passes", "Traditional Swiss meals", "Equipment rental", "Mountain guide"]
        },
        {
          title: "Maldives Overwater Paradise",
          location: "Maldives",
          description: "Experience ultimate luxury in overwater villas with crystal clear waters, pristine beaches, and world-class diving.",
          price: "2499.99",
          imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=800&fit=crop&q=80",
          duration: 7,
          tags: ["Beach", "Luxury", "Romance", "Diving"],
          includes: ["Overwater villa accommodation", "All-inclusive meals", "Diving equipment", "Spa treatments", "Water sports", "Private transfers"]
        },
        {
          title: "Japanese Cultural Immersion",
          location: "Tokyo, Kyoto, Osaka",
          description: "Immerse yourself in Japanese culture, traditions, and modern innovation. From ancient temples to futuristic cities.",
          price: "1899.99",
          imageUrl: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200&h=800&fit=crop&q=80",
          duration: 12,
          tags: ["Culture", "Technology", "Food", "History"],
          includes: ["Traditional ryokan stay", "Bullet train passes", "Temple visits", "Sushi making class", "Tea ceremony", "City tours"]
        },
        {
          title: "New York City Adventure",
          location: "New York, USA",
          description: "Experience the city that never sleeps with iconic landmarks, Broadway shows, and world-class dining.",
          price: "1599.99",
          imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop&q=80",
          duration: 6,
          tags: ["City", "Culture", "Entertainment", "Food"],
          includes: ["Manhattan hotel accommodation", "Broadway show tickets", "City pass for attractions", "Food tour", "Subway passes", "Airport transfers"]
        },
        {
          title: "Australian Outback Discovery",
          location: "Uluru, Australia",
          description: "Discover the mystical Red Centre with ancient Aboriginal culture, stunning desert landscapes, and unique wildlife.",
          price: "1399.99",
          imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80",
          duration: 9,
          tags: ["Desert", "Culture", "Adventure", "Wildlife"],
          includes: ["Desert lodge accommodation", "Aboriginal cultural tours", "Sunrise/sunset viewing", "Star gazing", "Desert walks", "All meals"]
        },
        {
          title: "Santorini Sunset Experience",
          location: "Santorini, Greece",
          description: "Discover the magic of Santorini with its iconic white buildings, stunning sunsets, and crystal-clear Aegean waters.",
          price: "1799.99",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80",
          duration: 8,
          tags: ["Beach", "Romance", "Culture", "Photography"],
          includes: ["Cliffside hotel accommodation", "Sunset cruise", "Wine tasting", "Island tours", "Traditional Greek cooking class", "Airport transfers"]
        },
        {
          title: "Machu Picchu Adventure",
          location: "Cusco, Peru",
          description: "Journey to the ancient Incan citadel of Machu Picchu, exploring the Sacred Valley and experiencing Peruvian culture.",
          price: "1699.99",
          imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200&h=800&fit=crop&q=80",
          duration: 10,
          tags: ["History", "Adventure", "Culture", "Mountains"],
          includes: ["Cusco hotel accommodation", "Machu Picchu entrance", "Sacred Valley tour", "Traditional Peruvian meals", "Local guide", "Train tickets"]
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
      // Seed hotels with unique, location-specific images
      const sampleHotels = [
        {
          name: "Bali Beach Resort & Spa",
          location: "Bali, Indonesia",
          description: "Luxury beachfront resort with traditional Balinese architecture, infinity pools, and world-class spa treatments.",
          price: "299.99",
          imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop&q=80",
          rating: "4.8",
          amenities: ["Infinity Pool", "Spa", "Beach Access", "Restaurant", "WiFi", "Yoga Classes"]
        },
        {
          name: "Eiffel Tower View Hotel",
          location: "Paris, France",
          description: "Boutique hotel with stunning Eiffel Tower views, located in the heart of Paris near Champs-Élysées.",
          price: "289.99",
          imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80",
          rating: "4.7",
          amenities: ["Eiffel Tower View", "WiFi", "Room Service", "Concierge", "Bar", "Restaurant"]
        },
        {
          name: "Maasai Mara Safari Lodge",
          location: "Maasai Mara, Kenya",
          description: "Authentic safari lodge with stunning views of the African savanna and close wildlife encounters.",
          price: "199.99",
          imageUrl: "https://images.unsplash.com/photo-1518107616985-bd48230d3b20?w=1200&h=800&fit=crop&q=80",
          rating: "4.9",
          amenities: ["Game Drives", "Restaurant", "Bar", "WiFi", "Spa", "Wildlife Viewing"]
        },
        {
          name: "Swiss Alpine Lodge",
          location: "Zermatt, Switzerland",
          description: "Cozy mountain lodge with panoramic Alpine views, perfect for hiking and skiing adventures.",
          price: "249.99",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80",
          rating: "4.6",
          amenities: ["Mountain Views", "Restaurant", "Spa", "WiFi", "Ski Storage", "Hiking Tours"]
        },
        {
          name: "Maldives Overwater Villa",
          location: "Maldives",
          description: "Luxurious overwater villa with glass floor panels, private deck, and direct ocean access.",
          price: "599.99",
          imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop&q=80",
          rating: "4.9",
          amenities: ["Overwater Villa", "Private Deck", "Glass Floor", "Spa", "Diving Center", "All-Inclusive"]
        },
        {
          name: "Tokyo Skytree Hotel",
          location: "Tokyo, Japan",
          description: "Modern hotel with stunning city views, located near Tokyo Skytree and convenient metro access.",
          price: "189.99",
          imageUrl: "https://images.unsplash.com/photo-1555686306-3ab3d3e6fd35?w=1200&h=800&fit=crop&q=80",
          rating: "4.5",
          amenities: ["City Views", "WiFi", "Gym", "Restaurant", "Bar", "Metro Access"]
        },
        {
          name: "Times Square Luxury Hotel",
          location: "New York, USA",
          description: "Luxury hotel in the heart of Times Square with spectacular city views and world-class amenities.",
          price: "399.99",
          imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop&q=80",
          rating: "4.4",
          amenities: ["Times Square View", "Rooftop Bar", "Spa", "Restaurant", "WiFi", "Concierge"]
        },
        {
          name: "Barcelona Beachfront Hotel",
          location: "Barcelona, Spain",
          description: "Stunning beachfront hotel with Mediterranean views and modern Spanish design in the heart of Barcelona.",
          price: "229.99",
          imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop&q=80",
          rating: "4.6",
          amenities: ["Beach Access", "Pool", "Restaurant", "WiFi", "Terrace", "City Views"]
        },
        {
          name: "Uluru Desert Resort",
          location: "Uluru, Australia",
          description: "Unique desert resort with views of Uluru, offering authentic Aboriginal cultural experiences.",
          price: "179.99",
          imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80",
          rating: "4.3",
          amenities: ["Uluru Views", "Cultural Tours", "Restaurant", "WiFi", "Desert Tours", "Star Gazing"]
        },
        {
          name: "Goa Beach Paradise",
          location: "Goa, India",
          description: "Tropical beach resort with palm-fringed beaches, Ayurvedic spa, and authentic Indian cuisine.",
          price: "159.99",
          imageUrl: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2101f?w=1200&h=800&fit=crop&q=80",
          rating: "4.5",
          amenities: ["Beach Access", "Ayurvedic Spa", "Restaurant", "WiFi", "Yoga Classes", "Water Sports"]
        },
        {
          name: "Taj Mahal Palace Hotel",
          location: "Agra, India",
          description: "Luxury heritage hotel with stunning views of the iconic Taj Mahal, offering royal Indian hospitality.",
          price: "349.99",
          imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop&q=80",
          rating: "4.8",
          amenities: ["Taj Mahal View", "Heritage Rooms", "Spa", "Restaurant", "WiFi", "Cultural Tours"]
        },
        {
          name: "Santorini Cliff Resort",
          location: "Santorini, Greece",
          description: "Breathtaking cliffside resort with infinity pools overlooking the Aegean Sea and stunning sunsets.",
          price: "449.99",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&q=80",
          rating: "4.9",
          amenities: ["Cliff Views", "Infinity Pool", "Spa", "Restaurant", "WiFi", "Sunset Views"]
        },
        {
          name: "Machu Picchu Lodge",
          location: "Cusco, Peru",
          description: "Authentic lodge near the ancient Incan citadel with stunning mountain views and cultural experiences.",
          price: "279.99",
          imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200&h=800&fit=crop&q=80",
          rating: "4.6",
          amenities: ["Mountain Views", "Cultural Tours", "Restaurant", "WiFi", "Hiking Tours", "Incan History"]
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