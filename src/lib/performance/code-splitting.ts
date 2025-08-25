/**
 * Code Splitting Implementation
 * 
 * This system implements dynamic imports for heavy components and route-level splitting
 * to optimize bundle size and improve loading performance.
 */

import { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import { RouteObject } from 'react-router-dom';

interface CodeSplitConfig {
  chunkSize: number;
  preloadStrategy: 'none' | 'hover' | 'viewport' | 'all';
  loadingComponent: ComponentType;
  errorComponent: ComponentType;
  retryCount: number;
  retryDelay: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  preloadRequested: boolean;
}

interface SplitRoute {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  chunkName: string;
  preload: () => Promise<void>;
  chunkInfo: ChunkInfo;
}

class CodeSplittingManager {
  private config: CodeSplitConfig;
  private chunks: Map<string, ChunkInfo> = new Map();
  private preloadQueue: Set<string> = new Set();
  private intersectionObserver: IntersectionObserver | null = null;
  private hoverListeners: Map<string, Set<HTMLElement>> = new Map();

  constructor(config: Partial<CodeSplitConfig> = {}) {
    this.config = {
      chunkSize: 100 * 1024, // 100KB
      preloadStrategy: 'viewport',
      loadingComponent: () => 'Loading...',
      errorComponent: ({ error }: { error: Error }) => `Failed to load component: ${error.message}`,
      retryCount: 3,
      retryDelay: 1000,
      ...config
    };

    this.initializePreloadStrategy();
  }

  private initializePreloadStrategy(): void {
    if (typeof window === 'undefined') return;

    switch (this.config.preloadStrategy) {
      case 'viewport':
        this.initializeViewportPreloading();
        break;
      case 'hover':
        this.initializeHoverPreloading();
        break;
      case 'all':
        this.initializeAllPreloading();
        break;
    }
  }

  private initializeViewportPreloading(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chunkName = entry.target.getAttribute('data-chunk-name');
            if (chunkName) {
              this.preloadChunk(chunkName);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );
  }

  private initializeHoverPreloading(): void {
    // Hover preloading will be handled per component
  }

  private initializeAllPreloading(): void {
    // Preload all chunks when idle
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this.preloadAllChunks();
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        this.preloadAllChunks();
      }, 2000);
    }
  }

  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    chunkName: string
  ): LazyExoticComponent<T> {
    // Initialize chunk info
    this.chunks.set(chunkName, {
      name: chunkName,
      size: 0, // Will be updated when loaded
      loaded: false,
      loading: false,
      error: null,
      preloadRequested: false
    });

    const LazyComponent = lazy(() => this.loadWithRetry(importFn, chunkName));

    // Add preload method to the component
    (LazyComponent as any).preload = () => this.preloadChunk(chunkName);
    (LazyComponent as any).chunkName = chunkName;

    return LazyComponent;
  }

  private async loadWithRetry<T>(
    importFn: () => Promise<{ default: T }>,
    chunkName: string
  ): Promise<{ default: T }> {
    const chunkInfo = this.chunks.get(chunkName);
    if (!chunkInfo) {
      throw new Error(`Chunk ${chunkName} not found`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        chunkInfo.loading = true;
        chunkInfo.error = null;

        const startTime = performance.now();
        const importedModule = await importFn();
        const loadTime = performance.now() - startTime;

        // Update chunk info
        chunkInfo.loaded = true;
        chunkInfo.loading = false;
        chunkInfo.size = this.estimateChunkSize(importedModule);

        console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms, size: ${this.formatBytes(chunkInfo.size)}`);

        return importedModule;
      } catch (error) {
        lastError = error as Error;
        chunkInfo.error = error instanceof Error ? error.message : String(error);
        chunkInfo.loading = false;

        console.warn(`Attempt ${attempt} failed for chunk ${chunkName}:`, error);

        if (attempt < this.config.retryCount) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error(`Failed to load chunk ${chunkName} after ${this.config.retryCount} attempts`);
  }

  private estimateChunkSize(module: any): number {
    // Estimate chunk size based on the module content
    try {
      const jsonString = JSON.stringify(module);
      return new Blob([jsonString]).size;
    } catch {
      return this.config.chunkSize; // Fallback to default size
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  preloadChunk(chunkName: string): Promise<void> {
    const chunkInfo = this.chunks.get(chunkName);
    if (!chunkInfo || chunkInfo.loaded || chunkInfo.loading || chunkInfo.preloadRequested) {
      return Promise.resolve();
    }

    chunkInfo.preloadRequested = true;

    // Add to preload queue
    this.preloadQueue.add(chunkName);

    // Process preload queue
    return this.processPreloadQueue();
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.size === 0) return;

    const chunkName = this.preloadQueue.values().next().value;
    this.preloadQueue.delete(chunkName);

    const chunkInfo = this.chunks.get(chunkName);
    if (!chunkInfo || chunkInfo.loaded || chunkInfo.loading) {
      return;
    }

    try {
      // Simulate preload by triggering the import
      // In a real implementation, this would use webpack's magic comments or similar
      console.log(`Preloading chunk: ${chunkName}`);
      
      // Here you would implement actual preloading logic
      // For now, we'll just mark it as preloaded
      chunkInfo.preloadRequested = true;
    } catch (error) {
      console.error(`Failed to preload chunk ${chunkName}:`, error);
    }
  }

  preloadAllChunks(): void {
    const allChunks = Array.from(this.chunks.keys());
    allChunks.forEach(chunkName => this.preloadChunk(chunkName));
  }

  createSplitRoute<T extends ComponentType<any>>(
    path: string,
    importFn: () => Promise<{ default: T }>,
    chunkName: string
  ): SplitRoute {
    const component = this.createLazyComponent(importFn, chunkName);
    const chunkInfo = this.chunks.get(chunkName)!;

    return {
      path,
      component,
      chunkName,
      preload: () => this.preloadChunk(chunkName),
      chunkInfo
    };
  }

  createRouteWithSuspense<T extends ComponentType<any>>(
    path: string,
    importFn: () => Promise<{ default: T }>,
    chunkName: string,
    fallback?: ComponentType
  ): RouteObject {
    const LazyComponent = this.createLazyComponent(importFn, chunkName);
    const LoadingComponent = fallback || this.config.loadingComponent;

    return {
      path,
      element: null // This would be implemented in a React component file
    };
  }

  setupHoverPreloading(element: HTMLElement, chunkName: string): void {
    if (this.config.preloadStrategy !== 'hover') return;

    if (!this.hoverListeners.has(chunkName)) {
      this.hoverListeners.set(chunkName, new Set());
    }

    const listeners = this.hoverListeners.get(chunkName)!;
    listeners.add(element);

    const handleMouseEnter = () => {
      this.preloadChunk(chunkName);
    };

    element.addEventListener('mouseenter', handleMouseEnter);

    // Store cleanup function
    (element as any).__cleanupHoverPreload = () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      listeners.delete(element);
      if (listeners.size === 0) {
        this.hoverListeners.delete(chunkName);
      }
    };
  }

  setupViewportPreloading(element: HTMLElement, chunkName: string): void {
    if (this.config.preloadStrategy !== 'viewport' || !this.intersectionObserver) return;

    element.setAttribute('data-chunk-name', chunkName);
    this.intersectionObserver.observe(element);

    // Store cleanup function
    (element as any).__cleanupViewportPreload = () => {
      this.intersectionObserver?.unobserve(element);
      element.removeAttribute('data-chunk-name');
    };
  }

  cleanup(element: HTMLElement): void {
    if ((element as any).__cleanupHoverPreload) {
      (element as any).__cleanupHoverPreload();
    }
    if ((element as any).__cleanupViewportPreload) {
      (element as any).__cleanupViewportPreload();
    }
  }

  getChunkInfo(chunkName: string): ChunkInfo | undefined {
    return this.chunks.get(chunkName);
  }

  getAllChunksInfo(): ChunkInfo[] {
    return Array.from(this.chunks.values());
  }

  getStats() {
    const chunks = Array.from(this.chunks.values());
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const loadedSize = chunks.reduce((sum, chunk) => sum + (chunk.loaded ? chunk.size : 0), 0);
    const loadedCount = chunks.filter(chunk => chunk.loaded).length;

    return {
      totalChunks: chunks.length,
      loadedChunks: loadedCount,
      totalSize,
      loadedSize,
      loadProgress: totalSize > 0 ? (loadedSize / totalSize) * 100 : 0,
      averageChunkSize: chunks.length > 0 ? totalSize / chunks.length : 0
    };
  }

  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Clean up hover listeners
    this.hoverListeners.forEach((listeners, chunkName) => {
      listeners.forEach(element => {
        if ((element as any).__cleanupHoverPreload) {
          (element as any).__cleanupHoverPreload();
        }
      });
    });
    this.hoverListeners.clear();

    this.chunks.clear();
    this.preloadQueue.clear();
  }
}

// Create default instance
export const codeSplittingManager = new CodeSplittingManager();

// Utility functions
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string
): LazyExoticComponent<T> {
  return codeSplittingManager.createLazyComponent(importFn, chunkName);
}

export function createSplitRoute<T extends ComponentType<any>>(
  path: string,
  importFn: () => Promise<{ default: T }>,
  chunkName: string
): SplitRoute {
  return codeSplittingManager.createSplitRoute(path, importFn, chunkName);
}

export function createRouteWithSuspense<T extends ComponentType<any>>(
  path: string,
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  fallback?: ComponentType
): RouteObject {
  return codeSplittingManager.createRouteWithSuspense(path, importFn, chunkName, fallback);
}

// React hooks
export function useChunkInfo(chunkName: string): ChunkInfo | undefined {
  // This would typically use React context or state management
  // For now, we'll return the chunk info directly
  return codeSplittingManager.getChunkInfo(chunkName);
}

export function useCodeSplittingStats() {
  // This would typically use React context or state management
  // For now, we'll return the stats directly
  return codeSplittingManager.getStats();
}

// Higher-order components
export function withCodeSplitting<P extends object>(
  WrappedComponent: ComponentType<P>,
  chunkName: string
): ComponentType<P> {
  const LazyWrappedComponent = lazy(() => Promise.resolve({ default: WrappedComponent }));
  
  const WithCodeSplitting: ComponentType<P> = (props) => {
    // This would be implemented in a React component file
    return null;
  };

  return WithCodeSplitting;
}

export { CodeSplittingManager };
export type { CodeSplitConfig, ChunkInfo, SplitRoute };