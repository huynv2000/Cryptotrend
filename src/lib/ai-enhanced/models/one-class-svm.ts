/**
 * One-Class SVM Model Implementation
 * 
 * This model implements One-Class Support Vector Machine for anomaly detection
 * in financial time series data, particularly useful for identifying
 * outliers in cryptocurrency market data.
 */

import { Logger } from '@/lib/ai-logger';

export interface SVMConfig {
  kernel: string;
  gamma: string;
  nu: number;
  maxIterations: number;
  tolerance: number;
  shrinking: boolean;
  cacheSize: number;
}

export interface OneClassSVMResult {
  predictions: number[];
  decisionValues: number[];
  supportVectors: number[][];
  supportVectorIndices: number[];
  nSupportVectors: number;
  threshold: number;
  anomalies: AnomalyPoint[];
  modelInfo: {
    kernel: string;
    gamma: string;
    nu: number;
    nSupportVectors: number;
    convergence: boolean;
    iterations: number;
    trainingTime: number;
  };
  detectionDate: Date;
}

export interface AnomalyPoint {
  index: number;
  value: number;
  decisionValue: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  features: { [key: string]: number };
  timestamp?: Date;
  description: string;
}

export interface SVMInput {
  data: number[][];
  features?: string[];
  timestamps?: Date[];
  threshold?: number;
}

export class OneClassSVMModel {
  private config: SVMConfig;
  private logger: Logger;
  private isTrained: boolean = false;
  private model: SVMModel;

  constructor(config: SVMConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('OneClassSVMModel');
    this.model = {
      supportVectors: [],
      supportVectorIndices: [],
      alphas: [],
      bias: 0,
      kernel: config.kernel,
      gamma: config.gamma,
      nu: config.nu
    };
  }

  /**
   * Train the One-Class SVM model
   */
  async train(input: SVMInput): Promise<void> {
    this.logger.info('Training One-Class SVM model', {
      dataPoints: input.data.length,
      features: input.features?.length || input.data[0]?.length || 0,
      kernel: this.config.kernel,
      nu: this.config.nu
    });

    try {
      this.validateInput(input);

      const startTime = Date.now();
      
      // Normalize data
      const normalizedData = this.normalizeData(input.data);
      
      // Train the model
      const iterations = await this.trainModel(normalizedData);
      
      this.isTrained = true;
      const trainingTime = Date.now() - startTime;

      this.logger.info('One-Class SVM model trained successfully', {
        nSupportVectors: this.model.supportVectors.length,
        iterations,
        trainingTime
      });

    } catch (error) {
      this.logger.error('One-Class SVM training failed', error);
      throw new Error(`One-Class SVM training failed: ${error.message}`);
    }
  }

  /**
   * Detect anomalies using the trained SVM
   */
  async detect(input: SVMInput): Promise<OneClassSVMResult> {
    this.logger.info('Detecting anomalies with One-Class SVM', {
      dataPoints: input.data.length
    });

    try {
      if (!this.isTrained) {
        throw new Error('Model must be trained before detection');
      }

      this.validateInput(input);

      // Normalize data
      const normalizedData = this.normalizeData(input.data);
      
      // Calculate decision values
      const decisionValues = this.calculateDecisionValues(normalizedData);
      
      // Determine threshold
      const threshold = input.threshold || this.calculateThreshold(decisionValues);
      
      // Make predictions (-1 for anomalies, 1 for normal)
      const predictions = decisionValues.map(value => value >= threshold ? 1 : -1);
      
      // Identify anomalies
      const anomalies: AnomalyPoint[] = [];
      for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] === -1) {
          const severity = this.determineSeverity(decisionValues[i], threshold);
          const confidence = Math.min((threshold - decisionValues[i]) / Math.abs(threshold), 1);
          
          anomalies.push({
            index: i,
            value: this.calculatePointValue(input.data[i]),
            decisionValue: decisionValues[i],
            severity,
            confidence,
            features: this.extractFeatures(input.data[i], input.features),
            timestamp: input.timestamps?.[i],
            description: this.generateAnomalyDescription(decisionValues[i], threshold)
          });
        }
      }

      const result: OneClassSVMResult = {
        predictions,
        decisionValues,
        supportVectors: this.model.supportVectors,
        supportVectorIndices: this.model.supportVectorIndices,
        nSupportVectors: this.model.supportVectors.length,
        threshold,
        anomalies,
        modelInfo: {
          kernel: this.model.kernel,
          gamma: this.model.gamma,
          nu: this.model.nu,
          nSupportVectors: this.model.supportVectors.length,
          convergence: true, // Would be tracked during training
          iterations: 0, // Would be tracked during training
          trainingTime: 0 // Would be tracked during training
        },
        detectionDate: new Date()
      };

      this.logger.info('Anomaly detection completed', {
        anomaliesFound: anomalies.length,
        threshold,
        nSupportVectors: this.model.supportVectors.length
      });

      return result;

    } catch (error) {
      this.logger.error('Anomaly detection failed', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Train the SVM model (simplified implementation)
   */
  private async trainModel(data: number[][]): Promise<number> {
    const nSamples = data.length;
    const nFeatures = data[0].length;
    
    // Initialize variables
    this.model.alphas = new Array(nSamples).fill(0);
    this.model.bias = 0;
    
    let iteration = 0;
    let converged = false;
    
    // Simplified SMO (Sequential Minimal Optimization) algorithm
    while (iteration < this.config.maxIterations && !converged) {
      let alphaChanged = 0;
      
      // Iterate through all samples
      for (let i = 0; i < nSamples; i++) {
        const error = this.calculateError(data, i);
        
        // Check KKT conditions
        if ((this.model.alphas[i] < this.config.nu && error < -this.config.tolerance) ||
            (this.model.alphas[i] > 0 && error > this.config.tolerance)) {
          
          // Find second alpha to optimize
          const j = this.findSecondAlpha(i, nSamples);
          
          if (j !== -1) {
            // Optimize alphas[i] and alphas[j]
            const oldAlphaI = this.model.alphas[i];
            const oldAlphaJ = this.model.alphas[j];
            
            // Calculate new alpha values (simplified)
            const newAlphaI = this.updateAlpha(data, i, error);
            const newAlphaJ = this.updateAlpha(data, j, this.calculateError(data, j));
            
            // Apply constraints
            this.model.alphas[i] = Math.max(0, Math.min(this.config.nu, newAlphaI));
            this.model.alphas[j] = Math.max(0, Math.min(this.config.nu, newAlphaJ));
            
            // Update bias
            this.model.bias = this.updateBias(data, i, j);
            
            if (Math.abs(this.model.alphas[i] - oldAlphaI) > this.config.tolerance ||
                Math.abs(this.model.alphas[j] - oldAlphaJ) > this.config.tolerance) {
              alphaChanged++;
            }
          }
        }
      }
      
      // Check convergence
      if (alphaChanged === 0) {
        converged = true;
      }
      
      iteration++;
      
      // Log progress
      if (iteration % 100 === 0) {
        this.logger.info(`Training iteration ${iteration}`, {
          alphaChanged,
          maxAlpha: Math.max(...this.model.alphas)
        });
      }
    }
    
    // Extract support vectors
    this.extractSupportVectors(data);
    
    return iteration;
  }

  /**
   * Calculate error for a sample
   */
  private calculateError(data: number[][], index: number): number {
    const decisionValue = this.calculateDecisionValue(data[index], data);
    return decisionValue - this.model.bias;
  }

  /**
   * Find second alpha to optimize
   */
  private findSecondAlpha(i: number, nSamples: number): number {
    // Simplified: find the alpha with maximum error difference
    let maxDiff = 0;
    let bestJ = -1;
    
    const errorI = this.calculateError(this.model.supportVectors.length > 0 ? this.model.supportVectors : [], i);
    
    for (let j = 0; j < nSamples; j++) {
      if (j !== i) {
        const errorJ = this.calculateError(this.model.supportVectors.length > 0 ? this.model.supportVectors : [], j);
        const diff = Math.abs(errorI - errorJ);
        
        if (diff > maxDiff) {
          maxDiff = diff;
          bestJ = j;
        }
      }
    }
    
    return bestJ;
  }

  /**
   * Update alpha value
   */
  private updateAlpha(data: number[][], index: number, error: number): number {
    const learningRate = 0.01; // Simplified learning rate
    const gradient = error;
    
    return this.model.alphas[index] + learningRate * gradient;
  }

  /**
   * Update bias term
   */
  private updateBias(data: number[][], i: number, j: number): number {
    // Simplified bias update
    const errorI = this.calculateError(data, i);
    const errorJ = this.calculateError(data, j);
    
    return this.model.bias - 0.01 * (errorI + errorJ) / 2;
  }

  /**
   * Extract support vectors from training data
   */
  private extractSupportVectors(data: number[][]): void {
    this.model.supportVectors = [];
    this.model.supportVectorIndices = [];
    
    for (let i = 0; i < this.model.alphas.length; i++) {
      if (this.model.alphas[i] > 1e-6) { // Threshold for support vectors
        this.model.supportVectors.push(data[i]);
        this.model.supportVectorIndices.push(i);
      }
    }
  }

  /**
   * Calculate decision values for all data points
   */
  private calculateDecisionValues(data: number[][]): number[] {
    return data.map(point => this.calculateDecisionValue(point, data));
  }

  /**
   * Calculate decision value for a single point
   */
  private calculateDecisionValue(point: number[], referenceData: number[][]): number {
    let sum = 0;
    
    for (let i = 0; i < this.model.supportVectors.length; i++) {
      const sv = this.model.supportVectors[i];
      const alpha = this.model.alphas[this.model.supportVectorIndices[i]];
      const kernelValue = this.calculateKernel(point, sv);
      sum += alpha * kernelValue;
    }
    
    return sum - this.model.bias;
  }

  /**
   * Calculate kernel function
   */
  private calculateKernel(x1: number[], x2: number[]): number {
    switch (this.model.kernel) {
      case 'rbf':
        return this.rbfKernel(x1, x2);
      case 'linear':
        return this.linearKernel(x1, x2);
      case 'poly':
        return this.polynomialKernel(x1, x2);
      case 'sigmoid':
        return this.sigmoidKernel(x1, x2);
      default:
        return this.rbfKernel(x1, x2);
    }
  }

  /**
   * RBF (Radial Basis Function) kernel
   */
  private rbfKernel(x1: number[], x2: number[]): number {
    const gamma = this.model.gamma === 'auto' ? 1.0 / x1.length : parseFloat(this.model.gamma);
    let sum = 0;
    
    for (let i = 0; i < x1.length; i++) {
      const diff = x1[i] - x2[i];
      sum += diff * diff;
    }
    
    return Math.exp(-gamma * sum);
  }

  /**
   * Linear kernel
   */
  private linearKernel(x1: number[], x2: number[]): number {
    let sum = 0;
    for (let i = 0; i < x1.length; i++) {
      sum += x1[i] * x2[i];
    }
    return sum;
  }

  /**
   * Polynomial kernel
   */
  private polynomialKernel(x1: number[], x2: number[]): number {
    const degree = 3; // Default polynomial degree
    const linear = this.linearKernel(x1, x2);
    return Math.pow(linear + 1, degree);
  }

  /**
   * Sigmoid kernel
   */
  private sigmoidKernel(x1: number[], x2: number[]): number {
    const gamma = this.model.gamma === 'auto' ? 1.0 / x1.length : parseFloat(this.model.gamma);
    const coef0 = 0; // Default coefficient
    const linear = this.linearKernel(x1, x2);
    return Math.tanh(gamma * linear + coef0);
  }

  /**
   * Normalize data (z-score normalization)
   */
  private normalizeData(data: number[][]): number[][] {
    const nFeatures = data[0].length;
    const means: number[] = new Array(nFeatures).fill(0);
    const stds: number[] = new Array(nFeatures).fill(0);

    // Calculate means
    data.forEach(point => {
      point.forEach((value, index) => {
        means[index] += value;
      });
    });
    means.forEach((mean, index) => {
      means[index] = mean / data.length;
    });

    // Calculate standard deviations
    data.forEach(point => {
      point.forEach((value, index) => {
        const diff = value - means[index];
        stds[index] += diff * diff;
      });
    });
    stds.forEach((std, index) => {
      stds[index] = Math.sqrt(std[index] / data.length);
    });

    // Normalize data
    return data.map(point => 
      point.map((value, index) => {
        return stds[index] === 0 ? 0 : (value - means[index]) / stds[index];
      })
    );
  }

  /**
   * Calculate threshold for anomaly detection
   */
  private calculateThreshold(decisionValues: number[]): number {
    // Use percentile-based threshold
    const sortedValues = [...decisionValues].sort((a, b) => a - b);
    const percentile = 0.05; // 5th percentile
    const index = Math.floor(percentile * sortedValues.length);
    return sortedValues[index];
  }

  /**
   * Determine anomaly severity
   */
  private determineSeverity(decisionValue: number, threshold: number): 'low' | 'medium' | 'high' {
    const ratio = threshold / decisionValue;
    if (ratio < 1.5) return 'low';
    if (ratio < 3.0) return 'medium';
    return 'high';
  }

  /**
   * Calculate point value (for single-dimensional data)
   */
  private calculatePointValue(point: number[]): number {
    return point[0]; // For simplicity, return first feature
  }

  /**
   * Extract features from data point
   */
  private extractFeatures(point: number[], featureNames?: string[]): { [key: string]: number } {
    const features: { [key: string]: number } = {};
    
    if (featureNames) {
      featureNames.forEach((name, index) => {
        features[name] = point[index];
      });
    } else {
      point.forEach((value, index) => {
        features[`feature_${index}`] = value;
      });
    }
    
    return features;
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(decisionValue: number, threshold: number): string {
    const severity = this.determineSeverity(decisionValue, threshold);
    const ratio = threshold / decisionValue;
    
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} severity anomaly detected with decision value ${decisionValue.toFixed(4)} (${ratio.toFixed(1)}x below threshold)`;
  }

  /**
   * Validate input data
   */
  private validateInput(input: SVMInput): void {
    if (!input.data || input.data.length === 0) {
      throw new Error('Data array is required and cannot be empty');
    }

    const featureCount = input.data[0].length;
    for (let i = 1; i < input.data.length; i++) {
      if (input.data[i].length !== featureCount) {
        throw new Error('All data points must have the same number of features');
      }
    }

    if (input.threshold !== undefined && input.threshold < 0) {
      throw new Error('Threshold must be non-negative');
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'One-Class SVM Model',
      version: '1.0.0',
      description: 'Support Vector Machine-based anomaly detection for one-class classification',
      capabilities: ['anomaly-detection', 'outlier-identification', 'novelty-detection', 'kernel-methods'],
      config: this.config,
      isTrained: this.isTrained,
      nSupportVectors: this.model.supportVectors.length,
      kernel: this.model.kernel
    };
  }
}

/**
 * SVM Model interface
 */
interface SVMModel {
  supportVectors: number[][];
  supportVectorIndices: number[];
  alphas: number[];
  bias: number;
  kernel: string;
  gamma: string;
  nu: number;
}