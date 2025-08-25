/**
 * Personalization Hook
 * Phase 2.7 - AI Personalization Integration
 * 
 * This hook provides access to the personalization system
 * for React components.
 */

import { useState, useEffect, useCallback } from 'react';

interface PersonalizationResponse {
  success: boolean;
  userId: string;
  personalization: any;
  processingTime: number;
  timestamp: Date;
  error?: string;
}

interface UsePersonalizationOptions {
  userId: string;
  sessionId: string;
  page?: string;
  section?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UsePersonalizationReturn {
  personalization: PersonalizationResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackEvent: (event: {
    eventType: string;
    target: string;
    value?: any;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

export function usePersonalization(
  options: UsePersonalizationOptions
): UsePersonalizationReturn {
  const {
    userId,
    sessionId,
    page = 'dashboard',
    section,
    autoRefresh = true,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [personalization, setPersonalization] = useState<PersonalizationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch personalization data
  const fetchPersonalization = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId,
        sessionId,
        page,
        ...(section && { section }),
        ...(forceRefresh && { forceRefresh: 'true' })
      });

      const response = await fetch(`/api/personalization?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPersonalization(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch personalization:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, page, section]);

  // Track user event
  const trackEvent = useCallback(async (event: {
    eventType: string;
    target: string;
    value?: any;
    metadata?: Record<string, any>;
  }) => {
    try {
      const response = await fetch('/api/personalization/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          ...event,
          metadata: {
            ...event.metadata,
            page,
            section,
            deviceType: 'web',
            experienceLevel: 'beginner' // This would come from user context
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to track event');
      }

    } catch (err) {
      console.error('Failed to track event:', err);
      // Don't throw error to avoid breaking user experience
    }
  }, [userId, sessionId, page, section]);

  // Refresh personalization data
  const refresh = useCallback(async () => {
    await fetchPersonalization(true);
  }, [fetchPersonalization]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchPersonalization();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPersonalization();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchPersonalization, autoRefresh, refreshInterval]);

  return {
    personalization,
    loading,
    error,
    refresh,
    trackEvent
  };
}

/**
 * Hook for tracking user interactions automatically
 */
export function useInteractionTracker(options: UsePersonalizationOptions) {
  const { trackEvent } = usePersonalization(options);

  const trackClick = useCallback((target: string, metadata?: Record<string, any>) => {
    return trackEvent({
      eventType: 'click',
      target,
      metadata
    });
  }, [trackEvent]);

  const trackHover = useCallback((target: string, duration?: number, metadata?: Record<string, any>) => {
    return trackEvent({
      eventType: 'hover',
      target,
      value: duration,
      metadata
    });
  }, [trackEvent]);

  const trackNavigation = useCallback((target: string, metadata?: Record<string, any>) => {
    return trackEvent({
      eventType: 'navigation',
      target,
      metadata
    });
  }, [trackEvent]);

  const trackTimeSpent = useCallback((target: string, duration: number, metadata?: Record<string, any>) => {
    return trackEvent({
      eventType: 'time_spent',
      target,
      value: duration,
      metadata
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, metadata?: Record<string, any>) => {
    return trackEvent({
      eventType: 'search',
      target: 'search',
      value: searchTerm,
      metadata
    });
  }, [trackEvent]);

  return {
    trackClick,
    trackHover,
    trackNavigation,
    trackTimeSpent,
    trackSearch
  };
}

/**
 * Hook for real-time insights
 */
export function useRealTimeInsights(options: UsePersonalizationOptions) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getInsights = useCallback(async (context: any) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/personalization/insights?${new URLSearchParams({
        userId: options.userId,
        sessionId: options.sessionId
      })}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setInsights(data.insights || []);

    } catch (err) {
      console.error('Failed to get real-time insights:', err);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [options.userId, options.sessionId]);

  return {
    insights,
    loading,
    getInsights
  };
}