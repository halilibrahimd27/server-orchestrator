const { query, DB_TYPE } = require('../config/database');
const { executeOnMultipleServers } = require('../services/sshExecutor');

// Tüm görevleri getir
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Görevler yüklenirken hata oluştu: ' + err.message });
  }
};

// ID'ye göre görev getir
exports.getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    res.json({ task: tasks[0] });
  } catch (err) {
    res.status(500).json({ error: 'Görev getirilirken hata oluştu: ' + err.message });
  }
};

// Yeni görev oluştur
exports.createTask = async (req, res) => {
  const { name, description, command } = req.body;

  if (!name || !command) {
    return res.status(400).json({ error: 'Ad ve komut zorunludur' });
  }

  try {
    const result = await query(
      'INSERT INTO tasks (name, description, command) VALUES (?, ?, ?)',
      [name, description, command]
    );

    res.status(201).json({
      message: 'Görev başarıyla oluşturuldu',
      taskId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Görev oluşturulurken hata oluştu: ' + err.message });
  }
};

// Görev güncelle
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { name, description, command } = req.body;

  try {
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (command) { updates.push('command = ?'); values.push(command); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan yok' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes === 0 && result.affectedRows === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    res.json({ message: 'Görev başarıyla güncellendi' });
  } catch (err) {
    res.status(500).json({ error: 'Görev güncellenirken hata oluştu: ' + err.message });
  }
};

// Görev sil
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM tasks WHERE id = ?', [id]);

    if (result.changes === 0 && result.affectedRows === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    res.json({ message: 'Görev başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Görev silinirken hata oluştu: ' + err.message });
  }
};

// Görevi sunucularda çalıştır
exports.executeTask = async (req, res) => {
  const { taskId, serverIds, parallel = true } = req.body;

  if (!taskId || !serverIds || serverIds.length === 0) {
    return res.status(400).json({ error: 'Görev ID ve sunucu ID\'leri zorunludur' });
  }

  try {
    // Görevi getir
    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [taskId]);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    const task = tasks[0];

    // Sunucuları getir
    const placeholders = serverIds.map(() => '?').join(',');
    const servers = await query(
      `SELECT * FROM servers WHERE id IN (${placeholders})`,
      serverIds
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    // Başlangıcı bildir
    if (global.broadcastLog) {
      global.broadcastLog({
        type: 'execution_start',
        taskId: task.id,
        taskName: task.name,
        serverCount: servers.length
      });
    }

    // Görevi tüm sunucularda çalıştır
    const results = await executeOnMultipleServers(
      servers,
      task.command,
      parallel
    );

    // Yürütme kayıtlarını kaydet
    for (const result of results) {
      await query(
        `INSERT INTO execution_logs (task_id, server_id, status, output, error, completed_at)
         VALUES (?, ?, ?, ?, ?, ${DB_TYPE === 'mysql' ? 'NOW()' : 'CURRENT_TIMESTAMP'})`,
        [
          task.id,
          result.serverId,
          result.status,
          result.output || null,
          result.error || null
        ]
      );
    }

    // Tamamlanmayı bildir
    if (global.broadcastLog) {
      global.broadcastLog({
        type: 'execution_complete',
        taskId: task.id,
        results: results
      });
    }

    res.json({
      message: 'Görev çalıştırıldı',
      results: results
    });

  } catch (error) {
    res.status(500).json({
      error: 'Görev çalıştırılırken hata oluştu',
      details: error.message
    });
  }
};

// Yürütme kayıtlarını getir
exports.getExecutionLogs = async (req, res) => {
  const { limit = 50, taskId, serverId } = req.query;

  try {
    let sqlQuery = `
      SELECT el.*, t.name as task_name, s.name as server_name
      FROM execution_logs el
      LEFT JOIN tasks t ON el.task_id = t.id
      LEFT JOIN servers s ON el.server_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (taskId) {
      sqlQuery += ' AND el.task_id = ?';
      params.push(taskId);
    }

    if (serverId) {
      sqlQuery += ' AND el.server_id = ?';
      params.push(serverId);
    }

    sqlQuery += ' ORDER BY el.started_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const logs = await query(sqlQuery, params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Kayıtlar yüklenirken hata oluştu: ' + err.message });
  }
};
