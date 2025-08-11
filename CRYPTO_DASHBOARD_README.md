# Crypto Market Analytics Dashboard

Một hệ thống theo dõi thị trường tiền số toàn diện với phân tích AI và đề xuất giao dịch thông minh.

## 🚀 Tính Năng Chính

### 1. Multi-Layer Dashboard
- **On-chain Metrics**: MVRV, NUPL, SOPR, Active Addresses, Exchange Flows
- **Technical Indicators**: RSI, MA50/200, MACD, Bollinger Bands
- **Market Sentiment**: Fear & Greed Index, Social Sentiment, Google Trends
- **Derivatives Data**: Open Interest, Funding Rate, Liquidations, Put/Call Ratio

### 2. AI Analysis & Recommendations
- Phân tích thông minh dựa trên nhiều chỉ số
- Đề xuất mua/bán với độ tin cậy
- Giải thích chi tiết lý do đề xuất
- Hỗ trợ đa ngôn ngữ (Tiếng Việt)

### 3. Real-time Updates
- WebSocket connection cho cập nhật real-time
- Auto-refresh mỗi 30 giây
- Manual refresh khi cần
- Hiển thị trạng thái kết nối

### 4. Alert System
- Tạo cảnh báo tùy chỉnh cho các chỉ số
- Hỗ trợ nhiều loại điều kiện (>, <, >=, <=)
- Theo dõi nhiều metrics cùng lúc
- Thông báo real-time qua WebSocket

### 5. Responsive Design
- Mobile-friendly interface
- Dark theme ready
- Optimized for different screen sizes
- Fast loading with skeleton states

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Next.js 15** với App Router
- **TypeScript 5** cho type safety
- **Tailwind CSS 4** cho styling
- **shadcn/ui** components
- **Socket.io Client** cho real-time updates
- **Lucide React** icons

### Backend
- **Node.js** với Express
- **Prisma ORM** với SQLite
- **Socket.io** cho real-time communication
- **Z.AI Web SDK** cho AI analysis
- **RESTful API** design

### Data Sources
- **CoinGecko API** cho price data
- **Alternative.me** cho Fear & Greed Index
- **Mock data** cho on-chain metrics (sẽ thay bằng Glassnode/CryptoQuant trong production)
- **AI-powered analysis** với Z.AI

## 📊 Các Chỉ Số Theo Dõi

### On-chain Metrics (Ưu tiên cao)
1. **MVRV Ratio** - Market Value to Realized Value
   - Phát hiện vùng đỉnh/đáy
   - Định giá vĩ mô
   
2. **NUPL** - Net Unrealized Profit/Loss
   - Đo lường tâm lý cộng đồng
   - Xác định điểm capitulation & greed
   
3. **SOPR** - Spent Output Profit Ratio
   - Xác định hành vi chốt lãi/cắt lỗ
   - Nhận diện trend đảo chiều
   
4. **Active Addresses** - Địa chỉ hoạt động
   - Phản ánh sức sống mạng lưới
   - Đo mức độ thu hút người dùng
   
5. **Exchange Flows** - Dòng tiền lên/rút sàn
   - Áp lực cung-cầu ngắn hạn
   - Cảnh báo dump/pump lớn

### Technical Indicators (Ưu tiên trung bình-cao)
1. **RSI** - Relative Strength Index
   - Bắt điểm đảo chiều ngắn hạn
   
2. **MA50/200** - Moving Averages
   - Xác nhận xu hướng dài/trung hạn
   - Golden/Death Cross signals
   
3. **MACD** - Moving Average Convergence Divergence
   - Đo động lượng và xác nhận chuyển trend
   
4. **Bollinger Bands** - Dải bollinger
   - Đo biến động, cảnh báo breakout

### Market Sentiment (Ưu tiên cao)
1. **Fear & Greed Index** (0-100)
   - Đo tâm lý thị trường tổng hợp
   - Hỗ trợ quyết định "contrarian"
   
2. **Social Sentiment**
   - Cảnh báo cực trị trên mạng xã hội
   - Tránh FOMO/FUD
   
3. **Google Trends**
   - Volume tìm kiếm từ khóa
   - Đo lường quan tâm công chúng

### Derivatives Metrics (Ưu tiên cao)
1. **Funding Rate & Open Interest**
   - Dự báo biến động ngắn hạn
   - Cảnh báo rủi ro squeeze
   
2. **Liquidation Data**
   - Giá trị lệnh bị thanh lý
   - Market volatility indicator
   
3. **Put/Call Ratio**
   - Options market sentiment
   - Chỉ xem khi có cực trị

## 🎯 Quy Tắc Giao Dịch Đề Xuất

### Tín Hiệu MUA
- MVRV < 1 + Fear & Greed < 20 + Funding âm + SOPR gần 1
- RSI < 30 + Volume tăng + Active addresses tăng
- Extreme Fear zone + Golden Cross vừa xảy ra

### Tín Hiệu BÁN
- MVRV > 2 + Fear & Greed > 80 + Funding dương cao + RSI > 70
- Greed zone + Death Cross + Exchange inflow tăng vọt
- Overbought conditions + Profit taking behavior

### Tín Hiệu GIỮ
- MVRV/NUPL ổn định, volume on-chain tăng
- Không có extreme ở phái sinh/sentiment
- Sideways market với low volatility

## 🔧 Cài Đặt & Chạy

### Yêu cầu
- Node.js 18+
- npm hoặc yarn

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd crypto-dashboard

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
Tạo file `.env` với các biến:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📱 Hướng Dẫn Sử Dụng

### 1. Dashboard Overview
- **Header**: Chọn coin, trạng thái kết nối, nút refresh/alert
- **Main Metrics**: Price, Volume 24h, Market Cap, Fear & Greed
- **AI Recommendation**: Đề xuất mua/bán với confidence level
- **Detailed Tabs**: 4 tabs cho từng loại metrics

### 2. Tạo Alert
1. Click nút "Alert" ở header
2. Chọn metric muốn theo dõi
3. Chọn operator (>, <, >=, <=)
4. Nhập giá trị ngưỡng
5. Click "Create Alert"

### 3. Real-time Updates
- WebSocket tự động kết nối khi load trang
- Hiển thị trạng thái "Live" khi kết nối thành công
- Data tự động cập nhật mỗi 30 giây
- Có thể manual refresh bằng nút "Refresh"

### 4. Phân Tích AI
- AI tự động phân tích khi chọn coin
- Hiển thị signal (BUY/SELL/HOLD/STRONG_BUY/STRONG_SELL)
- Confidence level từ 0-100%
- Reasoning chi tiết bằng Tiếng Việt

## 🔒 Security Considerations

### API Security
- Rate limiting cho external API calls
- Input validation cho tất cả parameters
- Error handling không暴露 thông tin nhạy cảm
- CORS configuration

### Data Security
- Không lưu trữ sensitive data
- Encryption cho user data (nếu có authentication)
- Secure WebSocket connections
- Validation cho tất cả user inputs

### Performance Optimization
- Caching cho API responses
- Debounce cho user actions
- Lazy loading cho components
- Optimized database queries

## 🚀 Production Deployment

### Preparation
1. Replace mock data with real API keys
2. Setup proper database (PostgreSQL recommended)
3. Configure environment variables
4. Setup monitoring and logging
5. Implement proper error handling

### Deployment Steps
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Recommended Services
- **Database**: PostgreSQL hoặc MySQL
- **Caching**: Redis
- **Monitoring**: Datadog hoặc New Relic
- **Logging**: ELK stack hoặc similar
- **CDN**: Cloudflare hoặc AWS CloudFront

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request
5. Code review và merge

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create GitHub issue
- Check documentation
- Contact development team

---

**Note**: Đây là phiên bản demo với mock data. Trong production, cần tích hợp với real API services như Glassnode, CryptoQuant, CoinMarketCap Pro để có dữ liệu chính xác.