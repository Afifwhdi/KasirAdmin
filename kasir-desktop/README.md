# Kasir Desktop - DILLA CELL

Modern Point of Sale (POS) system with offline-first architecture, built with React + TypeScript + Vite.

## Features

### Core Features
- **Real-time Transaction Processing** - Fast checkout with barcode scanning support
- **Offline Mode** - Full functionality without internet connection
- **Multi-category Product Management** - Easy product organization
- **PLU (Price Look Up)** - Support for weighted products
- **Hold & Resume Transactions** - Pause and continue sales later
- **Payment Methods** - Cash and credit (bon) support

### Technical Features
- **Offline-First Architecture** - SQLite local database with API sync
- **Auto-Save Cart** - Never lose cart data with automatic backup
- **Bluetooth Thermal Printer** - Direct print support for 58mm/80mm printers
- **USB Printer Support** - Fallback to local printer via browser
- **Real-time Sync** - Background synchronization when online
- **Lazy Loading** - Optimized performance with code splitting

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Local Database**: SQLite (Electron mode)
- **Print**: Web Bluetooth API + Browser Print API

## Getting Started

### Prerequisites

```bash
Node.js 18+ 
npm or yarn
```

### Installation

```bash
# Clone repository
git clone <repository-url>

# Navigate to project
cd kasir-desktop

# Install dependencies
npm install

# Run development server
npm run dev
```

### Build for Production

```bash
# Build web version
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
kasir-desktop/
├── src/
│   ├── components/        # Reusable UI components
│   ├── features/          # Feature-based modules
│   │   ├── pos/          # POS specific components
│   │   ├── products/     # Product management
│   │   └── transactions/ # Transaction handling
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and business logic
│   ├── pages/            # Route pages
│   └── lib/              # Utilities and helpers
├── public/               # Static assets
└── dist/                 # Production build output
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://your-api-url/api
```

### Printer Setup

#### Bluetooth Printer (58mm/80mm)
1. Turn on printer (pairing mode - LED blinking)
2. Click printer icon in app header
3. Select printer from Bluetooth dialog
4. Pair and start printing

#### USB Printer
1. Connect printer via USB
2. Install printer driver if needed
3. Set as default printer in Windows
4. Print dialog will appear automatically

## Database

### SQLite (Offline Mode)
- Automatic local database creation
- Stores products, categories, and transactions
- Background sync when online

### Sync Operations
- **Download**: Pull data from server
- **Upload**: Push local transactions to server
- **Auto-sync**: Periodic background synchronization

## Browser Support

- ✅ Chrome 56+ (Recommended)
- ✅ Edge 79+
- ❌ Firefox (Web Bluetooth not supported)
- ❌ Safari (Web Bluetooth not supported)

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact:
- Store: DILLA CELL
- Location: Ngestikarya, Lampung Timur
- Phone: 088287013223
