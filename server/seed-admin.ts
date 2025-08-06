import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@explorenow.com'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists with email: admin@explorenow.com");
      // Update the password in case it needs to be reset
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, 'admin@explorenow.com'));
      console.log("Admin password updated successfully");
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await db.insert(users).values({
        name: 'Admin',
        email: 'admin@explorenow.com',
        password: hashedPassword,
        role: 'admin'
      }).returning();
      
      console.log("Admin user created successfully:", adminUser[0]);
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

seedAdmin();