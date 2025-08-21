/**
 * Memory Optimization Utilities
 * 
 * This module provides utilities for optimizing memory usage in the application,
 * including garbage collection hints, memory leak detection, and resource cleanup.
 */

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  limit?: number;
}

export interface MemoryLeak {
  id: string;
  type: 'event-listener' | 'timer' | 'observer' | 'dom-reference' | 'closure';
  element?: string;
  location: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemorySnapshot {
  timestamp: number;
  usage: MemoryUsage;
  leaks: MemoryLeak[];
  heapSize: number;
  domNodes: number;
  eventListeners: number;
}

export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private snapshots: MemorySnapshot[] = [];
  private leaks: MemoryLeak[] = [];
  private cleanupCallbacks = new Map<string, () => void>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private thresholds = {
    warning: 70, // 70% memory usage warning
    critical: 85, // 85% memory usage critical
    maxSnapshots: 50, // Keep last 50 snapshots
    monitoringInterval: 30000, // Check every 30 seconds
  };

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  constructor() {
    this.initializeMemoryTracking();
  }

  /**
   * Initialize memory tracking and monitoring
   */
  private initializeMemoryTracking(): void {
    if (typeof window === 'undefined') return;

    // Set up memory monitoring if available
    if ('memory' in (window as any).performance) {
      this.startMonitoring();
    }

    // Listen for memory pressure events (if available)
    if ('addEventListener' in window) {
      window.addEventListener('memorypressure', this.handleMemoryPressure.bind(this));
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in (window as any).performance)) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const memory = (window as any).performance.memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return { used, total, percentage, limit };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.detectMemoryLeaks();
      this.takeSnapshot();
    }, this.thresholds.monitoringInterval);

    console.log('Memory optimization monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Memory optimization monitoring stopped');
  }

  /**
   * Check memory usage and trigger warnings if needed
   */
  private checkMemoryUsage(): void {
    const usage = this.getMemoryUsage();

    if (usage.percentage >= this.thresholds.critical) {
      console.error('CRITICAL: Memory usage at', usage.percentage.toFixed(2) + '%');
      this.triggerGarbageCollection();
      this.cleanup();
    } else if (usage.percentage >= this.thresholds.warning) {
      console.warn('WARNING: Memory usage at', usage.percentage.toFixed(2) + '%');
      this.suggestCleanup();
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (typeof window === 'undefined') return;

    // Check for excessive DOM nodes
    const domNodes = document.querySelectorAll('*').length;
    if (domNodes > 5000) {
      this.reportLeak({
        id: `dom-nodes-${Date.now()}`,
        type: 'dom-reference',
        location: 'document',
        timestamp: Date.now(),
        severity: 'medium'
      });
    }

    // Check for excessive event listeners (approximate)
    const eventListeners = this.estimateEventListeners();
    if (eventListeners > 1000) {
      this.reportLeak({
        id: `event-listeners-${Date.now()}`,
        type: 'event-listener',
        location: 'window',
        timestamp: Date.now(),
        severity: 'high'
      });
    }

    // Check for orphaned timers
    this.checkOrphanedTimers();
  }

  /**
   * Estimate number of event listeners (approximate)
   */
  private estimateEventListeners(): number {
    if (typeof window === 'undefined') return 0;

    // This is an approximation - actual event listener counting is complex
    let count = 0;
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      // Check for common event listener properties
      const events = ['onclick', 'onload', 'onerror', 'onchange', 'onsubmit'];
      events.forEach(event => {
        if ((element as any)[event]) count++;
      });
    });

    return count;
  }

  /**
   * Check for orphaned timers
   */
  private checkOrphanedTimers(): void {
    // This is a simplified check - in a real implementation,
    // you would track all timers and check if they're still needed
    const now = Date.now();
    const oldTimers = Array.from(this.cleanupCallbacks.keys())
      .filter(key => {
        const timestamp = parseInt(key.split('-')[1]);
        return now - timestamp > 300000; // 5 minutes old
      });

    if (oldTimers.length > 10) {
      this.reportLeak({
        id: `orphaned-timers-${Date.now()}`,
        type: 'timer',
        location: 'global',
        timestamp: Date.now(),
        severity: 'medium'
      });
    }
  }

  /**
   * Report a memory leak
   */
  private reportLeak(leak: MemoryLeak): void {
    this.leaks.push(leak);
    console.warn('Memory leak detected:', leak);

    // Keep only recent leaks
    if (this.leaks.length > 100) {
      this.leaks = this.leaks.slice(-50);
    }
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usage: this.getMemoryUsage(),
      leaks: [...this.leaks],
      heapSize: this.getMemoryUsage().used,
      domNodes: document.querySelectorAll('*').length,
      eventListeners: this.estimateEventListeners()
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.thresholds.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.thresholds.maxSnapshots);
    }
  }

  /**
   * Handle memory pressure events
   */
  private handleMemoryPressure(event: Event): void {
    console.warn('Memory pressure event received:', event);
    this.triggerGarbageCollection();
    this.cleanup();
  }

  /**
   * Suggest cleanup actions
   */
  private suggestCleanup(): void {
    console.log('Memory optimization suggestions:');
    console.log('- Consider clearing caches');
    console.log('- Remove unused event listeners');
    console.log('- Clean up DOM references');
    console.log('- Consider data pagination');
  }

  /**
   * Trigger garbage collection (if available)
   */
  private triggerGarbageCollection(): void {
    // Note: Manual garbage collection is not available in most browsers
    // This is mainly for development environments
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('Manual garbage collection triggered');
    } else {
      // Suggest garbage collection through memory pressure
      if ('performance' in window && 'memory' in (window as any).performance) {
        // Force some memory cleanup by creating and releasing objects
        const temp = [];
        for (let i = 0; i < 1000; i++) {
          temp.push({});
        }
        temp.length = 0;
      }
    }
  }

  /**
   * Register a cleanup callback
   */
  registerCleanup(id: string, callback: () => void): void {
    this.cleanupCallbacks.set(`${id}-${Date.now()}`, callback);
  }

  /**
   * Unregister a cleanup callback
   */
  unregisterCleanup(id: string): void {
    const keys = Array.from(this.cleanupCallbacks.keys()).filter(key => key.startsWith(id));
    keys.forEach(key => this.cleanupCallbacks.delete(key));
  }

  /**
   * Execute all cleanup callbacks
   */
  cleanup(): void {
    console.log('Executing memory cleanup...');
    
    // Execute all cleanup callbacks
    this.cleanupCallbacks.forEach((callback, key) => {
      try {
        callback();
        this.cleanupCallbacks.delete(key);
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    // Clear old snapshots
    this.snapshots = this.snapshots.slice(-10);

    // Clear old leaks
    this.leaks = this.leaks.slice(-10);

    console.log('Memory cleanup completed');
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    currentUsage: MemoryUsage;
    snapshots: MemorySnapshot[];
    leaks: MemoryLeak[];
    monitoring: boolean;
  } {
    return {
      currentUsage: this.getMemoryUsage(),
      snapshots: [...this.snapshots],
      leaks: [...this.leaks],
      monitoring: this.isMonitoring
    };
  }

  /**
   * Generate memory optimization report
   */
  generateReport(): {
    summary: string;
    usage: MemoryUsage;
    issues: string[];
    recommendations: string[];
    leaks: MemoryLeak[];
  } {
    const usage = this.getMemoryUsage();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze memory usage
    if (usage.percentage >= this.thresholds.critical) {
      issues.push('Critical memory usage detected');
      recommendations.push('Immediate cleanup required');
      recommendations.push('Consider restarting the application');
    } else if (usage.percentage >= this.thresholds.warning) {
      issues.push('High memory usage detected');
      recommendations.push('Perform cleanup operations');
      recommendations.push('Check for memory leaks');
    }

    // Analyze leaks
    if (this.leaks.length > 0) {
      issues.push(`${this.leaks.length} potential memory leaks detected`);
      recommendations.push('Review and fix memory leaks');
      recommendations.push('Implement proper cleanup patterns');
    }

    // Analyze snapshots trend
    if (this.snapshots.length > 5) {
      const recent = this.snapshots.slice(-5);
      const isIncreasing = recent.every((snap, i) => 
        i === 0 || snap.heapSize > recent[i - 1].heapSize
      );

      if (isIncreasing) {
        issues.push('Memory usage trending upward');
        recommendations.push('Investigate memory growth pattern');
      }
    }

    const summary = issues.length === 0 ? 
      'Memory usage is healthy' : 
      `${issues.length} memory issue(s) detected`;

    return {
      summary,
      usage,
      issues,
      recommendations,
      leaks: [...this.leaks]
    };
  }

  /**
   * Optimize memory for specific scenarios
   */
  optimizeForScenario(scenario: 'navigation' | 'data-load' | 'chart-render' | 'idle'): void {
    switch (scenario) {
      case 'navigation':
        this.cleanup();
        this.triggerGarbageCollection();
        break;
      case 'data-load':
        // Clear old data caches
        this.cleanup();
        break;
      case 'chart-render':
        // Optimize for rendering performance
        this.triggerGarbageCollection();
        break;
      case 'idle':
        // Aggressive cleanup during idle time
        this.cleanup();
        if (this.getMemoryUsage().percentage > 50) {
          this.triggerGarbageCollection();
        }
        break;
    }
  }

  /**
   * Destroy the memory optimizer
   */
  destroy(): void {
    this.stopMonitoring();
    this.cleanup();
    this.snapshots = [];
    this.leaks = [];
    this.cleanupCallbacks.clear();
    console.log('MemoryOptimizer destroyed');
  }
}

// Export singleton instance
export const memoryOptimizer = MemoryOptimizer.getInstance();

// Utility functions for common memory optimizations
export const MemoryUtils = {
  /**
   * Create a memory-efficient debounced function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
  ): T {
    let timeout: NodeJS.Timeout | null = null;
    let lastCall = 0;

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (options.leading && now - lastCall >= wait) {
        func(...args);
        lastCall = now;
      }
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        if (options.trailing !== false) {
          func(...args);
        }
        lastCall = Date.now();
        timeout = null;
      }, wait);
    }) as T;
  },

  /**
   * Create a memory-efficient throttled function
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T {
    let inThrottle = false;
    let lastCall = 0;

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (!inThrottle || now - lastCall >= limit) {
        func(...args);
        lastCall = now;
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    }) as T;
  },

  /**
   * Create a memory-efficient event listener with automatic cleanup
   */
  createEventListener<K extends keyof WindowEventMap>(
    target: EventTarget,
    event: K,
    handler: (this: EventTarget, ev: WindowEventMap[K]) => any,
    options?: AddEventListenerOptions
  ): () => void {
    target.addEventListener(event, handler, options);
    
    return () => {
      target.removeEventListener(event, handler, options);
    };
  },

  /**
   * Create a memory-efficient interval with automatic cleanup
   */
  createInterval(
    callback: () => void,
    delay: number
  ): () => void {
    const interval = setInterval(callback, delay);
    
    return () => {
      clearInterval(interval);
    };
  },

  /**
   * Create a memory-efficient timeout with automatic cleanup
   */
  createTimeout(
    callback: () => void,
    delay: number
  ): () => void {
    const timeout = setTimeout(callback, delay);
    
    return () => {
      clearTimeout(timeout);
    };
  },

  /**
   * Optimize array operations for memory
   */
  optimizeArray<T>(array: T[], maxSize: number = 1000): T[] {
    if (array.length <= maxSize) return array;
    
    // Keep the most recent items
    return array.slice(-maxSize);
  },

  /**
   * Clear object properties to free memory
   */
  clearObject(obj: Record<string, any>): void {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    });
  },

  /**
   * Create a weak map for storing object references
   */
  createWeakMap<K extends object, V>(): WeakMap<K, V> {
    return new WeakMap<K, V>();
  },

  /**
   * Create a weak set for storing object references
   */
  createWeakSet<T extends object>(): WeakSet<T> {
    return new WeakSet<T>();
  }
};