# Crypto Analytics Dashboard Pro

## 🚀 Giới Thiệu

Nền tảng phân tích thị trường tiền điện tử chuyên nghiệp với AI-powered trading insights. Xây dựng trên Next.js 15, TypeScript và Prisma, cung cấp phân tích đa khung thời gian với các điểm vào/lệnh rõ ràng và quản lý rủi ro chuyên nghiệp.

## ✨ Tính Năng Nổi Bật

### 🤖 AI Analysis v2.0
- **47+ Market Indicators**: Phân tích kỹ thuật và on-chain toàn diện
- **Multi-Timeframe Analysis**: Dài hạn (6-12 tháng), trung hạn (1-3 tháng), ngắn hạn (1-4 tuần)
- **Professional Trading Signals**: Điểm vào/lệnh cụ thể, 3 mức chốt lời, quản lý rủi ro
- **Risk Management**: Tỷ lệ risk-reward, phân tích rủi ro, chiến lược giảm thiểu

### 📊 Real-time Dashboard
- **Market Metrics**: Giá hiện tại, volume, market cap, RSI
- **Technical Analysis**: MA, MACD, Bollinger Bands
- **On-chain Metrics**: MVRV, NUPL, SOPR, active addresses
- **Sentiment Analysis**: Fear & Greed Index, social sentiment
- **Derivatives Data**: Open interest, funding rates

### 🔧 Core Features
- **AI Provider Integration**: Z.AI + OpenAI với fallback system
- **WebSocket Support**: Real-time updates via Socket.io
- **Advanced Caching**: Tối ưu hóa API calls
- **Comprehensive Logging**: AI analysis tracking
- **Database Management**: SQLite + Prisma ORM

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript 5, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite, Prisma ORM
- **AI**: Z.AI SDK, OpenAI API
- **Real-time**: Socket.io
- **State**: Zustand, TanStack Query
- **Auth**: NextAuth.js v4

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd crypto-analytics-dashboard

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # UI Components
├── lib/                   # Core Services
├── hooks/                 # Custom Hooks
└── docs/                  # Documentation
```

## 🔑 Key APIs

```typescript
// Enhanced AI Analysis
POST /api/ai-analysis?action=analyze&analysisType=enhanced&coinId=bitcoin

// Dashboard Data
GET /api/dashboard?coinId=bitcoin

// Trading Signals
GET /api/trading-signals-fast?action=signal&coinId=bitcoin

// Market Alerts
GET /api/alerts-fast?action=process-data&coinId=bitcoin
```

## 📖 Documentation

- **Project Summary**: `docs/PROJECT_SUMMARY.md` - Tóm tắt chi tiết dự án
- **AI Prompts**: `docs/AI_Prompt_templates.md` - Templates phân tích AI
- **API Documentation**: Các file route.ts trong `src/app/api/`

## 🎯 Current Status

✅ **Completed**: Multi-timeframe AI analysis, Enhanced trading signals, Real-time dashboard, AI provider integration, WebSocket support  

🔄 **In Progress**: Advanced charting, Portfolio management, Mobile app  

📋 **Planned**: Backtesting engine, Social trading, Additional AI providers  

## 🔧 Development

```bash
# Linting
npm run lint

# Database management
npm run db:push
npm run db:studio

# Build
npm run build
```

## 📄 License

MIT License - see LICENSE file for details

---

**Developed with ❤️ by Crypto Analytics Team**