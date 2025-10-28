import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import MySQLStore from 'express-mysql-session';
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createHttpError from "http-errors";
import { pool } from './db';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  console.log('🔐 Setting up authentication...');
  
  // Enhanced session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "spaza-manager-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'spaza.sid',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax', // More permissive for development
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    }
  };

  // Trust proxy configuration
  if (process.env.NODE_ENV === 'production') {
    app.set("trust proxy", 1);
  }
  
  // Session middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy
  console.log('🔐 Configuring Passport Local Strategy...');
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: false
      },
      async (username, password, done) => {
        try {
          console.log(`[AUTH] Login attempt for user: ${username}`);
          
          // Input validation
          if (!username || !password) {
            console.log(`[AUTH] Missing credentials for login attempt`);
            return done(null, false, { message: "Username and password are required" });
          }

          const user = await storage.getUserByUsername(username);
          if (!user) {
            console.log(`[AUTH] User not found: ${username}`);
            return done(null, false, { message: "Invalid credentials" });
          }
          
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            console.log(`[AUTH] Invalid password for user: ${username}`);
            return done(null, false, { message: "Invalid credentials" });
          }
          
          console.log(`[AUTH] Successful authentication for user: ${username}`);
          return done(null, user);
        } catch (error) {
          console.error(`[AUTH] Authentication error for ${username}:`, error);
          return done(error);
        }
      }
    )
  );

  // User serialization for session
  passport.serializeUser((user: Express.User, done) => {
    console.log(`[AUTH] Serializing user ID: ${user.id}`);
    done(null, user.id);
  });
  
  // User deserialization from session
  passport.deserializeUser(async (id: number, done) => {
    console.log(`[AUTH] Deserializing user ID: ${id}`);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[AUTH] User not found during deserialization: ${id}`);
        return done(null, false);
      }
      console.log(`[AUTH] Successfully deserialized user: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error(`[AUTH] Deserialization error for user ID ${id}:`, error);
      done(error);
    }
  });
// Add this temporary endpoint to test session storage
app.get("/api/debug/session-test", (req, res) => {
  (req.session as any).testData = "Hello World";
  res.json({ 
    sessionID: req.sessionID,
    testData: (req.session as any).testData,
    message: "Session test data saved"
  });
});

// Add this endpoint to check session data
app.get("/api/debug/session-check", (req, res) => {
  res.json({ 
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    sessionData: req.session,
    cookies: req.headers.cookie
  });
});

app.get("/api/debug/session-read", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    testData: (req.session as any).testData,
    allSessionData: req.session
  });
});

  // Registration endpoint
  app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { username, password, email, ...rest } = req.body;
    
    // ===== 1. Enhanced Input Validation =====
    if (!username?.trim() || !password?.trim()) {
      throw createHttpError(400, "Username and password are required");
    }

    if (username.length < 3) {
      throw createHttpError(400, "Username must be at least 3 characters");
    }

    if (password.length < 8) {  // Increased from 6 to 8 for better security
      throw createHttpError(400, "Password must be at least 8 characters");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createHttpError(400, "Invalid email format");
    }

    console.log(`[AUTH] Registration attempt for: ${username}`, { 
      email,
      hasRestFields: Object.keys(rest).length > 0 
    });

    // ===== 2. Improved User Existence Check =====
    console.log('[DB] Checking for existing user...');
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log(`[DB] Username already exists: ${username}`);
      throw createHttpError(409, "Username already exists");
    }

    // ===== 3. Secure Password Hashing =====
    console.log('[AUTH] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // ===== 4. User Creation with Transaction =====
    console.log('[DB] Creating new user...');
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email: email?.trim() || null, // Ensure email is either valid or null
      ...rest
    });

    if (!user?.id) {
      throw createHttpError(500, "User creation failed - no ID returned");
    }

    // ===== 5. Auto-Login with Enhanced Session Handling =====
    console.log('[AUTH] Attempting auto-login...');
    req.login(user, (err) => {
      if (err) {
        console.error("[AUTH] Login after registration failed:", err);
        
              // Special case: User was created but login failed
      return res.status(201).json({
        status: 'partial_success',
        message: 'Registered but automatic login failed',
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        },
        login_required: true
      });
      }
      
      // Successful registration and login
      const { password: _, ...userWithoutPassword } = user;
      console.log(`[AUTH] Successfully registered and logged in: ${username}`);
      
      res.status(201).json({
        status: 'success',
        message: 'Registration and login successful',
        user: userWithoutPassword,
        session_id: req.sessionID
      });
    });

  } catch (error) {
    console.error('[AUTH] Registration error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    next(error);
  }
});

  // Login endpoint
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    console.log("[AUTH] Login request received:", { 
      username: req.body.username,
      hasPassword: !!req.body.password,
      body: req.body 
    });
    
    // Input validation
    if (!req.body.username || !req.body.password) {
      console.log("[AUTH] Missing credentials");
      return next(createHttpError(400, "Username and password are required"));
    }

    passport.authenticate("local", (err: Error | null, user?: Express.User | false, info?: { message: string }) => {
      if (err) {
        console.error("[AUTH] Authentication error:", err);
        return next(createHttpError(500, "Authentication failed"));
      }
      
      if (!user) {
        console.log("[AUTH] Failed login attempt:", info?.message);
        return next(createHttpError(401, info?.message || "Invalid credentials"));
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          console.error("[AUTH] Session creation error:", loginErr);
          return next(createHttpError(500, "Failed to create session"));
        }
        
        // Save session explicitly
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[AUTH] Session save error:", saveErr);
            return next(createHttpError(500, "Failed to save session"));
          }
          
          console.log(`[AUTH] Session saved successfully. Session ID: ${req.sessionID}`);
          console.log(`[AUTH] User in session:`, req.user);
          
          const { password, ...userWithoutPassword } = user;
          // Map snake_case to camelCase for client compatibility
          const userForClient = {
            id: userWithoutPassword.id,
            username: userWithoutPassword.username,
            fullName: (userWithoutPassword as any).full_name,
            role: userWithoutPassword.role,
            is_active: (userWithoutPassword as any).is_active,
            created_at: (userWithoutPassword as any).created_at,
            updated_at: (userWithoutPassword as any).updated_at
          };
          console.log(`[AUTH] Successful login for user: ${user.username}`);
          res.status(200).json({
            status: 'success',
            message: 'Login successful',
            user: userForClient
          });
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({
        status: 'success',
        message: 'Already logged out'
      });
    }
    
    const username = req.user?.username || 'unknown';
    req.logout((err: Error | null) => {
      if (err) {
        console.error(`[AUTH] Logout error for ${username}:`, err);
        return next(createHttpError(500, "Logout failed"));
      }
      
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error(`[AUTH] Session destruction error for ${username}:`, destroyErr);
          return next(createHttpError(500, "Session cleanup failed"));
        }
        
        res.clearCookie('spaza.sid');
        console.log(`[AUTH] Successful logout for user: ${username}`);
        res.status(200).json({
          status: 'success',
          message: 'Logout successful'
        });
      });
    });
  });

  // Current user endpoint - FIXED
  app.get("/api/auth/user", (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`[AUTH] Current user request - isAuthenticated: ${req.isAuthenticated()}`);
      console.log(`[AUTH] Session ID: ${req.sessionID}`);
      console.log(`[AUTH] User object:`, req.user ? 'exists' : 'null');
      console.log(`[AUTH] Session data:`, req.session);
      console.log(`[AUTH] Cookies:`, req.headers.cookie);
      
      if (!req.isAuthenticated() || !req.user) {
        console.log(`[AUTH] User not authenticated`);
        return next(createHttpError(401, 'Not authenticated'));
      }
      
      const { password, ...userWithoutPassword } = req.user as SelectUser;
      // Map snake_case to camelCase for client compatibility
      const userForClient = {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        fullName: (userWithoutPassword as any).full_name,
        role: userWithoutPassword.role,
        is_active: (userWithoutPassword as any).is_active,
        created_at: (userWithoutPassword as any).created_at,
        updated_at: (userWithoutPassword as any).updated_at
      };
      console.log(`[AUTH] Returning user data for: ${req.user.username}`);
      res.json({
        status: 'success',
        user: userForClient
      });
    } catch (error) {
      console.error(`[AUTH] Error in /api/auth/user endpoint:`, error);
      next(error);
    }
  });

  // Authentication middleware for protected routes
  app.use('/api/protected', (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return next(createHttpError(401, 'Authentication required'));
    }
    next();
  });

  // Session health check endpoint
  app.get("/api/auth/status", (req: Request, res: Response) => {
    res.json({
      status: 'success',
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    });
  });

  // Test endpoint to verify server is working
  app.get("/api/test", (req: Request, res: Response) => {
    res.json({
      status: 'success',
      message: 'Server is working',
      timestamp: new Date().toISOString()
    });
  });

  // Error handling middleware - should be last
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? (err.expose !== false ? err.message : 'Internal Server Error')
      : err.message;
    
    console.error(`[ERROR] [${req.method} ${req.path}] ${status}:`, message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
    
    // Don't send response if headers already sent
    if (res.headersSent) {
      return next(err);
    }
    
    res.status(status).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });
}