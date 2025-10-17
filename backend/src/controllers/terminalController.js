const { query } = require('../config/database');
const { decrypt } = require('../services/encryption');
const { Client } = require('ssh2');

// WebSocket bağlantılarını sakla
const terminals = new Map();

// Terminal bağlantısı oluştur
exports.connect = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { cols = 80, rows = 24 } = req.body;

    // Sunucu bilgilerini al
    const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const server = servers[0];
    const password = server.password ? decrypt(server.password) : null;
    const privateKey = server.private_key ? decrypt(server.private_key) : null;

    // SSH bağlantı bilgileri
    const connectionInfo = {
      host: server.host,
      port: server.port || 22,
      username: server.username
    };

    if (password) {
      connectionInfo.password = password;
    } else if (privateKey) {
      connectionInfo.privateKey = privateKey;
    }

    res.json({
      success: true,
      message: 'Terminal bağlantısı hazır',
      serverId,
      connectionInfo: {
        host: server.host,
        port: server.port,
        username: server.username
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Terminal bağlantısı oluşturulamadı: ' + err.message });
  }
};

// WebSocket handler'ı (server.js'de kullanılacak)
exports.handleWebSocket = (ws, serverId, servers) => {
  const server = servers.find(s => s.id == serverId);
  if (!server) {
    ws.send(JSON.stringify({ type: 'error', data: 'Sunucu bulunamadı' }));
    ws.close();
    return;
  }

  const conn = new Client();

  conn.on('ready', () => {
    conn.shell({ term: 'xterm-256color' }, (err, stream) => {
      if (err) {
        ws.send(JSON.stringify({ type: 'error', data: err.message }));
        ws.close();
        return;
      }

      // Terminal çıktısını WebSocket'e gönder
      stream.on('data', (data) => {
        ws.send(data.toString('utf-8'));
      });

      stream.stderr.on('data', (data) => {
        ws.send(data.toString('utf-8'));
      });

      // WebSocket'ten gelen veriyi terminale gönder
      ws.on('message', (msg) => {
        stream.write(msg);
      });

      ws.on('close', () => {
        stream.end();
        conn.end();
      });

      stream.on('close', () => {
        conn.end();
        ws.close();
      });
    });
  });

  conn.on('error', (err) => {
    ws.send(JSON.stringify({ type: 'error', data: err.message }));
    ws.close();
  });

  const password = server.password ? decrypt(server.password) : null;
  const privateKey = server.private_key ? decrypt(server.private_key) : null;

  const connectionInfo = {
    host: server.host,
    port: server.port || 22,
    username: server.username,
    readyTimeout: 30000,
    keepaliveInterval: 10000
  };

  if (password) {
    connectionInfo.password = password;
  } else if (privateKey) {
    connectionInfo.privateKey = privateKey;
  }

  conn.connect(connectionInfo);
};
