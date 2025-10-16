const { query, getDatabase, DB_TYPE } = require('../src/config/database');

async function addServerGroupsTables() {
  try {
    console.log('🔄 Sunucu grupları tabloları oluşturuluyor...');
    await getDatabase();

    if (DB_TYPE === 'mysql') {
      // MySQL/MariaDB Server Groups tablosu
      await query(`
        CREATE TABLE IF NOT EXISTS server_groups (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3b82f6',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // MySQL/MariaDB Server Group Members tablosu
      await query(`
        CREATE TABLE IF NOT EXISTS server_group_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          server_id INT NOT NULL,
          group_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES server_groups(id) ON DELETE CASCADE,
          UNIQUE KEY unique_server_group (server_id, group_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      // SQLite Server Groups tablosu
      await query(`
        CREATE TABLE IF NOT EXISTS server_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          color TEXT DEFAULT '#3b82f6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // SQLite Server Group Members tablosu
      await query(`
        CREATE TABLE IF NOT EXISTS server_group_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id INTEGER NOT NULL,
          group_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES server_groups(id) ON DELETE CASCADE,
          UNIQUE(server_id, group_id)
        )
      `);
    }

    // Örnek gruplar ekle (eğer tablo boşsa)
    const existing = await query('SELECT COUNT(*) as count FROM server_groups');
    if (existing[0].count === 0) {
      await query(`
        INSERT INTO server_groups (name, description, color) VALUES
        ('Production', 'Canlı sunucular', '#ef4444'),
        ('Staging', 'Test ve hazırlık sunucuları', '#f59e0b'),
        ('Development', 'Geliştirme sunucuları', '#10b981'),
        ('Database', 'Veritabanı sunucuları', '#8b5cf6'),
        ('Web Servers', 'Web sunucuları', '#3b82f6')
      `);
      console.log('✅ Örnek gruplar eklendi');
    }

    console.log('✅ Sunucu grupları tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('❌ Sunucu grupları tabloları oluşturulurken hata:', error);
    throw error;
  }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
  require('dotenv').config();
  const { initDatabase } = require('../src/config/database');

  initDatabase().then(() => {
    return addServerGroupsTables();
  }).then(() => {
    console.log('✅ Migration tamamlandı');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Migration hatası:', err);
    process.exit(1);
  });
}

module.exports = addServerGroupsTables;
