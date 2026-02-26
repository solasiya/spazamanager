import { createPool, type Pool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";
import 'dotenv/config';

// Validate DATABASE_URL early
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in .env. Example: mysql://user:pass@host:port/db",
  );
}

// Global error handlers for better debugging on Render
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

// Initialize Pool
const url = new URL(DATABASE_URL);
const pool = createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password.includes('%40') ? decodeURIComponent(url.password) : url.password,
  database: url.pathname.replace(/^\//, '').split('?')[0],
  waitForConnections: true,
  connectionLimit: 5,
  idleTimeout: 30000,
  queueLimit: 0,
  ...(process.env.DB_SSL === 'true' || url.searchParams.has('ssl') || url.searchParams.has('ssl-mode') ? {
    ssl: { rejectUnauthorized: false }
  } : {})
});

// Test connection without blocking export
pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

// Export Drizzle instance with schema
export { pool };
export const db = drizzle(pool, { schema, mode: 'default' });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  console.log("Database pool closed gracefully");
});