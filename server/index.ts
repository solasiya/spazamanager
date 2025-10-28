import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { networkInterfaces } from 'os';
import { db, pool } from './db'; // Import your db instance
import { sql } from 'drizzle-orm'; 
import session from 'express-session';
import passport from 'passport';
import { MySQLSessionStore } from './storage';
import MySQLStore from 'express-mysql-session'; // Changed from pgSession

// Network utility function
function getLocalIp(): string {
  const interfaces = networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const iface = interfaces[interfaceName];
    if (!iface) continue;
    
    for (const { address, family, internal } of iface) {
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return 'localhost';
}

// Create MySQL session store
const MySQLSessionStore = MySQLStore(session);

const app = express();

// Add CORS and body parsing middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL session configuration
app.use(session({
  store: new MySQLSessionStore({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'spaza_db',   // Your database name
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session()); // ← 🔥 VERY IMPORTANT!

app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000' // 👈 Replace with your frontend dev server
    : process.env.FRONTEND_URL, // No array needed unless you allow multiple
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, path, ip } = req;
  
  const originalJson = res.json;
  let responseBody: any;
  
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${method} ${path} ${res.statusCode} ${duration}ms - ${ip}`;
    
    if (path.startsWith('/api')) {
      console.log(logMessage);
      if (responseBody && process.env.NODE_ENV === 'development') {
        console.debug('Response:', JSON.stringify(responseBody, null, 2));
      }
    }
  });

  next();
});

// MySQL Database Initialization
async function initializeDatabase() {
  try {
    // Verify connection
    await db.execute(sql`SELECT 1`);
    
    // Check and create tables if needed
    const [tables] = await db.execute(sql`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    const requiredTables = ['users', 'categories', 'products', 'sessions'];
    const missingTables = requiredTables.filter(table => 
      !tables.some((t: any) => t.TABLE_NAME === table)
    );

    if (missingTables.length > 0) {
      console.log('Creating missing tables:', missingTables);
      
      await db.transaction(async (tx) => {
        if (missingTables.includes('users')) {
          await tx.execute(sql`
            CREATE TABLE users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `);
        }

        if (missingTables.includes('categories')) {
          await tx.execute(sql`
            CREATE TABLE categories (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              slug VARCHAR(255) UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
      });
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Server startup
(async () => {
  try {
    console.log('🚀 Starting Spaza Manager server...');
    console.log('📊 Initializing database...');
    await initializeDatabase();
    
    console.log('🛣️  Registering routes...');
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) return next(err);
      
      const status = err.status || 500;
      const message = process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message;
      
      console.error(`[${req.method} ${req.path}] Error ${status}:`, err);
      
      res.status(status).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: err.stack,
          details: err.details
        })
      });
    });

    // Vite setup for development
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    } else {
      app.use(express.static('dist/client', {
        maxAge: '1y',
        immutable: true
      }));
    }

    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      const localIp = getLocalIp();
      console.log(`
      🚀 Server running in ${process.env.NODE_ENV} mode
      - Local: http://localhost:${PORT}
      - Network: http://${localIp}:${PORT}
      - Database: ${process.env.DB_NAME}@${process.env.DB_HOST}
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
})();