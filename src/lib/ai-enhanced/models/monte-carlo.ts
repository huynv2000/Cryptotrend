/**
 * Monte Carlo Simulation Model Implementation
 * 
 * This model implements Monte Carlo simulation for financial risk assessment
 * and scenario analysis, supporting various stochastic processes and
 * correlation structures.
 */

import { Logger } from '@/lib/ai-logger';

export interface MonteCarloConfig {
  simulations: number;
  timeSteps: number;
  drift: number;
  volatility: number;
  method: 'euler' | 'milstein';
}

export interface MonteCarloResult {
  paths: number[][];
  finalValues: number[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: { [key: string]: number };
  };
  convergence: {
    meanConvergence: number[];
    stdDevConvergence: number[];
  };
  simulationDate: Date;
  method: string;
  assumptions: string[];
  limitations: string[];
}

export interface MonteCarloInput {
  initialValue: number;
  drift?: number;
  volatility?: number;
  timeHorizon: number;
  correlationMatrix?: number[][];
  riskFactors?: string[];
}

export class MonteCarloSimulation {
  private config: MonteCarloConfig;
  private logger: Logger;

  constructor(config: MonteCarloConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('MonteCarloSimulation');
  }

  /**
   * Run Monte Carlo simulation
   */
  async simulate(input: MonteCarloInput): Promise<MonteCarloResult> {
    this.logger.info('Running Monte Carlo simulation', {
      simulations: this.config.simulations,
      timeSteps: this.config.timeSteps,
      method: this.config.method,
      timeHorizon: input.timeHorizon
    });

    try {
      this.validateInput(input);

      const drift = input.drift !== undefined ? input.drift : this.config.drift;
      const volatility = input.volatility !== undefined ? input.volatility : this.config.volatility;

      let paths: number[][];

      switch (this.config.method) {
        case 'euler':
          paths = this.simulateEulerMaruyama(input.initialValue, drift, volatility, input.timeHorizon);
          break;
        case 'milstein':
          paths = this.simulateMilstein(input.initialValue, drift, volatility, input.timeHorizon);
          break;
        default:
          throw new Error(`Unsupported simulation method: ${this.config.method}`);
      }

      const finalValues = paths.map(path => path[path.length - 1]);
      const statistics = this.calculateStatistics(finalValues);
      const convergence = this.calculateConvergence(paths);

      const result: MonteCarloResult = {
        paths,
        finalValues,
        statistics,
        convergence,
        simulationDate: new Date(),
        method: this.config.method,
        assumptions: [
          'Geometric Brownian Motion process',
          'Constant drift and volatility',
          'Independent increments',
          'No jumps or regime changes'
        ],
        limitations: [
          'Assumes continuous price paths',
          'May not capture extreme events',
          'Sensitive to parameter estimation',
          'Computationally intensive for large simulations'
        ]
      };

      this.logger.info('Monte Carlo simulation completed', {
        mean: statistics.mean,
        stdDev: statistics.stdDev,
        min: statistics.min,
        max: statistics.max
      });

      return result;

    } catch (error) {
      this.logger.error('Monte Carlo simulation failed', error);
      throw new Error(`Monte Carlo simulation failed: ${error.message}`);
    }
  }

  /**
   * Euler-Maruyama discretization scheme
   */
  private simulateEulerMaruyama(initialValue: number, drift: number, volatility: number, timeHorizon: number): number[][] {
    const paths: number[][] = [];
    const dt = timeHorizon / this.config.timeSteps;

    for (let i = 0; i < this.config.simulations; i++) {
      const path: number[] = [initialValue];
      let currentValue = initialValue;

      for (let j = 1; j <= this.config.timeSteps; j++) {
        // Generate random normal variate
        const z = this.generateNormalRandom();
        
        // Euler-Maruyama formula
        const dW = Math.sqrt(dt) * z;
        currentValue = currentValue + drift * currentValue * dt + volatility * currentValue * dW;
        
        path.push(currentValue);
      }

      paths.push(path);
    }

    return paths;
  }

  /**
   * Milstein discretization scheme (higher order accuracy)
   */
  private simulateMilstein(initialValue: number, drift: number, volatility: number, timeHorizon: number): number[][] {
    const paths: number[][] = [];
    const dt = timeHorizon / this.config.timeSteps;

    for (let i = 0; i < this.config.simulations; i++) {
      const path: number[] = [initialValue];
      let currentValue = initialValue;

      for (let j = 1; j <= this.config.timeSteps; j++) {
        // Generate random normal variate
        const z = this.generateNormalRandom();
        
        // Milstein formula
        const dW = Math.sqrt(dt) * z;
        currentValue = currentValue + drift * currentValue * dt + volatility * currentValue * dW + 
                      0.5 * volatility * volatility * currentValue * (dW * dW - dt);
        
        path.push(currentValue);
      }

      paths.push(path);
    }

    return paths;
  }

  /**
   * Generate standard normal random variable using Box-Muller transform
   */
  private generateNormalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    
    // Box-Muller transform
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return z0;
  }

  /**
   * Calculate statistics from simulation results
   */
  private calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: { [key: string]: number };
  } {
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 
      ? (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2 
      : sortedValues[Math.floor(n/2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    const min = sortedValues[0];
    const max = sortedValues[n - 1];
    
    const percentiles: { [key: string]: number } = {
      '5%': sortedValues[Math.floor(0.05 * n)],
      '10%': sortedValues[Math.floor(0.10 * n)],
      '25%': sortedValues[Math.floor(0.25 * n)],
      '50%': median,
      '75%': sortedValues[Math.floor(0.75 * n)],
      '90%': sortedValues[Math.floor(0.90 * n)],
      '95%': sortedValues[Math.floor(0.95 * n)],
      '99%': sortedValues[Math.floor(0.99 * n)]
    };

    return {
      mean,
      median,
      stdDev,
      min,
      max,
      percentiles
    };
  }

  /**
   * Calculate convergence statistics
   */
  private calculateConvergence(paths: number[][]): {
    meanConvergence: number[];
    stdDevConvergence: number[];
  } {
    const meanConvergence: number[] = [];
    const stdDevConvergence: number[] = [];
    
    for (let step = 1; step <= this.config.timeSteps; step++) {
      const valuesAtStep = paths.map(path => path[step]);
      const mean = valuesAtStep.reduce((sum, val) => sum + val, 0) / valuesAtStep.length;
      
      const variance = valuesAtStep.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (valuesAtStep.length - 1);
      const stdDev = Math.sqrt(variance);
      
      meanConvergence.push(mean);
      stdDevConvergence.push(stdDev);
    }

    return {
      meanConvergence,
      stdDevConvergence
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: MonteCarloInput): void {
    if (input.initialValue <= 0) {
      throw new Error('Initial value must be positive');
    }

    if (input.timeHorizon <= 0) {
      throw new Error('Time horizon must be positive');
    }

    if (this.config.simulations <= 0) {
      throw new Error('Number of simulations must be positive');
    }

    if (this.config.timeSteps <= 0) {
      throw new Error('Number of time steps must be positive');
    }

    if (this.config.volatility < 0) {
      throw new Error('Volatility must be non-negative');
    }

    // Validate correlation matrix if provided
    if (input.correlationMatrix) {
      this.validateCorrelationMatrix(input.correlationMatrix);
    }
  }

  /**
   * Validate correlation matrix
   */
  private validateCorrelationMatrix(matrix: number[][]): void {
    const n = matrix.length;
    
    // Check square matrix
    for (let i = 0; i < n; i++) {
      if (matrix[i].length !== n) {
        throw new Error('Correlation matrix must be square');
      }
    }

    // Check symmetry
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-10) {
          throw new Error('Correlation matrix must be symmetric');
        }
      }
    }

    // Check diagonal elements are 1
    for (let i = 0; i < n; i++) {
      if (Math.abs(matrix[i][i] - 1) > 1e-10) {
        throw new Error('Diagonal elements must be 1');
      }
    }

    // Check positive definiteness (simplified check)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && Math.abs(matrix[i][j]) > 1) {
          throw new Error('Off-diagonal elements must be between -1 and 1');
        }
      }
    }
  }

  /**
   * Calculate Value at Risk from simulation results
   */
  calculateVaR(results: MonteCarloResult, confidence: number): number {
    const sortedFinalValues = [...results.finalValues].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedFinalValues.length);
    return sortedFinalValues[index];
  }

  /**
   * Calculate Expected Shortfall from simulation results
   */
  calculateES(results: MonteCarloResult, confidence: number): number {
    const sortedFinalValues = [...results.finalValues].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedFinalValues.length);
    const tailValues = sortedFinalValues.slice(0, index + 1);
    return tailValues.reduce((sum, val) => sum + val, 0) / tailValues.length;
  }

  /**
   * Perform sensitivity analysis
   */
  async sensitivityAnalysis(input: MonteCarloInput, parameters: string[]): Promise<{
    parameter: string;
    sensitivity: number;
    baseValue: number;
    shockedValue: number;
  }[]> {
    const baseResult = await this.simulate(input);
    const baseMean = baseResult.statistics.mean;

    const sensitivities: {
      parameter: string;
      sensitivity: number;
      baseValue: number;
      shockedValue: number;
    }[] = [];

    for (const param of parameters) {
      let shockedInput = { ...input };
      let shockAmount = 0.01; // 1% shock

      switch (param) {
        case 'drift':
          shockedInput.drift = (input.drift || this.config.drift) * (1 + shockAmount);
          break;
        case 'volatility':
          shockedInput.volatility = (input.volatility || this.config.volatility) * (1 + shockAmount);
          break;
        case 'initialValue':
          shockedInput.initialValue = input.initialValue * (1 + shockAmount);
          break;
        default:
          continue;
      }

      const shockedResult = await this.simulate(shockedInput);
      const shockedMean = shockedResult.statistics.mean;

      const sensitivity = (shockedMean - baseMean) / baseMean;

      sensitivities.push({
        parameter: param,
        sensitivity,
        baseValue: baseMean,
        shockedValue: shockedMean
      });
    }

    return sensitivities;
  }

  /**
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'Monte Carlo Simulation Model',
      version: '1.0.0',
      description: 'Stochastic simulation for financial risk assessment',
      supportedMethods: ['euler', 'milstein'],
      config: this.config
    };
  }
}