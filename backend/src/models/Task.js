// Task model schema
// Bu dosya veritaban1 _emas1 için referans salar

const TaskSchema = {
  tableName: 'tasks',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    description: 'TEXT',
    command: 'TEXT NOT NULL',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
};

const ExecutionLogSchema = {
  tableName: 'execution_logs',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    task_id: 'INTEGER NOT NULL',
    server_id: 'INTEGER NOT NULL',
    status: 'TEXT NOT NULL',
    output: 'TEXT',
    error: 'TEXT',
    started_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    completed_at: 'DATETIME'
  }
};

module.exports = {
  TaskSchema,
  ExecutionLogSchema
};
