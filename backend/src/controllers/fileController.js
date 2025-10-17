const { query } = require('../config/database');
const { decrypt } = require('../services/encryption');
const { Client } = require('ssh2');
const fs = require('fs').promises;
const path = require('path');

// Dosya yükleme (SCP)
exports.uploadFile = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { remotePath } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Dosya seçilmedi' });
    }

    if (!remotePath) {
      return res.status(400).json({ error: 'Hedef yol belirtilmedi' });
    }

    // Sunucu bilgilerini al
    const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (servers.length === 0) {
      await fs.unlink(file.path); // Temp dosyayı sil
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const server = servers[0];
    const password = server.password ? decrypt(server.password) : null;
    const privateKey = server.private_key ? decrypt(server.private_key) : null;

    const conn = new Client();

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          fs.unlink(file.path);
          return res.status(500).json({ error: 'SFTP hatası: ' + err.message });
        }

        const remoteFilePath = path.join(remotePath, file.originalname);

        sftp.fastPut(file.path, remoteFilePath, {}, async (err) => {
          conn.end();
          await fs.unlink(file.path); // Temp dosyayı sil

          if (err) {
            return res.status(500).json({ error: 'Dosya yükleme hatası: ' + err.message });
          }

          res.json({
            success: true,
            message: 'Dosya başarıyla yüklendi',
            file: {
              name: file.originalname,
              size: file.size,
              remotePath: remoteFilePath
            }
          });
        });
      });
    });

    conn.on('error', async (err) => {
      await fs.unlink(file.path);
      res.status(500).json({ error: 'SSH bağlantı hatası: ' + err.message });
    });

    const connectionInfo = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 30000
    };

    if (password) {
      connectionInfo.password = password;
    } else if (privateKey) {
      connectionInfo.privateKey = privateKey;
    }

    conn.connect(connectionInfo);

  } catch (err) {
    if (req.file) await fs.unlink(req.file.path);
    res.status(500).json({ error: 'Dosya yükleme hatası: ' + err.message });
  }
};

// Dosya indirme (SCP)
exports.downloadFile = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { remotePath } = req.body;

    if (!remotePath) {
      return res.status(400).json({ error: 'Dosya yolu belirtilmedi' });
    }

    // Sunucu bilgilerini al
    const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const server = servers[0];
    const password = server.password ? decrypt(server.password) : null;
    const privateKey = server.private_key ? decrypt(server.private_key) : null;

    const conn = new Client();
    const localPath = `/tmp/${path.basename(remotePath)}-${Date.now()}`;

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          return res.status(500).json({ error: 'SFTP hatası: ' + err.message });
        }

        sftp.fastGet(remotePath, localPath, async (err) => {
          conn.end();

          if (err) {
            return res.status(500).json({ error: 'Dosya indirme hatası: ' + err.message });
          }

          // Dosyayı kullanıcıya gönder
          res.download(localPath, path.basename(remotePath), async (err) => {
            await fs.unlink(localPath); // Temp dosyayı sil
            if (err && !res.headersSent) {
              res.status(500).json({ error: 'Dosya gönderme hatası: ' + err.message });
            }
          });
        });
      });
    });

    conn.on('error', (err) => {
      res.status(500).json({ error: 'SSH bağlantı hatası: ' + err.message });
    });

    const connectionInfo = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 30000
    };

    if (password) {
      connectionInfo.password = password;
    } else if (privateKey) {
      connectionInfo.privateKey = privateKey;
    }

    conn.connect(connectionInfo);

  } catch (err) {
    res.status(500).json({ error: 'Dosya indirme hatası: ' + err.message });
  }
};

// Dosya listesi (dizin içeriği)
exports.listFiles = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { remotePath = '~' } = req.query;

    // Sunucu bilgilerini al
    const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (servers.length === 0) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const server = servers[0];
    const password = server.password ? decrypt(server.password) : null;
    const privateKey = server.private_key ? decrypt(server.private_key) : null;

    const conn = new Client();

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          return res.status(500).json({ error: 'SFTP hatası: ' + err.message });
        }

        sftp.readdir(remotePath, (err, list) => {
          conn.end();

          if (err) {
            return res.status(500).json({ error: 'Dizin okuma hatası: ' + err.message });
          }

          const files = list.map(item => ({
            name: item.filename,
            type: item.longname[0] === 'd' ? 'directory' : 'file',
            size: item.attrs.size,
            mode: item.attrs.mode,
            mtime: item.attrs.mtime
          }));

          res.json({
            success: true,
            path: remotePath,
            files
          });
        });
      });
    });

    conn.on('error', (err) => {
      res.status(500).json({ error: 'SSH bağlantı hatası: ' + err.message });
    });

    const connectionInfo = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 30000
    };

    if (password) {
      connectionInfo.password = password;
    } else if (privateKey) {
      connectionInfo.privateKey = privateKey;
    }

    conn.connect(connectionInfo);

  } catch (err) {
    res.status(500).json({ error: 'Dosya listesi alma hatası: ' + err.message });
  }
};
