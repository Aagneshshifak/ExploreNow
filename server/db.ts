import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("   Please create a .env file with DATABASE_URL set");
  throw new Error("DATABASE_URL environment variable is required");
}

let sql: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

try {
  sql = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(sql, { schema });
  console.log("✅ Database connection initialized");
} catch (error) {
  console.error("❌ Failed to initialize database connection:", error);
  throw error;
}

export { db, sql };