const { query } = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');
const { testConnection } = require('../services/sshExecutor');

// Tüm sunucuları getir
exports.getAllServers = async (req, res) => {
  try {
    const servers = await query(
      'SELECT id, name, host, port, username, status, created_at FROM servers'
    );
    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: 'Sunucular yüklenirken hata oluştu: ' + err.message });
  }
};

// ID'ye göre sunucu getir
exports.getServerById = async (req, res) => {
  const { id } = req.params;

  try {
    const servers = await query(
      'SELECT id, name, host, port, username, status, created_at FROM servers WHERE id = ?',
      [id]
    );

    if (!servers || servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    res.json({ server: servers[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu getirilirken hata oluştu: ' + err.message });
  }
};

// Yeni sunucu oluştur
exports.createServer = async (req, res) => {
  const { name, host, port, username, password, private_key } = req.body;

  if (!name || !host || !username) {
    return res.status(400).json({ error: 'Ad, host ve kullanıcı adı zorunludur' });
  }

  try {
    // Hassas verileri şifrele
    const encryptedPassword = password ? encrypt(password) : null;
    const encryptedPrivateKey = private_key ? encrypt(private_key) : null;

    const result = await query(
      `INSERT INTO servers (name, host, port, username, password, private_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, host, port || 22, username, encryptedPassword, encryptedPrivateKey]
    );

    res.status(201).json({
      message: 'Sunucu başarıyla oluşturuldu',
      serverId: result.insertId
    });
  } catch (err) {
    if (err.message.includes('UNIQUE') || err.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'Bu sunucu adı zaten kullanılıyor' });
    }
    res.status(500).json({ error: 'Sunucu oluşturulurken hata oluştu: ' + err.message });
  }
};

// Sunucu güncelle
exports.updateServer = async (req, res) => {
  const { id } = req.params;
  const { name, host, port, username, password, private_key } = req.body;

  try {
    // Dinamik güncelleme sorgusu oluştur
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (host) { updates.push('host = ?'); values.push(host); }
    if (port) { updates.push('port = ?'); values.push(port); }
    if (username) { updates.push('username = ?'); values.push(username); }
    if (password) { updates.push('password = ?'); values.push(encrypt(password)); }
    if (private_key) { updates.push('private_key = ?'); values.push(encrypt(private_key)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan yok' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await query(
      `UPDATE servers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes === 0 && result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    res.json({ message: 'Sunucu başarıyla güncellendi' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu güncellenirken hata oluştu: ' + err.message });
  }
};

// Sunucu sil
exports.deleteServer = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM servers WHERE id = ?', [id]);

    if (result.changes === 0 && result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    res.json({ message: 'Sunucu başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu silinirken hata oluştu: ' + err.message });
  }
};

// Sunucu bağlantı testi
exports.testServerConnection = async (req, res) => {
  const { id } = req.params;

  try {
    const servers = await query('SELECT * FROM servers WHERE id = ?', [id]);

    if (!servers || servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const result = await testConnection(servers[0]);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Bağlantı testi başarısız: ' + error.message
    });
  }
};
