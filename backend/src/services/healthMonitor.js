const { Client } = require('ssh2');
const { decrypt } = require('./encryption');
const { query } = require('../config/database');

// Sunucu sağlık metriklerini topla
async function collectServerMetrics(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const metrics = {
      serverId: server.id,
      serverName: server.name,
      timestamp: new Date().toISOString(),
      online: false
    };

    conn.on('ready', () => {
      // CPU, RAM, Disk, Uptime, Load Average bilgilerini tek komutla topla
      const command = `
        echo "CPU_CORES:$(nproc)";
        echo "CPU_LOAD:$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')";
        echo "MEM_TOTAL:$(free -m | awk '/^Mem:/ {print $2}')";
        echo "MEM_USED:$(free -m | awk '/^Mem:/ {print $3}')";
        echo "MEM_FREE:$(free -m | awk '/^Mem:/ {print $4}')";
        echo "DISK_TOTAL:$(df -BG / | awk 'NR==2 {print $2}' | sed 's/G//')";
        echo "DISK_USED:$(df -BG / | awk 'NR==2 {print $3}' | sed 's/G//')";
        echo "DISK_FREE:$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')";
        echo "UPTIME:$(uptime -p | sed 's/up //')";
        echo "OS:$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)";
        echo "KERNEL:$(uname -r)";
      `;

      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let output = '';

        stream.on('close', () => {
          conn.end();

          // Parse output
          const lines = output.split('\n');
          lines.forEach(line => {
            const [key, value] = line.split(':');
            if (key && value) {
              switch (key) {
                case 'CPU_CORES':
                  metrics.cpu_cores = parseInt(value);
                  break;
                case 'CPU_LOAD':
                  metrics.cpu_load = parseFloat(value);
                  break;
                case 'MEM_TOTAL':
                  metrics.mem_total_mb = parseInt(value);
                  break;
                case 'MEM_USED':
                  metrics.mem_used_mb = parseInt(value);
                  break;
                case 'MEM_FREE':
                  metrics.mem_free_mb = parseInt(value);
                  break;
                case 'DISK_TOTAL':
                  metrics.disk_total_gb = parseInt(value);
                  break;
                case 'DISK_USED':
                  metrics.disk_used_gb = parseInt(value);
                  break;
                case 'DISK_FREE':
                  metrics.disk_free_gb = parseInt(value);
                  break;
                case 'UPTIME':
                  metrics.uptime = value.trim();
                  break;
                case 'OS':
                  metrics.os = value.trim();
                  break;
                case 'KERNEL':
                  metrics.kernel = value.trim();
                  break;
              }
            }
          });

          // Yüzdeleri hesapla
          if (metrics.mem_total_mb && metrics.mem_used_mb) {
            metrics.mem_usage_percent = Math.round((metrics.mem_used_mb / metrics.mem_total_mb) * 100);
          }

          if (metrics.disk_total_gb && metrics.disk_used_gb) {
            metrics.disk_usage_percent = Math.round((metrics.disk_used_gb / metrics.disk_total_gb) * 100);
          }

          if (metrics.cpu_cores && metrics.cpu_load) {
            metrics.cpu_usage_percent = Math.round((metrics.cpu_load / metrics.cpu_cores) * 100);
          }

          metrics.online = true;
          resolve(metrics);
        });

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          console.error(`Health check stderr: ${data}`);
        });
      });
    });

    conn.on('error', (err) => {
      metrics.online = false;
      metrics.error = err.message;
      resolve(metrics); // Reject yerine resolve kullan çünkü sadece offline olduğunu belirtiyoruz
    });

    // SSH bağlantı konfigürasyonu
    const password = server.password ? decrypt(server.password) : undefined;

    const config = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 10000,
      keepaliveInterval: 5000
    };

    if (password) {
      config.password = password;
    } else if (server.private_key) {
      config.privateKey = decrypt(server.private_key);
    }

    conn.connect(config);
  });
}

// Tüm sunucuların metriklerini topla
async function collectAllMetrics() {
  try {
    const servers = await query('SELECT * FROM servers');

    const metricsPromises = servers.map(server =>
      collectServerMetrics(server).catch(err => ({
        serverId: server.id,
        serverName: server.name,
        online: false,
        error: err.message
      }))
    );

    const allMetrics = await Promise.all(metricsPromises);

    // Metrikleri veritabanına kaydet
    for (const metrics of allMetrics) {
      await query(
        `INSERT INTO server_metrics
        (server_id, online, cpu_cores, cpu_load, cpu_usage_percent,
         mem_total_mb, mem_used_mb, mem_usage_percent,
         disk_total_gb, disk_used_gb, disk_usage_percent,
         uptime, os, kernel, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metrics.serverId,
          metrics.online ? 1 : 0,
          metrics.cpu_cores || null,
          metrics.cpu_load || null,
          metrics.cpu_usage_percent || null,
          metrics.mem_total_mb || null,
          metrics.mem_used_mb || null,
          metrics.mem_usage_percent || null,
          metrics.disk_total_gb || null,
          metrics.disk_used_gb || null,
          metrics.disk_usage_percent || null,
          metrics.uptime || null,
          metrics.os || null,
          metrics.kernel || null,
          metrics.error || null
        ]
      );

      // Sunucu status'unu güncelle
      await query(
        'UPDATE servers SET status = ? WHERE id = ?',
        [metrics.online ? 'online' : 'offline', metrics.serverId]
      );
    }

    return allMetrics;
  } catch (error) {
    console.error('❌ Metrik toplama hatası:', error);
    throw error;
  }
}

// Periyodik monitoring başlat (her 5 dakikada bir)
function startHealthMonitoring(intervalMinutes = 5) {
  console.log(`💓 Sağlık izleme başlatıldı (${intervalMinutes} dakikada bir)`);

  // İlk çalıştırma
  collectAllMetrics().catch(err => console.error('Health monitoring error:', err));

  // Periyodik çalıştırma
  setInterval(() => {
    collectAllMetrics().catch(err => console.error('Health monitoring error:', err));
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  collectServerMetrics,
  collectAllMetrics,
  startHealthMonitoring
};
