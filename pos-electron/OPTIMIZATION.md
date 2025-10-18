# POS Electron - Optimization Guide

## 🔧 Perbaikan yang Sudah Dilakukan

### 1. **Database Optimization (main.cjs)**

#### Problem:
- Memory leaks dari prepared statements yang tidak di-cleanup
- Query SELECT * tanpa LIMIT bisa fetch ribuan records
- Tidak ada database connection pooling
- Database tidak di-optimize

#### Solution:
```javascript
// ✅ Prepared statement caching dan cleanup
const preparedStatements = new Map();

function cleanupPreparedStatements() {
  for (const [key, stmt] of preparedStatements.entries()) {
    if (stmt && typeof stmt.finalize === 'function') {
      stmt.finalize();
    }
  }
  preparedStatements.clear();
}

// ✅ Auto-inject LIMIT untuk prevent memory overflow
if (modifiedSql.toUpperCase().startsWith('SELECT') && 
    !modifiedSql.toUpperCase().includes('LIMIT')) {
  modifiedSql += ' LIMIT 1000';
}

// ✅ WAL mode untuk better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('cache_size = -64000'); // 64MB cache
db.pragma('synchronous = NORMAL');

// ✅ Database indexes untuk faster queries
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
```

### 2. **Crash Recovery (main.cjs)**

#### Problem:
- Aplikasi crash tanpa recovery mechanism
- Tidak ada handler untuk unresponsive window

#### Solution:
```javascript
// ✅ Crash handler
mainWindow.webContents.on('crashed', () => {
  dialog.showMessageBox({
    type: 'error',
    title: 'Renderer Crashed',
    message: 'Do you want to reload?',
    buttons: ['Reload', 'Close']
  }).then((result) => {
    if (result.response === 0) mainWindow.reload();
  });
});

// ✅ Unresponsive handler
mainWindow.on('unresponsive', () => {
  dialog.showErrorBox('Application Unresponsive', 'Please restart.');
});
```

### 3. **Sync Service Optimization (sync-service.ts)**

#### Problem:
- Infinite loop potensial di while (true)
- Tidak ada timeout untuk HTTP requests
- Tidak ada retry mechanism
- Batch size terlalu besar (100 items)

#### Solution:
```typescript
// ✅ Safety limits
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_PAGES = 100; // Prevent infinite loop
const limit = 50; // Reduced from 100

// ✅ Retry dengan exponential backoff
while (retries < MAX_RETRIES) {
  try {
    response = await productsApi.getAll({ page, limit });
    break;
  } catch (error) {
    retries++;
    await new Promise(resolve => 
      setTimeout(resolve, Math.pow(2, retries) * 1000)
    );
  }
}

// ✅ Safety check untuk prevent infinite loop
while (page <= MAX_PAGES) {
  // ... sync logic
  
  if (!response.meta?.totalPages && page >= 10) {
    console.warn('Stopping after 10 pages');
    break;
  }
}
```

### 4. **Memory Monitoring**

#### New File: `electron/memory-monitor.cjs`
```javascript
// ✅ Auto memory monitoring
const MEMORY_THRESHOLD_MB = 500;

setInterval(() => {
  const heapUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  
  if (heapUsedMB > MEMORY_THRESHOLD_MB) {
    console.warn(`HIGH MEMORY: ${heapUsedMB}MB`);
    if (global.gc) global.gc(); // Force GC
  }
}, 60000);
```

---

## 🚀 Performance Tips

### 1. **Run dengan GC Exposed**
Enable manual garbage collection untuk testing:
```bash
npm run electron:dev -- --js-flags="--expose-gc"
```

### 2. **Build Production dengan Optimizations**
```bash
# Build with optimization flags
npm run build
npm run electron:build:win
```

### 3. **Monitor Memory Usage**
Di DevTools Console:
```javascript
// Check memory info
performance.memory

// Manual GC (jika --expose-gc enabled)
if (global.gc) global.gc()
```

---

## 📊 Database Query Best Practices

### ❌ Bad - No Limit
```typescript
await electronDB.query('SELECT * FROM products');
// Bisa fetch 10,000+ rows → Memory overflow
```

### ✅ Good - With Pagination
```typescript
await electronDB.query(
  'SELECT * FROM products LIMIT ? OFFSET ?',
  [50, 0]
);
```

### ✅ Better - With Index
```typescript
// Use indexed columns di WHERE
await electronDB.query(
  'SELECT * FROM products WHERE barcode = ? LIMIT 1',
  [barcode]
);
```

---

## 🔍 Troubleshooting

### App Sering Crash?
1. Check memory usage di Task Manager
2. Cek logs di: `%APPDATA%\pos-electron\logs\`
3. Run dengan DevTools open untuk lihat errors
4. Enable memory monitor

### Database Lock Error?
```javascript
// Solution: WAL mode sudah enabled
db.pragma('journal_mode = WAL');
```

### Sync Terlalu Lama?
- Reduce batch size di sync-service.ts
- Check network connection
- Implement incremental sync (sync only new/updated data)

---

## 📝 Maintenance Checklist

### Weekly
- [ ] Check memory logs
- [ ] Review crash reports
- [ ] Clear old database WAL files

### Monthly
- [ ] Vacuum database: `VACUUM;`
- [ ] Update dependencies
- [ ] Test build production

---

## 🎯 Future Improvements

1. **Incremental Sync**
   - Only sync data yang berubah sejak last sync
   - Implementasi `last_synced_at` timestamp

2. **Connection Pooling**
   - Untuk multiple concurrent requests

3. **Offline Queue**
   - Queue transactions saat offline
   - Auto-sync when back online

4. **Performance Metrics**
   - Track query execution time
   - Monitor render performance
   - Alert on slow queries

---

## 📚 Resources

- [Better SQLite3 Docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Electron Performance](https://www.electronjs.org/docs/latest/tutorial/performance)
- [V8 Memory Management](https://v8.dev/blog/trash-talk)
