// Risk Alerts API Endpoint
// Manages risk alerts and notifications for portfolio monitoring

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

interface AlertSettings {
  varThreshold: number;
  volatilityThreshold: number;
  drawdownThreshold: number;
  concentrationThreshold: number;
  enabled: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user's risk alerts
    const alerts = await db.$queryRaw`
      SELECT 
        ra.id,
        ra.user_id as userId,
        ra.type,
        ra.severity,
        ra.title,
        ra.message,
        ra.crypto_id as cryptoId,
        c.symbol as cryptoSymbol,
        ra.threshold,
        ra.current_value as currentValue,
        ra.triggered_at as triggeredAt,
        ra.acknowledged,
        ra.metadata
      FROM risk_alerts ra
      LEFT JOIN cryptocurrencies c ON ra.crypto_id = c.id
      WHERE ra.user_id = ${userId}
      ORDER BY ra.triggered_at DESC
      LIMIT 50
    ` as RiskAlert[];

    // Get user's alert settings
    const settings = await db.$queryRaw`
      SELECT 
        var_threshold as varThreshold,
        volatility_threshold as volatilityThreshold,
        drawdown_threshold as drawdownThreshold,
        concentration_threshold as concentrationThreshold,
        enabled
      FROM risk_alert_settings
      WHERE user_id = ${userId}
      LIMIT 1
    ` as AlertSettings[];

    return NextResponse.json({
      alerts,
      settings: settings[0] || {
        varThreshold: 5,
        volatilityThreshold: 30,
        drawdownThreshold: 15,
        concentrationThreshold: 40,
        enabled: true
      }
    });

  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, settings } = body;

    if (userId && settings) {
      // Update alert settings
      const result = await db.$executeRaw`
        INSERT INTO risk_alert_settings (user_id, var_threshold, volatility_threshold, drawdown_threshold, concentration_threshold, enabled, updated_at)
        VALUES (${userId}, ${settings.varThreshold}, ${settings.volatilityThreshold}, ${settings.drawdownThreshold}, ${settings.concentrationThreshold}, ${settings.enabled}, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          var_threshold = ${settings.varThreshold},
          volatility_threshold = ${settings.volatilityThreshold},
          drawdown_threshold = ${settings.drawdownThreshold},
          concentration_threshold = ${settings.concentrationThreshold},
          enabled = ${settings.enabled},
          updated_at = datetime('now')
      `;

      return NextResponse.json({ success: true });
    }

    // Check for new alerts (monitoring endpoint)
    if (userId) {
      const newAlerts = await checkAndCreateAlerts(userId);
      return NextResponse.json({ newAlerts });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing risk alerts request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function checkAndCreateAlerts(userId: string): Promise<RiskAlert[]> {
  const newAlerts: RiskAlert[] = [];

  try {
    // Get user's portfolio and risk metrics
    const portfolio = await db.$queryRaw`
      SELECT 
        p.id,
        p.user_id as userId,
        p.crypto_id as cryptoId,
        p.amount,
        p.avg_buy_price as avgBuyPrice,
        p.current_value as currentValue,
        c.symbol as cryptoSymbol,
        c.name as cryptoName,
        rm.var95,
        rm.var99,
        rm.volatility,
        rm.max_drawdown as maxDrawdown,
        rm.risk_level as riskLevel,
        rm.risk_score as riskScore
      FROM portfolios p
      LEFT JOIN cryptocurrencies c ON p.crypto_id = c.id
      LEFT JOIN risk_metrics rm ON p.crypto_id = rm.crypto_id
      WHERE p.user_id = ${userId}
      AND rm.timestamp = (
        SELECT MAX(timestamp) 
        FROM risk_metrics 
        WHERE crypto_id = p.crypto_id
      )
    ` as any[];

    if (portfolio.length === 0) {
      return newAlerts;
    }

    // Get user's alert settings
    const settings = await db.$queryRaw`
      SELECT 
        var_threshold as varThreshold,
        volatility_threshold as volatilityThreshold,
        drawdown_threshold as drawdownThreshold,
        concentration_threshold as concentrationThreshold,
        enabled
      FROM risk_alert_settings
      WHERE user_id = ${userId}
      LIMIT 1
    ` as AlertSettings[];

    const alertSettings = settings[0] || {
      varThreshold: 5,
      volatilityThreshold: 30,
      drawdownThreshold: 15,
      concentrationThreshold: 40,
      enabled: true
    };

    if (!alertSettings.enabled) {
      return newAlerts;
    }

    // Calculate total portfolio value
    const totalPortfolioValue = portfolio.reduce((sum, position) => 
      sum + (position.currentValue || position.amount * position.avgBuyPrice), 0
    );

    // Check each position for alert conditions
    for (const position of portfolio) {
      const positionValue = position.currentValue || position.amount * position.avgBuyPrice;
      const positionWeight = (positionValue / totalPortfolioValue) * 100;

      // VaR Breach Check
      if (position.var95 && position.var95 > (alertSettings.varThreshold / 100) * positionValue) {
        const alert = await createAlertIfNotExists({
          userId,
          type: 'VAR_BREACH',
          severity: position.var95 > (alertSettings.varThreshold / 100) * positionValue * 2 ? 'CRITICAL' : 'HIGH',
          title: 'VaR Breach Detected',
          message: `Value at Risk for ${position.cryptoSymbol} exceeds threshold: $${position.var95.toFixed(2)}`,
          cryptoId: position.cryptoId,
          cryptoSymbol: position.cryptoSymbol,
          threshold: alertSettings.varThreshold,
          currentValue: (position.var95 / positionValue) * 100,
          metadata: { varLevel: position.var95 }
        });
        if (alert) newAlerts.push(alert);
      }

      // Volatility Spike Check
      if (position.volatility && position.volatility > alertSettings.volatilityThreshold) {
        const alert = await createAlertIfNotExists({
          userId,
          type: 'VOLATILITY_SPIKE',
          severity: position.volatility > alertSettings.volatilityThreshold * 1.5 ? 'HIGH' : 'MEDIUM',
          title: 'High Volatility Detected',
          message: `${position.cryptoSymbol} volatility is elevated: ${position.volatility.toFixed(2)}%`,
          cryptoId: position.cryptoId,
          cryptoSymbol: position.cryptoSymbol,
          threshold: alertSettings.volatilityThreshold,
          currentValue: position.volatility,
          metadata: { volatilityLevel: position.volatility }
        });
        if (alert) newAlerts.push(alert);
      }

      // Drawdown Warning Check
      if (position.maxDrawdown && Math.abs(position.maxDrawdown) > alertSettings.drawdownThreshold) {
        const alert = await createAlertIfNotExists({
          userId,
          type: 'DRAWDOWN_WARNING',
          severity: Math.abs(position.maxDrawdown) > alertSettings.drawdownThreshold * 1.5 ? 'HIGH' : 'MEDIUM',
          title: 'Significant Drawdown Detected',
          message: `${position.cryptoSymbol} is experiencing significant drawdown: ${position.maxDrawdown.toFixed(2)}%`,
          cryptoId: position.cryptoId,
          cryptoSymbol: position.cryptoSymbol,
          threshold: alertSettings.drawdownThreshold,
          currentValue: Math.abs(position.maxDrawdown),
          metadata: { drawdownLevel: position.maxDrawdown }
        });
        if (alert) newAlerts.push(alert);
      }

      // Concentration Risk Check
      if (positionWeight > alertSettings.concentrationThreshold) {
        const alert = await createAlertIfNotExists({
          userId,
          type: 'CONCENTRATION_RISK',
          severity: positionWeight > alertSettings.concentrationThreshold * 1.25 ? 'HIGH' : 'MEDIUM',
          title: 'High Concentration Risk',
          message: `${position.cryptoSymbol} represents ${positionWeight.toFixed(1)}% of your portfolio`,
          cryptoId: position.cryptoId,
          cryptoSymbol: position.cryptoSymbol,
          threshold: alertSettings.concentrationThreshold,
          currentValue: positionWeight,
          metadata: { concentrationLevel: positionWeight }
        });
        if (alert) newAlerts.push(alert);
      }
    }

    return newAlerts;

  } catch (error) {
    console.error('Error checking for alerts:', error);
    return newAlerts;
  }
}

async function createAlertIfNotExists(alertData: {
  userId: string;
  type: 'VAR_BREACH' | 'VOLATILITY_SPIKE' | 'DRAWDOWN_WARNING' | 'CONCENTRATION_RISK' | 'LIQUIDITY_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  cryptoId?: string;
  cryptoSymbol?: string;
  threshold: number;
  currentValue: number;
  metadata?: any;
}): Promise<RiskAlert | null> {
  try {
    // Check if similar alert already exists in the last 24 hours
    const existingAlert = await db.$queryRaw`
      SELECT id FROM risk_alerts
      WHERE user_id = ${alertData.userId}
      AND type = ${alertData.type}
      AND crypto_id = ${alertData.cryptoId || null}
      AND triggered_at > datetime('now', '-1 day')
      AND acknowledged = false
      LIMIT 1
    ` as { id: string }[];

    if (existingAlert.length > 0) {
      return null; // Alert already exists
    }

    // Create new alert
    const result = await db.$queryRaw`
      INSERT INTO risk_alerts (
        id, user_id, type, severity, title, message, crypto_id, threshold, current_value, triggered_at, acknowledged, metadata
      )
      VALUES (
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
        ${alertData.userId},
        ${alertData.type},
        ${alertData.severity},
        ${alertData.title},
        ${alertData.message},
        ${alertData.cryptoId || null},
        ${alertData.threshold},
        ${alertData.currentValue},
        datetime('now'),
        false,
        ${alertData.metadata ? JSON.stringify(alertData.metadata) : null}
      )
      RETURNING id, user_id as userId, type, severity, title, message, crypto_id as cryptoId, threshold, current_value as currentValue, triggered_at as triggeredAt, acknowledged, metadata
    ` as RiskAlert[];

    return result[0] || null;

  } catch (error) {
    console.error('Error creating alert:', error);
    return null;
  }
}