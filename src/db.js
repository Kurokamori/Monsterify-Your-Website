const { Pool } = require('pg');
require('dotenv').config();

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create shop tables if they don't exist
pool.query(`
  -- Shop configuration table
  CREATE TABLE IF NOT EXISTS shop_config (
      id SERIAL PRIMARY KEY,
      shop_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      image_url TEXT,
      category VARCHAR(50) NOT NULL,
      price_multiplier_min DECIMAL(5,2) DEFAULT 0.8,
      price_multiplier_max DECIMAL(5,2) DEFAULT 1.2,
      min_items INTEGER DEFAULT 1,
      max_items INTEGER DEFAULT 5,
      restock_hour INTEGER DEFAULT 0, -- Hour of day for restock (0-23)
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Daily shop items table
  CREATE TABLE IF NOT EXISTS daily_shop_items (
      id SERIAL PRIMARY KEY,
      shop_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      price INTEGER NOT NULL,
      max_quantity INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(shop_id, item_id, date)
  );

  -- Player shop purchases table
  CREATE TABLE IF NOT EXISTS player_shop_purchases (
      id SERIAL PRIMARY KEY,
      player_id VARCHAR(50) NOT NULL,
      shop_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, shop_id, item_id, date)
  );
`).catch(err => {
  console.error('Error creating shop tables:', err);
});

// Insert default shop configurations if they don't exist
pool.query(`
  INSERT INTO shop_config (shop_id, name, description, category, image_url, min_items, max_items, price_multiplier_min, price_multiplier_max)
  VALUES
  ('general_store', 'General Store', 'A shop that sells various everyday items.', 'general', 'https://i.imgur.com/RmKySNO.png', 3, 5, 0.9, 1.1),
  ('potion_shop', 'Potion Shop', 'A shop that sells healing and status items.', 'potions', 'https://i.imgur.com/HViAPDq.jpeg', 2, 4, 0.8, 1.2),
  ('apothecary', 'Apothecary', 'A shop that sells various berries and healing items.', 'berries', 'https://i.imgur.com/HViAPDq.jpeg', 2, 5, 0.7, 1.3),
  ('megamart', 'Mega Mart', 'A shop that sells various Poké Balls and catching items.', 'balls', 'https://i.imgur.com/RmKySNO.png', 1, 3, 1.0, 1.5),
  ('witchs_hut', 'Witch\'s Hut', 'A shop that sells evolution items and abilities.', 'evolution', 'https://i.imgur.com/5cgcSGC.png', 1, 3, 1.2, 1.8),
  ('antique_shop', 'Antique Shop', 'A shop that sells rare and unique items.', 'antiques', 'https://i.imgur.com/antique.png', 1, 2, 1.5, 2.0),
  ('bakery', 'Bakery', 'A shop that sells delicious pastries for your monsters.', 'pastries', 'https://i.imgur.com/5cgcSGC.png', 2, 4, 0.8, 1.2),
  ('item_shop', 'Item Shop', 'A shop that sells various useful items.', 'items', 'https://i.imgur.com/items.png', 3, 6, 0.9, 1.3),
  ('nursery', 'Nursery', 'A shop that sells egg-related items and accessories.', 'eggs', 'https://i.imgur.com/IhtWUxD.png', 1, 3, 1.1, 1.6),
  ('pirates_dock', 'Pirate\'s Dock', 'A shop that sells rare and exotic black market items.', 'black_market', 'https://i.imgur.com/RmKySNO.png', 1, 3, 1.5, 2.5)
  ON CONFLICT (shop_id) DO NOTHING;
`).catch(err => {
  console.error('Error inserting default shop configurations:', err);
});

module.exports = pool;
