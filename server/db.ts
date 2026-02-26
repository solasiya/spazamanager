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

if (process.env.DATABASE_URL) {
  console.log("📡 Connecting using DATABASE_URL...");
  pool = createPool(process.env.DATABASE_URL);
} else {
  console.log("📡 Connecting using individual environment variables...");
  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'spaza_db',
    waitForConnections: true,
    connectionLimit: 5,
    idleTimeout: 30000,
    queueLimit: 0,
    ssl: (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
      rejectUnauthorized: false
    } : undefined
  };
  pool = createPool(poolConfig);
}

// Test connection
pool.getConnection()
  .then((conn: any) => {
    console.log("✅ Database connection verified successfully!");
    conn.release();
  })
  .catch((err: any) => {
    console.error("❌ Database connection failed:", err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("👉 ACTION REQUIRED: Ensure you have clicked 'Save changes' on the Aiven IP Whitelist (0.0.0.0/0).");
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