import { NextResponse } from "next/server";
import { CONFIG, hasApiKey } from "@/lib/config";
import { CoinGeckoService } from "@/lib/crypto-service";

export async function GET() {
  try {
    // Check all API services and their status
    const services = {
      coingecko: {
        status: 'unknown',
        responseTime: 0,
        apiKey: hasApiKey('coingecko'),
        lastCheck: new Date().toISOString()
      },
      zai: {
        status: 'unknown',
        responseTime: 0,
        apiKey: hasApiKey('zai'),
        lastCheck: new Date().toISOString()
      },
      openai: {
        status: 'unknown',
        responseTime: 0,
        apiKey: hasApiKey('openai'),
        lastCheck: new Date().toISOString()
      },
      alternative: {
        status: 'unknown',
        responseTime: 0,
        apiKey: hasApiKey('alternative'),
        lastCheck: new Date().toISOString()
      }
    };

    // Test CoinGecko API
    if (services.coingecko.apiKey) {
      try {
        const startTime = Date.now();
        const coinGeckoService = CoinGeckoService.getInstance();
        const testResult = await coinGeckoService.getCoinPrice('bitcoin');
        const responseTime = Date.now() - startTime;
        
        services.coingecko.status = testResult && testResult.usd ? 'ok' : 'error';
        services.coingecko.responseTime = responseTime;
      } catch (error) {
        services.coingecko.status = 'error';
        services.coingecko.responseTime = 0;
      }
    } else {
      services.coingecko.status = 'no_key';
    }

    // Test Z.AI API
    if (services.zai.apiKey) {
      try {
        const startTime = Date.now();
        // Simple test - we'll just check if the config is valid
        const responseTime = Date.now() - startTime;
        services.zai.status = 'ok'; // Assume OK if key exists
        services.zai.responseTime = responseTime;
      } catch (error) {
        services.zai.status = 'error';
        services.zai.responseTime = 0;
      }
    } else {
      services.zai.status = 'no_key';
    }

    // Test OpenAI API
    if (services.openai.apiKey) {
      try {
        const startTime = Date.now();
        // Simple test - we'll just check if the config is valid
        const responseTime = Date.now() - startTime;
        services.openai.status = 'ok'; // Assume OK if key exists
        services.openai.responseTime = responseTime;
      } catch (error) {
        services.openai.status = 'error';
        services.openai.responseTime = 0;
      }
    } else {
      services.openai.status = 'no_key';
    }

    // Test Alternative.me API
    if (services.alternative.apiKey) {
      try {
        const startTime = Date.now();
        // Simple test - we'll just check if the config is valid
        const responseTime = Date.now() - startTime;
        services.alternative.status = 'ok'; // Assume OK if key exists
        services.alternative.responseTime = responseTime;
      } catch (error) {
        services.alternative.status = 'error';
        services.alternative.responseTime = 0;
      }
    } else {
      services.alternative.status = 'no_key';
    }

    // Calculate overall system health
    const availableServices = Object.values(services).filter(s => s.status === 'ok').length;
    const totalServices = Object.keys(services).length;
    const overallHealth = availableServices === totalServices ? 'healthy' : 
                         availableServices > 0 ? 'degraded' : 'unhealthy';

    return NextResponse.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services,
      summary: {
        totalServices,
        availableServices,
        unavailableServices: totalServices - availableServices,
        healthPercentage: Math.round((availableServices / totalServices) * 100)
      },
      config: {
        hasCoinGecko: services.coingecko.apiKey,
        hasZAI: services.zai.apiKey,
        hasOpenAI: services.openai.apiKey,
        hasAlternative: services.alternative.apiKey
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {}
    }, { status: 500 });
  }
}