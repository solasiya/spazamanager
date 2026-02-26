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
let poolConfig: any;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace(/^\//, '').split('?')[0],
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'spaza_db',
  };
}

// Common pool settings
const pool = createPool({
  ...poolConfig,
  waitForConnections: true,
  connectionLimit: 5,
  idleTimeout: 30000,
  queueLimit: 0,
  ssl: (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
    rejectUnauthorized: false
  } : undefined
});

console.log(`📡 Attempting connection to ${poolConfig.host}:${poolConfig.port} as user ${poolConfig.user}...`);

// Test connection without blocking export
pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully to:", poolConfig.host);
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("👉 TIP: Check if your DB_PASSWORD or DATABASE_URL is correct in Render Environment settings.");
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