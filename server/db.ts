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
let connectionInfo: any = {};

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL.trim());
  connectionInfo = {
    host: url.hostname.trim(),
    port: url.port || '3306',
    user: url.username.trim(),
    password: url.password.trim(),
    database: url.pathname.replace(/^\//, '').split('?')[0].trim(),
    method: 'DATABASE_URL'
  };
} else {
  connectionInfo = {
    host: (process.env.DB_HOST || 'localhost').trim(),
    port: (process.env.DB_PORT || '3306').trim(),
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || 'spaza_db').trim(),
    method: 'INDIVIDUAL_VARS'
  };
}

const maskPassword = (pw: string | undefined) => {
  if (!pw) return 'MISSING';
  return `${pw.substring(0, 2)}... (length: ${pw.length})`;
};

console.log(`📡 DB Connection Details:
   Method:   ${connectionInfo.method}
   Host:     ${connectionInfo.host}:${connectionInfo.port}
   Database: ${connectionInfo.database}
   User:     ${connectionInfo.user}
   PW:       ${maskPassword(connectionInfo.password)}
`);

pool = createPool({
  host: connectionInfo.host,
  port: parseInt(connectionInfo.port),
  user: connectionInfo.user,
  password: connectionInfo.password,
  database: connectionInfo.database,
  waitForConnections: true,
  connectionLimit: 5,
  idleTimeout: 30000,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

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