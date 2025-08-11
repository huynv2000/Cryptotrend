# 🪙 Coin Management Feature Documentation

## Overview

Coin Management Feature là một tính năng quan trọng cho phép người dùng quản lý động các đồng coin trong hệ thống phân tích crypto. Tính năng này cho phép thêm, xóa, kích hoạt/vô hiệu hóa coin và quản lý việc thu thập dữ liệu tự động.

## 🎯 Mục Tiêu Thiết Kế

### Core Objectives
- **Dynamic Coin Management**: Cho phép thêm/bớt coin linh hoạt thay vì hard-coded
- **Automated Data Collection**: Tự động thu thập dữ liệu cho coin mới
- **User-Friendly Interface**: Giao diện trực quan, dễ sử dụng
- **Robust Search**: Tìm kiếm coin hiệu quả từ nhiều nguồn
- **Scalability**: Hỗ trợ số lượng coin không giới hạn
- **Data Integrity**: Đảm bảo tính toàn vẹn dữ liệu khi thêm/xóa coin

### Technical Requirements
- **Search Integration**: Tích hợp với CoinGecko API để tìm kiếm coin
- **Fallback Mechanisms**: Xử lý khi API bị rate limit hoặc không available
- **Database Schema**: Schema hỗ trợ quản lý coin động
- **API Design**: RESTful API cho CRUD operations
- **Real-time Updates**: WebSocket updates cho trạng thái thu thập dữ liệu

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External APIs  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │AddCoinModal │ │    │ │  API Routes │ │    │ │CoinGecko API│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │CoinMgmtPanel│ │◄──►│ │CryptoService│ │◄──►│                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Dashboard  │ │    │ │   Database  │ │    │ │Fallback Data│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Action**: Người dùng mở coin management panel
2. **Search Request**: Gửi request tìm kiếm coin đến backend
3. **API Integration**: Backend tìm kiếm từ CoinGecko API + Database + Fallback
4. **Coin Selection**: Người dùng chọn coin từ kết quả tìm kiếm
5. **Validation**: Backend validate coin tồn tại trên CoinGecko
6. **Database Insert**: Thêm coin vào database với metadata
7. **Data Collection**: Trigger tự động thu thập dữ liệu cho coin mới
8. **UI Update**: Cập nhật UI để hiển thị coin mới trong dropdown

## 📊 Database Schema

### Cryptocurrency Table

```sql
CREATE TABLE cryptocurrencies (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  coinGeckoId TEXT NOT NULL UNIQUE,
  logo TEXT,
  rank INTEGER,
  isActive BOOLEAN DEFAULT true,
  isDefault BOOLEAN DEFAULT false,
  addedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Coin Data Collection Table

```sql
CREATE TABLE coin_data_collection (
  id TEXT PRIMARY KEY,
  cryptoId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  lastCollected DATETIME,
  nextCollection DATETIME,
  errorCount INTEGER DEFAULT 0,
  lastError TEXT,
  metadata TEXT,
  FOREIGN KEY (cryptoId) REFERENCES cryptocurrencies(id)
);
```

### Related Tables
- `price_history`: Lưu trữ lịch sử giá
- `on_chain_metrics`: Chỉ số on-chain
- `technical_indicators`: Chỉ báo kỹ thuật
- `derivative_metrics`: Dữ liệu phái sinh

## 🔧 API Endpoints

### GET /api/cryptocurrencies

**Purpose**: Lấy danh sách tất cả cryptocurrencies

**Parameters**:
- `search` (optional): Query string để tìm kiếm coin
- `activeOnly` (optional): Chỉ lấy coin active (true/false)

**Response**:
```json
[
  {
    "id": "cme34wxi00000tikcx8t2i2j4",
    "symbol": "ENA",
    "name": "Ethena",
    "coinGeckoId": "ethena",
    "logo": "https://coin-images.coingecko.com/coins/images/36530/large/ethena.png?1711701436",
    "rank": 41,
    "isActive": true,
    "isDefault": false,
    "addedBy": null,
    "createdAt": "2025-08-08T18:03:36.216Z",
    "updatedAt": "2025-08-08T18:03:36.216Z",
    "dataCollection": {
      "id": "collection_id",
      "status": "COMPLETED",
      "lastCollected": "2025-08-08T18:03:36.216Z",
      "nextCollection": "2025-08-08T19:03:36.216Z",
      "errorCount": 0,
      "lastError": null
    },
    "addedByUser": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    }
  }
]
```

### POST /api/cryptocurrencies

**Purpose**: Thêm coin mới vào hệ thống

**Request Body**:
```json
{
  "symbol": "ENA",
  "name": "Ethena",
  "coinGeckoId": "ethena",
  "userId": "optional_user_id"
}
```

**Response**:
```json
{
  "message": "Coin added successfully",
  "coin": {
    "id": "cme34wxi00000tikcx8t2i2j4",
    "symbol": "ENA",
    "name": "Ethena",
    "coinGeckoId": "ethena",
    "logo": "https://coin-images.coingecko.com/coins/images/36530/large/ethena.png?1711701436",
    "rank": 41,
    "isActive": true,
    "isDefault": false,
    "addedBy": null,
    "createdAt": "2025-08-08T18:03:36.216Z",
    "updatedAt": "2025-08-08T18:03:36.216Z"
  }
}
```

### PUT /api/cryptocurrencies/[id]

**Purpose**: Cập nhật thông tin coin (isActive status)

**Request Body**:
```json
{
  "isActive": true
}
```

### DELETE /api/cryptocurrencies/[id]

**Purpose**: Xóa coin khỏi hệ thống

**Response**:
```json
{
  "message": "Coin deleted successfully"
}
```

### POST /api/cryptocurrencies/[id]/collect-data

**Purpose**: Trigger thủ công việc thu thập dữ liệu

**Response**:
```json
{
  "message": "Data collection triggered successfully"
}
```

## 🎨 Frontend Components

### AddCoinModal Component

**File**: `src/components/AddCoinModal.tsx`

**Purpose**: Modal để tìm kiếm và thêm coin mới

**Features**:
- Real-time search với debouncing
- Hiển thị kết quả tìm kiếm với logo, rank, symbol
- Custom symbol và name editing
- Validation trước khi thêm
- Loading states và error handling

**Props**:
```typescript
interface AddCoinModalProps {
  isOpen: boolean
  onClose: () => void
  onCoinAdded: (coin: any) => void
  userId?: string
}
```

### CoinManagementPanel Component

**File**: `src/components/CoinManagementPanel.tsx`

**Purpose**: Panel quản lý tất cả coins trong hệ thống

**Features**:
- Table view với đầy đủ thông tin coin
- Toggle active/inactive status
- Manual data collection trigger
- Delete coin functionality
- Statistics dashboard
- Real-time status updates

**Props**:
```typescript
interface CoinManagementPanelProps {
  userId?: string
}
```

## 🔍 Search Algorithm

### Multi-Layer Search Strategy

```typescript
async function searchCoins(query: string): Promise<CoinSearchResponse[]> {
  try {
    // Layer 1: Search in top 100 coins by market cap
    const markets = await cryptoService.getCoinMarkets('usd', 'market_cap_desc', 100, 1)
    const filtered = markets.filter(coin => 
      coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
      coin.name.toLowerCase().includes(query.toLowerCase())
    )
    
    if (filtered.length > 0) {
      return filtered.slice(0, 10)
    }
    
    // Layer 2: CoinGecko Search API
    const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`)
    const searchData = await searchResponse.json()
    
    if (searchData.coins?.length > 0) {
      // Get detailed info for search results
      const coinIds = searchData.coins.slice(0, 10).map(coin => coin.id)
      const detailsPromises = coinIds.map(id => 
        cryptoService.getCoinDetails(id).catch(() => null)
      )
      const detailsResults = await Promise.all(detailsPromises)
      
      return detailsResults
        .filter(detail => detail !== null)
        .map(coin => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image?.large || coin.image?.small,
          market_cap_rank: coin.market_cap_rank
        }))
    }
    
    // Layer 3: Database search + popular coins fallback
    // ... fallback logic
  } catch (error) {
    // Final fallback
  }
}
```

### Search Optimization

1. **Debouncing**: 300ms delay để tránh quá nhiều API calls
2. **Minimum Length**: Yêu cầu ít nhất 2 ký tự để search
3. **Rate Limiting**: Xử lý CoinGecko API rate limits
4. **Caching**: Cache kết quả search cho common queries
5. **Fallback**: Multiple fallback layers khi API fails

## 📈 Data Collection Process

### Automated Collection Flow

```typescript
async function triggerDataCollection(cryptoId: string) {
  try {
    // 1. Update status to COLLECTING
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'COLLECTING',
        lastCollected: new Date()
      }
    })
    
    // 2. Get cryptocurrency details
    const crypto = await db.cryptocurrency.findUnique({
      where: { id: cryptoId }
    })
    
    // 3. Collect all data in parallel
    const completeData = await cryptoService.getCompleteCryptoData(crypto.coinGeckoId)
    
    // 4. Save to respective tables
    await Promise.all([
      savePriceHistory(cryptoId, completeData.price),
      saveOnChainMetrics(cryptoId, completeData.onChain),
      saveTechnicalIndicators(cryptoId, completeData.technical),
      saveDerivativeMetrics(cryptoId, completeData.derivatives)
    ])
    
    // 5. Update status to COMPLETED
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'COMPLETED',
        lastCollected: new Date(),
        nextCollection: new Date(Date.now() + 60 * 60 * 1000),
        errorCount: 0,
        lastError: null
      }
    })
    
  } catch (error) {
    // Handle errors and update status to FAILED
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'FAILED',
        lastError: error.message,
        errorCount: { increment: 1 }
      }
    })
  }
}
```

### Collection Schedule

- **Initial Collection**: 5 minutes sau khi thêm coin
- **Regular Collection**: Mỗi 1 giờ
- **Retry Logic**: Exponential backoff cho failed collections
- **Manual Trigger**: Có thể trigger thủ công qua UI

## 🛡️ Error Handling & Validation

### Input Validation

```typescript
// Symbol validation
const symbolRegex = /^[A-Z0-9]{1,20}$/
if (!symbolRegex.test(symbol)) {
  throw new Error('Symbol must be 1-20 alphanumeric characters')
}

// Name validation
if (name.length < 2 || name.length > 100) {
  throw new Error('Name must be between 2 and 100 characters')
}

// CoinGecko ID validation
if (!coinGeckoId || coinGeckoId.length < 1) {
  throw new Error('CoinGecko ID is required')
}
```

### Duplicate Detection

```typescript
const existingCoin = await db.cryptocurrency.findFirst({
  where: {
    OR: [
      { symbol: symbol.toUpperCase() },
      { coinGeckoId: coinGeckoId.toLowerCase() }
    ]
  }
})

if (existingCoin) {
  throw new Error('Coin already exists in the system')
}
```

### API Error Handling

```typescript
// CoinGecko validation with fallback
let coinDetails
try {
  coinDetails = await cryptoService.getCoinDetails(coinGeckoId.toLowerCase())
} catch (error) {
  console.warn('CoinGecko validation failed, using fallback data:', error)
  coinDetails = {
    image: { large: null, small: null },
    market_cap_rank: null
  }
}
```

## 🎯 Use Cases

### 1. Adding a New Coin

**User Story**: Là một trader, tôi muốn thêm đồng coin mới vào hệ thống để phân tích

**Steps**:
1. Click "Thêm Coin Mới" button trên homepage hoặc trong Coin Management Panel
2. Nhập tên hoặc symbol coin vào search box
3. Chọn coin từ kết quả tìm kiếm
4. (Optional) Edit symbol hoặc name nếu cần
5. Click "Thêm Coin" button
6. System validates và thêm coin vào database
7. Auto-trigger data collection
8. Coin xuất hiện trong dropdown selector

### 2. Managing Existing Coins

**User Story**: Là một admin, tôi muốn quản lý các coin trong hệ thống

**Steps**:
1. Mở Coin Management Panel
2. Xem danh sách tất cả coins với status
3. Toggle active/inactive status
4. Trigger manual data collection
5. Xóa coin không cần thiết
6. Monitor data collection status

### 3. Search and Discovery

**User Story**: Là một user, tôi muốn tìm kiếm coin để thêm vào hệ thống

**Search Scenarios**:
- **By Symbol**: "BTC", "ETH", "ENA"
- **By Name**: "Bitcoin", "Ethereum", "Ethena"
- **By ID**: "bitcoin", "ethereum", "ethena"
- **Partial Match**: "bit", "eth", "ena"

## 📊 Performance Considerations

### API Optimization

1. **Rate Limiting**: Handle CoinGecko 10 requests/minute limit
2. **Caching**: Cache search results và market data
3. **Batching**: Batch multiple coin details requests
4. **Timeouts**: Proper timeout handling for external APIs

### Database Optimization

1. **Indexing**: Proper indexes on symbol, coinGeckoId, isActive
2. **Queries**: Optimized queries với proper selects
3. **Connections**: Connection pooling cho database
4. **Transactions**: Proper transaction management

### Frontend Optimization

1. **Debouncing**: Debounce search inputs
2. **Virtualization**: Virtual scrolling cho long lists
3. **Memoization**: Memoize expensive calculations
4. **Lazy Loading**: Lazy load components và data

## 🔧 Testing Strategy

### Unit Tests

```typescript
// Search function tests
describe('searchCoins', () => {
  it('should return results for valid query', async () => {
    const results = await searchCoins('bitcoin')
    expect(results).toHaveLengthGreaterThan(0)
    expect(results[0].id).toBe('bitcoin')
  })
  
  it('should handle API failures gracefully', async () => {
    // Mock API failure
    const results = await searchCoins('invalidcoin')
    expect(results).toBeInstanceOf(Array)
  })
})

// Validation tests
describe('coinValidation', () => {
  it('should validate symbol format', () => {
    expect(validateSymbol('BTC')).toBe(true)
    expect(validateSymbol('btc123')).toBe(true)
    expect(validateSymbol('btc@')).toBe(false)
  })
})
```

### Integration Tests

```typescript
// Full coin addition flow
describe('Coin Addition Flow', () => {
  it('should add coin and trigger data collection', async () => {
    // 1. Search for coin
    const searchResults = await searchCoins('ethena')
    expect(searchResults.length).toBeGreaterThan(0)
    
    // 2. Add coin
    const newCoin = await addCoin({
      symbol: 'ENA',
      name: 'Ethena',
      coinGeckoId: 'ethena'
    })
    
    // 3. Verify coin exists
    const coin = await getCoin(newCoin.id)
    expect(coin).toBeDefined()
    
    // 4. Verify data collection triggered
    const collection = await getDataCollection(newCoin.id)
    expect(collection.status).toBe('COLLECTING')
  })
})
```

### E2E Tests

```typescript
// UI flow tests
describe('Coin Management UI', () => {
  it('should allow user to add coin through UI', async () => {
    await page.goto('/coin-management')
    
    // Click add coin button
    await page.click('[data-testid="add-coin-btn"]')
    
    // Search for coin
    await page.fill('[data-testid="search-input"]', 'ena')
    await page.waitForSelector('[data-testid="search-result"]')
    
    // Select coin
    await page.click('[data-testid="search-result"]:first-child')
    
    // Add coin
    await page.click('[data-testid="add-coin-confirm"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

## 🚀 Deployment Considerations

### Environment Variables

```env
# CoinGecko API
COINGECKO_API_BASE_URL=https://api.coingecko.com/api/v3
COINGECKO_RATE_LIMIT_DELAY=6000
COINGECKO_MAX_REQUESTS_PER_MINUTE=10

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_db

# Search Configuration
SEARCH_CACHE_TTL=300000
SEARCH_MIN_LENGTH=2
SEARCH_MAX_RESULTS=10

# Data Collection
COLLECTION_INITIAL_DELAY=300000
COLLECTION_INTERVAL=3600000
COLLECTION_MAX_RETRIES=3
```

### Monitoring

1. **API Monitoring**: Track CoinGecko API success/failure rates
2. **Database Monitoring**: Monitor query performance and connection health
3. **Error Tracking**: Track errors in search and data collection
4. **Performance Metrics**: Monitor search latency and collection times

### Scaling Considerations

1. **Horizontal Scaling**: Multiple instances for API handling
2. **Database Scaling**: Read replicas for better performance
3. **Cache Layer**: Redis for caching search results
4. **Queue System**: Background jobs for data collection

## 📈 Future Enhancements

### Short Term

1. **Batch Operations**: Add/remove multiple coins at once
2. **Import/Export**: CSV import/export for coin lists
3. **Categories**: Group coins by category (DeFi, NFT, Gaming, etc.)
4. **Watchlists**: User-specific coin watchlists

### Long Term

1. **Auto-Discovery**: Automatically discover trending coins
2. **Social Integration**: Social sentiment for coin discovery
3. **Advanced Filtering**: Filter by market cap, volume, etc.
4. **Analytics**: Coin performance analytics and comparisons

### API Integrations

1. **CoinMarketCap**: Additional data source
2. **Glassnode**: Real on-chain data
3. **CryptoQuant**: Advanced metrics
4. **LunarCrush**: Social metrics

## 🐛 Troubleshooting

### Common Issues

#### 1. Search Returns No Results

**Symptoms**: Search query returns empty array

**Causes**:
- CoinGecko API rate limit reached
- Coin doesn't exist on CoinGecko
- Network connectivity issues

**Solutions**:
- Check API rate limit status
- Verify coin exists on CoinGecko
- Check network connectivity
- Use fallback coins list

#### 2. Data Collection Fails

**Symptoms**: Collection status stays at FAILED

**Causes**:
- Invalid CoinGecko ID
- API rate limits
- Database connection issues

**Solutions**:
- Verify CoinGecko ID is correct
- Check rate limit status
- Review database logs
- Manual retry collection

#### 3. Coin Not in Dropdown

**Symptoms**: Added coin doesn't appear in selector

**Causes**:
- Coin not set to active
- Data collection not completed
- UI cache not updated

**Solutions**:
- Check coin isActive status
- Verify data collection completed
- Refresh page or clear cache

### Debug Commands

```bash
# Check database for coins
curl -s "http://localhost:3000/api/cryptocurrencies" | jq '.[] | {symbol, name, isActive}'

# Test search functionality
curl -s "http://localhost:3000/api/cryptocurrencies?search=ena" | jq '.[] | {id, symbol, name}'

# Check data collection status
curl -s "http://localhost:3000/api/cryptocurrencies" | jq '.[] | {symbol, dataCollection: {status, lastCollected}}'

# Trigger manual data collection
curl -s -X POST "http://localhost:3000/api/cryptocurrencies/[id]/collect-data"
```

## 📝 Conclusion

Coin Management Feature cung cấp một giải pháp hoàn chỉnh để quản lý động các đồng coin trong hệ thống phân tích crypto. Với kiến trúc modular, error handling robust, và user interface intuitive, tính năng này cho phép hệ thống mở rộng linh hoạt để hỗ trợ vô số đồng coin khác nhau.

### Key Benefits

- **Scalability**: Hỗ trợ unlimited coins
- **User-Friendly**: Interface trực quan, dễ sử dụng
- **Robust**: Multiple fallback layers và error handling
- **Automated**: Tự động thu thập dữ liệu cho coin mới
- **Flexible**: Tích hợp với nhiều data sources

### Best Practices

1. **Always validate** coin existence before adding
2. **Monitor API rate limits** và implement proper backoff
3. **Use fallback mechanisms** khi external APIs fail
4. **Implement proper caching** cho better performance
5. **Monitor data collection** status và handle failures

### Next Steps

1. **Implement batch operations** cho better UX
2. **Add more data sources** cho comprehensive coverage
3. **Implement user watchlists** cho personalization
4. **Add analytics dashboard** cho coin performance
5. **Optimize search performance** với better indexing

---

Built with ❤️ for the crypto community. Supercharged by Z.ai 🚀