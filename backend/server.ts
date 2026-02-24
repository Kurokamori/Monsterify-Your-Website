import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from './src/config/passport.js';
import { db } from './src/database/client.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './src/middleware/error.middleware.js';
import { CronService } from './src/services/cron.service.js';
import apiRoutes from './src/routes/routes.js';
import { initializeSocketIO } from './src/socket/chat.socket.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize cron service
const cronService = new CronService();

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
            connectSrc: ["'self'", "https://api.cloudinary.com", "wss:", "ws:"],
            frameSrc: ["'self'", "https://*.cloudinary.com", "https://*.youtube.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
        crossOriginEmbedderPolicy: false, 
        crossOriginResourcePolicy: { policy: "cross-origin" }, 
}));

// Configure CORS
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, origin?: string | boolean) => void) {
        if (!origin) {return callback(null, true);}

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:4000',
        ].filter(Boolean);

        if (process.env.NODE_ENV === 'production') {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, '');

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf(normalizedOrigin) !== -1) {
            callback(null, true);
        } else {
            console.warn('CORS blocked origin:', origin);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
    },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Session configuration
const PgStore = connectPgSimple(session);
app.use(session({
    store: new PgStore({
        pool: db.pool,
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve Static Content
app.use('/content', (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static(path.join(__dirname, '../content')));

// Serve Static Build (Vite builds to 'dist' directory)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../website/dist');
  app.use(express.static(buildPath));
}

// Use API routes
app.use('/api', apiRoutes);

// In production, serve Vite React app for all non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*catchAll', (_req, res) => {
    res.sendFile(path.join(__dirname, '../website/dist/index.html'));
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

app.use(notFound);
app.use(errorHandler);

// Set port
const PORT = process.env.PORT ?? 4888;

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
initializeSocketIO(httpServer);

async function startServer() {
    try {
        console.log('Database connection ready');

        // Start server
        httpServer.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);

          // Initialize cron jobs after server starts
          cronService.init();
        });

      } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    }

startServer();

export default app;