import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import { networkInterfaces } from 'os';
import session from 'express-session';
import passport from 'passport';
import { storage } from './storage';
import path from 'path';
import 'dotenv/config';

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

const app = express();

// Add CORS and body parsing middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use the session store from storage
app.use(session({
  store: storage.sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

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

// Server startup
(async () => {
  try {
    console.log('🚀 Starting Spaza Manager server...');
    
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

    // Static file serving for production
    if (process.env.NODE_ENV === 'production') {
      const publicPath = path.resolve(process.cwd(), 'dist', 'public');
      app.use(express.static(publicPath, {
        maxAge: '1y',
        immutable: true
      }));

      // Catch-all route to serve the SPA
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(publicPath, 'index.html'));
      });
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    }

    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      const localIp = getLocalIp();
      console.log(`
      🚀 Server running in ${process.env.NODE_ENV} mode
      - Local: http://localhost:${PORT}
      - Network: http://${localIp}:${PORT}
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