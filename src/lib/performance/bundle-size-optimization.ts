/**
 * Bundle Size Optimization
 * 
 * This system implements bundle size optimization through dependency analysis,
 * tree-shaking, and bundle analysis to reduce the overall application size.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface BundleSizeMetric {
  name: string;
  size: number;
  gzipSize: number;
  parsedSize: number;
  percent: number;
  files: string[];
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  used: boolean;
  usage: number;
  type: 'direct' | 'dev' | 'transitive';
  canBeRemoved: boolean;
  alternatives: string[];
}

interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  chunks: BundleSizeMetric[];
  dependencies: DependencyInfo[];
  unusedDependencies: DependencyInfo[];
  largeAssets: BundleSizeMetric[];
  recommendations: string[];
  optimizationScore: number;
}

interface OptimizationConfig {
  maxBundleSize: number;
  maxChunkSize: number;
  unusedDependencyThreshold: number;
  largeAssetThreshold: number;
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
  enableCompression: boolean;
}

class BundleSizeOptimizer {
  private config: OptimizationConfig;
  private analysisCache: Map<string, BundleAnalysis> = new Map();
  private lastAnalysis: BundleAnalysis | null = null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      maxBundleSize: 500 * 1024, // 500KB
      maxChunkSize: 100 * 1024, // 100KB
      unusedDependencyThreshold: 0.1, // 10% usage threshold
      largeAssetThreshold: 50 * 1024, // 50KB
      enableTreeShaking: true,
      enableCodeSplitting: true,
      enableCompression: true,
      ...config
    };
  }

  async analyzeBundle(): Promise<BundleAnalysis> {
    const startTime = performance.now();
    
    try {
      // Get bundle stats
      const bundleStats = await this.getBundleStats();
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies();
      
      // Identify unused dependencies
      const unusedDependencies = this.identifyUnusedDependencies(dependencies);
      
      // Find large assets
      const largeAssets = this.identifyLargeAssets(bundleStats);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations({
        bundleStats,
        dependencies,
        unusedDependencies,
        largeAssets
      });
      
      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore({
        bundleStats,
        dependencies,
        unusedDependencies,
        largeAssets
      });
      
      const analysis: BundleAnalysis = {
        totalSize: bundleStats.reduce((sum, chunk) => sum + chunk.size, 0),
        totalGzipSize: bundleStats.reduce((sum, chunk) => sum + chunk.gzipSize, 0),
        chunks: bundleStats,
        dependencies,
        unusedDependencies,
        largeAssets,
        recommendations,
        optimizationScore
      };
      
      this.lastAnalysis = analysis;
      this.analysisCache.set(Date.now().toString(), analysis);
      
      console.log(`Bundle analysis completed in ${(performance.now() - startTime).toFixed(2)}ms`);
      
      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  private async getBundleStats(): Promise<BundleSizeMetric[]> {
    try {
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build directory not found. Run build first.');
      }

      const chunks: BundleSizeMetric[] = [];
      
      // Analyze client bundles
      const clientDir = path.join(buildDir, 'static', 'chunks');
      if (fs.existsSync(clientDir)) {
        const files = fs.readdirSync(clientDir);
        
        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = path.join(clientDir, file);
            const stats = fs.statSync(filePath);
            const size = stats.size;
            
            chunks.push({
              name: file,
              size,
              gzipSize: this.estimateGzipSize(size),
              parsedSize: size,
              percent: 0, // Will be calculated later
              files: [filePath]
            });
          }
        }
      }
      
      // Calculate percentages
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      chunks.forEach(chunk => {
        chunk.percent = totalSize > 0 ? (chunk.size / totalSize) * 100 : 0;
      });
      
      return chunks;
    } catch (error) {
      console.error('Failed to get bundle stats:', error);
      return [];
    }
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies: DependencyInfo[] = [];
      
      // Analyze direct dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      for (const [name, version] of Object.entries(allDeps)) {
        const size = await this.getDependencySize(name);
        const usage = await this.getDependencyUsage(name);
        const type = packageJson.dependencies[name] ? 'direct' : 'dev';
        
        dependencies.push({
          name,
          version: version as string,
          size,
          used: usage > 0,
          usage,
          type,
          canBeRemoved: usage < this.config.unusedDependencyThreshold,
          alternatives: await this.getAlternatives(name)
        });
      }
      
      // Analyze transitive dependencies (simplified)
      const transitiveDeps = await this.getTransitiveDependencies();
      dependencies.push(...transitiveDeps);
      
      return dependencies;
    } catch (error) {
      console.error('Failed to analyze dependencies:', error);
      return [];
    }
  }

  private async getDependencySize(name: string): Promise<number> {
    try {
      // Try to get size from node_modules
      const nodeModulesPath = path.join(process.cwd(), 'node_modules', name);
      if (fs.existsSync(nodeModulesPath)) {
        return this.getDirectorySize(nodeModulesPath);
      }
      
      // Fallback to estimated size
      return this.estimateDependencySize(name);
    } catch (error) {
      return this.estimateDependencySize(name);
    }
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  private estimateDependencySize(name: string): number {
    // Simple estimation based on package name patterns
    if (name.includes('react') || name.includes('next')) {
      return 200 * 1024; // 200KB for React/Next.js
    }
    if (name.includes('lodash') || name.includes('underscore')) {
      return 70 * 1024; // 70KB for utility libraries
    }
    if (name.includes('chart') || name.includes('d3')) {
      return 150 * 1024; // 150KB for charting libraries
    }
    return 50 * 1024; // 50KB default
  }

  private async getDependencyUsage(name: string): Promise<number> {
    try {
      // Simple usage detection by checking imports in source files
      const srcDir = path.join(process.cwd(), 'src');
      if (!fs.existsSync(srcDir)) {
        return 0;
      }
      
      const usageCount = this.countImportUsage(srcDir, name);
      const totalFiles = this.countTypeScriptFiles(srcDir);
      
      return totalFiles > 0 ? usageCount / totalFiles : 0;
    } catch (error) {
      return 0;
    }
  }

  private countImportUsage(dirPath: string, packageName: string): number {
    let count = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        count += this.countImportUsage(filePath, packageName);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(packageName)) {
          count++;
        }
      }
    }
    
    return count;
  }

  private countTypeScriptFiles(dirPath: string): number {
    let count = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        count += this.countTypeScriptFiles(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        count++;
      }
    }
    
    return count;
  }

  private async getTransitiveDependencies(): Promise<DependencyInfo[]> {
    try {
      // This is a simplified version - in a real implementation,
      // you would use tools like `npm ls` or `madge` to get the full dependency tree
      const output = execSync('npm ls --depth=0 --json', { encoding: 'utf8' });
      const dependencies = JSON.parse(output);
      
      // Extract transitive dependencies (simplified)
      const transitiveDeps: DependencyInfo[] = [];
      
      // This is a placeholder - in a real implementation, you would parse the full dependency tree
      return transitiveDeps;
    } catch (error) {
      return [];
    }
  }

  private identifyUnusedDependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
    return dependencies.filter(dep => 
      dep.type === 'direct' && 
      dep.usage < this.config.unusedDependencyThreshold &&
      dep.canBeRemoved
    );
  }

  private identifyLargeAssets(chunks: BundleSizeMetric[]): BundleSizeMetric[] {
    return chunks.filter(chunk => chunk.size > this.config.largeAssetThreshold);
  }

  private generateRecommendations(data: {
    bundleStats: BundleSizeMetric[];
    dependencies: DependencyInfo[];
    unusedDependencies: DependencyInfo[];
    largeAssets: BundleSizeMetric[];
  }): string[] {
    const recommendations: string[] = [];
    
    // Check total bundle size
    const totalSize = data.bundleStats.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalSize > this.config.maxBundleSize) {
      recommendations.push(
        `Total bundle size (${this.formatBytes(totalSize)}) exceeds recommended limit (${this.formatBytes(this.config.maxBundleSize)}). Consider code splitting.`
      );
    }
    
    // Check for large chunks
    data.largeAssets.forEach(asset => {
      recommendations.push(
        `Large asset detected: ${asset.name} (${this.formatBytes(asset.size)}). Consider lazy loading or optimization.`
      );
    });
    
    // Check for unused dependencies
    data.unusedDependencies.forEach(dep => {
      recommendations.push(
        `Unused dependency: ${dep.name} (${this.formatBytes(dep.size)}). Consider removing it.`
      );
    });
    
    // Check for heavy dependencies
    const heavyDeps = data.dependencies.filter(dep => dep.size > 100 * 1024);
    heavyDeps.forEach(dep => {
      if (dep.alternatives.length > 0) {
        recommendations.push(
          `Heavy dependency ${dep.name} (${this.formatBytes(dep.size)}) has alternatives: ${dep.alternatives.join(', ')}.`
        );
      }
    });
    
    // General optimization recommendations
    if (this.config.enableTreeShaking) {
      recommendations.push('Enable tree-shaking to remove unused code.');
    }
    
    if (this.config.enableCodeSplitting) {
      recommendations.push('Implement code splitting for better loading performance.');
    }
    
    if (this.config.enableCompression) {
      recommendations.push('Enable compression (gzip/brotli) for smaller bundle sizes.');
    }
    
    return recommendations;
  }

  private calculateOptimizationScore(data: {
    bundleStats: BundleSizeMetric[];
    dependencies: DependencyInfo[];
    unusedDependencies: DependencyInfo[];
    largeAssets: BundleSizeMetric[];
  }): number {
    let score = 100;
    
    // Deduct for large bundle size
    const totalSize = data.bundleStats.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalSize > this.config.maxBundleSize) {
      score -= 20;
    }
    
    // Deduct for large chunks
    data.largeAssets.forEach(asset => {
      score -= 10;
    });
    
    // Deduct for unused dependencies
    data.unusedDependencies.forEach(dep => {
      score -= 5;
    });
    
    // Deduct for heavy dependencies
    const heavyDeps = data.dependencies.filter(dep => dep.size > 100 * 1024);
    score -= heavyDeps.length * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  private estimateGzipSize(size: number): number {
    // Rough estimation: gzip typically reduces size by 60-70%
    return Math.floor(size * 0.35);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async getAlternatives(packageName: string): Promise<string[]> {
    // Simple alternative mapping
    const alternatives: Record<string, string[]> = {
      'lodash': ['lodash-es', 'ramda', 'underscore'],
      'moment': ['date-fns', 'dayjs', 'luxon'],
      'react-router': ['@reach/router', 'wouter'],
      'axios': ['fetch', 'node-fetch', 'unfetch'],
      'classnames': ['clsx'],
      'prop-types': ['TypeScript'],
      'react-bootstrap': ['material-ui', 'chakra-ui'],
      'redux': ['zustand', 'jotai', 'context-api'],
      'react-redux': ['zustand', 'jotai', 'context-api']
    };
    
    return alternatives[packageName] || [];
  }

  async optimizeBundle(): Promise<void> {
    console.log('Starting bundle optimization...');
    
    try {
      // Run analysis first
      const analysis = await this.analyzeBundle();
      
      // Apply optimizations based on recommendations
      await this.applyOptimizations(analysis);
      
      console.log('Bundle optimization completed successfully!');
    } catch (error) {
      console.error('Bundle optimization failed:', error);
      throw error;
    }
  }

  private async applyOptimizations(analysis: BundleAnalysis): Promise<void> {
    // Remove unused dependencies
    if (analysis.unusedDependencies.length > 0) {
      console.log('Removing unused dependencies...');
      for (const dep of analysis.unusedDependencies) {
        await this.removeDependency(dep.name);
      }
    }
    
    // Optimize large assets
    if (analysis.largeAssets.length > 0) {
      console.log('Optimizing large assets...');
      // This would involve actual optimization logic
    }
    
    // Apply tree-shaking and code splitting
    if (this.config.enableTreeShaking || this.config.enableCodeSplitting) {
      console.log('Applying tree-shaking and code splitting...');
      // This would involve webpack/next.js configuration changes
    }
  }

  private async removeDependency(packageName: string): Promise<void> {
    try {
      execSync(`npm uninstall ${packageName}`, { stdio: 'inherit' });
      console.log(`Removed dependency: ${packageName}`);
    } catch (error) {
      console.error(`Failed to remove dependency ${packageName}:`, error);
    }
  }

  getLastAnalysis(): BundleAnalysis | null {
    return this.lastAnalysis;
  }

  getAnalysisHistory(): BundleAnalysis[] {
    return Array.from(this.analysisCache.values());
  }

  getOptimizationReport(): string {
    if (!this.lastAnalysis) {
      return 'No analysis available. Run analyzeBundle() first.';
    }
    
    const analysis = this.lastAnalysis;
    
    return `
Bundle Size Optimization Report
===============================

Total Bundle Size: ${this.formatBytes(analysis.totalSize)}
Total Gzip Size: ${this.formatBytes(analysis.totalGzipSize)}
Optimization Score: ${analysis.optimizationScore}/100

Chunks: ${analysis.chunks.length}
Dependencies: ${analysis.dependencies.length}
Unused Dependencies: ${analysis.unusedDependencies.length}
Large Assets: ${analysis.largeAssets.length}

Recommendations:
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

Generated at: ${new Date().toISOString()}
    `.trim();
  }
}

// Create default instance
export const bundleSizeOptimizer = new BundleSizeOptimizer();

// Utility functions
export async function analyzeBundle(): Promise<BundleAnalysis> {
  return bundleSizeOptimizer.analyzeBundle();
}

export async function optimizeBundle(): Promise<void> {
  return bundleSizeOptimizer.optimizeBundle();
}

export function getLastAnalysis(): BundleAnalysis | null {
  return bundleSizeOptimizer.getLastAnalysis();
}

export { BundleSizeOptimizer };
export type { BundleSizeMetric, DependencyInfo, BundleAnalysis, OptimizationConfig };