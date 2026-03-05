import "dotenv/config";
import { db } from "../server/db";
import { touristSpots } from "../shared/schema";
import { sql } from "drizzle-orm";

async function cleanupDuplicates() {
  try {
    console.log("🧹 Cleaning up duplicate tourist spots...");
    
    // Delete all tourist spots
    await db.delete(touristSpots);
    console.log("✅ Deleted all existing tourist spots");
    
    // Reset the sequence
    await db.execute(sql`ALTER SEQUENCE tourist_spots_id_seq RESTART WITH 1`);
    console.log("✅ Reset ID sequence");
    
    console.log("\n✨ Database cleaned! Now run: npx tsx scripts/seed-tourist-spots.ts");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
    process.exit(1);
  }
}

cleanupDuplicates();
