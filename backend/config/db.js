const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database configuration
const dbConfig = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(dataDir, 'dusk_and_dawn_dev.sqlite3')
    },
    useNullAsDefault: true
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL ?
      {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      } :
      {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'dusk_and_dawn',
        port: process.env.DB_PORT || 5432,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      
    pool: {
      min: 2,
      max: 10
    }
  }
};
console.log('DB Config:', dbConfig);
console.log('Database URL:', process.env.DATABASE_URL);

// Get environment from NODE_ENV or default to development
const environment = 'production';
const config = dbConfig[environment];

let db;

if (config.client === 'sqlite3') {
  // Ensure the database directory exists
  if (config.connection.filename !== ':memory:') {
    const dbDir = path.dirname(config.connection.filename);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  // SQLite setup
  db = new sqlite3.Database(config.connection.filename, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log(`Connected to SQLite database at ${config.connection.filename}`);
    }
  });

  // Enable foreign keys in SQLite
  db.run('PRAGMA foreign_keys = ON');

  // Promisify SQLite methods
  db.asyncRun = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  db.asyncGet = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.get(sql, params, function(err, row) {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  db.asyncAll = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.all(sql, params, function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  db.asyncExec = function(sql) {
    return new Promise((resolve, reject) => {
      this.exec(sql, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  };
} else {
  // PostgreSQL setup
  const pool = new Pool(config.connection);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
  });

  db = {
    asyncRun: (sql, params = []) => pool.query(sql, params),
    asyncGet: async (sql, params = []) => {
      const result = await pool.query(sql, params);
      return result.rows[0];
    },
    asyncAll: async (sql, params = []) => {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    asyncExec: (sql) => pool.query(sql),
    close: () => pool.end()
  };
}

// Add additional properties to db object for compatibility
db.config = config;
db.isPostgreSQL = config.client === 'pg';

// Export database connection directly for compatibility with existing models
module.exports = db;
