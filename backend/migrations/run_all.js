require('dotenv').config();
const { initDatabase } = require('../src/config/database');

// Migration fonksiyonları
const addSudoPassword = require('./add_sudo_password');
const addServerGroups = require('./add_server_groups');
const addScheduledTasks = require('./add_scheduled_tasks');
const addServerMetrics = require('./add_server_metrics');

async function runAllMigrations() {
  console.log('🚀 Tüm migration\'lar çalıştırılıyor...\n');

  try {
    // Veritabanını başlat
    await initDatabase();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Migration'ları sırayla çalıştır
    await addSudoPassword();
    console.log('');

    await addServerGroups();
    console.log('');

    await addScheduledTasks();
    console.log('');

    await addServerMetrics();
    console.log('');

    console.log('✅ Tüm migration\'lar başarıyla tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
}

// Çalıştır
runAllMigrations();
