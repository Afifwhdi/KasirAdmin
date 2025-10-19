/**
 * Memory Monitor untuk Electron App
 * Deteksi memory leaks dan trigger cleanup otomatis
 */

const { app } = require('electron');

const MEMORY_THRESHOLD_MB = 500; // Alert jika memory > 500MB
const CHECK_INTERVAL_MS = 60000; // Check setiap 1 menit

class MemoryMonitor {
  constructor() {
    this.intervalId = null;
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) {
      console.warn('[Memory Monitor] Already monitoring');
      return;
    }

    console.log('[Memory Monitor] Started');
    this.isMonitoring = true;

    this.intervalId = setInterval(() => {
      const memoryInfo = process.memoryUsage();
      const heapUsedMB = Math.round(memoryInfo.heapUsed / 1024 / 1024);
      const rssMB = Math.round(memoryInfo.rss / 1024 / 1024);

      console.log(`[Memory Monitor] Heap: ${heapUsedMB}MB | RSS: ${rssMB}MB`);

      // Trigger warning jika memory usage tinggi
      if (heapUsedMB > MEMORY_THRESHOLD_MB) {
        console.warn(`[Memory Monitor] HIGH MEMORY USAGE: ${heapUsedMB}MB`);
        
        // Force garbage collection jika tersedia
        if (global.gc) {
          console.log('[Memory Monitor] Triggering manual GC...');
          global.gc();
        }
      }
    }, CHECK_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('[Memory Monitor] Stopped');
  }

  getMemoryInfo() {
    const memoryInfo = process.memoryUsage();
    return {
      heapUsed: Math.round(memoryInfo.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryInfo.heapTotal / 1024 / 1024),
      rss: Math.round(memoryInfo.rss / 1024 / 1024),
      external: Math.round(memoryInfo.external / 1024 / 1024),
    };
  }
}

const memoryMonitor = new MemoryMonitor();

app.on('ready', () => {
  memoryMonitor.start();
});

app.on('before-quit', () => {
  memoryMonitor.stop();
});

module.exports = memoryMonitor;
