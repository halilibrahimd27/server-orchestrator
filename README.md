# 🚀 Sunucu Orkestratörü (Server Orchestrator)

Web tabanlı sunucu yönetim ve otomasyon aracı. 50+ sunucunuzda aynı anda komut çalıştırın!

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Çoklu Sunucu Yönetimi**: 50+ sunucuyu tek panelden yönetin
- **Görev Kütüphanesi**: Sık kullanılan komutları görev olarak kaydedin ve tekrar kullanın
- **Paralel Çalıştırma**: Tüm sunucularda aynı anda işlem yapın
- **Canlı Log Takibi**: WebSocket ile gerçek zamanlı log izleme
- **Güvenli Bağlantı**: SSH üzerinden şifreli bağlantı
- **Şifreleme**: Sunucu şifreleri AES-256 ile şifrelenir

### 🆕 Yeni Özellikler (v2.0)
- **MariaDB/MySQL Desteği**: Kalıcı ve güvenilir veritabanı
- **Tam Türkçe Arayüz**: Türkçe karakterler tam destek (ğ,ü,ş,ı,ö,ç)
- **Modern UI**: Yenilenmiş, daha kullanıcı dostu arayüz
- **Yedekleme/Geri Yükleme**: Yapılandırmalarınızı dışa/içe aktarın
- **İstatistikler**: Detaylı kullanım istatistikleri
- **UTF-8 Desteği**: Tüm Türkçe karakterler doğru çalışır

## 📦 Kurulum

### Gereksinimler

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
DB_PATH=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-32-character-encryption-key-here
WS_PORT=8080
```

**ÖNEMLİ:** `ENCRYPTION_KEY` 32 karakter olmalı!

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

## 📝 TODO

- [ ] JWT Authentication ekle
- [ ] Sunucu grupları (prod, dev, staging)
- [ ] Scheduled tasks (cron)
- [ ] Rollback özelliği
- [ ] Docker support
- [ ] Ansible playbook import
- [ ] Email notifications

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir! Büyük değişiklikler için önce issue açın.

## 📄 Lisans

MIT

---

**Not**: Production'da kullanmadan önce güvenlik önlemlerini (JWT, rate limiting, SSL) eklemeyi unutmayın!