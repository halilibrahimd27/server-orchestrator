const { query } = require('../config/database');
const { collectServerMetrics, collectAllMetrics } = require('../services/healthMonitor');

// Belirli bir sunucunun en son metriklerini getir
exports.getServerMetrics = async (req, res) => {
  const { serverId } = req.params;

  try {
    const metrics = await query(
      `SELECT * FROM server_metrics
       WHERE server_id = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [serverId]
    );

    if (metrics && metrics.length > 0) {
      res.json({ metrics: metrics[0] });
    } else {
      res.status(404).json({ error: 'Metrik bulunamadı' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Metrikler getirilirken hata: ' + err.message });
  }
};

// Sunucunun metrik geçmişini getir
exports.getServerMetricsHistory = async (req, res) => {
  const { serverId } = req.params;
  const { limit = 100 } = req.query;

  try {
    const metrics = await query(
      `SELECT * FROM server_metrics
       WHERE server_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [serverId, parseInt(limit)]
    );

    res.json({ metrics });
  } catch (err) {
    res.status(500).json({ error: 'Metrik geçmişi getirilirken hata: ' + err.message });
  }
};

// Tüm sunucuların en son metriklerini getir
exports.getAllServerMetrics = async (req, res) => {
  try {
    const metrics = await query(`
      SELECT sm.*, s.name as server_name, s.host
      FROM server_metrics sm
      INNER JOIN servers s ON sm.server_id = s.id
      WHERE sm.id IN (
        SELECT MAX(id)
        FROM server_metrics
        GROUP BY server_id
      )
      ORDER BY s.name
    `);

    res.json({ metrics });
  } catch (err) {
    res.status(500).json({ error: 'Metrikler getirilirken hata: ' + err.message });
  }
};

// Sunucu metriklerini manuel olarak topla
exports.collectMetrics = async (req, res) => {
  const { serverId } = req.params;

  try {
    if (serverId) {
      // Tek sunucu
      const servers = await query('SELECT * FROM servers WHERE id = ?', [serverId]);
      if (!servers || servers.length === 0) {
        return res.status(404).json({ error: 'Sunucu bulunamadı' });
      }

      const metrics = await collectServerMetrics(servers[0]);
      res.json({ message: 'Metrikler toplandı', metrics });
    } else {
      // Tüm sunucular
      const metrics = await collectAllMetrics();
      res.json({ message: 'Tüm sunucuların metrikleri toplandı', count: metrics.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Metrik toplama hatası: ' + err.message });
  }
};

// Sağlık durumu özeti
exports.getHealthSummary = async (req, res) => {
  try {
    // Son metrikleri al
    const allMetrics = await query(`
      SELECT sm.*, s.name as server_name
      FROM server_metrics sm
      INNER JOIN servers s ON sm.server_id = s.id
      WHERE sm.id IN (
        SELECT MAX(id)
        FROM server_metrics
        GROUP BY server_id
      )
    `);

    // Özet istatistikler
    const summary = {
      total_servers: allMetrics.length,
      online_servers: allMetrics.filter(m => m.online).length,
      offline_servers: allMetrics.filter(m => !m.online).length,
      critical_servers: [],
      warning_servers: [],
      healthy_servers: []
    };

    // Sunucuları sağlık durumuna göre kategorize et
    allMetrics.forEach(m => {
      if (!m.online) {
        summary.critical_servers.push({
          name: m.server_name,
          reason: 'Offline'
        });
      } else {
        // Kritik: CPU > 90%, RAM > 90%, Disk > 90%
        if (m.cpu_usage_percent > 90 || m.mem_usage_percent > 90 || m.disk_usage_percent > 90) {
          summary.critical_servers.push({
            name: m.server_name,
            cpu: m.cpu_usage_percent,
            mem: m.mem_usage_percent,
            disk: m.disk_usage_percent
          });
        }
        // Uyarı: CPU > 70%, RAM > 70%, Disk > 80%
        else if (m.cpu_usage_percent > 70 || m.mem_usage_percent > 70 || m.disk_usage_percent > 80) {
          summary.warning_servers.push({
            name: m.server_name,
            cpu: m.cpu_usage_percent,
            mem: m.mem_usage_percent,
            disk: m.disk_usage_percent
          });
        }
        // Sağlıklı
        else {
          summary.healthy_servers.push(m.server_name);
        }
      }
    });

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Sağlık özeti oluşturulurken hata: ' + err.message });
  }
};
