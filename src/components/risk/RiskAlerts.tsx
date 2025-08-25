// Risk Alerts Component
// Monitors portfolio risk levels and sends alerts when thresholds are breached

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { Bell, BellOff, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface RiskAlert {
  id: string;
  userId: string;
  type: 'VAR_BREACH' | 'VOLATILITY_SPIKE' | 'DRAWDOWN_WARNING' | 'CONCENTRATION_RISK' | 'LIQUIDITY_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  cryptoId?: string;
  cryptoSymbol?: string;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
  acknowledged: boolean;
  metadata?: {
    varLevel?: number;
    volatilityLevel?: number;
    drawdownLevel?: number;
    concentrationLevel?: number;
  };
}

interface RiskAlertsProps {
  userId?: string;
  className?: string;
}

export default function RiskAlerts({ userId, className }: RiskAlertsProps) {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alertSettings, setAlertSettings] = useState({
    varThreshold: 5, // 5% of portfolio value
    volatilityThreshold: 30, // 30% annualized volatility
    drawdownThreshold: 15, // 15% drawdown
    concentrationThreshold: 40, // 40% in single asset
    enabled: true
  });

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/risk/alerts?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching risk alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/risk/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      const response = await fetch(`/api/risk/alerts/acknowledge-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge all alerts');
      }

      setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
    } catch (err) {
      console.error('Error acknowledging all alerts:', err);
    }
  };

  const updateAlertSettings = async () => {
    try {
      const response = await fetch(`/api/risk/alerts/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: alertSettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update alert settings');
      }
    } catch (err) {
      console.error('Error updating alert settings:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'outline';
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'VAR_BREACH':
      case 'DRAWDOWN_WARNING':
        return <AlertTriangle className="h-4 w-4" />;
      case 'VOLATILITY_SPIKE':
      case 'CONCENTRATION_RISK':
      case 'LIQUIDITY_RISK':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertTypeColor = (type: string): string => {
    switch (type) {
      case 'VAR_BREACH': return 'text-red-600';
      case 'VOLATILITY_SPIKE': return 'text-orange-600';
      case 'DRAWDOWN_WARNING': return 'text-yellow-600';
      case 'CONCENTRATION_RISK': return 'text-purple-600';
      case 'LIQUIDITY_RISK': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL' && !alert.acknowledged);

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Risk Alerts</CardTitle>
          <CardDescription>Monitor portfolio risk levels and thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <LoadingState message="Loading risk alerts..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Risk Alerts</CardTitle>
          <CardDescription>Monitor portfolio risk levels and thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading risk alerts</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <button
                onClick={fetchAlerts}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Alerts</CardTitle>
            <CardDescription>Monitor portfolio risk levels and thresholds</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {alertSettings.enabled ? (
              <Bell className="h-4 w-4 text-green-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Alert Settings</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">VaR Threshold</label>
              <input
                type="number"
                value={alertSettings.varThreshold}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, varThreshold: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="0"
                max="100"
              />
              <div className="text-xs text-muted-foreground">%</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Volatility Threshold</label>
              <input
                type="number"
                value={alertSettings.volatilityThreshold}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, volatilityThreshold: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="0"
                max="100"
              />
              <div className="text-xs text-muted-foreground">%</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Drawdown Threshold</label>
              <input
                type="number"
                value={alertSettings.drawdownThreshold}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, drawdownThreshold: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="0"
                max="100"
              />
              <div className="text-xs text-muted-foreground">%</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Concentration Threshold</label>
              <input
                type="number"
                value={alertSettings.concentrationThreshold}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, concentrationThreshold: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="0"
                max="100"
              />
              <div className="text-xs text-muted-foreground">%</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={alertSettings.enabled ? 'enabled' : 'disabled'}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, enabled: e.target.value === 'enabled' }))}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
          <Button onClick={updateAlertSettings} size="sm">
            Update Settings
          </Button>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-600">Critical Alerts Require Attention</span>
            </div>
            <div className="text-sm text-red-500">
              You have {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} that need immediate attention.
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Recent Alerts ({unacknowledgedAlerts.length} unacknowledged)
            </div>
            {unacknowledgedAlerts.length > 0 && (
              <Button variant="outline" size="sm" onClick={acknowledgeAllAlerts}>
                Acknowledge All
              </Button>
            )}
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 border rounded-lg transition-colors',
                    alert.acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white',
                    !alert.acknowledged && alert.severity === 'CRITICAL' && 'border-red-200 bg-red-50',
                    !alert.acknowledged && alert.severity === 'HIGH' && 'border-orange-200 bg-orange-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn('mt-0.5', getAlertTypeColor(alert.type))}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                            {alert.severity}
                          </Badge>
                          {alert.cryptoSymbol && (
                            <Badge variant="outline" className="text-xs">
                              {alert.cryptoSymbol}
                            </Badge>
                          )}
                          {alert.acknowledged && (
                            <Badge variant="secondary" className="text-xs">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Threshold: {formatPercentage(alert.threshold)}</span>
                          <span>Current: {formatPercentage(alert.currentValue)}</span>
                          <span>
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="ml-2"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-2">No risk alerts</div>
              <div className="text-muted-foreground">
                Your portfolio is within acceptable risk parameters
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={fetchAlerts} variant="outline">
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}