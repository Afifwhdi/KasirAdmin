# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - 2025-10-07

#### Transactions Feature
- ✅ **Transactions API Integration**
  - Consume transactions dari NestJS backend (`GET /transactions`)
  - Transaction items endpoint (`GET /transactions/:id/items`)
  - Auto-refresh dengan React Query caching (5 minutes)
  - Loading state untuk transactions
  - Error handling untuk API failures

- ✅ **Transaction History Page**
  - Display semua transaksi dari database
  - Search by transaction number atau customer name
  - Format tanggal lokalisasi Indonesia
  - Status badge (Selesai/Pending)
  - Payment method label (Tunai/Bon)
  - Actions: View detail & Print receipt (UI ready)

#### Categories Feature
- ✅ **Categories API Integration**
  - Consume categories dari NestJS backend (`GET /categories`)
  - Auto-refresh dengan React Query caching (5 minutes)
  - Loading state untuk categories

- ✅ **Horizontal Scroll dengan Shadow Effect**
  - Categories scroll horizontal dengan smooth scrolling
  - Shadow gradient muncul di kiri saat bisa scroll ke kiri
  - Shadow gradient muncul di kanan saat bisa scroll ke kanan
  - Auto-hide scrollbar untuk tampilan clean
  - Responsive dan mobile-friendly

- ✅ **Category Filtering**
  - Filter produk by category dengan real-time update
  - "Semua Produk" button untuk show all products
  - Active state visual feedback pada kategori terpilih
  - Integration dengan search query (kombinasi filter)

#### Modular Structure
- ✅ Feature-based modular architecture
- ✅ Products module (types, services, hooks, components)
- ✅ Categories module (types, services, hooks)
- ✅ Transactions module (types, services, hooks)
- ✅ POS module (UI components)
- ✅ Centralized API configuration
- ✅ Barrel exports untuk clean imports

#### UI Improvements
- ✅ Header: Logo dihapus, icons ke full kanan
- ✅ Horizontal category scroll dengan shadow
- ✅ Loading states untuk products dan categories
- ✅ Error handling untuk API failures
- ✅ Empty states untuk no products found

#### Payment Modal Enhancements
- ✅ **Keypad Cepat dihapus** - Input manual lebih cepat
- ✅ **Default customer name** - "Umum" otomatis terisi
- ✅ **Auto-focus** - Cursor langsung ke input jumlah bayar
- ✅ **Auto-select** - Text otomatis terselect untuk ganti cepat
- ✅ **Currency formatting** - Format Rp dengan separator (19.000)
- ✅ **Prefix Rp** - Tampilan "Rp" di input untuk clarity
- ✅ **Enter key support** - Tekan Enter untuk proses bayar
- ✅ **Keyboard-friendly** - Full keyboard navigation

### Technical Details

#### Files Modified
- `src/pages/POSPage.tsx` - Added categories integration & horizontal scroll
- `src/features/categories/types/index.ts` - Updated to match backend entity
- `src/index.css` - Added scrollbar-hide utility class
- `src/components/Header.tsx` - Removed logo, moved icons to right

#### Files Created
- `src/features/products/` - Complete products module
- `src/features/categories/` - Complete categories module
- `src/features/transactions/` - Complete transactions module
- `src/features/pos/` - POS components module
- `src/config/api.ts` - Centralized API configuration
- `STRUCTURE.md` - Architecture documentation
- `QUICK_REFERENCE.md` - Developer quick reference
- `CHANGELOG.md` - This file

### Dependencies
- No new dependencies added
- Using existing React Query for data fetching
- Using existing Tailwind CSS for styling

### API Integration
- Backend: NestJS (`http://127.0.0.1:3000`)
- Endpoints used:
  - `GET /products` - Fetch all products
  - `GET /categories` - Fetch all categories
- CORS configured for local development

### Performance
- React Query caching: 5 minutes stale time
- Lazy rendering for large product lists
- Optimized re-renders with proper state management
- Smooth scroll with CSS scroll-behavior

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

---

## Future Updates

### Planned Features
- [ ] Barcode scanning
- [ ] Print receipt
- [ ] Transaction history with filters
- [ ] Product CRUD interface
- [ ] Category CRUD interface
- [ ] Dashboard & Analytics
- [ ] Multi-user support
- [ ] Dark mode
- [ ] Export data (Excel/PDF)

### Known Issues
- None reported

---

**Note:** This project follows semantic versioning.
