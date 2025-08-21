// Utility functions for Blockchain Dashboard

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { COLORS, TYPOGRAPHY } from './constants';
import type { 
  MetricValue, 
  HistoricalDataPoint, 
  SpikeDetectionResult,
  BlockchainValue,
  TimeframeValue 
} from './types';

// Class name utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format utilities
export function formatNumber(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  const value = Number(num);
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

// Enhanced currency formatting using FinancialFormatter
export function formatCurrency(num: number | null | undefined, currency: string = 'USD'): string {
  // Import FinancialFormatter dynamically to avoid circular dependencies
  // For now, use the enhanced compact formatting
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  // Use compact formatting for better readability
  const value = Number(num);
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  
  // For smaller values, use standard currency format
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// New enhanced formatting functions
export function formatCurrencyCompact(num: number | null | undefined, currency: string = 'USD'): string {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  const value = Number(num);
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyDetailed(num: number | null | undefined, currency: string = 'USD'): string {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  const value = Number(num);
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatHashRate(hashRate: number | null | undefined): string {
  if (hashRate === null || hashRate === undefined || isNaN(hashRate)) {
    return 'N/A';
  }
  const value = Number(hashRate);
  if (value >= 1e18) {
    return `${(value / 1e18).toFixed(2)} EH/s`;
  } else if (value >= 1e15) {
    return `${(value / 1e15).toFixed(2)} PH/s`;
  } else if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)} TH/s`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)} GH/s`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)} MH/s`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)} KH/s`;
  }
  return `${value.toFixed(2)} H/s`;
}

export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(date, formatStr);
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatRelativeTimeStrict(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

// Color utilities
export function getTrendColor(change: number, isPositiveGood: boolean = true): string {
  if (change > 0) {
    return isPositiveGood ? COLORS.success[500] : COLORS.error[500];
  } else if (change < 0) {
    return isPositiveGood ? COLORS.error[500] : COLORS.success[500];
  }
  return COLORS.neutral[500];
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return COLORS.error[500];
    case 'medium':
      return COLORS.warning[500];
    case 'low':
      return COLORS.success[500];
    default:
      return COLORS.neutral[500];
  }
}

export function getStatusColor(status: 'success' | 'error' | 'warning' | 'info'): string {
  switch (status) {
    case 'success':
      return COLORS.success[500];
    case 'error':
      return COLORS.error[500];
    case 'warning':
      return COLORS.warning[500];
    case 'info':
      return COLORS.primary[500];
    default:
      return COLORS.neutral[500];
  }
}

// Data processing utilities
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const recent = values.slice(-5);
  const older = values.slice(-10, -5);
  
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (Math.abs(change) < 1) return 'stable';
  return change > 0 ? 'up' : 'down';
}

export function calculateMovingAverage(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  
  return result;
}

export function calculateStandardDeviation(data: number[]): number {
  if (data.length === 0) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDifferences.reduce((a, b) => a + b, 0) / data.length;
  
  return Math.sqrt(avgSquaredDiff);
}

export function detectSpike(
  currentValue: number,
  historicalData: number[],
  thresholdMultiplier: number = 2
): SpikeDetectionResult {
  if (historicalData.length < 30) {
    return {
      isSpike: false,
      severity: 'low',
      confidence: 0,
      message: 'Insufficient data for spike detection',
      threshold: 0,
      currentValue,
      baseline: 0,
      deviation: 0,
    };
  }

  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const stdDev = calculateStandardDeviation(historicalData);
  
  const upperThreshold = mean + (thresholdMultiplier * stdDev);
  const lowerThreshold = mean - (thresholdMultiplier * stdDev);
  
  const isSpike = currentValue > upperThreshold || currentValue < lowerThreshold;
  
  if (!isSpike) {
    return {
      isSpike: false,
      severity: 'low',
      confidence: 0,
      message: 'No spike detected',
      threshold: upperThreshold,
      currentValue,
      baseline: mean,
      deviation: 0,
    };
  }
  
  const deviation = Math.abs(currentValue - mean) / stdDev;
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  if (deviation > 3) severity = 'high';
  else if (deviation > 2) severity = 'medium';
  
  const confidence = Math.min(deviation / 4, 1);
  
  return {
    isSpike: true,
    severity,
    confidence,
    message: `${severity.toUpperCase()} spike detected: ${currentValue.toFixed(2)} (${deviation.toFixed(2)}σ from mean)`,
    threshold: upperThreshold,
    currentValue,
    baseline: mean,
    deviation,
  };
}

// Data validation utilities
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isValidString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) return value;
  return defaultValue;
}

export function sanitizeString(value: any, defaultValue: string = ''): string {
  if (isValidString(value)) return value.trim();
  return defaultValue;
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Time utilities
export function getTimeframeMinutes(timeframe: TimeframeValue): number {
  const timeframeMap: Record<TimeframeValue, number> = {
    '1h': 60,
    '24h': 1440,
    '7d': 10080,
    '30d': 43200,
    '90d': 129600,
  };
  return timeframeMap[timeframe];
}

export function getDateRange(timeframe: TimeframeValue): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  const minutes = getTimeframeMinutes(timeframe);
  start.setTime(end.getTime() - minutes * 60 * 1000);
  
  return { start, end };
}

export function generateTimeSeries(
  start: Date,
  end: Date,
  interval: number = 60 // minutes
): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setTime(current.getTime() + interval * 60 * 1000);
  }
  
  return dates;
}

// URL utilities
export function buildUrl(base: string, params: Record<string, any>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// Local storage utilities
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
}

export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
  }
}

// Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

// Error handling utilities
export function createError(message: string, code: string = 'UNKNOWN_ERROR'): Error {
  const error = new Error(message);
  error.name = code;
  return error;
}

export function isNetworkError(error: any): boolean {
  return (
    error.name === 'NetworkError' ||
    error.message.includes('Network Error') ||
    error.message.includes('fetch')
  );
}

export function isTimeoutError(error: any): boolean {
  return (
    error.name === 'TimeoutError' ||
    error.message.includes('timeout') ||
    error.code === 'ECONNABORTED'
  );
}

export function isAuthenticationError(error: any): boolean {
  return (
    error.status === 401 ||
    error.code === 'UNAUTHORIZED' ||
    error.message.includes('unauthorized')
  );
}

// Random utilities
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor(): string {
  const colors = [
    COLORS.success[500],
    COLORS.error[500],
    COLORS.neutral[500],
    COLORS.warning[500],
    COLORS.primary[500],
  ];
  return colors[getRandomNumber(0, colors.length - 1)];
}

// DOM utilities
export function getElementById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function querySelector<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

export function querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

export function addClass(element: HTMLElement, className: string): void {
  element.classList.add(className);
}

export function removeClass(element: HTMLElement, className: string): void {
  element.classList.remove(className);
}

export function toggleClass(element: HTMLElement, className: string): void {
  element.classList.toggle(className);
}

export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

// Event utilities
export function addEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

export function preventDefault(event: Event): void {
  event.preventDefault();
}

export function stopPropagation(event: Event): void {
  event.stopPropagation();
}

// Async utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(attempt, delay * attempts);
        }
      }
    };
    
    attempt();
  });
}

export function timeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// Export all utilities
export const utils = {
  cn,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatHashRate,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatRelativeTimeStrict,
  getTrendColor,
  getPriorityColor,
  getStatusColor,
  calculateChange,
  calculateTrend,
  calculateMovingAverage,
  calculateStandardDeviation,
  detectSpike,
  isValidNumber,
  isValidDate,
  isValidString,
  sanitizeNumber,
  sanitizeString,
  chunk,
  groupBy,
  sortBy,
  uniqueBy,
  getTimeframeMinutes,
  getDateRange,
  generateTimeSeries,
  buildUrl,
  parseUrlParams,
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  debounce,
  throttle,
  memoize,
  createError,
  isNetworkError,
  isTimeoutError,
  isAuthenticationError,
  generateId,
  generateUUID,
  getRandomNumber,
  getRandomColor,
  getElementById,
  querySelector,
  querySelectorAll,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  addEventListener,
  preventDefault,
  stopPropagation,
  sleep,
  retry,
  timeout,
};