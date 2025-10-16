// ServerGroup model schema
// Sunucuları gruplar halinde organize etmek için

const ServerGroupSchema = {
  tableName: 'server_groups',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL UNIQUE',
    description: 'TEXT',
    color: 'TEXT DEFAULT "#3b82f6"', // Hex color for UI
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
};

// Sunucu-Grup ilişki tablosu (Many-to-Many)
const ServerGroupMemberSchema = {
  tableName: 'server_group_members',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    server_id: 'INTEGER NOT NULL',
    group_id: 'INTEGER NOT NULL',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    // Foreign keys ve unique constraint
    constraints: `
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES server_groups(id) ON DELETE CASCADE,
      UNIQUE(server_id, group_id)
    `
  }
};

module.exports = {
  ServerGroupSchema,
  ServerGroupMemberSchema
};
