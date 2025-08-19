/**
 * Isolation Forest Model Implementation
 * 
 * This model implements the Isolation Forest algorithm for anomaly detection
 * in financial time series data, particularly useful for detecting
 * unusual patterns in cryptocurrency markets.
 */

import { Logger } from '@/lib/ai-logger';

export interface IsolationConfig {
  contamination: number;
  maxSamples: number;
  nEstimators: number;
  maxFeatures: number;
  bootstrap: boolean;
  randomState: number;
}

export interface IsolationForestResult {
  anomalies: AnomalyPoint[];
  anomalyScores: number[];
  threshold: number;
  contamination: number;
  decisionPath: number[][];
  treeDepths: number[];
  featureImportance: { [feature: string]: number };
  modelInfo: {
    nEstimators: number;
    maxSamples: number;
    contamination: number;
    trainingTime: number;
  };
  detectionDate: Date;
}

export interface AnomalyPoint {
  index: number;
  value: number;
  score: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  features: { [key: string]: number };
  timestamp?: Date;
  description: string;
}

export interface IsolationForestInput {
  data: number[][];
  features?: string[];
  timestamps?: Date[];
  contamination?: number;
}

export class IsolationForestModel {
  private config: IsolationConfig;
  private logger: Logger;
  private trees: IsolationTree[];
  private isTrained: boolean = false;

  constructor(config: IsolationConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('IsolationForestModel');
    this.trees = [];
  }

  /**
   * Train the Isolation Forest model
   */
  async train(input: IsolationForestInput): Promise<void> {
    this.logger.info('Training Isolation Forest model', {
      dataPoints: input.data.length,
      features: input.features?.length || input.data[0]?.length || 0,
      contamination: input.contamination || this.config.contamination
    });

    try {
      this.validateInput(input);

      const contamination = input.contamination || this.config.contamination;
      const maxSamples = Math.min(this.config.maxSamples, input.data.length);
      
      // Build isolation trees
      this.trees = [];
      const startTime = Date.now();

      for (let i = 0; i < this.config.nEstimators; i++) {
        const tree = new IsolationTree({
          maxSamples,
          maxFeatures: this.config.maxFeatures,
          randomState: this.config.randomState + i
        });
        
        // Sample data for this tree
        const sampleIndices = this.sampleIndices(input.data.length, maxSamples, this.config.bootstrap);
        const sampleData = sampleIndices.map(index => input.data[index]);
        
        tree.train(sampleData);
        this.trees.push(tree);
      }

      this.isTrained = true;
      const trainingTime = Date.now() - startTime;

      this.logger.info('Isolation Forest model trained successfully', {
        nEstimators: this.config.nEstimators,
        maxSamples,
        contamination,
        trainingTime
      });

    } catch (error) {
      this.logger.error('Isolation Forest training failed', error);
      throw new Error(`Isolation Forest training failed: ${error.message}`);
    }
  }

  /**
   * Detect anomalies in the data
   */
  async detect(input: IsolationForestInput): Promise<IsolationForestResult> {
    this.logger.info('Detecting anomalies with Isolation Forest', {
      dataPoints: input.data.length
    });

    try {
      if (!this.isTrained) {
        throw new Error('Model must be trained before detection');
      }

      this.validateInput(input);

      const contamination = input.contamination || this.config.contamination;
      
      // Calculate anomaly scores for each data point
      const anomalyScores: number[] = [];
      const decisionPaths: number[][] = [];
      const treeDepths: number[] = [];

      for (let i = 0; i < input.data.length; i++) {
        const point = input.data[i];
        const paths: number[][] = [];
        const depths: number[] = [];

        // Get path length from each tree
        for (const tree of this.trees) {
          const path = tree.getPathLength(point);
          paths.push(path.path);
          depths.push(path.depth);
        }

        // Calculate average path length
        const avgPathLength = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
        
        // Calculate anomaly score
        const score = this.calculateAnomalyScore(avgPathLength, this.config.maxSamples);
        anomalyScores.push(score);
        decisionPaths.push(paths.flat());
        treeDepths.push(avgPathLength);
      }

      // Determine threshold based on contamination
      const sortedScores = [...anomalyScores].sort((a, b) => b - a);
      const thresholdIndex = Math.floor(contamination * sortedScores.length);
      const threshold = sortedScores[thresholdIndex];

      // Identify anomalies
      const anomalies: AnomalyPoint[] = [];
      for (let i = 0; i < anomalyScores.length; i++) {
        if (anomalyScores[i] > threshold) {
          const severity = this.determineSeverity(anomalyScores[i]);
          const confidence = Math.min(anomalyScores[i] * 2, 1);
          
          anomalies.push({
            index: i,
            value: this.calculatePointValue(input.data[i]),
            score: anomalyScores[i],
            severity,
            confidence,
            features: this.extractFeatures(input.data[i], input.features),
            timestamp: input.timestamps?.[i],
            description: this.generateAnomalyDescription(anomalyScores[i], input.data[i])
          });
        }
      }

      // Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(decisionPaths, input.features);

      const result: IsolationForestResult = {
        anomalies,
        anomalyScores,
        threshold,
        contamination,
        decisionPath: decisionPaths,
        treeDepths,
        featureImportance,
        modelInfo: {
          nEstimators: this.config.nEstimators,
          maxSamples: this.config.maxSamples,
          contamination,
          trainingTime: 0 // Would be tracked during training
        },
        detectionDate: new Date()
      };

      this.logger.info('Anomaly detection completed', {
        anomaliesFound: anomalies.length,
        threshold,
        contamination
      });

      return result;

    } catch (error) {
      this.logger.error('Anomaly detection failed', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Calculate anomaly score from path length
   */
  private calculateAnomalyScore(pathLength: number, maxSamples: number): number {
    // Expected path length for unsuccessful search in BST
    const c = this.calculateExpectedPathLength(maxSamples);
    
    // Anomaly score formula
    const score = Math.pow(2, -pathLength / c);
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate expected path length
   */
  private calculateExpectedPathLength(n: number): number {
    if (n <= 1) return 0;
    
    const harmonicNumber = Math.log(n - 1) + 0.5772156649; // Euler's constant
    return 2 * harmonicNumber - 2 * (n - 1) / n;
  }

  /**
   * Sample indices for tree training
   */
  private sampleIndices(n: number, size: number, bootstrap: boolean): number[] {
    if (bootstrap) {
      const indices: number[] = [];
      for (let i = 0; i < size; i++) {
        indices.push(Math.floor(Math.random() * n));
      }
      return indices;
    } else {
      const indices = Array.from({ length: n }, (_, i) => i);
      this.shuffleArray(indices);
      return indices.slice(0, size);
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Validate input data
   */
  private validateInput(input: IsolationForestInput): void {
    if (!input.data || input.data.length === 0) {
      throw new Error('Data array is required and cannot be empty');
    }

    const featureCount = input.data[0].length;
    for (let i = 1; i < input.data.length; i++) {
      if (input.data[i].length !== featureCount) {
        throw new Error('All data points must have the same number of features');
      }
    }

    if (input.contamination !== undefined && (input.contamination < 0 || input.contamination > 0.5)) {
      throw new Error('Contamination must be between 0 and 0.5');
    }
  }

  /**
   * Determine anomaly severity
   */
  private determineSeverity(score: number): 'low' | 'medium' | 'high' {
    if (score < 0.6) return 'low';
    if (score < 0.8) return 'medium';
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
   * Calculate feature importance based on decision paths
   */
  private calculateFeatureImportance(decisionPaths: number[][], featureNames?: string[]): { [feature: string]: number } {
    const featureCounts: { [key: string]: number } = {};
    const totalSplits = decisionPaths.length;

    // Count feature usage in decision paths
    decisionPaths.forEach(path => {
      path.forEach(featureIndex => {
        const featureName = featureNames ? featureNames[featureIndex] : `feature_${featureIndex}`;
        featureCounts[featureName] = (featureCounts[featureName] || 0) + 1;
      });
    });

    // Calculate importance as normalized counts
    const importance: { [feature: string]: number } = {};
    Object.entries(featureCounts).forEach(([feature, count]) => {
      importance[feature] = count / totalSplits;
    });

    return importance;
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(score: number, point: number[]): string {
    const severity = this.determineSeverity(score);
    const value = this.calculatePointValue(point);
    
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} severity anomaly detected with score ${score.toFixed(3)} at value ${value.toFixed(2)}`;
  }

  /**
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'Isolation Forest Model',
      version: '1.0.0',
      description: 'Unsupervised anomaly detection using isolation forests',
      capabilities: ['anomaly-detection', 'outlier-identification', 'feature-importance', 'decision-path-analysis'],
      config: this.config,
      isTrained: this.isTrained,
      nTrees: this.trees.length
    };
  }
}

/**
 * Isolation Tree implementation
 */
class IsolationTree {
  private root: TreeNode | null = null;
  private maxSamples: number;
  private maxFeatures: number;
  private randomState: number;

  constructor(config: { maxSamples: number; maxFeatures: number; randomState: number }) {
    this.maxSamples = config.maxSamples;
    this.maxFeatures = config.maxFeatures;
    this.randomState = config.randomState;
  }

  /**
   * Train the isolation tree
   */
  train(data: number[][]): void {
    this.root = this.buildTree(data, 0);
  }

  /**
   * Get path length for a data point
   */
  getPathLength(point: number[]): { path: number[]; depth: number } {
    const path: number[] = [];
    let depth = 0;
    let node = this.root;

    while (node && !node.isLeaf) {
      path.push(node.splitFeature);
      const value = point[node.splitFeature];
      
      if (value <= node.splitValue) {
        node = node.left;
      } else {
        node = node.right;
      }
      depth++;
    }

    return { path, depth };
  }

  /**
   * Build the isolation tree recursively
   */
  private buildTree(data: number[][], currentDepth: number): TreeNode {
    // Base cases
    if (data.length <= 1 || currentDepth >= this.maxSamples) {
      return {
        isLeaf: true,
        size: data.length,
        depth: currentDepth
      };
    }

    // Select random features
    const nFeatures = data[0].length;
    const nFeaturesToSelect = Math.min(this.maxFeatures, nFeatures);
    const featureIndices = this.getRandomFeatures(nFeatures, nFeaturesToSelect);

    // Find best split
    const bestSplit = this.findBestSplit(data, featureIndices);
    
    if (!bestSplit) {
      return {
        isLeaf: true,
        size: data.length,
        depth: currentDepth
      };
    }

    // Split data
    const leftData = data.filter(point => point[bestSplit.feature] <= bestSplit.value);
    const rightData = data.filter(point => point[bestSplit.feature] > bestSplit.value);

    // Build child nodes
    const leftChild = this.buildTree(leftData, currentDepth + 1);
    const rightChild = this.buildTree(rightData, currentDepth + 1);

    return {
      isLeaf: false,
      splitFeature: bestSplit.feature,
      splitValue: bestSplit.value,
      left: leftChild,
      right: rightChild,
      size: data.length,
      depth: currentDepth
    };
  }

  /**
   * Find best split among selected features
   */
  private findBestSplit(data: number[][], featureIndices: number[]): { feature: number; value: number } | null {
    if (data.length === 0) return null;

    let bestSplit: { feature: number; value: number } | null = null;
    let minScore = Infinity;

    for (const featureIndex of featureIndices) {
      // Get unique values for this feature
      const values = data.map(point => point[featureIndex]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      // Try midpoints between consecutive values
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const splitValue = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        
        // Calculate split score (simplified - in real implementation would use more sophisticated criteria)
        const leftCount = data.filter(point => point[featureIndex] <= splitValue).length;
        const rightCount = data.filter(point => point[featureIndex] > splitValue).length;
        
        // Prefer splits that more evenly divide the data
        const score = Math.abs(leftCount - rightCount);
        
        if (score < minScore) {
          minScore = score;
          bestSplit = { feature: featureIndex, value: splitValue };
        }
      }
    }

    return bestSplit;
  }

  /**
   * Get random feature indices
   */
  private getRandomFeatures(nFeatures: number, nToSelect: number): number[] {
    const indices = Array.from({ length: nFeatures }, (_, i) => i);
    
    // Simple random selection
    const selected: number[] = [];
    for (let i = 0; i < nToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      selected.push(indices[randomIndex]);
      indices.splice(randomIndex, 1);
    }
    
    return selected;
  }
}

/**
 * Tree node interface
 */
interface TreeNode {
  isLeaf: boolean;
  size: number;
  depth: number;
  splitFeature?: number;
  splitValue?: number;
  left?: TreeNode;
  right?: TreeNode;
}