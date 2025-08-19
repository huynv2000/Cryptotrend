# Crypto Dashboard - Complete Source Code

## File này chứa gì?
File `crypto-dashboard-complete.tar.gz` chứa toàn bộ mã nguồn của dự án Crypto Dashboard với tính năng AI Analysis Logging đã được tích hợp.

## Kích thước file: 702KB

## Cấu trúc thư mục sau khi giải nén:

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai-analysis/route.ts          # AI Analysis API
│   │   │   ├── ai-analysis-logs/route.ts     # AI Analysis Logs API
│   │   │   ├── dashboard/route.ts           # Dashboard API
│   │   │   └── ... (các API khác)
│   │   ├── page.tsx                          # Trang chủ Dashboard
│   │   └── layout.tsx                        # Layout chính
│   ├── components/
│   │   ├── ui/                               # UI Components (shadcn/ui)
│   │   ├── dashboard/                        # Dashboard Components
│   │   └── AddCoinModal.tsx                  # Modal thêm coin
│   └── lib/
│       ├── ai-logger.ts                      # AI Logging System ⭐
│       ├── db.ts                             # Database Connection
│       └── ... (các library khác)
├── prisma/
│   └── schema.prisma                         # Database Schema
├── package.json                              # Dependencies
├── next.config.ts                            # Next.js Config
├── tailwind.config.ts                        # Tailwind CSS Config
├── tsconfig.json                             # TypeScript Config
└── ... (các file cấu hình khác)
```

## Tính năng mới được thêm vào:

### 1. AI Analysis Logging System (`src/lib/ai-logger.ts`)
- Ghi log toàn bộ hoạt động AI analysis
- Theo dõi thời gian thực hiện
- Log prompt và response từ AI models
- Thống kê hiệu suất
- Hỗ trợ export log ra JSON

### 2. AI Analysis Logs API (`src/app/api/ai-analysis-logs/route.ts`)
- Endpoint: `/api/ai-analysis-logs`
- Các actions:
  - `?action=recent` - Lấy log gần đây
  - `?action=stats` - Thống kê tổng quan
  - `?action=coin&coinId=bitcoin` - Log theo coin
  - `?action=export` - Export log ra JSON
  - `?action=summary` - In tổng kết ra console

### 3. Enhanced AI Analysis API (`src/app/api/ai-analysis/route.ts`)
- Đã được tích hợp logging system
- Log chi tiết từng bước phân tích
- Theo dõi cache usage
- Log database operations

## Cách sử dụng:

### 1. Giải nén file:
```bash
# Trên Linux/Mac
tar -xzf crypto-dashboard-complete.tar.gz

# Trên Windows (dùng Git Bash, WSL, hoặc 7-Zip)
tar -xzf crypto-dashboard-complete.tar.gz
# Hoặc dùng 7-Zip để giải nén file .tar.gz
```

### 2. Di chuyển vào thư mục dự án:
```bash
cd my-project
```

### 3. Cài đặt dependencies:
```bash
npm install
```

### 4. Cấu hình environment:
```bash
cp .env.example .env
# Edit .env file với các thông số cần thiết
```

### 5. Setup database:
```bash
npx prisma generate
npx prisma db push
```

### 6. Chạy dự án:
```bash
npm run dev
```

### 7. Kiểm tra AI Analysis Logging:
```bash
# Kiểm tra thống kê
curl "http://localhost:3000/api/ai-analysis-logs?action=stats"

# Kiểm tra log gần đây
curl "http://localhost:3000/api/ai-analysis-logs?action=recent&count=10"

# Kiểm tra log theo coin
curl "http://localhost:3000/api/ai-analysis-logs?action=coin&coinId=bitcoin"
```

## Các file quan trọng cần kiểm tra:

1. **`src/lib/ai-logger.ts`** - Core logging system
2. **`src/app/api/ai-analysis-logs/route.ts`** - Logs API endpoints
3. **`src/app/api/ai-analysis/route.ts`** - Enhanced AI Analysis with logging
4. **`src/app/page.tsx`** - Main dashboard page
5. **`prisma/schema.prisma`** - Database schema

## Lưu ý quan trọng:

- File này KHÔNG chứa `node_modules` (cần cài đặt lại)
- File này KHÔNG chứa các file log, cache, build
- File này chứa toàn bộ source code và file cấu hình
- Kích thước nhỏ (702KB) so với dự án thực tế (vì không có node_modules)

## Nếu gặp vấn đề:

### **1. Zod Version Conflict Resolution**
Nếu bạn gặp xung đột phiên bản zod trong quá trình cài đặt:
```bash
# Xóa npm cache hoàn toàn
npm cache clean --force

# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt phiên bản zod cụ thể
npm install zod@3.25.76

# Cài đặt lại tất cả dependencies
npm install
```

**Lưu ý**: Dự án sử dụng zod version 3.25.76 để tương thích với stack hiện tại. Nếu bạn thấy lỗi về zod version 4.0.2, hãy làm theo các bước trên để khắc phục.

### **2. Không giải nén được**: Dùng 7-Zip hoặc WinRAR trên Windows
2. **Lỗi khi cài đặt dependencies**: Xóa `node_modules` và `package-lock.json` rồi chạy `npm install` lại
3. **Lỗi database**: Chạy `npx prisma db push` để cập nhật database schema
4. **Lỗi port 3000**: Đảm bảo port 3000 không bị占用 bởi ứng dụng khác

## Hỗ trợ:

Nếu bạn gặp bất kỳ vấn đề nào khi sử dụng mã nguồn, hãy kiểm tra:
1. File README.md trong dự án
2. Các file .md trong thư mục docs/
3. Log output khi chạy ứng dụng

---
File này được tạo vào: 2025-08-11
Phiên bản: Complete with AI Analysis Logging System