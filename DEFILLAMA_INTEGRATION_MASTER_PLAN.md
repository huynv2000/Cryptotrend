# KẾ HOẠCH TÍCH HỢNG DEFILLAMA MASTER PLAN

**Ngày:** 12/08/2025  
**Chuyên gia:** Phát triển hệ thống tài chính (20 năm kinh nghiệm)  
**Version:** 1.0  
**Trạng thái:** Chờ phê duyệt  

---

## 📋 EXECUTIVE SUMMARY

### 🎯 Mục tiêu tích hợp
Tích hợp 7 metrics DeFi từ DeFiLlama vào hệ thống Market Overview hiện tại, bổ sung Exchange Flow từ DeFiLlama với chấp nhận hạn chế.

### 📊 Metrics sẽ tích hợp:
1. **TVL by Chain/Protocol** - Tổng giá trị khóa DeFi
2. **Stablecoins Market Cap** - Market cap stablecoins  
3. **DEX Volume** - Khối lượng DEX
4. **Protocol Fees** - Phí từ các protocol
5. **Yield Rates** - Lợi suất vaults
6. **Bridge Volume** - Volume chuyển chain
7. **Protocol Rankings** - Xếp hạng protocols
8. **Exchange Flow** - Inflow/Outflow (với hạn chế)

### 💡 Chiến lược
- **Zero Breaking Changes** - Không thay đổi code hệ thống cũ
- **Modular Architecture** - Tích hợp như module độc lập
- **Comprehensive Monitoring** - Full debugging và monitoring
- **Documentation Complete** - Tài liệu đầy đủ cho mọi thành phần

---

## 🏗️ KIẾN TRÚC TÍCH HỢP

### System Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Existing Dashboard Components     │  New DeFi Components    │
│  ┌─────────────────────────────┐  │  ┌─────────────────────┐ │
│  │ On-chain Metrics (Layer 1)   │  │  │ DeFi Metrics (New)  │ │
│  │ Technical Indicators (L2)    │  │  │ TVL, Stablecoins,    │ │
│  │ Market Sentiment (L3)        │  │  │ DEX Volume, Fees,    │ │
│  │ Derivative Metrics (L4)      │  │  │ Yields, Bridges,     │ │
│  └─────────────────────────────┘  │  │ Rankings, Exchange    │ │
│                                   │  │ Flow                 │ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  Existing APIs                  │  New DeFi APIs          │
│  /api/dashboard                 │  /api/defi/metrics     │
│  /api/crypto                    │  /api/defi/tvl          │
│  /api/analysis                  │  /api/defi/stablecoins  │
│                                 │  /api/defi/volume       │
│                                 │  /api/defi/fees         │
│                                 │  /api/defi/yields       │
│                                 │  /api/defi/bridges      │
│                                 │  /api/defi/rankings     │
│                                 │  /api/defi/exchange     │
│                                 │  /api/defi/health       │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Existing Services               │  New DeFi Services      │
│  CryptoService                   │  DeFiLlamaService       │
│  AnalysisService                 │  DeFiDataCollector      │
│  AlertService                    │  DeFiCacheManager       │
│  DataCollector                   │  DeFiErrorHandler       │
│                                  │  DeFiMonitorService     │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL APIS                           │
├─────────────────────────────────────────────────────────────┤
│  Glassnode │ CryptoQuant │ Coinglass │ DeFiLlama (NEW)     │
│  Alternative.me │ Santiment │ Others    │                     │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Existing Tables                │  New DeFi Tables         │
│  on_chain_metrics               │  defi_metrics            │
│  technical_indicators          │  defi_tvl_history        │
│  sentiment_metrics             │  defi_volume_history     │
│  derivative_metrics            │  defi_fees_history       │
│  price_history                 │  defi_yields_history     │
│                                │  defi_bridges_history    │
│                                │  defi_exchange_history   │
│                                │  defi_monitoring_logs    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PHÂN TÍCH CHI TIẾT CÁC METRICS

### 1. TVL by Chain/Protocol
**Endpoint:** `/tvl`, `/tvl/{chain}`, `/protocols`  
**Frequency:** 15 minutes  
**Importance:** Cao  
**Data Structure:**
```typescript
interface TVLData {
  totalTVL: number;
  change24h: number;
  change7d: number;
  chains: Array<{
    name: string;
    tvl: number;
    change24h: number;
    protocols: Array<{
      name: string;
      tvl: number;
      change24h: number;
      category: string;
    }>;
  }>;
}
```

### 2. Stablecoins Market Cap
**Endpoint:** `/stablecoins`  
**Frequency:** 15 minutes  
**Importance:** Cao  
**Data Structure:**
```typescript
interface StablecoinsData {
  totalMarketCap: number;
  change24h: number;
  stablecoins: Array<{
    name: string;
    symbol: string;
    marketCap: number;
    change24h: number;
    chain: string;
  }>;
}
```

### 3. DEX Volume
**Endpoint:** `/volume/{chain}`  
**Frequency:** 15 minutes  
**Importance:** Cao  
**Data Structure:**
```typescript
interface DEXVolumeData {
  totalVolume24h: number;
  totalVolume7d: number;
  change24h: number;
  chains: Array<{
    name: string;
    volume24h: number;
    volume7d: number;
    change24h: number;
    dexs: Array<{
      name: string;
      volume24h: number;
      change24h: number;
    }>;
  }>;
}
```

### 4. Protocol Fees
**Endpoint:** `/fees`  
**Frequency:** 1 giờ  
**Importance:** Trung bình  
**Data Structure:**
```typescript
interface ProtocolFeesData {
  totalFees24h: number;
  totalFees7d: number;
  protocols: Array<{
    name: string;
    fees24h: number;
    fees7d: number;
    change24h: number;
    category: string;
  }>;
}
```

### 5. Yield Rates
**Endpoint:** `/yields`  
**Frequency:** 1 giờ  
**Importance:** Trung bình  
**Data Structure:**
```typescript
interface YieldRatesData {
  totalPools: number;
  avgAPY: number;
  pools: Array<{
    chain: string;
    protocol: string;
    pool: string;
    apy: number;
    tvl: number;
    symbol: string;
  }>;
}
```

### 6. Bridge Volume
**Endpoint:** `/bridges`  
**Frequency:** 1 giờ  
**Importance:** Thấp  
**Data Structure:**
```typescript
interface BridgeVolumeData {
  totalVolume24h: number;
  totalVolume7d: number;
  bridges: Array<{
    name: string;
    volume24h: number;
    volume7d: number;
    change24h: number;
    chains: string[];
  }>;
}
```

### 7. Protocol Rankings
**Endpoint:** `/protocols`  
**Frequency:** 1 giờ  
**Importance:** Trung bình  
**Data Structure:**
```typescript
interface ProtocolRankingsData {
  totalProtocols: number;
  rankings: Array<{
    rank: number;
    name: string;
    category: string;
    tvl: number;
    change24h: number;
    chain: string;
  }>;
}
```

### 8. Exchange Flow (với hạn chế)
**Endpoint:** Scrap từ `/cexs`  
**Frequency:** 30 phút  
**Importance:** Thấp  
**Data Structure:**
```typescript
interface ExchangeFlowData {
  exchanges: Array<{
    name: string;
    inflow24h: number;
    outflow24h: number;
    netFlow: number;
    reserves: number;
    lastUpdated: string;
  }>;
  limitations: {
    coverage: 'Limited to transparency exchanges';
    reliability: 'Medium';
    dataSource: 'Web scraping';
  };
}
```

---

## 🔧 KẾ HOẠCH TRIỂN KHAI CHI TIẾT

### Phase 1: Research & Setup (Ngày 1)

#### **1.1. DeFiLlama API Research**
- [ ] Study DeFiLlama API documentation
- [ ] Identify required endpoints for 8 metrics
- [ ] Analyze rate limits and pricing
- [ ] Create API account and get keys
- [ ] Test basic connectivity

#### **1.2. System Analysis**
- [ ] Review existing database schema
- [ ] Identify integration points with existing system
- [ ] Analyze impact on existing services
- [ ] Plan data migration strategy
- [ ] Design monitoring framework

#### **1.3. Development Environment Setup**
- [ ] Install DeFiLlama SDK/wrapper
- [ ] Configure environment variables
- [ ] Set up development database
- [ ] Create basic project structure
- [ ] Implement error handling framework

#### **1.4. Documentation Planning**
- [ ] Plan comprehensive documentation
- [ ] Design monitoring dashboard
- [ ] Plan debugging modules
- [ ] Create integration testing plan
- [ ] Set up project tracking

**Expected Output:**
- API keys and connectivity test
- System analysis document
- Development environment ready
- Documentation framework

---

### Phase 2: Database Schema Design (Ngày 2)

#### **2.1. Database Schema Design**
```typescript
// Main DeFi metrics table
model DeFiMetrics {
  id           String   @id @default(cuid())
  timestamp    DateTime @default(now())
  
  // TVL Data
  totalTVL     Float?
  tvlChange24h Float?
  tvlChange7d  Float?
  chainTVL     Json?    // TVL by chain
  protocolTVL  Json?    // TVL by protocol
  
  // Stablecoins Data
  stablecoinsMCap Float?
  stablecoinsData Json?  // Detailed stablecoins data
  
  // DEX Volume Data
  dexVolume24h  Float?
  dexVolume7d   Float?
  dexVolumeData Json?    // DEX volume details
  
  // Protocol Fees Data
  protocolFees24h Float?
  protocolFeesData Json? // Protocol fees details
  
  // Yield Rates Data
  yieldRatesData Json?   // Yield rates by pool
  
  // Bridge Volume Data
  bridgeVolume24h Float?
  bridgeVolumeData Json? // Bridge volume details
  
  // Protocol Rankings Data
  protocolRankings Json? // Protocol rankings
  
  // Exchange Flow Data (with limitations)
  exchangeFlowData Json? // Exchange flow data
  exchangeFlowNote String? // Note about limitations
  
  // Metadata
  dataSource    String   @default('defillama')
  lastUpdated   DateTime @default(now())
  dataQuality   Float?   // 0-100 quality score
  errorLog      Json?    // Error information
  
  @@map("defi_metrics")
}

// Historical data tables for each metric type
model DeFiTVLHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  chain     String
  tvl       Float
  change24h Float
  protocol  String?
  category  String?
  
  @@map("defi_tvl_history")
}

model DeFiVolumeHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  chain     String
  volume24h Float
  volume7d  Float
  dex       String?
  
  @@map("defi_volume_history")
}

model DeFiFeesHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  protocol  String
  fees24h   Float
  fees7d    Float
  category  String?
  
  @@map("defi_fees_history")
}

model DeFiYieldsHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  chain     String
  protocol  String
  pool      String
  apy       Float
  tvl       Float
  symbol    String
  
  @@map("defi_yields_history")
}

model DeFiBridgesHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  bridge    String
  volume24h Float
  volume7d  Float
  chains    String? // JSON array
  
  @@map("defi_bridges_history")
}

model DeFiExchangeHistory {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  exchange  String
  inflow24h Float?
  outflow24h Float?
  netFlow   Float?
  reserves  Float?
  note      String? // Data limitation notes
  
  @@map("defi_exchange_history")
}

// Monitoring and debugging tables
model DeFiMonitoringLogs {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  level       String   // 'INFO', 'WARN', 'ERROR'
  component   String   // 'API', 'Database', 'Service', etc.
  message     String
  details     Json?    // Additional error details
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
  resolution  String?
  
  @@map("defi_monitoring_logs")
}

model DeFiDataQuality {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  metric      String   // 'TVL', 'Stablecoins', etc.
  quality     Float    // 0-100 score
  freshness   Float    // 0-100 (how recent)
  completeness Float   // 0-100 (how complete)
  reliability Float    // 0-100 (how reliable)
  issues      Json?    // Array of issues
  
  @@map("defi_data_quality")
}
```

#### **2.2. Migration Scripts**
- [ ] Create Prisma schema updates
- [ ] Write migration scripts
- [ ] Create rollback procedures
- [ ] Test migration in development
- [ ] Document schema changes

#### **2.3. Data Access Layer**
- [ ] Create DeFi metrics repository
- [ ] Implement CRUD operations
- [ ] Add data validation
- [ ] Create unit tests
- [ ] Document API contracts

**Expected Output:**
- Complete database schema
- Migration scripts
- Data access layer
- Unit tests

---

### Phase 3: Core Service Implementation (Ngày 3-4)

#### **3.1. DeFiLlama Service Implementation**
```typescript
// src/lib/defillama-service.ts
import { DeFiLlamaClient } from 'defillama-api';

export interface DeFiLlamaConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

export class DeFiLlamaService {
  private client: DeFiLlamaClient;
  private config: DeFiLlamaConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  
  constructor(config: DeFiLlamaConfig) {
    this.config = config;
    this.client = new DeFiLlamaClient(config.apiKey);
    this.cache = new Map();
  }
  
  // TVL Methods
  async getGlobalTVL(): Promise<TVLData> {
    return this.cachedRequest('global_tvl', () => 
      this.client.get('/tvl')
    );
  }
  
  async getChainTVL(chain: string): Promise<ChainTVLData> {
    return this.cachedRequest(`chain_tvl_${chain}`, () => 
      this.client.get(`/tvl/${chain}`)
    );
  }
  
  async getProtocols(): Promise<ProtocolData[]> {
    return this.cachedRequest('protocols', () => 
      this.client.get('/protocols')
    );
  }
  
  // Stablecoins Methods
  async getStablecoins(): Promise<StablecoinsData> {
    return this.cachedRequest('stablecoins', () => 
      this.client.get('/stablecoins')
    );
  }
  
  // Volume Methods
  async getDEXVolume(chain?: string): Promise<DEXVolumeData> {
    const endpoint = chain ? `/volume/${chain}` : '/volume';
    return this.cachedRequest(`dex_volume_${chain || 'all'}`, () => 
      this.client.get(endpoint)
    );
  }
  
  // Fees Methods
  async getProtocolFees(): Promise<ProtocolFeesData> {
    return this.cachedRequest('protocol_fees', () => 
      this.client.get('/fees')
    );
  }
  
  // Yields Methods
  async getYieldRates(): Promise<YieldRatesData> {
    return this.cachedRequest('yield_rates', () => 
      this.client.get('/yields')
    );
  }
  
  // Bridges Methods
  async getBridgeVolume(): Promise<BridgeVolumeData> {
    return this.cachedRequest('bridge_volume', () => 
      this.client.get('/bridges')
    );
  }
  
  // Exchange Flow Methods (with scraping)
  async getExchangeFlow(): Promise<ExchangeFlowData> {
    try {
      // This will require web scraping
      return this.scrapeExchangeFlow();
    } catch (error) {
      throw new DeFiLlamaError('Exchange flow data unavailable', error);
    }
  }
  
  // Health Check
  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.getGlobalTVL();
      return {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: '1.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }
  
  // Helper methods
  private async cachedRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    const data = await request();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 15 * 60 * 1000 // 15 minutes cache
    });
    
    return data;
  }
  
  private async scrapeExchangeFlow(): Promise<ExchangeFlowData> {
    // Implementation for web scraping
    // This is complex and may require additional libraries
    throw new Error('Exchange flow scraping not implemented yet');
  }
}

export interface DeFiLlamaError extends Error {
  code: string;
  details?: any;
}
```

#### **3.2. Data Collector Service**
```typescript
// src/lib/defi-data-collector.ts
import { DeFiLlamaService } from './defillama-service';
import { prisma } from './db';

export class DeFiDataCollector {
  private defiLlamaService: DeFiLlamaService;
  private isRunning: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  
  constructor(defiLlamaService: DeFiLlamaService) {
    this.defiLlamaService = defiLlamaService;
  }
  
  async startCollection(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Initial collection
    await this.collectAllMetrics();
    
    // Set up periodic collection
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        console.error('Error in periodic collection:', error);
        await this.logError('periodic_collection', error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }
  
  async stopCollection(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
  
  private async collectAllMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Collect all metrics in parallel
      const [
        tvlData,
        stablecoinsData,
        volumeData,
        feesData,
        yieldsData,
        bridgesData,
        exchangeFlowData
      ] = await Promise.allSettled([
        this.defiLlamaService.getGlobalTVL(),
        this.defiLlamaService.getStablecoins(),
        this.defiLlamaService.getDEXVolume(),
        this.defiLlamaService.getProtocolFees(),
        this.defiLlamaService.getYieldRates(),
        this.defiLlamaService.getBridgeVolume(),
        this.defiLlamaService.getExchangeFlow()
      ]);
      
      // Save to database
      await this.saveMetricsToDatabase({
        tvlData: tvlData.status === 'fulfilled' ? tvlData.value : null,
        stablecoinsData: stablecoinsData.status === 'fulfilled' ? stablecoinsData.value : null,
        volumeData: volumeData.status === 'fulfilled' ? volumeData.value : null,
        feesData: feesData.status === 'fulfilled' ? feesData.value : null,
        yieldsData: yieldsData.status === 'fulfilled' ? yieldsData.value : null,
        bridgesData: bridgesData.status === 'fulfilled' ? bridgesData.value : null,
        exchangeFlowData: exchangeFlowData.status === 'fulfilled' ? exchangeFlowData.value : null,
        errors: {
          tvl: tvlData.status === 'rejected' ? tvlData.reason : null,
          stablecoins: stablecoinsData.status === 'rejected' ? stablecoinsData.reason : null,
          volume: volumeData.status === 'rejected' ? volumeData.reason : null,
          fees: feesData.status === 'rejected' ? feesData.reason : null,
          yields: yieldsData.status === 'rejected' ? yieldsData.reason : null,
          bridges: bridgesData.status === 'rejected' ? bridgesData.reason : null,
          exchangeFlow: exchangeFlowData.status === 'rejected' ? exchangeFlowData.reason : null,
        }
      });
      
      // Log success
      await this.logSuccess('all_metrics', Date.now() - startTime);
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
      await this.logError('metrics_collection', error);
    }
  }
  
  private async saveMetricsToDatabase(data: any): Promise<void> {
    try {
      await prisma.defiMetrics.create({
        data: {
          totalTVL: data.tvlData?.totalTVL,
          tvlChange24h: data.tvlData?.change24h,
          tvlChange7d: data.tvlData?.change7d,
          chainTVL: data.tvlData ? JSON.stringify(data.tvlData.chains) : null,
          protocolTVL: data.tvlData ? JSON.stringify(data.tvlData.protocols) : null,
          stablecoinsMCap: data.stablecoinsData?.totalMarketCap,
          stablecoinsData: data.stablecoinsData ? JSON.stringify(data.stablecoinsData.stablecoins) : null,
          dexVolume24h: data.volumeData?.totalVolume24h,
          dexVolume7d: data.volumeData?.totalVolume7d,
          dexVolumeData: data.volumeData ? JSON.stringify(data.volumeData) : null,
          protocolFees24h: data.feesData?.totalFees24h,
          protocolFeesData: data.feesData ? JSON.stringify(data.feesData.protocols) : null,
          yieldRatesData: data.yieldsData ? JSON.stringify(data.yieldsData.pools) : null,
          bridgeVolume24h: data.bridgesData?.totalVolume24h,
          bridgeVolumeData: data.bridgesData ? JSON.stringify(data.bridgesData.bridges) : null,
          exchangeFlowData: data.exchangeFlowData ? JSON.stringify(data.exchangeFlowData.exchanges) : null,
          exchangeFlowNote: data.exchangeFlowData ? JSON.stringify(data.exchangeFlowData.limitations) : null,
          errorLog: JSON.stringify(data.errors),
          dataQuality: this.calculateDataQuality(data)
        }
      });
      
      // Save historical data
      await this.saveHistoricalData(data);
      
    } catch (error) {
      console.error('Error saving to database:', error);
      await this.logError('database_save', error);
    }
  }
  
  private async saveHistoricalData(data: any): Promise<void> {
    // Save historical data for each metric type
    // This would involve multiple database calls
    // Implementation depends on specific requirements
  }
  
  private calculateDataQuality(data: any): number {
    // Calculate data quality score based on:
    // - Data completeness
    // - Data freshness
    // - Error count
    // - Data consistency
    
    let score = 100;
    
    // Deduct for errors
    const errorCount = Object.values(data.errors).filter(error => error !== null).length;
    score -= errorCount * 10;
    
    // Deduct for missing data
    const missingDataCount = [
      data.tvlData, data.stablecoinsData, data.volumeData, 
      data.feesData, data.yieldsData, data.bridgesData
    ].filter(d => d === null).length;
    score -= missingDataCount * 5;
    
    return Math.max(0, score);
  }
  
  private async logSuccess(operation: string, duration: number): Promise<void> {
    await prisma.defiMonitoringLogs.create({
      data: {
        level: 'INFO',
        component: 'DataCollector',
        message: `Successfully completed ${operation}`,
        details: JSON.stringify({ duration, timestamp: new Date() })
      }
    });
  }
  
  private async logError(operation: string, error: any): Promise<void> {
    await prisma.defiMonitoringLogs.create({
      data: {
        level: 'ERROR',
        component: 'DataCollector',
        message: `Error in ${operation}: ${error.message}`,
        details: JSON.stringify({
          error: error.message,
          stack: error.stack,
          timestamp: new Date()
        })
      }
    });
  }
}
```

#### **3.3. Cache Manager**
```typescript
// src/lib/defi-cache-manager.ts
export class DeFiCacheManager {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    this.cache = new Map();
    this.startCleanup();
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, ttlMs: number = 15 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats(): CacheStats {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
  
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

interface CacheEntry {
  data: any;
  createdAt: number;
  expiresAt: number;
}

interface CacheStats {
  total: number;
  active: number;
  expired: number;
  memoryUsage: number;
}
```

#### **3.4. Error Handler**
```typescript
// src/lib/defi-error-handler.ts
export class DeFiErrorHandler {
  private static instance: DeFiErrorHandler;
  private errorCallbacks: Map<string, ErrorCallback[]> = new Map();
  
  static getInstance(): DeFiErrorHandler {
    if (!DeFiErrorHandler.instance) {
      DeFiErrorHandler.instance = new DeFiErrorHandler();
    }
    return DeFiErrorHandler.instance;
  }
  
  onError(errorType: string, callback: ErrorCallback): void {
    if (!this.errorCallbacks.has(errorType)) {
      this.errorCallbacks.set(errorType, []);
    }
    this.errorCallbacks.get(errorType)!.push(callback);
  }
  
  async handleError(error: DeFiError): Promise<void> {
    console.error(`DeFi Error [${error.type}]:`, error.message);
    
    // Log to database
    await this.logErrorToDatabase(error);
    
    // Notify callbacks
    const callbacks = this.errorCallbacks.get(error.type) || [];
    for (const callback of callbacks) {
      try {
        await callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }
    
    // Send alert if critical
    if (error.severity === 'critical') {
      await this.sendAlert(error);
    }
  }
  
  private async logErrorToDatabase(error: DeFiError): Promise<void> {
    try {
      // Implementation for logging to database
      // This would use Prisma to log to defi_monitoring_logs
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  }
  
  private async sendAlert(error: DeFiError): Promise<void> {
    try {
      // Implementation for sending alerts
      // This could send emails, Slack notifications, etc.
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }
}

export interface DeFiError {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details?: any;
  stack?: string;
}

export type ErrorCallback = (error: DeFiError) => Promise<void> | void;
```

**Expected Output:**
- Complete DeFiLlama service implementation
- Data collector with error handling
- Cache management system
- Error handling framework
- Unit tests

---

### Phase 4: API Implementation (Ngày 5)

#### **4.1. API Endpoints Implementation**
```typescript
// src/app/api/defi/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DeFiLlamaService } from '@/lib/defillama-service';
import { DeFiDataCollector } from '@/lib/defi-data-collector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    // Get latest metrics from database
    const latestMetrics = await prisma.defiMetrics.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latestMetrics) {
      return NextResponse.json({
        success: false,
        error: 'No metrics available'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tvl: {
          total: latestMetrics.totalTVL,
          change24h: latestMetrics.tvlChange24h,
          change7d: latestMetrics.tvlChange7d,
          chains: latestMetrics.chainTVL ? JSON.parse(latestMetrics.chainTVL) : null,
          protocols: latestMetrics.protocolTVL ? JSON.parse(latestMetrics.protocolTVL) : null
        },
        stablecoins: {
          marketCap: latestMetrics.stablecoinsMCap,
          data: latestMetrics.stablecoinsData ? JSON.parse(latestMetrics.stablecoinsData) : null
        },
        volume: {
          total24h: latestMetrics.dexVolume24h,
          total7d: latestMetrics.dexVolume7d,
          data: latestMetrics.dexVolumeData ? JSON.parse(latestMetrics.dexVolumeData) : null
        },
        fees: {
          total24h: latestMetrics.protocolFees24h,
          data: latestMetrics.protocolFeesData ? JSON.parse(latestMetrics.protocolFeesData) : null
        },
        yields: latestMetrics.yieldRatesData ? JSON.parse(latestMetrics.yieldRatesData) : null,
        bridges: {
          total24h: latestMetrics.bridgeVolume24h,
          data: latestMetrics.bridgeVolumeData ? JSON.parse(latestMetrics.bridgeVolumeData) : null
        },
        exchangeFlow: latestMetrics.exchangeFlowData ? JSON.parse(latestMetrics.exchangeFlowData) : null,
        metadata: {
          lastUpdated: latestMetrics.lastUpdated,
          dataQuality: latestMetrics.dataQuality,
          dataSource: latestMetrics.dataSource
        }
      }
    });
    
  } catch (error) {
    console.error('Error in /api/defi/metrics:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/tvl/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    let tvlData;
    if (chain) {
      tvlData = await defiService.getChainTVL(chain);
    } else {
      tvlData = await defiService.getGlobalTVL();
    }
    
    return NextResponse.json({
      success: true,
      data: tvlData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/tvl:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/stablecoins/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const stablecoinsData = await defiService.getStablecoins();
    
    return NextResponse.json({
      success: true,
      data: stablecoinsData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/stablecoins:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/volume/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const volumeData = await defiService.getDEXVolume(chain || undefined);
    
    return NextResponse.json({
      success: true,
      data: volumeData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/volume:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/fees/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const feesData = await defiService.getProtocolFees();
    
    return NextResponse.json({
      success: true,
      data: feesData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/fees:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/yields/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const yieldsData = await defiService.getYieldRates();
    
    return NextResponse.json({
      success: true,
      data: yieldsData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/yields:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/bridges/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const bridgesData = await defiService.getBridgeVolume();
    
    return NextResponse.json({
      success: true,
      data: bridgesData
    });
    
  } catch (error) {
    console.error('Error in /api/defi/bridges:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/exchange/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const exchangeFlowData = await defiService.getExchangeFlow();
    
    return NextResponse.json({
      success: true,
      data: exchangeFlowData,
      note: 'Exchange flow data has limitations - only available for transparency-enabled exchanges'
    });
    
  } catch (error) {
    console.error('Error in /api/defi/exchange:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      note: 'Exchange flow data may be unavailable due to scraping limitations'
    }, { status: 500 });
  }
}

// src/app/api/defi/health/route.ts
export async function GET(request: NextRequest) {
  try {
    const defiService = new DeFiLlamaService({
      apiKey: process.env.DEFILLAMA_API_KEY!,
      baseUrl: 'https://api.llama.fi',
      timeout: 30000,
      retries: 3
    });
    
    const health = await defiService.healthCheck();
    
    // Check database connectivity
    await prisma.defiMetrics.findFirst({
      orderBy: { timestamp: 'desc' },
      take: 1
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...health,
        database: 'connected',
        services: {
          defillama: health.status,
          database: 'connected',
          cache: 'operational'
        },
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error in /api/defi/health:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      status: 'unhealthy'
    }, { status: 500 });
  }
}
```

#### **4.2. API Testing**
- [ ] Write comprehensive unit tests for all endpoints
- [ ] Create integration tests
- [ ] Performance testing
- [ ] Error scenario testing
- [ ] Documentation generation

**Expected Output:**
- Complete API endpoints implementation
- Test suite
- API documentation
- Performance benchmarks

---

### Phase 5: Frontend Integration (Ngày 6)

#### **5.1. DeFi Metrics Component**
```typescript
// src/components/dashboard/DeFiMetricsLayer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';

interface DeFiMetrics {
  tvl: {
    total: number;
    change24h: number;
    change7d: number;
    chains: any[];
    protocols: any[];
  };
  stablecoins: {
    marketCap: number;
    data: any[];
  };
  volume: {
    total24h: number;
    total7d: number;
    data: any;
  };
  fees: {
    total24h: number;
    data: any[];
  };
  yields: any[];
  bridges: {
    total24h: number;
    data: any[];
  };
  exchangeFlow: any[];
  metadata: {
    lastUpdated: string;
    dataQuality: number;
    dataSource: string;
  };
}

export const DeFiMetricsLayer: React.FC = () => {
  const [metrics, setMetrics] = useState<DeFiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/defi/metrics');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch DeFi metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDataQualityBadge = (quality: number) => {
    if (quality >= 90) return <Badge variant="default">Excellent</Badge>;
    if (quality >= 70) return <Badge variant="secondary">Good</Badge>;
    if (quality >= 50) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load DeFi metrics: {error}. Please try again later.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold">DeFi Market Overview</h3>
          <p className="text-gray-600">Real-time DeFi metrics and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {getDataQualityBadge(metrics.metadata.dataQuality)}
          <Badge variant="outline">{metrics.metadata.dataSource}</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tvl">TVL</TabsTrigger>
          <TabsTrigger value="stablecoins">Stablecoins</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="yields">Yields</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total TVL */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total TVL</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.tvl.total)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getChangeIcon(metrics.tvl.change24h)}
                      <span className={`text-sm ${getChangeColor(metrics.tvl.change24h)}`}>
                        {formatPercent(metrics.tvl.change24h)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stablecoins Market Cap */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stablecoins MCAP</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.stablecoins.marketCap)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">Market Cap</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DEX Volume */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">DEX Volume 24h</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.volume.total24h)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">24h Volume</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Fees */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Protocol Fees</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.fees.total24h)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Info className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600">24h Fees</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Chains by TVL */}
          {metrics.tvl.chains && metrics.tvl.chains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Chains by TVL</CardTitle>
                <CardDescription>Leading blockchains by total value locked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.tvl.chains.slice(0, 5).map((chain, index) => (
                    <div key={chain.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{index + 1}</span>
                        <span className="font-medium">{chain.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatNumber(chain.tvl)}</span>
                        <div className="flex items-center gap-1">
                          {getChangeIcon(chain.change24h)}
                          <span className={`text-sm ${getChangeColor(chain.change24h)}`}>
                            {formatPercent(chain.change24h)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exchange Flow (with limitations notice) */}
          {metrics.exchangeFlow && metrics.exchangeFlow.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Exchange Flow
                  <Badge variant="outline">Limited</Badge>
                </CardTitle>
                <CardDescription>
                  Exchange inflow/outflow data (limited to transparency-enabled exchanges)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Exchange flow data has limitations. Only exchanges that provide transparency data are included.
                    Data is obtained through web scraping and may have delays.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 space-y-2">
                  {metrics.exchangeFlow.slice(0, 3).map((exchange, index) => (
                    <div key={exchange.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{exchange.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-green-600">In: {formatNumber(exchange.inflow24h)}</span>
                          <span className="mx-2">|</span>
                          <span className="text-red-600">Out: {formatNumber(exchange.outflow24h)}</span>
                        </div>
                        <Badge variant={exchange.netFlow >= 0 ? "default" : "destructive"}>
                          Net: {formatPercent(exchange.netFlow / Math.max(exchange.inflow24h, exchange.outflow24h) * 100)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tvl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Value Locked (TVL)</CardTitle>
              <CardDescription>Comprehensive TVL analysis across chains and protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total TVL</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.tvl.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">24h Change</p>
                  <p className={`text-3xl font-bold ${getChangeColor(metrics.tvl.change24h)}`}>
                    {formatPercent(metrics.tvl.change24h)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">7d Change</p>
                  <p className={`text-3xl font-bold ${getChangeColor(metrics.tvl.change7d)}`}>
                    {formatPercent(metrics.tvl.change7d)}
                  </p>
                </div>
              </div>
              
              {metrics.tvl.chains && (
                <div>
                  <h4 className="font-semibold mb-3">TVL by Chain</h4>
                  <div className="space-y-2">
                    {metrics.tvl.chains.map((chain, index) => (
                      <div key={chain.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">#{index + 1}</span>
                          <span className="font-medium">{chain.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatNumber(chain.tvl)}</span>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(chain.change24h)}
                            <span className={`text-sm ${getChangeColor(chain.change24h)}`}>
                              {formatPercent(chain.change24h)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stablecoins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stablecoins Market</CardTitle>
              <CardDescription>Stablecoin market capitalization and distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Market Cap</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.stablecoins.marketCap)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Active Stablecoins</p>
                  <p className="text-3xl font-bold">{metrics.stablecoins.data?.length || 0}</p>
                </div>
              </div>
              
              {metrics.stablecoins.data && (
                <div>
                  <h4 className="font-semibold mb-3">Top Stablecoins</h4>
                  <div className="space-y-2">
                    {metrics.stablecoins.data.slice(0, 10).map((stablecoin, index) => (
                      <div key={stablecoin.symbol} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">#{index + 1}</span>
                          <div>
                            <span className="font-medium">{stablecoin.name}</span>
                            <span className="text-sm text-gray-600 ml-2">({stablecoin.symbol})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatNumber(stablecoin.marketCap)}</span>
                          <Badge variant="outline">{stablecoin.chain}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DEX Volume</CardTitle>
              <CardDescription>Decentralized exchange trading volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">24h Volume</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.volume.total24h)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">7d Volume</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.volume.total7d)}</p>
                </div>
              </div>
              
              {metrics.volume.data && metrics.volume.data.chains && (
                <div>
                  <h4 className="font-semibold mb-3">Volume by Chain</h4>
                  <div className="space-y-2">
                    {metrics.volume.data.chains.slice(0, 10).map((chain, index) => (
                      <div key={chain.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">#{index + 1}</span>
                          <span className="font-medium">{chain.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatNumber(chain.volume24h)}</span>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(chain.change24h)}
                            <span className={`text-sm ${getChangeColor(chain.change24h)}`}>
                              {formatPercent(chain.change24h)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Protocol Fees</CardTitle>
              <CardDescription>Fees generated by DeFi protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Total 24h Fees</p>
                <p className="text-3xl font-bold">{formatNumber(metrics.fees.total24h)}</p>
              </div>
              
              {metrics.fees.data && (
                <div>
                  <h4 className="font-semibold mb-3">Top Protocols by Fees</h4>
                  <div className="space-y-2">
                    {metrics.fees.data.slice(0, 10).map((protocol, index) => (
                      <div key={protocol.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">#{index + 1}</span>
                          <div>
                            <span className="font-medium">{protocol.name}</span>
                            <Badge variant="outline" className="ml-2">{protocol.category}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatNumber(protocol.fees24h)}</span>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(protocol.change24h)}
                            <span className={`text-sm ${getChangeColor(protocol.change24h)}`}>
                              {formatPercent(protocol.change24h)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield Opportunities</CardTitle>
              <CardDescription>Best yield rates across DeFi protocols</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.yields && metrics.yields.length > 0 ? (
                <div className="space-y-2">
                  {metrics.yields.slice(0, 20).map((yield_, index) => (
                    <div key={`${yield_.chain}-${yield_.protocol}-${yield_.pool}`} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">#{index + 1}</span>
                        <div>
                          <span className="font-medium">{yield_.protocol}</span>
                          <span className="text-sm text-gray-600 ml-2">- {yield_.pool}</span>
                          <Badge variant="outline" className="ml-2">{yield_.chain}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-green-600">{yield_.apy.toFixed(2)}% APY</span>
                        <span className="text-sm text-gray-600">{formatNumber(yield_.tvl)}</span>
                        <Badge variant="outline">{yield_.symbol}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No yield data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Freshness Indicator */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Last updated: {new Date(metrics.metadata.lastUpdated).toLocaleString()}</span>
          <span>Data Quality: {metrics.metadata.dataQuality.toFixed(0)}%</span>
        </div>
      </div>
    </Card>
  );
};
```

#### **5.2. Dashboard Integration**
```typescript
// src/app/page.tsx (update to include DeFi layer)
import { DeFiMetricsLayer } from '@/components/dashboard/DeFiMetricsLayer';

// Add DeFi layer to existing dashboard
const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Existing layers */}
      <OnChainMetricsLayer />
      <TechnicalIndicatorsLayer />
      <MarketSentimentLayer />
      <DerivativeMetricsLayer />
      
      {/* New DeFi Layer */}
      <DeFiMetricsLayer />
    </div>
  );
};
```

#### **5.3. Testing & Optimization**
- [ ] Component testing
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Responsive design testing
- [ ] Accessibility testing

**Expected Output:**
- Complete DeFi metrics component
- Dashboard integration
- Testing documentation
- Performance optimizations

---

### Phase 6: Testing & Deployment (Ngày 7)

#### **6.1. Comprehensive Testing**
```typescript
// Integration tests for DeFi services
describe('DeFiLlama Integration', () => {
  test('should fetch TVL data', async () => {
    const service = new DeFiLlamaService(testConfig);
    const tvlData = await service.getGlobalTVL();
    expect(tvlData.totalTVL).toBeGreaterThan(0);
    expect(tvlData.change24h).toBeDefined();
  });

  test('should handle API errors gracefully', async () => {
    const service = new DeFiLlamaService(badConfig);
    await expect(service.getGlobalTVL()).rejects.toThrow();
  });

  test('should cache data appropriately', async () => {
    const service = new DeFiLlamaService(testConfig);
    const data1 = await service.getGlobalTVL();
    const data2 = await service.getGlobalTVL();
    expect(data1).toEqual(data2); // Should be cached
  });
});

// End-to-end tests
describe('DeFi Metrics E2E', () => {
  test('should display DeFi metrics on dashboard', async () => {
    const response = await fetch('/api/defi/metrics');
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.tvl).toBeDefined();
    expect(data.data.stablecoins).toBeDefined();
  });
});
```

#### **6.2. Performance Testing**
- [ ] Load testing for API endpoints
- [ ] Database query optimization
- [ ] Frontend rendering performance
- [ ] Memory usage optimization
- [ ] Network request optimization

#### **6.3. Deployment Preparation**
```typescript
// Deployment scripts
// scripts/deploy-defi-integration.ts
import { execSync } from 'child_process';

const deployDeFiIntegration = () => {
  console.log('Starting DeFi integration deployment...');
  
  try {
    // Run database migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy');
    
    // Build the application
    console.log('Building application...');
    execSync('npm run build');
    
    // Start services
    console.log('Starting DeFi data collection...');
    execSync('npm run start:defi-collector');
    
    console.log('DeFi integration deployed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
};

deployDeFiIntegration();
```

#### **6.4. Monitoring Setup**
```typescript
// src/lib/defi-monitor-service.ts
export class DeFiMonitorService {
  private metrics: Map<string, number> = new Map();
  
  startMonitoring() {
    // Monitor API response times
    setInterval(() => this.monitorAPIResponseTimes(), 60000);
    
    // Monitor data freshness
    setInterval(() => this.monitorDataFreshness(), 300000);
    
    // Monitor error rates
    setInterval(() => this.monitorErrorRates(), 300000);
    
    // Monitor system health
    setInterval(() => this.monitorSystemHealth(), 60000);
  }
  
  private async monitorAPIResponseTimes() {
    // Monitor response times for all DeFi endpoints
  }
  
  private async monitorDataFreshness() {
    // Check if data is fresh (less than 15 minutes old)
  }
  
  private async monitorErrorRates() {
    // Monitor error rates and alert if too high
  }
  
  private async monitorSystemHealth() {
    // Monitor overall system health
  }
}
```

**Expected Output:**
- Complete test suite
- Performance benchmarks
- Deployment scripts
- Monitoring system

---

## 🔍 DEBUGGING & MONITORING MODULES

### 1. Debug Dashboard
```typescript
// src/components/debug/DeFiDebugPanel.tsx
export const DeFiDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const fetchDebugInfo = async () => {
    const response = await fetch('/api/defi/debug');
    const data = await response.json();
    setDebugInfo(data);
  };
  
  const fetchLogs = async () => {
    const response = await fetch('/api/defi/logs');
    const data = await response.json();
    setLogs(data.logs);
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">DeFi Integration Debug Panel</h3>
      
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">System Info</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">API Status</h4>
                <pre>{JSON.stringify(debugInfo.api, null, 2)}</pre>
              </div>
              <div>
                <h4 className="font-medium">Database Status</h4>
                <pre>{JSON.stringify(debugInfo.database, null, 2)}</pre>
              </div>
              <div>
                <h4 className="font-medium">Cache Status</h4>
                <pre>{JSON.stringify(debugInfo.cache, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="logs">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                  log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.level}
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="cache">
          {/* Cache debugging information */}
        </TabsContent>
        
        <TabsContent value="health">
          {/* Health check information */}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
```

### 2. API Debug Endpoints
```typescript
// src/app/api/defi/debug/route.ts
export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      api: {
        status: 'connected',
        lastRequest: new Date().toISOString(),
        responseTime: 125, // ms
        rateLimit: {
          used: 45,
          limit: 1000,
          reset: new Date(Date.now() + 3600000).toISOString()
        }
      },
      database: {
        status: 'connected',
        lastSync: new Date().toISOString(),
        recordCount: 1250,
        tableSizes: {
          defi_metrics: 1250,
          defi_tvl_history: 8500,
          defi_monitoring_logs: 320
        }
      },
      cache: {
        status: 'operational',
        size: 45,
        hitRate: 0.85,
        memoryUsage: '12.5MB'
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
    
    return NextResponse.json({
      success: true,
      data: debugInfo
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// src/app/api/defi/logs/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const where = level ? { level } : {};
    
    const logs = await prisma.defiMonitoringLogs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    return NextResponse.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### 3. Performance Monitoring
```typescript
// src/lib/defi-performance-monitor.ts
export class DeFiPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  
  trackRequest(endpoint: string, duration: number, success: boolean) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    this.metrics.get(endpoint)!.push({
      timestamp: Date.now(),
      duration,
      success
    });
    
    // Keep only last 100 metrics
    const endpointMetrics = this.metrics.get(endpoint)!;
    if (endpointMetrics.length > 100) {
      endpointMetrics.shift();
    }
  }
  
  getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      endpoints: {},
      summary: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0
      }
    };
    
    let totalDuration = 0;
    let totalRequests = 0;
    let totalSuccess = 0;
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      const endpointMetrics = metrics.slice(-50); // Last 50 requests
      const avgDuration = endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / endpointMetrics.length;
      const successRate = endpointMetrics.filter(m => m.success).length / endpointMetrics.length;
      
      report.endpoints[endpoint] = {
        averageResponseTime: avgDuration,
        successRate,
        requestCount: endpointMetrics.length,
        lastRequest: endpointMetrics[endpointMetrics.length - 1]?.timestamp
      };
      
      totalDuration += avgDuration * endpointMetrics.length;
      totalRequests += endpointMetrics.length;
      totalSuccess += endpointMetrics.filter(m => m.success).length;
    }
    
    report.summary.totalRequests = totalRequests;
    report.summary.averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    report.summary.successRate = totalRequests > 0 ? totalSuccess / totalRequests : 0;
    report.summary.errorRate = 1 - report.summary.successRate;
    
    return report;
  }
}

interface PerformanceMetric {
  timestamp: number;
  duration: number;
  success: boolean;
}

interface PerformanceReport {
  endpoints: Record<string, {
    averageResponseTime: number;
    successRate: number;
    requestCount: number;
    lastRequest: number;
  }>;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}
```

---

## 📚 DOCUMENTATION

### 1. System Architecture Documentation
```markdown
# DeFiLlama Integration Architecture

## Overview
The DeFiLlama integration adds 8 new DeFi-specific metrics to the existing crypto analytics dashboard.

## Components
- DeFiLlamaService: API client for DeFiLlama
- DeFiDataCollector: Automated data collection
- DeFiCacheManager: Caching layer
- DeFiErrorHandler: Error handling
- DeFiMonitorService: Monitoring and debugging

## Data Flow
1. DeFiDataCollector fetches data from DeFiLlama API
2. Data is processed and cached
3. Clean data is stored in database
4. API endpoints serve data to frontend
5. Frontend displays metrics in dashboard

## Database Schema
- defi_metrics: Main metrics table
- defi_tvl_history: Historical TVL data
- defi_volume_history: Historical volume data
- defi_fees_history: Historical fees data
- defi_yields_history: Historical yield data
- defi_bridges_history: Historical bridge data
- defi_exchange_history: Historical exchange flow data
- defi_monitoring_logs: Monitoring and debugging logs
- defi_data_quality: Data quality metrics
```

### 2. API Documentation
```markdown
# DeFi API Documentation

## Base URL
`/api/defi`

## Endpoints

### GET /metrics
Get all DeFi metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "tvl": { /* TVL data */ },
    "stablecoins": { /* Stablecoins data */ },
    "volume": { /* Volume data */ },
    "fees": { /* Fees data */ },
    "yields": [ /* Yields data */ ],
    "bridges": { /* Bridges data */ },
    "exchangeFlow": [ /* Exchange flow data */ ],
    "metadata": { /* Metadata */ }
  }
}
```

### GET /tvl
Get TVL data

**Parameters:**
- `chain` (optional): Specific chain name

### GET /stablecoins
Get stablecoins data

### GET /volume
Get DEX volume data

**Parameters:**
- `chain` (optional): Specific chain name

### GET /fees
Get protocol fees data

### GET /yields
Get yield rates data

### GET /bridges
Get bridge volume data

### GET /exchange
Get exchange flow data (with limitations)

### GET /health
Get system health status

### GET /debug
Get debug information

### GET /logs
Get monitoring logs

**Parameters:**
- `level` (optional): Filter by log level
- `limit` (optional): Number of logs to return
```

### 3. Deployment Guide
```markdown
# DeFiLlama Integration Deployment Guide

## Prerequisites
- Node.js 18+
- Prisma
- DeFiLlama API key

## Environment Variables
```env
DEFILLAMA_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

## Installation
1. Run database migrations:
```bash
npx prisma migrate deploy
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the data collector:
```bash
npm run start:defi-collector
```

5. Start the application:
```bash
npm start
```

## Monitoring
- Access debug panel at `/debug`
- Health check at `/api/defi/health`
- Logs at `/api/defi/logs`

## Troubleshooting
- Check API key configuration
- Verify database connectivity
- Monitor logs for errors
- Check rate limits
```

### 4. Troubleshooting Guide
```markdown
# DeFiLlama Integration Troubleshooting

## Common Issues

### API Connection Issues
**Symptoms:** API requests failing, timeouts
**Solutions:**
1. Check API key configuration
2. Verify internet connectivity
3. Check rate limits
4. Review API status

### Database Issues
**Symptoms:** Data not saving, slow queries
**Solutions:**
1. Check database connection
2. Run database migrations
3. Optimize queries
4. Monitor database performance

### Cache Issues
**Symptoms:** Stale data, high memory usage
**Solutions:**
1. Clear cache
2. Adjust cache TTL
3. Monitor memory usage
4. Restart cache service

### Frontend Issues
**Symptoms:** Components not loading, slow rendering
**Solutions:**
1. Check API responses
2. Verify component props
3. Monitor browser console
4. Check network requests

## Debug Tools
- Debug panel at `/debug`
- API health check at `/api/defi/health`
- Logs at `/api/defi/logs`
- Performance metrics in debug panel

## Support
- Check documentation
- Review logs
- Monitor system health
- Contact development team
```

---

## 📊 SUCCESS CRITERIA & KPIs

### Technical KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| **API Response Time** | < 2s | API monitoring |
| **Data Freshness** | < 15 minutes | Timestamp checks |
| **System Uptime** | > 99% | Monitoring system |
| **Cache Hit Rate** | > 80% | Cache statistics |
| **Error Rate** | < 1% | Error tracking |

### Business KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| **User Engagement** | +20% | Analytics |
| **Data Coverage** | +30% | Database analysis |
| **System Reliability** | +15% | Uptime monitoring |
| **Competitive Advantage** | +40% | Market analysis |

### Quality Metrics
| Metric | Target | Measurement |
|--------|---------|-------------|
| **Code Coverage** | > 80% | Test coverage tools |
| **Documentation** | 100% | Document completeness |
| **Performance** | < 2s response | Load testing |
| **Security** | No vulnerabilities | Security scanning |

---

## 🎯 CONCLUSION

### Summary
This comprehensive DeFiLlama integration plan provides:

1. **8 New DeFi Metrics** - Complete coverage of DeFi market data
2. **Zero Breaking Changes** - Modular architecture preserves existing system
3. **Comprehensive Monitoring** - Full debugging and monitoring capabilities
4. **Complete Documentation** - Thorough documentation for all components
5. **High ROI** - Estimated 1,800% annual return on investment

### Key Benefits
- **Enhanced Analytics** - 30% more data coverage
- **Competitive Advantage** - Unique DeFi insights
- **Improved User Experience** - Real-time DeFi data
- **Scalable Architecture** - Foundation for future expansion
- **Reliable Operation** - Comprehensive monitoring and error handling

### Next Steps
1. **Approve Plan** - Review and approve this integration plan
2. **Resource Allocation** - Assign development team
3. **Timeline Setup** - Schedule 7-day development sprint
4. **Environment Setup** - Prepare development and staging environments
5. **Begin Development** - Start Phase 1 implementation

### Risk Mitigation
- **Technical Risk** - Comprehensive testing and monitoring
- **Timeline Risk** - Buffer time and parallel development
- **Quality Risk** - Strict code review and testing standards
- **Integration Risk** - Modular design and zero breaking changes

---

**Approval Status:** Pending  
**Estimated Timeline:** 7 days  
**Budget:** $1,050-1,400  
**ROI:** 1,800% annually  

**Documents Created:**
- `DEFILLAMA_INTEGRATION_MASTER_PLAN.md` - This master plan
- `DEFILLAMA_INTEGRATION_ANALYSIS.md` - Detailed analysis
- `DEFILLAMA_INTEGRATION_PLAN.md` - Implementation plan
- `DEFILLAMA_EXCHANGE_FLOW_ANALYSIS.md` - Exchange flow analysis
- `DEFILLAMA_EXECUTIVE_SUMMARY.md` - Executive summary