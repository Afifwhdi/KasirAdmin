# 📘 Dokumentasi Lengkap Sistem POS Offline-First (Dilla Store)

## 🧭 Deskripsi Umum
Sistem POS Offline-First ini dirancang untuk toko yang sering menghadapi masalah koneksi internet lambat atau tidak stabil.
Tujuan utamanya adalah memastikan proses penjualan **tetap dapat berjalan sepenuhnya tanpa internet**, dan data akan otomatis disinkronkan ke server (NestJS API + Supabase) ketika koneksi aktif kembali.

Struktur sistem dibangun dengan komponen utama:
1. **React POS (Frontend)** — untuk operasional kasir dan transaksi.
2. **NestJS API (Backend)** — untuk menangani sinkronisasi dan logic data.
3. **Supabase (Database Cloud)** — sebagai database utama.
4. **Laravel Filament (Admin Panel)** — untuk monitoring dan manajemen data.

---

## ⚙️ Tahapan Perancangan Sistem

### 1️⃣ Tahap Konseptual
Masalah utama yang ingin diselesaikan:
- Internet di lokasi toko sering mati/lambat sehingga POS berbasis web tidak bisa dipakai.
- Dibutuhkan sistem yang **bisa berjalan offline penuh** tanpa kehilangan data.
- Kasir butuh performa cepat agar pelayanan tidak terganggu.
- Data transaksi harus tetap bisa dikirim ke server secara manual setelah koneksi pulih.

Solusi:
> Membangun sistem POS dengan **dua mode operasi**:
> - **Offline Mode (Full Lokal)** — transaksi berjalan tanpa internet, data tersimpan di IndexedDB.
> - **Online Mode (Sinkronisasi Manual)** — admin/kasir bisa upload data ke server saat koneksi aktif.

---

### 2️⃣ Tahap Arsitektur Teknis

#### Komponen
| Komponen | Fungsi |
|-----------|--------|
| React POS | Aplikasi frontend untuk transaksi, berjalan offline dengan IndexedDB |
| NestJS API | Menangani sinkronisasi data, validasi, dan routing data ke Supabase |
| Supabase | Database cloud berbasis PostgreSQL |
| Laravel Filament | Panel admin untuk melihat laporan, stok, dan status sinkronisasi |

#### Alur Data
1. **Saat buka toko (online):**
   - POS melakukan request ke endpoint `/sync/full` untuk mengambil seluruh data master (produk, kategori, stok).
   - Data disimpan ke **IndexedDB (Dexie.js)**.
   - Notifikasi muncul: `✅ Data berhasil diunduh, Anda kini dalam mode offline.`

2. **Selama operasional toko (offline):**
   - Semua transaksi dicatat ke IndexedDB.
   - Tidak ada koneksi ke server.

3. **Saat tutup toko (online kembali):**
   - Admin menekan tombol “Kirim ke Server” → data diupload ke endpoint `/sync/upload`.
   - Setelah sukses, IndexedDB dikosongkan, dan notifikasi muncul:  
     `✅ Semua transaksi berhasil dikirim ke server.`

---

## ⚡ Fitur Utama

| Fitur | Deskripsi |
|--------|------------|
| Offline-first | POS dapat berjalan tanpa internet sama sekali |
| Manual Sync | Upload data ke server secara manual setelah toko tutup |
| Autosave | Semua transaksi otomatis disimpan ke IndexedDB |
| Reminder otomatis | Notifikasi jam 21:00 bila belum sync data |
| Storage monitoring | Notifikasi jika penyimpanan IndexedDB hampir penuh |
| Backup JSON | Data offline bisa di-export ke file .json |
| Batch rotation | Data disimpan per hari agar tidak overload |
| PWA support | Aplikasi dapat diinstall dan berjalan offline |
| Enkripsi Data | Data transaksi dienkripsi untuk keamanan |

---

## 🧠 Alur Operasional Sistem

1. **Buka Toko**
   - POS online → ambil data dari server.
   - Cache disimpan lokal di IndexedDB.

2. **Mode Offline**
   - Transaksi berjalan tanpa internet.
   - Semua perubahan disimpan di `transactions_pending`.

3. **Tutup Toko**
   - Kasir klik “Kirim ke Server”.
   - POS mengirim batch transaksi ke API.
   - Server menyimpan ke Supabase, dan IndexedDB direset ulang.

4. **Koneksi Pulih**
   - Sistem mendeteksi `window.online = true`.
   - Menampilkan pesan: `✅ Koneksi internet kembali aktif.`

---

## 🔔 Reminder & Kondisi Otomatis

### Fitur Reminder:
1. **Jam 21:00 – Belum Sync Data**
   - Cek kondisi setiap 1 menit.
   - Jika ada data pending, muncul toast warning.

2. **Storage Hampir Penuh**
   - Gunakan `navigator.storage.estimate()`.
   - Jika usage > 80% quota → notifikasi peringatan.

3. **Belum Sync > 2 Hari**
   - Simpan `lastSyncDate` di localStorage.
   - Jika melebihi 48 jam → tampilkan alert agar segera sync.

4. **Koneksi Pulih**
   - Event `window.online` memunculkan toast sukses.

5. **Sync Sukses**
   - Setelah upload data berhasil, tampilkan notifikasi “✅ Data berhasil dikirim”.

Semua reminder hanya aktif jika kondisi terpenuhi (`unsynced > 0`, `offline = true`, `jam == 21:00`).

---

## 🔒 Sistem Keamanan & Integritas Data

| Risiko | Dampak | Solusi |
|---------|---------|--------|
| Listrik padam | Transaksi terakhir hilang | Autosave setiap perubahan keranjang ke IndexedDB |
| Cache dihapus | Semua data pending hilang | Auto export JSON setiap tutup toko |
| Double upload | Duplikasi transaksi | UUID unik di setiap transaksi |
| Konflik stok | Stok berbeda antara offline dan server | Gunakan timestamp dan delta merge |
| Manipulasi data | Integritas data rusak | Enkripsi AES di IndexedDB |
| Browser limit | IndexedDB penuh | Cek `navigator.storage.estimate()` dan beri warning |

---

## 🧱 Problem & Solusi Lengkap

| Problem | Dampak | Solusi |
|----------|---------|--------|
| **1. Listrik Mati Mendadak** | Data transaksi hilang | Autosave setiap perubahan + IndexedDB transaction atomic |
| **2. Internet Mati >3 Hari** | IndexedDB overload | Batch rotation + reminder “offline lama” |
| **3. Browser Clear Cache** | Semua data offline hilang | Export JSON harian otomatis |
| **4. Sinkronisasi Timeout** | Upload gagal | Batch upload per 100 transaksi |
| **5. Kasir Lupa Klik Sync** | Data tidak masuk laporan | Reminder jam 21:00 |
| **6. Versi PWA Lama** | Schema mismatch | Version check & auto update service worker |
| **7. Device Rusak** | Data hilang | Backup JSON eksternal |
| **8. Data Double Upload** | Laporan ganda | UUID unik & dedup server-side |
| **9. IndexedDB Limit** | Transaksi gagal simpan | Monitoring storage usage |
| **10. Konflik Stok** | Selisih data stok | Timestamp priority lokal > server |

---

## 🧮 Checklist Implementasi

| No | Fitur | Status | Teknologi |
|----|--------|---------|------------|
| 1 | Offline mode | ✅ | Dexie.js |
| 2 | Manual sync | ✅ | NestJS `/sync/upload` |
| 3 | Autosave | ✅ | Dexie transaction |
| 4 | Reminder 21:00 | ✅ | Toast & schedule |
| 5 | Storage warning | ✅ | `navigator.storage.estimate()` |
| 6 | Reminder belum sync | ✅ | Check `lastSyncDate` |
| 7 | Export JSON | ✅ | `dexie-export-import` |
| 8 | Batch upload | ✅ | Upload per 100 transaksi |
| 9 | Enkripsi | ✅ | CryptoJS AES |
| 10 | PWA installable | ✅ | vite-plugin-pwa |
| 11 | Version auto-update | ✅ | Service worker autoUpdate |

---

## 💡 Kesimpulan Akhir
Sistem POS Offline-First ini **dirancang tangguh, efisien, dan aman**, mampu beroperasi penuh tanpa internet dan menjaga seluruh data transaksi agar tidak hilang.  
Dengan integrasi reminder cerdas, autosave, enkripsi, dan batch upload, sistem ini ideal untuk toko retail dengan koneksi terbatas.

---

© 2025 — Dilla Store POS System  
by Afif Wahidi  
Versi: `v1.0.0 — Full Documentation`
