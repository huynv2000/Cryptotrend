/**
 * Autoencoder Model Implementation
 * 
 * This model implements an autoencoder neural network for anomaly detection
 * and dimensionality reduction in financial time series data.
 */

import { Logger } from '@/lib/ai-logger';

export interface AutoencoderConfig {
  encodingDim: number;
  hiddenLayers: number[];
  activation: string;
  optimizer: string;
  loss: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  patience: number;
}

export interface AutoencoderResult {
  reconstructionErrors: number[];
  threshold: number;
  anomalies: AnomalyPoint[];
  reconstructionLoss: number;
  validationLoss: number;
  trainingHistory: TrainingHistory;
  featureImportance: { [feature: string]: number };
  modelInfo: {
    encodingDim: number;
    hiddenLayers: number[];
    epochs: number;
    trainingTime: number;
    convergence: boolean;
  };
  detectionDate: Date;
}

export interface TrainingHistory {
  loss: number[];
  valLoss: number[];
  epochs: number[];
}

export interface AnomalyPoint {
  index: number;
  value: number;
  reconstructionError: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  features: { [key: string]: number };
  timestamp?: Date;
  description: string;
}

export interface AutoencoderInput {
  data: number[][];
  features?: string[];
  timestamps?: Date[];
  threshold?: number;
}

export class AutoencoderModel {
  private config: AutoencoderConfig;
  private logger: Logger;
  private isTrained: boolean = false;
  private weights: Weights;
  private trainingHistory: TrainingHistory;

  constructor(config: AutoencoderConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('AutoencoderModel');
    this.weights = this.initializeWeights();
    this.trainingHistory = { loss: [], valLoss: [], epochs: [] };
  }

  /**
   * Train the autoencoder model
   */
  async train(input: AutoencoderInput): Promise<void> {
    this.logger.info('Training Autoencoder model', {
      dataPoints: input.data.length,
      features: input.features?.length || input.data[0]?.length || 0,
      encodingDim: this.config.encodingDim,
      hiddenLayers: this.config.hiddenLayers
    });

    try {
      this.validateInput(input);

      const startTime = Date.now();
      
      // Normalize data
      const normalizedData = this.normalizeData(input.data);
      
      // Split data for training and validation
      const { trainData, valData } = this.splitData(normalizedData, this.config.validationSplit);
      
      // Train the model
      this.trainingHistory = await this.trainModel(trainData, valData);
      
      this.isTrained = true;
      const trainingTime = Date.now() - startTime;

      this.logger.info('Autoencoder model trained successfully', {
        epochs: this.trainingHistory.epochs.length,
        finalLoss: this.trainingHistory.loss[this.trainingHistory.loss.length - 1],
        finalValLoss: this.trainingHistory.valLoss[this.trainingHistory.valLoss.length - 1],
        trainingTime
      });

    } catch (error) {
      this.logger.error('Autoencoder training failed', error);
      throw new Error(`Autoencoder training failed: ${error.message}`);
    }
  }

  /**
   * Detect anomalies using the trained autoencoder
   */
  async detect(input: AutoencoderInput): Promise<AutoencoderResult> {
    this.logger.info('Detecting anomalies with Autoencoder', {
      dataPoints: input.data.length
    });

    try {
      if (!this.isTrained) {
        throw new Error('Model must be trained before detection');
      }

      this.validateInput(input);

      // Normalize data
      const normalizedData = this.normalizeData(input.data);
      
      // Calculate reconstruction errors
      const reconstructionErrors = this.calculateReconstructionErrors(normalizedData);
      
      // Determine threshold
      const threshold = input.threshold || this.calculateThreshold(reconstructionErrors);
      
      // Identify anomalies
      const anomalies: AnomalyPoint[] = [];
      for (let i = 0; i < reconstructionErrors.length; i++) {
        if (reconstructionErrors[i] > threshold) {
          const severity = this.determineSeverity(reconstructionErrors[i], threshold);
          const confidence = Math.min((reconstructionErrors[i] / threshold - 1) * 2, 1);
          
          anomalies.push({
            index: i,
            value: this.calculatePointValue(input.data[i]),
            reconstructionError: reconstructionErrors[i],
            severity,
            confidence,
            features: this.extractFeatures(input.data[i], input.features),
            timestamp: input.timestamps?.[i],
            description: this.generateAnomalyDescription(reconstructionErrors[i], threshold)
          });
        }
      }

      // Calculate overall reconstruction loss
      const reconstructionLoss = reconstructionErrors.reduce((sum, error) => sum + error, 0) / reconstructionErrors.length;
      
      // Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(normalizedData, input.features);

      const result: AutoencoderResult = {
        reconstructionErrors,
        threshold,
        anomalies,
        reconstructionLoss,
        validationLoss: this.trainingHistory.valLoss[this.trainingHistory.valLoss.length - 1],
        trainingHistory: this.trainingHistory,
        featureImportance,
        modelInfo: {
          encodingDim: this.config.encodingDim,
          hiddenLayers: this.config.hiddenLayers,
          epochs: this.trainingHistory.epochs.length,
          trainingTime: 0, // Would be tracked during training
          convergence: this.checkConvergence()
        },
        detectionDate: new Date()
      };

      this.logger.info('Anomaly detection completed', {
        anomaliesFound: anomalies.length,
        threshold,
        reconstructionLoss
      });

      return result;

    } catch (error) {
      this.logger.error('Anomaly detection failed', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Initialize model weights
   */
  private initializeWeights(): Weights {
    const inputDim = this.config.hiddenLayers[0]; // Assuming first hidden layer is input dimension
    const encodingDim = this.config.encodingDim;
    
    // Simplified weight initialization
    return {
      encoder: {
        weights: this.randomMatrix(inputDim, encodingDim),
        biases: this.randomArray(encodingDim)
      },
      decoder: {
        weights: this.randomMatrix(encodingDim, inputDim),
        biases: this.randomArray(inputDim)
      }
    };
  }

  /**
   * Generate random matrix
   */
  private randomMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() - 0.5) * 2 * Math.sqrt(2 / (rows + cols)));
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Generate random array
   */
  private randomArray(size: number): number[] {
    const array: number[] = [];
    for (let i = 0; i < size; i++) {
      array.push((Math.random() - 0.5) * 0.1);
    }
    return array;
  }

  /**
   * Normalize data (min-max normalization)
   */
  private normalizeData(data: number[][]): number[][] {
    const nFeatures = data[0].length;
    const mins: number[] = new Array(nFeatures).fill(Infinity);
    const maxs: number[] = new Array(nFeatures).fill(-Infinity);

    // Find min and max for each feature
    data.forEach(point => {
      point.forEach((value, index) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    });

    // Normalize each feature
    return data.map(point => 
      point.map((value, index) => {
        const range = maxs[index] - mins[index];
        return range === 0 ? 0 : (value - mins[index]) / range;
      })
    );
  }

  /**
   * Split data into training and validation sets
   */
  private splitData(data: number[][], validationSplit: number): {
    trainData: number[][];
    valData: number[][];
  } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(data.length * (1 - validationSplit));
    
    return {
      trainData: shuffled.slice(0, splitIndex),
      valData: shuffled.slice(splitIndex)
    };
  }

  /**
   * Train the model (simplified implementation)
   */
  private async trainModel(trainData: number[][], valData: number[][]): Promise<TrainingHistory> {
    const history: TrainingHistory = { loss: [], valLoss: [], epochs: [] };
    let bestValLoss = Infinity;
    let patienceCounter = 0;

    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      // Training phase
      const trainLoss = this.trainEpoch(trainData);
      
      // Validation phase
      const valLoss = this.validateEpoch(valData);
      
      history.loss.push(trainLoss);
      history.valLoss.push(valLoss);
      history.epochs.push(epoch);

      // Early stopping check
      if (this.config.earlyStopping) {
        if (valLoss < bestValLoss) {
          bestValLoss = valLoss;
          patienceCounter = 0;
        } else {
          patienceCounter++;
          if (patienceCounter >= this.config.patience) {
            this.logger.info('Early stopping triggered', {
              epoch,
              bestValLoss,
              patienceCounter
            });
            break;
          }
        }
      }

      // Log progress
      if (epoch % 10 === 0) {
        this.logger.info(`Epoch ${epoch}`, {
          trainLoss,
          valLoss
        });
      }
    }

    return history;
  }

  /**
   * Train for one epoch
   */
  private trainEpoch(data: number[][]): number {
    let totalLoss = 0;
    const batchSize = this.config.batchSize;

    // Mini-batch training
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchLoss = this.trainBatch(batch);
      totalLoss += batchLoss * batch.length;
    }

    return totalLoss / data.length;
  }

  /**
   * Train on a batch
   */
  private trainBatch(batch: number[][]): number {
    let totalLoss = 0;

    batch.forEach(input => {
      // Forward pass
      const encoded = this.encode(input);
      const reconstructed = this.decode(encoded);
      
      // Calculate loss (mean squared error)
      const loss = this.calculateMSE(input, reconstructed);
      totalLoss += loss;
      
      // Backward pass (simplified - in real implementation would use proper backpropagation)
      this.updateWeights(input, encoded, reconstructed, loss);
    });

    return totalLoss / batch.length;
  }

  /**
   * Validate on validation data
   */
  private validateEpoch(data: number[][]): number {
    let totalLoss = 0;

    data.forEach(input => {
      const encoded = this.encode(input);
      const reconstructed = this.decode(encoded);
      const loss = this.calculateMSE(input, reconstructed);
      totalLoss += loss;
    });

    return totalLoss / data.length;
  }

  /**
   * Encode input data
   */
  private encode(input: number[]): number[] {
    // Simplified encoding - just matrix multiplication
    const encoded: number[] = [];
    const encoderWeights = this.weights.encoder.weights;
    const encoderBiases = this.weights.encoder.biases;

    for (let i = 0; i < encoderWeights[0].length; i++) {
      let sum = encoderBiases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * encoderWeights[j][i];
      }
      encoded.push(this.activationFunction(sum));
    }

    return encoded;
  }

  /**
   * Decode encoded data
   */
  private decode(encoded: number[]): number[] {
    // Simplified decoding - just matrix multiplication
    const decoded: number[] = [];
    const decoderWeights = this.weights.decoder.weights;
    const decoderBiases = this.weights.decoder.biases;

    for (let i = 0; i < decoderWeights[0].length; i++) {
      let sum = decoderBiases[i];
      for (let j = 0; j < encoded.length; j++) {
        sum += encoded[j] * decoderWeights[j][i];
      }
      decoded.push(this.activationFunction(sum));
    }

    return decoded;
  }

  /**
   * Activation function (ReLU)
   */
  private activationFunction(x: number): number {
    return Math.max(0, x);
  }

  /**
   * Calculate mean squared error
   */
  private calculateMSE(original: number[], reconstructed: number[]): number {
    let sum = 0;
    for (let i = 0; i < original.length; i++) {
      const diff = original[i] - reconstructed[i];
      sum += diff * diff;
    }
    return sum / original.length;
  }

  /**
   * Update weights (simplified gradient descent)
   */
  private updateWeights(input: number[], encoded: number[], reconstructed: number[], loss: number): void {
    const learningRate = this.config.learningRate;
    
    // Simplified weight update - in real implementation would calculate proper gradients
    for (let i = 0; i < this.weights.encoder.weights.length; i++) {
      for (let j = 0; j < this.weights.encoder.weights[i].length; j++) {
        this.weights.encoder.weights[i][j] -= learningRate * loss * input[i] * encoded[j] * 0.01;
      }
    }
    
    for (let i = 0; i < this.weights.decoder.weights.length; i++) {
      for (let j = 0; j < this.weights.decoder.weights[i].length; j++) {
        this.weights.decoder.weights[i][j] -= learningRate * loss * encoded[i] * reconstructed[j] * 0.01;
      }
    }
  }

  /**
   * Calculate reconstruction errors
   */
  private calculateReconstructionErrors(data: number[][]): number[] {
    const errors: number[] = [];

    data.forEach(point => {
      const encoded = this.encode(point);
      const reconstructed = this.decode(point);
      const error = this.calculateMSE(point, reconstructed);
      errors.push(error);
    });

    return errors;
  }

  /**
   * Calculate threshold for anomaly detection
   */
  private calculateThreshold(errors: number[]): number {
    const sortedErrors = [...errors].sort((a, b) => a - b);
    const mean = sortedErrors.reduce((sum, error) => sum + error, 0) / sortedErrors.length;
    const std = Math.sqrt(sortedErrors.reduce((sum, error) => sum + Math.pow(error - mean, 2), 0) / sortedErrors.length);
    
    // Use mean + 3*std as threshold (can be adjusted)
    return mean + 3 * std;
  }

  /**
   * Determine anomaly severity
   */
  private determineSeverity(error: number, threshold: number): 'low' | 'medium' | 'high' {
    const ratio = error / threshold;
    if (ratio < 1.5) return 'low';
    if (ratio < 2.5) return 'medium';
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
   * Calculate feature importance based on reconstruction errors
   */
  private calculateFeatureImportance(data: number[][], featureNames?: string[]): { [feature: string]: number } {
    const nFeatures = data[0].length;
    const featureErrors: number[] = new Array(nFeatures).fill(0);

    // Calculate reconstruction error for each feature individually
    data.forEach(point => {
      const encoded = this.encode(point);
      const reconstructed = this.decode(encoded);
      
      for (let i = 0; i < nFeatures; i++) {
        const error = Math.pow(point[i] - reconstructed[i], 2);
        featureErrors[i] += error;
      }
    });

    // Normalize feature importance
    const totalError = featureErrors.reduce((sum, error) => sum + error, 0);
    const importance: { [feature: string]: number } = {};
    
    for (let i = 0; i < nFeatures; i++) {
      const featureName = featureNames ? featureNames[i] : `feature_${i}`;
      importance[featureName] = featureErrors[i] / totalError;
    }

    return importance;
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(error: number, threshold: number): string {
    const severity = this.determineSeverity(error, threshold);
    const ratio = error / threshold;
    
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} severity anomaly detected with reconstruction error ${error.toFixed(4)} (${ratio.toFixed(1)}x threshold)`;
  }

  /**
   * Check model convergence
   */
  private checkConvergence(): boolean {
    if (this.trainingHistory.loss.length < 10) return false;
    
    const recentLosses = this.trainingHistory.loss.slice(-10);
    const lossRange = Math.max(...recentLosses) - Math.min(...recentLosses);
    
    return lossRange < 0.001; // Convergence threshold
  }

  /**
   * Validate input data
   */
  private validateInput(input: AutoencoderInput): void {
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
      name: 'Autoencoder Model',
      version: '1.0.0',
      description: 'Neural network-based anomaly detection using autoencoders',
      capabilities: ['anomaly-detection', 'dimensionality-reduction', 'feature-learning', 'reconstruction-error-analysis'],
      config: this.config,
      isTrained: this.isTrained,
      trainingEpochs: this.trainingHistory.epochs.length
    };
  }
}

/**
 * Model weights interface
 */
interface Weights {
  encoder: {
    weights: number[][];
    biases: number[];
  };
  decoder: {
    weights: number[][];
    biases: number[];
  };
}