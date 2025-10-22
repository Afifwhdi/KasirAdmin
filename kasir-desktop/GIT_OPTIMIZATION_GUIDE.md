# 🚀 Git Optimization Guide - Kasir Desktop

Panduan lengkap untuk optimasi ukuran repository dan mempercepat push ke GitHub.

---

## 📊 ANALISIS MASALAH

### Penyebab Lambat Push ke GitHub:
1. **File besar** di history git (commit sebelumnya)
2. **node_modules/** tidak ter-exclude dengan benar
3. **Build outputs** (dist, release) ter-commit
4. **package-lock.json** sangat besar (439 KB)
5. **Koneksi internet** lambat

---

## ✅ SOLUSI SUDAH DITERAPKAN

### 1. Update .gitignore (DONE ✓)

File berikut sekarang **otomatis di-exclude**:

```
✓ node_modules/
✓ dist/ build/ release/ out/
✓ *.exe *.dmg *.asar (electron builds)
✓ *.map (source maps)
✓ *.log (log files)
✓ *.db *.sqlite (databases)
✓ .env files (keep .env.example only)
✓ Cache folders (.cache, .temp)
✓ IDE configs (.vscode, .idea)
✓ OS files (.DS_Store, Thumbs.db)
✓ package-lock.json
✓ CLEANUP_SUMMARY.txt
```

---

## 🔧 LANGKAH OPTIMASI

### STEP 1: Clean Git Cache (Remove Tracked Files)

Hapus file yang sudah ter-track tapi seharusnya di-ignore:

```bash
cd kasir-desktop

# Remove files from git tracking (not from disk)
git rm -r --cached node_modules 2>$null
git rm -r --cached dist 2>$null
git rm -r --cached build 2>$null
git rm -r --cached release 2>$null
git rm --cached package-lock.json 2>$null
git rm --cached CLEANUP_SUMMARY.txt 2>$null

# Add updated .gitignore
git add .gitignore

# Commit changes
git commit -m "chore: optimize gitignore and remove large files from tracking"
```

---

### STEP 2: Check File yang Akan Di-push

Lihat file apa saja yang akan di-push:

```bash
# Lihat file yang tracked
git ls-files

# Lihat ukuran total
git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Measure-Object -Property Length -Sum | Select-Object @{Name="TotalSize(MB)";Expression={[math]::Round($_.Sum / 1MB, 2)}}

# Lihat file terbesar yang tracked
git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Where-Object { $_.Length -gt 100KB } | Sort-Object Length -Descending | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length / 1KB, 2)}} -First 20
```

**Target:** Total size < 10 MB (ideal untuk push cepat)

---

### STEP 3: Optimasi Package Lock (Optional)

Jika package-lock.json perlu di-commit (untuk CI/CD):

```bash
# Regenerate package-lock dengan clean install
Remove-Item package-lock.json -Force
npm install

# Commit yang baru
git add package-lock.json
git commit -m "chore: regenerate package-lock.json"
```

**Rekomendasi:** Exclude package-lock.json dari git, karena:
- Ukuran besar (439 KB)
- Sering berubah (banyak conflict)
- Tidak perlu untuk development

---

### STEP 4: Push ke GitHub dengan Optimization

#### Opsi A: Push Biasa (Recommended untuk repo kecil)

```bash
# Push ke GitHub
git push origin main
```

#### Opsi B: Push dengan Compression (Untuk repo besar)

```bash
# Set git config untuk compression maksimal
git config --global core.compression 9

# Push dengan progress
git push origin main --progress
```

#### Opsi C: Shallow Push (Untuk repo sangat besar)

```bash
# Clone shallow (history terbatas) dari remote
git clone --depth 1 <repository-url>

# Atau convert existing repo ke shallow
git fetch --depth 1
```

---

## 🎯 SOLUSI CEPAT (RECOMMENDED)

Jika masih lambat setelah optimasi di atas, gunakan **Git LFS** (Large File Storage):

### Install Git LFS

```bash
# Download dari https://git-lfs.github.com/
# Install Git LFS
git lfs install

# Track file besar (contoh)
git lfs track "*.exe"
git lfs track "*.asar"
git lfs track "release/**"

# Add .gitattributes
git add .gitattributes

# Commit dan push
git commit -m "chore: setup Git LFS for large files"
git push origin main
```

---

## 📦 ALTERNATIVE: Create .npmrc

Buat file `.npmrc` di root untuk optimasi npm:

```bash
# Create .npmrc
echo "package-lock=false" > .npmrc
echo "save-exact=true" >> .npmrc

# Add to git
git add .npmrc
git commit -m "chore: add npmrc for npm optimization"
```

**Benefit:**
- Tidak generate package-lock.json otomatis
- Lebih konsisten version management
- Mengurangi conflict

---

## 🧹 CLEAN UP REPO (Jika Perlu)

### Hapus File Besar dari Git History

**WARNING:** Ini akan rewrite git history! Koordinasi dengan team dulu.

```bash
# Install git-filter-repo (https://github.com/newren/git-filter-repo)

# Remove folder dari history
git filter-repo --path release --invert-paths
git filter-repo --path build --invert-paths
git filter-repo --path node_modules --invert-paths

# Force push (DANGER!)
git push origin main --force
```

**Atau gunakan BFG Repo-Cleaner (Easier):**

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Remove file > 10MB dari history
java -jar bfg.jar --strip-blobs-bigger-than 10M kasir-desktop

# Clean up
cd kasir-desktop
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin main --force
```

---

## 📈 MONITORING

### Check Ukuran Repo

```bash
# Total size of .git folder
Get-ChildItem .git -Recurse -Force | Measure-Object -Property Length -Sum | Select-Object @{Name="Size(MB)";Expression={[math]::Round($_.Sum / 1MB, 2)}}

# Check largest objects in git
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | Sort-Object { [int]($_ -split ' ')[2] } -Descending | Select-Object -First 20
```

---

## ⚡ TIPS TAMBAHAN

### 1. Use SSH Instead of HTTPS

SSH lebih cepat dan tidak perlu password:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH Keys

# Change remote to SSH
git remote set-url origin git@github.com:username/kasir-desktop.git

# Push
git push origin main
```

### 2. Increase Git Buffer

Untuk file besar atau koneksi lambat:

```bash
# Increase buffer size
git config --global http.postBuffer 524288000  # 500 MB

# Increase timeout
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

### 3. Push in Batches

Jika commit banyak:

```bash
# Push commit-by-commit
git push origin main --force-with-lease --progress
```

### 4. Use GitHub Desktop

Jika command line lambat, gunakan GitHub Desktop:
- Download: https://desktop.github.com/
- Drag & drop folder
- Klik "Publish repository"
- Otomatis optimasi upload

---

## ✅ CHECKLIST OPTIMASI

Pastikan semua ini sudah:

```
□ .gitignore sudah update
□ node_modules/ tidak ter-track
□ dist/ build/ release/ tidak ter-track
□ package-lock.json di-exclude (optional)
□ File .exe .asar tidak ter-track
□ Total tracked files < 10 MB
□ Git cache sudah di-clean
□ SSH key sudah setup (optional)
□ Git buffer sudah di-increase (optional)
```

---

## 🎯 EXPECTED RESULTS

Setelah optimasi:

**Before:**
- Tracked files: ~500+
- Total size: ~50-100 MB
- Push time: 5-10 menit (lambat)

**After:**
- Tracked files: ~127 files ✓
- Total size: ~2-5 MB ✓
- Push time: 10-30 detik (cepat) ✓

---

## 🆘 TROUBLESHOOTING

### Problem 1: Push Gagal - "Large Files"

**Solusi:**
```bash
# Find large files
git ls-files | ForEach-Object { Get-Item $_ } | Where-Object { $_.Length -gt 50MB }

# Remove from git (keep on disk)
git rm --cached <large-file>

# Add to .gitignore
echo "<large-file>" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: remove large file from tracking"
```

### Problem 2: Push Timeout

**Solusi:**
```bash
# Increase timeout
git config --global http.postBuffer 524288000

# Retry push
git push origin main --progress
```

### Problem 3: "Everything up-to-date" tapi File Tidak Ter-push

**Solusi:**
```bash
# Check status
git status

# Check remote
git remote -v

# Force push (CAREFUL!)
git push origin main --force
```

---

## 📞 SUPPORT

Jika masih lambat setelah semua optimasi:

1. **Check koneksi internet** (speedtest.net)
2. **Gunakan WiFi/Ethernet** (bukan mobile hotspot)
3. **Upload saat traffic rendah** (malam hari)
4. **Gunakan GitHub Desktop** (auto-optimization)
5. **Contact GitHub Support** jika repo > 1 GB

---

**Created by:** Factory AI  
**Date:** 22 Oktober 2025  
**Status:** ✅ Ready to optimize!
