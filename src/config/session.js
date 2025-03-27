const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./database');

// Session setup
const configureSession = () => {
  let sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax'
    }
  };

  // Try to use PostgreSQL session store, fall back to memory store if it fails
  try {
    sessionConfig.store = new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
    console.log('Using PostgreSQL session store');
  } catch (error) {
    console.error('Error setting up PostgreSQL session store:', error);
    console.log('Falling back to memory store for sessions');
    // Memory store is the default when no store is specified
  }

  // Log session configuration
  console.log('Session configuration:', {
    secret: sessionConfig.secret ? '[SECRET]' : undefined,
    resave: sessionConfig.resave,
    saveUninitialized: sessionConfig.saveUninitialized,
    cookie: {
      maxAge: sessionConfig.cookie.maxAge,
      httpOnly: sessionConfig.cookie.httpOnly,
      secure: sessionConfig.cookie.secure,
      sameSite: sessionConfig.cookie.sameSite
    },
    store: sessionConfig.store ? 'PostgreSQL' : 'Memory'
  });

  return sessionConfig;
};

module.exports = configureSession;
