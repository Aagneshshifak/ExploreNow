import "dotenv/config";
import { db } from "../server/db";
import { touristSpots } from "../shared/schema";
import { sql } from "drizzle-orm";

async function verifyTouristSpots() {
  try {
    console.log("🔍 Verifying tourist spots in database...\n");
    
    // Get total count
    const allSpots = await db.select().from(touristSpots);
    console.log(`✅ Total spots in database: ${allSpots.length}\n`);
    
    // Group by city
    const cities = ["New York", "London", "Tokyo", "Paris", "Mumbai"];
    for (const city of cities) {
      const citySpots = allSpots.filter(spot => spot.city === city);
      console.log(`📍 ${city}: ${citySpots.length} spots`);
      citySpots.forEach(spot => {
        console.log(`   - ${spot.name} (${spot.category})`);
      });
      console.log();
    }
    
    // Group by category
    const categories = ["museum", "beach", "monument", "park", "religious_site", "market", "viewpoint"];
    console.log("📊 Breakdown by category:");
    for (const category of categories) {
      const categorySpots = allSpots.filter(spot => spot.category === category);
      if (categorySpots.length > 0) {
        console.log(`   ${category}: ${categorySpots.length} spots`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying tourist spots:", error);
    process.exit(1);
  }
}

verifyTouristSpots();
