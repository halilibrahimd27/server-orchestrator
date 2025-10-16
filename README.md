# 🚀 Sunucu Orkestratörü (Server Orchestrator)

Web tabanlı sunucu yönetim ve otomasyon aracı. 50+ sunucunuzda aynı anda komut çalıştırın!

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Çoklu Sunucu Yönetimi**: 50+ sunucuyu tek panelden yönetin
- **Sunucu Grupları**: Sunucuları kategorilere ayırın (Production, Staging, Development vb.)
- **Görev Kütüphanesi**: Sık kullanılan komutları görev olarak kaydedin ve tekrar kullanın
- **Paralel Çalıştırma**: Tüm sunucularda aynı anda işlem yapın
- **Canlı Log Takibi**: WebSocket ile gerçek zamanlı log izleme
- **Güvenli Bağlantı**: SSH üzerinden şifreli bağlantı
- **Şifreleme**: Sunucu şifreleri AES-256 ile şifrelenir
- **Sudo Desteği**: Sudo yetkisi gerektiren komutlar için otomatik şifre gönderimi

### 🆕 Yeni Özellikler (v2.0)
- **⏰ Görev Zamanlayıcı**: Cron-like periyodik görev çalıştırma
- **💓 Health Monitoring**: Sunucu sağlık durumu izleme (CPU, RAM, Disk)
- **📊 Metrik Toplama**: Otomatik sunucu metrik toplama ve raporlama
- **🔔 Uyarı Sistemi**: Kritik durumlarda otomatik uyarılar

## 📦 Kurulum

### Docker ile Kurulumu

```bash
# Windows için(İlk Önce Docker Desktop'ınızı açın.)
.\start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

<img width="1710" height="1107" alt="image" src="https://github.com/user-attachments/assets/b4feece1-10f3-444f-b61a-2e4ef397730f" />



### Manuel Kurulum Gereksinimler

- Node.js 18+
- npm veya yarn

### 1. Backend Kurulumu

```bash
cd backend
npm install

# .env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle (önemli!)
nano .env

# Migration'ları çalıştır (Yeni tablolar için)
npm run migrate

# Backend'i başlat
npm run dev
```

### 2. Frontend Kurulumu

```bash
cd frontend
npm install

# Frontend'i başlat
npm run dev
```

## 🔧 Konfigürasyon

### Backend (.env)

```env
PORT=3000
WS_PORT=8080
DB_TYPE=sqlite
DB_PATH=/data/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-32-character-encryption-key-here
HEALTH_CHECK_INTERVAL=5  # Dakika cinsinden
SCHEDULER_ENABLED=true
```

**ÖNEMLİ:**
- `ENCRYPTION_KEY` tam olarak 32 karakter olmalı!
- `JWT_SECRET` minimum 32 karakter önerilir

## 🎯 Kullanım

1. **Sunucu Ekle**: Sol panelden "+" butonuna tıklayın
   - Sunucu adı, host, port, kullanıcı adı ve şifre girin
   - SSH key de kullanabilirsiniz

2. **Görev Oluştur**: Sağ panelden görev ekleyin
   - Görev adı ve komut girin
   - Örnek: `docker pull redis:8.2.2-alpine`

3. **Çalıştır**: 
   - Sunucuları seçin
   - Görev seçin
   - "Görevi Çalıştır" butonuna tıklayın

## 📚 API Endpoints

### Servers

```
GET    /api/servers          # Tüm sunucuları listele
POST   /api/servers          # Yeni sunucu ekle
PUT    /api/servers/:id      # Sunucu güncelle
DELETE /api/servers/:id      # Sunucu sil
POST   /api/servers/:id/test # Bağlantı testi
```

### Tasks

```
GET    /api/tasks            # Tüm görevleri listele
POST   /api/tasks            # Yeni görev ekle
PUT    /api/tasks/:id        # Görev güncelle
DELETE /api/tasks/:id        # Görev sil
POST   /api/tasks/execute    # Görevi çalıştır
GET    /api/tasks/logs/all   # Execution logları
```

### Server Groups (Yeni!)

```
GET    /api/groups                      # Tüm grupları listele
POST   /api/groups                      # Yeni grup oluştur
PUT    /api/groups/:id                  # Grup güncelle
DELETE /api/groups/:id                  # Grup sil
POST   /api/groups/members              # Gruba sunucu ekle
DELETE /api/groups/:groupId/members/:serverId  # Gruptan sunucu çıkar
GET    /api/groups/:id/servers          # Grubun sunucularını listele
GET    /api/groups/server/:serverId     # Sunucunun gruplarını listele
```

### Scheduled Tasks (Yeni!)

```
GET    /api/schedules           # Tüm zamanlanmış görevleri listele
POST   /api/schedules           # Yeni zamanlanmış görev oluştur
PUT    /api/schedules/:id       # Zamanlanmış görevi güncelle
DELETE /api/schedules/:id       # Zamanlanmış görevi sil
PATCH  /api/schedules/:id/toggle # Aktif/Pasif durumu değiştir
```

### Health Monitoring (Yeni!)

```
GET    /api/health/summary                # Genel sağlık özeti
GET    /api/health/metrics                # Tüm sunucu metrikleri
GET    /api/health/metrics/:serverId      # Belirli sunucu metrikleri
GET    /api/health/metrics/:serverId/history # Metrik geçmişi
POST   /api/health/collect/:serverId?     # Manuel metrik toplama
```

### Görev Çalıştırma

```json
POST /api/tasks/execute
{
  "taskId": 1,
  "serverIds": [1, 2, 3],
  "parallel": true
}
```

## 🔒 Güvenlik

- Tüm şifreler AES-256 ile şifrelenir
- SSH bağlantıları TLS ile korunur
- WebSocket bağlantısı için authentication eklenebilir

## 🛠️ Geliştirme

### Yeni Özellik Eklemek

1. Backend'de controller ve route ekleyin
2. Frontend'de API service'i güncelleyin
3. UI component'ini oluşturun

### Database Schema

```sql
-- Servers
CREATE TABLE servers (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  host TEXT,
  port INTEGER,
  username TEXT,
  password TEXT,  -- encrypted
  private_key TEXT,  -- encrypted
  status TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  command TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Execution Logs
CREATE TABLE execution_logs (
  id INTEGER PRIMARY KEY,
  task_id INTEGER,
  server_id INTEGER,
  status TEXT,
  output TEXT,
  error TEXT,
  started_at DATETIME,
  completed_at DATETIME
);
```

## 🚀 Örnek Kullanım Senaryoları

### Redis Güncelleme

```bash
# Görev: Redis 7 → 8.2.2
docker pull redis:8.2.2-alpine && \
docker stop redis-container && \
docker rm redis-container && \
docker run -d --name redis-container -p 6379:6379 redis:8.2.2-alpine
```

### Node.js Uygulaması Deploy

```bash
# Görev: Deploy latest
cd /opt/myapp && \
git pull origin main && \
npm install && \
pm2 restart myapp
```

### Sistem Güncelleme

```bash
# Görev: System update
apt update && apt upgrade -y && apt autoremove -y
```

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir! Büyük değişiklikler için önce issue açın.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Commit edin (`git commit -m 'Harika özellik eklendi'`)
4. Push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın
