import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function up() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function down() {
  await db.execute(sql`DROP TABLE IF EXISTS categories`);
  await db.execute(sql`DROP TABLE IF EXISTS users`);
}