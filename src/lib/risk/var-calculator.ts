// Value at Risk (VaR) Calculator
// Implements various VaR calculation methods for risk management

export interface VaRInput {
  portfolioValue: number;
  returns: number[];
  confidenceLevel: number; // 0.95 or 0.99
  timeHorizon: number; // in days
}

export interface VaRResult {
  var: number;
  confidenceLevel: number;
  timeHorizon: number;
  method: string;
  calculationDate: string;
}

export interface ExpectedShortfallResult {
  expectedShortfall: number;
  confidenceLevel: number;
  var: number;
  tailLosses: number[];
}

export class VaRCalculator {
  /**
   * Historical VaR calculation
   * Uses historical return distribution to calculate VaR
   */
  static calculateHistoricalVaR(input: VaRInput): VaRResult {
    const { portfolioValue, returns, confidenceLevel, timeHorizon } = input;
    
    if (returns.length === 0) {
      throw new Error('No historical returns data provided');
    }

    // Sort returns in ascending order (worst to best)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate the index for the confidence level
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[index] || 0;
    
    // Scale by portfolio value and time horizon
    const timeHorizonSqrt = Math.sqrt(timeHorizon);
    const varValue = Math.abs(varReturn * portfolioValue * timeHorizonSqrt);

    return {
      var: varValue,
      confidenceLevel,
      timeHorizon,
      method: 'Historical',
      calculationDate: new Date().toISOString(),
    };
  }

  /**
   * Parametric VaR calculation (Variance-Covariance method)
   * Assumes normal distribution of returns
   */
  static calculateParametricVaR(input: VaRInput): VaRResult {
    const { portfolioValue, returns, confidenceLevel, timeHorizon } = input;
    
    if (returns.length === 0) {
      throw new Error('No returns data provided');
    }

    // Calculate mean and standard deviation
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate Z-score for the confidence level
    const zScore = this.getZScore(confidenceLevel);
    
    // Calculate VaR
    const timeHorizonSqrt = Math.sqrt(timeHorizon);
    const varValue = Math.abs(zScore * standardDeviation * portfolioValue * timeHorizonSqrt);

    return {
      var: varValue,
      confidenceLevel,
      timeHorizon,
      method: 'Parametric',
      calculationDate: new Date().toISOString(),
    };
  }

  /**
   * Monte Carlo VaR calculation
   * Simulates multiple scenarios to estimate VaR
   */
  static calculateMonteCarloVaR(input: VaRInput, simulations: number = 10000): VaRResult {
    const { portfolioValue, returns, confidenceLevel, timeHorizon } = input;
    
    if (returns.length === 0) {
      throw new Error('No returns data provided');
    }

    // Calculate mean and standard deviation from historical data
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);

    // Generate random scenarios using normal distribution
    const simulatedReturns: number[] = [];
    for (let i = 0; i < simulations; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      const simulatedReturn = mean + z0 * standardDeviation;
      simulatedReturns.push(simulatedReturn);
    }

    // Sort simulated returns and find VaR
    simulatedReturns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * simulatedReturns.length);
    const varReturn = simulatedReturns[index] || 0;

    // Scale by portfolio value and time horizon
    const timeHorizonSqrt = Math.sqrt(timeHorizon);
    const varValue = Math.abs(varReturn * portfolioValue * timeHorizonSqrt);

    return {
      var: varValue,
      confidenceLevel,
      timeHorizon,
      method: 'Monte Carlo',
      calculationDate: new Date().toISOString(),
    };
  }

  /**
   * Calculate Expected Shortfall (CVaR)
   * Average loss beyond VaR
   */
  static calculateExpectedShortfall(
    portfolioValue: number, 
    returns: number[], 
    confidenceLevel: number
  ): ExpectedShortfallResult {
    if (returns.length === 0) {
      throw new Error('No returns data provided');
    }

    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate VaR first
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex] || 0;
    const varValue = Math.abs(varReturn * portfolioValue);

    // Calculate average of losses beyond VaR
    const tailLosses = sortedReturns.slice(0, varIndex + 1);
    const averageTailReturn = tailLosses.reduce((sum, ret) => sum + ret, 0) / tailLosses.length;
    const expectedShortfall = Math.abs(averageTailReturn * portfolioValue);

    return {
      expectedShortfall,
      confidenceLevel,
      var: varValue,
      tailLosses: tailLosses.map(ret => ret * portfolioValue),
    };
  }

  /**
   * Calculate multiple VaR metrics for comparison
   */
  static calculateAllVaRMetrics(input: VaRInput): {
    historical: VaRResult;
    parametric: VaRResult;
    monteCarlo: VaRResult;
    expectedShortfall: ExpectedShortfallResult;
  } {
    const historical = this.calculateHistoricalVaR(input);
    const parametric = this.calculateParametricVaR(input);
    const monteCarlo = this.calculateMonteCarloVaR(input);
    const expectedShortfall = this.calculateExpectedShortfall(
      input.portfolioValue,
      input.returns,
      input.confidenceLevel
    );

    return {
      historical,
      parametric,
      monteCarlo,
      expectedShortfall,
    };
  }

  /**
   * Get Z-score for given confidence level
   */
  private static getZScore(confidenceLevel: number): number {
    // Common Z-scores for normal distribution
    const zScores: { [key: number]: number } = {
      0.90: 1.28,
      0.95: 1.645,
      0.99: 2.33,
      0.995: 2.58,
      0.999: 3.09,
    };

    return zScores[confidenceLevel] || 1.645; // Default to 95%
  }

  /**
   * Validate input parameters
   */
  static validateInput(input: VaRInput): void {
    if (input.portfolioValue <= 0) {
      throw new Error('Portfolio value must be positive');
    }

    if (input.returns.length === 0) {
      throw new Error('Returns array cannot be empty');
    }

    if (input.confidenceLevel <= 0 || input.confidenceLevel >= 1) {
      throw new Error('Confidence level must be between 0 and 1');
    }

    if (input.timeHorizon <= 0) {
      throw new Error('Time horizon must be positive');
    }
  }

  /**
   * Generate sample returns for testing
   */
  static generateSampleReturns(
    mean: number = 0.001, 
    stdDev: number = 0.02, 
    count: number = 252
  ): number[] {
    const returns: number[] = [];
    for (let i = 0; i < count; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      returns.push(mean + z0 * stdDev);
    }
    return returns;
  }
}

// Utility functions for risk calculations
export class RiskUtils {
  /**
   * Calculate volatility from returns
   */
  static calculateVolatility(returns: number[], annualized: boolean = true): number {
    if (returns.length < 2) {
      return 0;
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (annualized) {
      return stdDev * Math.sqrt(252); // Annualize assuming 252 trading days
    }

    return stdDev;
  }

  /**
   * Calculate maximum drawdown
   */
  static calculateMaxDrawdown(returns: number[]): { maxDrawdown: number; duration: number } {
    if (returns.length === 0) {
      return { maxDrawdown: 0, duration: 0 };
    }

    let peak = 1;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let drawdownDuration = 0;
    let maxDuration = 0;

    for (let i = 0; i < returns.length; i++) {
      const cumulativeReturn = returns.slice(0, i + 1).reduce((acc, ret) => acc * (1 + ret), 1);
      
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
        currentDrawdown = 0;
        drawdownDuration = 0;
      } else {
        currentDrawdown = (peak - cumulativeReturn) / peak;
        drawdownDuration++;
        
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
          maxDuration = drawdownDuration;
        }
      }
    }

    return { maxDrawdown, duration: maxDuration };
  }

  /**
   * Calculate Sharpe ratio
   */
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) {
      return 0;
    }

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const excessReturn = meanReturn - (riskFreeRate / 252); // Daily risk-free rate
    const volatility = this.calculateVolatility(returns, false);

    if (volatility === 0) {
      return 0;
    }

    return (excessReturn / volatility) * Math.sqrt(252); // Annualize
  }

  /**
   * Calculate beta relative to market
   */
  static calculateBeta(assetReturns: number[], marketReturns: number[]): number {
    if (assetReturns.length !== marketReturns.length || assetReturns.length === 0) {
      return 1; // Default beta
    }

    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / assetReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < assetReturns.length; i++) {
      const assetDeviation = assetReturns[i] - assetMean;
      const marketDeviation = marketReturns[i] - marketMean;
      
      covariance += assetDeviation * marketDeviation;
      marketVariance += marketDeviation * marketDeviation;
    }

    if (marketVariance === 0) {
      return 1;
    }

    return covariance / marketVariance;
  }
}