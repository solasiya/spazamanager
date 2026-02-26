import { pool } from '../server/db';
import bcrypt from 'bcrypt';

async function checkUsers() {
  try {
    const [rows]: any = await pool.query('SELECT username FROM users');
    console.log('Current users:', rows);
    
    if (rows.length === 0) {
      console.log('No users found. Attempting to seed...');
      const hashedPasswordCms = await bcrypt.hash('cms123', 12);
      const hashedPasswordAdmin = await bcrypt.hash('password', 12);
      
      await pool.query('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', 
        ['cms', hashedPasswordCms, 'CMS Admin', 'superuser']);
      await pool.query('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', 
        ['admin', hashedPasswordAdmin, 'Store Owner', 'owner']);
      
      console.log('✅ Users seeded successfully');
    }
  } catch (error) {
    console.error('Error checking/seeding users:', error);
  } finally {
    process.exit();
  }
}

checkUsers();
