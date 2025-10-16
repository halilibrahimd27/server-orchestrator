const { query, getDatabase, DB_TYPE } = require('../src/config/database');

async function addScheduledTasksTable() {
  try {
    console.log('🔄 Zamanlanmış görevler tablosu oluşturuluyor...');
    await getDatabase();

    if (DB_TYPE === 'mysql') {
      await query(`
        CREATE TABLE IF NOT EXISTS scheduled_tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          task_id INT NOT NULL,
          server_ids TEXT NOT NULL,
          schedule_type VARCHAR(50) NOT NULL,
          schedule_value VARCHAR(255) NOT NULL,
          enabled TINYINT DEFAULT 1,
          last_run TIMESTAMP NULL,
          next_run TIMESTAMP NULL,
          run_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } else {
      await query(`
        CREATE TABLE IF NOT EXISTS scheduled_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          task_id INTEGER NOT NULL,
          server_ids TEXT NOT NULL,
          schedule_type TEXT NOT NULL,
          schedule_value TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          last_run DATETIME,
          next_run DATETIME,
          run_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `);
    }

    console.log('✅ Zamanlanmış görevler tablosu başarıyla oluşturuldu');
  } catch (error) {
    console.error('❌ Zamanlanmış görevler tablosu oluşturulurken hata:', error);
    throw error;
  }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
  require('dotenv').config();
  const { initDatabase } = require('../src/config/database');

  initDatabase().then(() => {
    return addScheduledTasksTable();
  }).then(() => {
    console.log('✅ Migration tamamlandı');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Migration hatası:', err);
    process.exit(1);
  });
}

module.exports = addScheduledTasksTable;
