/**
 * User Feedback Collector Component
 * Phase 2.8 - Testing & User Feedback
 * 
 * Comprehensive user feedback collection system for AI personalization testing
 * with real-time feedback, rating system, and suggestion collection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Lightbulb, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserFeedbackCollectorProps {
  userId: string;
  sessionId: string;
  testId?: string;
  context?: {
    page: string;
    section?: string;
    deviceType: string;
    experienceLevel: string;
  };
  onFeedbackSubmit?: (feedback: any) => void;
  autoShow?: boolean;
  showDelay?: number; // milliseconds
}

interface FeedbackData {
  userId: string;
  sessionId: string;
  testId?: string;
  rating: number;
  feedback: string;
  suggestions: string[];
  timestamp: Date;
  context: {
    page: string;
    section?: string;
    deviceType: string;
    experienceLevel: string;
  };
}

export function UserFeedbackCollector({
  userId,
  sessionId,
  testId,
  context = {
    page: 'dashboard',
    deviceType: 'web',
    experienceLevel: 'beginner'
  },
  onFeedbackSubmit,
  autoShow = false,
  showDelay = 30000 // 30 seconds
}: UserFeedbackCollectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  // Auto-show feedback collector after delay
  useEffect(() => {
    if (autoShow && !hasSubmitted) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);

      return () => clearTimeout(timer);
    }
    // Explicit return for when autoShow is false
    return undefined;
  }, [autoShow, showDelay, hasSubmitted]);

  // Handle rating change
  const handleRatingChange = useCallback((newRating: number) => {
    setRating(newRating);
  }, []);

  // Add suggestion
  const addSuggestion = useCallback(() => {
    if (newSuggestion.trim() && !suggestions.includes(newSuggestion.trim())) {
      setSuggestions(prev => [...prev, newSuggestion.trim()]);
      setNewSuggestion('');
    }
  }, [newSuggestion, suggestions]);

  // Remove suggestion
  const removeSuggestion = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Submit feedback
  const submitFeedback = useCallback(async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting your feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        userId,
        sessionId,
        ...(testId && { testId }),
        rating,
        feedback,
        suggestions,
        timestamp: new Date(),
        context
      };

      // Send feedback to API
      const response = await fetch('/api/testing/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();

      // Call parent callback if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedbackData);
      }

      // Show success message
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our AI personalization.",
      });

      setHasSubmitted(true);
      setIsVisible(false);

      // Reset form
      setRating(0);
      setFeedback('');
      setSuggestions([]);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, sessionId, testId, rating, feedback, suggestions, context, onFeedbackSubmit, toast]);

  // Reset feedback form
  const resetFeedback = useCallback(() => {
    setRating(0);
    setFeedback('');
    setSuggestions([]);
    setNewSuggestion('');
    setHasSubmitted(false);
  }, []);

  if (!isVisible && !autoShow) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Give Feedback
      </Button>
    );
  }

  if (hasSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <ThumbsUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully and will help us improve our AI personalization system.
            </p>
            <Button onClick={resetFeedback} variant="outline">
              Submit Another Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Personalization Feedback
        </CardTitle>
        <CardDescription>
          Help us improve our AI-driven personalization by sharing your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            How satisfied are you with the AI personalization?
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 ? `${rating}/5` : 'Rate your experience'}
            </span>
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label className="block text-sm font-medium mb-2">
            What did you like or dislike about the personalization?
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about the AI-powered personalization features..."
            rows={4}
          />
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Suggestions for improvement
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="Add a suggestion..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSuggestion();
                }
              }}
            />
            <Button
              onClick={addSuggestion}
              variant="outline"
              size="sm"
              disabled={!newSuggestion.trim()}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Display suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {suggestion}
                  <button
                    onClick={() => removeSuggestion(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Context Information */}
        <div className="text-xs text-gray-500">
          <p>Page: {context.page}</p>
          {context.section && <p>Section: {context.section}</p>}
          <p>Device: {context.deviceType}</p>
          <p>Experience: {context.experienceLevel}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={submitFeedback}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Feedback Button Component
 * For simple, quick feedback collection
 */
export function QuickFeedbackButton({
  userId,
  sessionId,
  context,
  onFeedbackSubmit
}: {
  userId: string;
  sessionId: string;
  context?: any;
  onFeedbackSubmit?: (feedback: any) => void;
}) {
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = useCallback(async (isPositive: boolean) => {
    try {
      const feedbackData = {
        userId,
        sessionId,
        rating: isPositive ? 5 : 1,
        feedback: isPositive ? 'User found the experience helpful' : 'User found the experience unhelpful',
        suggestions: [],
        timestamp: new Date(),
        context: context || {
          page: 'dashboard',
          deviceType: 'web',
          experienceLevel: 'beginner'
        }
      };

      const response = await fetch('/api/testing/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedbackData);
      }

      toast({
        title: "Feedback Recorded",
        description: "Thank you for your quick feedback!",
      });

      setShowQuickFeedback(false);

    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to record feedback. Please try again later.",
        variant: "destructive"
      });
    }
  }, [userId, sessionId, context, onFeedbackSubmit, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showQuickFeedback ? (
        <Card className="w-48 shadow-lg">
          <CardContent className="pt-4">
            <p className="text-sm text-center mb-3">Was this helpful?</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => handleQuickFeedback(true)}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleQuickFeedback(false)}
                size="sm"
                variant="outline"
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowQuickFeedback(false)}
                size="sm"
                variant="ghost"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQuickFeedback(true)}
          className="shadow-lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      )}
    </div>
  );
}

/**
 * Feedback Summary Component
 * Display feedback statistics and insights
 */
export function FeedbackSummary({ feedbackData }: { feedbackData: any[] }) {
  const totalFeedback = feedbackData.length;
  const averageRating = totalFeedback > 0 
    ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback 
    : 0;
  const positiveFeedback = feedbackData.filter(f => f.rating >= 4).length;
  const negativeFeedback = feedbackData.filter(f => f.rating <= 2).length;

  // Get common suggestions
  const allSuggestions = feedbackData.flatMap(f => f.suggestions);
  const suggestionCounts = allSuggestions.reduce((acc, suggestion) => {
    acc[suggestion] = (acc[suggestion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSuggestions = Object.entries(suggestionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Summary</CardTitle>
        <CardDescription>
          User feedback analysis for AI personalization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalFeedback}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {averageRating.toFixed(1)}/5
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Positive Feedback</span>
            <span>{positiveFeedback} ({totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0}%)</span>
          </div>
          <Progress value={totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Negative Feedback</span>
            <span>{negativeFeedback} ({totalFeedback > 0 ? Math.round((negativeFeedback / totalFeedback) * 100) : 0}%)</span>
          </div>
          <Progress value={totalFeedback > 0 ? (negativeFeedback / totalFeedback) * 100 : 0} className="h-2" />
        </div>

        {/* Top Suggestions */}
        {topSuggestions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Top Suggestions</h4>
            <div className="space-y-1">
              {topSuggestions.map(([suggestion, count], index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{suggestion}</span>
                  <span className="text-gray-500">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}