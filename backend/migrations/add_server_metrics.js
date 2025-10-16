const { query, getDatabase, DB_TYPE } = require('../src/config/database');

async function addServerMetricsTable() {
  try {
    console.log('🔄 Sunucu metrikleri tablosu oluşturuluyor...');
    await getDatabase();

    if (DB_TYPE === 'mysql') {
      await query(`
        CREATE TABLE IF NOT EXISTS server_metrics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          server_id INT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          online TINYINT DEFAULT 0,
          cpu_cores INT,
          cpu_load DECIMAL(10,2),
          cpu_usage_percent INT,
          mem_total_mb INT,
          mem_used_mb INT,
          mem_usage_percent INT,
          disk_total_gb INT,
          disk_used_gb INT,
          disk_usage_percent INT,
          uptime VARCHAR(255),
          os VARCHAR(255),
          kernel VARCHAR(255),
          error TEXT,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
          INDEX idx_server_metrics_server_timestamp (server_id, timestamp DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      await query(`
        CREATE TABLE IF NOT EXISTS server_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          online INTEGER DEFAULT 0,
          cpu_cores INTEGER,
          cpu_load REAL,
          cpu_usage_percent INTEGER,
          mem_total_mb INTEGER,
          mem_used_mb INTEGER,
          mem_usage_percent INTEGER,
          disk_total_gb INTEGER,
          disk_used_gb INTEGER,
          disk_usage_percent INTEGER,
          uptime TEXT,
          os TEXT,
          kernel TEXT,
          error TEXT,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
        )
      `);

      // Index ekle (performans için) - SQLite için ayrı
      await query(`
        CREATE INDEX IF NOT EXISTS idx_server_metrics_server_timestamp
        ON server_metrics(server_id, timestamp DESC)
      `);
    }

    console.log('✅ Sunucu metrikleri tablosu başarıyla oluşturuldu');
  } catch (error) {
    console.error('❌ Sunucu metrikleri tablosu oluşturulurken hata:', error);
    throw error;
  }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
  require('dotenv').config();
  const { initDatabase } = require('../src/config/database');

  initDatabase().then(() => {
    return addServerMetricsTable();
  }).then(() => {
    console.log('✅ Migration tamamlandı');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Migration hatası:', err);
    process.exit(1);
  });
}

module.exports = addServerMetricsTable;
