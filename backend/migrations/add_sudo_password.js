const { getDatabase, query, DB_TYPE, closeDatabase } = require('../src/config/database');

async function addSudoPasswordColumn() {
  try {
    console.log('Adding sudo_password column to servers table...');

    // Database'i başlat
    await getDatabase();

    if (DB_TYPE === 'mysql') {
      await query('ALTER TABLE servers ADD COLUMN sudo_password TEXT');
    } else {
      // SQLite
      await query('ALTER TABLE servers ADD COLUMN sudo_password TEXT');
    }

    console.log('✅ sudo_password column added successfully!');
  } catch (error) {
    if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
      console.log('⚠️  Column already exists, skipping...');
    } else {
      console.error('❌ Error adding column:', error.message);
      throw error;
    }
  }
}

// Eğer doğrudan çalıştırılırsa
if (require.main === module) {
  addSudoPasswordColumn()
    .then(() => {
      setTimeout(() => {
        closeDatabase();
        process.exit(0);
      }, 500);
    })
    .catch(() => {
      setTimeout(() => {
        closeDatabase();
        process.exit(1);
      }, 500);
    });
}

module.exports = { addSudoPasswordColumn };
