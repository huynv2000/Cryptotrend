// Type definitions for Blockchain Dashboard

import { z } from 'zod';

// Base Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Blockchain Types
export type BlockchainValue = typeof BLOCKCHAINS[number]['value'];

export interface BlockchainSelector {
  value: BlockchainValue;
  label: string;
  symbol: string;
}

export type TimeframeValue = typeof TIMEFRAMES[number]['value'];

export interface TimeframeSelector {
  value: TimeframeValue;
  label: string;
  minutes: number;
}

// Metric Types
export interface MetricValue {
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  volume?: number;
}

export interface TimeSeriesData {
  timeframe: TimeframeValue;
  data: HistoricalDataPoint[];
  metadata: {
    start: Date;
    end: Date;
    count: number;
  };
}

// Usage Metrics Types
export interface UsageMetrics extends BaseEntity {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  dailyActiveAddresses: MetricValue;
  newAddresses: MetricValue;
  dailyTransactions: MetricValue;
  transactionVolume: MetricValue;
  averageFee: MetricValue;
  hashRate: MetricValue;
  rollingAverages: {
    dailyActiveAddresses: { '7d': number; '30d': number; '90d': number };
    newAddresses: { '7d': number; '30d': number; '90d': number };
    dailyTransactions: { '7d': number; '30d': number; '90d': number };
    transactionVolume: { '7d': number; '30d': number; '90d': number };
    averageFee: { '7d': number; '30d': number; '90d': number };
    hashRate: { '7d': number; '30d': number; '90d': number };
  };
  spikeDetection: {
    dailyActiveAddresses: SpikeDetectionResult;
    newAddresses: SpikeDetectionResult;
    dailyTransactions: SpikeDetectionResult;
    transactionVolume: SpikeDetectionResult;
    averageFee: SpikeDetectionResult;
    hashRate: SpikeDetectionResult;
  };
}

// Cash Flow Metrics Types
export interface CashflowMetrics extends BaseEntity {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  bridgeFlows: MetricValue;
  exchangeFlows: MetricValue;
  stakingMetrics: MetricValue;
  miningValidation: MetricValue;
  flowAnalysis: {
    bridgeFlowPatterns: FlowPattern[];
    exchangeFlowCorrelations: CorrelationData[];
    stakingTrends: TrendData[];
    miningEfficiency: EfficiencyData;
  };
}

export interface FlowPattern {
  direction: 'inflow' | 'outflow';
  amount: number;
  source: string;
  destination: string;
  timestamp: Date;
}

export interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  timeframe: TimeframeValue;
}

export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  period: number;
  confidence: number;
}

export interface EfficiencyData {
  current: number;
  average: number;
  peak: number;
  efficiency: number;
}

// Market Overview Types
export interface MarketOverview extends BaseEntity {
  blockchain: BlockchainValue;
  marketCap: MetricValue;
  dominance: MetricValue;
  volume24h: MetricValue;
  priceChange24h: MetricValue;
  fearGreedIndex: MetricValue;
  marketAnalysis: {
    sectorPerformance: SectorPerformance[];
    marketCorrelations: CorrelationMatrix;
    liquidityMetrics: LiquidityData;
    volatilityMetrics: VolatilityData;
  };
}

export interface SectorPerformance {
  sector: string;
  performance: number;
  marketCap: number;
  volume: number;
  change24h: number;
}

export interface CorrelationMatrix {
  matrix: number[][];
  assets: string[];
  timeframe: TimeframeValue;
}

export interface LiquidityData {
  totalLiquidity: number;
  liquidityScore: number;
  volumeDepth: number;
  spread: number;
}

export interface VolatilityData {
  current: number;
  average: number;
  high: number;
  low: number;
  index: number;
}

// AI Analysis Types
export interface AIAnalysis extends BaseEntity {
  blockchain: BlockchainValue;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: TradingSignal[];
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  marketInsights: MarketInsight[];
  predictiveIndicators: PredictiveIndicator[];
}

export interface TradingSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number;
  confidence: number;
  description: string;
  timeframe: TimeframeValue;
  metrics: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  timeframe: TimeframeValue;
  expectedImpact: string;
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  score: number;
  maxScore: number;
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  impact: number;
  likelihood: number;
  description: string;
}

export interface MarketInsight {
  id: string;
  category: string;
  title: string;
  content: string;
  importance: number;
  confidence: number;
  timeframe: TimeframeValue;
  relatedMetrics: string[];
}

export interface PredictiveIndicator {
  name: string;
  value: number;
  prediction: string;
  confidence: number;
  timeframe: TimeframeValue;
  accuracy: number;
}

// Spike Detection Types
export interface SpikeDetectionResult {
  isSpike: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  message: string;
  threshold: number;
  currentValue: number;
  baseline: number;
  deviation: number;
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  selectedBlockchain: BlockchainValue;
  selectedTimeframe: TimeframeValue;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: ChartPlugins;
  scales: ChartScales;
}

export interface ChartPlugins {
  legend: ChartLegend;
  tooltip: ChartTooltip;
}

export interface ChartLegend {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface ChartTooltip {
  mode: 'index' | 'nearest' | 'point' | 'x' | 'y';
  intersect: boolean;
}

export interface ChartScales {
  x: ChartScale;
  y: ChartScale;
}

export interface ChartScale {
  display: boolean;
  title: ChartScaleTitle;
  grid: ChartGrid;
}

export interface ChartScaleTitle {
  display: boolean;
  text: string;
}

export interface ChartGrid {
  display: boolean;
  color: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketSubscription {
  blockchain: BlockchainValue;
  events: string[];
}

export interface WebSocketStatus {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastMessage: Date | null;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

// API Types
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponseConfig<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: ApiRequestConfig;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  key: string;
}

export interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: boolean;
  key: string;
}

// Performance Types
export interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface ApiPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: Date;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Zod Schemas for validation
export const BlockchainSchema = z.object({
  value: z.enum(['bitcoin', 'ethereum', 'solana', 'binance-smart-chain', 'polygon']),
  label: z.string(),
  symbol: z.string(),
});

export const TimeframeSchema = z.object({
  value: z.enum(['1h', '24h', '7d', '30d', '90d']),
  label: z.string(),
  minutes: z.number(),
});

export const MetricValueSchema = z.object({
  value: z.number(),
  change: z.number(),
  changePercent: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
  timestamp: z.date(),
});

export const HistoricalDataPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
  volume: z.number().optional(),
});

export const SpikeDetectionResultSchema = z.object({
  isSpike: z.boolean(),
  severity: z.enum(['low', 'medium', 'high']),
  confidence: z.number(),
  message: z.string(),
  threshold: z.number(),
  currentValue: z.number(),
  baseline: z.number(),
  deviation: z.number(),
});

export const UsageMetricsSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  blockchain: z.enum(['bitcoin', 'ethereum', 'solana', 'binance-smart-chain', 'polygon']),
  timeframe: z.enum(['1h', '24h', '7d', '30d', '90d']),
  dailyActiveAddresses: MetricValueSchema,
  newAddresses: MetricValueSchema,
  dailyTransactions: MetricValueSchema,
  transactionVolume: MetricValueSchema,
  averageFee: MetricValueSchema,
  hashRate: MetricValueSchema,
  rollingAverages: z.object({
    dailyActiveAddresses: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
    newAddresses: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
    dailyTransactions: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
    transactionVolume: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
    averageFee: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
    hashRate: z.object({ '7d': z.number(), '30d': z.number(), '90d': z.number() }),
  }),
  spikeDetection: z.object({
    dailyActiveAddresses: SpikeDetectionResultSchema,
    newAddresses: SpikeDetectionResultSchema,
    dailyTransactions: SpikeDetectionResultSchema,
    transactionVolume: SpikeDetectionResultSchema,
    averageFee: SpikeDetectionResultSchema,
    hashRate: SpikeDetectionResultSchema,
  }),
});

// Export types
export type Blockchain = z.infer<typeof BlockchainSchema>;
export type Timeframe = z.infer<typeof TimeframeSchema>;
export type Metric = z.infer<typeof MetricValueSchema>;
export type HistoricalData = z.infer<typeof HistoricalDataPointSchema>;
export type SpikeDetection = z.infer<typeof SpikeDetectionResultSchema>;
export type UsageMetricsData = z.infer<typeof UsageMetricsSchema>;