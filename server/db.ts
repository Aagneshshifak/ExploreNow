import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
// Optimize WebSocket connections
neonConfig.pipelineConnect = "password";
neonConfig.poolQueryViaFetch = true;

// Check if DATABASE_URL is available and clean it if needed
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function cleanDatabaseUrl(url: string): string {
  // Remove psql prefix and quotes if present
  return url.replace(/^psql '/, '').replace(/'$/, '');
}

if (process.env.DATABASE_URL) {
  try {
    const cleanUrl = cleanDatabaseUrl(process.env.DATABASE_URL);
    
    // Optimized pool configuration
    pool = new Pool({ 
      connectionString: cleanUrl,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Connection timeout
    });
    
    db = drizzle({ client: pool, schema });
    console.log("✅ Database connection configured successfully");
  } catch (error) {
    console.error("❌ Failed to configure database:", error);
    console.warn("   Database operations will be disabled.");
  }
} else {
  console.warn("⚠️  DATABASE_URL not set. Database operations will be disabled.");
  console.warn("   To enable database features, add DATABASE_URL to your environment variables.");
}

export { pool, db };