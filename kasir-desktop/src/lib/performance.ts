/**
 * Performance Optimization Utilities
 * Helper functions untuk meningkatkan performance POS system
 */

/**
 * Preload critical API endpoint
 * Call this saat app init untuk warm up connection
 */
export function preloadAPIConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";


  if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = apiUrl;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
}

/**
 * Prefetch low-priority resources
 * Call after initial load selesai
 */
export function prefetchLowPriorityResources() {



  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => {


    });
  }
}

/**
 * Performance observer untuk monitoring
 * Optional: untuk debugging di development
 */
export function setupPerformanceMonitoring() {
  if (typeof window === "undefined" || import.meta.env.PROD) return;


  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "paint") {

          }
        }
      });
      observer.observe({ entryTypes: ["paint"] });
    } catch (error) {
    }
  }
}

/**
 * Lazy load images dengan Intersection Observer
 * Usage: <img data-src="image.jpg" class="lazy" />
 */
export function setupLazyImages() {
  if (typeof window === "undefined") return;

  const lazyImages = document.querySelectorAll("img.lazy");

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.remove("lazy");
            imageObserver.unobserve(img);
          }
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {

    lazyImages.forEach((img: Element) => {
      const htmlImg = img as HTMLImageElement;
      const src = htmlImg.dataset.src;
      if (src) htmlImg.src = src;
    });
  }
}

/**
 * Debounce function untuk search/filter
 * Usage: const debouncedSearch = debounce(searchFunction, 300);
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function untuk scroll/resize events
 * Usage: const throttledScroll = throttle(scrollFunction, 100);
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Cache API responses di memory
 * Simple in-memory cache dengan TTL
 */
class SimpleCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  set(key: string, data: unknown) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);

    if (!item) return null;


    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache(5); // 5 minutes TTL
