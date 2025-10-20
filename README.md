# KasirAdmin - POS System

Sistem Point of Sale (POS) untuk toko dengan fitur:
- Penjualan dan transaksi
- Manajemen produk dan kategori  
- Sinkronisasi data ke server
- Mode offline/online

## Instalasi Desktop App

1. Download file installer dari release
2. Jalankan installer dan ikuti petunjuk
3. Aplikasi siap digunakan

## Konfigurasi Server

Untuk server production, sesuaikan file `.env` di folder `api/` dengan database dan konfigurasi Anda.

## Teknologi

- Desktop: Electron + React + TypeScript
- API: NestJS + PostgreSQL
- Admin: Laravel + Filament