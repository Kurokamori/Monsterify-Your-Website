const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const fs = require('fs');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
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
const { ShopConfig, DailyShopItems, PlayerShopPurchases } = require('./models/ShopSystem');
const Pokemon = require('./models/Pokemon');
const Digimon = require('./models/Digimon');
const Yokai = require('./models/Yokai');
const Move = require('./models/Move');
const Task = require('./models/Task');
const Habit = require('./models/Habit');

// Import location activity models
const LocationTaskPrompt = require('./models/LocationTaskPrompt');
const LocationReward = require('./models/LocationReward');
const LocationActivitySession = require('./models/LocationActivitySession');
const TaskTemplate = require('./models/TaskTemplate');
const Reminder = require('./models/Reminder');
const MonsterRoller = require('./utils/MonsterRoller');
const MonsterInitializer = require('./utils/MonsterInitializer');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
    const playerId = req.session.user.id;

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

    // Get trainer information
    const trainer = await Trainer.getByUserId(playerId);

    if (!trainer) {
      return res.redirect('/create-trainer');
    }

    // Get shop items for today
    console.log(`Getting shop items for shop ID: ${shopId}`);
    const shopItems = await DailyShopItems.getShopItems(shopId);
    console.log(`Found ${shopItems ? shopItems.length : 0} items for shop ${shopId}:`, shopItems);

    // Get remaining quantities for each item
    console.log('Getting remaining quantities for each item...');
    const itemsWithQuantities = await Promise.all(
      shopItems.map(async (item) => {
        console.log(`Getting remaining quantity for item ${item.item_id}`);
        const remainingQuantity = await DailyShopItems.getRemainingQuantity(
          playerId,
          shopId,
          item.item_id
        );
        console.log(`Remaining quantity for item ${item.item_id}: ${remainingQuantity}`);

        return {
          ...item,
          remaining_quantity: remainingQuantity
        };
      })
    );
    console.log('Items with quantities:', itemsWithQuantities);

    console.log('Rendering shop page with data:', {
      shop: shop.name,
      trainer: trainer.name,
      itemCount: itemsWithQuantities.length,
      message: req.query.message
    });

    res.render('shop', {
      shop,
      trainer,
      items: itemsWithQuantities,
      message: req.query.message,
      messageType: req.query.messageType
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

app.post('/town/shop/:shopId/purchase', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { shopId } = req.params;
    const { item_id, quantity } = req.body;
    const playerId = req.session.user.id;

    // Validate inputs
    if (!item_id || !quantity) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Item ID and quantity are required')}`);
    }

    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Quantity must be a positive number')}`);
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

    // Get trainer information
    const trainer = await Trainer.getByUserId(playerId);

    if (!trainer) {
      return res.redirect('/create-trainer');
    }

    // Get item information
    const shopItems = await DailyShopItems.getShopItems(shopId);
    const item = shopItems.find(i => i.item_id === item_id);

    if (!item) {
      return res.redirect(`/town/shop/${shopId}?messageType=error&message=${encodeURIComponent('Item not available in this shop')}`);
    }

    // Check if the player has enough remaining quantity
    const remainingQuantity = await DailyShopItems.getRemainingQuantity(
      playerId,
      shopId,
      item_id
    );

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
    await PlayerShopPurchases.recordPurchase(
      playerId,
      shopId,
      item_id,
      parsedQuantity
    );

    // Update trainer's inventory
    const inventoryItem = {
      item_id,
      quantity: parsedQuantity
    };

    await Trainer.addItemToInventory(trainer.id, inventoryItem);

    // Update trainer's currency
    const updatedTrainer = {
      ...trainer,
      currency_amount: trainer.currency_amount - totalPrice
    };

    await Trainer.update(trainer.id, updatedTrainer);

    // Redirect back to the shop with success message
    return res.redirect(`/town/shop/${shopId}?message=${encodeURIComponent(`Successfully purchased ${parsedQuantity} ${item.item_name}(s) for ${totalPrice} coins`)}`);
  } catch (error) {
    console.error(`Error purchasing item from shop ${req.params.shopId}:`, error);
    return res.redirect(`/town/shop/${req.params.shopId}?messageType=error&message=${encodeURIComponent('Error purchasing item: ' + error.message)}`);
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
      message: 'Error claiming monster',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

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
app.get('/town/visit/trade', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/trade', {
    title: 'Trade Center'
  });
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

// Garden - Tend Garden route
app.get('/town/visit/garden/tend', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the garden tend view
    res.render('town/garden/tend', {
      title: 'Tend Garden',
      trainer,
      location: 'garden',
      activity: 'tend',
      welcomeImage: 'https://i.imgur.com/Z5dNHXv.jpeg',
      welcomeText: 'Welcome to the garden! The plants need your care and attention. Help tend to them and you might find something interesting growing among the leaves.'
    });
  } catch (error) {
    console.error('Error loading tend garden page:', error);
    res.status(500).render('error', {
      message: 'Error loading tend garden page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
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

// Farm - Work Farm route
app.get('/town/visit/farm/work', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the farm work view
    res.render('town/farm/work', {
      title: 'Work the Farm',
      trainer,
      location: 'farm',
      activity: 'work',
      welcomeImage: 'https://i.imgur.com/fztdYkJ.png',
      welcomeText: 'Welcome to the farm! There\'s always work to be done here, from feeding animals to tending crops. Roll up your sleeves and get to work!'
    });
  } catch (error) {
    console.error('Error loading work farm page:', error);
    res.status(500).render('error', {
      message: 'Error loading work farm page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Pirates Dock route
app.get('/town/visit/pirates_dock', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/pirates_dock', {
    title: 'Pirate\'s Dock'
  });
});

// Pirates Dock - Swab Deck route
app.get('/town/visit/pirates_dock/swab', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the swab deck view
    res.render('town/pirates_dock/swab', {
      title: 'Swab the Deck',
      trainer,
      location: 'pirates_dock_swab',
      activity: 'swab',
      welcomeImage: 'https://i.imgur.com/RmKySNO.png',
      welcomeText: 'Ahoy there! The deck needs a good swabbing after last night\'s storm. Grab a mop and help the crew keep the ship shipshape!'
    });
  } catch (error) {
    console.error('Error loading swab deck page:', error);
    res.status(500).render('error', {
      message: 'Error loading swab deck page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Pirates Dock - Go Fishing route
app.get('/town/visit/pirates_dock/fishing', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the fishing view
    res.render('town/pirates_dock/fishing', {
      title: 'Go Fishing',
      trainer,
      location: 'pirates_dock_fishing',
      activity: 'fishing',
      welcomeImage: 'https://i.imgur.com/RmKySNO.png',
      welcomeText: 'The sea is calm today, perfect for fishing! Grab a rod and see what you can catch. Who knows what might be lurking beneath the waves?'
    });
  } catch (error) {
    console.error('Error loading fishing page:', error);
    res.status(500).render('error', {
      message: 'Error loading fishing page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Activity session route
app.get('/town/visit/activity-session/:sessionId', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { sessionId } = req.params;

    // Get the session
    const session = await LocationActivitySession.getById(sessionId);

    if (!session) {
      return res.status(404).render('error', {
        message: 'Activity session not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to view this session',
        error: { status: 403 },
        title: 'Error'
      });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the session is completed
    if (session.completed) {
      // If completed, show the rewards
      return res.render('town/activity_completed', {
        title: 'Activity Completed',
        trainer,
        session,
        rewards: JSON.parse(session.rewards),
        activityUrl: `/town/visit/${session.location.replace('_swab', '').replace('_fishing', '')}/${session.activity}`
      });
    }

    // Calculate time remaining
    const startTime = new Date(session.start_time);
    const endTime = new Date(startTime.getTime() + (session.duration_minutes * 60 * 1000));
    const now = new Date();
    const timeRemaining = Math.max(0, endTime - now);
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

    // Render the activity session view
    res.render('town/activity_session', {
      title: 'Activity Session',
      trainer,
      session,
      minutesRemaining,
      endTime: endTime.toISOString()
    });
  } catch (error) {
    console.error('Error loading activity session page:', error);
    res.status(500).render('error', {
      message: 'Error loading activity session page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Start activity session route
app.post('/town/visit/start-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { location, activity } = req.body;

    if (!location || !activity) {
      return res.status(400).json({ success: false, message: 'Location and activity are required' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, return its ID
      const activeSession = activeSessions[0];
      return res.json({
        success: true,
        session_id: activeSession.session_id,
        redirect: `/town/visit/activity-session/${activeSession.session_id}`
      });
    }

    // Get a random task prompt for the location
    const prompt = await LocationTaskPrompt.getRandomForLocation(location);

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'No prompts found for this location' });
    }

    // Generate a random duration between 20 and 60 minutes
    const durationMinutes = Math.floor(Math.random() * 41) + 20; // 20 to 60 minutes

    // Create a new activity session
    const session = await LocationActivitySession.create({
      trainer_id: trainer.id,
      location,
      activity,
      prompt_id: prompt.prompt_id,
      duration_minutes: durationMinutes
    });

    // Return the session ID and redirect URL
    res.json({
      success: true,
      session_id: session.session_id,
      redirect: `/town/visit/activity-session/${session.session_id}`
    });
  } catch (error) {
    console.error('Error starting activity session:', error);
    res.status(500).json({ success: false, message: 'Error starting activity session' });
  }
});

// Complete activity session route
app.post('/town/visit/complete-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to complete this session' });
    }

    // Check if the session is already completed
    if (session.completed) {
      return res.json({
        success: true,
        already_completed: true,
        redirect: `/town/visit/activity-session/${session_id}`
      });
    }

    // Get random rewards for the location
    // Number of rewards based on difficulty
    let rewardCount = 1;
    if (session.difficulty === 'normal') rewardCount = 2;
    if (session.difficulty === 'hard') rewardCount = 3;

    const rewards = await LocationReward.getRandomForLocation(session.location, rewardCount);

    // Complete the session with rewards
    const completedSession = await LocationActivitySession.complete(session_id, rewards);

    // Return success and redirect URL
    res.json({
      success: true,
      redirect: `/town/visit/activity-session/${session_id}`
    });
  } catch (error) {
    console.error('Error completing activity session:', error);
    res.status(500).json({ success: false, message: 'Error completing activity session' });
  }
});

// Claim reward route
app.post('/api/claim-reward', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { reward_id, reward_type, session_id } = req.body;

    if (!reward_id || !reward_type || !session_id) {
      return res.status(400).json({ success: false, message: 'Reward ID, reward type, and session ID are required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim rewards from this session' });
    }

    // Check if the session is completed
    if (!session.completed) {
      return res.status(400).json({ success: false, message: 'Cannot claim rewards from an incomplete session' });
    }

    // Get the rewards from the session
    const rewards = JSON.parse(session.rewards);

    // Find the reward
    const rewardIndex = rewards.findIndex(r => r.reward_id == reward_id);

    if (rewardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reward not found in this session' });
    }

    const reward = rewards[rewardIndex];

    // Check if the reward type matches
    if (reward.reward_type !== reward_type) {
      return res.status(400).json({ success: false, message: 'Reward type mismatch' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Process the reward based on type
    if (reward_type === 'monster') {
      // Add the monster to the trainer's team
      const monsterData = reward.reward_data;

      // Create the monster
      await Monster.create({
        trainer_id: trainer.id,
        name: monsterData.species,
        species1: monsterData.species,
        type1: 'Normal', // Default type, should be replaced with actual type
        level: monsterData.level || 5
      });
    } else if (reward_type === 'item') {
      // Add the item to the trainer's inventory
      const itemData = reward.reward_data;

      // Update the trainer's inventory based on item type
      // This is a simplified version, you'll need to adapt it to your inventory system
      await Trainer.update(trainer.id, {
        inv_items: JSON.stringify([...JSON.parse(trainer.inv_items || '[]'), itemData])
      });
    } else if (reward_type === 'coin') {
      // Add coins to the trainer's balance
      const coinAmount = reward.reward_data.amount || 0;

      await Trainer.update(trainer.id, {
        coins: trainer.coins + coinAmount
      });
    }

    // Mark the reward as claimed in the session
    rewards[rewardIndex].claimed = true;

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
      [JSON.stringify(rewards), session_id]
    );

    // Return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward' });
  }
});

// Adventures routes
app.get('/adventures', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('adventures/index', {
    title: 'Adventures'
  });
});

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

  res.render('adventures/event', {
    title: 'Events'
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

// Art Submission route
app.get('/submit_artwork', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit artwork'));
  }

  res.render('submit_artwork', {
    title: 'Submit Artwork'
  });
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
    if (typeof Trainer === 'undefined' || !Trainer.getByDiscordId) {
      console.log('API: Trainer model not available, returning mock data');
      const mockTrainers = [
        { id: 1, name: 'Mock Trainer 1', player_user_id: userDiscordId },
        { id: 2, name: 'Mock Trainer 2', player_user_id: userDiscordId }
      ];
      return res.json(mockTrainers);
    }

    const trainers = await Trainer.getByDiscordId(userDiscordId);
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

    res.render('monsters/detail', {  // Assuming you have a monster detail view
      trainer,
      monster,
      prev_mon_in_box,
      next_mon_in_box,
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

// Make sure your category route comes AFTER the API routes
app.get('/:category/:path(*)', (req, res) => {
  const category = req.params.category;
  const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations'];

  if (!validCategories.includes(category)) {
    return res.status(404).send('Category not found');
  }

  const filePath = req.params.path;
  // Prevent category duplication in the path
  const contentPath = path.join(__dirname, 'content', filePath);
  console.log('Corrected content path:', contentPath);

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

// Activity session route
app.get('/town/visit/activity-session/:sessionId', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { sessionId } = req.params;

    // Get the session
    const session = await LocationActivitySession.getById(sessionId);

    if (!session) {
      return res.status(404).render('error', {
        message: 'Activity session not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).render('error', {
        message: 'You do not have permission to view this session',
        error: { status: 403 },
        title: 'Error'
      });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the session is completed
    if (session.completed) {
      // If completed, show the rewards
      return res.render('town/activity_completed', {
        title: 'Activity Completed',
        trainer,
        session,
        rewards: JSON.parse(session.rewards),
        activityUrl: `/town/visit/${session.location.replace('_swab', '').replace('_fishing', '')}/${session.activity}`
      });
    }

    // Calculate time remaining
    const startTime = new Date(session.start_time);
    const endTime = new Date(startTime.getTime() + (session.duration_minutes * 60 * 1000));
    const now = new Date();
    const timeRemaining = Math.max(0, endTime - now);
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

    // Render the activity session view
    res.render('town/activity_session', {
      title: 'Activity Session',
      trainer,
      session,
      minutesRemaining,
      endTime: endTime.toISOString()
    });
  } catch (error) {
    console.error('Error loading activity session page:', error);
    res.status(500).render('error', {
      message: 'Error loading activity session page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Start activity session route
app.post('/town/visit/start-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { location, activity } = req.body;

    if (!location || !activity) {
      return res.status(400).json({ success: false, message: 'Location and activity are required' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, return its ID
      const activeSession = activeSessions[0];
      return res.json({
        success: true,
        session_id: activeSession.session_id,
        redirect: `/town/visit/activity-session/${activeSession.session_id}`
      });
    }

    // Get a random task prompt for the location
    const prompt = await LocationTaskPrompt.getRandomForLocation(location);

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'No prompts found for this location' });
    }

    // Generate a random duration between 20 and 60 minutes
    const durationMinutes = Math.floor(Math.random() * 41) + 20; // 20 to 60 minutes

    // Create a new activity session
    const session = await LocationActivitySession.create({
      trainer_id: trainer.id,
      location,
      activity,
      prompt_id: prompt.prompt_id,
      duration_minutes: durationMinutes
    });

    // Return the session ID and redirect URL
    res.json({
      success: true,
      session_id: session.session_id,
      redirect: `/town/visit/activity-session/${session.session_id}`
    });
  } catch (error) {
    console.error('Error starting activity session:', error);
    res.status(500).json({ success: false, message: 'Error starting activity session' });
  }
});

// Complete activity session route
app.post('/town/visit/complete-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to complete this session' });
    }

    // Check if the session is already completed
    if (session.completed) {
      return res.json({
        success: true,
        already_completed: true,
        redirect: `/town/visit/activity-session/${session_id}`
      });
    }

    // Get random rewards for the location
    // Number of rewards based on difficulty
    let rewardCount = 1;
    if (session.difficulty === 'normal') rewardCount = 2;
    if (session.difficulty === 'hard') rewardCount = 3;

    const rewards = await LocationReward.getRandomForLocation(session.location, rewardCount);

    // Complete the session with rewards
    const completedSession = await LocationActivitySession.complete(session_id, rewards);

    // Return success and redirect URL
    res.json({
      success: true,
      redirect: `/town/visit/activity-session/${session_id}`
    });
  } catch (error) {
    console.error('Error completing activity session:', error);
    res.status(500).json({ success: false, message: 'Error completing activity session' });
  }
});

// Claim reward route
app.post('/api/claim-reward', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { reward_id, reward_type, session_id } = req.body;

    if (!reward_id || !reward_type || !session_id) {
      return res.status(400).json({ success: false, message: 'Reward ID, reward type, and session ID are required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim rewards from this session' });
    }

    // Check if the session is completed
    if (!session.completed) {
      return res.status(400).json({ success: false, message: 'Cannot claim rewards from an incomplete session' });
    }

    // Get the rewards from the session
    const rewards = JSON.parse(session.rewards);

    // Find the reward
    const rewardIndex = rewards.findIndex(r => r.reward_id == reward_id);

    if (rewardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reward not found in this session' });
    }

    const reward = rewards[rewardIndex];

    // Check if the reward type matches
    if (reward.reward_type !== reward_type) {
      return res.status(400).json({ success: false, message: 'Reward type mismatch' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Process the reward based on type
    if (reward_type === 'monster') {
      // Add the monster to the trainer's team
      const monsterData = reward.reward_data;

      // Create the monster
      await Monster.create({
        trainer_id: trainer.id,
        name: monsterData.species,
        species1: monsterData.species,
        type1: 'Normal', // Default type, should be replaced with actual type
        level: monsterData.level || 5
      });
    } else if (reward_type === 'item') {
      // Add the item to the trainer's inventory
      const itemData = reward.reward_data;

      // Update the trainer's inventory based on item type
      // This is a simplified version, you'll need to adapt it to your inventory system
      await Trainer.update(trainer.id, {
        inv_items: JSON.stringify([...JSON.parse(trainer.inv_items || '[]'), itemData])
      });
    } else if (reward_type === 'coin') {
      // Add coins to the trainer's balance
      const coinAmount = reward.reward_data.amount || 0;

      await Trainer.update(trainer.id, {
        coins: trainer.coins + coinAmount
      });
    }

    // Mark the reward as claimed in the session
    rewards[rewardIndex].claimed = true;

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
      [JSON.stringify(rewards), session_id]
    );

    // Return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward' });
  }
});
