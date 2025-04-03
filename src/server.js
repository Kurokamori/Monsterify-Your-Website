const app = require('./config/app');
const { errorHandler, userToLocals } = require('./middleware');
const viewHelpers = require('./utils/viewHelpers');
const pool = require('./db');
const User = require('./models/User');
const { ShopConfig, DailyShopItems } = require('./models/ShopSystem');
const Item = require('./models/Item');

// Import route modules
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const townRoutes = require('./routes/town');
const trainersRoutes = require('./routes/trainers');
const monstersRoutes = require('./routes/monsters');
const adventuresRoutes = require('./routes/adventures');
const fakemonRoutes = require('./routes/fakemon');
const tasksRoutes = require('./routes/tasks');
const contentPagesRoutes = require('./routes/content-pages');
const tradeRoutes = require('./routes/trade');
const statisticsRoutes = require('./routes/statistics');
const apiRoutes = require('./routes/api');

// Set port
const PORT = process.env.PORT || 4890;

// Add view helpers to app.locals
app.locals = {
  ...app.locals,
  ...viewHelpers
};

// Add user to res.locals
app.use(userToLocals);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  next();
});

// Initialize database and create admin user if it doesn't exist
async function initializeApp() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    try {
      // Create admin user
      await User.initializeDatabase();

      // Initialize items
      await Item.initializeSampleItems();

      // Initialize shop system
      await ShopConfig.createTableIfNotExists();

      // Initialize shop items for today
      await DailyShopItems.initializeShopItems();

      console.log('Database initialized successfully');
    } catch (schemaError) {
      console.error('Error setting up schema or admin user:', schemaError);
      console.log('Continuing with application startup despite schema error');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    console.log('Continuing with application startup despite database connection error');
  }
}

// Run initialization
initializeApp();

// Use routes in correct order - more specific routes first
app.use('/admin', adminRoutes);
app.use('/admin/content', contentRoutes);
app.use('/api', apiRoutes);
app.use('/town/visit/trade', tradeRoutes);
app.use('/town', townRoutes);
app.use('/adventures', adventuresRoutes);
app.use('/trainers', trainersRoutes);
app.use('/monsters', monstersRoutes);
app.use('/fakedex', fakemonRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/tasks', tasksRoutes);

// Content pages routes
app.use('/', contentPagesRoutes);

// Auth routes
app.use('/', authRoutes);

// Index routes last
app.use('/', indexRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("Server running on port", PORT );
});

module.exports = app;
