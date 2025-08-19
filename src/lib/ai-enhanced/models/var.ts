/**
 * Value at Risk (VaR) Model Implementation
 * Basel III compliant risk calculation model
 * 
 * This model calculates the maximum potential loss over a specified
 * time horizon at a given confidence level, using multiple calculation methods.
 */

import { Logger } from '@/lib/ai-logger';

export interface VaRConfig {
  confidence: number;
  timeHorizon: number;
  method: 'historical' | 'parametric' | 'monte-carlo';
}

export interface VaRResult {
  var: number;
  confidence: number;
  timeHorizon: number;
  method: string;
  calculationDate: Date;
  assumptions: string[];
  limitations: string[];
}

export interface VaRInput {
  returns: number[];
  portfolioValue: number;
  volatility?: number;
  mean?: number;
}

export class VaRModel {
  private config: VaRConfig;
  private logger: Logger;

  constructor(config: VaRConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('VaRModel');
  }

  /**
   * Calculate Value at Risk using specified method
   */
  async calculate(input: VaRInput): Promise<VaRResult> {
    this.logger.info('Calculating Value at Risk', {
      method: this.config.method,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon
    });

    try {
      let result: VaRResult;

      switch (this.config.method) {
        case 'historical':
          result = await this.calculateHistoricalVaR(input);
          break;
        case 'parametric':
          result = await this.calculateParametricVaR(input);
          break;
        case 'monte-carlo':
          result = await this.calculateMonteCarloVaR(input);
          break;
        default:
          throw new Error(`Unsupported VaR method: ${this.config.method}`);
      }

      this.logger.info('VaR calculation completed', {
        var: result.var,
        method: result.method,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('VaR calculation failed', error);
      throw new Error(`VaR calculation failed: ${error.message}`);
    }
  }

  /**
   * Historical Simulation Method
   * Uses historical returns distribution to calculate VaR
   */
  private async calculateHistoricalVaR(input: VaRInput): Promise<VaRResult> {
    const { returns, portfolioValue } = input;
    
    if (returns.length === 0) {
      throw new Error('No historical returns provided');
    }

    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate percentile index
    const percentile = 1 - this.config.confidence;
    const index = Math.floor(percentile * sortedReturns.length);
    
    // Get VaR return
    const varReturn = sortedReturns[index];
    const varValue = Math.abs(varReturn * portfolioValue);

    return {
      var: varValue,
      confidence: this.config.confidence,
      timeHorizon: this.config.timeHorizon,
      method: 'historical',
      calculationDate: new Date(),
      assumptions: [
        'Historical returns are representative of future returns',
        'Return distribution is stable over time',
        'No structural breaks in the data'
      ],
      limitations: [
        'Dependent on historical data quality',
        'May not capture extreme events not in historical data',
        'Assumes stationarity of returns'
      ]
    };
  }

  /**
   * Parametric Method (Variance-Covariance)
   * Assumes normal distribution of returns
   */
  private async calculateParametricVaR(input: VaRInput): Promise<VaRResult> {
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

    // Scale for time horizon (square root of time rule)
    const timeScaling = Math.sqrt(this.config.timeHorizon);
    const scaledVarValue = varValue * timeScaling;

    return {
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
        'Underestimates tail risk',
        'Sensitive to volatility estimation'
      ]
    };
  }

  /**
   * Monte Carlo Simulation Method
   * Generates random scenarios to calculate VaR
   */
  private async calculateMonteCarloVaR(input: VaRInput): Promise<VaRResult> {
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
    
    // Calculate percentile
    const percentile = 1 - this.config.confidence;
    const index = Math.floor(percentile * sortedReturns.length);
    
    // Get VaR return
    const varReturn = sortedReturns[index];
    const varValue = Math.abs(varReturn * portfolioValue);

    return {
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
      ]
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
    // Approximate Z-scores for common confidence levels
    const zScores: { [key: number]: number } = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.999: 3.090
    };

    return zScores[confidence] || this.inverseNormalCDF(confidence);
  }

  /**
   * Approximate inverse normal CDF using Beasley-Springer-Moro algorithm
   */
  private inverseNormalCDF(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];

    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

    const p_low = 0.02425;
    const p_high = 1 - p_low;
    let q, r;

    if (p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      r = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= p_high) {
      q = p - 0.5;
      r = q * q;
      r = q * (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      r = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    return r;
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
  private validateInput(input: VaRInput): void {
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
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'Value at Risk Model',
      version: '1.0.0',
      description: 'Basel III compliant VaR calculation with multiple methods',
      supportedMethods: ['historical', 'parametric', 'monte-carlo'],
      config: this.config
    };
  }
}