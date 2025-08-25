// Predictive Analysis Section Component
// Phase 4: AI Analysis Enhancement
// Enterprise-grade predictive analysis visualization component

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  LineChart, 
  PieChart,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PredictiveAnalysisSectionProps {
  predictiveResults: any;
  timeframe: string;
  className?: string;
}

interface PricePrediction {
  timestamp: Date;
  predicted: number;
  confidence: number;
  model: string;
}

interface ConfidenceInterval {
  timestamp: Date;
  lower: number;
  upper: number;
  confidence: number;
}

interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  duration: number;
  confidence: number;
  keyLevels: number[];
}

interface ModelAccuracy {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rmse: number;
  mae: number;
}

interface KeyPrediction {
  type: 'price_target' | 'support_resistance' | 'trend_reversal' | 'breakout';
  value: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
}

interface ModelInfo {
  name: string;
  type: string;
  accuracy: number;
  lastTrained: Date;
  version: string;
}

interface ModelWeights {
  arima: number;
  prophet: number;
  lstm: number;
  dynamic: boolean;
  lastUpdated: Date;
}

// Mini Chart Component for Price Predictions
const MiniPriceChart: React.FC<{ 
  predictions: PricePrediction[];
  confidenceIntervals: ConfidenceInterval[];
}> = ({ predictions, confidenceIntervals }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const getChartDimensions = () => {
    const width = 300;
    const height = 150;
    const padding = 20;
    return { width, height, padding };
  };

  const { width, height, padding } = getChartDimensions();
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  if (predictions.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No prediction data available
      </div>
    );
  }

  const minValue = Math.min(...predictions.map(p => p.predicted));
  const maxValue = Math.max(...predictions.map(p => p.predicted));
  const valueRange = maxValue - minValue || 1;

  const getXPosition = (index: number) => padding + (index / (predictions.length - 1)) * chartWidth;
  const getYPosition = (value: number) => height - padding - ((value - minValue) / valueRange) * chartHeight;

  const points = predictions.map((pred, index) => ({
    x: getXPosition(index),
    y: getYPosition(pred.predicted),
    data: pred
  }));

  const confidencePoints = confidenceIntervals.map((ci, index) => ({
    x: getXPosition(index),
    yUpper: getYPosition(ci.upper),
    yLower: getYPosition(ci.lower),
    data: ci
  }));

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Confidence intervals */}
        {confidencePoints.map((point, index) => (
          <line
            key={`confidence-${index}`}
            x1={point.x}
            y1={point.yUpper}
            x2={point.x}
            y2={point.yLower}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeOpacity={0.3}
          />
        ))}
        
        {/* Prediction line */}
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <g key={`point-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer hover:r-6"
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {hoveredPoint === index && (
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className="text-xs font-semibold fill-current"
              >
                ${point.data.predicted.toFixed(0)}
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {hoveredPoint !== null && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-lg border text-xs">
          <div><strong>Date:</strong> {(predictions[hoveredPoint]?.timestamp || new Date()).toLocaleDateString()}</div>
          <div><strong>Prediction:</strong> ${(predictions[hoveredPoint]?.predicted || 0).toFixed(2)}</div>
          <div><strong>Confidence:</strong> {((predictions[hoveredPoint]?.confidence || 0) * 100).toFixed(1)}%</div>
          <div><strong>Model:</strong> {predictions[hoveredPoint]?.model || 'Unknown'}</div>
        </div>
      )}
    </div>
  );
};

// Model Accuracy Chart Component
const ModelAccuracyChart: React.FC<{ modelAccuracy: ModelAccuracy[] }> = ({ modelAccuracy }) => {
  const getChartDimensions = () => {
    const width = 300;
    const height = 200;
    const padding = 40;
    return { width, height, padding };
  };

  const { width, height, padding } = getChartDimensions();
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const metrics = ['accuracy', 'precision', 'recall', 'f1Score'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const barWidth = chartWidth / (modelAccuracy.length * metrics.length + modelAccuracy.length - 1);
  const groupWidth = barWidth * metrics.length + barWidth;

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={1}
        />
        
        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={1}
        />
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((value, index) => {
          const y = height - padding - (value * chartHeight);
          return (
            <g key={`y-label-${index}`}>
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {(value * 100).toFixed(0)}%
              </text>
              <line
                x1={padding - 5}
                y1={y}
                x2={padding}
                y2={y}
                stroke="#64748b"
                strokeWidth={1}
              />
            </g>
          );
        })}
        
        {/* Bars */}
        {modelAccuracy.map((model, modelIndex) => {
          const groupX = padding + modelIndex * groupWidth;
          
          return metrics.map((metric, metricIndex) => {
            const value = model[metric as keyof ModelAccuracy] as number;
            const barHeight = value * chartHeight;
            const x = groupX + metricIndex * barWidth;
            const y = height - padding - barHeight;
            
            return (
              <g key={`bar-${modelIndex}-${metricIndex}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth * 0.8}
                  height={barHeight}
                  fill={colors[metricIndex]}
                  className="hover:opacity-80 cursor-pointer"
                />
                <text
                  x={x + barWidth * 0.4}
                  y={height - padding + 15}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                  transform={`rotate(-45 ${x + barWidth * 0.4} ${height - padding + 15})`}
                >
                  {model.model}
                </text>
              </g>
            );
          });
        })}
        
        {/* Legend */}
        {metrics.map((metric, index) => (
          <g key={`legend-${index}`} transform={`translate(${width - 100}, ${20 + index * 20})`}>
            <rect
              x={0}
              y={0}
              width={12}
              height={12}
              fill={colors[index]}
            />
            <text
              x={16}
              y={10}
              className="text-xs fill-muted-foreground"
            >
              {metric}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Trend Analysis Component
const TrendAnalysis: React.FC<{ 
  trends: TrendAnalysis;
  strength: number;
}> = ({ trends, strength }) => {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return 'text-green-600';
      case 'bearish':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getTrendIcon(trends.direction)}
          <div>
            <h4 className="font-semibold">Market Trend</h4>
            <p className={`text-sm ${getTrendColor(trends.direction)}`}>
              {trends.direction.charAt(0).toUpperCase() + trends.direction.slice(1)}
            </p>
          </div>
        </div>
        <Badge variant={trends.confidence > 0.8 ? "default" : "secondary"}>
          {(trends.confidence * 100).toFixed(1)}% Confident
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Strength</span>
            <span className="font-medium">{(trends.strength * 100).toFixed(1)}%</span>
          </div>
          <Progress value={trends.strength * 100} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{trends.duration} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Progress value={Math.min(trends.duration / 30 * 100, 100)} className="h-2 flex-1" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Key Levels</h5>
        <div className="flex flex-wrap gap-2">
          {trends.keyLevels.map((level, index) => (
            <Badge key={index} variant="outline">
              ${level.toLocaleString()}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

// Key Predictions Component
const KeyPredictions: React.FC<{ 
  predictions: KeyPrediction[];
  timeframe: string;
}> = ({ predictions, timeframe }) => {
  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'price_target':
        return <Target className="h-4 w-4" />;
      case 'support_resistance':
        return <BarChart3 className="h-4 w-4" />;
      case 'trend_reversal':
        return <TrendingUp className="h-4 w-4" />;
      case 'breakout':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case 'price_target':
        return 'border-blue-500';
      case 'support_resistance':
        return 'border-green-500';
      case 'trend_reversal':
        return 'border-yellow-500';
      case 'breakout':
        return 'border-red-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {predictions.map((prediction, index) => (
        <div
          key={index}
          className={`p-4 border-l-4 rounded-lg ${getPredictionColor(prediction.type)} bg-muted/30`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getPredictionIcon(prediction.type)}
              <div>
                <h5 className="font-semibold">
                  {prediction.type.replace('_', ' ').toUpperCase()}
                </h5>
                <p className="text-sm text-muted-foreground mt-1">
                  {prediction.reasoning}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="font-medium">{prediction.timeframe}</span>
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                ${prediction.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {prediction.confidence > 0.8 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {prediction.confidence > 0.8 ? 'High' : 'Medium'} Confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Model Ensemble Component
const ModelEnsemble: React.FC<{ 
  models: ModelInfo[];
  weights: ModelWeights;
}> = ({ models, weights }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold">{model.name}</h5>
              <Badge variant="outline">{model.type}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <Progress value={model.accuracy * 100} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Version: {model.version}
            </div>
            <div className="text-xs text-muted-foreground">
              Last trained: {model.lastTrained.toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <h5 className="font-semibold mb-3">Ensemble Weights</h5>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">ARIMA</span>
            <div className="flex items-center gap-2">
              <Progress value={weights.arima * 100} className="w-24" />
              <span className="text-sm font-medium">{(weights.arima * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Prophet</span>
            <div className="flex items-center gap-2">
              <Progress value={weights.prophet * 100} className="w-24" />
              <span className="text-sm font-medium">{(weights.prophet * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">LSTM</span>
            <div className="flex items-center gap-2">
              <Progress value={weights.lstm * 100} className="w-24" />
              <span className="text-sm font-medium">{(weights.lstm * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {weights.dynamic ? (
            <>
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">Dynamic Weighting Enabled</span>
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Static Weights</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Predictive Analysis Section Component
export const PredictiveAnalysisSection: React.FC<PredictiveAnalysisSectionProps> = ({
  predictiveResults,
  timeframe,
  className = ""
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!predictiveResults) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>No predictive analysis data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Predictive Analysis
          <Badge variant="secondary">{timeframe}</Badge>
        </CardTitle>
        <CardDescription>
          AI-powered market predictions with ensemble forecasting models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Price Prediction Chart */}
            <div className="space-y-3">
              <h4 className="font-semibold">Price Forecast</h4>
              <MiniPriceChart 
                predictions={predictiveResults.pricePredictions || []}
                confidenceIntervals={predictiveResults.confidenceIntervals || []}
              />
            </div>
            
            {/* Trend Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Trend Analysis</h4>
                {predictiveResults.trendAnalysis && (
                  <TrendAnalysis 
                    trends={predictiveResults.trendAnalysis}
                    strength={predictiveResults.trendAnalysis.strength}
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Model Accuracy</h4>
                <ModelAccuracyChart modelAccuracy={predictiveResults.modelAccuracy || []} />
              </div>
            </div>
            
            {/* Key Predictions */}
            <div className="space-y-3">
              <h4 className="font-semibold">Key Insights</h4>
              <KeyPredictions 
                predictions={predictiveResults.keyPredictions || []}
                timeframe={timeframe}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="models" className="space-y-6">
            <ModelEnsemble 
              models={predictiveResults.models || []}
              weights={predictiveResults.modelWeights || { arima: 0.3, prophet: 0.3, lstm: 0.4, dynamic: true, lastUpdated: new Date() }}
            />
          </TabsContent>
          
          <TabsContent value="predictions" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Detailed Price Predictions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(predictiveResults.pricePredictions || []).map((prediction: PricePrediction, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(prediction.timestamp).toLocaleDateString()}
                      </span>
                      <Badge variant={prediction.confidence > 0.8 ? "default" : "secondary"}>
                        {(prediction.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold mb-1">
                      ${prediction.predicted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Model: {prediction.model}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Confidence Intervals</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(predictiveResults.confidenceIntervals || []).map((interval: ConfidenceInterval, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(interval.timestamp).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">
                        {(interval.confidence * 100).toFixed(0)}% CI
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Upper Bound</span>
                        <span className="font-medium text-green-600">
                          ${interval.upper.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lower Bound</span>
                        <span className="font-medium text-red-600">
                          ${interval.lower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Model Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(predictiveResults.modelAccuracy || []).map((model: ModelAccuracy, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold">Model {index + 1}</h5>
                      <Badge variant="outline">ML</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy * 100} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Precision</span>
                          <span className="font-medium">{(model.precision * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.precision * 100} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Recall</span>
                          <span className="font-medium">{(model.recall * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.recall * 100} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">F1-Score</span>
                          <span className="font-medium">{(model.f1Score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.f1Score * 100} className="h-2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">RMSE</div>
                        <div className="font-semibold">{model.rmse.toFixed(4)}</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">MAE</div>
                        <div className="font-semibold">{model.mae.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Performance Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((predictiveResults.modelAccuracy || []).reduce((sum, model) => sum + model.accuracy, 0) / (predictiveResults.modelAccuracy || []).length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Accuracy</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {((predictiveResults.modelAccuracy || []).reduce((sum, model) => sum + model.precision, 0) / (predictiveResults.modelAccuracy || []).length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Precision</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {((predictiveResults.modelAccuracy || []).reduce((sum, model) => sum + model.recall, 0) / (predictiveResults.modelAccuracy || []).length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Recall</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {((predictiveResults.modelAccuracy || []).reduce((sum, model) => sum + model.f1Score, 0) / (predictiveResults.modelAccuracy || []).length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average F1-Score</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};