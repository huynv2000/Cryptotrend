# Hướng dẫn giám sát hệ thống và logs

## Tổng quan

Tài liệu này hướng dẫn cách giám sát hệ thống Crypto Analytics Dashboard, đọc và hiểu logs, và khắc phục các sự cố thường gặp.

## Cấu trúc hệ thống

### Các thành phần chính
1. **Next.js Server** - Máy chủ web chính (Port 3000)
2. **Data Collector** - Thu thập dữ liệu tự động
3. **Database (SQLite)** - Lưu trữ dữ liệu
4. **API Endpoints** - Các dịch vụ API
5. **Socket.IO** - Kết nối real-time

### File logs quan trọng
- `dev.log` - Logs phát triển (real-time)
- `server.log` - Logs production (khi chạy `npm start`)
- Console output - Logs trực tiếp từ terminal

## Giám sát hệ thống

### 1. Kiểm tra trạng thái hệ thống qua Dashboard

Mở Debug tab trên dashboard để xem:
- **Trạng thái API**: Kiểm tra các API endpoints quan trọng
- **System Health**: Tổng quan sức khỏe hệ thống
- **Data Collector Stats**: Thống kê thu thập dữ liệu
- **Memory Usage**: Sử dụng bộ nhớ
- **Uptime**: Thời gian hoạt động

### 2. Kiểm tra logs real-time

#### Phát triển
```bash
# Xem logs real-time
tail -f dev.log

# Hoặc chạy dev server để xem logs trực tiếp
npm run dev
```

#### Production
```bash
# Xem logs production
tail -f server.log

# Hoặc nếu chạy với systemd
journalctl -u crypto-dashboard -f
```

### 3. Kiểm tra Data Collector

#### Kiểm tra trạng thái
```bash
# Kiểm tra process có đang chạy
ps aux | grep -E "(node|tsx)" | grep -v grep

# Kiểm tra port có đang lắng nghe
netstat -tlnp | grep :3000
```

#### Kiểm tra logs Data Collector
```bash
# Tìm kiếm logs liên quan đến data collection
grep -i "data collector\|collection\|collecting" dev.log

# Tìm kiếm lỗi
grep -i "error\|failed\|exception" dev.log
```

## Hiểu các loại logs

### Log Levels
1. **INFO** - Thông tin chung (✅)
   ```
   ✅ Data collector started successfully
   📊 Price data collected for BTC: $118,955
   ```

2. **WARN** - Cảnh báo (⚠️)
   ```
   ⚠️ Rate limit reached. Waiting 30 seconds...
   ⚠️ Using fallback data for BTC
   ```

3. **ERROR** - Lỗi (❌)
   ```
   ❌ Failed to start data collector: Error: ...
   ❌ Error collecting price data: Request timeout
   ```

### Log Patterns quan trọng

#### Data Collection
```
🚀 Starting scheduled data collection...
✅ Scheduled data collection started successfully
📊 Price data collection started (every 5 minutes)
⛓️ On-chain data collection started (every 60 minutes)
🤖 AI analysis started (every 30 minutes)
```

#### API Calls
```
GET /api/dashboard?coinId=bitcoin 200 in 150ms
GET /api/cryptocurrencies?activeOnly=true 200 in 80ms
❌ Error processing alerts: TypeError: Cannot read properties of undefined
```

#### Database Operations
```
prisma:query SELECT `main`.`cryptocurrencies`.`id`, `main`.`cryptocurrencies`.`symbol` ...
✅ Database seeded successfully!
```

## Xử lý sự cố thường gặp

### 1. Data Collector không chạy

#### Symptoms
- Dashboard hiển thị dữ liệu cũ
- Debug tab shows "Data Collector: stopped"
- Logs không có entries về data collection

#### Solutions
```bash
# 1. Kiểm tra server có đang chạy
ps aux | grep -E "(node|tsx)" | grep -v grep

# 2. Khởi động lại server
npm run dev

# 3. Kiểm tra database
npm run db:push
npm run db:seed

# 4. Kiểm tra logs
grep -i "data collector" dev.log
```

### 2. API errors

#### Symptoms
- Dashboard hiển thị "N/A" cho nhiều metrics
- Debug tab shows API endpoints as "down"
- Logs hiển thị HTTP errors

#### Solutions
```bash
# 1. Kiểm tra API status
curl -I http://localhost:3000/api/cryptocurrencies?activeOnly=true

# 2. Kiểm tra database connection
npx tsx scripts/test-db-connection.js

# 3. Kiểm tra rate limits
grep -i "rate limit\|429" dev.log

# 4. Restart server nếu cần
```

### 3. Database connection issues

#### Symptoms
- Errors: "Cannot read properties of undefined (reading 'findFirst')"
- Logs hiển thị database connection errors
- API responses trả về 500 errors

#### Solutions
```bash
# 1. Kiểm tra database file
ls -la db/custom.db

# 2. Push schema lại
npm run db:push

# 3. Seed lại database
npm run db:seed

# 4. Kiểm tra DATABASE_URL
echo $DATABASE_URL
```

### 4. Memory issues

#### Symptoms
- Server chạy chậm
- Logs hiển thị memory warnings
- Dashboard load rất chậm

#### Solutions
```bash
# 1. Kiểm tra memory usage
ps aux | grep node

# 2. Restart server
npm run dev

# 3. Clear cache nếu có
rm -rf .next
npm run build
npm run dev
```

## Monitoring commands cheat sheet

### System Status
```bash
# Check if server is running
ps aux | grep -E "(node|tsx)" | grep -v grep

# Check port usage
netstat -tlnp | grep :3000

# Check memory usage
free -h

# Check disk usage
df -h
```

### Logs Monitoring
```bash
# Real-time logs
tail -f dev.log

# Search for errors
grep -i "error\|failed\|exception" dev.log

# Search for data collection
grep -i "collect\|data\|api" dev.log

# Check recent logs
tail -n 100 dev.log
```

### Database Operations
```bash
# Push schema
npm run db:push

# Seed database
npm run db:seed

# Generate Prisma client
npx prisma generate

# Check database status
sqlite3 db/custom.db ".tables"
```

### API Testing
```bash
# Test main APIs
curl http://localhost:3000/api/cryptocurrencies?activeOnly=true
curl http://localhost:3000/api/dashboard?coinId=bitcoin
curl http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin

# Test with time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/dashboard?coinId=bitcoin
```

## Alert thresholds

### Performance Alerts
- **Response time > 5s**: API chậm
- **Memory usage > 80%**: Cần restart server
- **Error rate > 5%**: Có vấn đề với API

### Data Collection Alerts
- **No data collection > 10 minutes**: Data collector có vấn đề
- **Failed collections > 10%**: Cần kiểm tra API keys
- **Stale data > 1 hour**: Cần kiểm tra data sources

### System Health Alerts
- **Database connection failed**: Cần kiểm tra database
- **Port 3000 not listening**: Server không chạy
- **High CPU usage > 90%**: Cần optimize code

## Best Practices

### 1. Regular Monitoring
- Check dashboard daily
- Review logs weekly
- Monitor performance metrics

### 2. Log Management
- Rotate logs khi quá lớn
- Archive logs quan trọng
- Use log levels appropriately

### 3. Incident Response
- Document all incidents
- Create runbooks for common issues
- Monitor recurrence patterns

### 4. Performance Optimization
- Monitor response times
- Track memory usage
- Optimize database queries

## Contact & Support

Nếu gặp vấn đề không thể giải quyết:
1. Check logs đầu tiên
2. Kiểm tra documentation này
3. Search trong existing issues
4. Contact development team

---

## Appendix

### Log File Locations
- **Development**: `./dev.log`
- **Production**: `./server.log`
- **Systemd**: `/var/log/syslog` hoặc `journalctl`

### Configuration Files
- **Environment**: `.env`
- **Database**: `prisma/schema.prisma`
- **Server**: `server.ts`

### Health Check Endpoints
- System: `/api/health` (nếu có)
- Database: Check database connection
- APIs: Check individual API endpoints