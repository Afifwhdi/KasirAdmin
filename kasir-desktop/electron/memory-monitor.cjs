/**
 * Memory Monitor untuk Electron App
 * Deteksi memory leaks dan trigger cleanup otomatis
 */

const { app } = require("electron");

const MEMORY_THRESHOLD_MB = 500;
const CHECK_INTERVAL_MS = 60000;

class MemoryMonitor {
  constructor() {
    this.intervalId = null;
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) {

      return;
    }


    this.isMonitoring = true;

    this.intervalId = setInterval(() => {
      const memoryInfo = process.memoryUsage();
      const heapUsedMB = Math.round(memoryInfo.heapUsed / 1024 / 1024);
      const rssMB = Math.round(memoryInfo.rss / 1024 / 1024);



      if (heapUsedMB > MEMORY_THRESHOLD_MB) {


        if (global.gc) {

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

app.on("ready", () => {
  memoryMonitor.start();
});

app.on("before-quit", () => {
  memoryMonitor.stop();
});

module.exports = memoryMonitor;
