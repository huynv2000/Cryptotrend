/**
 * Data Quality Assessment System for Crypto Analytics
 * 
 * Hệ thống đánh giá chất lượng dữ liệu cho các chỉ số crypto,
 * bao gồm:
 * - Đánh giá độ tin cậy của nguồn dữ liệu
 * - Kiểm tra tính kịp thời của dữ liệu
 * - Đánh giá độ chính xác và đầy đủ
 * - Cảnh báo khi chất lượng dữ liệu xuống cấp
 * 
 * @author Crypto Analytics Team
 * @version 1.0
 */

export interface DataQualityMetric {
  metric: string;
  source: string;
  category: 'on-chain' | 'technical' | 'sentiment' | 'derivative';
  
  // Quality dimensions (0-100 scale)
  timeliness: number;    // Cập nhật kịp thời
  accuracy: number;      // Độ chính xác
  completeness: number;  // Độ đầy đủ
  reliability: number;  // Độ tin cậy nguồn
  consistency: number;   // Tính nhất quán
  
  // Overall assessment
  overallScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  
  // Metadata
  lastUpdated: Date;
  dataAge: number; // minutes since last update
  updateFrequency: number; // expected update frequency in minutes
  confidence: number; // confidence in the assessment (0-1)
}

export interface DataSourceQuality {
  source: string;
  apiStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
  responseTime: number; // milliseconds
  successRate: number; // percentage of successful requests
  lastCheck: Date;
  reliability: number; // 0-100
}

export interface SystemQualityReport {
  overallScore: number;
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  totalMetrics: number;
  excellentMetrics: number;
  goodMetrics: number;
  fairMetrics: number;
  poorMetrics: number;
  criticalMetrics: number;
  
  metrics: DataQualityMetric[];
  dataSources: DataSourceQuality[];
  
  alerts: QualityAlert[];
  recommendations: string[];
  
  generatedAt: Date;
}

export interface QualityAlert {
  id: string;
  type: 'DATA_DELAY' | 'API_DOWN' | 'QUALITY_DEGRADED' | 'INCONSISTENT_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metric: string;
  message: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  resolved: boolean;
}

export class DataQualityAssessment {
  private static instance: DataQualityAssessment;
  private metrics: Map<string, DataQualityMetric> = new Map();
  private dataSources: Map<string, DataSourceQuality> = new Map();
  private alerts: QualityAlert[] = [];
  
  // Configuration for expected update frequencies (in minutes)
  private updateFrequencies: Record<string, number> = {
    'mvrv': 60,
    'nupl': 60,
    'sopr': 60,
    'activeAddresses': 30,
    'exchangeInflow': 15,
    'exchangeOutflow': 15,
    'transactionVolume': 30,
    'rsi': 5,
    'ma50': 60,
    'ma200': 60,
    'macd': 15,
    'bollingerUpper': 15,
    'fearGreedIndex': 1440, // Daily
    'socialSentiment': 60,
    'googleTrends': 1440,
    'newsSentiment': 120,
    'openInterest': 15,
    'fundingRate': 5,
    'liquidationVolume': 15,
    'putCallRatio': 60
  };
  
  // Configuration for data source reliability
  private sourceReliability: Record<string, number> = {
    'CoinGecko': 95,
    'Glassnode': 90,
    'CryptoQuant': 88,
    'Alternative.me': 85,
    'Coinglass': 87,
    'Santiment': 75,
    'Google Trends': 80,
    'Calculated': 92
  };
  
  static getInstance(): DataQualityAssessment {
    if (!DataQualityAssessment.instance) {
      DataQualityAssessment.instance = new DataQualityAssessment();
    }
    return DataQualityAssessment.instance;
  }
  
  /**
   * Update metric quality assessment
   */
  updateMetricQuality(metricName: string, data: {
    source: string;
    category: 'on-chain' | 'technical' | 'sentiment' | 'derivative';
    lastUpdated: Date;
    hasData: boolean;
    value?: any;
    expectedValue?: any;
  }): void {
    const now = new Date();
    const dataAge = (now.getTime() - data.lastUpdated.getTime()) / (1000 * 60); // minutes
    const expectedFrequency = this.updateFrequencies[metricName] || 60;
    
    // Calculate quality dimensions
    const timeliness = this.calculateTimeliness(dataAge, expectedFrequency);
    const accuracy = this.calculateAccuracy(data.hasData, data.value, data.expectedValue);
    const completeness = this.calculateCompleteness(data.hasData, data.value);
    const reliability = this.sourceReliability[data.source] || 50;
    const consistency = this.calculateConsistency(metricName, data.value);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      timeliness,
      accuracy,
      completeness,
      reliability,
      consistency
    });
    
    // Determine status
    const status = this.determineStatus(overallScore);
    
    const qualityMetric: DataQualityMetric = {
      metric: metricName,
      source: data.source,
      category: data.category,
      timeliness,
      accuracy,
      completeness,
      reliability,
      consistency,
      overallScore,
      status,
      lastUpdated: now,
      dataAge,
      updateFrequency: expectedFrequency,
      confidence: this.calculateConfidence(qualityMetric)
    };
    
    this.metrics.set(metricName, qualityMetric);
    
    // Generate alerts if needed
    this.generateAlerts(metricName, qualityMetric);
  }
  
  /**
   * Update data source quality
   */
  updateDataSourceQuality(source: string, status: {
    apiStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
    responseTime: number;
    successRate: number;
  }): void {
    const reliability = this.calculateSourceReliability(status);
    
    const sourceQuality: DataSourceQuality = {
      source,
      apiStatus: status.apiStatus,
      responseTime: status.responseTime,
      successRate: status.successRate,
      lastCheck: new Date(),
      reliability
    };
    
    this.dataSources.set(source, sourceQuality);
  }
  
  /**
   * Generate system quality report
   */
  generateReport(): SystemQualityReport {
    const metricsArray = Array.from(this.metrics.values());
    const sourcesArray = Array.from(this.dataSources.values());
    
    // Calculate statistics
    const totalMetrics = metricsArray.length;
    const excellentMetrics = metricsArray.filter(m => m.status === 'EXCELLENT').length;
    const goodMetrics = metricsArray.filter(m => m.status === 'GOOD').length;
    const fairMetrics = metricsArray.filter(m => m.status === 'FAIR').length;
    const poorMetrics = metricsArray.filter(m => m.status === 'POOR').length;
    const criticalMetrics = metricsArray.filter(m => m.status === 'CRITICAL').length;
    
    // Calculate overall score
    const overallScore = metricsArray.length > 0 
      ? metricsArray.reduce((sum, m) => sum + m.overallScore, 0) / metricsArray.length
      : 0;
    
    // Determine system status
    const systemStatus = this.determineSystemStatus(overallScore, criticalMetrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metricsArray, sourcesArray);
    
    return {
      overallScore,
      systemStatus,
      totalMetrics,
      excellentMetrics,
      goodMetrics,
      fairMetrics,
      poorMetrics,
      criticalMetrics,
      metrics: metricsArray,
      dataSources: sourcesArray,
      alerts: this.alerts.filter(a => !a.resolved),
      recommendations,
      generatedAt: new Date()
    };
  }
  
  /**
   * Get metric quality by name
   */
  getMetricQuality(metricName: string): DataQualityMetric | undefined {
    return this.metrics.get(metricName);
  }
  
  /**
   * Get all active alerts
   */
  getActiveAlerts(): QualityAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }
  
  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }
  
  // Private helper methods
  
  private calculateTimeliness(dataAge: number, expectedFrequency: number): number {
    if (dataAge <= expectedFrequency * 0.5) return 100;
    if (dataAge <= expectedFrequency) return 90;
    if (dataAge <= expectedFrequency * 2) return 70;
    if (dataAge <= expectedFrequency * 4) return 50;
    if (dataAge <= expectedFrequency * 8) return 30;
    return 10;
  }
  
  private calculateAccuracy(hasData: boolean, value?: any, expectedValue?: any): number {
    if (!hasData) return 0;
    if (!value || !expectedValue) return 70; // Can't verify accuracy
    
    // Simple accuracy check - in real implementation, this would be more sophisticated
    try {
      const diff = Math.abs(Number(value) - Number(expectedValue));
      const percentDiff = diff / Number(expectedValue);
      
      if (percentDiff <= 0.01) return 100; // 1% difference
      if (percentDiff <= 0.05) return 90;  // 5% difference
      if (percentDiff <= 0.10) return 70;  // 10% difference
      if (percentDiff <= 0.20) return 50;  // 20% difference
      return 30;
    } catch {
      return 60; // Can't compare values
    }
  }
  
  private calculateCompleteness(hasData: boolean, value?: any): number {
    if (!hasData) return 0;
    if (!value) return 50;
    return 100;
  }
  
  private calculateConsistency(metricName: string, value?: any): number {
    // In a real implementation, this would check for consistency with historical data
    // For now, return a reasonable default
    return 85;
  }
  
  private calculateOverallScore(dimensions: {
    timeliness: number;
    accuracy: number;
    completeness: number;
    reliability: number;
    consistency: number;
  }): number {
    const weights = {
      timeliness: 0.25,
      accuracy: 0.30,
      completeness: 0.20,
      reliability: 0.15,
      consistency: 0.10
    };
    
    return Math.round(
      dimensions.timeliness * weights.timeliness +
      dimensions.accuracy * weights.accuracy +
      dimensions.completeness * weights.completeness +
      dimensions.reliability * weights.reliability +
      dimensions.consistency * weights.consistency
    );
  }
  
  private determineStatus(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'CRITICAL';
  }
  
  private calculateConfidence(metric: DataQualityMetric): number {
    // Confidence based on consistency and reliability
    return Math.min(100, Math.round(
      (metric.consistency * 0.6 + metric.reliability * 0.4)
    ));
  }
  
  private calculateSourceReliability(status: {
    apiStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
    responseTime: number;
    successRate: number;
  }): number {
    let reliability = status.successRate;
    
    // Adjust based on API status
    switch (status.apiStatus) {
      case 'UP':
        break; // No adjustment
      case 'DEGRADED':
        reliability *= 0.8;
        break;
      case 'DOWN':
        reliability *= 0.1;
        break;
      case 'UNKNOWN':
        reliability *= 0.5;
        break;
    }
    
    // Adjust based on response time
    if (status.responseTime > 5000) { // > 5 seconds
      reliability *= 0.8;
    } else if (status.responseTime > 2000) { // > 2 seconds
      reliability *= 0.9;
    }
    
    return Math.round(Math.min(100, Math.max(0, reliability)));
  }
  
  private generateAlerts(metricName: string, quality: DataQualityMetric): void {
    const alerts: QualityAlert[] = [];
    
    // Data delay alert
    if (quality.dataAge > quality.updateFrequency * 4) {
      alerts.push({
        id: `${metricName}_delay_${Date.now()}`,
        type: 'DATA_DELAY',
        severity: quality.dataAge > quality.updateFrequency * 8 ? 'HIGH' : 'MEDIUM',
        metric: metricName,
        message: `Data delay detected for ${metricName}`,
        description: `${metricName} data is ${Math.round(quality.dataAge)} minutes old, expected ${quality.updateFrequency} minutes`,
        recommendation: 'Check data source connection and update frequency',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    // Poor quality alert
    if (quality.status === 'POOR' || quality.status === 'CRITICAL') {
      alerts.push({
        id: `${metricName}_quality_${Date.now()}`,
        type: 'QUALITY_DEGRADED',
        severity: quality.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        metric: metricName,
        message: `Poor data quality for ${metricName}`,
        description: `${metricName} quality score is ${quality.overallScore}/100 (${quality.status})`,
        recommendation: 'Investigate data source and consider using fallback data',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    // Add new alerts
    alerts.forEach(alert => {
      // Check if similar alert already exists
      const existingAlert = this.alerts.find(a => 
        a.metric === alert.metric && 
        a.type === alert.type && 
        !a.resolved &&
        (Date.now() - a.timestamp.getTime()) < 30 * 60 * 1000 // 30 minutes
      );
      
      if (!existingAlert) {
        this.alerts.push(alert);
      }
    });
  }
  
  private determineSystemStatus(overallScore: number, criticalMetrics: number): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    if (overallScore >= 80 && criticalMetrics === 0) return 'HEALTHY';
    if (overallScore >= 60 && criticalMetrics <= 2) return 'DEGRADED';
    return 'CRITICAL';
  }
  
  private generateRecommendations(metrics: DataQualityMetric[], sources: DataSourceQuality[]): string[] {
    const recommendations: string[] = [];
    
    // Check for critical metrics
    const criticalMetrics = metrics.filter(m => m.status === 'CRITICAL');
    if (criticalMetrics.length > 0) {
      recommendations.push(`Address ${criticalMetrics.length} critical metrics immediately`);
    }
    
    // Check for poor data sources
    const poorSources = sources.filter(s => s.reliability < 70);
    if (poorSources.length > 0) {
      recommendations.push(`Improve data source reliability for: ${poorSources.map(s => s.source).join(', ')}`);
    }
    
    // Check for delayed data
    const delayedMetrics = metrics.filter(m => m.dataAge > m.updateFrequency * 2);
    if (delayedMetrics.length > 0) {
      recommendations.push(`Reduce data latency for ${delayedMetrics.length} metrics`);
    }
    
    // General recommendations
    if (metrics.length > 0) {
      const avgScore = metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length;
      if (avgScore < 70) {
        recommendations.push('Consider implementing additional data sources for redundancy');
      }
    }
    
    return recommendations;
  }
}