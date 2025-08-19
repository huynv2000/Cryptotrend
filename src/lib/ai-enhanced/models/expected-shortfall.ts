/**
 * Expected Shortfall (ES) Model Implementation
 * Also known as Conditional Value at Risk (CVaR)
 * 
 * This model calculates the expected loss given that the loss exceeds
 * the Value at Risk threshold, providing a more comprehensive risk measure.
 */

import { Logger } from '@/lib/ai-logger';

export interface ExpectedShortfallConfig {
  confidence: number;
  timeHorizon: number;
  method: 'historical' | 'parametric' | 'monte-carlo';
}

export interface ExpectedShortfallResult {
  expectedShortfall: number;
  var: number;
  confidence: number;
  timeHorizon: number;
  method: string;
  calculationDate: Date;
  assumptions: string[];
  limitations: string[];
  tailLosses: number[];
  averageTailLoss: number;
}

export interface ExpectedShortfallInput {
  returns: number[];
  portfolioValue: number;
  volatility?: number;
  mean?: number;
}

export class ExpectedShortfallModel {
  private config: ExpectedShortfallConfig;
  private logger: Logger;

  constructor(config: ExpectedShortfallConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('ExpectedShortfallModel');
  }

  /**
   * Calculate Expected Shortfall using specified method
   */
  async calculate(input: ExpectedShortfallInput): Promise<ExpectedShortfallResult> {
    this.logger.info('Calculating Expected Shortfall', {
      method: this.config.method,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon
    });

    try {
      let result: ExpectedShortfallResult;

      switch (this.config.method) {
        case 'historical':
          result = await this.calculateHistoricalES(input);
          break;
        case 'parametric':
          result = await this.calculateParametricES(input);
          break;
        case 'monte-carlo':
          result = await this.calculateMonteCarloES(input);
          break;
        default:
          throw new Error(`Unsupported ES method: ${this.config.method}`);
      }

      this.logger.info('Expected Shortfall calculation completed', {
        expectedShortfall: result.expectedShortfall,
        var: result.var,
        method: result.method,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('Expected Shortfall calculation failed', error);
      throw new Error(`Expected Shortfall calculation failed: ${error.message}`);
    }
  }

  /**
   * Historical Simulation Method
   * Uses historical returns distribution to calculate ES
   */
  private async calculateHistoricalES(input: ExpectedShortfallInput): Promise<ExpectedShortfallResult> {
    const { returns, portfolioValue } = input;
    
    if (returns.length === 0) {
      throw new Error('No historical returns provided');
    }

    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate VaR first
    const percentile = 1 - this.config.confidence;
    const varIndex = Math.floor(percentile * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    const varValue = Math.abs(varReturn * portfolioValue);

    // Calculate Expected Shortfall (average of losses beyond VaR)
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const averageTailReturn = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    const expectedShortfallValue = Math.abs(averageTailReturn * portfolioValue);

    return {
      expectedShortfall: expectedShortfallValue,
      var: varValue,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon,
      method: 'historical',
      calculationDate: new Date(),
      assumptions: [
        'Historical returns are representative of future returns',
        'Return distribution is stable over time',
        'Sufficient tail observations for reliable estimation'
      ],
      limitations: [
        'Dependent on historical data quality',
        'May not capture extreme events not in historical data',
        'Sensitive to the number of tail observations'
      ],
      tailLosses: tailReturns.map(ret => Math.abs(ret * portfolioValue)),
      averageTailLoss: expectedShortfallValue
    };
  }

  /**
   * Parametric Method
   * Assumes normal distribution of returns
   */
  private async calculateParametricES(input: ExpectedShortfallInput): Promise<ExpectedShortfallResult> {
    const { returns, portfolioValue, volatility, mean } = input;
    
    if (returns.length === 0) {
      throw new Error('No returns provided for parametric calculation');
    }

    // Calculate mean and volatility if not provided
    const calculatedMean = mean !== undefined ? mean : this.calculateMean(returns);
    const calculatedVolatility = volatility !== undefined ? volatility : this.calculateVolatility(returns, calculatedMean);

    // Calculate Z-score for confidence level
    const zScore = this.getZScore(this.config.confidence);
    
    // Calculate VaR
    const varReturn = calculatedMean - zScore * calculatedVolatility;
    const varValue = Math.abs(varReturn * portfolioValue);

    // Calculate Expected Shortfall for normal distribution
    const phi = this.normalPDF(zScore);
    const alpha = 1 - this.config.confidence;
    const esReturn = calculatedMean - (calculatedVolatility * phi) / alpha;
    const expectedShortfallValue = Math.abs(esReturn * portfolioValue);

    // Scale for time horizon
    const timeScaling = Math.sqrt(this.config.timeHorizon);
    const scaledVarValue = varValue * timeScaling;
    const scaledExpectedShortfallValue = expectedShortfallValue * timeScaling;

    return {
      expectedShortfall: scaledExpectedShortfallValue,
      var: scaledVarValue,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon,
      method: 'parametric',
      calculationDate: new Date(),
      assumptions: [
        'Returns are normally distributed',
        'Volatility is constant over time',
        'No autocorrelation in returns',
        'Square root of time rule applies'
      ],
      limitations: [
        'Normal distribution assumption may not hold',
        'Underestimates tail risk for fat-tailed distributions',
        'Sensitive to volatility estimation'
      ],
      tailLosses: [],
      averageTailLoss: scaledExpectedShortfallValue
    };
  }

  /**
   * Monte Carlo Simulation Method
   * Generates random scenarios to calculate ES
   */
  private async calculateMonteCarloES(input: ExpectedShortfallInput): Promise<ExpectedShortfallResult> {
    const { returns, portfolioValue } = input;
    
    if (returns.length === 0) {
      throw new Error('No returns provided for Monte Carlo calculation');
    }

    // Calculate parameters from historical data
    const mean = this.calculateMean(returns);
    const volatility = this.calculateVolatility(returns, mean);

    // Run Monte Carlo simulation
    const simulations = 10000;
    const simulatedReturns = this.runMonteCarloSimulation(mean, volatility, simulations);
    
    // Sort simulated returns
    const sortedReturns = simulatedReturns.sort((a, b) => a - b);
    
    // Calculate VaR
    const percentile = 1 - this.config.confidence;
    const varIndex = Math.floor(percentile * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    const varValue = Math.abs(varReturn * portfolioValue);

    // Calculate Expected Shortfall
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const averageTailReturn = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    const expectedShortfallValue = Math.abs(averageTailReturn * portfolioValue);

    return {
      expectedShortfall: expectedShortfallValue,
      var: varValue,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon,
      method: 'monte-carlo',
      calculationDate: new Date(),
      assumptions: [
        'Return generating process is correctly specified',
        'Sufficient number of simulations',
        'Parameters are stable over simulation period'
      ],
      limitations: [
        'Computationally intensive',
        'Dependent on model assumptions',
        'May suffer from simulation noise'
      ],
      tailLosses: tailReturns.map(ret => Math.abs(ret * portfolioValue)),
      averageTailLoss: expectedShortfallValue
    };
  }

  /**
   * Calculate mean of returns
   */
  private calculateMean(returns: number[]): number {
    return returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  }

  /**
   * Calculate volatility (standard deviation) of returns
   */
  private calculateVolatility(returns: number[], mean: number): number {
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Get Z-score for given confidence level
   */
  private getZScore(confidence: number): number {
    const zScores: { [key: number]: number } = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.999: 3.090
    };

    return zScores[confidence] || this.inverseNormalCDF(confidence);
  }

  /**
   * Normal probability density function
   */
  private normalPDF(x: number): number {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  }

  /**
   * Approximate inverse normal CDF
   */
  private inverseNormalCDF(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    // Simple approximation for common confidence levels
    const approximations: { [key: number]: number } = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.999: 3.090
    };

    return approximations[p] || 0; // Fallback
  }

  /**
   * Run Monte Carlo simulation
   */
  private runMonteCarloSimulation(mean: number, volatility: number, simulations: number): number[] {
    const returns: number[] = [];
    
    for (let i = 0; i < simulations; i++) {
      // Generate random normal variate using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Generate return
      const ret = mean + volatility * z0;
      returns.push(ret);
    }
    
    return returns;
  }

  /**
   * Validate input data
   */
  private validateInput(input: ExpectedShortfallInput): void {
    if (!input.returns || input.returns.length === 0) {
      throw new Error('Returns array is required and cannot be empty');
    }

    if (input.portfolioValue <= 0) {
      throw new Error('Portfolio value must be positive');
    }

    if (this.config.confidence <= 0 || this.config.confidence >= 1) {
      throw new Error('Confidence level must be between 0 and 1');
    }

    if (this.config.timeHorizon <= 0) {
      throw new Error('Time horizon must be positive');
    }
  }

  /**
   * Calculate risk contribution analysis
   */
  async calculateRiskContributions(input: ExpectedShortfallInput): Promise<{
    totalRisk: number;
    varContribution: number;
    esContribution: number;
    riskRatio: number;
  }> {
    const esResult = await this.calculate(input);
    
    return {
      totalRisk: esResult.expectedShortfall,
      varContribution: esResult.var,
      esContribution: esResult.expectedShortfall - esResult.var,
      riskRatio: esResult.expectedShortfall / esResult.var
    };
  }

  /**
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'Expected Shortfall Model',
      version: '1.0.0',
      description: 'Conditional Value at Risk calculation with multiple methods',
      supportedMethods: ['historical', 'parametric', 'monte-carlo'],
      config: this.config
    };
  }
}