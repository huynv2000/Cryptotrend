'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TVLDataPoint } from '@/lib/tvl-analysis-service';

interface ProgressiveChartProps {
  data: TVLDataPoint[];
  renderChunk: (chunk: TVLDataPoint[], index: number) => React.ReactNode;
  chunkSize?: number;
  height?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onLoadMore?: (loadedCount: number) => void;
  onChunkLoad?: (chunk: TVLDataPoint[], index: number) => void;
  threshold?: number;
  rootMargin?: string;
}

interface IntersectionObserverEntry {
  isIntersecting: boolean;
  target: Element;
}

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

function useIntersectionObserver(
  elementRef: React.RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setEntry(entry);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
        root: options.root || null
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options.threshold, options.rootMargin, options.root]);

  return entry;
}

export default function ProgressiveChart({
  data,
  renderChunk,
  chunkSize = 10,
  height = 400,
  className,
  loadingComponent,
  errorComponent,
  onLoadMore,
  onChunkLoad,
  threshold = 0.1,
  rootMargin = '100px'
}: ProgressiveChartProps) {
  const [visibleChunks, setVisibleChunks] = useState<Set<number>>(new Set([0]));
  const [renderedData, setRenderedData] = useState<TVLDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(observerRef, { threshold, rootMargin });

  // Calculate total chunks
  const totalChunks = Math.ceil(data.length / chunkSize);

  // Render chunks progressively
  const loadChunk = useCallback((chunkIndex: number) => {
    if (visibleChunks.has(chunkIndex) || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunkData = data.slice(start, end);

      // Update visible chunks
      const newVisibleChunks = new Set(visibleChunks);
      newVisibleChunks.add(chunkIndex);
      setVisibleChunks(newVisibleChunks);

      // Update rendered data
      const newRenderedData: TVLDataPoint[] = [];
      newVisibleChunks.forEach(index => {
        const chunkStart = index * chunkSize;
        const chunkEnd = Math.min(chunkStart + chunkSize, data.length);
        newRenderedData.push(...data.slice(chunkStart, chunkEnd));
      });
      
      setRenderedData(newRenderedData);

      // Callbacks
      onChunkLoad?.(chunkData, chunkIndex);
      onLoadMore?.(newRenderedData.length);

      // Check if we have more data to load
      setHasMore(chunkIndex < totalChunks - 1);

      console.log(`Loaded chunk ${chunkIndex}: ${chunkData.length} items, Total: ${newRenderedData.length}/${data.length}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading chunk:', err);
    } finally {
      setIsLoading(false);
    }
  }, [visibleChunks, hasMore, data, chunkSize, totalChunks, onChunkLoad, onLoadMore]);

  // Auto-load chunks when intersection observer triggers
  useEffect(() => {
    if (entry?.isIntersecting && !isLoading && hasMore) {
      const nextChunkIndex = visibleChunks.size;
      loadChunk(nextChunkIndex);
    }
  }, [entry?.isIntersecting, visibleChunks.size, isLoading, hasMore, loadChunk]);

  // Reset when data changes
  useEffect(() => {
    setVisibleChunks(new Set([0]));
    setRenderedData([]);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    
    // Load first chunk immediately
    if (data.length > 0) {
      loadChunk(0);
    }
  }, [data, chunkSize, loadChunk]);

  // Default loading component
  const DefaultLoading = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600">Loading chart data...</div>
      </div>
    </div>
  );

  // Default error component
  const DefaultError = ({ error }: { error: string }) => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-red-500 mb-2">⚠️ Error Loading Data</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button
          onClick={() => {
            setError(null);
            setVisibleChunks(new Set([0]));
            setRenderedData([]);
            setHasMore(true);
            loadChunk(0);
          }}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Calculate progress
  const progress = data.length > 0 ? (renderedData.length / data.length) * 100 : 0;

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ height, position: 'relative' }}
    >
      {/* Progress indicator */}
      {progress < 100 && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm border border-gray-200 z-10">
          <div className="flex items-center space-x-2">
            <div className="text-xs font-medium text-gray-700">
              {Math.round(progress)}% loaded
            </div>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {error ? (
        errorComponent ? (
          <>{errorComponent}</>
        ) : (
          <DefaultError error={error} />
        )
      ) : renderedData.length > 0 ? (
        <div className="transition-all duration-300">
          {renderChunk(renderedData, visibleChunks.size - 1)}
        </div>
      ) : (
        loadingComponent ? (
          <>{loadingComponent}</>
        ) : (
          <DefaultLoading />
        )
      )}

      {/* Loading more indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/90 to-white flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Loading more data...</span>
          </div>
        </div>
      )}

      {/* Intersection observer trigger */}
      {hasMore && !isLoading && (
        <div 
          ref={observerRef} 
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Load more button (fallback) */}
      {hasMore && !isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => {
              const nextChunkIndex = visibleChunks.size;
              loadChunk(nextChunkIndex);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Load More ({renderedData.length}/{data.length})
          </button>
        </div>
      )}

      {/* Complete indicator */}
      {!hasMore && renderedData.length === data.length && data.length > 0 && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
          ✓ Complete
        </div>
      )}
    </div>
  );
}

// Hook for managing progressive data loading
export function useProgressiveData<T>(
  data: T[],
  options: {
    chunkSize?: number;
    initialChunks?: number;
    onLoadChunk?: (chunk: T[], index: number) => void;
  } = {}
) {
  const {
    chunkSize = 10,
    initialChunks = 1,
    onLoadChunk
  } = options;

  const [visibleChunks, setVisibleChunks] = useState<Set<number>>(
    new Set(Array.from({ length: Math.min(initialChunks, Math.ceil(data.length / chunkSize)) }, (_, i) => i))
  );
  const [renderedData, setRenderedData] = useState<T[]>([]);

  // Update rendered data when visible chunks change
  useEffect(() => {
    const newRenderedData: T[] = [];
    visibleChunks.forEach(index => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      newRenderedData.push(...data.slice(start, end));
    });
    setRenderedData(newRenderedData);
  }, [visibleChunks, data, chunkSize]);

  const loadChunk = useCallback((chunkIndex: number) => {
    if (visibleChunks.has(chunkIndex)) return;

    const newVisibleChunks = new Set(visibleChunks);
    newVisibleChunks.add(chunkIndex);
    setVisibleChunks(newVisibleChunks);

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    const chunkData = data.slice(start, end);

    onLoadChunk?.(chunkData, chunkIndex);
  }, [visibleChunks, data, chunkSize, onLoadChunk]);

  const loadMore = useCallback(() => {
    const nextChunkIndex = visibleChunks.size;
    loadChunk(nextChunkIndex);
  }, [visibleChunks.size, loadChunk]);

  const hasMore = visibleChunks.size < Math.ceil(data.length / chunkSize);
  const progress = data.length > 0 ? (renderedData.length / data.length) * 100 : 0;

  return {
    renderedData,
    visibleChunks,
    hasMore,
    progress,
    loadChunk,
    loadMore,
    reset: () => {
      setVisibleChunks(new Set(Array.from({ length: initialChunks }, (_, i) => i)));
    }
  };
}