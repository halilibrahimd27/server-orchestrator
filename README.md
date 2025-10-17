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
- **Görev Zamanlayıcı**: Cron-like periyodik görev çalıştırma
- **Health Monitoring**: Sunucu sağlık durumu izleme (CPU, RAM, Disk)
- **Metrik Toplama**: Otomatik sunucu metrik toplama ve raporlama
- **Uyarı Sistemi**: Kritik durumlarda otomatik uyarılar

## 📦 Kurulum

```bash
# Windows için(İlk Önce Docker Desktop'ınızı açın.)
.\start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

## Aynı anda birden fazla sunucuda görev çalıştırın 

<img width="1710" height="983" alt="image" src="https://github.com/user-attachments/assets/1e0ec87e-ae48-48b3-85a9-2bc83e7e77ea" />

## Sunucuları gruplara göre filtreleyin size özel gruplar oluşturun

<img width="1709" height="988" alt="image" src="https://github.com/user-attachments/assets/3eb9b039-e0c4-44cd-9ca1-ffee6957f84e" />

## Sunucunuza özel cronjob'lar oluşturun

<img width="1710" height="988" alt="image" src="https://github.com/user-attachments/assets/580e512d-8f5f-4071-a750-8c1a3457757b" />

## Sunucunuzu monitoring edin 

<img width="1710" height="990" alt="image" src="https://github.com/user-attachments/assets/b3d768d7-e217-482f-9d01-24c05da3b0cd" />

## Gerekli kısımlarda ssh ile terminale bağlanın.

<img width="1705" height="976" alt="image" src="https://github.com/user-attachments/assets/5b487a53-81a3-4d79-bfb0-80c70d7c75fb" />

<img width="1709" height="996" alt="image" src="https://github.com/user-attachments/assets/f04a7e5e-8b1e-4adb-9deb-f51ed4c1a4c7" />

## Çalıştırdığınız komutlarda detaylı log alın

<img width="1710" height="990" alt="image" src="https://github.com/user-attachments/assets/88f231d1-72d9-4e03-942a-af621f207a7b" />

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir! Büyük değişiklikler için önce issue açın.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Commit edin (`git commit -m 'Harika özellik eklendi'`)
4. Push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın
