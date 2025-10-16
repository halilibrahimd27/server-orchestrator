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
const { startScheduler } = require('./services/scheduler');
const { startHealthMonitoring } = require('./services/healthMonitor');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

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

// Veritabanı başlatma
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket çalışıyor: ws://localhost:${WS_PORT}`);
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