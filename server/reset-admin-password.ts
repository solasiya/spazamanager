// server/reset-admin-password.ts
import bcrypt from "bcrypt";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { users } from "./schema";

const username = "admin";
const newPassword = "@Admin123"; // <-- CHANGE THIS
const fullName = "Store Owner";

async function resetAdminPassword() {
  try {
    console.log("Starting admin password reset...");
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Password hashed successfully");

    // Try to update the password for existing admin
    const [rows] = await db.execute(
      sql`SELECT * FROM users WHERE username = ${username}`
    );
    console.log("Existing user check result:", rows);

    if (Array.isArray(rows) && rows.length > 0) {
      await db.execute(
        sql`UPDATE users SET password = ${hashedPassword}, full_name = ${fullName} WHERE username = ${username}`
      );
      console.log(`Password for user '${username}' has been updated.`);
    } else {
      await db.execute(
        sql`INSERT INTO users (username, password, full_name, role) VALUES (${username}, ${hashedPassword}, ${fullName}, 'owner')`
      );
      console.log(`User '${username}' has been created with the new password.`);
    }
    
    console.log("Admin password reset completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin password:", error);
    process.exit(1);
  }
}

resetAdminPassword().catch((err) => {
  console.error("Error resetting admin password:", err);
  process.exit(1);
});