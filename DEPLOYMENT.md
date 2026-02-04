# GitHub & VPS Deployment Guide

## Langkah 1: Persiapan GitHub Repository

### 1.1 Buat Repository Baru di GitHub

1. Login ke GitHub (https://github.com)
2. Klik tombol "+" di pojok kanan atas → "New repository"
3. Isi informasi repository:
   - **Repository name**: `gracs-acs`
   - **Description**: `Auto Configuration Server (ACS) with TR-069/CWMP Protocol`
   - **Visibility**: Public atau Private (pilih sesuai kebutuhan)
   - **JANGAN centang** "Initialize with README" (karena sudah ada)
4. Klik "Create repository"

### 1.2 Upload Project ke GitHub dari Windows

Buka Command Prompt atau PowerShell di folder `e:\gracs`:

```powershell
cd e:\gracs

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: GRACS ACS Application"

# Add GitHub remote (ganti dengan URL repository Anda)
git remote add origin https://github.com/USERNAME/gracs-acs.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Ganti `USERNAME`** dengan username GitHub Anda!

## Langkah 2: Deployment ke Ubuntu Server/VPS

### 2.1 Koneksi ke Server

```bash
ssh root@YOUR_SERVER_IP
# atau
ssh your_username@YOUR_SERVER_IP
```

### 2.2 Download Installation Script

```bash
# Download dari GitHub (setelah upload)
wget https://raw.githubusercontent.com/USERNAME/gracs-acs/main/install.sh

# Atau clone repository dulu
git clone https://github.com/USERNAME/gracs-acs.git
cd gracs-acs
```

### 2.3 Jalankan Installation Script

```bash
# Berikan permission execute
chmod +x install.sh

# Jalankan script sebagai root
sudo ./install.sh
```

Script akan otomatis:
- ✅ Update sistem
- ✅ Install Node.js 18.x
- ✅ Install PostgreSQL
- ✅ Membuat database dan user
- ✅ Install dependencies NPM
- ✅ Generate `.env` dengan password acak
- ✅ Menjalankan migrasi database
- ✅ Membuat systemd service
- ✅ Mengkonfigurasi firewall
- ✅ Start aplikasi

### 2.4 Informasi yang Diperlukan Saat Instalasi

Script akan menanyakan:

1. **Database name** (default: `acs_database`) - Enter untuk default
2. **Database username** (default: `acs_user`) - Enter untuk default
3. **Database password** - Masukkan password yang kuat
4. **Install directory** (default: `/opt/gracs`) - Enter untuk default
5. **GitHub repository URL** - Paste URL repo Anda

## Langkah 3: Verifikasi Instalasi

### 3.1 Cek Status Service

```bash
systemctl status gracs
```

Output seharusnya menunjukkan **active (running)**.

### 3.2 Cek Log Aplikasi

```bash
# Lihat log real-time
journalctl -u gracs -f

# Lihat log terakhir
journalctl -u gracs -n 50
```

### 3.3 Test Akses Dashboard

Buka browser dan akses:
```
http://YOUR_SERVER_IP:7547
```

Login dengan:
- Username: `admin`
- Password: `admin123`

**⚠️ SEGERA ubah password setelah login pertama!**

## Langkah 4: Konfigurasi Lanjutan

### 4.1 Ubah Admin Password

1. Login ke dashboard
2. Klik username di pojok kanan atas
3. Pilih "Change Password"
4. Masukkan password baru

### 4.2 Edit Konfigurasi (Opsional)

```bash
cd /opt/gracs
nano .env
```

Restart service setelah perubahan:
```bash
systemctl restart gracs
```

### 4.3 Setup Domain (Opsional)

Jika menggunakan domain (misalnya: acs.example.com):

#### Install Nginx

```bash
apt-get install -y nginx
```

#### Buat Nginx Configuration

```bash
nano /etc/nginx/sites-available/gracs
```

Paste konfigurasi ini:

```nginx
server {
    listen 80;
    server_name acs.example.com;

    location / {
        proxy_pass http://localhost:7547;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/gracs /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Install SSL dengan Let's Encrypt

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d acs.example.com
```

## Langkah 5: Konfigurasi CPE Device

Point CPE device Anda ke ACS:

**ACS URL:**
```
http://YOUR_SERVER_IP:7547/acs
# atau dengan domain + SSL:
https://acs.example.com/acs
```

**Authentication:**
- Username: Lihat di `/opt/gracs/.env` → `CPE_DEFAULT_USERNAME`
- Password: Lihat di `/opt/gracs/.env` → `CPE_DEFAULT_PASSWORD`

Cara lihat credentials:
```bash
grep CPE_ /opt/gracs/.env
```

## Service Management Commands

```bash
# Start service
systemctl start gracs

# Stop service
systemctl stop gracs

# Restart service
systemctl restart gracs

# Check status
systemctl status gracs

# Enable auto-start on boot
systemctl enable gracs

# Disable auto-start
systemctl disable gracs

# View logs (real-time)
journalctl -u gracs -f

# View logs (last 100 lines)
journalctl -u gracs -n 100
```

## Troubleshooting

### Service Tidak Start

```bash
# Cek log error
journalctl -u gracs -n 50

# Cek apakah port 7547 sudah digunakan
netstat -tlnp | grep 7547

# Test manual start
cd /opt/gracs
node server.js
```

### Database Connection Error

```bash
# Cek PostgreSQL running
systemctl status postgresql

# Test database connection
sudo -u postgres psql -d acs_database

# Verify credentials di .env
cat /opt/gracs/.env | grep DB_
```

### Firewall Blocking

```bash
# Cek firewall status
ufw status

# Allow port 7547
ufw allow 7547/tcp

# Reload firewall
ufw reload
```

### Update Aplikasi

```bash
cd /opt/gracs

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Restart service
systemctl restart gracs
```

## Backup & Restore

### Backup Database

```bash
# Backup database
sudo -u postgres pg_dump acs_database > backup_$(date +%Y%m%d).sql

# Backup dengan kompresi
sudo -u postgres pg_dump acs_database | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore dari backup
sudo -u postgres psql acs_database < backup_20240204.sql

# Restore dari file compressed
gunzip -c backup_20240204.sql.gz | sudo -u postgres psql acs_database
```

### Backup Files

```bash
# Backup seluruh aplikasi
tar -czf gracs_backup_$(date +%Y%m%d).tar.gz /opt/gracs

# Backup hanya .env dan storage
tar -czf gracs_env_$(date +%Y%m%d).tar.gz /opt/gracs/.env /opt/gracs/storage
```

## Security Best Practices

1. **Ubah semua default password** di `.env`
2. **Enable firewall** (ufw)
3. **Setup HTTPS/SSL** untuk production
4. **Regular updates**:
   ```bash
   apt-get update && apt-get upgrade -y
   ```
5. **Monitor logs** secara berkala
6. **Backup database** secara rutin (cronjob)
7. **Limit SSH access** (gunakan SSH key, disable password login)

## Monitoring

### Setup Automatic Restart on Failure

File systemd service sudah dikonfigurasi dengan:
- `Restart=always`
- `RestartSec=10`

Service akan otomatis restart jika crash.

### Setup Log Rotation

```bash
nano /etc/logrotate.d/gracs
```

Isi dengan:
```
/var/log/gracs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload gracs > /dev/null 2>&1 || true
    endscript
}
```

## Uninstall

```bash
# Stop dan disable service
systemctl stop gracs
systemctl disable gracs
rm /etc/systemd/system/gracs.service
systemctl daemon-reload

# Remove database
sudo -u postgres psql -c "DROP DATABASE acs_database;"
sudo -u postgres psql -c "DROP USER acs_user;"

# Remove application
rm -rf /opt/gracs

# Optional: Remove Node.js dan PostgreSQL
apt-get remove --purge nodejs postgresql postgresql-contrib
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `systemctl status gracs` | Check service status |
| `journalctl -u gracs -f` | View live logs |
| `systemctl restart gracs` | Restart service |
| `nano /opt/gracs/.env` | Edit configuration |
| `git pull origin main` | Update application |

**Dashboard:** http://YOUR_SERVER_IP:7547  
**TR-069 Endpoint:** http://YOUR_SERVER_IP:7547/acs

---

**Selamat! GRACS ACS Anda sudah berjalan di VPS!** 🚀
