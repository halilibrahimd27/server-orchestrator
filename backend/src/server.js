require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { initDatabase } = require('./config/database');
const serverRoutes = require('./routes/serverRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/servers', serverRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket server for real-time logs
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
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

// Database initialization
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket running on ws://localhost:${WS_PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});