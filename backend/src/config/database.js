const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
      }
    });
  }
  return db;
}

async function initDatabase() {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Servers table
      db.run(`
        CREATE TABLE IF NOT EXISTS servers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          host TEXT NOT NULL,
          port INTEGER DEFAULT 22,
          username TEXT NOT NULL,
          password TEXT,
          private_key TEXT,
          status TEXT DEFAULT 'idle',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          command TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Execution logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS execution_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER,
          server_id INTEGER,
          status TEXT,
          output TEXT,
          error TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          FOREIGN KEY (server_id) REFERENCES servers(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database tables initialized');
          resolve();
        }
      });
    });
  });
}

module.exports = {
  getDatabase,
  initDatabase
};