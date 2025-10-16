const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı türünü belirle (MySQL veya SQLite)
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// MySQL ayarları
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'server_orchestrator',
  charset: 'utf8mb4', // Türkçe karakter desteği için
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// SQLite ayarları
const SQLITE_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

let db;
let pool;

/**
 * Veritabanı bağlantısını al
 */
async function getDatabase() {
  if (DB_TYPE === 'mysql') {
    if (!pool) {
      try {
        pool = mysql.createPool(MYSQL_CONFIG);
        console.log('✅ MySQL bağlantı havuzu oluşturuldu');
      } catch (error) {
        console.error('❌ MySQL bağlantı hatası:', error);
        throw error;
      }
    }
    return pool;
  } else {
    // SQLite
    if (!db) {
      db = new sqlite3.Database(SQLITE_PATH, (err) => {
        if (err) {
          console.error('❌ SQLite veritabanı açma hatası:', err);
        } else {
          console.log('✅ SQLite veritabanına bağlanıldı');
        }
      });
    }
    return db;
  }
}

/**
 * MySQL sorgusu çalıştır
 */
async function queryMySQL(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

/**
 * SQLite sorgusu çalıştır (Promise wrapper)
 */
function querySQLite(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('pragma')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, changes: this.changes });
      });
    }
  });
}

/**
 * Veritabanı türüne göre sorgu çalıştır
 */
async function query(sql, params = []) {
  if (DB_TYPE === 'mysql') {
    return await queryMySQL(sql, params);
  } else {
    return await querySQLite(sql, params);
  }
}

/**
 * Veritabanı tablolarını oluştur
 */
async function initDatabase() {
  await getDatabase();

  if (DB_TYPE === 'mysql') {
    // MySQL tabloları
    await query(`
      CREATE TABLE IF NOT EXISTS servers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        host VARCHAR(255) NOT NULL,
        port INT DEFAULT 22,
        username VARCHAR(255) NOT NULL,
        password TEXT,
        private_key TEXT,
        status VARCHAR(50) DEFAULT 'idle',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        command TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT,
        server_id INT,
        status VARCHAR(50),
        output TEXT,
        error TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ MySQL tabloları oluşturuldu');
  } else {
    // SQLite tabloları
    return new Promise((resolve, reject) => {
      db.serialize(() => {
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
            console.log('✅ SQLite tabloları oluşturuldu');
            resolve();
          }
        });
      });
    });
  }
}

/**
 * Veritabanı bağlantısını kapat
 */
async function closeDatabase() {
  if (DB_TYPE === 'mysql' && pool) {
    await pool.end();
    console.log('MySQL bağlantı havuzu kapatıldı');
  } else if (db) {
    db.close((err) => {
      if (err) {
        console.error('SQLite kapatma hatası:', err);
      } else {
        console.log('SQLite veritabanı kapatıldı');
      }
    });
  }
}

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase,
  query,
  DB_TYPE
};
