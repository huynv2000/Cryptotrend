// Display Preferences Context
// Manages user preferences for displaying financial values throughout the application

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DisplayPreferences {
  numberFormat: 'full' | 'compact' | 'abbreviated' | 'scientific';
  precision: number;
  showCurrency: boolean;
  animateChanges: boolean;
  showTooltips: boolean;
  showHierarchy: boolean;
  mobileFormat: 'full' | 'compact' | 'abbreviated';
  desktopFormat: 'full' | 'compact' | 'abbreviated';
  colorCoding: boolean;
  compactMode: boolean;
}

const defaultPreferences: DisplayPreferences = {
  numberFormat: 'compact',
  precision: 2,
  showCurrency: true,
  animateChanges: true,
  showTooltips: true,
  showHierarchy: true,
  mobileFormat: 'compact',
  desktopFormat: 'full',
  colorCoding: true,
  compactMode: false,
};

interface DisplayPreferencesContextType {
  preferences: DisplayPreferences;
  updatePreferences: (newPreferences: Partial<DisplayPreferences>) => void;
  resetPreferences: () => void;
  isPreferencesPanelOpen: boolean;
  setPreferencesPanelOpen: (open: boolean) => void;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextType | undefined>(undefined);

interface DisplayPreferencesProviderProps {
  children: ReactNode;
}

export function DisplayPreferencesProvider({ children }: DisplayPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<DisplayPreferences>(defaultPreferences);
  const [isPreferencesPanelOpen, setPreferencesPanelOpen] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('displayPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error loading display preferences:', error);
      }
    }
  }, []);

  const updatePreferences = (newPreferences: Partial<DisplayPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    
    // Save to localStorage
    try {
      localStorage.setItem('displayPreferences', JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving display preferences:', error);
    }
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem('displayPreferences');
    } catch (error) {
      console.error('Error removing display preferences:', error);
    }
  };

  const value: DisplayPreferencesContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
    isPreferencesPanelOpen,
    setPreferencesPanelOpen,
  };

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext);
  if (context === undefined) {
    throw new Error('useDisplayPreferences must be used within a DisplayPreferencesProvider');
  }
  return context;
}

// Hook for formatting values based on user preferences
export function useFormattedValue() {
  const { preferences } = useDisplayPreferences();

  const formatValue = (value: number, options: {
    formatType?: 'currency' | 'number' | 'percent';
    overrideFormat?: DisplayPreferences['numberFormat'];
    overridePrecision?: number;
    overrideShowCurrency?: boolean;
  } = {}) => {
    const {
      formatType = 'currency',
      overrideFormat,
      overridePrecision,
      overrideShowCurrency,
    } = options;

    const format = overrideFormat || preferences.numberFormat;
    const precision = overridePrecision || preferences.precision;
    const showCurrency = overrideShowCurrency ?? (formatType === 'currency' && preferences.showCurrency);

    switch (format) {
      case 'full':
        return new Intl.NumberFormat('en-US', {
          style: showCurrency ? 'currency' : 'decimal',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(value);
      case 'compact':
        if (value >= 1e12) return `${showCurrency ? '$' : ''}${(value / 1e12).toFixed(precision)}T`;
        if (value >= 1e9) return `${showCurrency ? '$' : ''}${(value / 1e9).toFixed(precision)}B`;
        if (value >= 1e6) return `${showCurrency ? '$' : ''}${(value / 1e6).toFixed(precision)}M`;
        if (value >= 1e3) return `${showCurrency ? '$' : ''}${(value / 1e3).toFixed(precision)}K`;
        return new Intl.NumberFormat('en-US', {
          style: showCurrency ? 'currency' : 'decimal',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(value);
      case 'abbreviated':
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          compactDisplay: 'short',
          style: showCurrency ? 'currency' : 'decimal',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(value);
      case 'scientific':
        return `${showCurrency ? '$' : ''}${value.toExponential(precision)}`;
      default:
        return value.toString();
    }
  };

  const getResponsiveFormat = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? preferences.mobileFormat : preferences.desktopFormat;
  };

  return {
    formatValue,
    getResponsiveFormat,
    preferences,
  };
}