import { createPool, type Pool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";
import 'dotenv/config';

// Validate Database Configuration
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error(
    "Database configuration is missing. Please set DATABASE_URL or DB_HOST/DB_PASSWORD in your environment.",
  );
}

// Initialize Pool
let pool: any;

// Aiven and cloud databases work best with URI-style connection strings
// to handle SSL and specific authentication plugins correctly.
const getConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim();
  }
  
  const host = (process.env.DB_HOST || '').trim();
  const port = (process.env.DB_PORT || '3306').trim();
  const user = (process.env.DB_USER || '').trim();
  const password = (process.env.DB_PASSWORD || '').trim();
  const database = (process.env.DB_NAME || '').trim();
  
  // Build the URI manually if DATABASE_URL is missing
  // We append ?ssl-mode=REQUIRED as mandated by Aiven
  return `mysql://${user}:${password}@${host}:${port}/${database}?ssl-mode=REQUIRED`;
};

const connectionUri = getConnectionString();

// Masked logging for debugging
const maskedUri = connectionUri.replace(/:([^:@]+)@/, ':****@');
console.log(`📡 Connecting to: ${maskedUri}`);

pool = createPool(connectionUri);

// Test connection
pool.getConnection()
  .then((conn: any) => {
    console.log("✅ Database connection verified successfully!");
    conn.release();
  })
  .catch((err: any) => {
    console.error("❌ Database connection failed:", err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("👉 TIP: If credentials are correct, try 'Reset Password' in Aiven and update Render.");
    }
  });

// Export Drizzle instance with schema
export { pool };
export const db = drizzle(pool, { schema, mode: 'default' });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  console.log("Database pool closed gracefully");
});