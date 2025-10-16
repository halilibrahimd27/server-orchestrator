const { query } = require('../config/database');
const { executeOnMultipleServers } = require('./sshExecutor');

// Aktif zamanlayıcılar
const activeSchedules = new Map();

// Bir sonraki çalışma zamanını hesapla
function calculateNextRun(scheduleType, scheduleValue, lastRun = null) {
  const now = new Date();

  if (scheduleType === 'interval') {
    // Interval (dakika cinsinden)
    const minutes = parseInt(scheduleValue);
    const base = lastRun ? new Date(lastRun) : now;
    return new Date(base.getTime() + minutes * 60 * 1000);
  } else if (scheduleType === 'cron') {
    // Basit cron parser (geliştirilecek)
    // Format: "minute hour day month dayofweek"
    // Örnek: "0 2 * * *" -> Her gün saat 02:00
    const parts = scheduleValue.split(' ');
    if (parts.length !== 5) {
      throw new Error('Geçersiz cron formatı');
    }

    const [minute, hour, day, month, dayOfWeek] = parts;
    const next = new Date(now);

    // Basit implementasyon - sadece saat ve dakikayı destekle
    if (hour !== '*') next.setHours(parseInt(hour));
    if (minute !== '*') next.setMinutes(parseInt(minute));
    next.setSeconds(0);

    // Eğer geçmişse bir gün ekle
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  return null;
}

// Zamanlanmış görevi çalıştır
async function executeScheduledTask(schedule) {
  try {
    console.log(`⏰ Zamanlanmış görev çalıştırılıyor: ${schedule.name}`);

    // Task ve server bilgilerini getir
    const tasks = await query('SELECT * FROM tasks WHERE id = ?', [schedule.task_id]);
    if (!tasks || tasks.length === 0) {
      console.error('Görev bulunamadı:', schedule.task_id);
      return;
    }

    const task = tasks[0];
    const serverIds = JSON.parse(schedule.server_ids);

    // Sunucuları getir
    const servers = await query(
      `SELECT * FROM servers WHERE id IN (${serverIds.join(',')})`
    );

    if (!servers || servers.length === 0) {
      console.error('Sunucular bulunamadı');
      return;
    }

    // WebSocket broadcast
    if (global.broadcastLog) {
      global.broadcastLog({
        type: 'execution_start',
        taskName: `[ZAMANLI] ${schedule.name}`,
        serverCount: servers.length,
        scheduled: true
      });
    }

    // Görevi çalıştır
    const results = await executeOnMultipleServers(servers, task.command, true);

    // Sonuçları kaydet
    for (const result of results) {
      await query(
        `INSERT INTO execution_logs
        (task_id, server_id, status, output, error, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          schedule.task_id,
          result.serverId,
          result.status,
          result.output || '',
          result.error || ''
        ]
      );
    }

    // Schedule bilgilerini güncelle
    const now = new Date().toISOString();
    const nextRun = calculateNextRun(
      schedule.schedule_type,
      schedule.schedule_value,
      now
    );

    await query(
      `UPDATE scheduled_tasks
       SET last_run = ?, next_run = ?, run_count = run_count + 1
       WHERE id = ?`,
      [now, nextRun ? nextRun.toISOString() : null, schedule.id]
    );

    // WebSocket broadcast
    if (global.broadcastLog) {
      global.broadcastLog({
        type: 'execution_complete',
        taskName: schedule.name,
        results: results,
        scheduled: true
      });
    }

    console.log(`✅ Zamanlanmış görev tamamlandı: ${schedule.name}`);
  } catch (error) {
    console.error('❌ Zamanlanmış görev hatası:', error);

    if (global.broadcastLog) {
      global.broadcastLog({
        type: 'error',
        server: 'Scheduler',
        data: `Zamanlanmış görev hatası: ${error.message}`
      });
    }
  }
}

// Scheduler'ı başlat
async function startScheduler() {
  console.log('🕐 Görev zamanlayıcı başlatılıyor...');

  // Her dakika kontrol et
  setInterval(async () => {
    try {
      const now = new Date().toISOString();

      // Çalıştırılması gereken görevleri bul
      const schedules = await query(
        `SELECT * FROM scheduled_tasks
         WHERE enabled = 1 AND next_run <= ?
         ORDER BY next_run`,
        [now]
      );

      for (const schedule of schedules) {
        executeScheduledTask(schedule);
      }
    } catch (error) {
      console.error('❌ Scheduler kontrol hatası:', error);
    }
  }, 60000); // Her 60 saniyede bir kontrol

  console.log('✅ Görev zamanlayıcı başlatıldı');
}

// Scheduler'ı durdur
function stopScheduler() {
  activeSchedules.forEach((timer) => clearInterval(timer));
  activeSchedules.clear();
  console.log('🛑 Görev zamanlayıcı durduruldu');
}

module.exports = {
  startScheduler,
  stopScheduler,
  calculateNextRun,
  executeScheduledTask
};
