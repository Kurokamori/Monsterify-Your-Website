const db = require('./index');

/**
 * Execute a SQL query asynchronously
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const asyncQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Execute a SQL statement asynchronously
 * @param {string} sql - SQL statement
 * @param {Array} params - Statement parameters
 * @returns {Promise<Object>} - Statement result
 */
const asyncExec = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

module.exports = {
  asyncQuery,
  asyncExec
};
