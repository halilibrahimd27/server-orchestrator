// Server model schema
// Bu dosya veritaban1 _emas1 için referans salar

const ServerSchema = {
  tableName: 'servers',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL UNIQUE',
    host: 'TEXT NOT NULL',
    port: 'INTEGER DEFAULT 22',
    username: 'TEXT NOT NULL',
    password: 'TEXT',
    private_key: 'TEXT',
    status: 'TEXT DEFAULT "unknown"',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = ServerSchema;
