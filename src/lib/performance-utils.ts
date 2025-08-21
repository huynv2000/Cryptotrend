export interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    firstPaint: number;
    firstContentfulPaint: number;
    domInteractive: number;
    loadComplete: number;
  };
  rendering: {
    fps: number;
    droppedFrames: number;
  };
  network: {
    requests: number;
    transferSize: number;
    loadTime: number;
  };
}

export interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  type: 'measure' | 'mark';
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private observers = new Map<string, ResizeObserver>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private frameId: number | null = null;
  private metrics: PerformanceMetrics | null = null;
  private performanceEntries: PerformanceEntry[] = [];
  private isMonitoring = false;

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  constructor() {
    this.initializeMetrics();
    this.setupPerformanceMonitoring();
  }

  // Performance monitoring setup
  private initializeMetrics(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.metrics = {
        memoryUsage: this.getMemoryUsage(),
        timing: this.getTimingMetrics(),
        rendering: {
          fps: 60,
          droppedFrames: 0
        },
        network: this.getNetworkMetrics()
      };
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor frame rate
    this.monitorFrameRate();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Setup performance observers
    this.setupPerformanceObservers();
  }

  // Memory usage monitoring
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof (window as any).performance === 'undefined' || 
        typeof (window as any).performance.memory === 'undefined') {
      return { used: 0, total: 0, percentage: 0 };
    }

    const memory = (window as any).performance.memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return { used, total, percentage };
  }

  private monitorMemoryUsage(): void {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (this.metrics) {
        this.metrics.memoryUsage = this.getMemoryUsage();
        
        // Warn if memory usage is high
        if (this.metrics.memoryUsage.percentage > 80) {
          console.warn('High memory usage detected:', this.metrics.memoryUsage.percentage.toFixed(2) + '%');
        }
      }
    }, 5000); // Check every 5 seconds

    this.intervals.set('memory-monitor', interval);
  }

  // Timing metrics
  private getTimingMetrics(): PerformanceMetrics['timing'] {
    if (typeof performance === 'undefined') {
      return {
        firstPaint: 0,
        firstContentfulPaint: 0,
        domInteractive: 0,
        loadComplete: 0
      };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      firstPaint: this.getMetricByType('paint', 'first-paint'),
      firstContentfulPaint: this.getMetricByType('paint', 'first-contentful-paint'),
      domInteractive: navigation?.domInteractive || 0,
      loadComplete: navigation?.loadEventEnd || 0
    };
  }

  private getMetricByType(type: string, name: string): number {
    const entries = performance.getEntriesByType(type as PerformanceEntryType);
    const entry = entries.find(e => e.name === name);
    return entry ? entry.startTime : 0;
  }

  // Frame rate monitoring
  private monitorFrameRate(): void {
    if (typeof window === 'undefined') return;

    let lastTime = performance.now();
    let frames = 0;
    let droppedFrames = 0;

    const measureFrameRate = (currentTime: number) => {
      frames++;
      
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) { // Measure every second
        const fps = Math.round((frames * 1000) / deltaTime);
        
        if (this.metrics) {
          this.metrics.rendering.fps = fps;
          this.metrics.rendering.droppedFrames = droppedFrames;
        }

        // Log poor performance
        if (fps < 30) {
          console.warn('Low frame rate detected:', fps + ' FPS');
        }

        frames = 0;
        droppedFrames = 0;
        lastTime = currentTime;
      }

      this.frameId = requestAnimationFrame(measureFrameRate);
    };

    this.frameId = requestAnimationFrame(measureFrameRate);
  }

  // Network performance monitoring
  private getNetworkMetrics(): PerformanceMetrics['network'] {
    if (typeof performance === 'undefined') {
      return { requests: 0, transferSize: 0, loadTime: 0 };
    }

    const resources = performance.getEntriesByType('resource');
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      requests: resources.length,
      transferSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0
    };
  }

  private monitorNetworkPerformance(): void {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (this.metrics) {
        this.metrics.network = this.getNetworkMetrics();
      }
    }, 10000); // Check every 10 seconds

    this.intervals.set('network-monitor', interval);
  }

  // Performance observers
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn('Long task detected:', entry.duration + 'ms', entry.name);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task observer not supported');
    }

    // Observe layout shifts
    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn('Layout shift detected:', (entry as any).value);
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('Layout shift observer not supported');
    }
  }

  // Public utility methods

  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    key: string
  ): T {
    return ((...args: Parameters<T>) => {
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key)!);
      }

      this.timeouts.set(key, setTimeout(() => {
        func(...args);
        this.timeouts.delete(key);
      }, wait));
    }) as T;
  }

  // Throttle function for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
    key: string
  ): T {
    let inThrottle = false;

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        this.timeouts.set(key, setTimeout(() => {
          inThrottle = false;
        }, limit));
      }
    }) as T;
  }

  // Request animation frame for smooth animations
  raf(callback: () => void): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = requestAnimationFrame(() => {
      callback();
      this.frameId = null;
    });
  }

  // Create resize observer with cleanup
  createResizeObserver(
    key: string,
    element: Element,
    callback: ResizeObserverCallback,
    options?: ResizeObserverOptions
  ): void {
    const observer = new ResizeObserver(
      this.debounce(callback, 100, `${key}-resize`)
    );

    observer.observe(element, options);
    this.observers.set(key, observer);
  }

  // Performance measurement
  measure(name: string, callback: () => void): void {
    if (typeof performance === 'undefined') {
      callback();
      return;
    }

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-measure`;

    performance.mark(startMark);
    callback();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measures = performance.getEntriesByName(measureName);
    if (measures.length > 0) {
      const measure = measures[measures.length - 1];
      this.performanceEntries.push({
        name: measureName,
        duration: measure.duration,
        startTime: measure.startTime,
        type: 'measure'
      });

      console.log(`Performance measure "${name}": ${measure.duration.toFixed(2)}ms`);
    }

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics | null {
    return this.metrics ? { ...this.metrics } : null;
  }

  // Get performance entries
  getPerformanceEntries(): PerformanceEntry[] {
    return [...this.performanceEntries];
  }

  // Clear performance entries
  clearPerformanceEntries(): void {
    this.performanceEntries = [];
  }

  // Start performance monitoring
  startMonitoring(): void {
    this.isMonitoring = true;
    console.log('Performance monitoring started');
  }

  // Stop performance monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  // Generate performance report
  generateReport(): {
    summary: string;
    metrics: PerformanceMetrics | null;
    recommendations: string[];
    issues: string[];
  } {
    const recommendations: string[] = [];
    const issues: string[] = [];

    if (!this.metrics) {
      return {
        summary: 'Performance metrics not available',
        metrics: null,
        recommendations,
        issues
      };
    }

    // Memory analysis
    if (this.metrics.memoryUsage.percentage > 80) {
      issues.push('High memory usage detected');
      recommendations.push('Consider implementing memory cleanup or data pagination');
    }

    // Frame rate analysis
    if (this.metrics.rendering.fps < 30) {
      issues.push('Low frame rate detected');
      recommendations.push('Optimize rendering performance or reduce animation complexity');
    }

    // Network analysis
    if (this.metrics.network.transferSize > 5 * 1024 * 1024) { // 5MB
      issues.push('Large network transfer size');
      recommendations.push('Implement data compression or lazy loading');
    }

    // Timing analysis
    if (this.metrics.timing.firstContentfulPaint > 2000) {
      issues.push('Slow first contentful paint');
      recommendations.push('Optimize critical rendering path');
    }

    const summary = issues.length === 0 ? 
      'Performance is good' : 
      `${issues.length} performance issue(s) detected`;

    return {
      summary,
      metrics: { ...this.metrics },
      recommendations,
      issues
    };
  }

  // Cleanup resources
  cleanup(key?: string): void {
    // Clean up specific observer
    if (key && this.observers.has(key)) {
      this.observers.get(key)!.disconnect();
      this.observers.delete(key);
    }

    // Clean up specific timeout
    if (key && this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }

    // Clean up specific interval
    if (key && this.intervals.has(key)) {
      clearInterval(this.intervals.get(key)!);
      this.intervals.delete(key);
    }

    // Clean up all resources if no key specified
    if (!key) {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
      
      this.timeouts.forEach(timeout => clearTimeout(timeout));
      this.timeouts.clear();
      
      this.intervals.forEach(interval => clearInterval(interval));
      this.intervals.clear();
      
      if (this.frameId) {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }
    }
  }

  // Destroy the performance manager
  destroy(): void {
    this.cleanup();
    this.isMonitoring = false;
    this.metrics = null;
    this.performanceEntries = [];
    console.log('PerformanceManager destroyed');
  }
}

// Export a singleton instance for easy use
export const performanceManager = PerformanceManager.getInstance();

// Utility functions for common performance optimizations
export const PerformanceUtils = {
  // Lazy load images
  lazyLoadImages: (selector: string = 'img[data-src]') => {
    if (typeof window === 'undefined') return;

    const images = document.querySelectorAll(selector);
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Preload critical resources
  preloadResources: (resources: string[]) => {
    if (typeof window === 'undefined') return;

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.js') ? 'script' : 'style';
      document.head.appendChild(link);
    });
  },

  // Debounced scroll handler
  createScrollHandler: (callback: () => void, delay: number = 100) => {
    return performanceManager.debounce(callback, delay, 'scroll-handler');
  },

  // Throttled resize handler
  createResizeHandler: (callback: () => void, delay: number = 100) => {
    return performanceManager.throttle(callback, delay, 'resize-handler');
  }
};