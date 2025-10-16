const { query } = require('../config/database');

// Tüm grupları getir
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await query('SELECT * FROM server_groups ORDER BY name');

    // Her grubun sunucu sayısını ekle
    for (let group of groups) {
      const counts = await query(
        'SELECT COUNT(*) as count FROM server_group_members WHERE group_id = ?',
        [group.id]
      );
      group.server_count = counts[0].count;
    }

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Gruplar yüklenirken hata oluştu: ' + err.message });
  }
};

// Grup oluştur
exports.createGroup = async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Grup adı zorunludur' });
  }

  try {
    const result = await query(
      'INSERT INTO server_groups (name, description, color) VALUES (?, ?, ?)',
      [name, description || null, color || '#3b82f6']
    );

    res.status(201).json({
      message: 'Grup başarıyla oluşturuldu',
      groupId: result.insertId
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Bu grup adı zaten kullanılıyor' });
    }
    res.status(500).json({ error: 'Grup oluşturulurken hata oluştu: ' + err.message });
  }
};

// Grup güncelle
exports.updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  try {
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (color) { updates.push('color = ?'); values.push(color); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan yok' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(`UPDATE server_groups SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Grup başarıyla güncellendi' });
  } catch (err) {
    res.status(500).json({ error: 'Grup güncellenirken hata oluştu: ' + err.message });
  }
};

// Grup sil
exports.deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM server_groups WHERE id = ?', [id]);
    res.json({ message: 'Grup başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Grup silinirken hata oluştu: ' + err.message });
  }
};

// Gruba sunucu ekle
exports.addServerToGroup = async (req, res) => {
  const { groupId, serverId } = req.body;

  if (!groupId || !serverId) {
    return res.status(400).json({ error: 'Grup ID ve Sunucu ID zorunludur' });
  }

  try {
    await query(
      'INSERT INTO server_group_members (group_id, server_id) VALUES (?, ?)',
      [groupId, serverId]
    );
    res.status(201).json({ message: 'Sunucu gruba eklendi' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Sunucu zaten bu grupta' });
    }
    res.status(500).json({ error: 'Sunucu eklenirken hata oluştu: ' + err.message });
  }
};

// Gruptan sunucu çıkar
exports.removeServerFromGroup = async (req, res) => {
  const { groupId, serverId } = req.params;

  try {
    await query(
      'DELETE FROM server_group_members WHERE group_id = ? AND server_id = ?',
      [groupId, serverId]
    );
    res.json({ message: 'Sunucu gruptan çıkarıldı' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu çıkarılırken hata oluştu: ' + err.message });
  }
};

// Grubun sunucularını getir
exports.getGroupServers = async (req, res) => {
  const { id } = req.params;

  try {
    const servers = await query(`
      SELECT s.*
      FROM servers s
      INNER JOIN server_group_members sgm ON s.id = sgm.server_id
      WHERE sgm.group_id = ?
      ORDER BY s.name
    `, [id]);

    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: 'Sunucular getirilirken hata oluştu: ' + err.message });
  }
};

// Sunucunun gruplarını getir
exports.getServerGroups = async (req, res) => {
  const { serverId } = req.params;

  try {
    const groups = await query(`
      SELECT g.*
      FROM server_groups g
      INNER JOIN server_group_members sgm ON g.id = sgm.group_id
      WHERE sgm.server_id = ?
      ORDER BY g.name
    `, [serverId]);

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Gruplar getirilirken hata oluştu: ' + err.message });
  }
};
