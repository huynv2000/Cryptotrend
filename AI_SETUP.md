# AI Integration Setup Guide

Hướng dẫn cấu hình tích hợp AI cho Crypto Analytics Dashboard

## 1. Z.AI Configuration

### Cách 1: Sử dụng file cấu hình (.z-ai-config)
Tạo file `.z-ai-config` trong root directory của project:

```json
{
  "baseUrl": "https://api.z-ai.dev",
  "apiKey": "your-z-ai-api-key-here",
  "chatId": "",
  "userId": ""
}
```

### Cách 2: Sử dụng Environment Variables
Thêm vào file `.env`:

```env
# Z.AI Configuration
ZAI_BASE_URL=https://api.z-ai.dev
ZAI_API_KEY=your-z-ai-api-key-here
ZAI_CHAT_ID=
ZAI_USER_ID=
```

## 2. OpenAI (ChatGPT) Configuration

### Environment Variables
Thêm vào file `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ORG_ID=your-openai-org-id-here  # Optional
```

### Lấy API Keys

#### Z.AI API Key
1. Liên hệ đội ngũ Z.AI để lấy API key
2. Hoặc sử dụng CLI tool: `z-ai-generate --help`

#### OpenAI API Key
1. Truy cập https://platform.openai.com/api-keys
2. Đăng nhập hoặc tạo tài khoản
3. Tạo mới API key
4. Copy API key vào file `.env`

## 3. Kiểm tra cấu hình

### Kiểm tra Z.AI
```bash
# Test Z.AI CLI
z-ai-generate --help

# Test Z.AI integration
curl -X GET "http://localhost:3000/api/ai-analysis?action=status"
```

### Kiểm tra OpenAI
```bash
# Test OpenAI integration
node -e "
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log('OpenAI client created successfully');
"
```

## 4. Testing AI Analysis

### Test với API
```bash
# Test AI analysis với Bitcoin
curl -X GET "http://localhost:3000/api/ai-analysis?action=analyze&coinId=bitcoin"

# Test với POST request
curl -X POST "http://localhost:3000/api/ai-analysis?action=analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "coinId": "bitcoin",
    "marketData": {
      "price": { "usd": 50000 },
      "onChain": { "mvrv": 1.5, "nupl": 0.6 },
      "technical": { "rsi": 55 }
    }
  }'
```

### Test trong Dashboard
1. Mở dashboard tại http://localhost:3000
2. Chọn một cryptocurrency (Bitcoin, Ethereum, etc.)
3. Click vào tab "AI Analysis"
4. Kiểm tra kết quả từ cả Z.AI và ChatGPT

## 5. Troubleshooting

### Z.AI Issues
- **Error**: "Configuration file not found"
  - **Solution**: Tạo file `.z-ai-config` hoặc sử dụng environment variables
  
- **Error**: "API request failed with status 401"
  - **Solution**: Kiểm tra API key và baseUrl trong configuration

### OpenAI Issues
- **Error**: "OPENAI_API_KEY is not configured"
  - **Solution**: Thêm `OPENAI_API_KEY` vào file `.env`
  
- **Error**: "Invalid API key"
  - **Solution**: Kiểm tra API key có hợp lệ không

### General Issues
- **Error**: "AI analysis timeout"
  - **Solution**: Kiểm tra kết nối internet và API key validity
  
- **Error**: "Failed to parse AI response"
  - **Solution**: Kiểm tra format response từ AI providers

## 6. Configuration Options

### AI Analysis Service Configuration
```javascript
const config = {
  providers: ['Z.AI', 'ChatGPT'],      // AI providers to use
  analysisTypes: ['comprehensive', 'breakout'],  // Types of analysis
  timeout: 30000,                      // 30 seconds timeout
  retryAttempts: 3                     // Number of retry attempts
};
```

### OpenAI Model Options
- `gpt-4o-mini` (default): Cost-effective, fast
- `gpt-4o`: Higher quality, more expensive
- `gpt-3.5-turbo`: Legacy model, cheapest

### Z.AI Options
- Base URL: `https://api.z-ai.dev`
- Custom chat ID cho conversation tracking
- Custom user ID cho user tracking

## 7. Security Notes

### API Key Security
- Không commit API keys vào version control
- Sử dụng environment variables cho production
- Rotate API keys định kỳ
- Giới hạn quyền của API keys

### Environment Variables Example
```env
# Development
OPENAI_API_KEY=sk-dev-...
ZAI_API_KEY=zai-dev-...

# Production
OPENAI_API_KEY=${OPENAI_API_KEY_PRODUCTION}
ZAI_API_KEY=${ZAI_API_KEY_PRODUCTION}
```

## 8. Monitoring

### Log Monitoring
Kiểm tra logs để theo dõi AI performance:
```bash
# View development logs
tail -f dev.log

# View server logs
tail -f server.log
```

### Performance Metrics
- Response time từ AI providers
- Success rate của AI analysis
- Error rates và types
- Cost tracking cho API usage

## 9. Cost Optimization

### OpenAI Cost Tips
- Sử dụng `gpt-4o-mini` cho development
- Cache responses khi có thể
- Giới hạn token count
- Monitor usage regularly

### Z.AI Cost Tips
- Sử dụng appropriate model sizes
- Batch requests khi có thể
- Monitor API usage
- Sử dụng caching cho repeated requests