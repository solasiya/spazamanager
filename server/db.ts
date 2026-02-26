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

// Initialize Pool with error handling
let pool: Pool;
try {
  // Parse the DATABASE_URL
  const url = new URL(DATABASE_URL);
  
  pool = createPool({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password.includes('%40') ? 
           decodeURIComponent(url.password) : 
           url.password,
    database: url.pathname.replace(/^\//, '').split('?')[0],
    waitForConnections: true,
    connectionLimit: 10, // Slightly reduced for multi-instance compatibility
    idleTimeout: 30000,
    queueLimit: 0,
    // Add SSL support for cloud providers (like Aiven, DigitalOcean)
    ...(process.env.DB_SSL === 'true' || url.searchParams.has('ssl') ? {
      ssl: {
        rejectUnauthorized: false // Common setting for self-signed or CA-signed without file
      }
    } : {})
  });

  // Test connection
  const conn = await pool.getConnection();
  await conn.query('SELECT NOW()');
  conn.release();
  console.log("✅ Database connected successfully");

} catch (err) {
  console.error("❌ Failed to connect to database:", err instanceof Error ? err.message : err);
  throw err; // Crash the app if DB connection fails
}

// Export Drizzle instance with schema
export { pool };
export const db = drizzle(pool, { schema, mode: 'default' });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  console.log("Database pool closed gracefully");
});