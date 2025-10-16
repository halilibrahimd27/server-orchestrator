// ScheduledTask model schema
// Periyodik görev çalıştırma için zamanlanmış görevler

const ScheduledTaskSchema = {
  tableName: 'scheduled_tasks',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    task_id: 'INTEGER NOT NULL', // Hangi görev çalıştırılacak
    server_ids: 'TEXT NOT NULL', // JSON array: [1,2,3]
    schedule_type: 'TEXT NOT NULL', // 'interval' veya 'cron'
    schedule_value: 'TEXT NOT NULL', // Interval için dakika, cron için cron expression
    enabled: 'INTEGER DEFAULT 1', // 0 = disabled, 1 = enabled
    last_run: 'DATETIME', // Son çalıştırılma zamanı
    next_run: 'DATETIME', // Bir sonraki çalıştırılma zamanı
    run_count: 'INTEGER DEFAULT 0', // Kaç kez çalıştırıldı
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    constraints: `
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    `
  }
};

module.exports = ScheduledTaskSchema;
