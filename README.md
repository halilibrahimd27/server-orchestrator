# 🚀 Sunucu Orkestratörü (Server Orchestrator)

Modern, kullanıcı dostu web tabanlı sunucu yönetim ve otomasyon aracı. Onlarca sunucunuzda aynı anda komut çalıştırın, görevleri otomatikleştirin!

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
- MariaDB/MySQL (opsiyonel, SQLite varsayılan)

### 🐳 Docker ile Hızlı Başlangıç (Önerilen)

```bash
# Projeyi klonlayın
git clone <repo-url>
cd server-orchestrator

# .env dosyasını yapılandırın
cp .env.example .env
nano .env

# Docker Compose ile başlatın
docker-compose up -d

# Tarayıcıdan erişin
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### 📦 Manuel Kurulum

#### 1. Backend Kurulumu

```bash
cd backend
npm install

# .env dosyası oluştur
cp .env.example .env
nano .env

# Veritabanını seç ve yapılandır (SQLite veya MySQL)
# Şifreleme anahtarlarını değiştir!

# Backend'i başlat
npm run dev
```

#### 2. Frontend Kurulumu

```bash
cd frontend
npm install

# Frontend'i başlat
npm run dev
```

## 🔧 Yapılandırma

### Backend (.env)

```env
# Sunucu Ayarları
PORT=3000
WS_PORT=8080

# Veritabanı Türü: 'sqlite' veya 'mysql'
DB_TYPE=sqlite

# SQLite Ayarları (DB_TYPE=sqlite ise)
DB_PATH=/data/database.sqlite

# MySQL/MariaDB Ayarları (DB_TYPE=mysql ise)
DB_HOST=localhost
DB_PORT=3306
DB_USER=orchestrator
DB_PASSWORD=güçlü_şifre_buraya
DB_NAME=server_orchestrator

# Güvenlik - ÜRETİMDE MUTLAKA DEĞİŞTİRİN!
JWT_SECRET=uzun-rastgele-jwt-anahtarı-en-az-32-karakter
ENCRYPTION_KEY=tam-olarak-32-karakterlik-anahtar!

# Ortam
NODE_ENV=production
```

**⚠️ ÖNEMLİ:**
- `ENCRYPTION_KEY` **tam olarak 32 karakter** olmalıdır (AES-256 için)
- Üretim ortamında mutlaka güçlü, rastgele anahtarlar kullanın
- Şifreleme anahtarını kaybederseniz, şifreli verilere erişemezsiniz!

## 🎯 Kullanım

### 1. Sunucu Ekle

1. Sol panelden **"+"** butonuna tıklayın
2. Sunucu bilgilerini girin:
   - Sunucu adı (örn: "Prodüksiyon DB")
   - Host/IP adresi
   - SSH portu (varsayılan: 22)
   - Kullanıcı adı
   - Şifre veya SSH anahtarı
3. **"Bağlantı Testi"** ile bağlantıyı kontrol edin
4. **"Sunucu Ekle"** ile kaydedin

### 2. Görev Oluştur

1. Orta panelden görev ekleyin
2. Görev adı ve açıklama girin
3. Çalıştırılacak komutu yazın
   - Örnek: `docker pull redis:8.2.2-alpine && docker restart redis`
4. **Hızlı Şablonlar** ile hazır görevleri kullanabilirsiniz

### 3. Görevi Çalıştır

1. Sol panelden sunucuları seçin (tek veya çoklu)
2. Orta panelden bir görev seçin
3. **"Görevi Çalıştır"** butonuna tıklayın
4. Sağ panelden canlı logları izleyin

## 📚 API Endpoints

### Sunucular (Servers)

```
GET    /api/servers          # Tüm sunucuları listele
POST   /api/servers          # Yeni sunucu ekle
PUT    /api/servers/:id      # Sunucu güncelle
DELETE /api/servers/:id      # Sunucu sil
POST   /api/servers/:id/test # Bağlantı testi
```

### Görevler (Tasks)

```
GET    /api/tasks            # Tüm görevleri listele
POST   /api/tasks            # Yeni görev ekle
PUT    /api/tasks/:id        # Görev güncelle
DELETE /api/tasks/:id        # Görev sil
POST   /api/tasks/execute    # Görevi çalıştır
GET    /api/tasks/logs/all   # Execution logları
```

### Yedekleme & İstatistikler

```
GET    /api/backup/export        # Yapılandırmayı dışa aktar
POST   /api/backup/import        # Yapılandırmayı içe aktar
GET    /api/backup/stats         # İstatistikleri getir
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

- ✅ Tüm şifreler AES-256 ile şifrelenir
- ✅ SSH bağlantıları güvenli protokol ile korunur
- ✅ UTF-8 charset ile Türkçe karakter desteği
- ✅ MariaDB ile kalıcı ve güvenli veri saklama
- ⚠️ Üretimde mutlaka:
  - Güçlü JWT_SECRET kullanın
  - ENCRYPTION_KEY'i değiştirin
  - Güvenlik duvarı kurallarını ayarlayın
  - HTTPS/SSL kullanın

## 🚀 Örnek Kullanım Senaryoları

### 1. Redis Güncelleme (7 → 8.2.2)

```bash
docker pull redis:8.2.2-alpine && \
docker stop redis-container && \
docker rm redis-container && \
docker run -d --name redis-container -p 6379:6379 redis:8.2.2-alpine
```

### 2. Node.js Uygulaması Deploy

```bash
cd /opt/myapp && \
git pull origin main && \
npm install && \
pm2 restart myapp
```

### 3. Sistem Güncellemesi (Ubuntu)

```bash
apt update && apt upgrade -y && apt autoremove -y
```

### 4. Docker Compose Güncelleme

```bash
cd /opt/myapp && \
docker-compose pull && \
docker-compose up -d --force-recreate
```

## 🗄️ Veritabanı

### SQLite (Varsayılan)
- Kolay kurulum, yapılandırma gerektirmez
- Küçük-orta ölçekli projeler için ideal
- Tek dosya olarak saklanır

### MariaDB/MySQL (Önerilen)
- Daha yüksek performans
- Daha iyi ölçeklenebilirlik
- Üretim ortamları için ideal
- UTF-8 full support

### Veritabanı Şeması

```sql
-- Sunucular
CREATE TABLE servers (
  id INT/INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT DEFAULT 22,
  username VARCHAR(255) NOT NULL,
  password TEXT,           -- AES-256 şifreli
  private_key TEXT,        -- AES-256 şifreli
  status VARCHAR(50) DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Görevler
CREATE TABLE tasks (
  id INT/INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  command TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Yürütme Logları
CREATE TABLE execution_logs (
  id INT/INTEGER PRIMARY KEY AUTO_INCREMENT,
  task_id INT,
  server_id INT,
  status VARCHAR(50),
  output TEXT,
  error TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🛠️ Geliştirme

### Yeni Özellik Eklemek

1. Backend'de controller ve route ekleyin
2. Frontend'de API service'i güncelleyin
3. UI component'ini oluşturun

### Projeyi Test Etme

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 🐛 Sorun Giderme

### Türkçe Karakterler Bozuk Görünüyor

```bash
# .env dosyasında kontrol edin:
DB_TYPE=mysql
# MariaDB otomatik olarak utf8mb4 kullanır
```

### Şifreler Çalışmıyor

```bash
# ENCRYPTION_KEY'in tam 32 karakter olduğundan emin olun
echo -n "12345678901234567890123456789012" | wc -c
# Çıktı: 32
```

### Bağlantı Hatası

```bash
# Backend loglarını kontrol edin
docker-compose logs -f backend

# Port çakışması var mı kontrol edin
netstat -tulpn | grep 3000
```

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir! Büyük değişiklikler için önce issue açın.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Commit edin (`git commit -m 'Harika özellik eklendi'`)
4. Push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

