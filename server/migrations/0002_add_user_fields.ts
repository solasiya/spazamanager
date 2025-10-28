import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function up() {
  // Add full_name and role columns to users table
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT 'Store Owner',
    ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'owner'
  `);
}

export async function down() {
  // Remove the added columns
  await db.execute(sql`
    ALTER TABLE users 
    DROP COLUMN full_name,
    DROP COLUMN role
  `);
}
