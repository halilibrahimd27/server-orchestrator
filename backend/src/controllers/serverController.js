const { getDatabase } = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');
const { testConnection } = require('../services/sshExecutor');

// Get all servers
exports.getAllServers = (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT id, name, host, port, username, status, created_at FROM servers', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ servers: rows });
  });
};

// Get server by ID
exports.getServerById = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get(
    'SELECT id, name, host, port, username, status, created_at FROM servers WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json({ server: row });
    }
  );
};

// Create new server
exports.createServer = (req, res) => {
  const db = getDatabase();
  const { name, host, port, username, password, private_key } = req.body;
  
  if (!name || !host || !username) {
    return res.status(400).json({ error: 'Name, host, and username are required' });
  }
  
  // Encrypt sensitive data
  const encryptedPassword = password ? encrypt(password) : null;
  const encryptedPrivateKey = private_key ? encrypt(private_key) : null;
  
  db.run(
    `INSERT INTO servers (name, host, port, username, password, private_key) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, host, port || 22, username, encryptedPassword, encryptedPrivateKey],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Server name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Server created successfully',
        serverId: this.lastID
      });
    }
  );
};

// Update server
exports.updateServer = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, host, port, username, password, private_key } = req.body;
  
  // Build update query dynamically
  const updates = [];
  const values = [];
  
  if (name) { updates.push('name = ?'); values.push(name); }
  if (host) { updates.push('host = ?'); values.push(host); }
  if (port) { updates.push('port = ?'); values.push(port); }
  if (username) { updates.push('username = ?'); values.push(username); }
  if (password) { updates.push('password = ?'); values.push(encrypt(password)); }
  if (private_key) { updates.push('private_key = ?'); values.push(encrypt(private_key)); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  db.run(
    `UPDATE servers SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json({ message: 'Server updated successfully' });
    }
  );
};

// Delete server
exports.deleteServer = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.run('DELETE FROM servers WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json({ message: 'Server deleted successfully' });
  });
};

// Test server connection
exports.testServerConnection = async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get('SELECT * FROM servers WHERE id = ?', [id], async (err, server) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    try {
      const result = await testConnection(server);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
};