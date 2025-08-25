// Bridge flow historical data types

export interface BridgeFlowHistoricalData {
  date: string; // YYYY-MM-DD format
  value: number; // Bridge flow value in USD
  volume: number; // Transaction volume
  transactionCount: number; // Number of transactions
  ma7?: number; // 7-day moving average
  ma30?: number; // 30-day moving average
  ma90?: number; // 90-day moving average
}

export interface BridgeFlowChartProps {
  data: BridgeFlowHistoricalData[];
  isLoading: boolean;
  timeRange: '7D' | '30D' | '90D';
  onTimeRangeChange: (range: '7D' | '30D' | '90D') => void;
  className?: string;
}

export interface MovingAverageResult {
  period: number;
  data: number[];
  dates: string[];
}

export interface BridgeFlowSummary {
  totalValue: number;
  averageValue: number;
  maxValue: number;
  minValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartTooltipData {
  date: string;
  value: number;
  volume: number;
  transactionCount: number;
  ma30?: number;
}