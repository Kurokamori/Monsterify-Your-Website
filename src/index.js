const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const fs = require('fs');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const db = require('./db'); // Import database for direct queries
const {
  loadMarkdownContent,
  getContentCategories,
  createContentDirectory,
  saveContentFile,
  deleteContentFile,
  deleteContentDirectory,
  getRawContentFile
} = require('./utils/content-loader');
const {
  loadAllFakemon,
  getFakemonByNumber,
  saveFakemon,
  deleteFakemon,
  getNextFakemonNumber
} = require('./utils/fakemon-loader');
const AntiqueAppraisalService = require('./utils/AntiqueAppraisalService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const User = require('./models/User');
const Trainer = require('./models/Trainer');
const Monster = require('./models/Monster');
const Item = require('./models/Item');
const rewardRoutes = require('./routes/api/rewards');
const { ShopConfig, DailyShopItems, PlayerShopPurchases } = require('./models/ShopSystem');
const Pokemon = require('./models/Pokemon');
const Digimon = require('./models/Digimon');
const Yokai = require('./models/Yokai');
const Move = require('./models/Move');
const Task = require('./models/Task');
const Habit = require('./models/Habit');
const TaskTemplate = require('./models/TaskTemplate');
const Reminder = require('./models/Reminder');
const GardenHarvest = require('./models/GardenHarvest');
const MonsterRoller = require('./utils/MonsterRoller');
const MonsterInitializer = require('./utils/MonsterInitializer');
const EvolutionService = require('./utils/EvolutionService');
const RewardSystem = require('./utils/RewardSystem');
const Trade = require('./models/Trade');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 4890;

// Initialize database tables
async function initializeTables() {
  try {
    // Initialize garden harvests table
    await GardenHarvest.initTable();

    // Initialize adoption system tables
    const AdoptionService = require('./utils/AdoptionService');
    await AdoptionService.initialize();

    // Initialize prompt system tables
    const Prompt = require('./models/Prompt');
    const PromptCompletion = require('./models/PromptCompletion');
    await Prompt.createTableIfNotExists();
    await PromptCompletion.createTableIfNotExists();

    // Initialize trainer inventory table
    const ItemService = require('./utils/ItemService');
    await ItemService.createInventoryTableIfNotExists();

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize database tables
  await initializeTables();
});


// Import database pool
const pool = require('./db');

// Initialize database and create admin user if it doesn't exist
async function initializeApp() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    try {
      // Read schema file
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema
      await pool.query(schema);
      console.log('Schema created successfully');

      // Create admin user
      await User.initializeDatabase();

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

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Helper functions for views
app.locals.formatCategory = (category) => {
  const formatted = category.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

app.locals.getCategoryBadgeColor = (category) => {
  const categoryColors = {
    general: 'blue',
    potions: 'green',
    berries: 'pink',
    balls: 'red',
    evolution: 'purple',
    antiques: 'yellow',
    pastries: 'orange',
    items: 'teal',
    eggs: 'indigo',
    black_market: 'gray'
  };

  return categoryColors[category] || 'blue';
};

app.locals.getRarityBadgeColor = (rarity) => {
  if (rarity <= 2) return 'gray';
  if (rarity <= 4) return 'blue';
  if (rarity <= 6) return 'green';
  if (rarity <= 8) return 'purple';
  return 'gold';
};

// Other middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);

  // Check if the response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Check if the request is expecting JSON
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Server error',
      message: err.message || 'An unexpected error occurred'
    });
  }

  // For regular requests, send an HTML error page
  res.status(500).send(`
    <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .error { color: red; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Error</h1>
        <p class="error">${err.message || 'An unexpected error occurred'}</p>
        <pre>${err.stack || 'No stack trace available'}</pre>
        <p><a href="/">Return to Home</a></p>
      </body>
    </html>
  `);
});
app.use(express.urlencoded({ extended: true }));

// Session setup
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

app.use(session(sessionConfig));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// API endpoint for getting user's trainers is now handled by the API router

// Routes

app.get('/', async (req, res) => {
  try {
    // Get featured trainers (top 3 by monster count)
    let featuredTrainers = [];
    let totalTrainers = 0;
    let totalMonsters = 0;
    let totalUsers = 0;

    try {
      // Get all trainers
      const allTrainers = await Trainer.getAll();
      totalTrainers = allTrainers.length;

      // Sort by monster count and take top 3
      featuredTrainers = allTrainers
        .sort((a, b) => (b.monster_count || 0) - (a.monster_count || 0))
        .slice(0, 3);

      // Count total monsters
      totalMonsters = allTrainers.reduce((sum, trainer) => sum + (trainer.monster_count || 0), 0);

      // Get total users
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      totalUsers = parseInt(usersResult.rows[0].count) || 0;
    } catch (dbError) {
      console.error('Database error getting featured trainers:', dbError);
      // Continue with empty featured trainers
    }

    // Get all fakemon for the main page
    const allFakemon = loadAllFakemon();

    // Randomly select 8 fakemon to display
    const randomFakemon = [];
    if (allFakemon.length > 0) {
      const shuffled = [...allFakemon].sort(() => 0.5 - Math.random());
      randomFakemon.push(...shuffled.slice(0, 8));
    }

    // Get content categories for guides, locations, and factions
    const categories = getContentCategories();


    res.render('index', {
      title: 'Dusk and Dawn',
      featuredTrainers,
      totalTrainers,
      totalMonsters,
      totalUsers,
      totalSpecies: 1200, // Hardcoded for now
      randomFakemon,
      categories
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    res.status(500).render('error', {
      message: 'Error loading home page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Auth routes
app.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login - Dusk and Dawn',
    error: req.query.error
  });
});

// Handle login form submission
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.redirect('/login?error=' + encodeURIComponent('Username and password are required'));
    }

    // Find the user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid username or password'));
    }

    // Verify the password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid username or password'));
    }

    // Create a session
    req.session.user = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      discord_id: user.discord_id,
      is_admin: user.is_admin
    };

    console.log('User logged in:', user.id, user.username);
    console.log('Session after login:', req.session.id);

    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    return res.redirect('/login?error=' + encodeURIComponent('An error occurred during login. Please try again later.'));
  }
});

app.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Register - Dusk and Dawn',
    error: req.query.error
  });
});

// Handle registration form submission
app.post('/register', async (req, res) => {
  try {
    const { username, display_name, discord_id, password, confirm_password, terms } = req.body;

    // Basic validation
    if (!username || !password || !confirm_password) {
      return res.redirect('/register?error=' + encodeURIComponent('Username and password are required'));
    }

    if (!terms) {
      return res.redirect('/register?error=' + encodeURIComponent('You must agree to the Terms of Service'));
    }

    if (password !== confirm_password) {
      return res.redirect('/register?error=' + encodeURIComponent('Passwords do not match'));
    }

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.redirect('/register?error=' + encodeURIComponent('Username already exists'));
    }

    // If Discord ID is provided, check if it's already in use
    if (discord_id) {
      // Validate Discord ID format (should be a number with 17-19 digits)
      if (!/^\d{17,19}$/.test(discord_id)) {
        return res.redirect('/register?error=' + encodeURIComponent('Invalid Discord User ID format'));
      }

      const existingDiscordUser = await User.findByDiscordId(discord_id);
      if (existingDiscordUser) {
        return res.redirect('/register?error=' + encodeURIComponent('Discord ID is already linked to another account'));
      }
    }

    // Create the user
    const user = await User.create({
      username,
      display_name,
      discord_id,
      password
    });

    // Create a session
    req.session.user = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      discord_id: user.discord_id,
      is_admin: user.is_admin
    };

    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    return res.redirect('/register?error=' + encodeURIComponent('An error occurred during registration. Please try again later.'));
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin routes
app.get('/admin/dashboard', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    message: req.query.message
  });
});

// Admin User Management Routes
app.get('/admin/users', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get all users
    const users = await User.getAll();
    const message = req.query.message || '';
    const messageType = req.query.messageType || 'success';

    res.render('admin/users/index', {
      title: 'User Management',
      users,
      message,
      messageType,
      user_session: req.session.user
    });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).render('error', {
      message: 'Error loading users',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.get('/admin/users/add', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  res.render('admin/users/form', {
    title: 'Add New User',
    user: {
      username: '',
      display_name: '',
      discord_id: '',
      is_admin: false
    },
    isNew: true
  });
});

app.get('/admin/users/edit/:id', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect('/admin/users?messageType=error&message=' + encodeURIComponent('User not found'));
    }

    res.render('admin/users/form', {
      title: `Edit User: ${user.username}`,
      user,
      isNew: false
    });
  } catch (error) {
    console.error('Error loading user:', error);
    res.status(500).render('error', {
      message: 'Error loading user',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/users/save', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const {
      id,
      username,
      display_name,
      discord_id,
      password,
      is_admin,
      isNew
    } = req.body;

    // Validate required fields
    if (!username) {
      return res.redirect('/admin/users?messageType=error&message=' + encodeURIComponent('Username is required'));
    }

    if (isNew === 'true') {
      // Create new user
      if (!password) {
        return res.redirect('/admin/users/add?messageType=error&message=' + encodeURIComponent('Password is required for new users'));
      }

      await User.create({
        username,
        display_name: display_name || username,
        discord_id: discord_id || null,
        password,
        is_admin: is_admin === 'on'
      });

      return res.redirect('/admin/users?message=' + encodeURIComponent('User created successfully'));
    } else {
      // Update existing user
      await User.update(id, {
        username,
        display_name: display_name || username,
        discord_id: discord_id || null,
        password: password || undefined, // Only update password if provided
        is_admin: is_admin === 'on'
      });

      return res.redirect('/admin/users?message=' + encodeURIComponent('User updated successfully'));
    }
  } catch (error) {
    console.error('Error saving user:', error);
    return res.redirect('/admin/users?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

app.post('/admin/users/delete/:id', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const userId = req.params.id;

    // Don't allow deleting the current user
    if (parseInt(userId) === req.session.user.id) {
      return res.redirect('/admin/users?messageType=error&message=' + encodeURIComponent('You cannot delete your own account'));
    }

    await User.delete(userId);
    return res.redirect('/admin/users?message=' + encodeURIComponent('User deleted successfully'));
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.redirect('/admin/users?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Admin Content Management Routes
app.get('/admin/content', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const categories = getContentCategories();
  const message = req.query.message || '';
  const messageType = req.query.messageType || 'success';

  res.render('admin/content/index', {
    title: 'Content Management',
    categories,
    message,
    messageType
  });
});

app.get('/admin/content/:category', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const category = req.params.category;
  const parentPath = req.query.path || '';
  const categories = getContentCategories();

  if (!categories[category]) {
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
  }

  const message = req.query.message || '';
  const messageType = req.query.messageType || 'success';

  res.render('admin/content/category', {
    title: `${categories[category].name} Content`,
    category,
    categoryData: categories[category],
    categories,
    parentPath,
    message,
    messageType
  });
});

app.get('/admin/content/:category/add', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const category = req.params.category;
  const categories = getContentCategories();

  if (!categories[category]) {
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
  }

  const parentPath = req.query.parent || '';

  res.render('admin/content/form', {
    title: `Add New ${categories[category].name} Content`,
    category,
    categoryData: categories[category],
    content: {
      title: '',
      content: '# New Content\n\nEnter your content here...',
      path: ''
    },
    parentPath,
    isNew: true
  });
});

app.get('/admin/content/:category/edit', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const category = req.params.category;
  const contentPath = req.query.path;
  const parentPath = path.dirname(contentPath) !== '.' ? path.dirname(contentPath) : '';

  if (!contentPath) {
    return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Content path is required'));
  }

  const categories = getContentCategories();

  if (!categories[category]) {
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
  }

  // Get the raw content using our utility function
  const rawContent = getRawContentFile(category, path.basename(contentPath), parentPath);

  if (!rawContent) {
    return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Content not found'));
  }

  // Extract title from the first heading
  const titleMatch = rawContent.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1] : path.basename(contentPath, '.md');

  res.render('admin/content/form', {
    title: `Edit ${categories[category].name} Content`,
    category,
    categoryData: categories[category],
    content: {
      title: title,
      content: rawContent,
      path: path.basename(contentPath)
    },
    parentPath,
    isNew: false
  });
});

app.post('/admin/content/save', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const {
      category,
      title,
      content,
      path: contentPath,
      parentPath,
      isNew,
      originalPath
    } = req.body;

    // Validate required fields
    if (!category || !title || !content) {
      return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Category, title, and content are required'));
    }

    const categories = getContentCategories();

    if (!categories[category]) {
      return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
    }

    // Ensure the content starts with the title as a heading
    let finalContent = content;
    if (!content.startsWith(`# ${title}`)) {
      finalContent = `# ${title}\n\n${content}`;
    }

    let success;

    if (isNew === 'true') {
      // Save new content
      success = saveContentFile(category, contentPath, finalContent, parentPath);
    } else {
      // Update existing content
      success = saveContentFile(category, originalPath || contentPath, finalContent, parentPath);
    }

    if (!success) {
      return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Failed to save content'));
    }

    const redirectUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}message=` + encodeURIComponent(`Content ${isNew === 'true' ? 'created' : 'updated'} successfully`);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error saving content:', error);
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Delete file route
app.post('/admin/content/:category/delete-file', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const category = req.params.category;
    const { filePath, parentPath } = req.body;

    // Validate required fields
    if (!category || !filePath) {
      return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Category and file path are required'));
    }

    const categories = getContentCategories();

    if (!categories[category]) {
      return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
    }

    // Delete the file using our utility function
    const success = deleteContentFile(category, filePath, parentPath);

    if (!success) {
      const errorUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}messageType=error&message=` + encodeURIComponent('Failed to delete file');
      return res.redirect(errorUrl);
    }

    const successUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}message=` + encodeURIComponent('File deleted successfully');
    return res.redirect(successUrl);
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Delete directory route
app.post('/admin/content/:category/delete-directory', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const category = req.params.category;
    const { directoryPath, parentPath } = req.body;

    // Validate required fields
    if (!category || !directoryPath) {
      return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Category and directory path are required'));
    }

    const categories = getContentCategories();

    if (!categories[category]) {
      return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
    }

    // Delete the directory using our utility function
    const success = deleteContentDirectory(category, directoryPath, parentPath);

    if (!success) {
      const errorUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}messageType=error&message=` + encodeURIComponent('Failed to delete directory');
      return res.redirect(errorUrl);
    }

    const successUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}message=` + encodeURIComponent('Directory deleted successfully');
    return res.redirect(successUrl);
  } catch (error) {
    console.error('Error deleting directory:', error);
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Add category route
app.post('/admin/content/:category/add-category', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const category = req.params.category;
    const { categoryName, categoryTitle, parentPath } = req.body;

    // Validate required fields
    if (!category || !categoryName || !categoryTitle) {
      return res.redirect(`/admin/content/${category}?messageType=error&message=` + encodeURIComponent('Category name and title are required'));
    }

    const categories = getContentCategories();

    if (!categories[category]) {
      return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Category not found'));
    }

    // Create the directory using our utility function
    const success = createContentDirectory(category, categoryName, categoryTitle, parentPath);

    if (!success) {
      const errorUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}messageType=error&message=` + encodeURIComponent('Failed to create category');
      return res.redirect(errorUrl);
    }

    const successUrl = `/admin/content/${category}${parentPath ? '?path=' + parentPath + '&' : '?'}message=` + encodeURIComponent('Category created successfully');
    return res.redirect(successUrl);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.redirect('/admin/content?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Admin route to recalculate monster counts
app.get('/admin/recalculate-monster-counts', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get all trainers
    const trainers = await Trainer.getAll();

    // Redirect back to admin dashboard
    res.redirect('/admin/dashboard?message=' + encodeURIComponent('Monster counts recalculated successfully'));
  } catch (error) {
    console.error('Error recalculating monster counts:', error);
    res.status(500).render('error', {
      message: 'Error recalculating monster counts',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Town and Shop Routes
app.get('/town', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Render the town view with fixed shops
  res.render('town', {
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/shop/:shopId', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;
    const playerId = req.session.user.discord_id;

    console.log(`Shop request: shopId=${shopId}`);

    // Validate that shopId is a valid shop ID
    if (!shopId || typeof shopId !== 'string') {
      console.error(`Invalid shop ID: ${shopId}`);
      return res.redirect('/town?messageType=error&message=' + encodeURIComponent('Invalid shop ID'));
    }

    // If shopId is an emoji (starts with <:), redirect to the appropriate shop
    if (shopId.includes('<:')) {
      console.log(`Emoji detected in shop ID: ${shopId}, redirecting to apothecary`);
      return res.redirect('/town/shop/apothecary');
    }

    if (!playerId) {
      console.error('No Discord ID found for user');
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to access the shop',
        error: { status: 403 },
        title: 'Error'
      });
    }

    // Get shop information
    console.log(`Getting shop information for shop ID: ${shopId}`);
    const shop = await ShopConfig.getById(shopId);
    console.log('Shop information:', shop);

    if (!shop) {
      console.error(`Shop not found: ${shopId}`);
      return res.status(404).render('error', {
        message: 'Shop not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Get all trainers for the user
    console.log(`Getting trainers for Discord ID: ${playerId}`);
    const userTrainers = await Trainer.getByUserId(playerId);
    console.log(`Found ${userTrainers ? userTrainers.length : 0} trainers for user`);

    if (!userTrainers || userTrainers.length === 0) {
      console.log('No trainers found, redirecting to /add_trainer');
      return res.redirect('/add_trainer');
    }

    // Get selected trainer if trainer_id is provided
    let trainer = null;
    if (req.query.trainer_id) {
      trainer = userTrainers.find(t => t.id === parseInt(req.query.trainer_id));
    }

    // If no trainer is selected or the selected trainer doesn't belong to the user, select the first one
    if (!trainer) {
      trainer = userTrainers[0];
    }

    // Get shop items for today with player-specific remaining quantities
    console.log(`Getting shop items for shop ID: ${shopId} and player ${playerId}`);
    // First get the shop items without player ID to get the max quantities
    let shopItems = await DailyShopItems.getShopItems(shopId);
    console.log(`Found ${shopItems ? shopItems.length : 0} items for shop ${shopId}:`, shopItems);

    // If no items are found, automatically restock the shop
    if (!shopItems || shopItems.length === 0) {
      console.log(`No items found for shop ${shopId}, automatically restocking...`);
      try {
        const restockResult = await DailyShopItems.restockShop(shopId);
        console.log(`Restock result: ${restockResult ? 'Success' : 'Failed'}`);
        if (restockResult) {
          // Get shop items without player ID first to get max quantities
          shopItems = await DailyShopItems.getShopItems(shopId);
          console.log(`After restock: Found ${shopItems ? shopItems.length : 0} items for shop ${shopId}`);
        } else {
          console.log(`Restock failed for shop ${shopId}, continuing with empty shop`);
          shopItems = [];
        }
      } catch (error) {
        console.error(`Error restocking shop ${shopId}:`, error);
        shopItems = [];
      }
    }

    // Get fresh remaining quantities for each item
    const itemsWithQuantities = await Promise.all(shopItems.map(async item => {
      // Get the latest remaining quantity for this item
      console.log(`Getting fresh remaining quantity for player ${playerId}, shop ${shopId}, item ${item.item_id}`);
      const remainingQuantity = await DailyShopItems.getRemainingQuantity(
        playerId,
        shopId,
        item.item_id
      );

      // Get the max quantity directly from the item
      const maxQuantity = parseInt(item.max_quantity) || 1;

      console.log(`Item ${item.item_id} fresh remaining quantity: ${remainingQuantity}/${maxQuantity}`);

      return {
        ...item,
        remaining_quantity: remainingQuantity,
        remaining: remainingQuantity,
        max_quantity: maxQuantity,
        purchaseLimit: maxQuantity
      };
    }));
    console.log('Items with fresh quantities:', itemsWithQuantities);

    // Determine if shop was automatically restocked
    const wasRestocked = req.query.message ? req.query.message :
      (shopItems.length > 0 && !req.query.message ? 'Shop has been automatically restocked with new items!' : '');
    const messageType = req.query.messageType || 'success';

    console.log('Rendering shop page with data:', {
      shop: shop.name,
      trainer: trainer.name,
      itemCount: itemsWithQuantities.length,
      message: wasRestocked
    });

    res.render('shop', {
      shop,
      trainer: trainer,
      trainers: userTrainers,
      items: itemsWithQuantities,
      message: wasRestocked,
      messageType: messageType
    });
  } catch (error) {
    console.error(`Error loading shop ${req.params.shopId}:`, error);
    res.status(500).render('error', {
      message: 'Error loading shop',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.get('/town/shop/:shopId/restock', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;

    console.log(`Force restocking shop ${shopId}...`);

    // Restock the shop
    const result = await DailyShopItems.restockShop(shopId);

    console.log(`Restock result:`, result);

    // Redirect back to the shop
    return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent('Shop restocked successfully!')}&messageType=success`);
  } catch (error) {
    console.error(`Error restocking shop ${req.params.shopId}:`, error);
    return res.redirect(`/town/shop/${req.params.shopId}?message=${encodeURIComponent('Error restocking shop: ' + error.message)}&messageType=error`);
  }
});

// Simple route to fix prices with direct price generation
app.get('/town/shop/:shopId/fix-prices', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;
    console.log(`Direct price generation for shop ${shopId}...`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Define base prices for different item categories and rarities
    const basePrices = {
      // Common items by category
      BERRIES: { min: 500, max: 1500 },
      PASTRIES: { min: 800, max: 2000 },
      ITEMS: { min: 1000, max: 3000 },
      EVOLUTION: { min: 2000, max: 5000 },
      ANTIQUE: { min: 3000, max: 8000 },
      BALLS: { min: 1500, max: 4000 },

      // Rarity multipliers
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      'ultra rare': 4.0,
      legendary: 8.0,

      // Special items with fixed base prices
      specialItems: {
        'Daycare Daypass': 5000,
        'Gold Bottle Cap': 7500,
        'Z-Crystal': 6000,
        'Charge Capsule': 3500,
        'Scroll of Secrets': 8000,
        'Legacy Leeway': 5000
      }
    };

    // Shop-specific multipliers
    const shopMultipliers = {
      general: { min: 0.8, max: 1.2 },
      apothecary: { min: 0.9, max: 1.3 },
      bakery: { min: 0.7, max: 1.1 },
      boutique: { min: 1.0, max: 1.5 },
      nursery: { min: 1.1, max: 1.6 },
      antiques: { min: 1.2, max: 1.8 }
    };

    // Get the shop multiplier range
    const shopMultiplier = shopMultipliers[shopId] || { min: 0.9, max: 1.4 };

    // Get all items in the shop for today
    const itemsQuery = `
      SELECT dsi.*, i.name, i.category, i.rarity
      FROM daily_shop_items dsi
      JOIN items i ON dsi.item_id = i.name
      WHERE dsi.shop_id = $1 AND dsi.date = $2
    `;

    const itemsResult = await db.query(itemsQuery, [shopId, today]);
    console.log(`Found ${itemsResult.rows.length} items in shop ${shopId} for ${today}`);

    if (itemsResult.rows.length === 0) {
      // No items found, try to restock first
      console.log(`No items found, restocking shop ${shopId}...`);
      await DailyShopItems.restockShop(shopId);

      // Try again to get items
      const newItemsResult = await db.query(itemsQuery, [shopId, today]);
      console.log(`After restock: Found ${newItemsResult.rows.length} items`);

      if (newItemsResult.rows.length === 0) {
        return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent('No items found to fix prices even after restocking')}&messageType=warning`);
      }

      // Use the new items
      itemsResult.rows = newItemsResult.rows;
    }

    // Update prices for each item
    let updatedCount = 0;

    for (const item of itemsResult.rows) {
      try {
        let basePrice;
        const itemName = item.name || item.item_id;
        const category = item.category || 'ITEMS';
        const rarity = (item.rarity || 'common').toLowerCase();

        // Check if it's a special item with a fixed base price
        if (basePrices.specialItems[itemName]) {
          basePrice = basePrices.specialItems[itemName];
          console.log(`Using special item base price for ${itemName}: ${basePrice}`);
        } else {
          // Get base price range for the category
          const categoryRange = basePrices[category] || basePrices.ITEMS;

          // Generate a random base price within the category range
          const randomBasePrice = Math.floor(Math.random() * (categoryRange.max - categoryRange.min + 1)) + categoryRange.min;

          // Apply rarity multiplier
          const rarityMultiplier = basePrices[rarity] || 1.0;
          basePrice = Math.round(randomBasePrice * rarityMultiplier);

          console.log(`Generated base price for ${itemName}: category=${category}, rarity=${rarity}, basePrice=${basePrice}`);
        }

        // Apply shop-specific multiplier
        const multiplier = Math.random() * (shopMultiplier.max - shopMultiplier.min) + shopMultiplier.min;

        // Calculate final price
        const newPrice = Math.max(100, Math.round(basePrice * multiplier));

        console.log(`Updating ${itemName}: basePrice=${basePrice}, shopMultiplier=${multiplier.toFixed(2)}, finalPrice=${newPrice}`);

        // Update the price in the database
        const updateQuery = `
          UPDATE daily_shop_items
          SET price = $1
          WHERE id = $2
          RETURNING *
        `;

        const updateResult = await db.query(updateQuery, [newPrice, item.id]);

        if (updateResult.rows.length > 0) {
          updatedCount++;
        }
      } catch (itemError) {
        console.error(`Error updating price for item ${item.item_id || item.name}:`, itemError);
      }
    }

    console.log(`Successfully updated prices for ${updatedCount} out of ${itemsResult.rows.length} items`);

    // Redirect back to the shop
    return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent(`Successfully updated prices for ${updatedCount} items`)}&messageType=success`);
  } catch (error) {
    console.error(`Error fixing prices for shop ${req.params.shopId}:`, error);
    return res.redirect(`/town/shop/${req.params.shopId}?message=${encodeURIComponent('Error fixing prices: ' + error.message)}&messageType=error`);
  }
});

// New route to fix prices for a shop - DIRECT METHOD
app.get('/town/shop/:shopId/fix-prices-direct', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;
    console.log(`Fixing prices for shop ${shopId}...`);

    // Get shop configuration
    const shop = await ShopConfig.getById(shopId);
    if (!shop) {
      throw new Error(`Shop ${shopId} not found`);
    }
    console.log(`Shop details:`, shop);

    // Get current shop items
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's date: ${today}`);

    // First, check if there are any items in the shop for today
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM daily_shop_items
      WHERE shop_id = $1 AND date = $2
    `;
    const checkResult = await db.query(checkQuery, [shopId, today]);
    const itemCount = parseInt(checkResult.rows[0].count);
    console.log(`Direct DB query found ${itemCount} items for shop ${shopId} on ${today}`);

    // If no items, try to restock the shop first
    if (itemCount === 0) {
      console.log(`No items found for shop ${shopId}, restocking first...`);
      await DailyShopItems.restockShop(shopId);
      console.log(`Shop ${shopId} restocked, now getting items...`);
    }

    // Get shop items using the model method
    const shopItems = await DailyShopItems.getShopItems(shopId, today);
    console.log(`Found ${shopItems ? shopItems.length : 0} items for shop ${shopId} using model method`);

    // If still no items, try a direct query
    if (!shopItems || shopItems.length === 0) {
      console.log(`Still no items found using model method, trying direct query...`);
      const directQuery = `
        SELECT dsi.*, i.name as item_name, i.effect as item_description,
               COALESCE(i.icon, 'https://via.placeholder.com/150') as item_image,
               i.rarity as item_rarity, i.category as item_type, i.base_price
        FROM daily_shop_items dsi
        JOIN items i ON dsi.item_id = i.name
        WHERE dsi.shop_id = $1 AND dsi.date = $2
      `;
      const directResult = await db.query(directQuery, [shopId, today]);
      console.log(`Direct query found ${directResult.rows.length} items`);

      if (directResult.rows.length === 0) {
        return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent('No items found to fix prices even after restocking')}&messageType=warning`);
      }

      // Use the direct query results
      const directItems = directResult.rows;

      // Update prices for each item from direct query
      const directUpdatePromises = directItems.map(async (item) => {
        try {
          // Use the base_price from the joined query
          const basePrice = item.base_price ? parseInt(item.base_price) : 1000;
          const multiplier = Math.random() * (shop.price_multiplier_max - shop.price_multiplier_min) + shop.price_multiplier_min;
          const newPrice = Math.max(100, Math.round(basePrice * multiplier));

          console.log(`Updating price for ${item.item_id}: basePrice=${basePrice}, multiplier=${multiplier}, newPrice=${newPrice}`);

          // Update the price in the database
          const updateQuery = `
            UPDATE daily_shop_items
            SET price = $1
            WHERE shop_id = $2 AND item_id = $3 AND date = $4
            RETURNING *
          `;

          const updateResult = await db.query(updateQuery, [newPrice, shopId, item.item_id, today]);
          console.log(`Update result:`, updateResult.rows[0]);
          return updateResult.rows[0];
        } catch (itemError) {
          console.error(`Error updating price for item ${item.item_id}:`, itemError);
          return null;
        }
      });

      const directUpdateResults = await Promise.all(directUpdatePromises);
      const directSuccessCount = directUpdateResults.filter(result => result !== null).length;

      console.log(`Successfully updated prices for ${directSuccessCount} out of ${directItems.length} items using direct query`);

      return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent(`Successfully updated prices for ${directSuccessCount} items`)}&messageType=success`);
    }

    // Update prices for each item using the model method results
    const updatePromises = shopItems.map(async (item) => {
      try {
        console.log(`Processing item:`, item);

        // Get the item details from the database
        const itemDetails = await Item.getById(item.item_id);
        console.log(`Item details for ${item.item_id}:`, itemDetails);

        if (!itemDetails) {
          console.warn(`No item details found for ${item.item_id}`);
          return null;
        }

        // Use a default base price if none is found
        const basePrice = itemDetails.base_price ? parseInt(itemDetails.base_price) : 1000;
        console.log(`Base price for ${item.item_id}: ${basePrice} (type: ${typeof basePrice})`);

        const multiplier = Math.random() * (shop.price_multiplier_max - shop.price_multiplier_min) + shop.price_multiplier_min;
        const newPrice = Math.max(100, Math.round(basePrice * multiplier));

        console.log(`Updating price for ${item.item_id}: basePrice=${basePrice}, multiplier=${multiplier}, newPrice=${newPrice}`);

        // Update the price in the database
        const updateQuery = `
          UPDATE daily_shop_items
          SET price = $1
          WHERE shop_id = $2 AND item_id = $3 AND date = $4
          RETURNING *
        `;

        const updateResult = await db.query(updateQuery, [newPrice, shopId, item.item_id, today]);
        console.log(`Update result for ${item.item_id}:`, updateResult.rows[0]);
        return updateResult.rows[0];
      } catch (itemError) {
        console.error(`Error updating price for item ${item.item_id}:`, itemError);
        return null;
      }
    });

    const updateResults = await Promise.all(updatePromises);
    const successCount = updateResults.filter(result => result !== null).length;

    console.log(`Successfully updated prices for ${successCount} out of ${shopItems.length} items`);

    // Redirect back to the shop
    return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent(`Successfully updated prices for ${successCount} items`)}&messageType=success`);
  } catch (error) {
    console.error(`Error fixing prices for shop ${req.params.shopId}:`, error);
    return res.redirect(`/town/shop/${req.params.shopId}?message=${encodeURIComponent('Error fixing prices: ' + error.message)}&messageType=error`);
  }
});

app.post('/town/shop/:shopId/purchase', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;
    const { item_id, quantity, trainer_id } = req.body;
    const playerId = req.session.user.discord_id;

    console.log(`Purchase request: shopId=${shopId}, item_id=${item_id}, quantity=${quantity}, trainer_id=${trainer_id}`);

    // Validate that shopId is a valid shop ID
    if (!shopId || typeof shopId !== 'string') {
      console.error(`Invalid shop ID: ${shopId}`);
      return res.redirect('/town?messageType=error&message=' + encodeURIComponent('Invalid shop ID'));
    }

    // If shopId is an emoji (starts with <:), redirect to the appropriate shop
    if (shopId.includes('<:')) {
      const itemId = shopId;
      console.log(`Emoji detected in shop ID: ${shopId}, redirecting to apothecary`);
      return res.redirect('/town/shop/apothecary');
    }

    if (!playerId) {
      console.error('No Discord ID found for user');
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to make purchases',
        error: { status: 403 },
        title: 'Error'
      });
    }

    // Validate inputs
    if (!item_id || !quantity || !trainer_id) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Item ID, quantity, and trainer are required')}`);
    }

    const parsedQuantity = parseInt(quantity);
    const parsedTrainerId = parseInt(trainer_id);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Quantity must be a positive number')}`);
    }

    if (isNaN(parsedTrainerId) || parsedTrainerId <= 0) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Invalid trainer selected')}`);
    }

    // Get shop information
    console.log(`Getting shop information for shop ID: ${shopId}`);
    const shop = await ShopConfig.getById(shopId);
    console.log('Shop information:', shop);

    if (!shop) {
      console.error(`Shop not found: ${shopId}`);
      return res.status(404).render('error', {
        message: 'Shop not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Get all trainers for the user
    console.log(`Getting trainers for Discord ID: ${playerId}`);
    const userTrainers = await Trainer.getByUserId(playerId);
    console.log(`Found ${userTrainers ? userTrainers.length : 0} trainers for user`);

    if (!userTrainers || userTrainers.length === 0) {
      console.log('No trainers found, redirecting to /add_trainer');
      return res.redirect('/add_trainer');
    }

    // Find the selected trainer
    const trainer = userTrainers.find(t => t.id === parsedTrainerId);

    // Verify that the selected trainer belongs to the user
    if (!trainer) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Invalid trainer selected')}`);
    }

    // Get item information with player-specific remaining quantity
    // First get the item details
    const item = await DailyShopItems.getShopItem(shopId, item_id);
    console.log(`Item details:`, item);

    if (!item) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Item not available in this shop')}`);
    }

    // Get the max quantity from the item
    const maxQuantity = parseInt(item.max_quantity) || 1;

    // Get the latest remaining quantity directly to ensure it's up-to-date
    console.log(`Getting remaining quantity for player ${playerId}, shop ${shopId}, item ${item_id}`);
    const remainingQuantity = await DailyShopItems.getRemainingQuantity(
      playerId,
      shopId,
      item_id
    );
    console.log(`Current remaining quantity for ${item_id}: ${remainingQuantity}/${maxQuantity}`);

    console.log(`Checking if ${parsedQuantity} <= ${remainingQuantity}`);
    if (remainingQuantity < parsedQuantity) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent(`Only ${remainingQuantity} of this item available for purchase`)}`);
    }

    // Calculate total price
    const totalPrice = item.price * parsedQuantity;

    // Check if the player has enough currency
    if (trainer.currency_amount < totalPrice) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Not enough coins to make this purchase')}`);
    }

    // Record the purchase
    console.log(`Recording purchase: player=${playerId}, shop=${shopId}, item=${item_id}, quantity=${parsedQuantity}`);
    try {
      await PlayerShopPurchases.recordPurchase(
        playerId,
        shopId,
        item_id,
        parsedQuantity
      );
      console.log('Purchase recorded successfully');
    } catch (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Error recording purchase: ' + purchaseError.message)}`);
    }

    // Determine the inventory category based on the shop ID
    let inventoryCategory;

    // Map shop ID to inventory category
    switch(shopId) {
      case 'apothecary':
        inventoryCategory = 'inv_berries';
        break;
      case 'bakery':
        inventoryCategory = 'inv_pastries';
        break;
      case 'witchs_hut':
        inventoryCategory = 'inv_evolution';
        break;
      case 'megamart':
        inventoryCategory = 'inv_balls';
        break;
      case 'antique_shop':
        inventoryCategory = 'inv_antiques';
        break;
      case 'nursery':
        inventoryCategory = 'inv_eggs';
        break;
      case 'pirates_dock':
        inventoryCategory = 'inv_helditems';
        break;
      default:
        inventoryCategory = 'inv_items';
        break;
    }

    console.log(`Using inventory category ${inventoryCategory} for shop ${shopId}`);
    console.log(`Adding ${parsedQuantity} ${item_id} to ${trainer.name}'s ${inventoryCategory}`);

    // Update the trainer's inventory with the correct category using the direct method
    try {
      const success = await Trainer.addItemDirectly(
        trainer.id,
        inventoryCategory,
        item_id,
        parsedQuantity
      );

      if (!success) {
        console.error('Failed to add item to inventory');
        return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Failed to add item to inventory')}`);
      }
      console.log('Item added to inventory successfully');
    } catch (inventoryError) {
      console.error('Error updating inventory:', inventoryError);
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Error updating inventory: ' + inventoryError.message)}`);
    }

    // Update trainer's currency
    console.log(`Updating trainer currency: trainer_id=${trainer.id}, current=${trainer.currency_amount}, price=${totalPrice}, new=${trainer.currency_amount - totalPrice}`);
    try {
      // Get the latest trainer data to ensure we have the updated inventory
      const latestTrainer = await Trainer.getById(trainer.id);
      if (!latestTrainer) {
        throw new Error(`Trainer with ID ${trainer.id} not found`);
      }

      console.log('Latest trainer data retrieved for currency update');

      // Only update the currency amount, not the entire trainer object
      const currencyUpdate = {
        currency_amount: latestTrainer.currency_amount - totalPrice
      };

      await Trainer.update(trainer.id, currencyUpdate);
      console.log('Trainer currency updated successfully');
    } catch (currencyError) {
      console.error('Error updating trainer currency:', currencyError);
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Error updating trainer currency: ' + currencyError.message)}`);
    }

    // Redirect back to the shop with success message and a timestamp to force a refresh
    const timestamp = Date.now();
    return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent(`Successfully purchased ${parsedQuantity} ${item.item_name}(s) for ${totalPrice} coins`)}&t=${timestamp}`);
  } catch (error) {
    console.error(`Error purchasing item from shop ${shopId}:`, error);
    // Always redirect back to the original shop ID, not the item ID
    const timestamp = Date.now();
    return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Error purchasing item: ' + error.message)}&t=${timestamp}`);
  }
});

// Admin level manager routes
app.get('/admin/level-manager', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get all trainers
    const trainers = await Trainer.getAll();

    // Get all monsters
    const monsters = [];
    for (const trainer of trainers) {
      const trainerMonsters = await Monster.getByTrainerId(trainer.id);
      monsters.push(...trainerMonsters);
    }

    res.render('admin/level-manager', {
      title: 'Level Manager',
      trainers,
      monsters,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading level manager:', error);
    res.status(500).render('error', {
      message: 'Error loading level manager',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/level-manager/trainer', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const { trainer_id, levels, coins, reason } = req.body;

    // Validate inputs
    if (!trainer_id || !levels) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Trainer ID and levels are required'));
    }

    // Parse levels and coins as integers
    const parsedLevels = parseInt(levels);
    const parsedCoins = parseInt(coins) || parsedLevels * 50; // Default to 50 coins per level

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Levels must be a positive number'));
    }

    // Get the trainer
    const trainer = await Trainer.getById(trainer_id);
    if (!trainer) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Trainer not found'));
    }

    // Update trainer levels and coins
    const updatedTrainer = {
      ...trainer,
      level: trainer.level + parsedLevels,
      currency_amount: trainer.currency_amount + parsedCoins,
      total_earned_currency: trainer.total_earned_currency + parsedCoins
    };

    // Save the updated trainer
    await Trainer.update(trainer_id, updatedTrainer);

    // Log the action
    console.log(`Admin ${req.session.user.username} added ${parsedLevels} levels and ${parsedCoins} coins to trainer ${trainer.name} (ID: ${trainer_id})`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    // Redirect back to level manager with success message
    return res.redirect('/admin/level-manager?message=' + encodeURIComponent(`Successfully added ${parsedLevels} levels and ${parsedCoins} coins to trainer ${trainer.name}`));
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Error adding levels to trainer: ' + error.message));
  }
});

app.post('/admin/level-manager/monster', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const { monster_id, levels, coins, reason } = req.body;

    // Validate inputs
    if (!monster_id || !levels) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Monster ID and levels are required'));
    }

    // Parse levels and coins as integers
    const parsedLevels = parseInt(levels);
    const parsedCoins = parseInt(coins) || parsedLevels * 50; // Default to 50 coins per level

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Levels must be a positive number'));
    }

    // Get the monster
    const monster = await Monster.getById(monster_id);
    if (!monster) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Monster not found'));
    }

    // Get the trainer who owns the monster
    const trainer = await Trainer.getById(monster.trainer_id);
    if (!trainer) {
      return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Trainer not found'));
    }

    // Calculate new level
    const newLevel = monster.level + parsedLevels;

    // Calculate new stats based on the new level
    const baseStats = MonsterInitializer.calculateBaseStats(newLevel);

    // Get current moveset
    let currentMoves = [];
    try {
      if (monster.moveset) {
        currentMoves = JSON.parse(monster.moveset);
      }
    } catch (movesetError) {
      console.error(`Error parsing current moveset for monster ${monster_id}:`, movesetError);
      currentMoves = [];
    }

    // Calculate how many moves the monster should have based on new level
    const oldMoveCount = Math.max(1, Math.floor(monster.level / 5) + 1);
    const newMoveCount = Math.max(1, Math.floor(newLevel / 5) + 1);

    // If the monster should learn new moves, get them
    let updatedMoves = [...currentMoves];
    if (newMoveCount > oldMoveCount) {
      try {
        // Get new moves
        const newMoves = await MonsterInitializer.getMovesForMonster(monster, newMoveCount - oldMoveCount);

        // Add new moves to the moveset
        updatedMoves = [...currentMoves, ...newMoves];
      } catch (moveError) {
        console.error(`Error getting new moves for monster ${monster_id}:`, moveError);
        // Continue with current moves if there's an error
      }
    }

    // Update monster with new level, stats, and moves
    const updatedMonster = {
      ...monster,
      level: newLevel,
      ...baseStats,
      moveset: JSON.stringify(updatedMoves)
    };

    // Update trainer coins
    const updatedTrainer = {
      ...trainer,
      currency_amount: trainer.currency_amount + parsedCoins,
      total_earned_currency: trainer.total_earned_currency + parsedCoins
    };

    // Save the updated monster and trainer
    await Monster.update(monster_id, updatedMonster);
    await Trainer.update(trainer.id, updatedTrainer);

    // Log the action
    console.log(`Admin ${req.session.user.username} added ${parsedLevels} levels to monster ${monster.name} (ID: ${monster_id}) and ${parsedCoins} coins to trainer ${trainer.name}`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    // Redirect back to level manager with success message
    return res.redirect('/admin/level-manager?message=' + encodeURIComponent(`Successfully added ${parsedLevels} levels to monster ${monster.name} and ${parsedCoins} coins to trainer ${trainer.name}`));
  } catch (error) {
    console.error('Error adding levels to monster:', error);
    return res.redirect('/admin/level-manager?messageType=error&message=' + encodeURIComponent('Error adding levels to monster: ' + error.message));
  }
});

// Admin inventory manager routes
app.get('/admin/inventory-manager', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get all trainers
    const trainers = await Trainer.getAll();

    // Get selected trainer if any
    let selectedTrainer = null;
    let inventory = null;

    if (req.query.trainer_id) {
      selectedTrainer = await Trainer.getById(req.query.trainer_id);
      if (selectedTrainer) {
        inventory = await Trainer.getInventory(selectedTrainer.id);
      }
    }

    res.render('admin/inventory-manager', {
      title: 'Inventory Manager',
      trainers,
      selectedTrainer,
      inventory,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading inventory manager:', error);
    res.status(500).render('error', {
      message: 'Error loading inventory manager',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/inventory-manager/update', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const { trainer_id, category, item_name, quantity } = req.body;

    // Validate inputs
    if (!trainer_id || !category || !item_name || !quantity) {
      return res.redirect('/admin/inventory-manager?messageType=error&message=' + encodeURIComponent('All fields are required'));
    }

    // Update inventory
    const success = await Trainer.updateInventoryItem(
      trainer_id,
      category,
      item_name,
      parseInt(quantity)
    );

    if (!success) {
      return res.redirect(`/admin/inventory-manager?trainer_id=${trainer_id}&messageType=error&message=` + encodeURIComponent('Failed to update inventory'));
    }

    // Redirect back to inventory manager
    res.redirect(`/admin/inventory-manager?trainer_id=${trainer_id}&message=` + encodeURIComponent('Inventory updated successfully'));
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).render('error', {
      message: 'Error updating inventory: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Admin route to seed the database
app.get('/admin/seed', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Import the seed script
    const { seedDatabase } = require('./db/seed');

    // Run the seed script
    await seedDatabase();

    res.send('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).send('Error seeding database: ' + error.message);
  }
});

// Admin route for testing rewards
app.get('/admin/test-rewards', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    res.render('admin/test_rewards', {
      title: 'Test Rewards'
    });
  } catch (error) {
    console.error('Error loading test rewards page:', error);
    res.status(500).render('error', {
      message: 'Error loading test rewards page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Import admin routes
const shopRoutes = require('./routes/admin/shops');
const bossRoutes = require('./routes/admin/bosses');
const missionRoutes = require('./routes/admin/missions');
const promptRoutes = require('./routes/admin/prompts');

// Import API routes
const apiRoutes = require('./routes/api');

// Use admin routes
app.use('/admin/shops', shopRoutes);
app.use('/admin/bosses', bossRoutes);
app.use('/admin/missions', missionRoutes);
app.use('/admin/prompts', promptRoutes);

// Use API routes
app.use('/api', apiRoutes);

// Nursery routes
app.use('/api/trainers', require('./routes/api/trainers'));
app.use('/api/items', require('./routes/api/items'));
app.use('/api/nursery', require('./routes/api/nursery'));

// Nurture routes - make sure this is registered correctly
console.log('Registering nurture API routes');
app.use('/api/nurture', require('./routes/api/nurture'));

app.get('/town/visit/nursery', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/nursery', {
    title: 'Nursery'
  });
});

app.get('/town/visit/nursery/hatch', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    res.render('town/nursery/hatch', {
      title: 'Egg Hatching',
      trainers: userTrainers  // Changed to match the template's expected variable name
    });
  } catch (error) {
    console.error('Error loading egg hatching page:', error);
    res.status(500).render('error', {
      message: 'Error loading egg hatching page',
      error: { status: 500, stack: error.stack }
    });
  }
});

app.get('/town/visit/nursery/nurture', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    res.render('town/nursery/nurture', {
      title: 'Nursery - Monster Nurturing',
      trainers: userTrainers
    });
  } catch (error) {
    console.error('Error loading nurture page:', error);
    res.status(500).render('error', {
      message: 'Error loading nurture page',
      error: { status: 500, stack: error.stack }
    });
  }
});

app.use('/api/rewards', rewardRoutes);

// Monster Roller routes
app.get('/admin/monster-roller', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get Pokemon regions for the form
    const allPokemon = await Pokemon.getAll();
    const regions = [...new Set(allPokemon.map(p => p.region).filter(Boolean))];

    // Get Digimon stages
    const allDigimon = await Digimon.getAll();
    const stages = [...new Set(allDigimon.map(d => d.Stage).filter(Boolean))];

    // Get Yokai ranks and tribes
    const allYokai = await Yokai.getAll();
    const ranks = [...new Set(allYokai.map(y => y.Rank).filter(Boolean))];
    const tribes = [...new Set(allYokai.map(y => y.Tribe).filter(Boolean))];

    res.render('admin/monster-roller', {
      title: 'Monster Roller',
      regions,
      stages,
      ranks,
      tribes,
      results: null,
      formData: {}
    });
  } catch (error) {
    console.error('Error loading monster roller:', error);
    res.status(500).render('error', {
      message: 'Error loading monster roller',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/monster-roller', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Parse form data
    const formData = req.body;

    // Build options for the monster roller
    const options = {
      overrideParams: {},
      filters: {
        pokemon: {},
        digimon: {},
        yokai: {}
      }
    };

    // Process override parameters
    if (formData.override_species) {
      options.overrideParams.species = formData.override_species.split(',').map(s => s.trim());
    }

    if (formData.override_types) {
      options.overrideParams.types = formData.override_types.split(',').map(t => t.trim());
    }

    if (formData.override_attributes) {
      options.overrideParams.attributes = formData.override_attributes.split(',').map(a => a.trim());
    }

    if (formData.force_fusion === 'true') {
      options.overrideParams.forceFusion = true;
    }

    if (formData.force_no_fusion === 'true') {
      options.overrideParams.forceNoFusion = true;
    }

    if (formData.min_species) {
      options.overrideParams.minSpecies = parseInt(formData.min_species);
    }

    if (formData.max_species) {
      options.overrideParams.maxSpecies = parseInt(formData.max_species);
    }

    if (formData.min_type) {
      options.overrideParams.minType = parseInt(formData.min_type);
    }

    if (formData.max_type) {
      options.overrideParams.maxType = parseInt(formData.max_type);
    }

    // Process Pokemon filters
    if (formData.pokemon_rarity) {
      options.filters.pokemon.rarity = formData.pokemon_rarity;
    }

    if (formData.pokemon_region) {
      options.filters.pokemon.region = formData.pokemon_region;
    }

    if (formData.pokemon_exclude_type) {
      options.filters.pokemon.excludeType = formData.pokemon_exclude_type.split(',').map(t => t.trim());
    }

    if (formData.pokemon_include_type) {
      options.filters.pokemon.includeType = formData.pokemon_include_type.split(',').map(t => t.trim());
    }

    if (formData.pokemon_stage) {
      options.filters.pokemon.stage = formData.pokemon_stage;
    }

    // Process Digimon filters
    if (formData.digimon_stage) {
      options.filters.digimon.stage = formData.digimon_stage;
    }

    if (formData.digimon_attribute) {
      options.filters.digimon.attribute = formData.digimon_attribute;
    }

    if (formData.digimon_kind) {
      options.filters.digimon.kind = formData.digimon_kind;
    }

    // Process Yokai filters
    if (formData.yokai_rank) {
      options.filters.yokai.rank = formData.yokai_rank;
    }

    if (formData.yokai_tribe) {
      options.filters.yokai.tribe = formData.yokai_tribe;
    }

    if (formData.yokai_attribute) {
      options.filters.yokai.attribute = formData.yokai_attribute;
    }

    // Process species inclusion/exclusion
    if (formData.include_species) {
      options.filters.includeSpecies = formData.include_species.split(',').map(s => s.trim());
    }

    if (formData.exclude_species) {
      options.filters.excludeSpecies = formData.exclude_species.split(',').map(s => s.trim());
    }

    // Roll monsters
    const count = parseInt(formData.count) || 1;
    const roller = new MonsterRoller(options);
    const results = await roller.rollMultiple(count);

    // Get data for the form
    const allPokemon = await Pokemon.getAll();
    const regions = [...new Set(allPokemon.map(p => p.region).filter(Boolean))];

    const allDigimon = await Digimon.getAll();
    const stages = [...new Set(allDigimon.map(d => d.Stage).filter(Boolean))];

    const allYokai = await Yokai.getAll();
    const ranks = [...new Set(allYokai.map(y => y.Rank).filter(Boolean))];
    const tribes = [...new Set(allYokai.map(y => y.Tribe).filter(Boolean))];

    res.render('admin/monster-roller', {
      title: 'Monster Roller',
      regions,
      stages,
      ranks,
      tribes,
      results,
      formData
    });
  } catch (error) {
    console.error('Error rolling monsters:', error);
    res.status(500).render('error', {
      message: 'Error rolling monsters',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.get('/admin/monster-claim', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get monster data from session or query parameters
    let monsterData = req.session.monsterData || {};

    // If we have query parameters, use those instead
    if (req.query.species1) {
      monsterData = {
        species1: req.query.species1,
        species2: req.query.species2 || null,
        species3: req.query.species3 || null,
        type1: req.query.type1,
        type2: req.query.type2 || null,
        type3: req.query.type3 || null,
        type4: req.query.type4 || null,
        type5: req.query.type5 || null,
        attribute: req.query.attribute
      };
    }

    // Get trainers for the dropdown
    const trainers = await Trainer.getAll();

    res.render('admin/monster-claim', {
      title: 'Claim Monster',
      monsterData,
      trainers
    });
  } catch (error) {
    console.error('Error loading monster claim page:', error);
    res.status(500).render('error', {
      message: 'Error loading monster claim page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Add Monster routes
app.get('/admin/add-monster', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Get trainers for the dropdown
    const trainers = await Trainer.getAll();

    res.render('admin/add-monster', {
      title: 'Add Monster',
      trainers
    });
  } catch (error) {
    console.error('Error loading add monster page:', error);
    res.status(500).render('error', {
      message: 'Error loading add monster page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/add-monster', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    // Extract form data
    const formData = req.body;

    // Validate required fields
    if (!formData.trainer_id || !formData.name || !formData.species1 || !formData.type1) {
      return res.status(400).render('error', {
        message: 'Missing required fields',
        error: { status: 400 },
        title: 'Error'
      });
    }

    // Create monster data object
    const monsterData = {
      trainer_id: formData.trainer_id,
      name: formData.name,
      level: parseInt(formData.level) || 1,
      species1: formData.species1,
      species2: formData.species2 || null,
      species3: formData.species3 || null,
      type1: formData.type1,
      type2: formData.type2 || null,
      type3: formData.type3 || null,
      type4: formData.type4 || null,
      type5: formData.type5 || null,
      attribute: formData.attribute || null,
      box_number: parseInt(formData.box_number) || 1,
      img_link: formData.img_link || null,
      gender: formData.gender || null,
      pronouns: formData.pronouns || null,
      nature: formData.nature || null,
      characteristic: formData.characteristic || null,
      height: formData.height || null,
      shiny: formData.shiny === '1' ? 1 : 0,
      alpha: formData.alpha === '1' ? 1 : 0,
      shadow: formData.shadow === '1' ? 1 : 0,
      friendship: parseInt(formData.friendship) || 70,
      fav_berry: formData.fav_berry || null,
      held_item: formData.held_item || null,
      seal: formData.seal || null,
      mark: formData.mark || null,
      poke_ball: formData.poke_ball || null,
      date_met: formData.date_met || new Date().toISOString().split('T')[0],
      where_met: formData.where_met || null,
      acquired: formData.acquired || null,
      talk: formData.talk || null,
      tldr: formData.tldr || null,
      bio: formData.bio || null
    };

    // Handle manual stats if provided
    if (formData.manual_stats) {
      if (formData.hp_total) monsterData.hp_total = parseInt(formData.hp_total);
      if (formData.hp_iv) monsterData.hp_iv = parseInt(formData.hp_iv);
      if (formData.hp_ev) monsterData.hp_ev = parseInt(formData.hp_ev);

      if (formData.atk_total) monsterData.atk_total = parseInt(formData.atk_total);
      if (formData.atk_iv) monsterData.atk_iv = parseInt(formData.atk_iv);
      if (formData.atk_ev) monsterData.atk_ev = parseInt(formData.atk_ev);

      if (formData.def_total) monsterData.def_total = parseInt(formData.def_total);
      if (formData.def_iv) monsterData.def_iv = parseInt(formData.def_iv);
      if (formData.def_ev) monsterData.def_ev = parseInt(formData.def_ev);

      if (formData.spa_total) monsterData.spa_total = parseInt(formData.spa_total);
      if (formData.spa_iv) monsterData.spa_iv = parseInt(formData.spa_iv);
      if (formData.spa_ev) monsterData.spa_ev = parseInt(formData.spa_ev);

      if (formData.spd_total) monsterData.spd_total = parseInt(formData.spd_total);
      if (formData.spd_iv) monsterData.spd_iv = parseInt(formData.spd_iv);
      if (formData.spd_ev) monsterData.spd_ev = parseInt(formData.spd_ev);

      if (formData.spe_total) monsterData.spe_total = parseInt(formData.spe_total);
      if (formData.spe_iv) monsterData.spe_iv = parseInt(formData.spe_iv);
      if (formData.spe_ev) monsterData.spe_ev = parseInt(formData.spe_ev);
    }

    // Handle manual moves if provided
    if (formData.manual_moves && formData.moves && formData.moves.length > 0) {
      // Filter out empty moves
      const moves = formData.moves.filter(move => move && move.trim() !== '');
      if (moves.length > 0) {
        monsterData.moveset = JSON.stringify(moves);
      }
    }

    // Create the monster
    const monster = await Monster.create(monsterData);

    if (!monster) {
      throw new Error('Failed to create monster');
    }

    // Get the trainer for the redirect
    const trainer = await Trainer.getById(formData.trainer_id);

    // Redirect to the monster detail page
    res.redirect(`/trainers/${trainer.id}/monsters/${monster.mon_id}`);
  } catch (error) {
    console.error('Error creating monster:', error);
    res.status(500).render('error', {
      message: 'Error creating monster: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/admin/monster-claim', async (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const { trainer_id, monster_name, species1, species2, species3, type1, type2, type3, type4, type5, attribute } = req.body;

    // Validate required fields
    if (!trainer_id || !monster_name || !species1 || !type1) {
      return res.status(400).render('error', {
        message: 'Missing required fields',
        error: { status: 400 },
        title: 'Error'
      });
    }

    // Create monster
    const monsterData = {
      trainer_id,
      name: monster_name,
      level: 1,
      species1,
      species2: species2 || null,
      species3: species3 || null,
      type1,
      type2: type2 || null,
      type3: type3 || null,
      type4: type4 || null,
      type5: type5 || null,
      attribute,
      box_number: 1 // Default to box 1
    };

    const monster = await Monster.create(monsterData);

    if (!monster) {
      throw new Error('Failed to create monster');
    }

    // Redirect to the monster's page
    res.redirect(`/trainers/${trainer_id}/monsters/${monster.mon_id}`);
  } catch (error) {
    console.error('Error claiming monster:', error);
    res.status(500).render('error', {
      message: 'Error claiming monster: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// API Routes
const adoptionRoutes = require('./routes/api/adoption');
app.use('/api/adoption', adoptionRoutes);

// Starter Roller Routes
app.get('/trainers/:id/roll-starters', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to roll starters'));
    }

    const trainerId = req.params.id;

    // Validate that trainerId is a valid integer
    if (!trainerId || isNaN(parseInt(trainerId))) {
      return res.status(400).render('error', {
        message: 'Invalid trainer ID',
        error: { status: 400 }
      });
    }

    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to roll starters for this trainer',
        error: { status: 403 }
      });
    }

    // Check if the trainer already has monsters
    const trainerMonsters = await Monster.getByTrainerId(trainerId);
    if (trainerMonsters.length >= 3) {
      return res.status(403).render('error', {
        message: 'This trainer already has 3 or more monsters and cannot roll starters',
        error: { status: 403 }
      });
    }

    // Get the current set number from the session or default to 1
    const currentSet = req.session.starterSet || 1;

    // Roll 10 starter monsters
    const options = {
      overrideParams: {
        minSpecies: 1,
        maxSpecies: 2,  // Limit to 1-2 species for starters
        minType: 1,
        maxType: 3      // Limit to 1-3 types for starters
      },
      filters: {
        pokemon: {
          rarity: 'Common',
          stage: ['Base Stage', 'Doesn\'t Evolve']
        },
        digimon: {
          stage: ['Training 1', 'Training 2', 'Rookie']
        },
        yokai: {
          rank: ['E', 'D', 'C']
        }
      }
    };

    const roller = new MonsterRoller(options);
    const starters = await roller.rollMultiple(10);

    // Store the starters in the session
    req.session.starters = starters;
    req.session.starterSet = currentSet;

    res.render('trainers/roll-starters', {
      title: `Roll Starters - Set ${currentSet} of 3`,
      trainer,
      starters,
      currentSet
    });
  } catch (error) {
    console.error('Error rolling starters:', error);
    res.status(500).render('error', {
      message: 'Error rolling starters',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.post('/trainers/:id/claim-starter', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to claim a starter'));
    }

    const trainerId = req.params.id;

    // Validate that trainerId is a valid integer
    if (!trainerId || isNaN(parseInt(trainerId))) {
      return res.status(400).render('error', {
        message: 'Invalid trainer ID',
        error: { status: 400 }
      });
    }

    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to claim starters for this trainer',
        error: { status: 403 }
      });
    }

    // Get the request body data
    console.log('Request body in claim-starter:', req.body);
    const { starterIndex, monster_name, monsterName } = req.body;

    // Use monster_name if available, otherwise fall back to monsterName
    const monsterNameToUse = monster_name || monsterName;

    // Get the starters from the session
    const starters = req.session.starters;
    if (!starters || starters.length === 0) {
      return res.status(400).render('error', {
        message: 'No starters available to claim',
        error: { status: 400 }
      });
    }

    console.log('Starters in session:', starters.length, 'starters available');

    // Validate the starter index
    const starterIndexNum = parseInt(starterIndex);
    if (isNaN(starterIndexNum) || starterIndexNum < 0 || starterIndexNum >= starters.length) {
      return res.status(400).render('error', {
        message: `Invalid starter index: ${starterIndex}. Must be between 0 and ${starters.length - 1}`,
        error: { status: 400 }
      });
    }

    const selectedStarter = starters[starterIndexNum];

    if (!selectedStarter) {
      console.error(`Starter at index ${starterIndexNum} not found in starters array`);
      console.error('Available starters:', starters.map((s, i) => `Index ${i}: ${s.species1}${s.species2 ? '/' + s.species2 : ''}${s.species3 ? '/' + s.species3 : ''}`))
      return res.status(400).render('error', {
        message: `Invalid starter selection: Starter at index ${starterIndexNum} not found`,
        error: { status: 400 }
      });
    }

    if (!monsterNameToUse) {
      return res.status(400).render('error', {
        message: 'Monster name is required',
        error: { status: 400 }
      });
    }

    // Double-check that the trainer exists in the database
    // First, make sure trainerId is a valid integer
    const trainerIdNum = parseInt(trainerId);
    if (isNaN(trainerIdNum)) {
      console.error(`Invalid trainer ID: ${trainerId} is not a number`);
      return res.status(400).render('error', {
        message: 'Invalid trainer ID: must be a number',
        error: { status: 400 }
      });
    }

    const trainerExists = await Trainer.getById(trainerIdNum);
    if (!trainerExists) {
      console.error(`Trainer with ID ${trainerIdNum} not found in database`);
      return res.status(404).render('error', {
        message: 'Trainer not found in database',
        error: { status: 404 }
      });
    }

    // Create the monster
    const monsterData = {
      trainer_id: trainerIdNum, // Use the validated integer trainer ID
      name: monsterNameToUse,
      level: 5, // Starters start at level 5
      species1: selectedStarter.species1,
      species2: selectedStarter.species2 || null,
      species3: selectedStarter.species3 || null,
      type1: selectedStarter.type1,
      type2: selectedStarter.type2 || null,
      type3: selectedStarter.type3 || null,
      type4: selectedStarter.type4 || null,
      type5: selectedStarter.type5 || null,
      attribute: selectedStarter.attribute,
      box_number: -1, // Put in battle box by default
      is_starter_template: true // Mark as a starter (using true as it's a boolean column)
      // img_link is intentionally omitted to use the default
    };

    console.log('About to create monster with data:', JSON.stringify(monsterData, null, 2));
    try {
      const monster = await Monster.create(monsterData);
      console.log('Monster creation result:', monster ? 'Success' : 'Failed');

      if (monster) {
        console.log('Created monster ID:', monster.mon_id);
      }

      if (!monster) {
        console.error('Monster creation failed in claim-starter route');
        console.error('Monster data:', JSON.stringify(monsterData, null, 2));
        return res.status(500).render('error', {
          message: 'Failed to create monster',
          error: { status: 500, stack: 'Check server logs for details' },
          title: 'Error'
        });
      }
    } catch (createError) {
      console.error('Error during monster creation:', createError);
      console.error('Monster data that caused error:', JSON.stringify(monsterData, null, 2));
      return res.status(500).render('error', {
        message: 'Error creating monster: ' + createError.message,
        error: { status: 500, stack: createError.stack },
        title: 'Error'
      });
    }

    // Increment the starter set
    const currentSet = req.session.starterSet || 1;
    const nextSet = currentSet + 1;

    if (nextSet <= 3) {
      // Move to the next set
      req.session.starterSet = nextSet;
      // Clear the starters for the next roll
      req.session.starters = null;
      // Redirect to roll the next set
      return res.redirect(`/trainers/${trainerId}/roll-starters`);
    } else {
      // All sets completed, clear session data
      req.session.starterSet = null;
      req.session.starters = null;
      // Redirect to the trainer's page
      return res.redirect(`/trainers/${trainerId}`);
    }
  } catch (error) {
    console.error('Error claiming starter:', error);
    console.error('Request body:', req.body);
    console.error('Session data:', req.session);

    // Try to provide a more helpful error message
    let errorMessage = 'Error claiming starter';
    if (error.message.includes('null value in column')) {
      errorMessage = 'Missing required field: ' + error.message;
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid trainer ID or reference: ' + error.message;
    } else if (error.message.includes('syntax error')) {
      errorMessage = 'Database query syntax error: ' + error.message;
    } else if (error.message.includes('Trainer with ID')) {
      errorMessage = error.message;
    } else if (error.message.includes('Invalid trainer_id')) {
      errorMessage = error.message;
    }

    res.status(500).render('error', {
      message: errorMessage,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Town visit routes (protected, only for logged-in users)
app.get('/town/visit', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/index', {
    title: 'Visit Town'
  });
});

// Town visit sub-routes
app.get('/town/visit/trade', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Get selected trainer from query params or default to first trainer
    let selectedTrainerId = req.query.trainer_id;
    let selectedTrainer;

    if (selectedTrainerId) {
      selectedTrainer = userTrainers.find(t => t.id == selectedTrainerId);
    }

    if (!selectedTrainer && userTrainers.length > 0) {
      selectedTrainer = userTrainers[0]; // Default to first trainer
    }

    if (!selectedTrainer) {
      return res.render('town/trade', {
        title: 'Trade Center',
        message: 'No trainers found. Please create a trainer first.',
        messageType: 'warning',
        userTrainers: [],
        trades: []
      });
    }

    // Fetch trades for the selected trainer
    const rawTrades = await Trade.getByTrainerId(selectedTrainer.id);

    // Format trades with trainer names and item/monster counts
    const trades = await Promise.all(rawTrades.map(async (trade) => {
      // Get initiator and recipient trainer names
      const initiator = await Trainer.getById(trade.initiator_id);
      const recipient = await Trainer.getById(trade.recipient_id);

      // Format the trade data
      const formattedTrade = {
        ...trade,
        initiator_name: initiator ? initiator.name : 'Unknown Trainer',
        recipient_name: recipient ? recipient.name : 'Unknown Trainer',
        is_initiator: trade.initiator_id == selectedTrainer.id,
        created_at_formatted: new Date(trade.created_at).toLocaleString(),
        updated_at_formatted: new Date(trade.updated_at).toLocaleString(),
        // Format monster counts
        offered_mons_count: Array.isArray(trade.offered_mons) ? trade.offered_mons.length : 0,
        requested_mons_count: Array.isArray(trade.requested_mons) ? trade.requested_mons.length : 0,
        // Format item counts
        offered_items_count: 0,
        requested_items_count: 0
      };

      // Count offered items
      if (trade.offered_items) {
        const offeredItems = typeof trade.offered_items === 'string'
          ? JSON.parse(trade.offered_items)
          : trade.offered_items;

        Object.values(offeredItems).forEach(items => {
          Object.values(items).forEach(quantity => {
            formattedTrade.offered_items_count += parseInt(quantity) || 0;
          });
        });
      }

      // Count requested items
      if (trade.requested_items) {
        const requestedItems = typeof trade.requested_items === 'string'
          ? JSON.parse(trade.requested_items)
          : trade.requested_items;

        Object.values(requestedItems).forEach(items => {
          Object.values(items).forEach(quantity => {
            formattedTrade.requested_items_count += parseInt(quantity) || 0;
          });
        });
      }

      return formattedTrade;
    }));

    res.render('town/trade', {
      title: 'Trade Center',
      userTrainers,
      selectedTrainer,
      trades
    });
  } catch (error) {
    console.error('Error loading trade page:', error);
    res.render('town/trade', {
      title: 'Trade Center',
      message: 'Error loading trainers. Please try again.',
      messageType: 'error',
      userTrainers: [],
      trades: []
    });
  }
});

// API endpoint for fetching a trainer's monsters
app.get('/api/trainers/:id/monsters', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const trainerId = req.params.id;

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Get the trainer's monsters
    const monsters = await Monster.getByTrainerId(trainerId) || [];

    // Log the monsters for debugging
    console.log(`Found ${monsters.length} monsters for trainer ${trainerId}`);

    res.json({
      monsters
    });
  } catch (error) {
    console.error('Error fetching trainer monsters:', error);
    res.status(500).json({ error: 'Error fetching trainer monsters' });
  }
});

// Monster Trading Route
app.get('/town/visit/trade/mons', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Get selected trainer if trainer_id is provided
    let selectedTrainer = null;
    if (req.query.trainer_id) {
      selectedTrainer = await Trainer.getById(req.query.trainer_id);

      // Verify that the selected trainer belongs to the user
      if (!selectedTrainer || selectedTrainer.player_user_id !== req.session.user.discord_id) {
        selectedTrainer = null;
      }
    }

    // If no trainer is selected but user has trainers, select the first one
    if (!selectedTrainer && userTrainers.length > 0) {
      selectedTrainer = userTrainers[0];
    }

    // Get the trainer's monsters
    let yourMonsters = [];
    if (selectedTrainer) {
      try {
        // Check if we have a Monster model
        if (typeof Monster !== 'undefined' && Monster.getByTrainerId) {
          yourMonsters = await Monster.getByTrainerId(selectedTrainer.id);
        }
      } catch (monsterError) {
        console.error('Error loading trainer monsters:', monsterError);
      }
    }

    // Get all trainers for the dropdown
    let otherTrainers = [];
    try {
      // Get all trainers
      otherTrainers = await Trainer.getAll();
    } catch (trainersError) {
      console.error('Error loading all trainers:', trainersError);
    }

    res.render('town/trade/mons', {
      title: 'Monster Trading',
      userTrainers,
      selectedTrainer,
      yourMonsters,
      otherTrainers, // All trainers for the dropdown
      otherTrainer: null, // This would be the selected trainer to trade with
      otherMonsters: [] // This would be the monsters of the other trainer
    });
  } catch (error) {
    console.error('Error loading monster trade page:', error);
    res.render('town/trade/mons', {
      title: 'Monster Trading',
      message: 'Error loading trainers or monsters. Please try again.',
      messageType: 'error',
      userTrainers: [],
      selectedTrainer: null,
      yourMonsters: [],
      otherTrainers: [], // Empty array for error case
      otherTrainer: null,
      otherMonsters: []
    });
  }
});

// Monster Trading POST Route
app.post('/town/visit/trade/mons', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { initiator_id, recipient_id, offered_mons, requested_mons } = req.body;

    // Validate the required fields
    if (!initiator_id || !recipient_id) {
      return res.render('town/trade/mons', {
        title: 'Monster Trading',
        message: 'Missing required fields. Please try again.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: await Trainer.getById(initiator_id),
        yourMonsters: [],
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherMonsters: []
      });
    }

    // Verify that the initiator trainer belongs to the current user
    const initiatorTrainer = await Trainer.getById(initiator_id);
    if (!initiatorTrainer || initiatorTrainer.player_user_id !== req.session.user.discord_id) {
      return res.render('town/trade/mons', {
        title: 'Monster Trading',
        message: 'You can only initiate trades with your own trainers.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: null,
        yourMonsters: [],
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherMonsters: []
      });
    }

    // Get the recipient trainer
    const recipientTrainer = await Trainer.getById(recipient_id);
    if (!recipientTrainer) {
      return res.render('town/trade/mons', {
        title: 'Monster Trading',
        message: 'Recipient trainer not found.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: initiatorTrainer,
        yourMonsters: [],
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherMonsters: []
      });
    }

    // Process the trade
    try {
      // Parse the monster IDs
      console.log('Processing trade with offered_mons:', offered_mons);
      console.log('Processing trade with requested_mons:', requested_mons);

      // Convert to arrays if they're not already
      let offeredMonsterIds = [];
      if (offered_mons) {
        if (Array.isArray(offered_mons)) {
          offeredMonsterIds = offered_mons;
        } else {
          offeredMonsterIds = [offered_mons];
        }
      }

      let requestedMonsterIds = [];
      if (requested_mons) {
        if (Array.isArray(requested_mons)) {
          requestedMonsterIds = requested_mons;
        } else {
          requestedMonsterIds = [requested_mons];
        }
      }

      console.log('Processed offered monster IDs:', offeredMonsterIds);
      console.log('Processed requested monster IDs:', requestedMonsterIds);

      // Validate that there are monsters to trade
      if (offeredMonsterIds.length === 0 && requestedMonsterIds.length === 0) {
        return res.render('town/trade/mons', {
          title: 'Monster Trading',
          message: 'No monsters selected for trade.',
          messageType: 'error',
          userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
          selectedTrainer: initiatorTrainer,
          yourMonsters: await Monster.getByTrainerId(initiator_id),
          otherTrainers: await Trainer.getAll(),
          otherTrainer: recipientTrainer,
          otherMonsters: []
        });
      }

      // Verify that the offered monsters belong to the initiator
      for (const monId of offeredMonsterIds) {
        console.log(`Verifying offered monster ID: ${monId}`);
        const monster = await Monster.getById(monId);

        if (!monster) {
          console.error(`Monster with ID ${monId} not found`);
          return res.render('town/trade/mons', {
            title: 'Monster Trading',
            message: `Monster with ID ${monId} not found.`,
            messageType: 'error',
            userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
            selectedTrainer: initiatorTrainer,
            yourMonsters: await Monster.getByTrainerId(initiator_id),
            otherTrainers: await Trainer.getAll(),
            otherTrainer: recipientTrainer,
            otherMonsters: []
          });
        }

        console.log(`Monster ${monId} belongs to trainer ${monster.trainer_id}, initiator is ${initiator_id}`);
        if (parseInt(monster.trainer_id) !== parseInt(initiator_id)) {
          return res.render('town/trade/mons', {
            title: 'Monster Trading',
            message: `The monster ${monster.name} (ID: ${monId}) does not belong to you.`,
            messageType: 'error',
            userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
            selectedTrainer: initiatorTrainer,
            yourMonsters: await Monster.getByTrainerId(initiator_id),
            otherTrainers: await Trainer.getAll(),
            otherTrainer: recipientTrainer,
            otherMonsters: []
          });
        }
      }

      // Verify that the requested monsters belong to the recipient
      for (const monId of requestedMonsterIds) {
        console.log(`Verifying requested monster ID: ${monId}`);
        const monster = await Monster.getById(monId);

        if (!monster) {
          console.error(`Monster with ID ${monId} not found`);
          return res.render('town/trade/mons', {
            title: 'Monster Trading',
            message: `Monster with ID ${monId} not found.`,
            messageType: 'error',
            userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
            selectedTrainer: initiatorTrainer,
            yourMonsters: await Monster.getByTrainerId(initiator_id),
            otherTrainers: await Trainer.getAll(),
            otherTrainer: recipientTrainer,
            otherMonsters: []
          });
        }

        console.log(`Monster ${monId} belongs to trainer ${monster.trainer_id}, recipient is ${recipient_id}`);
        if (parseInt(monster.trainer_id) !== parseInt(recipient_id)) {
          return res.render('town/trade/mons', {
            title: 'Monster Trading',
            message: `The monster ${monster.name} (ID: ${monId}) does not belong to the recipient.`,
            messageType: 'error',
            userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
            selectedTrainer: initiatorTrainer,
            yourMonsters: await Monster.getByTrainerId(initiator_id),
            otherTrainers: await Trainer.getAll(),
            otherTrainer: recipientTrainer,
            otherMonsters: []
          });
        }
      }

      // Perform the trade - update trainer_id for each monster
      try {
        // 1. Transfer offered monsters to recipient
        for (const monId of offeredMonsterIds) {
          console.log(`Transferring offered monster ${monId} from ${initiator_id} to ${recipient_id}`);
          const updateResult = await Monster.update(monId, {
            trainer_id: recipient_id,
            box_number: 1 // Put in first box by default
          });

          if (!updateResult) {
            throw new Error(`Failed to transfer monster ${monId} to recipient`);
          }
          console.log(`Successfully transferred monster ${monId} to recipient`);
        }

        // 2. Transfer requested monsters to initiator
        for (const monId of requestedMonsterIds) {
          console.log(`Transferring requested monster ${monId} from ${recipient_id} to ${initiator_id}`);
          const updateResult = await Monster.update(monId, {
            trainer_id: initiator_id,
            box_number: 1 // Put in first box by default
          });

          if (!updateResult) {
            throw new Error(`Failed to transfer monster ${monId} to initiator`);
          }
          console.log(`Successfully transferred monster ${monId} to initiator`);
        }

        // 3. Create a trade record in the database
        const tradeData = {
          initiator_id: initiator_id,
          recipient_id: recipient_id,
          status: 'completed',
          offered_mons: offeredMonsterIds,
          offered_items: {},
          requested_mons: requestedMonsterIds,
          requested_items: {}
        };

        // Create the trade record
        const tradeRecord = await Trade.create(tradeData);

        if (!tradeRecord) {
          throw new Error('Failed to create trade record');
        }

        console.log(`Trade completed: ${initiator_id} traded ${offeredMonsterIds.join(', ')} for ${requestedMonsterIds.join(', ')} from ${recipient_id}, trade ID: ${tradeRecord.trade_id}`);

        // Recalculate monster counts for both trainers
        await Trainer.recalculateMonsterCounts(initiator_id);
        await Trainer.recalculateMonsterCounts(recipient_id);

        // Return success message
        return res.render('town/trade/mons', {
          title: 'Monster Trading',
          message: 'Trade completed successfully!',
          messageType: 'success',
          userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
          selectedTrainer: initiatorTrainer,
          yourMonsters: await Monster.getByTrainerId(initiator_id),
          otherTrainers: await Trainer.getAll(),
          otherTrainer: recipientTrainer,
          otherMonsters: []
        });
      } catch (transferError) {
        console.error('Error transferring monsters:', transferError);
        return res.render('town/trade/mons', {
          title: 'Monster Trading',
          message: `Error transferring monsters: ${transferError.message}`,
          messageType: 'error',
          userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
          selectedTrainer: initiatorTrainer,
          yourMonsters: await Monster.getByTrainerId(initiator_id),
          otherTrainers: await Trainer.getAll(),
          otherTrainer: recipientTrainer,
          otherMonsters: []
        });
      }
    } catch (tradeError) {
      console.error('Error processing trade:', tradeError);
      return res.render('town/trade/mons', {
        title: 'Monster Trading',
        message: 'Error processing trade: ' + tradeError.message,
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: initiatorTrainer,
        yourMonsters: await Monster.getByTrainerId(initiator_id),
        otherTrainers: await Trainer.getAll(),
        otherTrainer: recipientTrainer,
        otherMonsters: []
      });
    }
  } catch (error) {
    console.error('Error processing monster trade:', error);
    res.render('town/trade/mons', {
      title: 'Monster Trading',
      message: 'Error processing trade. Please try again.',
      messageType: 'error',
      userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
      selectedTrainer: null,
      yourMonsters: [],
      otherTrainers: [],
      otherTrainer: null,
      otherMonsters: []
    });
  }
});

// Item Trading POST Route
app.post('/town/visit/trade/items', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { initiator_id, recipient_id, offered_items, requested_items } = req.body;

    // Validate the required fields
    if (!initiator_id || !recipient_id) {
      return res.render('town/trade/items', {
        title: 'Item Trading',
        message: 'Missing required fields. Please try again.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: await Trainer.getById(initiator_id),
        inventory: {},
        itemDetails: {},
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherItems: {}
      });
    }

    // Verify that the initiator trainer belongs to the current user
    const initiatorTrainer = await Trainer.getById(initiator_id);
    if (!initiatorTrainer || initiatorTrainer.player_user_id !== req.session.user.discord_id) {
      return res.render('town/trade/items', {
        title: 'Item Trading',
        message: 'You can only initiate trades with your own trainers.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: null,
        inventory: {},
        itemDetails: {},
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherItems: {}
      });
    }

    // Get the recipient trainer
    const recipientTrainer = await Trainer.getById(recipient_id);
    if (!recipientTrainer) {
      return res.render('town/trade/items', {
        title: 'Item Trading',
        message: 'Recipient trainer not found.',
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: initiatorTrainer,
        inventory: await Trainer.getInventory(initiator_id) || {},
        itemDetails: {},
        otherTrainers: await Trainer.getAll(),
        otherTrainer: null,
        otherItems: {}
      });
    }

    // Process the trade
    try {
      // Parse the item data
      console.log('Processing trade with offered_items:', offered_items);
      console.log('Processing trade with requested_items:', requested_items);

      // Process offered items
      let offeredItems = {};
      if (offered_items) {
        // Handle array of JSON strings (from form submission)
        if (Array.isArray(offered_items)) {
          offered_items.forEach(item => {
            try {
              const parsedItem = typeof item === 'string' ? JSON.parse(item) : item;
              if (parsedItem.name && parsedItem.category && parsedItem.quantity > 0) {
                if (!offeredItems[parsedItem.category]) {
                  offeredItems[parsedItem.category] = {};
                }
                offeredItems[parsedItem.category][parsedItem.name] = parsedItem.quantity;
              }
            } catch (e) {
              console.error('Error parsing offered item:', e, item);
            }
          });
        } else if (typeof offered_items === 'object') {
          // Handle direct object
          offeredItems = offered_items;
        }
      }

      // Process requested items
      let requestedItems = {};
      if (requested_items) {
        // Handle array of JSON strings (from form submission)
        if (Array.isArray(requested_items)) {
          requested_items.forEach(item => {
            try {
              const parsedItem = typeof item === 'string' ? JSON.parse(item) : item;
              if (parsedItem.name && parsedItem.category && parsedItem.quantity > 0) {
                if (!requestedItems[parsedItem.category]) {
                  requestedItems[parsedItem.category] = {};
                }
                requestedItems[parsedItem.category][parsedItem.name] = parsedItem.quantity;
              }
            } catch (e) {
              console.error('Error parsing requested item:', e, item);
            }
          });
        } else if (typeof requested_items === 'object') {
          // Handle direct object
          requestedItems = requested_items;
        }
      }

      console.log('Processed offered items:', offeredItems);
      console.log('Processed requested items:', requestedItems);

      // Validate that there are items to trade
      const hasOfferedItems = Object.keys(offeredItems).some(category =>
        Object.values(offeredItems[category]).some(count => count > 0)
      );
      const hasRequestedItems = Object.keys(requestedItems).some(category =>
        Object.values(requestedItems[category]).some(count => count > 0)
      );

      if (!hasOfferedItems && !hasRequestedItems) {
        return res.render('town/trade/items', {
          title: 'Item Trading',
          message: 'No items selected for trade.',
          messageType: 'error',
          userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
          selectedTrainer: initiatorTrainer,
          inventory: await Trainer.getInventory(initiator_id) || {},
          itemDetails: {},
          otherTrainers: await Trainer.getAll(),
          otherTrainer: recipientTrainer,
          otherItems: {}
        });
      }

      // Get the inventories
      const initiatorInventory = await Trainer.getInventory(initiator_id) || {};
      const recipientInventory = await Trainer.getInventory(recipient_id) || {};

      // Verify that the initiator has the offered items
      for (const category in offeredItems) {
        for (const [itemName, count] of Object.entries(offeredItems[category])) {
          if (count <= 0) continue;

          // Check if the initiator has this category in their inventory
          if (!initiatorInventory[category] || initiatorInventory[category][itemName] === undefined || initiatorInventory[category][itemName] < count) {
            return res.render('town/trade/items', {
              title: 'Item Trading',
              message: `You do not have enough of ${itemName} in your inventory.`,
              messageType: 'error',
              userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
              selectedTrainer: initiatorTrainer,
              inventory: initiatorInventory,
              itemDetails: {},
              otherTrainers: await Trainer.getAll(),
              otherTrainer: recipientTrainer,
              otherItems: {}
            });
          }
        }
      }

      // Verify that the recipient has the requested items
      for (const category in requestedItems) {
        for (const [itemName, count] of Object.entries(requestedItems[category])) {
          if (count <= 0) continue;

          // Check if the recipient has this category in their inventory
          if (!recipientInventory[category] || recipientInventory[category][itemName] === undefined || recipientInventory[category][itemName] < count) {
            return res.render('town/trade/items', {
              title: 'Item Trading',
              message: `The recipient does not have enough of ${itemName} in their inventory.`,
              messageType: 'error',
              userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
              selectedTrainer: initiatorTrainer,
              inventory: initiatorInventory,
              itemDetails: {},
              otherTrainers: await Trainer.getAll(),
              otherTrainer: recipientTrainer,
              otherItems: {}
            });
          }
        }
      }

      // Perform the trade - update inventories
      // 1. Transfer offered items to recipient
      for (const category in offeredItems) {
        for (const [itemName, count] of Object.entries(offeredItems[category])) {
          if (count <= 0) continue;

          console.log(`Transferring ${count} ${itemName} from initiator to recipient (category: ${category})`);

          // Remove from initiator
          await Trainer.updateInventoryItem(initiator_id, category, itemName, -count);

          // Add to recipient
          await Trainer.updateInventoryItem(recipient_id, category, itemName, count);
        }
      }

      // 2. Transfer requested items to initiator
      for (const category in requestedItems) {
        for (const [itemName, count] of Object.entries(requestedItems[category])) {
          if (count <= 0) continue;

          console.log(`Transferring ${count} ${itemName} from recipient to initiator (category: ${category})`);

          // Remove from recipient
          await Trainer.updateInventoryItem(recipient_id, category, itemName, -count);

          // Add to initiator
          await Trainer.updateInventoryItem(initiator_id, category, itemName, count);
        }
      }

      // 3. Create a trade record in the database
      const tradeData = {
        initiator_id: initiator_id,
        recipient_id: recipient_id,
        status: 'completed',
        offered_mons: [],
        offered_items: offeredItems,
        requested_mons: [],
        requested_items: requestedItems
      };

      // Create the trade record
      const tradeRecord = await Trade.create(tradeData);

      if (!tradeRecord) {
        throw new Error('Failed to create trade record');
      }

      console.log(`Item trade completed between ${initiator_id} and ${recipient_id}, trade ID: ${tradeRecord.trade_id}`);

      // Return success message
      return res.render('town/trade/items', {
        title: 'Item Trading',
        message: 'Trade completed successfully!',
        messageType: 'success',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: initiatorTrainer,
        inventory: await Trainer.getInventory(initiator_id) || {},
        itemDetails: {},
        otherTrainers: await Trainer.getAll(),
        otherTrainer: recipientTrainer,
        otherItems: {}
      });
    } catch (tradeError) {
      console.error('Error processing item trade:', tradeError);
      return res.render('town/trade/items', {
        title: 'Item Trading',
        message: 'Error processing trade: ' + tradeError.message,
        messageType: 'error',
        userTrainers: await Trainer.getByUserId(req.session.user.discord_id),
        selectedTrainer: initiatorTrainer,
        inventory: await Trainer.getInventory(initiator_id) || {},
        itemDetails: {},
        otherTrainers: await Trainer.getAll(),
        otherTrainer: recipientTrainer,
        otherItems: {}
      });
    }
  } catch (error) {
    console.error('Error processing item trade:', error);
    res.render('town/trade/items', {
      title: 'Item Trading',
      message: 'Error processing trade. Please try again.',
      messageType: 'error',
      userTrainers: [],
      selectedTrainer: null,
      inventory: {},
      itemDetails: {},
      otherTrainers: [],
      otherTrainer: null,
      otherItems: {}
    });
  }
});

// Process Trade Route
app.post('/town/visit/trade/process', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { trade_id } = req.body;

    if (!trade_id) {
      return res.redirect('/town/visit/trade?message=Missing+trade+ID&messageType=error');
    }

    // Get the trade
    const trade = await Trade.getById(trade_id);
    if (!trade) {
      return res.redirect('/town/visit/trade?message=Trade+not+found&messageType=error');
    }

    // Process the trade
    const result = await Trade.processTrade(trade_id);

    if (result.success) {
      return res.redirect('/town/visit/trade?message=Trade+processed+successfully&messageType=success');
    } else {
      return res.redirect(`/town/visit/trade?message=${encodeURIComponent(result.message)}&messageType=error`);
    }
  } catch (error) {
    console.error('Error processing trade:', error);
    return res.redirect('/town/visit/trade?message=Error+processing+trade&messageType=error');
  }
});

// Cancel Trade Route
app.post('/town/visit/trade/cancel', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { trade_id } = req.body;

    if (!trade_id) {
      return res.redirect('/town/visit/trade?message=Missing+trade+ID&messageType=error');
    }

    // Get the trade
    const trade = await Trade.getById(trade_id);
    if (!trade) {
      return res.redirect('/town/visit/trade?message=Trade+not+found&messageType=error');
    }

    // Cancel the trade
    const cancelledTrade = await Trade.cancelTrade(trade_id);

    if (cancelledTrade) {
      return res.redirect('/town/visit/trade?message=Trade+cancelled+successfully&messageType=success');
    } else {
      return res.redirect('/town/visit/trade?message=Error+cancelling+trade&messageType=error');
    }
  } catch (error) {
    console.error('Error cancelling trade:', error);
    return res.redirect('/town/visit/trade?message=Error+cancelling+trade&messageType=error');
  }
});

// API endpoint for fetching a trainer's inventory
app.get('/api/trainers/:id/inventory', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const trainerId = req.params.id;

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Get the trainer's inventory
    const inventory = await Trainer.getInventory(trainerId) || {};

    // Log the inventory for debugging
    console.log('Trainer inventory:', JSON.stringify(inventory, null, 2));

    // Get item details (this would be implemented in an Item model)
    // For now, we'll just return the inventory

    res.json({
      inventory,
      itemDetails: {}
    });
  } catch (error) {
    console.error('Error fetching trainer inventory:', error);
    res.status(500).json({ error: 'Error fetching trainer inventory' });
  }
});

// Item Trading Route
app.get('/town/visit/trade/items', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Get selected trainer if trainer_id is provided
    let selectedTrainer = null;
    if (req.query.trainer_id) {
      selectedTrainer = await Trainer.getById(req.query.trainer_id);

      // Verify that the selected trainer belongs to the user
      if (!selectedTrainer || selectedTrainer.player_user_id !== req.session.user.discord_id) {
        selectedTrainer = null;
      }
    }

    // If no trainer is selected but user has trainers, select the first one
    if (!selectedTrainer && userTrainers.length > 0) {
      selectedTrainer = userTrainers[0];
    }

    // Get the trainer's items
    let inventory = {};
    if (selectedTrainer) {
      try {
        // Use Trainer.getInventory method
        inventory = await Trainer.getInventory(selectedTrainer.id) || {};
      } catch (inventoryError) {
        console.error('Error loading trainer inventory:', inventoryError);
      }
    }

    // Get all trainers for the dropdown
    let otherTrainers = [];
    try {
      // Get all trainers
      otherTrainers = await Trainer.getAll();
    } catch (trainersError) {
      console.error('Error loading all trainers:', trainersError);
    }

    res.render('town/trade/items', {
      title: 'Item Trading',
      userTrainers,
      selectedTrainer,
      inventory,
      itemDetails: {}, // This would be populated with item details from a database
      otherTrainers, // All trainers for the dropdown
      otherTrainer: null, // This would be the selected trainer to trade with
      otherItems: {} // This would be the items of the other trainer
    });
  } catch (error) {
    console.error('Error loading item trade page:', error);
    res.render('town/trade/items', {
      title: 'Item Trading',
      message: 'Error loading trainers or items. Please try again.',
      messageType: 'error',
      userTrainers: [],
      selectedTrainer: null,
      inventory: {},
      itemDetails: {},
      otherTrainers: [],
      otherTrainer: null,
      otherItems: {}
    });
  }
});

app.get('/town/visit/garden', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/garden', {
    title: 'Garden'
  });
});

app.get('/town/visit/farm', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/farm', {
    title: 'Farm'
  });
});

// Game Corner route
app.get('/town/visit/game_corner', async (req, res) => {
  try {
    // Ensure user is logged in
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const discordUserId = req.session.user.discord_id;

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(discordUserId);

    // Get monsters for each trainer
    let monsters = [];
    for (const trainer of trainers) {
      const trainerMonsters = await Monster.getByTrainerId(trainer.id);
      monsters = [...monsters, ...trainerMonsters];
    }

    console.log(`Loaded ${trainers.length} trainers and ${monsters.length} monsters for Game Corner`);

    // Render the game corner template with real data
    res.render('town/game_corner', {
      title: 'Pomodoro Game Corner',
      trainers: trainers,
      monsters: monsters
    });

  } catch (error) {
    console.error('Error loading game corner:', error);
    res.render('town/game_corner', {
      title: 'Pomodoro Game Corner',
      message: 'Error loading trainers and monsters. Please try again.',
      messageType: 'error',
      trainers: [],
      monsters: []
    });
  }
});

// Generic Rewards Route
app.get('/town/rewards', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get parameters from query
    let source = req.query.source || 'game_corner';
    let returnUrl = req.query.returnUrl || '/town/visit';
    const returnButtonText = req.query.returnButtonText || 'Go Back';
    const pageTitle = req.query.pageTitle || 'Rewards';
    const pageSubtitle = req.query.pageSubtitle || 'You\'ve earned the following rewards:';
    const summaryTitle = req.query.summaryTitle || 'Summary';
    const allowTrainerSelection = req.query.allowTrainerSelection === 'true';
    const showClaimAllButton = req.query.showClaimAllButton === 'true';

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Check if rewards are passed in the query or session
    let rewards = [];
    if (req.query.rewards) {
      try {
        rewards = JSON.parse(req.query.rewards);
      } catch (e) {
        console.error('Error parsing rewards JSON:', e);
      }
    } else if (req.session.rewards && req.session.rewards.length > 0) {
      // Use rewards from session (set by API endpoints)
      console.log('Using rewards from session');
      rewards = req.session.rewards;

      // If source is not specified in query but is in session, use that
      if (!req.query.source && req.session.source) {
        console.log(`Using source from session: ${req.session.source}`);
        source = req.session.source;
      }

      // If returnUrl is not specified in query but is in session, use that
      if (!req.query.returnUrl && req.session.returnUrl) {
        console.log(`Using returnUrl from session: ${req.session.returnUrl}`);
        returnUrl = req.session.returnUrl;
      }
    } else {
      // Generate rewards based on parameters if not provided directly
      // This is for backward compatibility with the game corner
      const completedSessions = parseInt(req.query.sessions) || 0;
      const totalFocusMinutes = parseInt(req.query.minutes) || 0;
      const productivityScore = parseInt(req.query.productivity) || 0;

      // Create summary data for game corner
      const summaryData = {
        'Completed Sessions': completedSessions,
        'Focus Minutes': totalFocusMinutes,
        'Productivity': productivityScore + '%'
      };

      // Add coin rewards - scale with both sessions and time spent
      const baseCoins = 50;
      const sessionFactor = completedSessions;
      const timeFactor = Math.ceil(totalFocusMinutes / 15); // Additional coins per 15 minutes
      const productivityMultiplier = productivityScore / 100;
      const coinAmount = Math.round(baseCoins * (sessionFactor + timeFactor) * productivityMultiplier);
      const coinReward = {
        id: 'coin-' + Date.now(),
        type: 'coin',
        rarity: 'common',
        data: {
          amount: coinAmount
        }
      };
      rewards.push(coinReward);

      // Add level rewards if productivity is good - potentially multiple
      const levelRewards = [];
      if (productivityScore >= 50) { // Lower threshold to 50% productivity
        // Calculate max number of level rewards based on productivity and time spent
        const productivityFactor = Math.floor(productivityScore / 20); // 0-5 based on productivity
        const timeFactor = Math.floor(totalFocusMinutes / 30); // Factor based on time (1 per 30 minutes)
        const maxLevelRewards = Math.min(Math.max(productivityFactor, timeFactor), 5); // Cap at 5
        // Actual number of level rewards (random between 0 and max)
        const numLevelRewards = Math.floor(Math.random() * (maxLevelRewards + 1));

        // Track how many monster vs trainer level rewards to create
        const numMonsterLevels = Math.ceil(numLevelRewards * 0.7); // 70% for monsters
        const numTrainerLevels = numLevelRewards - numMonsterLevels; // 30% for trainers

        // Add monster level rewards
        for (let i = 0; i < numMonsterLevels; i++) {
          const levelReward = {
            id: 'monster-level-' + Date.now() + '-' + i,
            type: 'level',
            subtype: 'monster', // Specify this is for a monster
            rarity: 'uncommon',
            data: {
              levels: Math.ceil(Math.random() * 2), // 1-2 levels per reward
              isMonster: true // Flag to identify monster level-ups
            }
          };
          levelRewards.push(levelReward);
          rewards.push(levelReward);
        }

        // Add trainer level rewards
        for (let i = 0; i < numTrainerLevels; i++) {
          const levelReward = {
            id: 'trainer-level-' + Date.now() + '-' + i,
            type: 'level',
            subtype: 'trainer', // Specify this is for a trainer
            rarity: 'uncommon',
            data: {
              levels: Math.ceil(Math.random() * 2), // 1-2 levels per reward
              isTrainer: true, // Flag to identify trainer level-ups
              title: 'Trainer Level Up'
            }
          };
          levelRewards.push(levelReward);
          rewards.push(levelReward);
        }
      }

      // Add item rewards - get from database - potentially multiple
      const itemRewards = [];
      try {
        // Get random items from database
        const allItems = await Item.getAll();
        if (allItems && allItems.length > 0) {
          // Determine max number of items based on productivity and time spent
          const productivityFactor = Math.floor(productivityScore / 20); // 0-5 based on productivity
          const timeFactor = Math.floor(totalFocusMinutes / 25); // Factor based on time (1 per 25 minutes)
          const maxItems = Math.min(Math.max(productivityFactor, timeFactor), 5); // Cap at 5
          // Actual number of items (random between 0 and max)
          const numItems = Math.floor(Math.random() * (maxItems + 1));

          for (let i = 0; i < numItems; i++) {
            // Determine item rarity based on productivity
            let rarityFilter = '1'; // Default to common
            if (productivityScore >= 90) {
              // 10% chance for rare item at high productivity
              rarityFilter = Math.random() < 0.1 ? '3' : '2';
            } else if (productivityScore >= 70) {
              rarityFilter = '2'; // Uncommon for good productivity
            }

            // Filter items by rarity
            const eligibleItems = allItems.filter(item => item.rarity === rarityFilter);
            const selectedItems = eligibleItems.length > 0 ? eligibleItems : allItems;

            // Select random item
            const randomItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];

            const itemReward = {
              id: 'item-' + Date.now() + '-' + i,
              type: 'item',
              rarity: rarityFilter === '3' ? 'rare' : rarityFilter === '2' ? 'uncommon' : 'common',
              data: {
                name: randomItem.name,
                description: randomItem.effect || 'A useful item',
                quantity: Math.ceil(Math.random() * 3), // 1-3 of each item
                category: randomItem.category || 'general'
              }
            };
            itemRewards.push(itemReward);
            rewards.push(itemReward);
          }
        }
      } catch (error) {
        console.error('Error getting items from database:', error);
        // Fallback item if database query fails
        const itemReward = {
          id: 'item-' + Date.now(),
          type: 'item',
          rarity: 'common',
          data: {
            name: 'Potion',
            description: 'Restores 20 HP to a monster',
            quantity: 1,
            category: 'general'
          }
        };
        itemRewards.push(itemReward);
        rewards.push(itemReward);
      }

      // Add monster encounters if productivity is high - potentially multiple
      const monsterRewards = [];
      if (productivityScore >= 80) {
        // Determine max number of monsters based on productivity and time spent
        const productivityFactor = Math.floor(productivityScore / 20); // 0-5 based on productivity
        const timeFactor = Math.floor(totalFocusMinutes / 35); // Factor based on time (1 per 35 minutes)
        const maxMonsters = Math.min(Math.max(productivityFactor, timeFactor), 5); // Cap at 5
        // Actual number of monsters (random between 0 and max)
        const numMonsters = Math.floor(Math.random() * (maxMonsters + 1));

        for (let i = 0; i < numMonsters; i++) {
          try {
            // Determine rarity based on productivity score
            let monsterRarity;
            let rarityFilters = {};

            if (productivityScore >= 95) {
              // Legendary - 0.002% chance (1 in 500,000) at 95%+ productivity
              monsterRarity = Math.random() <= 0.000002 ? 'legendary' : 'epic';
              // For legendary, use higher tier monsters
              rarityFilters = {
                pokemon: { rarity: ['Legendary', 'Mythical', 'Ultra Beast'] },
                digimon: { stage: ['Ultimate', 'Mega'] },
                yokai: { rank: ['A', 'S', 'SS'] }
              };
            } else if (productivityScore >= 90) {
              // Epic - use rare/strong monsters
              monsterRarity = 'epic';
              rarityFilters = {
                pokemon: { rarity: ['Rare', 'Very Rare'] },
                digimon: { stage: ['Champion', 'Ultimate'] },
                yokai: { rank: ['B', 'A'] }
              };
            } else {
              // Rare - use uncommon monsters
              monsterRarity = 'rare';
              rarityFilters = {
                pokemon: { rarity: ['Uncommon', 'Rare'] },
                digimon: { stage: ['Rookie', 'Champion'] },
                yokai: { rank: ['C', 'B'] }
              };
            }

            // Configure monster roller options
            const monsterOptions = {
              filters: rarityFilters
            };

            // Roll a monster using MonsterRoller
            const rolledMonster = await MonsterRoller.rollOne(monsterOptions);

            let newMonsterReward;
            if (rolledMonster) {
              // Create monster reward
              newMonsterReward = {
                id: 'monster-' + Date.now(),
                type: 'monster',
                rarity: monsterRarity,
                data: {
                  species: rolledMonster.species1 || 'Unknown Monster',
                  species2: rolledMonster.species2 || null,
                  species3: rolledMonster.species3 || null,
                  level: Math.floor(5 + (completedSessions / 2)),
                  type: rolledMonster.type1 || 'Normal',
                  type2: rolledMonster.type2 || null,
                  type3: rolledMonster.type3 || null,
                  type4: rolledMonster.type4 || null,
                  type5: rolledMonster.type5 || null,
                  attribute: rolledMonster.attribute || 'Data'
                }
              };
            } else {
              // Fallback if monster rolling fails
              newMonsterReward = {
                id: 'monster-' + Date.now(),
                type: 'monster',
                rarity: monsterRarity,
                data: {
                  species: ['Pikachu', 'Charmander', 'Bulbasaur', 'Squirtle', 'Eevee'][Math.floor(Math.random() * 5)],
                  level: Math.floor(5 + (completedSessions / 2)),
                  type: ['Electric', 'Fire', 'Grass', 'Water', 'Normal'][Math.floor(Math.random() * 5)],
                  attribute: ['Vaccine', 'Data', 'Virus', 'Free'][Math.floor(Math.random() * 4)]
                }
              };
            }

            monsterRewards.push(newMonsterReward);
            rewards.push(newMonsterReward);
          } catch (error) {
            console.error('Error rolling monster:', error);
            // Fallback monster if rolling fails
            const fallbackMonsterReward = {
              id: 'monster-' + Date.now(),
              type: 'monster',
              rarity: (productivityScore >= 95 && Math.random() <= 0.000002) ? 'legendary' : productivityScore >= 90 ? 'epic' : 'rare',
              data: {
                species: ['Pikachu', 'Charmander', 'Bulbasaur', 'Squirtle', 'Eevee'][Math.floor(Math.random() * 5)],
                level: Math.floor(5 + (completedSessions / 2)),
                type: ['Electric', 'Fire', 'Grass', 'Water', 'Normal'][Math.floor(Math.random() * 5)],
                attribute: ['Vaccine', 'Data', 'Virus', 'Free'][Math.floor(Math.random() * 4)]
              }
            };
            monsterRewards.push(fallbackMonsterReward);
            rewards.push(fallbackMonsterReward);
          }
        }
      }

      // For game corner, automatically assign rewards to random trainers
      if (source === 'game_corner' && trainers && trainers.length > 0) {
        // Process each reward
        const { processReward } = require('./routes/game_corner_claim');

        // Process coin reward
        const coinResult = await processReward(coinReward, 'random', trainers, 'game_corner');
        if (coinResult.success) {
          coinReward.assigned = true;
          coinReward.assignedTo = {
            id: coinResult.trainerId,
            name: coinResult.trainerName
          };
        }

        // Process level rewards
        for (const levelReward of levelRewards) {
          const levelResult = await processReward(levelReward, 'random', trainers, 'game_corner');
          if (levelResult.success) {
            levelReward.assigned = true;
            levelReward.assignedTo = {
              id: levelResult.trainerId,
              name: levelResult.trainerName
            };

            if (levelResult.monsterLevelUp && levelResult.monsterName) {
              // This is a monster level-up
              levelReward.data.monsterName = levelResult.monsterName;
              // Make the monster name more prominent
              levelReward.data.monsterNameHighlight = true;
              // Flag to make trainer name smaller
              levelReward.data.smallTrainerName = true;
            } else if (levelResult.trainerLevelUp) {
              // This is a trainer level-up
              levelReward.data.title = 'Trainer Level Up';
              levelReward.data.trainerLevelUp = true;
            }
          }
        }

        // Process item rewards
        for (const itemReward of itemRewards) {
          const itemResult = await processReward(itemReward, 'random', trainers, 'game_corner');
          if (itemResult.success) {
            itemReward.assigned = true;
            itemReward.assignedTo = {
              id: itemResult.trainerId,
              name: itemResult.trainerName
            };
          }
        }

        // Process monster rewards
        for (const monsterReward of monsterRewards) {
          const monsterResult = await processReward(monsterReward, 'random', trainers, 'game_corner');
          if (monsterResult.success) {
            monsterReward.assigned = true;
            monsterReward.assignedTo = {
              id: monsterResult.trainerId,
              name: monsterResult.trainerName
            };
          }
        }
      }

      // Render without summary data for game corner
      return res.render('town/rewards', {
        title: pageTitle,
        pageTitle,
        pageSubtitle,
        rewards,
        trainers,
        source,
        returnUrl,
        returnButtonText,
        allowTrainerSelection,
        showClaimAllButton
      });
    }

    // Parse summary data if provided
    let summaryData = {};
    if (req.query.summaryData) {
      try {
        summaryData = JSON.parse(req.query.summaryData);
      } catch (e) {
        console.error('Error parsing summaryData JSON:', e);
      }
    }

    // Render the rewards page
    res.render('town/rewards', {
      title: pageTitle,
      pageTitle,
      pageSubtitle,
      rewards,
      trainers,
      source,
      returnUrl,
      returnButtonText,
      allowTrainerSelection,
      showClaimAllButton,
      session: req.session, // Pass the session to the view
      message: req.session.message || null // Pass the message from session if available
    });

    // Clear the rewards from the session after they're displayed
    // This prevents them from being displayed again if the user refreshes the page
    if (req.session.rewards) {
      delete req.session.rewards;
    }
    if (req.session.gardenRewards) {
      delete req.session.gardenRewards;
    }
    if (req.session.message) {
      delete req.session.message;
    }
  } catch (error) {
    console.error('Error generating rewards:', error);
    res.render('town/rewards', {
      title: 'Rewards',
      pageTitle: 'Rewards',
      pageSubtitle: 'An error occurred while generating rewards.',
      rewards: [],
      trainers: [],
      source: 'error',
      returnUrl: '/town/visit',
      returnButtonText: 'Go Back',
      allowTrainerSelection: false,
      showClaimAllButton: false,
      session: req.session, // Pass the session to the view
      message: 'Error generating rewards: ' + error.message
    });

    // Clear the rewards from the session in case of error
    if (req.session.rewards) {
      delete req.session.rewards;
    }
    if (req.session.gardenRewards) {
      delete req.session.gardenRewards;
    }
    if (req.session.message) {
      delete req.session.message;
    }
  }
});

// Game Corner APIs
const gameCornerRewardsRouter = require('./routes/game_corner_rewards');
app.use('/api/game-corner', gameCornerRewardsRouter);

// Game Corner Claim API
const gameCornerClaimRouter = require('./routes/game_corner_claim');
app.use('/api/game-corner', gameCornerClaimRouter);

// Game Corner Generation API
const gameCornerApiRouter = require('./routes/game_corner_api');
app.use('/api/game-corner-gen', gameCornerApiRouter);

// Witch's Hut route
app.get('/town/visit/witchs_hut', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Render the witch's hut view
  res.render('town/witchs_hut');
});

// Antique Appraisal page
app.get('/town/visit/antique/appraisal', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);
    console.log('Trainers for antique appraisal:', trainers);

    // Get all antiques
    const antiques = AntiqueAppraisalService.getAllAntiques();
    console.log('Available antiques:', antiques);

    // Get unique categories
    const categories = [...new Set(antiques.map(a => a.category))].map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '_'),
      name: cat
    }));

    // Add "All" category at the beginning
    categories.unshift({ id: 'all', name: 'All Antiques' });

    res.render('town/antique_appraisal', {
      title: 'Antique Appraisal',
      trainers,
      categories,
      antiques,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error rendering antique appraisal page:', error);
    res.status(500).send('Error loading antique appraisal page');
  }
});

// Adoption Center routes
const townAdoptionRoutes = require('./routes/town/adoption');
app.use('/town/visit/adoption', townAdoptionRoutes);

// Apothecary route
app.get('/town/visit/apothecary', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get initial data for the page
    const Trainer = require('./models/Trainer');
    const initialData = {};

    // Get message from query params if any
    if (req.query.message) {
      initialData.message = req.query.message;
      initialData.messageType = req.query.messageType || 'error';
    }

    // Try to get the user's trainers
    try {
      const discordUserId = req.session.user.discord_id;
      const trainers = await Trainer.getByUserId(discordUserId);

      if (trainers && trainers.length > 0) {
        // Get the first trainer's berry inventory
        const trainer = await Trainer.getById(trainers[0].id);

        if (trainer && trainer.inv_berries) {
          let berryInventory = {};
          try {
            if (typeof trainer.inv_berries === 'string') {
              berryInventory = JSON.parse(trainer.inv_berries);
            } else {
              berryInventory = trainer.inv_berries;
            }

            // Define berry effects
            const BERRY_EFFECTS = {
              'Mala Berry': 'Remove Species 2 (if present)',
              'Merco Berry': 'Remove Species 3 (if present)',
              'Lilan Berry': 'Remove Type 2 (if present)',
              'Kham Berry': 'Remove Type 3 (if present)',
              'Maizi Berry': 'Remove Type 4 (if present)',
              'Fani Berry': 'Remove Type 5 (if present)',
              'Miraca Berry': 'Randomize Type 1',
              'Cocon Berry': 'Randomize Type 2 (if present)',
              'Durian Berry': 'Randomize Type 3 (if present)',
              'Monel Berry': 'Randomize Type 4 (if present)',
              'Perep Berry': 'Randomize Type 5 (if present)',
              'Addish Berry': 'Add Type 2 (if not present)',
              'Sky Carrot Berry': 'Add Type 3 (if not present)',
              'Kembre Berry': 'Add Type 4 (if not present)',
              'Espara Berry': 'Add Type 5 (if not present)',
              'Patama Berry': 'Randomize Species 1',
              'Bluk Berry': 'Randomize Species 2 (if present)',
              'Nuevo Berry': 'Randomize Species 3 (if present)',
              'Azzuk Berry': 'Add a new random species to Species 2 (if not present)',
              'Mangus Berry': 'Add a new random species to Species 3 (if not present)',
              'Datei Berry': 'Randomize Attribute'
            };

            // Generate color mapping
            const colorMap = {
              'Mala': { color: 'red', rgb: '220, 38, 38' },
              'Merco': { color: 'blue', rgb: '37, 99, 235' },
              'Lilan': { color: 'green', rgb: '22, 163, 74' },
              'Kham': { color: 'purple', rgb: '126, 34, 206' },
              'Maizi': { color: 'yellow', rgb: '202, 138, 4' },
              'Fani': { color: 'pink', rgb: '219, 39, 119' },
              'Miraca': { color: 'orange', rgb: '234, 88, 12' },
              'Cocon': { color: 'teal', rgb: '13, 148, 136' },
              'Durian': { color: 'amber', rgb: '217, 119, 6' },
              'Monel': { color: 'indigo', rgb: '79, 70, 229' },
              'Perep': { color: 'lime', rgb: '101, 163, 13' },
              'Addish': { color: 'cyan', rgb: '8, 145, 178' },
              'Sky Carrot': { color: 'sky', rgb: '14, 165, 233' },
              'Kembre': { color: 'amber', rgb: '217, 119, 6' },
              'Espara': { color: 'emerald', rgb: '5, 150, 105' },
              'Patama': { color: 'fuchsia', rgb: '192, 38, 211' },
              'Bluk': { color: 'violet', rgb: '139, 92, 246' },
              'Nuevo': { color: 'rose', rgb: '225, 29, 72' },
              'Azzuk': { color: 'slate', rgb: '71, 85, 105' },
              'Mangus': { color: 'zinc', rgb: '113, 113, 122' },
              'Datei': { color: 'gold', rgb: '234, 179, 8' }
            };

            // Format berries for the template
            const initialBerries = [];
            Object.entries(berryInventory)
              .filter(([berryName, quantity]) => {
                return quantity > 0 &&
                       berryName !== 'Edenweiss' &&
                       berryName !== 'Forget-Me-Not' &&
                       berryName !== 'Edenweiss Berry' &&
                       berryName !== 'Forget-Me-Not Berry';
              })
              .forEach(([berryName, quantity]) => {
                // Find color for the berry
                let colorInfo = { color: 'blue', rgb: '37, 99, 235' };
                for (const [prefix, info] of Object.entries(colorMap)) {
                  if (berryName.includes(prefix)) {
                    colorInfo = info;
                    break;
                  }
                }

                // Get berry icon based on type
                let iconClass = 'fa-apple-alt';
                if (berryName.includes('Carrot')) {
                  iconClass = 'fa-carrot';
                } else if (berryName.includes('Durian')) {
                  iconClass = 'fa-lemon';
                } else if (berryName.includes('Seed') || berryName.includes('Sprout')) {
                  iconClass = 'fa-seedling';
                }

                initialBerries.push({
                  name: berryName,
                  quantity: quantity,
                  effect: BERRY_EFFECTS[berryName] || 'Unknown effect',
                  color: colorInfo.color,
                  colorRGB: colorInfo.rgb,
                  icon: iconClass
                });
              });

            if (initialBerries.length > 0) {
              initialData.initialBerries = initialBerries;
            }
          } catch (e) {
            console.error('Error parsing berry inventory:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error getting trainer data:', error);
      // Don't fail the page load if we can't get trainer data
    }

    // Render the apothecary view with initial data
    res.render('town/apothecary', {
      title: 'Apothecary',
      bannerImage: '/images/locations/apothecary-banner.jpg',
      ...initialData
    });
  } catch (error) {
    console.error('Error rendering apothecary page:', error);
    res.render('town/apothecary', {
      title: 'Apothecary',
      message: 'An error occurred while loading the page. Please try again.',
      messageType: 'error'
    });
  }
});

// Pirate's Dock routes
app.get('/town/visit/pirates_dock', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/pirates_dock', {
    title: 'Pirate\'s Dock',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/visit/pirates_dock/swab', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/visit/pirates_dock/swab', {
    title: 'Swab the Deck',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/visit/pirates_dock/fishing', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Redirect back to pirate's dock with a message
  res.redirect('/town/visit/pirates_dock?message=You caught a Magikarp!&messageType=success');
});

// Farm routes
app.get('/town/visit/farm', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/farm', {
    title: 'Farm',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/visit/farm/work', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Create the work.ejs file if it doesn't exist
  const workViewPath = path.join(__dirname, 'views', 'town', 'visit', 'farm');
  if (!fs.existsSync(workViewPath)) {
    fs.mkdirSync(workViewPath, { recursive: true });
  }

  // Redirect back to farm with a message
  res.redirect('/town/visit/farm?message=Farm work feature coming soon!&messageType=info');
});

app.get('/town/visit/farm/breed', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Render the breeding view
    res.render('town/farm/breed', {
      title: 'Monster Breeding',
      userTrainers: userTrainers || []
    });
  } catch (error) {
    console.error('Error loading breeding page:', error);
    res.status(500).render('error', {
      message: 'Error loading breeding page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Garden routes
app.get('/town/visit/garden', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/garden', {
    title: 'Garden',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

// Garden tend route is now handled in location_activity_routes.js

app.get('/town/visit/garden/water', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Redirect back to garden with a message
  res.redirect('/town/visit/garden?message=You watered the plants!&messageType=success');
});

app.get('/town/visit/garden/weed', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Redirect back to garden with a message
  res.redirect('/town/visit/garden?message=You removed the weeds!&messageType=success');
});

app.get('/town/visit/garden/fertilize', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Redirect back to garden with a message
  res.redirect('/town/visit/garden?message=You added fertilizer to the garden!&messageType=success');
});

app.get('/town/visit/garden/harvest', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    console.log('Garden harvest route accessed');

    // Initialize garden harvests table if needed
    await GardenHarvest.initTable();

    // Get the user's Discord ID
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    console.log(`Processing harvest for user ID: ${discordUserId}`);

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(discordUserId);
    if (!trainers || trainers.length === 0) {
      console.log('No trainers found for user');
      return res.redirect('/town/visit/garden?message=You need at least one trainer to harvest the garden!&messageType=error');
    }
    console.log(`Found ${trainers.length} trainers for user`);

    // Check if the user has already harvested today
    const hasHarvestedToday = await GardenHarvest.hasHarvestedToday(discordUserId);
    console.log(`Has user harvested today? ${hasHarvestedToday}`);

    // Check if user is an admin
    const isAdmin = req.session.user.is_admin === true;
    console.log(`Is user an admin? ${isAdmin}`);

    // Only enforce the daily harvest limit for non-admin users
    // Skip this check if the user has already harvested via the API endpoint
    // (which would have already enforced this check)
    if (hasHarvestedToday && !isAdmin) {
      return res.redirect('/town/visit/garden?message=You have already harvested your garden today. Come back tomorrow!&messageType=info');
    }

    // If admin is harvesting again on the same day, log it and show a special message
    if (hasHarvestedToday && isAdmin) {
      console.log(`Admin user ${req.session.user.username} (${discordUserId}) is harvesting again on the same day`);

      // Add a special message to the rewards page title
      req.session.adminRerollMessage = 'Admin Override: Harvesting garden again on the same day';
    } else {
      // Clear any previous admin reroll message
      req.session.adminRerollMessage = null;
    }

    // Check if we're coming from the API endpoint (which would have already harvested)
    // If so, we don't need to generate new garden points or record a new harvest
    let gardenPoints;
    let harvestResult;

    if (hasHarvestedToday && !isAdmin) {
      // We've already harvested today and we're not an admin, so just get the existing data
      console.log('User has already harvested today, using existing data');
      const harvestData = await GardenHarvest.getByDiscordUserId(discordUserId);
      gardenPoints = harvestData ? harvestData.garden_points : 0;
      harvestResult = harvestData;
      console.log('Using existing garden data:', harvestData);
    } else if (hasHarvestedToday && isAdmin) {
      // Admin user harvesting again on the same day
      console.log('Admin user', req.session.user.username, '(' + discordUserId + ') is harvesting again on the same day');

      // Generate random garden points (1-5) for admin users
      gardenPoints = Math.floor(Math.random() * 5) + 1;
      console.log(`Generated ${gardenPoints} garden points for admin user`);

      // Update the garden points
      await GardenHarvest.updateGardenPoints(discordUserId, gardenPoints);

      // Now harvest with the new points
      harvestResult = await GardenHarvest.harvestGarden(discordUserId);
      console.log('Admin harvest result:', harvestResult);
    } else {
      // First harvest of the day
      // Generate random garden points (1-5) and record the harvest
      gardenPoints = Math.floor(Math.random() * 5) + 1;
      console.log(`Generated ${gardenPoints} garden points for harvest`);

      // Record the harvest in the database
      harvestResult = await GardenHarvest.recordHarvest(discordUserId, gardenPoints);
      console.log('Harvest recorded:', harvestResult);
    }

    // Generate rewards using the RewardSystem
    console.log('Generating rewards...');
    const rewards = await RewardSystem.generateRewards('garden', {
      gardenPoints: gardenPoints,
      productivityScore: 100, // Default productivity score
      timeSpent: 30, // Default time spent in minutes
      difficulty: 'normal' // Default difficulty
    });
    console.log(`Generated ${rewards.length} rewards`);

    // Store rewards in session for claiming later
    req.session.rewards = rewards;

    // Render the rewards view
    res.render('town/rewards', {
      title: 'Garden Harvest Rewards',
      rewards: rewards,
      trainers: trainers,
      source: 'garden',
      message: req.session.adminRerollMessage || `You harvested your garden and earned ${gardenPoints} garden points!`,
      adminReroll: isAdmin && hasHarvestedToday,
      returnUrl: '/town/visit/garden'
    });
  } catch (error) {
    console.error('Error harvesting garden:', error);
    res.redirect('/town/visit/garden?message=Error harvesting garden: ' + error.message + '&messageType=error');
  }
});

// API routes for evolution are now handled by the API router

app.get('/api/monsters/:monsterId/evolution-options', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
    }

    const monsterId = req.params.monsterId;

    // Get evolution options
    const evolutionOptions = await EvolutionService.checkEvolutionOptions(monsterId);

    res.json(evolutionOptions);
  } catch (error) {
    console.error('Error getting evolution options:', error);
    res.status(500).json({ success: false, message: 'Error getting evolution options' });
  }
});

// API endpoint for getting user's trainers is now handled by the API router

// API endpoint for getting trainer's monsters is now handled by the API router

// API endpoint for updating trainer level and currency
app.post('/api/trainers/:trainerId/update', async (req, res) => {
  try {
    const trainerId = parseInt(req.params.trainerId);
    if (isNaN(trainerId)) {
      return res.status(400).json({ error: 'Invalid trainer ID' });
    }

    const { levels = 0, coins = 0 } = req.body;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    const updatedTrainer = await Trainer.updateLevelAndCurrency(trainerId, levels, coins);
    res.json(updatedTrainer);
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ error: 'Error updating trainer' });
  }
});

// API endpoint for updating monster level
app.post('/api/monsters/:monsterId/update', async (req, res) => {
  try {
    const monsterId = parseInt(req.params.monsterId);
    if (isNaN(monsterId)) {
      return res.status(400).json({ error: 'Invalid monster ID' });
    }

    const { levels = 0 } = req.body;
    const monster = await Monster.getById(monsterId);

    if (!monster) {
      return res.status(404).json({ error: 'Monster not found' });
    }

    const updatedMonster = await Monster.updateLevel(monsterId, levels);
    res.json(updatedMonster);
  } catch (error) {
    console.error('Error updating monster:', error);
    res.status(500).json({ error: 'Error updating monster' });
  }
});

app.get('/api/species/:speciesName/evolution-options', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
    }

    const speciesName = req.params.speciesName;

    // Get evolution options
    const evolutionOptions = await EvolutionService.checkSpeciesEvolutionOptions(speciesName);

    res.json(evolutionOptions);
  } catch (error) {
    console.error('Error getting species evolution options:', error);
    res.status(500).json({ success: false, message: 'Error getting species evolution options' });
  }
});

app.get('/api/items/evolution', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
    }

    // Get user's trainers
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    const trainers = await Trainer.getByUserId(discordUserId);

    if (!trainers || trainers.length === 0) {
      return res.json([]);
    }

    // Use the first trainer to get evolution items
    const evolutionItems = await EvolutionService.getEvolutionItems(trainers[0].id);

    res.json(evolutionItems || []);
  } catch (error) {
    console.error('Error getting evolution items:', error);
    res.status(500).json({ success: false, message: 'Error getting evolution items' });
  }
});

app.post('/api/monsters/:monsterId/evolve', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
    }

    const monsterId = req.params.monsterId;
    const { trainerId, submissionUrl, useItem, itemName, selectedEvolution, speciesIndex } = req.body;

    // Verify trainer belongs to user
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer || trainer.player_user_id !== discordUserId) {
      return res.status(403).json({ success: false, message: 'You do not own this trainer' });
    }

    // Verify monster belongs to trainer
    const monster = await Monster.getById(monsterId);

    if (!monster || monster.trainer_id !== parseInt(trainerId)) {
      return res.status(403).json({ success: false, message: 'This trainer does not own this monster' });
    }

    // Process evolution
    const result = await EvolutionService.processEvolution({
      monsterId,
      trainerId,
      submissionUrl,
      useItem: useItem === 'yes' || useItem === true,
      itemName,
      selectedEvolution,
      speciesIndex
    });

    res.json(result);
  } catch (error) {
    console.error('Error evolving monster:', error);
    res.status(500).json({ success: false, message: 'Error evolving monster' });
  }
});

// API routes for claiming rewards - DEPRECATED, use the router instead
// app.post('/api/claim-reward', async (req, res) => {
//   // Check if user is logged in
//   if (!req.session.user) {
//     return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
//   }
//   // This route is now handled by the claim-reward router
//
// });

app.post('/api/claim-all-rewards', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
  }

  try {
    const { rewards, source } = req.body;

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0 || !source) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Get the user's Discord ID
    const discordUserId = req.session.user.discord_id || req.session.user.id;

    // Get all trainers for the user
    const trainers = await Trainer.getByUserId(discordUserId);
    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Get session rewards
    const sessionRewards = req.session.rewards || [];

    // Process each reward
    const results = [];
    for (const reward of rewards) {
      // Find the reward in the session
      const sessionReward = sessionRewards.find(r => r.id === reward.id && r.type === reward.type);

      if (!sessionReward) {
        results.push({
          rewardId: reward.id,
          success: false,
          message: 'Reward not found'
        });
        continue;
      }

      // Skip already claimed rewards
      if (sessionReward.claimed) {
        results.push({
          rewardId: reward.id,
          success: false,
          message: 'Reward already claimed'
        });
        continue;
      }

      // Randomly select a trainer
      const randomIndex = Math.floor(Math.random() * trainers.length);
      const selectedTrainer = trainers[randomIndex];

      // Process the reward claim
      const result = await RewardSystem.processRewardClaim(sessionReward, selectedTrainer.id, trainers, source);

      if (result.success) {
        // Mark the reward as claimed in the session
        const rewardIndex = sessionRewards.findIndex(r => r.id === reward.id && r.type === reward.type);
        if (rewardIndex !== -1) {
          sessionRewards[rewardIndex].claimed = true;
          sessionRewards[rewardIndex].assignedTo = {
            id: selectedTrainer.id,
            name: selectedTrainer.name
          };
        }

        results.push({
          rewardId: reward.id,
          success: true,
          message: result.message,
          trainerId: result.trainerId,
          trainerName: result.trainerName
        });
      } else {
        results.push({
          rewardId: reward.id,
          success: false,
          message: result.message
        });
      }
    }

    // Update session rewards
    req.session.rewards = sessionRewards;

    return res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    return res.status(500).json({ success: false, message: 'Error claiming rewards: ' + error.message });
  }
});

// Antique Store route
app.get('/town/visit/antique', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);
    console.log(`Found ${trainers?.length || 0} trainers for user`);

    // Get antique inventory for each trainer using AntiqueAppraisalService
    const trainersWithAntiques = [];

    console.log('Processing trainers for antiques...');
    for (const trainer of trainers) {
      console.log(`Processing trainer: ${trainer.name} (ID: ${trainer.id})`);

      try {
        // Use the AntiqueAppraisalService to get trainer's antiques
        const trainerAntiques = await AntiqueAppraisalService.getTrainerAntiques(trainer.id);
        console.log(`Antiques for ${trainer.name}:`, trainerAntiques);

        // Calculate total antiques count
        const antiquesCount = trainerAntiques.reduce((sum, antique) => sum + (antique.quantity || 0), 0);
        console.log(`Total antiques for ${trainer.name}: ${antiquesCount}`);

        trainersWithAntiques.push({
          id: trainer.id,
          name: trainer.name,
          antiquesCount
        });
      } catch (error) {
        console.error(`Error getting antiques for trainer ${trainer.id}:`, error);
      }
    }

    // Sort trainers by antique count (descending)
    trainersWithAntiques.sort((a, b) => b.antiquesCount - a.antiquesCount);

    // Take top 5 trainers
    const topTrainers = trainersWithAntiques.slice(0, 5);

    res.render('town/antique', {
      title: 'Antique Store',
      trainers: topTrainers,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error rendering antique store page:', error);
    res.render('town/antique', {
      title: 'Antique Store',
      trainers: [],
      message: 'An error occurred while loading trainer data.',
      messageType: 'error'
    });
  }
});

// Antique Auction route
app.get('/town/visit/antique/auction', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Create the antique_auctions table if it doesn't exist
    const AntiqueAuction = require('./models/AntiqueAuction');
    await AntiqueAuction.createTableIfNotExists();

    res.render('town/antique_auction', {
      title: 'Antique Auctions',
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error rendering antique auction page:', error);
    res.render('town/antique_auction', {
      title: 'Antique Auctions',
      message: 'An error occurred while loading auction data.',
      messageType: 'error'
    });
  }
});


// Megamart routes
app.get('/town/visit/megamart/item_use', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/megamart_item_use', {
    title: 'Mega Mart - Item Use',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/visit/megamart/ability_master', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/megamart_ability_master', {
    title: 'Mega Mart - Ability Master',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

app.get('/town/visit/megamart/held_item_room', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/megamart_held_item_room', {
    title: 'Mega Mart - Held Item Room',
    message: req.query.message,
    messageType: req.query.messageType
  });
});

// Generic handler for other town locations
app.get('/town/visit/:location', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const location = req.params.location;

  // Check if the view exists
  const viewPath = path.join(__dirname, 'views', 'town', `${location}.ejs`);

  if (fs.existsSync(viewPath)) {
    // Format the location name for the title
    const locationName = location
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    res.render(`town/${location}`, {
      title: locationName,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } else {
    // Render a coming soon page if the view doesn't exist
    res.render('town/coming-soon', {
      title: 'Coming Soon',
      location: location
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    });
  }
});

// Import adventures routes
const adventuresRoutes = require('./routes/adventures');

// Use adventures routes
app.use('/adventures', adventuresRoutes);

// Keep these specific routes for backward compatibility
app.get('/adventures/missions', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('adventures/missions', {
    title: 'Missions'
  });
});

app.get('/adventures/boss', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('adventures/boss', {
    title: 'Boss Battles'
  });
});

app.get('/adventures/event', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const categories = getContentCategories();

  res.render('adventures/event/index', {
    title: 'Lore Library',
    categories,
    activeCategory: 'events',
    currentPath: '',
    eventType: 'current'
  });
});

// Competition Circuit routes (nested under Adventures)
app.get('/adventures/competition', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('competition/index', {
    title: 'Competition Circuit'
  });
});

// Competition sub-routes (all showing coming soon)
app.get('/adventures/competition/:type', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const competitionTypes = {
    'friendly': 'Friendly Match',
    'league': 'Challenge League',
    'frontier': 'Challenge Frontier',
    'exhibition': 'Friendly Exhibition',
    'contest': 'Contest',
    'festival': 'Grand Festival'
  };

  const type = req.params.type;
  const title = competitionTypes[type] || 'Competition';

  res.render('competition/coming-soon', {
    title: title,
    competitionType: title
  });
});

// Main Submissions route
app.get('/submissions', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to access submissions'));
  }

  res.render('submissions/index', {
    title: 'Process Submission'
  });
});

// Main submissions route
app.get('/submissions', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to access submissions'));
  }

  res.render('submissions/index', {
    title: 'Process Submission'
  });
});

// Artwork Submission routes are now handled by the submissions router

// Writing Submission routes - Commented out in favor of the more detailed route below
// app.get('/submissions/writing/:type', (req, res) => {
//   // Check if user is logged in
//   if (!req.session.user) {
//     return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit writing'));
//   }
//
//   const types = {
//     'game': 'Game Writing',
//     'external': 'External Writing'
//   };
//
//   const type = req.params.type;
//   const title = types[type] || 'Writing Submission';
//
//   res.render('submissions/coming-soon', {
//     title: title
//   });
// });

// References Submission routes
app.get('/submissions/references/:type', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit references'));
  }

  const types = {
    'trainer': 'Trainer Main Reference',
    'monster': 'Monster Main Reference'
  };

  const type = req.params.type;
  const title = types[type] || 'Reference Submission';

  res.render('submissions/coming-soon', {
    title: title
  });
});

// Writing Submission routes
app.get('/submissions/writing/:type', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit writing'));
  }

  const types = {
    'game': 'Game Writing',
    'external': 'External Writing'
  };

  const type = req.params.type;
  const title = types[type] || 'Writing Submission';

  // Get user's trainers for the form
  let trainers = [];
  try {
    trainers = await Trainer.getByUserId(req.session.user.discord_id);
  } catch (error) {
    console.error('Error getting trainers:', error);
  }

  // Check if the view exists, otherwise render coming-soon
  const viewPath = path.join(__dirname, 'views', 'submissions', 'writing', `${type}.ejs`);
  if (fs.existsSync(viewPath)) {
    res.render(`submissions/writing/${type}`, {
      title: title,
      trainers: trainers
    });
  } else {
    res.render('submissions/coming-soon', {
      title: title
    });
  }
});

// References Submission routes
app.get('/submissions/references/:type', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit references'));
  }

  const types = {
    'trainer': 'Trainer Reference',
    'monster': 'Monster Reference'
  };

  const type = req.params.type;
  const title = types[type] || 'Reference Submission';

  res.render('submissions/coming-soon', {
    title: title
  });
});

// Prompts Submission routes
app.get('/submissions/prompts/:type', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to access prompts'));
  }

  const types = {
    'general': 'General Prompts',
    'progression': 'Trainer Progression Prompts',
    'legendary': 'Legendary Prompts',
    'event': 'Event Prompts',
    'monthly': 'Monthly Prompts'
  };

  const type = req.params.type;
  const title = types[type] || 'Prompts';

  // Check if the type is valid
  if (!types[type]) {
    return res.redirect('/submissions');
  }

  // Render the appropriate prompt view
  res.render(`submissions/prompts/${type}`, {
    title: title
  });
});

// Legacy routes for backward compatibility
app.get('/submit_artwork', (_, res) => {
  res.redirect('/submissions/artwork/external');
});

app.get('/submit_writing', (_, res) => {
  res.redirect('/submissions/writing/external');
});

app.get('/submit_references', (_, res) => {
  res.redirect('/submissions/references/monster');
});

// Writing API routes
app.post('/submit_writing/calculate', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { writingType, wordCount, difficultyModifier, participants } = req.body;

    // Validate input
    if (!writingType || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Calculate rewards
    const calculation = {
      wordCount,
      difficultyModifier,
      totalLevels: Math.floor(wordCount / 50) + difficultyModifier,
      totalCoins: wordCount,
      participantRewards: []
    };

    // Calculate rewards per participant
    const participantCount = participants.length;
    const levelsPerParticipant = writingType === 'game' ? calculation.totalLevels : Math.floor(calculation.totalLevels / participantCount);
    const coinsPerParticipant = writingType === 'game' ? calculation.totalCoins : Math.floor(calculation.totalCoins / participantCount);

    // Get participant details
    for (const participant of participants) {
      const { trainerId, monsterId } = participant;

      // Get trainer details
      let trainerName = `Trainer ${trainerId}`;
      try {
        const trainer = await Trainer.getById(trainerId);
        if (trainer) {
          trainerName = trainer.name;
        }
      } catch (error) {
        console.error(`Error getting trainer ${trainerId}:`, error);
      }

      // Get monster details if provided
      let monsterName = null;
      if (monsterId) {
        try {
          const monster = await Monster.getById(monsterId);
          if (monster) {
            monsterName = monster.name;
          }
        } catch (error) {
          console.error(`Error getting monster ${monsterId}:`, error);
        }
      }

      calculation.participantRewards.push({
        trainerId,
        trainerName,
        monsterId: monsterId || null,
        monsterName,
        levels: levelsPerParticipant,
        coins: coinsPerParticipant
      });
    }

    res.json({
      success: true,
      calculation
    });
  } catch (error) {
    console.error('Error calculating writing rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculating writing rewards'
    });
  }
});

app.post('/submit_writing/submit', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const {
      writingType,
      title,
      writingUrl,
      wordCount,
      difficultyModifier,
      notes,
      participants
    } = req.body;

    // Validate input
    if (!writingType || !title || !writingUrl || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Calculate rewards
    const calculation = {
      wordCount,
      difficultyModifier,
      totalLevels: Math.floor(wordCount / 50) + difficultyModifier,
      totalCoins: wordCount,
      participantRewards: []
    };

    // Calculate rewards per participant
    const participantCount = participants.length;
    const levelsPerParticipant = writingType === 'game' ? calculation.totalLevels : Math.floor(calculation.totalLevels / participantCount);
    const coinsPerParticipant = writingType === 'game' ? calculation.totalCoins : Math.floor(calculation.totalCoins / participantCount);

    // Apply rewards to each participant
    for (const participant of participants) {
      const { trainerId, monsterId } = participant;

      // Get trainer details
      let trainerName = `Trainer ${trainerId}`;
      try {
        const trainer = await Trainer.getById(trainerId);
        if (trainer) {
          trainerName = trainer.name;
        }
      } catch (error) {
        console.error(`Error getting trainer ${trainerId}:`, error);
      }

      // Get monster details if provided
      let monsterName = null;
      if (monsterId) {
        try {
          const monster = await Monster.getById(monsterId);
          if (monster) {
            monsterName = monster.name;
          }
        } catch (error) {
          console.error(`Error getting monster ${monsterId}:`, error);
        }
      }

      // Add reward to calculation
      calculation.participantRewards.push({
        trainerId,
        trainerName,
        monsterId: monsterId || null,
        monsterName,
        levels: levelsPerParticipant,
        coins: coinsPerParticipant
      });

      // Apply rewards
      try {
        // Add coins to trainer
        await Trainer.addCoins(trainerId, coinsPerParticipant);

        // Add levels to trainer or monster
        if (monsterId) {
          await Monster.addLevels(monsterId, levelsPerParticipant);
        } else {
          await Trainer.addLevels(trainerId, levelsPerParticipant);
        }
      } catch (error) {
        console.error(`Error applying rewards to trainer ${trainerId}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Writing submission successful',
      calculation
    });
  } catch (error) {
    console.error('Error submitting writing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting writing'
    });
  }
});

app.get('/submit_writing/trainers', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get trainers for the current user
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    res.json({
      success: true,
      trainers
    });
  } catch (error) {
    console.error('Error getting trainers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting trainers'
    });
  }
});

app.get('/submit_writing/trainers/:trainerId/monsters', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const trainerId = req.params.trainerId;

    // Get monsters for the trainer
    const monsters = await Monster.getByTrainerId(trainerId);

    res.json({
      success: true,
      monsters
    });
  } catch (error) {
    console.error('Error getting monsters:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting monsters'
    });
  }
});

// API route to get user's trainers
app.get('/api/user/trainers', async (req, res) => {
  try {
    console.log('API: Received request for /api/user/trainers');

    // Check if user is logged in
    if (!req.session.user) {
      console.log('API: User not logged in');
      return res.status(401).json({ error: 'You must be logged in to access this resource' });
    }

    // Get user's trainers using Discord ID
    const userDiscordId = req.session.user.discord_id;
    console.log(`API: Looking up trainers for Discord ID: ${userDiscordId}`);

    if (!userDiscordId) {
      console.log('API: No Discord ID found for user');
      return res.status(403).json({ error: 'You need to have a Discord ID linked to your account' });
    }

    // For testing, if no Trainer model is available, return mock data
    if (typeof Trainer === 'undefined' || !Trainer.getByUserId) {
      console.log('API: Trainer model not available, returning mock data');
      const mockTrainers = [
        { id: 1, name: 'Mock Trainer 1', player_user_id: userDiscordId },
        { id: 2, name: 'Mock Trainer 2', player_user_id: userDiscordId }
      ];
      return res.json(mockTrainers);
    }

    const trainers = await Trainer.getByUserId(userDiscordId);
    console.log(`API: Found ${trainers?.length || 0} trainers for user`);
    res.json(trainers || []);
  } catch (error) {
    console.error('Error fetching user trainers:', error);
    res.status(500).json({ error: 'Error fetching trainers' });
  }
});

// API route to get monsters for a trainer
app.get('/api/trainers/:trainerId/monsters', async (req, res) => {
  try {
    console.log(`API: Received request for /api/trainers/${req.params.trainerId}/monsters`);

    // Check if user is logged in
    if (!req.session.user) {
      console.log('API: User not logged in');
      return res.status(401).json({ error: 'You must be logged in to access this resource' });
    }

    const trainerId = req.params.trainerId;
    console.log(`API: Looking up trainer with ID: ${trainerId}`);

    // For testing, if no Trainer model is available, use mock data
    if (typeof Trainer === 'undefined' || !Trainer.getById) {
      console.log('API: Trainer model not available, using mock data');
      const mockTrainer = {
        id: parseInt(trainerId),
        name: `Mock Trainer ${trainerId}`,
        player_user_id: req.session.user.discord_id
      };

      // Generate mock monsters
      const mockMonsters = [
        { id: 101, name: 'Pikachu', trainer_id: parseInt(trainerId) },
        { id: 102, name: 'Charmander', trainer_id: parseInt(trainerId) },
        { id: 103, name: 'Bulbasaur', trainer_id: parseInt(trainerId) }
      ];

      console.log(`API: Returning ${mockMonsters.length} mock monsters for trainer ${trainerId}`);
      return res.json(mockMonsters);
    }

    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      console.log(`API: Trainer with ID ${trainerId} not found`);
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Note: We're allowing any user to access any trainer's monsters
    // This is because characters can appear in artwork by different users
    console.log(`API: Allowing access to monsters for trainer ${trainerId} regardless of ownership`);

    // For testing, if no Monster model is available, return mock data
    if (typeof Monster === 'undefined' || !Monster.getByTrainerId) {
      console.log('API: Monster model not available, returning mock data');
      const mockMonsters = [
        { id: 101, name: 'Pikachu', trainer_id: parseInt(trainerId) },
        { id: 102, name: 'Charmander', trainer_id: parseInt(trainerId) },
        { id: 103, name: 'Bulbasaur', trainer_id: parseInt(trainerId) }
      ];
      return res.json(mockMonsters);
    }

    const monsters = await Monster.getByTrainerId(trainerId);
    console.log(`API: Found ${monsters?.length || 0} monsters for trainer ${trainerId}`);
    res.json(monsters || []);
  } catch (error) {
    console.error('Error fetching trainer monsters:', error);
    res.status(500).json({ error: 'Error fetching monsters' });
  }
});

// API route to apply levels to a trainer
app.post('/api/trainers/:trainerId/apply-levels', async (req, res) => {
  try {
    console.log(`API: Received request to apply levels to trainer ${req.params.trainerId}`);

    // Check if user is logged in
    if (!req.session.user) {
      console.log('API: User not logged in');
      return res.status(401).json({ error: 'You must be logged in to apply levels' });
    }

    const trainerId = req.params.trainerId;
    const { levels, coins } = req.body;
    console.log(`API: Applying ${levels} levels and ${coins} coins to trainer ${trainerId}`);

    // Validate input
    if (isNaN(levels) || levels <= 0) {
      console.log(`API: Invalid level amount: ${levels}`);
      return res.status(400).json({ error: 'Invalid level amount' });
    }

    if (isNaN(coins) || coins < 0) {
      console.log(`API: Invalid coin amount: ${coins}`);
      return res.status(400).json({ error: 'Invalid coin amount' });
    }

    // For testing, if no Trainer model is available, use mock data
    if (typeof Trainer === 'undefined' || !Trainer.getById) {
      console.log('API: Trainer model not available, using mock data');
      const mockTrainer = {
        id: parseInt(trainerId),
        name: `Mock Trainer ${trainerId}`,
        player_user_id: req.session.user.discord_id,
        level: 10,
        currency_amount: 500,
        total_earned_currency: 1000
      };

      // Simulate updating the trainer
      const updatedTrainer = {
        ...mockTrainer,
        level: mockTrainer.level + levels,
        currency_amount: mockTrainer.currency_amount + coins,
        total_earned_currency: mockTrainer.total_earned_currency + coins
      };

      console.log(`API: Mock trainer updated: Level ${updatedTrainer.level}, Coins ${updatedTrainer.currency_amount}`);
      return res.json(updatedTrainer);
    }

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      console.log(`API: Trainer with ID ${trainerId} not found`);
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Note: We're allowing any user to assign levels to any trainer
    // This is because characters can appear in artwork by different users
    console.log(`API: Allowing level assignment to trainer ${trainerId} regardless of ownership`);

    // Update trainer levels and coins
    const updatedTrainer = {
      ...trainer,
      level: trainer.level + levels,
      currency_amount: trainer.currency_amount + coins,
      total_earned_currency: trainer.total_earned_currency + coins
    };

    // Save the updated trainer
    await Trainer.update(trainerId, updatedTrainer);
    console.log(`API: Trainer ${trainerId} updated successfully`);

    // Get the updated trainer
    const refreshedTrainer = await Trainer.getById(trainerId);

    res.json(refreshedTrainer);
  } catch (error) {
    console.error('Error applying levels to trainer:', error);
    res.status(500).json({ error: 'Error applying levels to trainer' });
  }
});

// API route to apply levels to a monster
app.post('/api/monsters/:monsterId/apply-levels', async (req, res) => {
  try {
    console.log(`API: Received request to apply levels to monster ${req.params.monsterId}`);

    // Check if user is logged in
    if (!req.session.user) {
      console.log('API: User not logged in');
      return res.status(401).json({ error: 'You must be logged in to apply levels' });
    }

    const monsterId = req.params.monsterId;
    const { levels, coins } = req.body;
    console.log(`API: Applying ${levels} levels and ${coins} coins for monster ${monsterId}`);

    // Validate input
    if (isNaN(levels) || levels <= 0) {
      console.log(`API: Invalid level amount: ${levels}`);
      return res.status(400).json({ error: 'Invalid level amount' });
    }

    if (isNaN(coins) || coins < 0) {
      console.log(`API: Invalid coin amount: ${coins}`);
      return res.status(400).json({ error: 'Invalid coin amount' });
    }

    // For testing, if no Monster model is available, use mock data
    if (typeof Monster === 'undefined' || !Monster.getById) {
      console.log('API: Monster model not available, using mock data');

      // Create mock monster and trainer
      const mockMonster = {
        id: parseInt(monsterId),
        name: `Mock Monster ${monsterId}`,
        trainer_id: 1,
        level: 5
      };

      const mockTrainer = {
        id: mockMonster.trainer_id,
        name: 'Mock Trainer',
        player_user_id: req.session.user.discord_id,
        level: 10,
        currency_amount: 500,
        total_earned_currency: 1000
      };

      // Simulate updating the monster and trainer
      const updatedMonster = {
        ...mockMonster,
        level: mockMonster.level + levels
      };

      console.log(`API: Mock monster updated: Level ${updatedMonster.level}`);
      console.log(`API: Mock trainer would receive ${coins} coins`);

      return res.json(updatedMonster);
    }

    // Get the monster
    const monster = await Monster.getById(monsterId);

    if (!monster) {
      console.log(`API: Monster with ID ${monsterId} not found`);
      return res.status(404).json({ error: 'Monster not found' });
    }

    // Get the trainer who owns the monster
    const trainer = await Trainer.getById(monster.trainer_id);

    if (!trainer) {
      console.log(`API: Trainer for monster ${monsterId} not found`);
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Note: We're allowing any user to assign levels to any monster
    // This is because characters can appear in artwork by different users
    console.log(`API: Allowing level assignment to monster ${monsterId} regardless of ownership`);

    // Update monster level and calculate new stats and moves
    const newLevel = monster.level + levels;
    console.log(`API: Updating monster ${monsterId} from level ${monster.level} to ${newLevel}`);

    // Calculate new stats based on the new level
    const baseStats = MonsterInitializer.calculateBaseStats(newLevel);
    console.log(`API: Calculated new base stats for level ${newLevel}:`, baseStats);

    // Get current moveset
    let currentMoves = [];
    try {
      if (monster.moveset) {
        currentMoves = JSON.parse(monster.moveset);
      }
    } catch (movesetError) {
      console.error(`API: Error parsing current moveset for monster ${monsterId}:`, movesetError);
      currentMoves = [];
    }

    // Calculate how many moves the monster should have based on new level
    const oldMoveCount = Math.max(1, Math.floor(monster.level / 5) + 1);
    const newMoveCount = Math.max(1, Math.floor(newLevel / 5) + 1);

    console.log(`API: Monster should have ${oldMoveCount} moves at level ${monster.level} and ${newMoveCount} moves at level ${newLevel}`);

    // If the monster should learn new moves, get them
    let updatedMoves = [...currentMoves];
    if (newMoveCount > oldMoveCount) {
      console.log(`API: Monster will learn ${newMoveCount - oldMoveCount} new moves`);
      try {
        // Get new moves
        const newMoves = await MonsterInitializer.getMovesForMonster(monster, newMoveCount - oldMoveCount);
        console.log(`API: New moves for monster ${monsterId}:`, newMoves);

        // Add new moves to the moveset
        updatedMoves = [...currentMoves, ...newMoves];
      } catch (moveError) {
        console.error(`API: Error getting new moves for monster ${monsterId}:`, moveError);
        // Continue with current moves if there's an error
      }
    }

    // Update monster with new level, stats, and moves
    const updatedMonster = {
      ...monster,
      level: newLevel,
      ...baseStats,
      moveset: JSON.stringify(updatedMoves)
    };

    // Update trainer coins
    const updatedTrainer = {
      ...trainer,
      currency_amount: trainer.currency_amount + coins,
      total_earned_currency: trainer.total_earned_currency + coins
    };

    // Save the updated monster and trainer
    await Monster.update(monsterId, updatedMonster);
    await Trainer.update(trainer.id, updatedTrainer);
    console.log(`API: Monster ${monsterId} and trainer ${trainer.id} updated successfully`);
    console.log(`API: Monster now has ${updatedMoves.length} moves:`, updatedMoves);

    // Get the updated monster
    const refreshedMonster = await Monster.getById(monsterId);

    res.json(refreshedMonster);
  } catch (error) {
    console.error('Error applying levels to monster:', error);
    res.status(500).json({ error: 'Error applying levels to monster' });
  }
});

// Schedule Management routes
app.get('/manage_schedule', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to manage your schedule'));
    }

    // Get user's trainers using Discord ID
    const userDiscordId = req.session.user.discord_id;
    if (!userDiscordId) {
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to manage your schedule',
        error: { status: 403 }
      });
    }

    // Get trainers with the user's Discord ID
    const trainers = await Trainer.getByUserId(userDiscordId);

    // If user has no trainers, redirect to add trainer page
    if (!trainers || trainers.length === 0) {
      return res.redirect('/add_trainer?error=' + encodeURIComponent('You need to create a trainer first'));
    }

    // Default to the first trainer if none is selected
    const selectedTrainerId = req.query.trainer_id || trainers[0].id;

    // Get the selected trainer
    const selectedTrainer = trainers.find(t => t.id == selectedTrainerId) || trainers[0];

    // Get today's date
    const today = new Date();
    const dateStr = req.query.date || today.toISOString().split('T')[0];
    const selectedDate = new Date(dateStr);

    // Get tasks for the selected date
    const tasks = await Task.getByTrainerIdAndDate(selectedTrainer.id, selectedDate);

    // Get all habits
    const habits = await Habit.getByTrainerId(selectedTrainer.id);

    // Get all templates
    const templates = await TaskTemplate.getByTrainerId(selectedTrainer.id);

    // Get the trainer's monsters for binding
    const monsters = await Monster.getByTrainerId(selectedTrainer.id);

    res.render('schedule/index', {
      title: 'Manage Schedule',
      trainers,
      selectedTrainer,
      selectedDate,
      tasks,
      habits,
      templates,
      monsters
    });
  } catch (error) {
    console.error('Error loading schedule management page:', error);
    res.status(500).render('error', {
      message: 'Error loading schedule management page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Task routes
app.post('/tasks', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to create a task' });
    }

    // Handle empty string values for timestamps
    const taskData = { ...req.body };
    if (taskData.due_date === '') taskData.due_date = null;
    if (taskData.reminder_time === '') taskData.reminder_time = null;

    // Create the task
    const task = await Task.create(taskData);

    // If reminder is enabled and reminder_time is valid, create a reminder
    if (task.reminder_enabled && task.reminder_time) {
      try {
        await Reminder.create({
          task_id: task.task_id,
          trainer_id: task.trainer_id,
          scheduled_time: new Date(task.reminder_time)
        });
      } catch (reminderError) {
        console.error('Error creating reminder:', reminderError);
        // Continue even if reminder creation fails
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error creating task: ' + error.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to update a task' });
    }

    const taskId = req.params.id;

    // Update the task
    const task = await Task.update(taskId, req.body);

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Error updating task' });
  }
});

app.post('/tasks/:id/complete', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to complete a task' });
    }

    const taskId = req.params.id;
    const { awarded_to_mon_id, awarded_to_trainer_id } = req.body;

    // Complete the task
    const task = await Task.complete(taskId, awarded_to_mon_id, awarded_to_trainer_id);

    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Error completing task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to delete a task' });
    }

    const taskId = req.params.id;

    // Delete the task
    const deleted = await Task.delete(taskId);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

// Habit routes
app.post('/habits', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to create a habit' });
    }

    // Create the habit
    const habit = await Habit.create(req.body);

    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Error creating habit' });
  }
});

app.put('/habits/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to update a habit' });
    }

    const habitId = req.params.id;

    // Update the habit
    const habit = await Habit.update(habitId, req.body);

    res.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Error updating habit' });
  }
});

app.post('/habits/:id/complete', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to complete a habit' });
    }

    const habitId = req.params.id;
    const { awarded_to_mon_id, awarded_to_trainer_id } = req.body;

    // Complete the habit
    const result = await Habit.complete(habitId, awarded_to_mon_id, awarded_to_trainer_id);

    res.json(result);
  } catch (error) {
    console.error('Error completing habit:', error);
    res.status(500).json({ error: 'Error completing habit' });
  }
});

app.delete('/habits/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to delete a habit' });
    }

    const habitId = req.params.id;
    console.log(`Received request to delete habit with ID ${habitId}`);

    // Get the habit first to check if it exists and belongs to the user
    const habit = await Habit.getById(habitId);
    if (!habit) {
      console.log(`Habit with ID ${habitId} not found`);
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Skip permission check for now - just check if the habit exists
    // We'll implement proper permission checking later

    // Permission check removed for now

    // Delete the habit
    console.log(`Deleting habit with ID ${habitId}`);
    const deleted = await Habit.delete(habitId);

    if (deleted) {
      console.log(`Successfully deleted habit with ID ${habitId}`);
      res.json({ success: true });
    } else {
      console.log(`Failed to delete habit with ID ${habitId}`);
      res.status(500).json({ error: 'Failed to delete habit' });
    }
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: `Error deleting habit: ${error.message}` });
  }
});

// Template routes
app.post('/templates', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to create a template' });
    }

    // Process tasks to handle empty time values
    const templateData = { ...req.body };
    if (templateData.tasks && Array.isArray(templateData.tasks)) {
      templateData.tasks = templateData.tasks.map(task => {
        if (task.time === '') delete task.time;
        if (task.reminder_time === '') delete task.reminder_time;
        return task;
      });
    }

    // Create the template
    const template = await TaskTemplate.create(templateData);

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Error creating template: ' + error.message });
  }
});

app.put('/templates/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to update a template' });
    }

    const templateId = req.params.id;

    // Process tasks to handle empty time values
    const templateData = { ...req.body };
    if (templateData.tasks && Array.isArray(templateData.tasks)) {
      templateData.tasks = templateData.tasks.map(task => {
        if (task.time === '') delete task.time;
        if (task.reminder_time === '') delete task.reminder_time;
        return task;
      });
    }

    // Update the template
    const template = await TaskTemplate.update(templateId, templateData);

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Error updating template: ' + error.message });
  }
});

app.get('/templates/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to view a template' });
    }

    const templateId = req.params.id;

    // Get the template
    const template = await TaskTemplate.getById(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Error getting template' });
  }
});

app.post('/templates/:id/apply', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to apply a template' });
    }

    const templateId = req.params.id;
    const { due_date } = req.body;

    // Validate due_date
    if (!due_date) {
      return res.status(400).json({ error: 'Due date is required' });
    }

    // Apply the template
    const tasks = await TaskTemplate.apply(templateId, new Date(due_date));

    res.json(tasks);
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: 'Error applying template: ' + error.message });
  }
});

app.delete('/templates/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to delete a template' });
    }

    const templateId = req.params.id;

    // Delete the template
    const deleted = await TaskTemplate.delete(templateId);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Error deleting template' });
  }
});

// Guide system routes
app.get('/guides', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'guides', 'overview.md');
  const content = loadMarkdownContent(contentPath);

  res.render('guides/index', {
    title: 'Game Guides',
    categories,
    activeCategory: 'guides',
    currentPath: '',
    content
  });
});

// Add redirect for old guide URLs to new content prefix pattern
app.get('/guides/:path(*)', (req, res) => {
  res.redirect(`/content/guides/${req.params.path}`);
});

app.get('/lore', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'lore', 'overview.md');
  const content = loadMarkdownContent(contentPath);

  res.render('guides/index', {
    title: 'Lore',
    categories,
    activeCategory: 'lore',
    currentPath: '',
    content
  });
});

// Add redirect for old lore URLs to new content prefix pattern
app.get('/lore/:path(*)', (req, res) => {
  res.redirect(`/content/lore/${req.params.path}`);
});

app.get('/factions', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'factions', 'overview.md');
  const content = loadMarkdownContent(contentPath);

  res.render('guides/index', {
    title: 'Factions',
    categories,
    activeCategory: 'factions',
    currentPath: '',
    content
  });
});

// Add redirect for old faction URLs to new content prefix pattern
app.get('/factions/:path(*)', (req, res) => {
  res.redirect(`/content/factions/${req.params.path}`);
});

app.get('/npcs', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'npcs', 'overview.md');
  const content = loadMarkdownContent(contentPath);

  res.render('guides/index', {
    title: 'NPCs',
    categories,
    activeCategory: 'npcs',
    currentPath: '',
    content
  });
});

// Add redirect for old NPC URLs to new content prefix pattern
app.get('/npcs/:path(*)', (req, res) => {
  res.redirect(`/content/npcs/${req.params.path}`);
});

app.get('/locations', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'locations', 'overview.md');
  const content = loadMarkdownContent(contentPath);

  res.render('guides/index', {
    title: 'Locations',
    categories,
    activeCategory: 'locations',
    currentPath: '',
    content
  });
});

// Add redirect for old location URLs to new content prefix pattern
app.get('/locations/:path(*)', (req, res) => {
  res.redirect(`/content/locations/${req.params.path}`);
});

// Statistics routes
app.get('/statistics', async (req, res) => {
  try {
    // Get all trainers
    const allTrainers = await Trainer.getAll();

    // Group trainers by player
    const playerTrainers = {};
    const playerMapping = {};

    // Get all users to create player mapping
    const usersResult = await pool.query('SELECT id, username, discord_id, display_name FROM users');
    usersResult.rows.forEach(user => {
      if (user.discord_id) {
        // Prefer display_name if available, otherwise use username
        playerMapping[user.discord_id] = user.display_name || user.username || user.discord_id;
      }
    });

    // Add 'NPC' mapping
    playerMapping['NPC'] = 'NPC';

    // Process all trainers
    allTrainers.forEach(trainer => {
      const playerId = trainer.player_user_id || 'NPC';
      if (!playerTrainers[playerId]) {
        playerTrainers[playerId] = [];
      }
      playerTrainers[playerId].push(trainer);
    });

    // Calculate global statistics
    const globalStats = {
      totalTrainers: allTrainers.length,
      totalMonsters: allTrainers.reduce((sum, trainer) => {
        // Make sure we're using a number
        const monsterCount = parseInt(trainer.monster_count || 0);
        return sum + monsterCount;
      }, 0),
      totalUsers: Object.keys(playerTrainers).length
    };

    // Find most active player (most trainers)
    let mostTrainers = { player_name: 'None', trainer_count: 0 };
    let leastTrainers = { player_name: 'None', trainer_count: Number.MAX_SAFE_INTEGER };

    for (const [playerId, trainers] of Object.entries(playerTrainers)) {
      if (trainers.length > mostTrainers.trainer_count) {
        mostTrainers = { player_name: playerId, trainer_count: trainers.length };
      }
      if (trainers.length < leastTrainers.trainer_count && trainers.length > 0) {
        leastTrainers = { player_name: playerId, trainer_count: trainers.length };
      }
    }

    // Find most referenced player and trainer
    let mostReferenced = { player_name: 'None', reference_percentage: 0 };
    let trainerMostReferenced = { name: 'None', reference_percentage: 0 };

    for (const [playerId, trainers] of Object.entries(playerTrainers)) {
      const totalMonsters = trainers.reduce((sum, t) => sum + (t.monster_count || 0), 0);
      const totalReferenced = trainers.reduce((sum, t) => sum + (t.monster_ref_count || 0), 0);
      const refPercentage = totalMonsters > 0 ? (totalReferenced / totalMonsters) * 100 : 0;

      if (refPercentage > mostReferenced.reference_percentage && totalMonsters > 10) {
        mostReferenced = { player_name: playerId, reference_percentage: refPercentage };
      }

      // Check each trainer
      trainers.forEach(trainer => {
        const trainerRefPercentage = trainer.monster_count > 0 ?
          (trainer.monster_ref_count / trainer.monster_count) * 100 : 0;

        if (trainerRefPercentage > trainerMostReferenced.reference_percentage && trainer.monster_count > 10) {
          trainerMostReferenced = {
            name: trainer.name,
            reference_percentage: trainerRefPercentage
          };
        }
      });
    }

    // Calculate type leaderboard
    const typeLeaderboard = {};

    // First, get all monster types for each trainer
    const trainerTypes = {};
    for (const trainer of allTrainers) {
      const trainerId = trainer.id;
      trainerTypes[trainerId] = {};

      // Get all monsters for this trainer
      const monstersQuery = `
        SELECT type1, type2, type3, type4, type5 FROM mons WHERE trainer_id = $1
      `;
      const monstersResult = await pool.query(monstersQuery, [trainerId]);

      // Count types
      monstersResult.rows.forEach(monster => {
        ['type1', 'type2', 'type3', 'type4', 'type5'].forEach(typeField => {
          if (monster[typeField]) {
            const type = monster[typeField];
            trainerTypes[trainerId][type] = (trainerTypes[trainerId][type] || 0) + 1;
          }
        });
      });
    }

    // Find the player and trainer with most of each type
    const allTypes = new Set();
    Object.values(trainerTypes).forEach(types => {
      Object.keys(types).forEach(type => allTypes.add(type));
    });

    allTypes.forEach(type => {
      let maxPlayerCount = 0;
      let maxPlayerId = 'None';
      let maxTrainerCount = 0;
      let maxTrainerName = 'None';

      // Check each player
      for (const [playerId, trainers] of Object.entries(playerTrainers)) {
        let playerTypeCount = 0;

        // Sum up type counts across all trainers for this player
        trainers.forEach(trainer => {
          if (trainerTypes[trainer.id] && trainerTypes[trainer.id][type]) {
            playerTypeCount += trainerTypes[trainer.id][type];

            // Check if this trainer has more of this type
            if (trainerTypes[trainer.id][type] > maxTrainerCount) {
              maxTrainerCount = trainerTypes[trainer.id][type];
              maxTrainerName = trainer.name;
            }
          }
        });

        // Check if this player has more of this type
        if (playerTypeCount > maxPlayerCount) {
          maxPlayerCount = playerTypeCount;
          maxPlayerId = playerId;
        }
      }

      typeLeaderboard[type] = {
        player: maxPlayerId,
        player_count: maxPlayerCount,
        trainer: maxTrainerName,
        trainer_count: maxTrainerCount
      };
    });

    // Calculate per-player statistics
    const playerStats = {};

    for (const [playerId, trainers] of Object.entries(playerTrainers)) {
      // Skip if no trainers
      if (trainers.length === 0) continue;

      // Basic stats
      const totalMonsters = trainers.reduce((sum, t) => {
        const monsterCount = parseInt(t.monster_count || 0);
        return sum + monsterCount;
      }, 0);
      const totalReferences = trainers.reduce((sum, t) => {
        const refCount = parseInt(t.monster_ref_count || 0);
        return sum + refCount;
      }, 0);
      const refPercentage = totalMonsters > 0 ? (totalReferences / totalMonsters) * 100 : 0;

      // Currency ranges
      const currencies = trainers.map(t => t.currency_amount || 0);
      const totalEarned = trainers.map(t => t.total_earned_currency || 0);

      // Type counts for this player
      const typeCounts = {};
      trainers.forEach(trainer => {
        if (trainerTypes[trainer.id]) {
          Object.entries(trainerTypes[trainer.id]).forEach(([type, count]) => {
            typeCounts[type] = (typeCounts[type] || 0) + count;
          });
        }
      });

      // Trainer stats with most common type
      const trainerStats = trainers.map(trainer => {
        // Find most common type for this trainer
        let mostCommonType = 'None';
        let maxCount = 0;

        if (trainerTypes[trainer.id]) {
          Object.entries(trainerTypes[trainer.id]).forEach(([type, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommonType = type;
            }
          });
        }

        const monsterCount = parseInt(trainer.monster_count || 0);
        const referenceCount = parseInt(trainer.monster_ref_count || 0);
        const referencePercentage = monsterCount > 0 ?
          (referenceCount / monsterCount) * 100 : 0;

        return {
          id: trainer.id,
          name: trainer.name,
          monster_count: monsterCount,
          reference_count: referenceCount,
          reference_percentage: referencePercentage,
          currency_amount: trainer.currency_amount || 0,
          total_earned_currency: trainer.total_earned_currency || 0,
          most_common_type: mostCommonType
        };
      });

      playerStats[playerId] = {
        trainer_count: trainers.length,
        total_monsters: totalMonsters,
        total_references: totalReferences,
        reference_percentage: refPercentage,
        lowest_currency: Math.min(...currencies),
        highest_currency: Math.max(...currencies),
        lowest_total_earned: Math.min(...totalEarned),
        highest_total_earned: Math.max(...totalEarned),
        type_counts: typeCounts,
        trainer_stats: trainerStats
      };
    }

    // Helper function to get player display name
    const getPlayerMapping = () => {
      return playerMapping;
    };

    res.render('statistics/index', {
      title: 'Trainer Statistics',
      globalStats,
      mostTrainers,
      leastTrainers,
      mostReferenced,
      trainerMostReferenced,
      typeLeaderboard,
      playerStats,
      getPlayerMapping: () => playerMapping
    });
  } catch (error) {
    console.error('Error rendering statistics page:', error);
    res.status(500).render('error', {
      message: 'Error loading statistics page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Fakemon Dex routes
app.get('/fakedex', (req, res) => {
  const fakemonList = loadAllFakemon();

  res.render('fakemon/index', {
    title: 'Fakemon Dex',
    fakemon_list: fakemonList
  });
});

app.get('/fakedex/:number', (req, res) => {
  const number = req.params.number;
  const currentMon = getFakemonByNumber(number);

  if (!currentMon) {
    return res.status(404).send('Fakemon not found');
  }

  // Get previous and next Fakemon for navigation
  const fakemonList = loadAllFakemon();
  const currentIndex = fakemonList.findIndex(mon => mon.number === number);

  const prevMon = currentIndex > 0 ? fakemonList[currentIndex - 1] : null;
  const nextMon = currentIndex < fakemonList.length - 1 ? fakemonList[currentIndex + 1] : null;

  res.render('fakemon/detail', {
    title: `#${currentMon.number} ${currentMon.name} - Fakemon Dex`,
    current_mon: currentMon,
    prev_mon: prevMon,
    next_mon: nextMon,
    fakemon_list: fakemonList
  });
});

// Admin Fakemon Management Routes
app.get('/admin/fakemon', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const fakemonList = loadAllFakemon();
  const message = req.query.message || '';
  const messageType = req.query.messageType || 'success';

  res.render('admin/fakemon/index', {
    title: 'Fakemon Management',
    fakemon_list: fakemonList,
    message,
    messageType
  });
});

app.get('/admin/fakemon/add', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const nextNumber = getNextFakemonNumber();

  res.render('admin/fakemon/form', {
    title: 'Add New Fakemon',
    fakemon: {
      number: nextNumber,
      name: '',
      species_class: 'The Something Pokemon',
      types: ['Normal'],
      attribute: 'Data',
      abilities: ['Ability1'],
      height: '1.0 m',
      weight: '20.0 kg',
      stats: {
        hp: '45',
        atk: '49',
        def: '49',
        spatk: '65',
        spdef: '65',
        spe: '45'
      },
      pokedex_entry: '',
      evolution_line: [],
      artist_caption: ''
    },
    isNew: true
  });
});

app.get('/admin/fakemon/edit/:number', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const number = req.params.number;
  const fakemon = getFakemonByNumber(number);

  if (!fakemon) {
    return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Fakemon not found'));
  }

  res.render('admin/fakemon/form', {
    title: `Edit Fakemon #${fakemon.number}`,
    fakemon,
    isNew: false
  });
});

app.post('/admin/fakemon/save', upload.single('image'), (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  try {
    const {
      number,
      name,
      species_class,
      types,
      attribute,
      abilities,
      height,
      weight,
      hp,
      atk,
      def,
      spatk,
      spdef,
      spe,
      pokedex_entry,
      evolution_line,
      artist_caption,
      isNew
    } = req.body;

    // Validate required fields
    if (!number || !name || !types) {
      return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Missing required fields'));
    }

    // Create fakemon object
    const fakemon = {
      number: number.padStart(3, '0'),
      name,
      species_class,
      types: Array.isArray(types) ? types : [types],
      attribute,
      abilities: Array.isArray(abilities) ? abilities : [abilities],
      height,
      weight,
      stats: {
        hp: hp || '45',
        atk: atk || '49',
        def: def || '49',
        spatk: spatk || '65',
        spdef: spdef || '65',
        spe: spe || '45'
      },
      pokedex_entry,
      evolution_line: evolution_line ? JSON.parse(evolution_line) : [],
      artist_caption,
      image_path: `/images/fakemon/${number.padStart(3, '0')}.png`
    };

    // Save fakemon to markdown file
    const saveResult = saveFakemon(fakemon);

    if (!saveResult) {
      return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error saving Fakemon'));
    }

    // Handle image upload if provided
    if (req.file) {
      const imagePath = path.join(__dirname, 'public', 'images', 'fakemon', `${fakemon.number}.png`);
      fs.renameSync(req.file.path, imagePath);
    }

    res.redirect('/admin/fakemon?message=' + encodeURIComponent(`Fakemon #${fakemon.number} ${isNew === 'true' ? 'created' : 'updated'} successfully`));
  } catch (error) {
    console.error('Error saving Fakemon:', error);
    res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

app.post('/admin/fakemon/delete/:number', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }

  const number = req.params.number;

  try {
    // Delete fakemon markdown file
    const deleteResult = deleteFakemon(number);

    if (!deleteResult) {
      return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error deleting Fakemon'));
    }

    // Try to delete image file if it exists
    const imagePath = path.join(__dirname, 'public', 'images', 'fakemon', `${number.padStart(3, '0')}.png`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.redirect('/admin/fakemon?message=' + encodeURIComponent(`Fakemon #${number} deleted successfully`));
  } catch (error) {
    console.error('Error deleting Fakemon:', error);
    res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Reference To-Do List route - shows monsters that need artwork
app.get('/reference_todo', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to view your reference to-do list'));
    }

    // Get the user's Discord ID
    const userDiscordId = req.session.user.discord_id;
    if (!userDiscordId) {
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to view your reference to-do list',
        error: { status: 403 }
      });
    }

    // Get all trainers for the user
    const trainers = await Trainer.getByUserId(userDiscordId);

    // For each trainer, get monsters that need artwork
    const trainersWithMonsters = [];

    for (const trainer of trainers) {
      // Get all monsters for this trainer
      const allMonsters = await Monster.getByTrainerId(trainer.id);

      // Filter monsters that need artwork (img_link is null or default_mon.png)
      const monstersNeedingArtwork = allMonsters.filter(monster =>
        !monster.img_link || monster.img_link === '' || monster.img_link === 'default_mon.png'
      );

      // Add to the list if there are monsters needing artwork
      if (monstersNeedingArtwork.length > 0) {
        trainersWithMonsters.push({
          trainer: trainer,
          monsters: monstersNeedingArtwork,
          count: monstersNeedingArtwork.length
        });
      }
    }

    // Sort trainers by default (most references needed first)
    trainersWithMonsters.sort((a, b) => b.count - a.count);

    res.render('trainers/reference_todo', {
      title: 'Reference To-Do List',
      trainersWithMonsters,
      sortOrder: 'most' // Default sort order
    });
  } catch (error) {
    console.error('Error getting reference to-do list:', error);
    res.status(500).render('error', {
      message: 'Error getting reference to-do list',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Trainer routes
app.get('/trainers', async (req, res) => {
  try {
    let trainers = [];
    try {
      trainers = await Trainer.getAll();
    } catch (dbError) {
      console.error('Database error getting trainers:', dbError);
      // Continue with empty trainers array
    }

    res.render('trainers/index', {
      title: 'Trainer Directory',
      trainers
    });
  } catch (error) {
    console.error('Error getting trainers:', error);
    res.status(500).send('An error occurred while getting trainers');
  }
});

// My Trainers route - shows trainers belonging to the logged-in user
app.get('/my_trainers', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to view your trainers'));
    }

    // Get the user's Discord ID
    const userDiscordId = req.session.user.discord_id;
    if (!userDiscordId) {
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to view your trainers',
        error: { status: 403 }
      });
    }

    // Query for trainers with the user's Discord ID
    const query = 'SELECT * FROM trainers WHERE player_user_id = $1 ORDER BY name';
    const result = await pool.query(query, [userDiscordId]);
    const trainers = result.rows;

    // Get monster counts for each trainer
    for (const trainer of trainers) {
      // Count total monsters
      const monsterCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
      const monsterCountResult = await pool.query(monsterCountQuery, [trainer.id]);
      trainer.monster_count = parseInt(monsterCountResult.rows[0].count) || 0;

      // Count monsters with references (non-empty img_link)
      const monsterRefCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND img_link IS NOT NULL AND img_link != \'\'';
      const monsterRefCountResult = await pool.query(monsterRefCountQuery, [trainer.id]);
      trainer.monster_ref_count = parseInt(monsterRefCountResult.rows[0].count) || 0;

      // Calculate percentage
      trainer.monster_ref_percent = trainer.monster_count > 0
        ? Math.round((trainer.monster_ref_count / trainer.monster_count) * 100)
        : 0;
    }

    res.render('trainers/my_trainers', {
      title: 'My Trainers',
      trainers
    });
  } catch (error) {
    console.error('Error getting user\'s trainers:', error);
    res.status(500).render('error', {
      message: 'Error getting your trainers',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

app.get('/trainers/:id', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get battle box monsters
    const battle_box_mons = await Trainer.getBattleBoxMonsters(trainerId);

    // Get all monsters for this trainer
    const monsters = await Monster.getByTrainerId(trainerId);

    // If no battle box monsters were found, try to filter them manually
    if (battle_box_mons.length === 0 && monsters.length > 0) {
      const manualBattleBox = monsters.filter(mon => mon.box_number === -1 || mon.box_number === 1);
      if (manualBattleBox.length > 0) {
        battle_box_mons.push(...manualBattleBox);
      }
    }

    res.render('trainers/detail', {
      trainer,
      battle_box_mons,
      monsters,
      all_monsters: monsters, // Pass all monsters for the starter button check
      title: `${trainer.name} - Trainer Profile`
      // No need to pass user explicitly, it's already available via res.locals.user
    });
  } catch (error) {
    console.error('Error getting trainer details:', error);
    res.status(500).render('error', {
      message: 'Error loading trainer details',
      error: { status: 500 }
    });
  }
});

// API routes

// Update monster box assignments
app.post('/api/trainers/:id/update-boxes', async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id, 10);
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid updates format' });
    }

    // Check if user is authorized to update this trainer's monsters
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Check if the user is the owner of this trainer
    if (!req.session.user || (req.session.user.discord_id && req.session.user.discord_id.toString() !== trainer.player_user_id)) {
      return res.status(403).json({ error: 'Not authorized to update this trainer\'s monsters' });
    }

    // Process updates
    const results = [];
    for (const update of updates) {
      const { monId, boxNumber, trainerIndex } = update;

      if (!monId || boxNumber === undefined || trainerIndex === undefined) {
        results.push({ monId, success: false, error: 'Missing required fields' });
        continue;
      }

      try {
        // Update the monster's box number and trainer index
        await pool.query(
          'UPDATE mons SET box_number = $1, trainer_index = $2, updated_at = CURRENT_TIMESTAMP WHERE mon_id = $3 AND trainer_id = $4',
          [boxNumber, trainerIndex, monId, trainerId]
        );

        results.push({ monId, success: true });
      } catch (error) {
        console.error(`Error updating monster ${monId}:`, error);
        results.push({ monId, success: false, error: error.message });
      }
    }

    return res.json({ results });
  } catch (error) {
    console.error('Error updating boxes:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

app.get('/api/trainers/:id', async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id, 10);

    if (isNaN(trainerId)) {
      return res.status(400).json({ error: 'Invalid trainer ID format' });
    }

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    const battle_box_mons = await Trainer.getBattleBoxMonsters(trainerId);

    return res.json({
      trainer,
      battle_box_mons
    });
  } catch (error) {
    console.error('Error in /api/trainers/:id:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Redirect trainer-viewer routes to the proper trainers/:id route
app.get('/trainer-viewer', (req, res) => {
  if (!req.query.id) {
    return res.redirect('/trainers');
  }
  res.redirect(`/trainers/${req.query.id}`);
});

// Redirect /trainer-viewer/:id to /trainers/:id for better UX
app.get('/trainer-viewer/:id', (req, res) => {
  res.redirect(`/trainers/${req.params.id}`);
});

// PC Box routes

// All Boxes route - shows all boxes at once
app.get('/trainers/:id/boxes', async (req, res) => {
  try {
    const trainerId = req.params.id;

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get all box numbers for this trainer
    const boxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);

    // Get battle box monsters (box_number = -1)
    const battleBoxMonsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, -1);

    // Get monsters for each regular box
    const regularBoxes = [];
    for (const boxNum of boxNumbers) {
      // Skip battle box as we already got it separately
      if (boxNum === -1) continue;

      const monsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, boxNum);
      regularBoxes.push({
        boxNumber: boxNum,
        monsters: monsters
      });
    }

    // Check if the user is viewing their own trainer
    const isOwnTrainer = req.session.user && req.session.user.discord_id && req.session.user.discord_id.toString() === trainer.player_user_id;

    res.render('trainers/boxes', {
      trainer,
      battleBoxMonsters,
      regularBoxes,
      isOwnTrainer,
      title: `${trainer.name} - All Boxes`
    });
  } catch (error) {
    console.error('Error getting all boxes:', error);
    res.status(500).render('error', {
      message: 'Error getting all boxes',
      error
    });
  }
});

// Single Box route - shows a single box at a time
app.get('/trainers/:id/pc', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const boxNumber = parseInt(req.query.box) || null;
    const boxPage = parseInt(req.query.boxPage) || 1;
    const boxSize = 30; // 5x6 grid

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get all monsters for this trainer
    let result;
    if (boxNumber !== null) {
      // Get monsters for a specific box
      result = await Monster.getByTrainerIdAndBoxNumberPaginated(trainerId, boxNumber, page, boxSize);
    } else {
      // Get all monsters
      result = await Monster.getByTrainerIdPaginated(trainerId, page, boxSize);
    }

    // Get all box numbers for this trainer
    const boxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);

    // Check if any box has more than 30 monsters
    let needsReorganization = false;
    for (const box of boxNumbers) {
      if (box !== -1) { // Skip battle box
        const boxMonsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, box);
        if (boxMonsters.length > boxSize) {
          needsReorganization = true;
          break;
        }
      }
    }

    // Reorganize boxes if needed
    if (needsReorganization) {
      await Monster.reorganizeBoxes(trainerId, boxSize);
      // Refresh data after reorganization
      if (boxNumber !== null) {
        result = await Monster.getByTrainerIdAndBoxNumberPaginated(trainerId, boxNumber, page, boxSize);
      } else {
        result = await Monster.getByTrainerIdPaginated(trainerId, page, boxSize);
      }
      // Refresh box numbers
      const updatedBoxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);
      boxNumbers.length = 0;
      boxNumbers.push(...updatedBoxNumbers);
    }

    // Get box overview (for the sidebar)
    // Determine which box to show in the overview
    const overviewBoxNumber = boxNumber || (boxNumbers.length > 0 ? boxNumbers[0] : 1);

    // Log for debugging
    console.log('Loading box overview for box:', overviewBoxNumber, 'page:', boxPage);

    // Get all monsters for the selected box (without pagination for the overview)
    let boxOverviewMonsters = [];
    try {
      // First try to get all monsters for the box directly
      const boxMonstersResult = await Monster.getByTrainerIdAndBoxNumber(trainerId, overviewBoxNumber);
      boxOverviewMonsters = boxMonstersResult || [];

      console.log(`Found ${boxOverviewMonsters.length} monsters in box ${overviewBoxNumber} (direct query)`);

      // If no monsters found or if no specific box is selected, reorganize all monsters
      if (boxOverviewMonsters.length === 0 || boxNumber === null) {
        console.log('Box is empty or no specific box selected. Reorganizing all monsters...');

        // Get all monsters for this trainer
        const allMonsters = await Monster.getByTrainerId(trainerId);
        console.log(`Found ${allMonsters.length} total monsters for trainer ${trainerId}`);

        if (allMonsters.length > 0) {
          // Sort monsters by trainer_index (if available) or alphabetically by name
          allMonsters.sort((a, b) => {
            // First sort by trainer_index if both have it
            if (a.trainer_index !== null && b.trainer_index !== null) {
              return a.trainer_index - b.trainer_index;
            }
            // If only one has trainer_index, prioritize that one
            if (a.trainer_index !== null) return -1;
            if (b.trainer_index !== null) return 1;
            // Otherwise sort alphabetically by name
            return a.name.localeCompare(b.name);
          });

          // Skip battle box monsters (box_number = -1)
          const regularMonsters = allMonsters.filter(mon => mon.box_number !== -1);

          // Reorganize monsters into boxes of 30
          const updates = [];
          regularMonsters.forEach((monster, index) => {
            const newBoxNumber = Math.floor(index / boxSize) + 1; // Box numbers start at 1
            if (monster.box_number !== newBoxNumber) {
              updates.push({
                monId: monster.mon_id,
                boxNumber: newBoxNumber
              });
            }
          });

          console.log(`Updating ${updates.length} monsters with new box numbers`);

          // Update box numbers in database
          for (const update of updates) {
            await pool.query(
              'UPDATE mons SET box_number = $1, updated_at = CURRENT_TIMESTAMP WHERE mon_id = $2',
              [update.boxNumber, update.monId]
            );
          }

          // Refresh box numbers
          const updatedBoxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);
          boxNumbers.length = 0;
          boxNumbers.push(...updatedBoxNumbers);

          // Set the overview box number to the first box if not specified
          const newOverviewBoxNumber = boxNumber || (boxNumbers.length > 0 ? boxNumbers[0] : 1);

          // Get monsters for the selected box after reorganization
          boxOverviewMonsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, newOverviewBoxNumber);
          console.log(`After reorganization: Found ${boxOverviewMonsters.length} monsters in box ${newOverviewBoxNumber}`);
        }
      }
    } catch (error) {
      console.error('Error getting or reorganizing box overview monsters:', error);
      boxOverviewMonsters = [];
    }

    // Create pagination info for the box overview
    const boxPagination = {
      total: boxOverviewMonsters.length,
      page: boxPage,
      limit: boxSize,
      totalPages: Math.ceil(boxOverviewMonsters.length / boxSize) || 1
    };

    // Log the result for debugging
    console.log('Box overview result:', {
      boxNumber: overviewBoxNumber,
      monstersCount: boxOverviewMonsters.length,
      pagination: boxPagination
    });

    // If we have no monsters in the box overview but we have monsters in the result,
    // use the first box of monsters for the overview
    if (boxOverviewMonsters.length === 0 && result.monsters.length > 0) {
      // Group monsters by box number
      const monstersByBox = {};
      result.monsters.forEach(monster => {
        if (!monstersByBox[monster.box_number]) {
          monstersByBox[monster.box_number] = [];
        }
        monstersByBox[monster.box_number].push(monster);
      });

      // Find the first box with monsters
      const firstBoxWithMonsters = Object.keys(monstersByBox)
        .filter(box => box !== '-1') // Skip battle box
        .sort((a, b) => parseInt(a) - parseInt(b))[0];

      if (firstBoxWithMonsters) {
        boxOverviewMonsters = monstersByBox[firstBoxWithMonsters];
        console.log(`Using monsters from box ${firstBoxWithMonsters} for overview (${boxOverviewMonsters.length} monsters)`);
      }
    }

    res.render('trainers/pc', {
      trainer,
      monsters: result.monsters,
      pagination: result.pagination,
      boxNumbers,
      currentBox: boxNumber,
      boxOverview: boxOverviewMonsters,
      boxPagination: boxPagination,
      boxPage,
      title: `${trainer.name} - PC Boxes`
    });
  } catch (error) {
    console.error('Error getting PC boxes:', error);
    res.status(500).render('error', {
      message: 'Error getting PC boxes',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Edit Boxes route - allows editing box assignments
app.get('/trainers/:id/edit-boxes', async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id, 10);

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Check if the user is authorized to view this trainer
    const isOwnTrainer = req.session.user && req.session.user.discord_id &&
                        req.session.user.discord_id.toString() === trainer.player_user_id;

    // If not the owner, redirect to regular boxes view
    if (!isOwnTrainer) {
      return res.redirect(`/trainers/${trainerId}/boxes`);
    }

    // Get all box numbers for this trainer
    const boxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);

    // Get battle box monsters (box_number = -1)
    const battleBoxMonsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, -1);

    // Get monsters for each regular box
    const regularBoxes = [];
    for (const boxNum of boxNumbers) {
      // Skip battle box as we already got it separately
      if (boxNum === -1) continue;

      const monsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, boxNum);
      regularBoxes.push({
        boxNumber: boxNum,
        monsters
      });
    }

    res.render('trainers/boxes', {
      trainer,
      battleBoxMonsters,
      regularBoxes,
      isOwnTrainer,
      title: `${trainer.name} - Edit Boxes`
    });
  } catch (error) {
    console.error('Error getting edit boxes page:', error);
    res.status(500).render('error', {
      message: 'Error loading edit boxes page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Trainer stats route
app.get('/trainers/:id/stats', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get all monsters for this trainer
    const monsters = await Monster.getByTrainerId(trainerId);

    // Calculate statistics
    const stats = {};

    // Type distribution
    const typeCount = {};
    let totalTypes = 0;

    monsters.forEach(monster => {
      // Count each type
      ['type1', 'type2', 'type3', 'type4', 'type5'].forEach(typeField => {
        if (monster[typeField]) {
          const type = monster[typeField];
          typeCount[type] = (typeCount[type] || 0) + 1;
          totalTypes++;
        }
      });
    });

    // Sort types by count (descending)
    const sortedTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalTypes > 0 ? Math.round((count / totalTypes) * 100) : 0
      }));

    stats.types = sortedTypes;
    stats.favoriteType = sortedTypes.length > 0 ? sortedTypes[0].type : 'None';

    // Species distribution
    const speciesCount = {};
    const speciesExamples = {};

    monsters.forEach(monster => {
      // Count each species
      ['species1', 'species2', 'species3'].forEach(speciesField => {
        if (monster[speciesField]) {
          const species = monster[speciesField];
          speciesCount[species] = (speciesCount[species] || 0) + 1;

          // Store up to 3 examples of each species
          if (!speciesExamples[species]) {
            speciesExamples[species] = [];
          }
          if (speciesExamples[species].length < 3) {
            speciesExamples[species].push({
              id: monster.mon_id,
              name: monster.name,
              level: monster.level,
              img_link: monster.img_link
            });
          }
        }
      });
    });

    // Sort species by count (descending) and take top 5
    const sortedSpecies = Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([species, count]) => ({
        species,
        count,
        examples: speciesExamples[species] || []
      }));

    stats.topSpecies = sortedSpecies;
    stats.favoriteSpecies = sortedSpecies.length > 0 ? sortedSpecies[0].species : 'None';

    // Reference percentage
    const totalMonsters = monsters.length;
    const referencedMonsters = monsters.filter(monster => monster.img_link && monster.img_link !== '').length;
    stats.totalMonsters = totalMonsters;
    stats.referencedMonsters = referencedMonsters;
    stats.referencePercentage = totalMonsters > 0 ? Math.round((referencedMonsters / totalMonsters) * 100) : 0;

    // Currency statistics
    stats.currentCurrency = Math.round(trainer.currency_amount) || 0;
    stats.totalEarnedCurrency = Math.round(trainer.total_earned_currency) || 0;

    // Level statistics
    const levels = monsters.map(monster => monster.level || 1);
    stats.averageLevel = levels.length > 0
      ? Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length * 10) / 10
      : 0;
    stats.maxLevel = levels.length > 0 ? Math.max(...levels) : 0;

    // Special monsters
    stats.shinyCount = monsters.filter(monster => monster.shiny === 1).length;
    stats.alphaCount = monsters.filter(monster => monster.alpha === 1).length;
    stats.shadowCount = monsters.filter(monster => monster.shadow === 1).length;

    // Box statistics
    const boxNumbers = await Monster.getBoxNumbersByTrainerId(trainerId);
    stats.boxCount = boxNumbers.filter(box => box !== -1).length; // Exclude battle box

    res.render('trainers/stats', {
      title: `${trainer.name} - Statistics`,
      trainer,
      stats
    });
  } catch (error) {
    console.error('Error getting trainer stats:', error);
    res.status(500).render('error', {
      message: 'Error getting trainer statistics',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Trainer achievements route
app.get('/trainers/:id/achievements', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    res.render('trainers/achievements', {
      title: `${trainer.name} - Achievements`,
      trainer
    });
  } catch (error) {
    console.error('Error getting trainer achievements:', error);
    res.status(500).render('error', {
      message: 'Error getting trainer achievements',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Trainer additional references route
app.get('/trainers/:id/additional-references', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get additional references from the trainer model
    // This assumes you have a references array in your trainer model
    // If not, you'll need to modify this to match your data structure
    const references = trainer.additional_references || [];

    res.render('trainers/additional-references', {
      title: `${trainer.name} - Additional References`,
      trainer,
      references
    });
  } catch (error) {
    console.error('Error getting trainer additional references:', error);
    res.status(500).render('error', {
      message: 'Error getting trainer additional references',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Trainer inventory route
app.get('/trainers/:id/inventory', async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Get inventory data
    const inventory = await Trainer.getInventory(trainerId);

    // Define category display names and order
    const categories = [
      { id: 'inv_items', name: 'Items', icon: 'fas fa-toolbox' },
      { id: 'inv_balls', name: 'Poké Balls', icon: 'fas fa-circle' },
      { id: 'inv_berries', name: 'Berries', icon: 'fas fa-apple-alt' },
      { id: 'inv_pastries', name: 'Pastries', icon: 'fas fa-cookie' },
      { id: 'inv_evolution', name: 'Evolution Items', icon: 'fas fa-level-up-alt' },
      { id: 'inv_eggs', name: 'Eggs', icon: 'fas fa-egg' },
      { id: 'inv_antiques', name: 'Antiques', icon: 'fas fa-gem' },
      { id: 'inv_helditems', name: 'Held Items', icon: 'fas fa-hand-holding' },
      { id: 'inv_seals', name: 'Seals', icon: 'fas fa-stamp' }
    ];

    res.render('trainers/inventory', {
      title: `${trainer.name} - Inventory`,
      trainer,
      inventory,
      categories
    });
  } catch (error) {
    console.error('Error getting trainer inventory:', error);
    res.status(500).render('error', {
      message: 'Error getting trainer inventory',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Monster detail route
app.get('/trainers/:trainerId/monsters/:monsterId', async (req, res) => {
  try {
    const { trainerId, monsterId } = req.params;

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).send('Trainer not found');
    }

    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).send('Monster not found');
    }

    if (monster.trainer_id != trainerId) {
      return res.status(403).send('This monster does not belong to this trainer');
    }

    // Get next and previous monsters in the same box for pagination
    let prev_mon_in_box = null;
    let next_mon_in_box = null;

    if (monster.box_number) {
      // Get all monsters in the same box
      const boxMonsters = await Monster.getByTrainerIdAndBoxNumber(trainerId, monster.box_number);

      // Find the current monster's index in the box
      const currentIndex = boxMonsters.findIndex(mon => mon.mon_id === parseInt(monsterId));

      // Get previous and next monsters
      if (currentIndex > 0) {
        prev_mon_in_box = boxMonsters[currentIndex - 1];
      }

      if (currentIndex < boxMonsters.length - 1) {
        next_mon_in_box = boxMonsters[currentIndex + 1];
      }
    }

    // Get move details for each move in the monster's moveset
    let moveDetails = [];
    if (monster.moveset) {
      // Parse the moveset string into an array
      let moves = [];
      try {
        // Try parsing as JSON first
        moves = JSON.parse(monster.moveset);
      } catch (e) {
        // If not JSON, split by commas or newlines
        moves = monster.moveset.split(/[,\n]/).map(move => move.trim()).filter(move => move);
      }

      // Fetch details for each move
      for (const moveName of moves) {
        try {
          const moveData = await Move.getByName(moveName);
          if (moveData) {
            moveDetails.push(moveData);
          } else {
            // If move not found, add a placeholder with default values
            moveDetails.push({
              MoveName: moveName,
              Type: 'normal',
              Power: '?',
              Accuracy: '?',
              Effect: 'No description available.',
              attribute: ''
            });
          }
        } catch (moveError) {
          console.error(`Error fetching details for move ${moveName}:`, moveError);
          // Add a placeholder with default values
          moveDetails.push({
            MoveName: moveName,
            Type: 'normal',
            Power: '?',
            Accuracy: '?',
            Effect: 'No description available.',
            attribute: ''
          });
        }
      }
    }

    res.render('monsters/detail', {  // Assuming you have a monster detail view
      trainer,
      monster,
      prev_mon_in_box,
      next_mon_in_box,
      moveDetails,
      title: `${monster.name} - Monster Details`
    });
  } catch (error) {
    console.error('Error getting monster details:', error);
    res.status(500).send('An error occurred while getting monster details: ' + error.message);
  }
});

// Edit trainer route
app.get('/trainers/:id/edit', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to edit a trainer'));
    }

    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to edit this trainer',
        error: { status: 403 }
      });
    }

    res.render('trainers/edit', {
      trainer,
      title: `Edit ${trainer.name} - Trainer Profile`
    });
  } catch (error) {
    console.error('Error loading trainer edit form:', error);
    res.status(500).render('error', {
      message: 'Error loading trainer edit form',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update trainer route
app.post('/trainers/:id/update', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to update a trainer'));
    }

    const trainerId = req.params.id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).render('error', {
        message: 'Trainer not found',
        error: { status: 404 }
      });
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to update this trainer',
        error: { status: 403 }
      });
    }

    // Get form data
    const updatedTrainer = {
      ...req.body,
      level: trainer.level, // Ensure level cannot be changed
      currency_amount: trainer.currency_amount // Ensure currency cannot be changed
    };

    // Debug output
    console.log('Form data received:', req.body);
    console.log('main_ref value:', req.body.main_ref);
    console.log('main_ref_artist value:', req.body.main_ref_artist);

    // Explicitly ensure main_ref and main_ref_artist are included
    if (req.body.main_ref !== undefined) {
      updatedTrainer.main_ref = req.body.main_ref;
    }

    if (req.body.main_ref_artist !== undefined) {
      updatedTrainer.main_ref_artist = req.body.main_ref_artist;
    }

    // Handle additional references
    if (req.body.additional_references) {
      updatedTrainer.additional_references = req.body.additional_references;
    }

    console.log('Final updatedTrainer object:', updatedTrainer);

    // Update trainer
    await Trainer.update(trainerId, updatedTrainer);

    res.redirect(`/trainers/${trainerId}`);
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).render('error', {
      message: 'Error updating trainer',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Edit monster route
app.get('/trainers/:trainerId/monsters/:monsterId/edit', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to edit a monster'));
    }

    const { trainerId, monsterId } = req.params;

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).send('Trainer not found');
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to edit this monster',
        error: { status: 403 }
      });
    }

    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).send('Monster not found');
    }

    if (monster.trainer_id != trainerId) {
      return res.status(403).send('This monster does not belong to this trainer');
    }

    res.render('monsters/edit', {
      trainer,
      monster,
      title: `Edit ${monster.name} - Monster Details`
    });
  } catch (error) {
    console.error('Error loading monster edit form:', error);
    res.status(500).render('error', {
      message: 'Error loading monster edit form',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Edit Evolution Line route
app.get('/trainers/:trainerId/monsters/:monsterId/edit-evolution', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to edit a monster\'s evolution line'));
    }

    const { trainerId, monsterId } = req.params;

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).send('Trainer not found');
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to edit this monster\'s evolution line',
        error: { status: 403 }
      });
    }

    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).send('Monster not found');
    }

    if (monster.trainer_id != trainerId) {
      return res.status(403).send('This monster does not belong to this trainer');
    }

    // Parse pre-evolutions if they exist
    let preEvolutions = [];
    if (monster.preevolution) {
      try {
        preEvolutions = JSON.parse(monster.preevolution);
        if (!Array.isArray(preEvolutions)) {
          preEvolutions = [preEvolutions];
        }
      } catch (e) {
        // If parsing fails, leave as empty array
      }
    }

    // Parse future evolutions if they exist
    let futureEvolutions = [];
    if (monster.evolution) {
      try {
        futureEvolutions = JSON.parse(monster.evolution);
        if (!Array.isArray(futureEvolutions)) {
          futureEvolutions = [futureEvolutions];
        }
      } catch (e) {
        // If parsing fails, leave as empty array
      }
    }

    res.render('monsters/edit-evolution', {
      trainer,
      monster,
      preEvolutions,
      futureEvolutions,
      title: `Edit Evolution Line for ${monster.name}`
    });
  } catch (error) {
    console.error('Error loading evolution edit form:', error);
    res.status(500).render('error', {
      message: 'Error loading evolution edit form',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update Evolution Line route
app.post('/trainers/:trainerId/monsters/:monsterId/update-evolution', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to update a monster\'s evolution line'));
    }

    const { trainerId, monsterId } = req.params;

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).send('Trainer not found');
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to update this monster\'s evolution line',
        error: { status: 403 }
      });
    }

    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).send('Monster not found');
    }

    if (monster.trainer_id != trainerId) {
      return res.status(403).send('This monster does not belong to this trainer');
    }

    // Process the form data for preEvolutions
    const preEvolutions = [];
    if (req.body.preEvolutions) {
      const preEvoData = Array.isArray(req.body.preEvolutions) ? req.body.preEvolutions : [req.body.preEvolutions];

      for (let i = 0; i < preEvoData.length; i++) {
        if (preEvoData[i].name && preEvoData[i].name.trim() !== '') {
          preEvolutions.push({
            index: i,
            name: preEvoData[i].name.trim(),
            condition: preEvoData[i].condition || '',
            image: preEvoData[i].image || ''
          });
        }
      }
    }

    // Process the form data for futureEvolutions
    const futureEvolutions = [];
    if (req.body.futureEvolutions) {
      const futureEvoData = Array.isArray(req.body.futureEvolutions) ? req.body.futureEvolutions : [req.body.futureEvolutions];

      for (let i = 0; i < futureEvoData.length; i++) {
        if (futureEvoData[i].name && futureEvoData[i].name.trim() !== '') {
          futureEvolutions.push({
            index: i,
            name: futureEvoData[i].name.trim(),
            condition: futureEvoData[i].condition || '',
            image: futureEvoData[i].image || ''
          });
        }
      }
    }

    // Update the monster with the new evolution data
    const updatedMonster = {
      preevolution: preEvolutions.length > 0 ? JSON.stringify(preEvolutions) : null,
      evolution: futureEvolutions.length > 0 ? JSON.stringify(futureEvolutions) : null
    };

    await Monster.update(monsterId, updatedMonster);

    res.redirect(`/trainers/${trainerId}/monsters/${monsterId}#evolution`);
  } catch (error) {
    console.error('Error updating evolution line:', error);
    res.status(500).render('error', {
      message: 'Error updating evolution line',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update monster route
app.post('/trainers/:trainerId/monsters/:monsterId/update', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to update a monster'));
    }

    const { trainerId, monsterId } = req.params;

    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).send('Trainer not found');
    }

    // Check if the logged-in user owns this trainer
    if (req.session.user.discord_id != trainer.player_user_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to update this monster',
        error: { status: 403 }
      });
    }

    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).send('Monster not found');
    }

    if (monster.trainer_id != trainerId) {
      return res.status(403).send('This monster does not belong to this trainer');
    }

    // Get form data
    const updatedMonster = {
      ...req.body,
      trainer_id: trainerId,
      // Preserve these fields
      level: monster.level,
      species1: monster.species1,
      species2: monster.species2,
      species3: monster.species3,
      type1: monster.type1,
      type2: monster.type2,
      type3: monster.type3,
      type4: monster.type4,
      type5: monster.type5,
      attribute: monster.attribute,
      hp_total: monster.hp_total,
      hp_ev: monster.hp_ev,
      hp_iv: monster.hp_iv,
      atk_total: monster.atk_total,
      atk_ev: monster.atk_ev,
      atk_iv: monster.atk_iv,
      def_total: monster.def_total,
      def_ev: monster.def_ev,
      def_iv: monster.def_iv,
      spa_total: monster.spa_total,
      spa_ev: monster.spa_ev,
      spa_iv: monster.spa_iv,
      spd_total: monster.spd_total,
      spd_ev: monster.spd_ev,
      spd_iv: monster.spd_iv,
      spe_total: monster.spe_total,
      spe_ev: monster.spe_ev,
      spe_iv: monster.spe_iv
    };

    // Update monster
    await Monster.update(monsterId, updatedMonster);

    res.redirect(`/trainers/${trainerId}/monsters/${monsterId}`);
  } catch (error) {
    console.error('Error updating monster:', error);
    res.status(500).render('error', {
      message: 'Error updating monster',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Add trainer form route
app.get('/add_trainer', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to add a trainer'));
    }

    // Check if user has a Discord ID
    if (!req.session.user.discord_id) {
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to create a trainer',
        error: { status: 403 }
      });
    }

    res.render('trainers/add', {
      title: 'Add New Trainer'
    });
  } catch (error) {
    console.error('Error loading add trainer form:', error);
    res.status(500).render('error', {
      message: 'Error loading add trainer form',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Add trainer submission route
app.post('/add_trainer', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to add a trainer'));
    }

    // Check if user has a Discord ID
    if (!req.session.user.discord_id) {
      return res.status(403).render('error', {
        message: 'You need to have a Discord ID linked to your account to create a trainer',
        error: { status: 403 }
      });
    }

    // Validate required fields
    if (!req.body.name) {
      return res.status(400).render('error', {
        message: 'Trainer name is required',
        error: { status: 400 }
      });
    }

    // Create trainer data object with defaults
    // Make a completely new object without any id field
    const cleanedBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'id') {
        cleanedBody[key] = value;
      }
    }

    const trainerData = {
      ...cleanedBody,
      player_user_id: req.session.user.discord_id,
      player_display_name: req.session.user.display_name || req.session.user.username,
      level: 1,
      currency_amount: 500,
      total_earned_currency: 500,
      inv_items: JSON.stringify({"Daycare Daypass":1,"Legacy Leeway":1}),
      inv_balls: JSON.stringify({"Poke Ball":10}),
      inv_eggs: JSON.stringify({"Standard Egg":1})
    };

    console.log('Creating trainer with data:', JSON.stringify(trainerData, null, 2));

    // Handle empty string values for integer fields
    const integerFields = ['age', 'height_ft', 'height_in', 'alter_human'];
    for (const field of integerFields) {
      if (field in trainerData && trainerData[field] === '') {
        trainerData[field] = null;
      }
    }

    // Create the trainer
    const newTrainer = await Trainer.create(trainerData);

    res.redirect(`/trainers/${newTrainer.id}`);
  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).render('error', {
      message: 'Error creating trainer',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Adventures routes
app.get('/adventures/event', (req, res) => {
  res.render('adventures/event/index', {
    title: 'Lore Library'
  });
});

app.get('/adventures/event/current', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'events', 'current', 'current-events.md');
  const content = loadMarkdownContent(contentPath);

  res.render('adventures/event/view', {
    title: 'Current Event',
    categories,
    activeCategory: 'events',
    currentPath: 'current/overview',
    content,
    eventType: 'current'
  });
});

app.get('/adventures/event/past', (req, res) => {
  const categories = getContentCategories();
  const contentPath = path.join(__dirname, 'content', 'events', 'past', 'no-past-events.md');
  const content = loadMarkdownContent(contentPath);

  res.render('adventures/event/view', {
    title: 'Past Events',
    categories,
    activeCategory: 'events',
    currentPath: '',
    content,
    eventType: 'past'
  });
});

// Add route for direct navigation to event content
app.get('/adventures/event/:type/:path(*)', (req, res) => {
  const { type, path: eventPath } = req.params;
  const fullPath = `${type}/${eventPath}`;
  res.redirect(`/content/events/${fullPath}`);
});

// Content category route with specific prefix to avoid conflicts with other routes
app.get('/content/:category/:path(*)', (req, res) => {
  const category = req.params.category;
  const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations', 'events'];

  if (!validCategories.includes(category)) {
    return res.status(404).send('Category not found');
  }

  // Special handling for events category
  if (category === 'events') {
    const filePath = req.params.path;
    const contentPath = path.join(__dirname, 'content', 'events', filePath);
    console.log('Events content path:', contentPath);

    // Check if it's a markdown file
    let mdPath;
    if (contentPath.endsWith('.md')) {
      mdPath = contentPath;
    } else {
      // Try with .md extension
      mdPath = `${contentPath}.md`;
      console.log('Trying with .md extension:', mdPath);
    }

    if (fs.existsSync(mdPath)) {
      console.log('Found markdown file:', mdPath);
      const content = loadMarkdownContent(mdPath);
      const categories = getContentCategories();

      // Determine if it's a current or past event based on the path
      const eventType = filePath.startsWith('current') ? 'current' : 'past';

      // Extract the path relative to the event type directory
      const pathWithoutEventType = filePath.replace(new RegExp(`^${eventType}/`), '');

      // Set the current path to include the event type prefix
      const currentPathWithType = pathWithoutEventType;

      res.render('adventures/event/view', {
        title: eventType === 'current' ? 'Current Event' : 'Past Events',
        categories,
        activeCategory: 'events',
        currentPath: currentPathWithType,
        content,
        eventType
      });
      return;
    }
  }

  const filePath = req.params.path;
  // Include the category in the path
  const contentPath = path.join(__dirname, 'content', category, filePath);
  console.log('Content path with category:', contentPath);

  console.log('Requested path:', filePath);
  console.log('Full content path:', contentPath);

  // Check if it's a directory
  if (fs.existsSync(contentPath) && fs.statSync(contentPath).isDirectory()) {
    const overviewPath = path.join(contentPath, 'overview.md');
    console.log('Looking for overview file:', overviewPath);

    if (fs.existsSync(overviewPath)) {
      const content = loadMarkdownContent(overviewPath);
      const categories = getContentCategories();

      return res.render('guides/index', {
        title: `${categories[category].name} - ${filePath}`,
        categories,
        activeCategory: category,
        currentPath: filePath,
        content
      });
    } else {
      console.log('Overview file not found in directory');
    }
  } else {
    console.log('Path is not a directory or does not exist:', contentPath);
  }

  // Check if it's a markdown file
  let mdPath;
  if (contentPath.endsWith('.md')) {
    mdPath = contentPath;
  } else {
    // Try with .md extension
    mdPath = `${contentPath}.md`;
    console.log('Trying with .md extension:', mdPath);
  }

  if (fs.existsSync(mdPath)) {
    console.log('Found markdown file:', mdPath);
    const content = loadMarkdownContent(mdPath);
    const categories = getContentCategories();

    res.render('guides/index', {
      title: `${categories[category].name} - ${filePath}`,
      categories,
      activeCategory: category,
      currentPath: filePath,
      content
    });
  } else {
    console.log('Markdown file not found:', mdPath);
    res.status(404).send(`Content not found: ${mdPath}`);
  }
});


// Import and use location activity routes
const locationActivityRoutes = require('./location_activity_routes');
locationActivityRoutes(app);

// New location activities system
app.use('/town/activities', require('./location_activities/index'));

// Submissions routes
app.use('/submissions', require('./routes/submissions'));

// API routes
app.use('/api', require('./routes/api'));

// API endpoint for claiming rewards
app.use('/api/claim-reward', require('./routes/api/claim-reward'));

// API endpoint for claiming all rewards
app.use('/api/claim-all-rewards', require('./routes/api/claim-all-rewards'));

// API endpoint for garden rewards
app.use('/api/garden', require('./routes/api/garden-rewards'));


// 404 handler - must be defined after all other routes
app.use((req, res) => {
  // Check if the request is expecting JSON
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `The requested resource '${req.path}' was not found`
    });
  }

  // For regular requests, send an HTML error page
  res.status(404).send(`
    <html>
      <head>
        <title>Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #111319; color: #d7ddf3; }
          h1 { color: #d6a339; }
          .error { color: #ff6b6b; }
          .container { max-width: 800px; margin: 0 auto; }
          a { color: #d6a339; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Not Found</h1>
          <p class="error">The requested resource '${req.path}' was not found</p>
          <p><a href="/">Return to Home</a></p>
        </div>
      </body>
    </html>
  `);
});
