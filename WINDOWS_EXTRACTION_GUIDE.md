# WINDOWS EXTRACTION GUIDE

## 🎯 BẠN ĐANG CÓ 2 LỰA CHỌN:

### Lựa chọn 1: Dùng file .ZIP (Khuyến khích cho Windows)
File: `crypto-dashboard-complete.zip` (774KB)
- ✅ Dễ giải nén trên Windows
- ✅ Chỉ cần 1 bước giải nén
- ✅ Tương thích với Windows Explorer

### Lựa chọn 2: Dùng file .TAR.GZ
File: `crypto-dashboard-complete.tar.gz` (702KB)
- ❌ Cần công cụ đặc biệt trên Windows
- ❌ Cần giải nén 2 bước
- ✅ File nhỏ hơn một chút

---

## 📁 CÁCH GIẢI NÉN TRÊN WINDOWS

### 🔥 CÁCH 1: DÙNG FILE .ZIP (KHUYẾN KHÍCH)

#### Bước 1: Tải file crypto-dashboard-complete.zip
- Tìm file trong file explorer
- Click chuột phải → Download

#### Bước 2: Giải nén trên Windows
**Method A: Dùng Windows Explorer (Windows 10/11)**
1. Right-click vào file `crypto-dashboard-complete.zip`
2. Chọn "Extract All..."
3. Chọn thư mục đích
4. Click "Extract"

**Method B: Dùng 7-Zip/WinRAR**
1. Right-click vào file `crypto-dashboard-complete.zip`
2. Chọn "Extract Here" hoặc "Extract to crypto-dashboard-complete\"
3. Xong! Bạn sẽ thấy thư mục `my-project/`

#### Bước 3: Kiểm tra kết quả
Sau khi giải nén, bạn nên thấy:
```
my-project/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── prisma/
├── package.json
└── ...
```

---

### 🔧 CÁCH 2: DÙNG FILE .TAR.GZ (NẾU BẠN MUỐN)

#### Method A: Dùng 7-Zip (Khuyến khích)
1. **Right-click vào file** `crypto-dashboard-complete.tar.gz`
2. **Chọn 7-Zip → Extract Here**
3. **Bạn sẽ được file** `crypto-dashboard-complete.tar`
4. **Right-click vào file** `crypto-dashboard-complete.tar`
5. **Chọn 7-Zip → Extract Here**
6. **Bây giờ bạn sẽ thấy thư mục** `my-project/`

#### Method B: Dùng WinRAR
1. **Right-click vào file** `crypto-dashboard-complete.tar.gz`
2. **Chọn "Extract Here"**
3. **WinRAR sẽ tự động giải nén cả 2 lớp**
4. **Bạn sẽ thấy thư mục** `my-project/`

#### Method C: Dùng PowerShell (Windows 10/11)
1. **Mở PowerShell** (Windows Key + X → Windows PowerShell)
2. **Di chuyển đến thư mục chứa file:**
   ```powershell
   cd C:\Users\YourUsername\Downloads
   ```
3. **Chạy lệnh giải nén:**
   ```powershell
   tar -xzf crypto-dashboard-complete.tar.gz
   ```

#### Method D: Dùng Git Bash
1. **Mở Git Bash** (nếu đã cài Git for Windows)
2. **Di chuyển đến thư mục chứa file:**
   ```bash
   cd /c/Users/YourUsername/Downloads
   ```
3. **Chạy lệnh giải nén:**
   ```bash
   tar -xzf crypto-dashboard-complete.tar.gz
   ```

---

## 🚀 SAU KHI GIẢI NÉN THÀNH CÔNG

### 1. Kiểm tra cấu trúc thư mục
Mở thư mục `my-project/` và kiểm tra các file quan trọng:
- `src/app/page.tsx` - Main dashboard
- `src/lib/ai-logger.ts` - AI logging system
- `src/app/api/ai-analysis/route.ts` - AI analysis API
- `package.json` - Dependencies
- `prisma/schema.prisma` - Database schema

### 2. Mở project với VS Code
```bash
cd my-project
code .
```

### 3. Cài đặt dependencies
```bash
npm install
```

### 4. Cấu hình environment
```bash
cp .env.example .env
# Edit .env file
```

### 5. Setup database
```bash
npx prisma generate
npx prisma db push
```

### 6. Chạy project
```bash
npm run dev
```

---

## 🛠️ CÔNG CỤ CẦN THIẾT

### Bắt buộc:
- **Node.js** (v18+): https://nodejs.org/
- **VS Code**: https://code.visualstudio.com/

### Khuyến khích:
- **7-Zip**: https://www.7-zip.org/ (để giải nén .tar.gz)
- **Git for Windows**: https://git-scm.com/ (để dùng Git Bash)
- **Windows Terminal**: https://aka.ms/terminal (terminal tốt hơn)

---

## 🐛 KHẮC PHỤC SỰ CỐ

### Vấn đề 1: "Windows cannot open this folder"
- **Nguyên nhân**: File chưa được giải nén hoàn toàn
- **Khắc phục**: Dùng 7-Zip để giải nén từng bước

### Vấn đề 2: "File is corrupted"
- **Nguyên nhân**: Download bị lỗi
- **Khắc phục**: Tải lại file

### Vấn đề 3: "Cannot find .env file"
- **Nguyên nhân**: Chưa copy file môi trường
- **Khắc phục**: `cp .env.example .env`

### Vấn đề 4: "npm install failed"
- **Nguyên nhân**: Node.js version không compatible
- **Khắc phục**: Update Node.js lên v18+

### Vấn đề 5: "Port 3000 is already in use"
- **Nguyên nhân**: Port bị占用 bởi ứng dụng khác
- **Khắc phục**: 
  ```bash
  # Tìm process dùng port 3000
  netstat -ano | findstr :3000
  # Kill process (thay thế PID bằng số thực tế)
  taskkill /PID <PID> /F
  ```

### Vấn đề 6: Zod Version Conflict
- **Nguyên nhân**: Xung đột phiên bản zod (4.0.2 vs 3.25.76)
- **Khắc phục**:
  ```cmd
  # Clear npm cache completely
  npm cache clean --force
  
  # Delete node_modules and package-lock.json
  rmdir /s /q node_modules
  del package-lock.json
  
  # Force install specific zod version
  npm install zod@3.25.76
  
  # Reinstall all dependencies
  npm install
  ```

**Note**: The project uses zod version 3.25.76 which is compatible with the current stack. If you see errors about zod version 4.0.2, follow the steps above to resolve the conflict.

---

## 📞 HỖ TRỢ

Nếu bạn gặp bất kỳ vấn đề nào:
1. Kiểm tra lại các bước đã làm
2. Đảm bảo đã cài đặt đầy đủ công cụ
3. Thử dùng file .zip thay vì .tar.gz
4. Cho tôi biết lỗi cụ thể bạn gặp phải

---

## 📋 CHECKLIST

- [ ] Tải file thành công
- [ ] Giải nén được file
- [ ] Thấy thư mục `my-project/`
- [ ] Mở được project với VS Code
- [ ] Chạy được `npm install`
- [ ] Cấu hình được `.env` file
- [ ] Setup được database
- [ ] Chạy được `npm run dev`
- [ ] Truy cập được http://localhost:3000

---

**💡 MẸO:** Nên dùng file `.zip` nếu bạn không quen với command line trên Windows!