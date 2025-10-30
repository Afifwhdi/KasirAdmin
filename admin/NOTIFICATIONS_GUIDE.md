# 🔔 Database Notifications - Filament Admin

## ✅ Fitur yang Sudah Aktif

Bell icon (🔔) sekarang sudah muncul di **kanan atas** sebelah profil dengan fitur:

### 📍 Lokasi
- **Topbar kanan atas** → Sebelah kiri profile menu
- Auto refresh setiap **30 detik**
- Badge merah untuk notifikasi belum dibaca

---

## 🎯 Jenis Notifikasi

### 1. **Low Stock Alert** ⚠️
**Trigger:** Ketika stock produk ≤ min_stock

**Isi:**
- Warning icon (⚠️)
- Judul: "Stok Produk Menipis!"
- Pesan: Nama produk + sisa stock
- Action: Button "Lihat Produk" (langsung ke edit page)

**Auto send:** Ya, otomatis saat product updated

### 2. **New Transaction** 🛍️
**Trigger:** Manual (bisa ditambahkan di TransactionObserver)

**Isi:**
- Success icon (✅)
- Judul: "Transaksi Baru!"
- Pesan: Nomor transaksi + total
- Action: Button "Lihat Detail" (ke transaction detail)

---

## 🧪 Testing Notification

### Command untuk Test:
```bash
# Send ke admin pertama
php artisan notification:test

# Send ke user specific
php artisan notification:test 1
```

### Test Manual:
1. Login sebagai admin
2. Edit produk, ubah stock menjadi ≤ min_stock
3. Save
4. Lihat bell icon di kanan atas (ada badge merah)
5. Klik bell → modal muncul dengan notifikasi

---

## 📚 Cara Menambahkan Notifikasi Baru

### 1. Buat Notification Class
```bash
php artisan make:notification NamaNotification
```

### 2. Edit Notification Class
```php
<?php

namespace App\Notifications;

use Filament\Notifications\Notification as FilamentNotification;
use Filament\Notifications\Actions\Action;
use Illuminate\Notifications\Notification;

class NamaNotification extends Notification
{
    public function via($notifiable): array
    {
        return ['database']; // Harus database
    }

    public function toDatabase($notifiable): array
    {
        return FilamentNotification::make()
            ->success() // atau ->warning(), ->danger(), ->info()
            ->title('Judul Notifikasi')
            ->body('Isi pesan notifikasi')
            ->icon('heroicon-o-bell')
            ->actions([
                Action::make('view')
                    ->label('Lihat Detail')
                    ->url('/admin/...'),
            ])
            ->getDatabaseMessage();
    }
}
```

### 3. Send Notification
```php
use App\Models\User;
use App\Notifications\NamaNotification;

// Send ke satu user
$user = User::find(1);
$user->notify(new NamaNotification());

// Send ke semua admin
$admins = User::where('role', 'admin')->get();
foreach ($admins as $admin) {
    $admin->notify(new NamaNotification());
}
```

---

## 🎨 Customization

### Ubah Polling Interval (di AdminPanelProvider)
```php
->databaseNotificationsPolling('10s') // setiap 10 detik
->databaseNotificationsPolling('1m')  // setiap 1 menit
->databaseNotificationsPolling(null)  // disable auto refresh
```

### Icon Options
- `heroicon-o-bell` - Bell (default)
- `heroicon-o-exclamation-triangle` - Warning
- `heroicon-o-check-circle` - Success
- `heroicon-o-x-circle` - Error
- `heroicon-o-information-circle` - Info
- `heroicon-o-shopping-bag` - Shopping
- `heroicon-o-truck` - Delivery
- `heroicon-o-currency-dollar` - Money

### Color Options
```php
->success()  // Green
->warning()  // Yellow/Orange
->danger()   // Red
->info()     // Blue
```

---

## 💡 Tips & Best Practices

### 1. **Jangan Spam Notifikasi**
```php
// ❌ BURUK - setiap edit
public function updated(Product $product) {
    $admin->notify(new ProductUpdated($product));
}

// ✅ BAIK - hanya kondisi tertentu
public function updated(Product $product) {
    if ($product->isDirty('stock') && $product->stock <= $product->min_stock) {
        $admin->notify(new LowStockNotification($product));
    }
}
```

### 2. **Group Notifications**
Jika ada banyak produk low stock, kirim 1 notifikasi summary, bukan 1 per produk.

### 3. **Add Context**
Selalu tambahkan action button untuk direct link ke detail.

### 4. **Clear Old Notifications**
```php
// Hapus notifikasi > 30 hari
php artisan notifications:clear --days=30
```

---

## 📊 Database Structure

Tabel: `notifications`
```sql
- id
- type (App\Notifications\LowStockNotification)
- notifiable_type (App\Models\User)
- notifiable_id (user_id)
- data (JSON - berisi title, body, actions, etc)
- read_at (timestamp)
- created_at
- updated_at
```

---

## 🔧 Troubleshooting

### Notifikasi tidak muncul?
1. ✅ Pastikan migration sudah running: `php artisan migrate`
2. ✅ Pastikan User model pakai trait `Notifiable`
3. ✅ Check AdminPanelProvider ada `->databaseNotifications()`
4. ✅ Clear cache: `php artisan filament:optimize-clear`

### Bell icon tidak ada badge?
- Notifikasi belum dibaca harus ada
- Pastikan `read_at` masih NULL di database

### Modal tidak muncul saat klik bell?
- Clear browser cache
- Hard reload (Ctrl + Shift + R)
- Check console browser untuk error

---

## 🚀 Future Features (Bisa Ditambahkan)

1. **Email Notifications** - Send email juga selain database
2. **Push Notifications** - Browser push notification
3. **Notification Settings** - User bisa pilih notifikasi mana yang mau diterima
4. **Notification Grouping** - Group by type
5. **Mark All as Read** - Bulk action
6. **Notification Sound** - Play sound saat notifikasi baru

---

## 📖 Referensi

- [Filament Database Notifications](https://filamentphp.com/docs/4.x/notifications/database-notifications)
- [Laravel Notifications](https://laravel.com/docs/notifications)
- [Heroicons](https://heroicons.com/) - Icon library

---

**Notifikasi sudah aktif dan siap digunakan! 🎉**
