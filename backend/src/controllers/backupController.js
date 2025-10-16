const { query } = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');

// Tüm yapılandırmayı dışa aktar (sunucular ve görevler)
exports.exportConfig = async (req, res) => {
  try {
    const includePasswords = req.query.includePasswords === 'true';

    // Sunucuları al
    const servers = await query('SELECT * FROM servers');

    // Görevleri al
    const tasks = await query('SELECT * FROM tasks');

    // Hassas bilgileri temizle (isteğe bağlı)
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      servers: servers.map(server => {
        const cleanServer = {
          name: server.name,
          host: server.host,
          port: server.port,
          username: server.username,
          status: server.status
        };

        if (includePasswords) {
          cleanServer.password = server.password;
          cleanServer.private_key = server.private_key;
        }

        return cleanServer;
      }),
      tasks: tasks.map(task => ({
        name: task.name,
        description: task.description,
        command: task.command
      }))
    };

    // JSON olarak indir
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=server-orchestrator-backup-${Date.now()}.json`);
    res.json(exportData);

  } catch (err) {
    res.status(500).json({ error: 'Yedekleme oluşturulurken hata oluştu: ' + err.message });
  }
};

// Yapılandırmayı içe aktar
exports.importConfig = async (req, res) => {
  try {
    const { servers, tasks, replaceExisting } = req.body;

    if (!servers && !tasks) {
      return res.status(400).json({ error: 'İçe aktarılacak veri bulunamadı' });
    }

    let importedServers = 0;
    let importedTasks = 0;
    const errors = [];

    // Mevcut verileri temizle (isteğe bağlı)
    if (replaceExisting) {
      await query('DELETE FROM execution_logs');
      await query('DELETE FROM servers');
      await query('DELETE FROM tasks');
    }

    // Sunucuları içe aktar
    if (servers && Array.isArray(servers)) {
      for (const server of servers) {
        try {
          const encryptedPassword = server.password ? encrypt(server.password) : null;
          const encryptedPrivateKey = server.private_key ? encrypt(server.private_key) : null;

          await query(
            `INSERT INTO servers (name, host, port, username, password, private_key)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             host = VALUES(host),
             port = VALUES(port),
             username = VALUES(username)`,
            [server.name, server.host, server.port || 22, server.username, encryptedPassword, encryptedPrivateKey]
          );
          importedServers++;
        } catch (err) {
          errors.push(`Sunucu '${server.name}': ${err.message}`);
        }
      }
    }

    // Görevleri içe aktar
    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks) {
        try {
          await query(
            `INSERT INTO tasks (name, description, command)
             VALUES (?, ?, ?)`,
            [task.name, task.description, task.command]
          );
          importedTasks++;
        } catch (err) {
          errors.push(`Görev '${task.name}': ${err.message}`);
        }
      }
    }

    res.json({
      message: 'İçe aktarma tamamlandı',
      importedServers,
      importedTasks,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    res.status(500).json({ error: 'İçe aktarma sırasında hata oluştu: ' + err.message });
  }
};

// İstatistikleri getir
exports.getStats = async (req, res) => {
  try {
    const serverCount = await query('SELECT COUNT(*) as count FROM servers');
    const taskCount = await query('SELECT COUNT(*) as count FROM tasks');
    const logCount = await query('SELECT COUNT(*) as count FROM execution_logs');

    const recentLogs = await query(
      'SELECT COUNT(*) as count FROM execution_logs WHERE started_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );

    const successRate = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful
      FROM execution_logs
      WHERE started_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      totalServers: serverCount[0].count,
      totalTasks: taskCount[0].count,
      totalExecutions: logCount[0].count,
      last24Hours: recentLogs[0].count,
      successRate: successRate[0].total > 0
        ? Math.round((successRate[0].successful / successRate[0].total) * 100)
        : 0
    });

  } catch (err) {
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu: ' + err.message });
  }
};
