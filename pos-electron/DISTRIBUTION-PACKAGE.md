# Distribution Package - POS Electron

## 📦 File untuk Copy ke Flashdisk/Google Drive

### **WAJIB (Must Have):**

#### 1. **Installer Aplikasi** ⭐
```
📁 release/
└── POS System Setup 1.0.0.exe  (~150MB)
```
**Ini satu-satunya file yang perlu di-install di PC toko!**

### **OPSIONAL (Dokumentasi):**

#### 2. **User Manual**
```
📁 docs/
├── PRODUCTION-READY.md          - Panduan lengkap deployment
├── USER-GUIDE.md                - Panduan pengguna
└── TROUBLESHOOTING.md           - Problem solving
```

#### 3. **Backup File (Untuk Developer)**
```
📁 backup/
├── .env                          - API configuration
├── package.json                  - Dependencies list
└── electron/main.cjs             - Main electron config
```

---

## 🔐 Amankan API & Credentials

### **File Sensitif yang JANGAN Dishare:**

❌ **JANGAN UPLOAD KE GOOGLE DRIVE PUBLIK:**
```
.env                    - Contains API URL
package.json            - Contains project info
node_modules/           - Too large
source code files       - Security risk
```

### **Info Sensitif yang JANGAN Dishare:**

❌ **RAHASIA:**
```
VPS IP: 154.19.37.167
API Port: 3000
Login Email: adminpos@gmail.com
Login Password: 123
Database Credentials: (di VPS .env)
```

### **Yang AMAN untuk Dishare:**

✅ **OK untuk Dishare:**
```
Installer: POS System Setup.exe
Documentation: *.md files
User Guide: PDF manual
Screenshots: App screenshots
```

---

## 📋 Checklist Distribusi

### **Pre-Distribution:**

- [ ] Build production installer
- [ ] Test installer di PC lain
- [ ] Backup credentials secara terpisah
- [ ] Buat user guide PDF
- [ ] Test full workflow (login → sync → transaksi)

### **Distribution Package:**

#### **Minimal Package** (Untuk Toko):
```
📦 POS-Kasir-Installer.zip
└── POS System Setup.exe
└── README.txt (instruksi singkat)
```

#### **Full Package** (Untuk IT Support):
```
📦 POS-Kasir-Full-Package.zip
├── installer/
│   └── POS System Setup.exe
├── docs/
│   ├── User-Guide.pdf
│   ├── Setup-Instructions.pdf
│   └── Troubleshooting.pdf
├── credentials/
│   └── login-info.txt (ENCRYPTED!)
└── README.md
```

---

## 🔒 Security Best Practices

### **1. Amankan Credentials**

**Jangan Simpan di:**
- ❌ Google Drive Public Link
- ❌ Email plain text
- ❌ WhatsApp message
- ❌ Screenshot

**Simpan di:**
- ✅ Password Manager (1Password, LastPass)
- ✅ Encrypted file (7zip with password)
- ✅ Private note app
- ✅ Offline document (kertas, safe box)

### **2. Credentials File Template**

Buat file: `credentials-ENCRYPTED.txt`
```
==============================================
POS ELECTRON - LOGIN CREDENTIALS
==============================================

PC TOKO:
Email: adminpos@gmail.com
Password: 123

VPS API:
URL: http://154.19.37.167:3000
Status: Running on PM2

DATABASE:
Location: C:\Users\[User]\AppData\Roaming\pos-electron\POS_Data

BACKUP:
Frequency: Weekly
Last Backup: [Date]

==============================================
RAHASIA - JANGAN DISHARE!
==============================================
```

**Encrypt dengan 7zip:**
```bash
# Compress & encrypt
7z a -p[PASSWORD] credentials.7z credentials.txt

# Hasil: credentials.7z (encrypted)
# Password simpan terpisah!
```

### **3. API Security**

**Di VPS (`/var/www/KasirAdmin/api/.env`):**
```env
# Sudah aman:
✅ JWT_SECRET=bswlUBhNlF+8MKC1sNkmEfIsVhIF/rH+MfQ3p9vqMRg=
✅ DB_PASSWORD=[hidden]
✅ CORS_ORIGIN=[specific origins only]

# Rekomendasi tambahan:
☐ Add rate limiting
☐ Enable HTTPS/SSL
☐ Firewall rules
☐ Monitor access logs
```

---

## 📦 Build & Package Instructions

### **Step 1: Build Production**

```bash
cd D:\Project\Program\KasirAdmin\pos-electron

# Clean install
rm -rf node_modules
npm install

# Build app
npm run build

# Create installer
npm run electron:build:win

# Output: release/POS System Setup 1.0.0.exe
```

### **Step 2: Test Installer**

```bash
# Test di PC lain atau VM
1. Copy installer ke PC test
2. Install
3. Login dengan credentials
4. Sync data (838 products)
5. Create test transaction
6. Verify transaction di server

# Jika semua OK → Ready to distribute!
```

### **Step 3: Create Distribution Package**

```bash
# Create folder
mkdir POS-Distribution

# Copy installer
copy "release\POS System Setup.exe" "POS-Distribution\"

# Create README
echo "POS System v1.0.0 - Login: adminpos@gmail.com" > POS-Distribution\README.txt

# Zip
7z a POS-Kasir-v1.0.0.zip POS-Distribution\

# Upload ke Google Drive (Private!)
```

---

## 💾 Google Drive Organization

### **Recommended Folder Structure:**

```
📁 Google Drive/POS-System/
├── 📁 Installers/
│   ├── POS-Setup-v1.0.0.exe
│   ├── POS-Setup-v1.0.1.exe
│   └── latest.txt (link to latest version)
├── 📁 Documentation/
│   ├── User-Guide.pdf
│   ├── Setup-Instructions.pdf
│   └── API-Documentation.pdf
├── 📁 Backups/
│   ├── database-backup-2025-01-15.zip
│   └── transactions-export.csv
└── 📁 Credentials/ (PRIVATE - Share with specific person only)
    ├── login-info-ENCRYPTED.7z
    └── api-keys-ENCRYPTED.7z
```

**Permission Settings:**
- `Installers/`: Anyone with link (Read only)
- `Documentation/`: Anyone with link (Read only)
- `Backups/`: Owner only
- `Credentials/`: Owner + 1 trusted person only

---

## ✅ Final Distribution Checklist

### **For Store PC:**

- [ ] Copy `POS System Setup.exe` to USB
- [ ] Bring printed credentials (don't leave in store!)
- [ ] Install on store PC
- [ ] Login dan sync
- [ ] Test 1 transaction
- [ ] Train staff
- [ ] Done!

### **For Backup:**

- [ ] Upload installer to Google Drive (private)
- [ ] Upload documentation
- [ ] Save credentials in password manager
- [ ] Document VPS IP & port
- [ ] Set reminder for weekly backup

---

## 🚨 Emergency Recovery

### **Jika PC Toko Crash:**

1. **Reinstall App**:
   - Download installer from Google Drive
   - Install ulang
   - Login dengan credentials

2. **Data Recovery**:
   - Database otomatis di: `C:\Users\[User]\AppData\Roaming\pos-electron\`
   - Jika masih ada, data tidak hilang
   - Jika hilang, sync ulang dari server

3. **Contact Support**:
   - Check VPS API status
   - Check internet connection
   - Review error logs

---

## 📝 Distribution Summary

### **Minimum Package:**
✅ 1 file: `POS System Setup.exe` (150MB)

### **Recommended Package:**
✅ Installer + User Guide PDF

### **Full Package:**
✅ Installer + Docs + Encrypted Credentials

### **NEVER Include:**
❌ Source code
❌ node_modules
❌ .env files
❌ Plain text credentials
❌ Database files

---

**Ready to distribute?** ✅ **YES!**

**Next step:**
```bash
npm run electron:build:win
```

Then copy `release/POS System Setup.exe` to flashdisk! 🎉
