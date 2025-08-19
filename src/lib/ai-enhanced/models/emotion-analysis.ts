/**
 * Emotion Analysis Model Implementation
 * 
 * This model implements advanced emotion detection and analysis for
 * financial text, providing deeper insights beyond basic sentiment.
 */

import { Logger } from '@/lib/ai-logger';

export interface EmotionConfig {
  model: string;
  emotions: string[];
  threshold: number;
}

export interface EmotionAnalysisResult {
  overallEmotion: string;
  emotionScores: { [emotion: string]: number };
  confidence: number;
  intensity: number;
  primaryEmotions: PrimaryEmotion[];
  emotionalTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  };
  triggers: EmotionTrigger[];
  psychologicalProfile: PsychologicalProfile;
  analysisDate: Date;
}

export interface PrimaryEmotion {
  emotion: string;
  score: number;
  confidence: number;
  description: string;
  implications: string[];
}

export interface EmotionTrigger {
  text: string;
  emotion: string;
  intensity: number;
  context: string;
  confidence: number;
}

export interface PsychologicalProfile {
  riskTolerance: 'low' | 'medium' | 'high';
  decisionStyle: 'analytical' | 'intuitive' | 'emotional';
  timeHorizon: 'short' | 'medium' | 'long';
  confidenceLevel: number;
  behavioralBiases: string[];
}

export interface TextSample {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  source: string;
  metadata?: any;
}

export class EmotionAnalysisModel {
  private config: EmotionConfig;
  private logger: Logger;

  constructor(config: EmotionConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('EmotionAnalysisModel');
  }

  /**
   * Analyze emotions for a specific cryptocurrency
   */
  async analyzeEmotions(cryptoId: string): Promise<EmotionAnalysisResult> {
    this.logger.info(`Analyzing emotions for ${cryptoId}`);

    try {
      // In a real implementation, this would fetch text data from various sources
      // For now, we'll simulate the analysis
      const mockTexts = this.generateMockTextSamples(cryptoId);
      
      const results = await Promise.all(
        mockTexts.map(text => this.analyzeTextEmotions(text))
      );

      const overallResult = this.aggregateEmotionResults(results, mockTexts);
      
      this.logger.info(`Emotion analysis completed for ${cryptoId}`, {
        overallEmotion: overallResult.overallEmotion,
        confidence: overallResult.confidence,
        textCount: mockTexts.length
      });

      return overallResult;

    } catch (error) {
      this.logger.error(`Emotion analysis failed for ${cryptoId}`, error);
      throw new Error(`Emotion analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze emotions in a single text sample
   */
  private async analyzeTextEmotions(text: TextSample): Promise<{
    emotionScores: { [emotion: string]: number };
    triggers: EmotionTrigger[];
    confidence: number;
  }> {
    try {
      // In a real implementation, this would use actual emotion analysis models
      // For now, we'll simulate the analysis
      return this.simulateEmotionAnalysis(text);
    } catch (error) {
      this.logger.error('Text emotion analysis failed', error);
      throw new Error(`Text emotion analysis failed: ${error.message}`);
    }
  }

  /**
   * Simulate emotion analysis (placeholder for real implementation)
   */
  private simulateEmotionAnalysis(text: TextSample): {
    emotionScores: { [emotion: string]: number };
    triggers: EmotionTrigger[];
    confidence: number;
  } {
    const content = text.content.toLowerCase();
    
    // Define emotion keywords and patterns
    const emotionPatterns: { [emotion: string]: RegExp[] } = {
      'joy': [
        /\b(happy|excited|thrilled|delighted|pleased|glad|cheerful|joyful|optimistic|hopeful|bullish|moon|lambos|wen|gm|gn)\b/gi,
        /\b(🚀|🌙|💎|🙌|👍|💪|🔥|⭐|✨|🎉|🎊|😊|😄|🙂|😃)\b/g
      ],
      'fear': [
        /\b(afraid|scared|terrified|anxious|worried|nervous|concerned|panic|fear|bearish|dump|crash|rekt|fud)\b/gi,
        /\b(💀|🔻|📉|⚠️|❌|🚫|😱|😨|😰|😟)\b/g
      ],
      'anger': [
        /\b(angry|mad|furious|rage|outraged|irritated|annoyed|frustrated|disgusted|hate|scam|exploit|hack)\b/gi,
        /\b(😡|😠|🤬|💢|👿|😾)\b/g
      ],
      'sadness': [
        /\b(sad|depressed|disappointed|upset|gloomy|melancholy|miserable|heartbroken|loss|fail|failure|miss)\b/gi,
        /\b(😢|😭|😞|😔|😟|😿|💔)\b/g
      ],
      'surprise': [
        /\b(surprised|amazed|astonished|shocked|stunned|wow|unexpected|sudden|breakthrough|news)\b/gi,
        /\b(😮|😲|😯|😱|🤯|❗|❕|‼️)\b/g
      ],
      'disgust': [
        /\b(disgusted|revolted|repulsed|sickened|nauseated|appalled|awful|terrible|horrible|gross)\b/gi,
        /\b(🤢|🤮|🤧|😖|😣|😷)\b/g
      ],
      'anticipation': [
        /\b(excited|eager|enthusiastic|awaiting|expecting|looking forward|coming soon|soon|tmrw|tomorrow)\b/gi,
        /\b(🤔|🤗|🤤|🤑|🤓)\b/g
      ],
      'trust': [
        /\b(trust|confident|reliable|dependable|secure|safe|solid|strong|stable|legit|genuine)\b/gi,
        /\b(🤝|👌|👍|💯|✅)\b/g
      ]
    };

    const emotionScores: { [emotion: string]: number } = {};
    const triggers: EmotionTrigger[] = [];

    // Calculate emotion scores based on pattern matches
    Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
      let score = 0;
      let matchCount = 0;

      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matchCount += matches.length;
          score += matches.length * 0.1;
        }
      });

      // Apply intensity modifiers
      const intensityWords = ['very', 'extremely', 'really', 'so', 'too', 'absolutely'];
      intensityWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\s+(\\w+)\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length * 0.05;
        }
      });

      // Normalize score
      emotionScores[emotion] = Math.min(score, 1);

      // Extract triggers for this emotion
      if (score > 0.1) {
        patterns.forEach(pattern => {
          let match;
          const regex = new RegExp(pattern.source, 'gi');
          while ((match = regex.exec(content)) !== null) {
            triggers.push({
              text: match[0],
              emotion,
              intensity: score,
              context: this.extractContext(content, match.index, 20),
              confidence: Math.min(score * 2, 1)
            });
          }
        });
      }
    });

    // Calculate overall confidence
    const totalEmotionScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
    const confidence = Math.min(totalEmotionScore / Object.keys(emotionScores).length, 1);

    return {
      emotionScores,
      triggers,
      confidence
    };
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string, index: number, windowSize: number): string {
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + windowSize);
    return text.substring(start, end);
  }

  /**
   * Aggregate emotion results from multiple texts
   */
  private aggregateEmotionResults(results: any[], texts: TextSample[]): EmotionAnalysisResult {
    // Aggregate emotion scores
    const aggregatedScores: { [emotion: string]: number } = {};
    const allTriggers: EmotionTrigger[] = [];

    results.forEach(result => {
      Object.entries(result.emotionScores).forEach(([emotion, score]) => {
        if (!aggregatedScores[emotion]) {
          aggregatedScores[emotion] = 0;
        }
        aggregatedScores[emotion] += score;
      });
      allTriggers.push(...result.triggers);
    });

    // Normalize scores
    Object.keys(aggregatedScores).forEach(emotion => {
      aggregatedScores[emotion] /= results.length;
    });

    // Determine overall emotion
    const overallEmotion = Object.entries(aggregatedScores)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Calculate confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Calculate intensity
    const intensity = Object.values(aggregatedScores).reduce((sum, score) => sum + score, 0) / Object.keys(aggregatedScores).length;

    // Identify primary emotions
    const primaryEmotions: PrimaryEmotion[] = Object.entries(aggregatedScores)
      .filter(([, score]) => score > 0.1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, score]) => ({
        emotion,
        score,
        confidence: Math.min(score * 2, 1),
        description: this.getEmotionDescription(emotion),
        implications: this.getEmotionImplications(emotion)
      }));

    // Calculate emotional trend
    const emotionalTrend = this.calculateEmotionalTrend(results, texts);

    // Aggregate triggers
    const triggerCounts = allTriggers.reduce((acc, trigger) => {
      const key = `${trigger.text}_${trigger.emotion}`;
      if (!acc[key]) {
        acc[key] = { ...trigger, count: 0 };
      }
      acc[key].count += 1;
      acc[key].intensity = Math.max(acc[key].intensity, trigger.intensity);
      return acc;
    }, {} as { [key: string]: EmotionTrigger & { count: number } });

    const finalTriggers = Object.values(triggerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ count, ...trigger }) => trigger);

    // Generate psychological profile
    const psychologicalProfile = this.generatePsychologicalProfile(aggregatedScores);

    return {
      overallEmotion,
      emotionScores: aggregatedScores,
      confidence: avgConfidence,
      intensity,
      primaryEmotions,
      emotionalTrend,
      triggers: finalTriggers,
      psychologicalProfile,
      analysisDate: new Date()
    };
  }

  /**
   * Calculate emotional trend over time
   */
  private calculateEmotionalTrend(results: any[], texts: TextSample[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  } {
    if (texts.length < 3) {
      return {
        direction: 'stable',
        strength: 0
      };
    }

    // Sort texts by timestamp
    const sortedTexts = [...texts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Split into two halves
    const midPoint = Math.floor(sortedTexts.length / 2);
    const earlyTexts = sortedTexts.slice(0, midPoint);
    const lateTexts = sortedTexts.slice(midPoint);

    // Calculate average emotion intensity for each period
    const earlyIntensity = earlyTexts.reduce((sum, text) => {
      const result = results[texts.indexOf(text)];
      const intensity = Object.values(result.emotionScores).reduce((s, score) => s + score, 0) / Object.keys(result.emotionScores).length;
      return sum + intensity;
    }, 0) / earlyTexts.length;

    const lateIntensity = lateTexts.reduce((sum, text) => {
      const result = results[texts.indexOf(text)];
      const intensity = Object.values(result.emotionScores).reduce((s, score) => s + score, 0) / Object.keys(result.emotionScores).length;
      return sum + intensity;
    }, 0) / lateTexts.length;

    const difference = lateIntensity - earlyIntensity;
    const strength = Math.abs(difference);
    
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(difference) < 0.1) {
      direction = 'stable';
    } else if (difference > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return {
      direction,
      strength
    };
  }

  /**
   * Generate psychological profile based on emotion scores
   */
  private generatePsychologicalProfile(emotionScores: { [emotion: string]: number }): PsychologicalProfile {
    const scores = emotionScores;

    // Determine risk tolerance
    const fearScore = scores.fear || 0;
    const joyScore = scores.joy || 0;
    const trustScore = scores.trust || 0;
    
    let riskTolerance: 'low' | 'medium' | 'high';
    if (fearScore > 0.3) {
      riskTolerance = 'low';
    } else if (joyScore > 0.3 && trustScore > 0.2) {
      riskTolerance = 'high';
    } else {
      riskTolerance = 'medium';
    }

    // Determine decision style
    const angerScore = scores.anger || 0;
    const sadnessScore = scores.sadness || 0;
    const surpriseScore = scores.surprise || 0;
    
    let decisionStyle: 'analytical' | 'intuitive' | 'emotional';
    if (angerScore > 0.2 || sadnessScore > 0.2) {
      decisionStyle = 'emotional';
    } else if (surpriseScore > 0.2) {
      decisionStyle = 'intuitive';
    } else {
      decisionStyle = 'analytical';
    }

    // Determine time horizon
    const anticipationScore = scores.anticipation || 0;
    const trustScore2 = scores.trust || 0;
    
    let timeHorizon: 'short' | 'medium' | 'long';
    if (anticipationScore > 0.2 && trustScore2 > 0.2) {
      timeHorizon = 'long';
    } else if (anticipationScore > 0.1) {
      timeHorizon = 'medium';
    } else {
      timeHorizon = 'short';
    }

    // Calculate confidence level
    const confidenceLevel = (trustScore + joyScore) / 2;

    // Identify behavioral biases
    const biases: string[] = [];
    if (fearScore > 0.3) biases.push('loss-aversion');
    if (joyScore > 0.4) biases.push('overconfidence');
    if (angerScore > 0.2) biases.push('emotional-bias');
    if (surpriseScore > 0.3) biases.push('recency-bias');

    return {
      riskTolerance,
      decisionStyle,
      timeHorizon,
      confidenceLevel,
      behavioralBiases: biases
    };
  }

  /**
   * Get emotion description
   */
  private getEmotionDescription(emotion: string): string {
    const descriptions: { [key: string]: string } = {
      'joy': 'Positive emotion indicating optimism and satisfaction',
      'fear': 'Negative emotion indicating anxiety and risk perception',
      'anger': 'Negative emotion indicating frustration and aggression',
      'sadness': 'Negative emotion indicating disappointment and loss',
      'surprise': 'Neutral emotion indicating unexpected events',
      'disgust': 'Negative emotion indicating rejection and aversion',
      'anticipation': 'Positive emotion indicating expectation and hope',
      'trust': 'Positive emotion indicating confidence and security'
    };
    return descriptions[emotion] || 'Emotion not described';
  }

  /**
   * Get emotion implications
   */
  private getEmotionImplications(emotion: string): string[] {
    const implications: { [key: string]: string[] } = {
      'joy': ['Increased buying pressure', 'Positive market sentiment', 'Higher risk tolerance'],
      'fear': ['Selling pressure', 'Market volatility', 'Risk aversion'],
      'anger': ['Irrational decisions', 'Market overreaction', 'Increased volatility'],
      'sadness': ['Reduced trading activity', 'Market stagnation', 'Conservative positioning'],
      'surprise': ['Market volatility', 'Increased trading volume', 'Price discovery'],
      'disgust': ['Asset avoidance', 'Market exit', 'Negative sentiment'],
      'anticipation': ['Position building', 'Market preparation', 'Strategic trading'],
      'trust': ['Market stability', 'Long-term positioning', 'Reduced volatility']
    };
    return implications[emotion] || [];
  }

  /**
   * Generate mock text samples for testing
   */
  private generateMockTextSamples(cryptoId: string): TextSample[] {
    const sources = ['Twitter', 'Reddit', 'Telegram', 'Discord', 'News'];
    const samples: TextSample[] = [];
    
    // Generate 15-30 mock text samples
    const sampleCount = Math.floor(Math.random() * 16) + 15;
    
    for (let i = 0; i < sampleCount; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const emotionType = Math.floor(Math.random() * 3); // 0: positive, 1: negative, 2: neutral
      
      samples.push({
        id: `text_${i}`,
        content: this.generateMockTextContent(cryptoId, emotionType),
        author: `user_${i}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        source
      });
    }
    
    return samples;
  }

  /**
   * Generate mock text content
   */
  private generateMockTextContent(cryptoId: string, emotionType: number): string {
    const positiveTemplates = [
      `${cryptoId.toUpperCase()} is making me so happy! The gains are incredible and I'm really excited about the future.`,
      `I'm thrilled with ${cryptoId.toUpperCase()}'s performance. The team is delivering amazing results!`,
      `Feeling joyful about my ${cryptoId.toUpperCase()} investment. This is going to the moon! 🚀`,
      `I trust ${cryptoId.toUpperCase()} completely. The fundamentals are so strong and I'm confident in the long-term vision.`,
      `Anticipating great things from ${cryptoId.toUpperCase()}. The upcoming developments look very promising!`
    ];

    const negativeTemplates = [
      `${cryptoId.toUpperCase()} is making me worried. The price drop is scary and I'm afraid of losing more.`,
      `I'm so frustrated with ${cryptoId.toUpperCase()}. The market manipulation is disgusting and makes me angry.`,
      `Feeling sad about my ${cryptoId.toUpperCase()} investment. The losses are disappointing and I regret buying.`,
      `${cryptoId.toUpperCase()}'s performance is terrible. I'm disgusted with the way things are going.`,
      `I'm shocked by ${cryptoId.toUpperCase()}'s sudden crash. This was completely unexpected and scary.`
    ];

    const neutralTemplates = [
      `${cryptoId.toUpperCase()} is trading sideways today. The market seems to be waiting for catalysts.`,
      `Watching ${cryptoId.toUpperCase()}'s price action closely. The technical indicators are mixed.`,
      `${cryptoId.toUpperCase()} volume is average today. Not much excitement in the market.`,
      `The ${cryptoId.toUpperCase()} community is discussing the latest developments. Opinions are divided.`,
      `${cryptoId.toUpperCase()} is holding support levels. The market sentiment is cautious.`
    ];

    let templates: string[];
    if (emotionType === 0) {
      templates = positiveTemplates;
    } else if (emotionType === 1) {
      templates = negativeTemplates;
    } else {
      templates = neutralTemplates;
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get model information
   */
  getModelInfo(): object {
    return {
      name: 'Emotion Analysis Model',
      version: '1.0.0',
      description: 'Advanced emotion detection and psychological profiling for financial text',
      capabilities: ['emotion-detection', 'psychological-profiling', 'trend-analysis', 'trigger-identification', 'behavioral-bias-detection'],
      supportedEmotions: this.config.emotions,
      config: this.config
    };
  }
}