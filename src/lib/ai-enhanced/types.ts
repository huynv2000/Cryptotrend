/**
 * Enhanced AI Analysis Types
 * Financial System AI Architecture - Enterprise Grade
 * 
 * This file contains comprehensive type definitions for the enhanced AI analysis system
 * designed for financial applications with 20+ years of banking expertise.
 */

export type Timeframe = '1h' | '4h' | '1d' | '1w' | '1M';
export type AnalysisType = 'COMPREHENSIVE' | 'PREDICTIVE' | 'RISK' | 'SENTIMENT' | 'TRADING';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TradingSignal = 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
export type ModelType = 'ARIMA' | 'PROPHET' | 'LSTM' | 'ENSEMBLE' | 'VAR' | 'MONTE_CARLO' | 'NLP' | 'SENTIMENT_TRANSFORMER';

// Core Data Types
export interface RawMarketData {
  cryptoId: string;
  timestamp: Date;
  price: number;
  volume: number;
  marketCap: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  [key: string]: any;
}

export interface ProcessedData {
  original: RawMarketData;
  validated: ValidatedData;
  features: FeatureSet;
  normalized: NormalizedData;
  cleaned: CleanedData;
  timeSeries: TimeSeriesData;
  qualityScore: number;
  processingMetadata: ProcessingMetadata;
}

export interface ValidatedData {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
}

export interface FeatureSet {
  technical: TechnicalFeatures;
  market: MarketFeatures;
  onChain: OnChainFeatures;
  sentiment: SentimentFeatures;
  risk: RiskFeatures;
}

export interface TechnicalFeatures {
  rsi: number;
  macd: number;
  bollinger: BollingerBands;
  movingAverages: MovingAverages;
  volatility: VolatilityMetrics;
  momentum: MomentumIndicators;
}

export interface MarketFeatures {
  volumeProfile: VolumeProfile;
  liquidity: LiquidityMetrics;
  marketDepth: MarketDepth;
  correlation: CorrelationMatrix;
  dominance: MarketDominance;
}

export interface OnChainFeatures {
  activeAddresses: number;
  transactionVolume: number;
  exchangeFlows: ExchangeFlows;
  stakingMetrics: StakingMetrics;
  networkHealth: NetworkHealth;
}

export interface SentimentFeatures {
  newsSentiment: SentimentScore;
  socialSentiment: SentimentScore;
  fearGreedIndex: number;
  emotionAnalysis: EmotionAnalysis;
}

export interface RiskFeatures {
  volatilityRisk: number;
  liquidityRisk: number;
  marketRisk: number;
  creditRisk: number;
  operationalRisk: number;
}

// AI Model Types
export interface AIModels {
  // Time Series Models
  arima: ARIMAModel;
  prophet: ProphetModel;
  lstm: LSTMModel;
  ensemble: EnsembleModel;
  
  // Risk Models
  var: VaRModel;
  expectedShortfall: ExpectedShortfallModel;
  monteCarlo: MonteCarloSimulation;
  
  // Sentiment Models
  nlp: NLPModel;
  sentimentTransformer: SentimentTransformer;
  emotionAnalysis: EmotionAnalysisModel;
  
  // Anomaly Detection
  isolationForest: IsolationForestModel;
  autoencoder: AutoencoderModel;
  oneClassSVM: OneClassSVMModel;
}

export interface ARIMAModel {
  parameters: ARIMAParameters;
  forecast: ForecastResult;
  accuracy: ModelAccuracy;
  confidence: number;
}

export interface ProphetModel {
  parameters: ProphetParameters;
  forecast: ForecastResult;
  seasonality: SeasonalityAnalysis;
  accuracy: ModelAccuracy;
}

export interface LSTMModel {
  parameters: LSTMParameters;
  forecast: ForecastResult;
  accuracy: ModelAccuracy;
  trainingHistory: TrainingHistory;
}

export interface EnsembleModel {
  models: ModelType[];
  weights: number[];
  forecast: EnsembleForecast;
  accuracy: ModelAccuracy;
  votingMethod: 'weighted' | 'majority' | 'stacking';
}

export interface VaRModel {
  confidence: number;
  timeHorizon: number;
  var: number;
  expectedShortfall: number;
  backtest: BacktestResult;
}

export interface MonteCarloSimulation {
  scenarios: MonteCarloScenario[];
  statistics: MonteCarloStatistics;
  convergence: ConvergenceAnalysis;
}

export interface NLPModel {
  sentiment: SentimentScore;
  topics: TopicAnalysis[];
  entities: EntityRecognition[];
  confidence: number;
}

export interface SentimentTransformer {
  sentiment: SentimentScore;
  emotions: EmotionAnalysis;
  confidence: number;
  modelVersion: string;
}

// Analysis Results
export interface PredictiveResults {
  priceForecast: PriceForecast;
  trendAnalysis: TrendAnalysis;
  supportResistance: SupportResistance;
  patternRecognition: PatternRecognition;
  confidence: number;
}

export interface RiskResults {
  marketRisk: MarketRisk;
  liquidityRisk: LiquidityRisk;
  creditRisk: CreditRisk;
  operationalRisk: OperationalRisk;
  systemicRisk: SystemicRisk;
  overallRiskScore: number;
  riskBreakdown: RiskBreakdown;
  riskMitigation: RiskMitigation[];
}

export interface SentimentResults {
  newsSentiment: SentimentScore;
  socialSentiment: SentimentScore;
  emotionAnalysis: EmotionAnalysis;
  overallSentimentScore: number;
  sentimentTrend: SentimentTrend;
}

export interface EnsembleResult {
  decision: TradingDecision;
  confidence: number;
  contributingFactors: ContributingFactor[];
  uncertainty: number;
  timestamp: Date;
}

export interface Recommendation {
  type: 'TRADING' | 'RISK_MANAGEMENT' | 'PORTFOLIO_OPTIMIZATION';
  action: string;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedImpact: ExpectedImpact;
}

export interface EnhancedAnalysisResult {
  timestamp: Date;
  cryptoId: string;
  analysisType: AnalysisType;
  timeframe: Timeframe;
  predictiveResults: PredictiveResults;
  riskResults: RiskResults;
  sentimentResults: SentimentResults;
  ensembleResult: EnsembleResult;
  recommendations: Recommendation[];
  confidence: number;
  modelAccuracy: ModelAccuracy;
  processingTime: number;
  metadata: AnalysisMetadata;
}

// Supporting Types
export interface ValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  timestamp: Date;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'INFO' | 'WARNING';
  timestamp: Date;
}

export interface NormalizedData {
  features: number[][];
  scaler: ScalerConfig;
  range: [number, number];
}

export interface CleanedData {
  outliersRemoved: number;
  missingValuesHandled: number;
  transformationsApplied: string[];
}

export interface TimeSeriesData {
  timestamps: Date[];
  values: number[];
  frequency: string;
  seasonality: SeasonalityInfo;
}

export interface ProcessingMetadata {
  timestamp: Date;
  processingTime: number;
  transformations: string[];
  memoryUsage: number;
  cpuUsage: number;
}

export interface TechnicalFeatures {
  rsi: number;
  macd: number;
  bollinger: BollingerBands;
  movingAverages: MovingAverages;
  volatility: VolatilityMetrics;
  momentum: MomentumIndicators;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
}

export interface MovingAverages {
  ma5: number;
  ma10: number;
  ma20: number;
  ma50: number;
  ma200: number;
}

export interface VolatilityMetrics {
  historical: number;
  implied: number;
  atr: number;
  standardDeviation: number;
}

export interface MomentumIndicators {
  rsi: number;
  stochastic: number;
  cci: number;
  williams: number;
}

export interface VolumeProfile {
  poc: number;
  valueArea: [number, number];
  volumeNodes: VolumeNode[];
}

export interface VolumeNode {
  price: number;
  volume: number;
  delta: number;
}

export interface LiquidityMetrics {
  bidAskSpread: number;
  marketDepth: number;
  slippage: number;
  impact: number;
}

export interface MarketDepth {
  bids: MarketLevel[];
  asks: MarketLevel[];
  imbalance: number;
}

export interface MarketLevel {
  price: number;
  volume: number;
  orders: number;
}

export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][];
  eigenvalues: number[];
  eigenvectors: number[][];
}

export interface MarketDominance {
  btc: number;
  eth: number;
  stablecoins: number;
  defi: number;
  other: number;
}

export interface ExchangeFlows {
  inflow: number;
  outflow: number;
  netFlow: number;
  exchangeBalance: number;
}

export interface StakingMetrics {
  stakedSupply: number;
  stakingRate: number;
  rewards: number;
  validators: number;
}

export interface NetworkHealth {
  hashrate: number;
  difficulty: number;
  blockTime: number;
  transactions: number;
}

export interface SentimentScore {
  score: number;
  magnitude: number;
  confidence: number;
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface EmotionAnalysis {
  fear: number;
  greed: number;
  optimism: number;
  pessimism: number;
  uncertainty: number;
}

export interface ARIMAParameters {
  p: number;
  d: number;
  q: number;
  seasonal: SeasonalParams;
}

export interface SeasonalParams {
  P: number;
  D: number;
  Q: number;
  period: number;
}

export interface ForecastResult {
  values: number[];
  timestamps: Date[];
  confidenceIntervals: ConfidenceInterval[];
  accuracy: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

export interface ModelAccuracy {
  mae: number;
  mse: number;
  rmse: number;
  mape: number;
  r2: number;
  directionalAccuracy: number;
}

export interface ProphetParameters {
  growth: string;
  changepoints: Date[];
  seasonality: SeasonalityConfig;
  holidays: Holiday[];
}

export interface SeasonalityConfig {
  weekly: boolean;
  yearly: boolean;
  daily: boolean;
}

export interface Holiday {
  date: Date;
  name: string;
  lowerWindow: number;
  upperWindow: number;
}

export interface SeasonalityAnalysis {
  weekly: SeasonalityComponent;
  yearly: SeasonalityComponent;
  daily: SeasonalityComponent;
}

export interface SeasonalityComponent {
  period: number;
  amplitude: number;
  phase: number;
}

export interface LSTMParameters {
  units: number;
  layers: number;
  dropout: number;
  recurrentDropout: number;
  batchSize: number;
  epochs: number;
}

export interface TrainingHistory {
  loss: number[];
  valLoss: number[];
  accuracy: number[];
  valAccuracy: number[];
}

export interface EnsembleForecast {
  predictions: number[];
  weights: number[];
  modelContributions: ModelContribution[];
  uncertainty: number;
}

export interface ModelContribution {
  model: ModelType;
  weight: number;
  contribution: number;
  accuracy: number;
}

export interface BacktestResult {
  violations: number;
  coverage: number;
  independence: number;
  regularity: number;
}

export interface MonteCarloScenario {
  id: number;
  path: number[];
  probability: number;
  statistics: ScenarioStatistics;
}

export interface MonteCarloStatistics {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  percentiles: number[];
}

export interface ConvergenceAnalysis {
  converged: boolean;
  iterations: number;
  tolerance: number;
}

export interface TopicAnalysis {
  topic: string;
  keywords: string[];
  relevance: number;
  sentiment: SentimentScore;
}

export interface EntityRecognition {
  entity: string;
  type: string;
  confidence: number;
  context: string;
}

export interface PriceForecast {
  shortTerm: ForecastHorizon;
  mediumTerm: ForecastHorizon;
  longTerm: ForecastHorizon;
  confidence: number;
}

export interface ForecastHorizon {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  magnitude: number;
  timeframe: string;
  confidence: number;
}

export interface TrendAnalysis {
  primaryTrend: Trend;
  secondaryTrend: Trend;
  trendStrength: number;
  momentum: number;
}

export interface Trend {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  duration: number;
}

export interface SupportResistance {
  support: number[];
  resistance: number[];
  keyLevels: KeyLevel[];
}

export interface KeyLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  tested: number;
}

export interface PatternRecognition {
  patterns: Pattern[];
  reliability: number;
  timeframe: string;
}

export interface Pattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  timeframe: string;
  target: number;
  stopLoss: number;
}

export interface MarketRisk {
  var: number;
  expectedShortfall: number;
  beta: number;
  correlation: number;
  volatility: number;
}

export interface LiquidityRisk {
  bidAskSpread: number;
  marketDepth: number;
  slippage: number;
  volumeProfile: VolumeProfile;
}

export interface CreditRisk {
  counterpartyRisk: number;
  settlementRisk: number;
  defaultProbability: number;
  recoveryRate: number;
}

export interface OperationalRisk {
  systemRisk: number;
  humanRisk: number;
  processRisk: number;
  externalRisk: number;
}

export interface SystemicRisk {
  contagionRisk: number;
  liquiditySpiral: number;
  fireSales: number;
  networkRisk: number;
}

export interface RiskBreakdown {
  byCategory: RiskCategory[];
  byTimeframe: RiskTimeframe[];
  bySeverity: RiskSeverity[];
}

export interface RiskCategory {
  category: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface RiskTimeframe {
  timeframe: string;
  score: number;
  trend: number;
  volatility: number;
}

export interface RiskSeverity {
  severity: RiskLevel;
  count: number;
  probability: number;
  impact: number;
}

export interface RiskMitigation {
  strategy: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  effectiveness: number;
  cost: number;
  timeframe: string;
  description: string;
}

export interface SentimentTrend {
  direction: 'IMPROVING' | 'DETERIORATING' | 'STABLE';
  momentum: number;
  acceleration: number;
  volatility: number;
}

export interface TradingDecision {
  signal: TradingSignal;
  strength: number;
  timeframe: string;
  confidence: number;
  reasoning: string;
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  value: number;
  importance: number;
}

export interface ExpectedImpact {
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  magnitude: number;
  probability: number;
  timeframe: string;
}

export interface AnalysisMetadata {
  modelVersions: Record<string, string>;
  dataSources: string[];
  processingTime: number;
  memoryUsage: number;
  accuracy: number;
  warnings: string[];
  recommendations: string[];
}

export interface ScalerConfig {
  type: 'STANDARD' | 'MINMAX' | 'ROBUST';
  params: Record<string, number>;
}

export interface SeasonalityInfo {
  hasSeasonality: boolean;
  period: number;
  strength: number;
  type: 'ADDITIVE' | 'MULTIPLICATIVE';
}

export interface ScenarioStatistics {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
}