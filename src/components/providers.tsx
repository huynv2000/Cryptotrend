"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Retry failed queries 3 times with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on 404 errors
          if (error?.response?.status === 404) return false;
          // Don't retry on validation errors
          if (error?.message?.includes('validation')) return false;
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Cache data for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        // Garbage collect unused data after 10 minutes
        gcTime: 10 * 60 * 1000,
        // Error handling
        onError: (error) => {
          console.error('🚨 [QueryClient] Global query error:', error);
        },
      },
      mutations: {
        // Retry failed mutations 3 times
        retry: (failureCount, error: any) => {
          // Don't retry on validation errors
          if (error?.message?.includes('validation')) return false;
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Error handling
        onError: (error) => {
          console.error('🚨 [QueryClient] Global mutation error:', error);
        },
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}