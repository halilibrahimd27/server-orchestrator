const { query } = require('../config/database');
const { calculateNextRun } = require('../services/scheduler');

// Tüm zamanlanmış görevleri getir
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await query(`
      SELECT
        st.*,
        t.name as task_name,
        t.command as task_command
      FROM scheduled_tasks st
      INNER JOIN tasks t ON st.task_id = t.id
      ORDER BY st.next_run
    `);

    // Server ID'leri parse et
    schedules.forEach(s => {
      s.server_ids = JSON.parse(s.server_ids);
    });

    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ error: 'Zamanlanmış görevler yüklenirken hata: ' + err.message });
  }
};

// Zamanlanmış görev oluştur
exports.createSchedule = async (req, res) => {
  const { name, task_id, server_ids, schedule_type, schedule_value, enabled } = req.body;

  if (!name || !task_id || !server_ids || !schedule_type || !schedule_value) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  if (!['interval', 'cron'].includes(schedule_type)) {
    return res.status(400).json({ error: 'schedule_type interval veya cron olmalı' });
  }

  if (!Array.isArray(server_ids) || server_ids.length === 0) {
    return res.status(400).json({ error: 'En az bir sunucu seçilmeli' });
  }

  try {
    // İlk next_run hesapla
    const nextRun = calculateNextRun(schedule_type, schedule_value);

    const result = await query(
      `INSERT INTO scheduled_tasks
       (name, task_id, server_ids, schedule_type, schedule_value, enabled, next_run)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        task_id,
        JSON.stringify(server_ids),
        schedule_type,
        schedule_value,
        enabled !== undefined ? enabled : 1,
        nextRun ? nextRun.toISOString() : null
      ]
    );

    res.status(201).json({
      message: 'Zamanlanmış görev başarıyla oluşturuldu',
      scheduleId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Zamanlanmış görev oluşturulurken hata: ' + err.message });
  }
};

// Zamanlanmış görev güncelle
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { name, task_id, server_ids, schedule_type, schedule_value, enabled } = req.body;

  try {
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (task_id) { updates.push('task_id = ?'); values.push(task_id); }
    if (server_ids) { updates.push('server_ids = ?'); values.push(JSON.stringify(server_ids)); }
    if (schedule_type) { updates.push('schedule_type = ?'); values.push(schedule_type); }
    if (schedule_value) { updates.push('schedule_value = ?'); values.push(schedule_value); }
    if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan yok' });
    }

    // Eğer zamanlama değişmişse next_run'ı yeniden hesapla
    if (schedule_type || schedule_value) {
      const schedules = await query('SELECT * FROM scheduled_tasks WHERE id = ?', [id]);
      if (schedules && schedules.length > 0) {
        const s = schedules[0];
        const newType = schedule_type || s.schedule_type;
        const newValue = schedule_value || s.schedule_value;
        const nextRun = calculateNextRun(newType, newValue);
        updates.push('next_run = ?');
        values.push(nextRun ? nextRun.toISOString() : null);
      }
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(`UPDATE scheduled_tasks SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Zamanlanmış görev güncellendi' });
  } catch (err) {
    res.status(500).json({ error: 'Zamanlanmış görev güncellenirken hata: ' + err.message });
  }
};

// Zamanlanmış görev sil
exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM scheduled_tasks WHERE id = ?', [id]);
    res.json({ message: 'Zamanlanmış görev silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Zamanlanmış görev silinirken hata: ' + err.message });
  }
};

// Zamanlanmış görevi etkinleştir/devre dışı bırak
exports.toggleSchedule = async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  if (enabled === undefined) {
    return res.status(400).json({ error: 'enabled alanı zorunludur' });
  }

  try {
    await query('UPDATE scheduled_tasks SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
    res.json({ message: enabled ? 'Zamanlanmış görev etkinleştirildi' : 'Zamanlanmış görev devre dışı bırakıldı' });
  } catch (err) {
    res.status(500).json({ error: 'Zamanlanmış görev durumu değiştirilirken hata: ' + err.message });
  }
};
