const { query } = require('../src/config/database');

async function addScheduledTasksTable() {
  try {
    console.log('🔄 Zamanlanmış görevler tablosu oluşturuluyor...');

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
