require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('./config/passport');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const cronService = require('./services/cronService');
const promptAutomationService = require('./services/promptAutomationService');
// const { initializeDatabase } = require('./db/init');
// const initLocationTables = require('./utils/initLocationTables');

// Initialize express app
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://cloudinary.com",
        "https://i.imgur.com",
        "https://i.ibb.co",
        "https://via.placeholder.com",
        "https://images.unsplash.com",
        "https://picsum.photos",
        "*" // Allow all image sources for now - can be restricted later
      ],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      frameSrc: ["'self'", "https://*.cloudinary.com", "https://*.youtube.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable COEP to allow cross-origin images
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
})); // Security headers

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production, allow any origin (since we're serving the frontend from the same domain)
    // In development, allow localhost and common variations
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:4890', // Backend port serving frontend
      'http://127.0.0.1:4890',
      'http://localhost:4891', // Additional ports
      'http://127.0.0.1:4891',
      process.env.FRONTEND_URL, // For custom frontend URL
    ].filter(Boolean); // Remove any undefined values

    // In production, allow the same origin as the backend
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    // Normalize origin by removing trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check both original origin and normalized origin
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // Enable CORS with options

// Additional CORS logging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from content directory with CORS headers
app.use('/content', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../content')));

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../website/build');
  app.use(express.static(buildPath));
}

// Import routes
const apiRoutes = require('./routes/apiRoutes');

// Use API routes
app.use('/api', apiRoutes);

// In production, serve React app for all non-API routes
if (process.env.NODE_ENV === 'production') {
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../website/build/index.html'));
  });
} else {
  // Root route for development
  app.get('/', (_req, res) => {
    res.json({
      message: 'Welcome to the Dusk and Dawn API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        content: '/api/content',
        trainers: '/api/trainers',
        monsters: '/api/monsters',
        statistics: '/api/statistics',
        fakedex: '/api/fakedex',
        submissions: '/api/submissions',
        guides: '/api/guides',
        admin: '/api/admin',
        pokemonMonsters: '/api/pokemon-monsters',
        digimonMonsters: '/api/digimon-monsters',
        yokaiMonsters: '/api/yokai-monsters',
        nexomonMonsters: '/api/nexomon-monsters',
        palsMonsters: '/api/pals-monsters',
        items: '/api/items',
        shops: '/api/shops',
        itemRoller: '/api/item-roller'
      }
    });
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Set port
const PORT = process.env.PORT || 4890;

// Initialize database and start server
async function startServer() {
  try {
    // Database tables already exist, skipping initialization
    console.log('Using existing database tables');

    // Skip location activity tables initialization as tables already exist
    // await initLocationTables();
    console.log('Database connection ready');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Initialize cron jobs after server starts
      cronService.init();

      // Initialize prompt automation service
      promptAutomationService.initialize().catch(error => {
        console.error('Failed to initialize prompt automation service:', error);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app; // Export for testing
