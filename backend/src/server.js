require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { initDatabase } = require('./config/database');
const serverRoutes = require('./routes/serverRoutes');
const taskRoutes = require('./routes/taskRoutes');
const backupRoutes = require('./routes/backupRoutes');
const groupRoutes = require('./routes/groupRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const healthRoutes = require('./routes/healthRoutes');
const terminalRoutes = require('./routes/terminalRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { startScheduler } = require('./services/scheduler');
const { startHealthMonitoring } = require('./services/healthMonitor');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const TERMINAL_WS_PORT = process.env.TERMINAL_WS_PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// UTF-8 charset header'ı ekle
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/api/servers', serverRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/files', fileRoutes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    durum: 'Çalışıyor',
    timestamp: new Date().toISOString(),
    veritabani: process.env.DB_TYPE || 'sqlite'
  });
});

// WebSocket server for real-time logs
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('✅ WebSocket istemcisi bağlandı');

  ws.on('message', (message) => {
    console.log('📨 Alınan mesaj:', message);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket istemcisi bağlantıyı kesti');
  });
});

// WebSocket'i global olarak erişilebilir yap
global.wss = wss;

// Broadcast fonksiyonu
global.broadcastLog = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Terminal WebSocket Server (SSH için)
const terminalWss = new WebSocket.Server({ port: TERMINAL_WS_PORT });
const { Client } = require('ssh2');
const { query } = require('./config/database');
const { decrypt } = require('./services/encryption');

terminalWss.on('connection', async (ws, req) => {
  console.log('🖥️  Terminal WebSocket bağlandı');

  // URL'den serverId al (ws://localhost:8081?serverId=1)
  const params = new URLSearchParams(req.url.split('?')[1]);
  const serverId = params.get('serverId');

  if (!serverId) {
    ws.send('ERROR: Server ID gerekli\r\n');
    ws.close();
    return;
  }

  try {
    // Sunucu bilgilerini al
    const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (servers.length === 0) {
      ws.send('ERROR: Sunucu bulunamadı\r\n');
      ws.close();
      return;
    }

    const server = servers[0];
    const password = server.password ? decrypt(server.password) : null;
    const privateKey = server.private_key ? decrypt(server.private_key) : null;

    // SSH bağlantısı oluştur
    const conn = new Client();

    conn.on('ready', () => {
      console.log(`✅ SSH connection established to ${server.host}`);
      ws.send(`✅ ${server.name} sunucusuna bağlanıldı\r\n\r\n`);

      // Shell aç
      conn.shell({ term: 'xterm-256color', rows: 24, cols: 80 }, (err, stream) => {
        if (err) {
          console.error(`❌ Shell error: ${err.message}`);
          ws.send(`ERROR: ${err.message}\r\n`);
          ws.close();
          return;
        }

        console.log('✅ Shell opened successfully');

        // SSH çıktısını WebSocket'e gönder
        stream.on('data', (data) => {
          ws.send(data.toString('utf-8'));
        });

        stream.stderr.on('data', (data) => {
          ws.send(data.toString('utf-8'));
        });

        // WebSocket'ten gelen veriyi SSH'a gönder
        ws.on('message', (msg) => {
          stream.write(msg);
        });

        // WebSocket kapanınca SSH'ı kapat
        ws.on('close', () => {
          stream.end();
          conn.end();
          console.log('🖥️  Terminal bağlantısı kapatıldı');
        });

        // SSH kapanınca WebSocket'i kapat
        stream.on('close', () => {
          ws.close();
          conn.end();
        });
      });
    });

    conn.on('error', (err) => {
      console.error(`❌ SSH connection error: ${err.message}`);
      ws.send(`\r\nERROR: ${err.message}\r\n`);
      ws.close();
    });

    // Bağlan
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

  } catch (err) {
    ws.send(`ERROR: ${err.message}\r\n`);
    ws.close();
  }
});

// Veritabanı başlatma
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket (Logs): ws://localhost:${WS_PORT}`);
    console.log(`🖥️  WebSocket (Terminal): ws://localhost:${TERMINAL_WS_PORT}`);
    console.log(`📊 Veritabanı: ${process.env.DB_TYPE || 'sqlite'}`);

    // Scheduler'ı başlat
    startScheduler();

    // Health monitoring'i başlat (5 dakikada bir)
    startHealthMonitoring(5);

    console.log('✅ Tüm servisler başlatıldı');
  });
}).catch((err) => {
  console.error('❌ Veritabanı başlatma hatası:', err);
  process.exit(1);
});