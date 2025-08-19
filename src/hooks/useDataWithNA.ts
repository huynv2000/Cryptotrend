'use client';

import { useState, useEffect } from 'react';

interface DataFetchOptions {
  fallbackValue?: any;
  showError?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface DataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isNA: boolean;
}

export const useDataWithNA = <T>(
  fetchFunction: () => Promise<T>,
  options: DataFetchOptions = {}
): DataFetchResult<T> => {
  const {
    fallbackValue = null,
    showError = false,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNA, setIsNA] = useState(false);

  const fetchData = async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      setIsNA(false);
      
      const result = await fetchFunction();
      
      // Kiểm tra nếu dữ liệu không hợp lệ hoặc rỗng
      if (result === null || result === undefined || 
          (typeof result === 'object' && Object.keys(result).length === 0)) {
        setIsNA(true);
        setData(fallbackValue);
        if (showError) {
          setError('No data available');
        }
      } else {
        setData(result);
        setIsNA(false);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      
      if (attempt < retryCount) {
        // Thử lại sau một khoảng thời gian
        setTimeout(() => fetchData(attempt + 1), retryDelay);
      } else {
        setIsNA(true);
        setData(fallbackValue);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isNA
  };
};

// Helper function để format giá trị với N/A
export const formatValueWithNA = (
  value: any,
  formatter?: (value: any) => string,
  naString = 'N/A'
): string => {
  if (value === null || value === undefined || value === '') {
    return naString;
  }
  
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return naString;
  }
  
  if (formatter) {
    try {
      return formatter(value);
    } catch {
      return naString;
    }
  }
  
  return String(value);
};

// Helper function để kiểm tra giá trị có hợp lệ không
export const isValidValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Hook để fetch multiple data sources cùng lúc
export const useMultipleDataWithNA = <T>(
  fetchFunctions: Array<() => Promise<T>>,
  options: DataFetchOptions = {}
) => {
  const [results, setResults] = useState<Array<DataFetchResult<T>>>(
    fetchFunctions.map(() => ({
      data: null,
      loading: false,
      error: null,
      refetch: async () => {},
      isNA: false
    }))
  );

  const fetchAll = async () => {
    setResults(prev => prev.map(r => ({ ...r, loading: true, error: null })));
    
    try {
      const promises = fetchFunctions.map(async (fetchFn, index) => {
        try {
          const result = await fetchFn();
          const isValid = isValidValue(result);
          
          return {
            data: isValid ? result : options.fallbackValue,
            loading: false,
            error: isValid ? null : 'No data available',
            refetch: async () => {},
            isNA: !isValid
          };
        } catch (err) {
          return {
            data: options.fallbackValue,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch data',
            refetch: async () => {},
            isNA: true
          };
        }
      });

      const newResults = await Promise.all(promises);
      setResults(newResults);
    } catch (err) {
      setResults(prev => prev.map(r => ({
        ...r,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
        isNA: true
      })));
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    results,
    refetchAll: fetchAll,
    loadingAll: results.some(r => r.loading),
    hasErrors: results.some(r => r.error !== null),
    hasNA: results.some(r => r.isNA)
  };
};