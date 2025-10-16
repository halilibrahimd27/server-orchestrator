# Server Orchestrator - Proje Yapısı

## Dosya Ağacı

```
server-orchestrator/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # SQLite veritabanı yapılandırması
│   │   ├── controllers/
│   │   │   ├── serverController.js  # Sunucu CRUD işlemleri
│   │   │   └── taskController.js    # Görev ve execution işlemleri
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication (gelecek için)
│   │   ├── models/
│   │   │   ├── Server.js            # Sunucu schema tanımı
│   │   │   └── Task.js              # Görev schema tanımı
│   │   ├── routes/
│   │   │   ├── serverRoutes.js      # /api/servers endpoints
│   │   │   └── taskRoutes.js        # /api/tasks endpoints
│   │   ├── services/
│   │   │   ├── encryption.js        # AES-256 şifreleme
│   │   │   └── sshExecutor.js       # SSH2 bağlantı ve komut çalıştırma
│   │   └── server.js                # Ana Express sunucusu + WebSocket
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # React bileşenleri (kullanılmıyor şu an)
│   │   │   ├── ServerList.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── ExecutionLog.jsx
│   │   ├── services/
│   │   │   └── api.js               # API client + WebSocket bağlantısı
│   │   ├── App.jsx                  # Ana uygulama (tüm UI burada)
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Tailwind + custom CSS
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── data/                             # SQLite veritabanı (otomatik oluşur)
│   └── database.sqlite
│
├── .env                              # Environment variables (git ignore)
├── .env.example                      # Örnek env dosyası
├── .gitignore
├── docker-compose.yml                # Docker orkestrasyon
├── QUICKSTART.md                     # Hızlı başlangıç rehberi
├── PROJECT_STRUCTURE.md              # Bu dosya
├── README.md                         # Detaylı dökümantasyon
├── start.sh / start.bat              # Başlatma scriptleri
└── stop.sh / stop.bat                # Durdurma scriptleri
```

## Backend Mimari

### Katmanlar

1. **Routes** → HTTP endpoint tanımları
2. **Controllers** → İş mantığı ve veritabanı işlemleri
3. **Services** → SSH bağlantı, şifreleme gibi yardımcı servisler
4. **Models** → Veritabanı şema tanımları

### Veri Akışı

```
HTTP Request → Route → Controller → Service → Database/SSH
                                              ↓
                                         Response
```

### WebSocket Akışı

```
Task Execution → SSH Command → Real-time Output
                               ↓
                        Broadcast via WebSocket
                               ↓
                        Frontend Updates
```

## Frontend Mimari

### Teknolojiler

- **React 18** - UI framework
- **Vite** - Build tool ve dev server
- **Tailwind CSS** - Styling
- **Lucide React** - İkonlar
- **Native Fetch API** - HTTP istekleri
- **WebSocket API** - Real-time iletişim

### State Yönetimi

- Component-level state (useState)
- WebSocket event handlers
- Real-time log updates

### Bileşen Yapısı

```
App.jsx
├── Sunucular Paneli
│   ├── Sunucu Ekleme Formu
│   └── Sunucu Listesi (seçilebilir)
│
├── Görevler Paneli
│   ├── Görev Ekleme Formu
│   └── Görev Listesi (seçilebilir)
│
├── Çalıştırma Butonu
│
└── Log Paneli (real-time)
```

## Veritabanı Şeması

### servers

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INTEGER PK | Otomatik artan ID |
| name | TEXT UNIQUE | Sunucu adı |
| host | TEXT | IP veya hostname |
| port | INTEGER | SSH portu (default: 22) |
| username | TEXT | SSH kullanıcı adı |
| password | TEXT | Şifreli password |
| private_key | TEXT | Şifreli SSH key |
| status | TEXT | Sunucu durumu |
| created_at | DATETIME | Oluşturma zamanı |
| updated_at | DATETIME | Güncelleme zamanı |

### tasks

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INTEGER PK | Otomatik artan ID |
| name | TEXT | Görev adı |
| description | TEXT | Görev açıklaması |
| command | TEXT | Çalıştırılacak komut |
| created_at | DATETIME | Oluşturma zamanı |
| updated_at | DATETIME | Güncelleme zamanı |

### execution_logs

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INTEGER PK | Otomatik artan ID |
| task_id | INTEGER FK | Hangi görev |
| server_id | INTEGER FK | Hangi sunucu |
| status | TEXT | success/error |
| output | TEXT | Komut çıktısı |
| error | TEXT | Hata mesajı |
| started_at | DATETIME | Başlama zamanı |
| completed_at | DATETIME | Bitiş zamanı |

## API Endpoints

### Sunucular

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/servers | Tüm sunucuları listele |
| GET | /api/servers/:id | Tek sunucu detayı |
| POST | /api/servers | Yeni sunucu ekle |
| PUT | /api/servers/:id | Sunucu güncelle |
| DELETE | /api/servers/:id | Sunucu sil |
| POST | /api/servers/:id/test | Bağlantı testi |

### Görevler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/tasks | Tüm görevleri listele |
| GET | /api/tasks/:id | Tek görev detayı |
| POST | /api/tasks | Yeni görev ekle |
| PUT | /api/tasks/:id | Görev güncelle |
| DELETE | /api/tasks/:id | Görev sil |
| POST | /api/tasks/execute | Görevi çalıştır |
| GET | /api/tasks/logs/all | Execution logları |

### WebSocket Events

| Event | Direction | Açıklama |
|-------|-----------|----------|
| execution_start | Server → Client | Görev başladı |
| output | Server → Client | Komut çıktısı (stdout) |
| error | Server → Client | Hata çıktısı (stderr) |
| execution_complete | Server → Client | Görev tamamlandı |

## Güvenlik

### Şifreleme

- **Algoritma**: AES-256-CBC
- **IV**: Random 16 byte
- **Key**: 32 karakter (ENCRYPTION_KEY env)
- **Şifrelenen**: password, private_key

### Authentication (Optional)

- JWT token bazlı
- Middleware hazır ama aktif değil
- Production'da aktive edilebilir

## Docker Yapısı

### Containerlar

1. **backend**: Node.js + Express + WebSocket (Port: 3000, 8080)
2. **frontend**: Vite dev server (Port: 5173)

### Volumes

- `./data:/data` → SQLite veritabanı
- `./backend/src:/app/src:ro` → Hot reload (dev)
- `./frontend/src:/app/src:ro` → Hot reload (dev)

### Network

- `orchestrator-net` → Bridge network
- Backend ↔ Frontend iletişimi

### Healthcheck

Backend container'ı `/health` endpoint üzerinden kontrol edilir.

## Geliştirme Notları

### Özellik Ekleme

1. **Yeni endpoint eklemek**:
   - Controller'a fonksiyon ekle
   - Route'a ekle
   - Frontend'de api.js'e ekle

2. **Yeni veritabanı tablosu**:
   - models/ altına schema ekle
   - database.js'te CREATE TABLE ekle
   - Controller oluştur

3. **Yeni UI bileşeni**:
   - components/ altına oluştur
   - App.jsx'te import et

### Test Etme

```bash
# Backend test
curl http://localhost:3000/health

# Sunucu ekleme testi
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -d '{"name":"test","host":"1.2.3.4","username":"root","password":"pass"}'

# WebSocket testi
wscat -c ws://localhost:8080
```

## Gelecek Özellikler (TODO)

- [ ] Sunucu grupları (production, staging, dev)
- [ ] Scheduled tasks (cron jobs)
- [ ] Rollback özelliği
- [ ] Email/Slack notifications
- [ ] Ansible playbook import
- [ ] Görev şablonları (Redis update, Postgres update, etc.)
- [ ] Kullanıcı yönetimi ve rolleri
- [ ] Audit log
- [ ] Dashboard ve istatistikler
- [ ] Bulk import/export (CSV, JSON)

## Sorun Giderme

### Backend başlamıyor

```bash
# Logları kontrol et
docker-compose logs backend

# Veritabanı iznini kontrol et
ls -la data/

# Container'ı yeniden başlat
docker-compose restart backend
```

### Frontend bağlanamıyor

```bash
# Backend sağlıklı mı?
curl http://localhost:3000/health

# Proxy ayarlarını kontrol et
cat frontend/vite.config.js

# Browser console'u kontrol et
```

### SSH bağlantısı başarısız

- Sunucu erişilebilir mi? (`ping`, `telnet`)
- SSH servisi çalışıyor mu?
- Firewall kuralları doğru mu?
- Şifre/key doğru mu?

## Lisans ve Katkı

Bu proje MIT lisansı ile lisanslanmıştır. Katkılarınızı bekliyoruz!

**İletişim**: GitHub Issues üzerinden
