const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');
const { loadMarkdownContent, getContentCategories } = require('./utils/content-loader');
const { loadAllFakemon, getFakemonByNumber } = require('./utils/fakemon-loader');
const User = require('./models/User');
const Trainer = require('./models/Trainer');
const Monster = require('./models/Monster');
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

// Other middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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
  console.log('Session user:', req.session.user ? `ID: ${req.session.user.id}, Username: ${req.session.user.username}` : 'Not logged in');
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'ARPG Game'
  });
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
    title: 'Admin Dashboard'
  });
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

// Town routes (protected, only for logged-in users)
app.get('/town', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('town/index', {
    title: 'Visit Town'
  });
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

    res.render('monsters/detail', {  // Assuming you have a monster detail view
      trainer,
      monster,
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
