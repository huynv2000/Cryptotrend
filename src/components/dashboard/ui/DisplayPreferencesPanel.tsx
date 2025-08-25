// Display Preferences Panel Component
// Allows users to customize how financial values are displayed throughout the dashboard

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, RotateCcw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface DisplayPreferencesPanelProps {
  className?: string;
  onPreferencesChange?: (preferences: DisplayPreferences) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function DisplayPreferencesPanel({
  className,
  onPreferencesChange,
  isOpen = false,
  onToggle
}: DisplayPreferencesPanelProps) {
  const [preferences, setPreferences] = useState<DisplayPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('displayPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  const updatePreference = <K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K]
  ) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      setHasChanges(true);
      return newPreferences;
    });
  };

  const savePreferences = () => {
    localStorage.setItem('displayPreferences', JSON.stringify(preferences));
    onPreferencesChange?.(preferences);
    setHasChanges(false);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
  };

  const formatExamples = [
    { value: 28661633345.29, label: 'Large Value' },
    { value: 1234567.89, label: 'Medium Value' },
    { value: 1234.56, label: 'Small Value' },
  ];

  const getFormattedValue = (value: number) => {
    const format = preferences.numberFormat;
    const precision = preferences.precision;
    const showCurrency = preferences.showCurrency;

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

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn("fixed bottom-4 right-4 z-50 shadow-lg", className)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Display Settings
      </Button>
    );
  }

  return (
    <div className={cn("fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", className)}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Display Preferences</CardTitle>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Number Format */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Number Format</Label>
              <p className="text-xs text-muted-foreground">
                Choose how numbers are displayed throughout the dashboard
              </p>
            </div>
            
            <Select 
              value={preferences.numberFormat}
              onValueChange={(value) => updatePreference('numberFormat', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full ($28,661,633,345.29)</SelectItem>
                <SelectItem value="compact">Compact ($28.66B)</SelectItem>
                <SelectItem value="abbreviated">Abbreviated ($28.7B)</SelectItem>
                <SelectItem value="scientific">Scientific ($2.87e+10)</SelectItem>
              </SelectContent>
            </Select>

            {/* Format Examples */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Preview</Label>
              <div className="grid grid-cols-1 gap-2 p-3 bg-muted/50 rounded-lg">
                {formatExamples.map((example, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {example.label}
                    </span>
                    <span className="text-sm font-mono">
                      {getFormattedValue(example.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Precision Settings */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Decimal Places</Label>
              <p className="text-xs text-muted-foreground">
                Number of decimal places to show for fractional values
              </p>
            </div>
            
            <div className="space-y-3">
              <Slider
                value={[preferences.precision || 2]}
                onValueChange={([value]) => updatePreference('precision', value as number)}
                min={0}
                max={6}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0 decimals</span>
                <span className="font-medium">{preferences.precision || 2} decimals</span>
                <span>6 decimals</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Display Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Show Currency Symbol</Label>
                  <p className="text-xs text-muted-foreground">
                    Display $, €, or other currency symbols
                  </p>
                </div>
                <Switch
                  checked={preferences.showCurrency}
                  onCheckedChange={(checked) => updatePreference('showCurrency', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Animate Value Changes</Label>
                  <p className="text-xs text-muted-foreground">
                    Smooth transitions when values update
                  </p>
                </div>
                <Switch
                  checked={preferences.animateChanges}
                  onCheckedChange={(checked) => updatePreference('animateChanges', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Show Tooltips</Label>
                  <p className="text-xs text-muted-foreground">
                    Display detailed information on hover
                  </p>
                </div>
                <Switch
                  checked={preferences.showTooltips}
                  onCheckedChange={(checked) => updatePreference('showTooltips', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Show Value Hierarchy</Label>
                  <p className="text-xs text-muted-foreground">
                    Display level indicators (B, M, K, etc.)
                  </p>
                </div>
                <Switch
                  checked={preferences.showHierarchy}
                  onCheckedChange={(checked) => updatePreference('showHierarchy', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Color Coding</Label>
                  <p className="text-xs text-muted-foreground">
                    Use colors to indicate value levels
                  </p>
                </div>
                <Switch
                  checked={preferences.colorCoding}
                  onCheckedChange={(checked) => updatePreference('colorCoding', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use more compact display layouts
                  </p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => updatePreference('compactMode', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Responsive Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Responsive Display</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Mobile Format</Label>
                <Select 
                  value={preferences.mobileFormat}
                  onValueChange={(value) => updatePreference('mobileFormat', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="abbreviated">Abbreviated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Desktop Format</Label>
                <Select 
                  value={preferences.desktopFormat}
                  onValueChange={(value) => updatePreference('desktopFormat', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="abbreviated">Abbreviated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetPreferences}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Default</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={savePreferences}
                disabled={!hasChanges}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}