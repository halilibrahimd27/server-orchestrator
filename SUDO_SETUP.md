# Permission Denied Sorununu Çözme Rehberi

Bu belgede, sunucularda komut çalıştırırken "Permission denied" hatası almanız durumunda çözüm yöntemlerini bulabilirsiniz.

## Sorun Nedir?

SSH üzerinden komut çalıştırırken bazı işlemler sudo yetkileri gerektirir. Ancak normal SSH bağlantısında interaktif terminal olmadığı için sudo şifresi giremezsiniz ve "Permission denied" hatası alırsınız.

## Çözüm Yöntemleri

### Yöntem 1: Sudo Şifresi ile Otomatik Çalıştırma (Önerilen)

Sistemimize sudo şifresi özelliği ekledik. Artık sunucu eklerken veya düzenlerken **Sudo Şifresi** alanını doldurabilirsiniz.

#### Nasıl Kullanılır?

1. **Yeni Sunucu Eklerken:**
   - Sunucu ekleme formunda "Sudo Şifresi (Opsiyonel)" alanını doldurun
   - Normal SSH şifresi ile aynı olabilir (çoğu zaman öyledir)
   - Şifre şifreli olarak veritabanında saklanır

2. **Mevcut Sunucu için:**
   - Önce migration scriptini çalıştırın (Docker ile çalışıyorsanız otomatik eklenir)
   - Sunucu kartındaki **Düzenle** (mavi kalem) ikonuna tıklayın
   - "Sudo Şifresi (Opsiyonel)" alanını doldurun
   - **Güncelle** butonuna tıklayın
   - ⚠️ **ÖNEMLİ:** Boş bırakırsanız mevcut şifreler korunur, sadece değiştirmek istediklerinizi doldurun

3. **Otomatik Çalışma:**
   - Sistem, bir komut çalıştırdığınızda otomatik olarak sudo şifresi eklenir
   - Artık tüm komutlar sudo yetkisiyle çalışır

#### Migration Scriptini Çalıştırma

```bash
# Backend dizinine gidin
cd backend

# Migration scriptini çalıştırın
node migrations/add_sudo_password.js
```

### Yöntem 2: Sunucuda Şifresiz Sudo Yapılandırması

Daha güvenli ve önerilen yöntem, sunucuda belirli komutlar için sudo şifresi istememesidir.

#### Adımlar:

1. SSH ile sunucuya bağlanın:
```bash
ssh kullanici@172.168.30.65
```

2. Sudoers dosyasını düzenleyin:
```bash
sudo visudo
```

3. Dosyanın sonuna şu satırı ekleyin (kullanıcı adınızı değiştirin):

**Belirli komutlar için:**
```bash
kullanici_adi ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /bin/rm, /bin/chmod, /bin/echo
```

**TÜM komutlar için (daha az güvenli):**
```bash
kullanici_adi ALL=(ALL) NOPASSWD: ALL
```

4. Dosyayı kaydedin (Ctrl+X, sonra Y, sonra Enter)

5. Test edin:
```bash
sudo ls
# Şifre sormadan çalışmalı
```

### Yöntem 3: Root Kullanıcısı ile Bağlanma

**NOT:** Bu yöntem güvenlik riski taşır, sadece gerektiğinde kullanın.

1. Sunucuda root SSH erişimini aktifleştirin:
```bash
sudo nano /etc/ssh/sshd_config
```

2. Şu satırı bulun ve değiştirin:
```bash
PermitRootLogin yes
```

3. SSH servisini yeniden başlatın:
```bash
sudo systemctl restart sshd
```

4. Server Orchestrator'da sunucuyu güncelleyin:
   - Kullanıcı adını `root` yapın
   - Root şifresini girin

## Hangi Yöntemi Seçmeliyim?

| Yöntem | Güvenlik | Kullanım Kolaylığı | Öneri |
|--------|----------|-------------------|-------|
| Sudo Şifresi (Yöntem 1) | Orta | Çok Kolay | ✅ Önerilen |
| Şifresiz Sudo (Yöntem 2) | Yüksek | Orta | ✅ En Güvenli |
| Root Erişimi (Yöntem 3) | Düşük | Kolay | ⚠️ Önerilmez |

## Güvenlik Notları

- Sudo şifresi veritabanında AES-256 ile şifrelenir
- Şifreler sadece komut çalıştırırken geçici olarak çözülür
- Root erişimi yerine sudo kullanımı tercih edilmelidir
- Üretim ortamlarında Yöntem 2 (şifresiz sudo) en güvenli yöntemdir

## Sorun Giderme

### "Permission denied" hala alıyorum

1. Sudo şifresini doğru girdiğinizden emin olun
2. Kullanıcının sudo yetkisi olduğunu kontrol edin:
```bash
groups kullanici_adi
# Output'ta "sudo" veya "wheel" görmeli
```

3. Kullanıcıyı sudo grubuna ekleyin:
```bash
sudo usermod -aG sudo kullanici_adi
```

### Migration scripti hata veriyor

Eğer kolon zaten varsa, hata mesajı görmezden gelinir. Ancak başka bir hata alıyorsanız:

1. Manuel olarak ekleyin:
```bash
# SQLite için
sqlite3 data/database.sqlite
ALTER TABLE servers ADD COLUMN sudo_password TEXT;
.quit

# MySQL için
mysql -u root -p orchestrator
ALTER TABLE servers ADD COLUMN sudo_password TEXT;
exit
```

## Yeni Özellikler

### Sunucu ve Görev Düzenleme

Artık hem sunucuları hem de görevleri düzenleyebilirsiniz:

- **Sunucu Düzenle:** Her sunucu kartında mavi kalem ikonu
- **Görev Düzenle:** Her görev kartında mavi "Düzenle" butonu
- Düzenleme sırasında tüm alanlar mevcut değerlerle dolu gelir
- İstediğiniz alanı değiştirip güncelleyebilirsiniz

## Örnek Kullanım

### Sudo Gerektiren Komut
```bash
# Eski hali (Permission denied)
rm -rf /opt/data/temp

# Yeni hali (Otomatik sudo)
# Sistem otomatik olarak şunu çalıştırır:
echo 'SUDO_PASSWORD' | sudo -S rm -rf /opt/data/temp
```

## İletişim

Sorunlarınız devam ediyorsa:
- GitHub Issues: https://github.com/halilibrahimd27/server-orchestrator/issues
- README.md dosyasına bakın
