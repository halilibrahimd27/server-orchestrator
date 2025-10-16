# Hızlı Başlangıç Rehberi

## 5 Dakikada Başlat!

### 1. Docker ile Çalıştır (Önerilen)

```bash
# 1. .env dosyasını oluştur
cp .env.example .env

# 2. ENCRYPTION_KEY'i 32 karakter yap (ÖNEMLİ!)
# .env dosyasını düzenle ve şu değerleri değiştir:
# JWT_SECRET=kendi-super-gizli-jwt-anahtarin-buraya
# ENCRYPTION_KEY=12345678901234567890123456789012  # TAM 32 karakter!

# 3. Başlat!
# Linux/Mac:
./start.sh

# Windows:
start.bat
```

### 2. Manuel Kurulum (Development)

#### Backend

```bash
cd backend
npm install

# .env dosyası oluştur
cp .env.example .env
# .env'i düzenle (yukarıdaki gibi)

npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## İlk Kullanım

### 1. Sunucu Ekle

1. Sol panelden "+" butonuna tıkla
2. Bilgileri gir:
   - **Sunucu adı**: `DB Server 1`
   - **Host/IP**: `192.168.1.100`
   - **Port**: `22` (default)
   - **Username**: `root`
   - **Password**: `your_password`
3. "Ekle" butonuna tıkla

### 2. Görev Oluştur

1. Sağ üst panelden "+" butonuna tıkla
2. Örnek görev:
   - **Görev adı**: `Redis Update 7 → 8.2.2`
   - **Komut**:
   ```bash
   docker pull redis:8.2.2-alpine && docker stop redis-container && docker rm redis-container && docker run -d --name redis-container -p 6379:6379 redis:8.2.2-alpine
   ```
3. "Görev Ekle" butonuna tıkla

### 3. Çalıştır!

1. Sol panelden sunucuları seç (veya "Tümünü Seç")
2. Sağ panelden görevi seç
3. "Görevi Çalıştır" butonuna tıkla
4. Alt panelde real-time logları izle!

## Örnek Görevler

### Docker Container Güncelleme

```bash
# Redis
docker pull redis:8.2.2-alpine && \
docker stop redis-container && \
docker rm redis-container && \
docker run -d --name redis-container -p 6379:6379 redis:8.2.2-alpine

# PostgreSQL
docker pull postgres:16-alpine && \
docker stop postgres-container && \
docker rm postgres-container && \
docker run -d --name postgres-container -e POSTGRES_PASSWORD=mypass -p 5432:5432 postgres:16-alpine
```

### Sistem Güncelleme

```bash
# Ubuntu/Debian
apt update && apt upgrade -y && apt autoremove -y

# CentOS/RHEL
yum update -y && yum autoremove -y
```

### Docker Compose Güncelleme

```bash
cd /opt/myapp && \
docker-compose pull && \
docker-compose up -d --force-recreate
```

### Node.js Uygulama Deploy

```bash
cd /opt/myapp && \
git pull origin main && \
npm install --production && \
pm2 restart myapp
```

### Disk Temizleme

```bash
docker system prune -af && \
apt autoremove -y && \
apt clean
```

### Log Rotasyonu

```bash
find /var/log -name "*.log" -type f -mtime +30 -delete && \
docker system prune -f --volumes
```

## API Kullanımı

### Sunucu Ekle

```bash
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production DB",
    "host": "192.168.1.100",
    "port": 22,
    "username": "root",
    "password": "secure_password"
  }'
```

### Görev Çalıştır

```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 1,
    "serverIds": [1, 2, 3],
    "parallel": true
  }'
```

## Troubleshooting

### Port zaten kullanımda

```bash
# Portları değiştir
# docker-compose.yml dosyasında:
ports:
  - "3001:3000"  # Backend
  - "5174:5173"  # Frontend
  - "8081:8080"  # WebSocket
```

### ENCRYPTION_KEY hatası

```
Error: Invalid key length
```

**Çözüm**: `.env` dosyasında `ENCRYPTION_KEY` TAM 32 karakter olmalı!

```bash
# Doğru (32 karakter):
ENCRYPTION_KEY=12345678901234567890123456789012

# Yanlış (çok kısa):
ENCRYPTION_KEY=mykey123
```

### SSH bağlantı hatası

```bash
# Sunucu bağlantısını test et
curl -X POST http://localhost:3000/api/servers/1/test
```

**Yaygın sorunlar**:
- Yanlış şifre
- SSH port kapalı
- Firewall bloğu
- SSH key permission hatası (chmod 600)

### WebSocket bağlanamıyor

**Docker içindeyse**: WebSocket URL'i `ws://localhost:8080` olmalı
**Host makineden**: `frontend/src/services/api.js` dosyasını kontrol et

## Performans İpuçları

### Paralel vs Sıralı Çalıştırma

- **Paralel** (parallel: true): Tüm sunucularda AYNI ANDA çalışır (HIZLI)
- **Sıralı** (parallel: false): Sunucular SIRAYLA çalışır (GÜVENLİ)

### Çok Sunucu Optimizasyonu

50+ sunucu için:
1. Sunucuları gruplara ayır
2. Önce test grubunda dene
3. Başarılıysa production'a geç
4. Logları düzenli temizle

```bash
# Eski logları sil
sqlite3 data/database.sqlite "DELETE FROM execution_logs WHERE started_at < datetime('now', '-7 days')"
```

## Güvenlik Notları

1. **Production'da mutlaka değiştir**:
   - JWT_SECRET
   - ENCRYPTION_KEY

2. **SSL/TLS ekle** (nginx reverse proxy):
   ```nginx
   server {
     listen 443 ssl;
     server_name orchestrator.example.com;

     ssl_certificate /etc/ssl/cert.pem;
     ssl_certificate_key /etc/ssl/key.pem;

     location / {
       proxy_pass http://localhost:5173;
     }

     location /api {
       proxy_pass http://localhost:3000;
     }
   }
   ```

3. **Firewall kuralları**:
   ```bash
   # Sadece local erişim
   ufw deny 3000
   ufw deny 8080
   ufw allow from 192.168.1.0/24 to any port 5173
   ```

## Yardım

- **Logları görüntüle**: `docker-compose logs -f`
- **Container'ı yeniden başlat**: `docker-compose restart backend`
- **Veritabanını sıfırla**: `rm data/database.sqlite && docker-compose restart backend`

**Destek**: GitHub Issues → https://github.com/yourusername/server-orchestrator/issues
