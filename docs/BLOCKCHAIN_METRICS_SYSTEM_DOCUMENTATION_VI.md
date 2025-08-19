# Tài Liệu Hệ Thống Chỉ Số Blockchain

## Mục Lục
1. [Tổng Quan Hệ Thống](#tổng-quan-hệ-thống)
2. [Khung Phân Loại Chỉ Số](#khung-phân-loại-chỉ-số)
3. [Chỉ Số Sử Dụng & Tăng Trưởng](#chỉ-số-sử-dụng--tăng-trưởng)
4. [Chỉ Số Dòng Tiền](#chỉ-số-dòng-tiền)
5. [Chỉ Số Phân Tích Nâng Cao](#chỉ-số-phân-tích-nâng-cao)
6. [Kiến Trúc Tích Hợp Dữ Liệu](#kiến-trúc-tích-hợp-dữ-liệu)
7. [Hệ Thống Phát Hiện Bất Thường](#hệ-thống-phát-hiện-bất-thường)
8. [Hướng Dẫn Triển Khai](#hướng-dẫn-triển-khai)
9. [Bảo Trì & Giám Sát](#bảo-trì--giám-sát)
10. [Phụ Lục: Nguồn Dữ Liệu](#phụ-lục-nguồn-dữ-liệu)

---

## Tổng Quan Hệ Thống

Tài liệu này cung cấp đặc tả kỹ thuật toàn diện cho hệ thống thu thập và phân tích chỉ số blockchain. Hệ thống được thiết kế để giám sát, phân tích và báo cáo về sức khỏe mạng lưới blockchain, mức độ chấp nhận người dùng và dòng vốn trên nhiều chuỗi và lớp khác nhau.

### Mục Tiêu Cốt Lõi
- **Giám Sát Thời Gian Thực**: Theo dõi liên tục các chỉ số blockchain chính
- **Tích Hợp Nhiều Nguồn**: Tổng hợp từ nhiều nhà cung cấp dữ liệu với cơ chế dự phòng
- **Phát Hiện Bất Thường**: Xác định các mẫu bất thường và tín hiệu thị trường bằng AI
- **Thông Tin Hành Động**: Chuyển đổi dữ liệu thô thành quyết định đầu tư và vận hành
- **Tối Ưu Chi Phí**: Sử dụng hiệu quả các API miễn phí với lập lịch thông minh

### Kiến Trúc Hệ Thống
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nguồn Dữ Liệu │    │   Xử Lý        │    │   Phân Tích     │
│                 │    │                 │    │                 │
│ • Artemis       │───▶│ • Xác Thực      │───▶│ • Phát Hiện BT  │
│ • Token Terminal│    │ • Chuẩn Hóa     │    │ • Phân Tích Xu  │
│ • Glassnode     │    │ • Làm Giàu      │    │ • Tương Quan    │
│ • DeFi Llama    │    │ • Lưu Trữ       │    │ • Dự Báo        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Trình Bày    │
                    │                 │
                    │ • Dashboard     │
                    │ • Cảnh Báo     │
                    │ • Báo Cáo      │
                    │ • API Endpoint │
                    └─────────────────┘
```

---

## Khung Phân Loại Chỉ Số

### Cấu Trúc Phân Cấp
```
Chỉ Số Blockchain
├── Chỉ Số Sử Dụng & Tăng Trưởng
│   ├── Hoạt Động Người Dùng
│   ├── Sử Dụng Mạng Lưới
│   └── Chấp Nhận Hệ Sinh Thái
├── Chỉ Số Dòng Tiền
│   ├── Dòng Vốn Vào
│   ├── Vị Thanh Khoản
│   └── Tâm Lý Thị Trường
└── Phân Tích Nâng Cao
    ├── Định Giá Mạng Lưới
    ├── Hoạt Động Giao Dịch
    └── Bảo Mật & Phi Tập Trung
```

### Cấp Độ Ưu Tiên
- **Ưu Tiên Cao**: Cực kỳ quan trọng cho hoạt động hàng ngày và quyết định đầu tư
- **Ưu Tiên Trung Bình**: Quan trọng cho phân tích xu hướng và lập kế hoạch chiến lược
- **Ưu Tiên Thấp**: Bổ sung cho phân tích toàn diện

### Phương Pháp Nền Tảng
Tất cả chỉ số sử dụng tính toán nền tảng rolling:
- **Trung bình rolling 7 ngày**: Xu hướng ngắn hạn
- **Trung bình rolling 30 ngày**: Xu hướng trung bình  
- **Trung bình rolling 90 ngày**: Xu hướng dài hạn
- **Độ lệch chuẩn**: Đo lường biến động
- **Ngưỡng percentile**: Phát hiện đột biến

---

## Chỉ Số Sử Dụng & Tăng Trưởng

### 1. Địa Chỉ Hoạt Động Hàng Ngày (DAA)

#### **Định Nghĩa**
Số lượng địa chỉ duy nhất giao dịch mỗi ngày trên chuỗi. Đo lường cơ sở người dùng hoạt động và mức độ tương tác.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
dailyActiveAddresses = countDistinct(addresses_with_transactions_24h)

// Phương Pháp Nền Tảng
baseline_7d = rollingMean(DAA, 7)
baseline_30d = rollingMean(DAA, 30)
baseline_90d = rollingMean(DAA, 90)
std_30d = rollingStdDev(DAA, 30)

// Logic Phát Hiện Đột Biến
isSpike = (current_DAA > baseline_30d + 2 * std_30d) || 
          (pctChange(DAA, 7) > 30)
```

#### **Nguồn Dữ Liệu (Thứ Tự Ưu Tiên)**
1. **Chính**: Artemis Dashboard (Miễn Phí)
   - Endpoint: Artemis Sheets API
   - Phạm Vi: Các blockchain chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 95%

2. **Phụ**: Glassnode Free Tier
   - Endpoint: Glassnode API
   - Phạm Vi: BTC, ETH (hạn chế)
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: Blockchain Explorers
   - Endpoints: Etherscan, Solscan APIs
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Giá trị tăng cho thấy tốc độ chấp nhận tăng tốc
- Tăng trưởng DAA dẫn trước giá tăng
- Mở rộng bền vững trên các phân khúc người dùng

**Tín Hiệu Tiêu Cực:**
- DAA giảm dù giá tăng
- Tăng trưởng do các chiến dịch spam/bot
- Hiệu ứng bão hòa mạng lưới

**Chỉ Số Xác Nhận:**
- Phí/Doanh Thu nên tăng tương ứng
- Số lượng giao dịch nên tương quan
- Địa chỉ mới nên cho thấy xu hướng tương tự

#### **Ghi Chú Triển Khai**
- Lưu trữ giá trị nền tảng: `mean_7d`, `mean_30d`, `std_30d`
- Triển khai giới hạn tốc độ: 1 yêu cầu mỗi phút cho API miễn phí
- Cache kết quả trong 15 phút để giảm gọi API

---

### 2. Địa Chỉ Mới (Hàng Ngày)

#### **Định Nghĩa**
Các địa chỉ tương tác lần đầu tiên. Báo hiệu động lực thu hút người dùng mới.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
newAddresses = count(addresses_first_seen_today)

// Phân Tích Tốc Độ Tăng Trưởng
newAddressGrowth = (newAddresses_today / newAddresses_yesterday) - 1

// Đánh Giá Chất Lượng
qualityScore = newAddresses / dailyActiveAddresses
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Blockchain.com Charts API (Miễn Phí)
   - Endpoint: `https://blockchain.info/charts/new-addresses`
   - Phạm Vi: Bitcoin
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

2. **Phụ**: Glassnode Free Tier
   - Endpoint: Glassnode API
   - Phạm Vi: BTC, ETH
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

3. **Dự Phòng**: Mô Hình Ước Tính
   - Dựa trên các mẫu tăng trưởng lịch sử
   - Độ Tin Cậy: 70%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Tăng trưởng mạnh ở đầu phễu
- Tiếp thị/phát hành đang hoạt động hiệu quả
- Thu hút người dùng bền vững

**Tín Hiệu Tiêu Cực:**
- Ví airdrop/farm làm phồng chỉ số
- Tỷ lệ chuyển đổi sang địa chỉ hoạt động thấp
- Động lực thu hút giảm

**Chỉ Số Xác Nhận:**
- Địa Chỉ Hoạt Động Hàng Ngày nên tăng cùng nhau
- Lượt đề cập trên mạng xã hội nên tương quan
- Dòng vào sàn nên theo sau tăng trưởng địa chỉ mới

---

### 3. Giao Dịch Hàng Ngày

#### **Định Nghĩa**
Tổng số giao dịch trên chuỗi mỗi ngày. Đo lường thông lượng và cường độ hoạt động.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
dailyTransactions = count(transactions_24h)

// Chỉ Số Hiệu Suất
transactionsPerActiveAddress = dailyTransactions / dailyActiveAddresses
networkUtilization = dailyTransactions / max_theoretical_transactions

// Phát Hiện Đột Biến
transactionSpike = (dailyTransactions > baseline_30d + 2 * std_30d) ||
                  (pctChange(dailyTransactions, 7) > 20)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Artemis Dashboard (Miễn Phí)
   - Endpoint: Artemis Sheets API
   - Phạm Vi: Đa chuỗi
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 95%

2. **Phụ**: Chain Explorers
   - Endpoints: Etherscan, Solscan, BscScan APIs
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: Messari API
   - Phạm Vi: Các chuỗi chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Hoạt động hữu cơ mở rộng trên các ứng dụng
- Hiệu quả mạng lưới tăng
- Tỷ lệ sử dụng thông lượng cao hơn

**Tín Hiệu Tiêu Cực:**
- Giao dịch spam làm phồng chỉ số
- Vấn đề tắc nghẽn mạng lưới
- Hoạt động kinh tế thực tế giảm

**Chỉ Số Xác Nhận:**
- Địa Chỉ Hoạt Động Hàng Ngày nên tương quan
- Phí mạng lưới nên tăng với khối lượng
- Giá trị giao dịch trung bình nên ổn định

---

### 4. Khối Lượng Giao Dịch Trên Chuỗi (USD)

#### **Định Nghĩa**
Tổng giá trị USD được chuyển trên chuỗi mỗi ngày. Nắm bắt chuyển giao giá trị kinh tế và luân chuyển vốn.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
volumeUSD = sum(transaction_amounts_usd_24h)

// Xử Lý Outlier
volumeUSD_winsorized = winsorize(transaction_amounts, 0.99)
volumeUSD_log = log1p(volumeUSD)

// Phát Hiện Đột Biến
volumeSpike = (volumeUSD > baseline_30d + 2 * std_30d) ||
              (pctChange(volumeUSD, 7) > 40)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: CoinMetrics/Glassnode (Miễn Phí Hạn Chế)
   - Endpoint: CoinMetrics Community API
   - Phạm Vi: Các tài sản chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

2. **Phụ**: Blockchain Explorers
   - Tính toán tùy chỉnh qua explorer APIs
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 85%

3. **Dự Phòng**: Mô Hình Ước Tính
   - Dựa trên vốn hóa thị trường và số lượng giao dịch
   - Độ Tin Cậy: 75%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Triển khai vốn tăng
- Phối hợp tốt với tăng trưởng DAU
- Hoạt động kinh tế bền vững

**Tín Hiệu Tiêu Cực:**
- Giao dịch đơn lẻ của cá voi/nội bộ làm sai lệch dữ liệu
- Giao dịch rửa làm phồng khối lượng
- Giá trị kinh tế thực tế giảm

**Chỉ Số Xác Nhận:**
- DAU nên tăng với khối lượng
- Dòng vào sàn (nội bộ) nên cho thấy rút tiền
- Hành động giá nên hỗ trợ xu hướng khối lượng

---

### 5. Phí / Doanh Thu Mạng Lưới (Hàng Ngày)

#### **Định Nghĩa**
Tổng phí giao dịch người dùng trả; doanh thu cho miner/validator hoặc bị đốt. Nhu cầu trực tiếp về không gian block.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
networkRevenue = sum(all_transaction_fees_24h)

// Cho các chuỗi giảm phát
networkRevenue = transaction_fees + token_burned

// Phân tích dựa trên trung vị (ưu tiên cho dữ liệu phí)
revenue_7d_median = rollingMedian(networkRevenue, 7)
revenue_30d_median = rollingMedian(networkRevenue, 30)

// Phát Hiện Đột Biến
feeSpike = (networkRevenue > revenue_30d_median + 2 * IQR) ||
           (pctChange(networkRevenue, 7) > 50)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Token Terminal API
   - Endpoint: TokenTerminal API
   - Phạm Vi: Các chuỗi chính
   - Tần Suất: 15-30 phút
   - Độ Tin Cậy: 95%

2. **Phụ**: DeFi Llama Fees API (Miễn Phí)
   - Endpoint: `https://fees.llama.fi`
   - Phạm Vi: Toàn diện
   - Tần Suất: 5-10 phút
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: CryptoFees.info (Miễn Phí)
   - Endpoint: Public API
   - Phạm Vi: Các chuỗi chính
   - Tần Suất: Hàng giờ
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Cú sốc nhu cầu cấp tính chỉ ra sử dụng hữu cơ lành mạnh
- Tăng trưởng dính cho thấy giá trị mạng lưới bền vững
- Mức phí tối ưu cân bằng chi phí và bảo mật

**Tín Hiệu Tiêu Cực:**
- Phí cao kéo dài đẩy người dùng sang lựa chọn thay thế
- Phí giảm dù sử dụng tăng
- Biến động phí cho thấy mạng lưới không ổn định

**Chỉ Số Xác Nhận:**
- Giao dịch nên tăng với phí
- DAU nên hỗ trợ doanh thu phí
- Bảo mật mạng lưới nên duy trì tối ưu

---

### 6. TVL (Tổng Giá Trị Khóa)

#### **Định Nghĩa**
Giá trị USD bị khóa trong hợp đồng thông minh trên chuỗi. Đo lường vốn cam kết cho DeFi/ứng dụng.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
TVL = sum(all_protocol_tvl_usd)

// TVL điều chỉnh giá
TVL_price_adjusted = sum(token_amounts * historical_prices)

// Phân Tích Tăng Trưởng
tvlGrowth = (TVL_today / TVL_yesterday) - 1
tvl_vs_market_cap = TVL / market_cap

// Phát Hiện Đột Biến
tvlSpike = (pctChange(TVL, 7) > 15) || 
           (TVL > rollingMax(TVL, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: DeFi Llama API (Miễn Phí)
   - Endpoint: `https://api.llama.fi/v2/chains/{chain}`
   - Phạm Vi: Toàn diện nhất
   - Tần Suất: 5-10 phút
   - Độ Tin Cậy: 98%

2. **Phụ**: Token Terminal API
   - Endpoint: TokenTerminal API
   - Phạm Vi: Các giao thức chính
   - Tần Suất: 15-30 phút
   - Độ Tin Cậy: 95%

3. **Dự Phòng**: Tổng Hợp Thủ Công
   - APIs giao thức cụ thể
   - Độ Tin Cậy: 80%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Thanh khoản mới vào giao thức
- Hệ sinh thái mở rộng với ứng dụng mới
- Cam kết vốn bền vững

**Tín Hiệu Tiêu Cực:**
- TVL do giá gây hiểu nhẫn phân tích
- Dòng vốn ra cho thấy ngại rủi ro
- Vị thế đòn bẩy quá mức

**Chỉ Số Xác Nhận:**
- Nguồn cung stablecoin nên hỗ trợ TVL
- Khối lượng DEX nên tương quan với TVL
- Doanh thu giao thức nên tăng với TVL

---

## Chỉ Số Dòng Tiền

### 7. Dòng Vào Ròng Liên Chuỗi (Được Cầu Nối)

#### **Định Nghĩa**
Giá trị ròng được cầu nối vào chuỗi = dòng vào - dòng ra (tất cả các cầu nối). Chỉ số chính của thanh khoản bên ngoài.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
netInflow = total_bridged_in - total_bridged_out

// Phân tích theo cầu nối
netInflow_by_bridge = {}
for (bridge in bridges) {
  netInflow_by_bridge[bridge] = bridge_inflows[bridge] - bridge_outflows[bridge]
}

// Phân tích xu hướng
netInflow_7d = rollingSum(netInflow, 7)
netInflow_30d = rollingSum(netInflow, 30)
netInflow_std = rollingStdDev(netInflow, 30)

// Phát Hiện Đột Biến
inflowSpike = (netInflow_7d > netInflow_30d * 1.2) ||
              (netInflow > rollingMax(netInflow, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: DeFi Llama Bridges API (Miễn Phí, một phần)
   - Endpoint: `https://bridges.llama.fi`
   - Phạm Vi: Phạm vi cầu nối một phần
   - Tần Suất: 5-10 phút
   - Độ Tin Cậy: 85%

2. **Phụ**: Artemis Flows Dashboard
   - Endpoint: Artemis API
   - Phạm Vi: Các cầu nối chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Dự Phòng**: Dune Analytics Custom Queries
   - Truy vấn SQL tùy chỉnh
   - Phạm Vi: Tùy cầu nối
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 75%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Luân chuyển vốn bên ngoài vào chuỗi tăng tốc
- Sử dụng cầu nối đa dạng cho thấy hệ sinh thái lành mạnh
- Mẫu dòng vào bền vững

**Tín Hiệu Tiêu Cực:**
- Dòng ra ròng cho thấy luân chuyển vốn ra khỏi
- Tập trung trong ít cầu nối tạo rủi ro
- Mẫu dòng vào biến động

**Chỉ Số Xác Nhận:**
- Nguồn cung stablecoin nên tăng với dòng vào
- TVL nên tăng với dòng vào ròng
- DAU nên hỗ trợ triển khai vốn

---

### 8. Nguồn Cung Stablecoin Trên Chuỗi

#### **Định Nghĩa**
Tổng giá trị USD của stablecoin lưu hành trên chuỗi. Đại diện cho on-ramp fiat/khô lực sẵn sàng triển khai.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
stablecoinSupply = sum(all_stablecoin_balances_usd)

// Theo loại stablecoin
stablecoin_by_type = {
  USDC: sum(USDC_balances),
  USDT: sum(USDT_balances),
  DAI: sum(DAI_balances),
  // ... các stablecoin khác
}

// Phân tích tăng trưởng
stablecoinGrowth = (stablecoinSupply_today / stablecoinSupply_yesterday) - 1
stablecoinEMA_7d = EMA(stablecoinSupply, 7)

// Phát Hiện Đột Biến
stablecoinSpike = (pctChange(stablecoinSupply, 7) > 10) ||
                 (stablecoinSupply > rollingMax(stablecoinSupply, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: DeFi Llama Stablecoins API (Miễn Phí)
   - Endpoint: `https://stablecoins.llama.fi`
   - Phạm Vi: Dữ liệu stablecoin toàn diện
   - Tần Suất: 5-10 phút
   - Độ Tin Cậy: 95%

2. **Phụ**: The Block Data API
   - Endpoint: The Block API
   - Phạm Vi: Các stablecoin chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: Artemis Dashboard
   - Endpoint: Artemis API
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Sức mua mới hiện diện trên chuỗi
- Hỗ trợ tiềm năng TVL/DEX/giá tăng
- Chấp nhận stablecoin đa dạng

**Tín Hiệu Tiêu Cực:**
- Lượng chuộc lớn cho thấy thanh khoản đang cạn
- Dòng ra cầu nối giảm vốn sẵn có
- Rủi ro stablecoin mất peg

**Chỉ Số Xác Nhận:**
- TVL nên tương quan với nguồn cung stablecoin
- Khối lượng DEX nên tăng với tăng trưởng stablecoin
- Số dư stablecoin sàn nên di chuyển ngược chiều

---

### 9. Dòng Vào Sàn (Token Nội Bộ)

#### **Định Nghĩa**
Dòng token ròng vào CEX = dòng vào - dòng ra. Thước đo tâm lý/áp lực cho tích lũy/phân phối.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
exchangeNetflow = exchange_inflows - exchange_outflows

// Phân tích chuỗi
outflowStreak = consecutiveDays(exchangeNetflow < 0)
inflowStreak = consecutiveDays(exchangeNetflow > 0)

// Phân tích xu hướng
netflow_7d_avg = rollingMean(exchangeNetflow, 7)
netflow_30d_avg = rollingMean(exchangeNetflow, 30)
netflow_std = rollingStdDev(exchangeNetflow, 30)

// Phát Hiện Đột Biến
flowSpike = abs(exchangeNetflow) > (netflow_30d_avg + 2 * netflow_std)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Glassnode Free Tier (Hạn Chế)
   - Endpoint: Glassnode API
   - Phạm Vi: BTC, ETH
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

2. **Phụ**: CryptoQuant Free Tier (Hạn Chế)
   - Endpoint: CryptoQuant API
   - Phạm Vi: Các sàn chính
   - Tần Suất: 15-30 phút
   - Độ Tin Cậy: 85%

3. **Dự Phòng**: DIY qua Ví Sàn Đã Gán Nhãn
   - Phân tích on-chain của địa chỉ sàn đã biết
   - Phạm Vi: Tùy sàn
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 75%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Đột biến dòng ra cho thấy tích lũy tăng giá
- Nguồn cung trên sàn giảm (khan hiếm)
- Chuỗi dòng ra kéo dài (>10 ngày)

**Tín Hiệu Tiêu Cực:**
- Đột biến dòng vào cho thấy áp lực bán tiềm năng
- Dự trữ sàn tăng
- Tập trung trong ít sàn

**Chỉ Số Xác Nhận:**
- Hành động giá nên hỗ trợ hướng dòng chảy
- Dòng vào stablecoin CEX nên tương quan
- Khối lượng on-chain nên hỗ trợ dòng chảy

---

### 10. Khối Lượng Giao Dịch Lớn (> $100k)

#### **Định Nghĩa**
Tổng giá trị USD của giao dịch trên chuỗi trên ngưỡng ($100k). Đại diện cho sự tham gia của cá nhân/tổ chức.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
largeTxVolume = sum(transactions_where_value > 100000)

// Theo cấp kích thước
largeTx_by_tier = {
  whales: sum(transactions > 1000000),
  institutions: sum(transactions > 100000 && <= 1000000)
}

// Phân tích phần trăm
largeTx_pct_total = (largeTxVolume / totalTransactionVolume) * 100

// Phát Hiện Đột Biến
largeTxSpike = (largeTxVolume > rollingMean(largeTxVolume, 30) * 1.5) ||
               (largeTxVolume > rollingMax(largeTxVolume, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Santiment/IntoTheBlock (Trả Phí, miễn phí hạn chế)
   - Endpoint: SAN API / IntoTheBlock API
   - Phạm Vi: Các chuỗi chính
   - Tần Suất: Hàng ngày/Hàng tuần
   - Độ Tin Cậy: 90%

2. **Phụ**: Dune Analytics Custom Queries
   - Truy vấn SQL tùy chỉnh
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

3. **Dự Phòng**: Santiment Free Dashboard
   - Dữ liệu dashboard công khai
   - Phạm Vi: Chỉ số hạn chế
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 70%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Giao dịch lớn phù hợp với dòng ra CEX ròng
- Giá tăng hỗ trợ hoạt động cá voi
- Phân phối giao dịch lớn (lành mạnh)

**Tín Hiệu Tiêu Cực:**
- Giao dịch lớn phù hợp với dòng vào CEX
- Giá giảm dù hoạt động cá voi
- Tập trung trong ít địa chỉ

**Chỉ Số Xác Nhận:**
- Dòng vào sàn nên cho thấy tương quan
- Hành động giá nên hỗ trợ mẫu giao dịch
- Cấu trúc thị trường nên phù hợp với hoạt động

---

### 11. Vốn Hóa Thực Tế

#### **Định Nghĩa**
Tổng giá trị của tất cả đồng xu ở giá giao dịch cuối cùng. Thước đo vĩ mô về vốn cam kết.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính (chuỗi UTXO)
realizedCap = sum(utxo_value * last_transaction_price)

// Chuỗi dựa trên tài khoản
realizedCap = sum(balance * last_movement_price)

// So sánh vốn hóa thị trường
marketCap = current_price * circulating_supply
mvrv = marketCap / realizedCap

// Phân tích xu hướng
realizedCap_growth_30d = pctChange(realizedCap, 30)
realizedCap_slope = linearTrend(realizedCap, 90)

// Phát Hiện Đột Biến
realizedCapSpike = (realizedCap_growth_30d > historical_avg_growth * 2)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: CoinMetrics Community (Miễn Phí Hạn Chế)
   - Endpoint: CoinMetrics API
   - Phạm Vi: Các tài sản chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

2. **Phụ**: Glassnode Free Tier (Hạn Chế)
   - Endpoint: Glassnode API
   - Phạm Vi: BTC, ETH
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

3. **Thứ Ba**: Messari (Chọn chỉ số)
   - Endpoint: Messari API
   - Phạm Vi: Các tài sản chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 80%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Vốn mới lành mạnh vào hệ sinh thái
- Tăng trưởng vốn hóa thực tế hỗ trợ xu hướng tăng bền vững
- Phân phối giá cơ sở cho thấy tích lũy lành mạnh

**Tín Hiệu Tiêu Cực:**
- Vốn hóa thị trường tăng nhưng vốn hóa thực tế tụt hậu
- Rally mong manh với nền tảng yếu
- Vốn hóa thực tế cao cho thấy định giá quá cao

**Chỉ Số Xác Nhận:**
- Tỷ lệ MVRV nên hỗ trợ điều kiện thị trường
- Xu hướng DAU dài hạn nên tương quan
- Dòng vào sàn nên hỗ trợ thay đổi vốn hóa thực tế

---

### 12. Khối Lượng Giao Dịch DEX (Hàng Ngày)

#### **Định Nghĩa**
Tổng khối lượng giao dịch swap trên DEX chính trên chuỗi. Đo lường nhu cầu giao dịch và sử dụng thanh khoản.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
dexVolume = sum(all_dex_trading_volume_24h)

// Theo giao thức
dexVolume_by_protocol = {
  uniswap: sum(uniswap_volume),
  curve: sum(curve_volume),
  // ... các giao thức DEX khác
}

// Phân tích thị phần
dexMarketShare = (dexVolume / total_dex_volume_all_chains) * 100
dex_vs_cex_ratio = dexVolume / centralized_exchange_volume

// Phát Hiện Đột Biến
dexSpike = (pctChange(dexVolume, 7) > 30) ||
           (dexVolume > rollingMax(dexVolume, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: DeFi Llama DEX API (Miễn Phí)
   - Endpoint: `https://api.llama.fi/dex`
   - Phạm Vi: Dữ liệu DEX toàn diện
   - Tần Suất: 5-10 phút
   - Độ Tin Cậy: 95%

2. **Phụ**: Artemis Dashboard
   - Endpoint: Artemis API
   - Phạm Vi: Các giao thức DEX chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: Dune Analytics Custom Queries
   - Truy vấn SQL tùy chỉnh
   - Phạm Vi: Tùy giao thức
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Vốn triển khai vào tài sản rủi ro
- Chất xúc tác từ ra mắt ứng dụng/airdrop
- Thị phần tăng trưởng so với CEX

**Tín Hiệu Tiêu Cực:**
- Đột biến khối lượng không có người dùng giao dịch tăng
- Giao dịch rửa làm phồng chỉ số
- Thị phần giảm

**Chỉ Số Xác Nhận:**
- Người dùng hoạt động nên hỗ trợ khối lượng
- TVL nên tương quan với hoạt động giao dịch
- Nguồn cung stablecoin nên hỗ trợ khối lượng

---

### 13. Dòng Vào Staking (PoS)

#### **Định Nghĩa**
Số lượng token mới được stake trong kỳ. Báo hiệu cam kết dài hạn.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
stakingInflow = tokens_newly_staked - tokens_unstaked

// Phần trăm nguồn cung
stakingRate = (total_staked_supply / circulating_supply) * 100
stakingInflow_pct = (stakingInflow / circulating_supply) * 100

// Phân tích xu hướng
stakingInflow_7d = rollingSum(stakingInflow, 7)
stakingInflow_30d = rollingSum(stakingInflow, 30)

// Phát Hiện Đột Biến
stakingSpike = (stakingInflow_pct > 0.5) ||  // 0.5% nguồn cung trong 7D
               (stakingInflow > rollingMax(stakingInflow, 90))
```

#### **Nguồn Dữ Liệu**
1. **Chính**: APIs Tùy Chuỗi
   - Beaconchain (Ethereum): `https://beaconcha.in/api`
   - Solana: Solana Beach API
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Hàng ngày/Hàng tuần
   - Độ Tin Cậy: 95%

2. **Phụ**: StakingRewards API
   - Endpoint: StakingRewards API
   - Phạm Vi: Các chuỗi PoS chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Dự Phòng**: Phân Tích On-chain
   - Phân tích hợp đồng thông minh
   - Phạm Vi: Tùy giao thức
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 80%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Sự tin tưởng và vốn dính tăng
- Nguồn cung thanh khoản giảm hỗ trợ giá
- Bảo mật mạng lưới lành mạnh

**Tín Hiệu Tiêu Cực:**
- Đột biến unstake ròng tăng nguồn cung
- Rủi ro tập trung validator
- Phần thưởng staking giảm

**Chỉ Số Xác Nhận:**
- Giá nên hỗ trợ hoạt động staking
- Số lượng validator nên tương quan
- Chỉ số bảo mật mạng lưới nên cải thiện

---

### 14. Validators / Nodes

#### **Định Nghĩa**
Số lượng validators/nodes hoạt động. Chỉ số phi tập trung & khả năng phục hồi.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
validatorCount = count(active_validators)
nodeCount = count(active_nodes)

// Phân tích phân phối
validator_concentration = herfindahl_index(validator_stakes)
geographic_distribution = entropy(validator_locations)

// Phân tích xu hướng
validator_growth_mom = pctChange(validatorCount, 30)
validator_growth_qoq = pctChange(validatorCount, 90)

// Phát Hiện Đột Biến
validatorSpike = (validator_growth_mom > 5)  // Sự kiện hiếm
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Chain-specific Explorers
   - Beaconchain (ETH): `https://beaconcha.in`
   - Ethernodes.org: `https://ethernodes.org`
   - Phạm Vi: Tùy chuỗi
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 95%

2. **Phụ**: Token Terminal API
   - Endpoint: TokenTerminal API
   - Phạm Vi: ETH validators
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Dự Phòng**: Network Client APIs
   - Giao tiếp node trực tiếp
   - Phạm Vi: Tùy giao thức
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Hệ sinh thái mở rộng với sự tham gia tăng
- Cải thiện phi tập trung và bảo mật
- Kinh tế validator lành mạnh

**Tín Hiệu Tiêu Cực:**
- Giảm đột biến lớn cho thấy vấn đề mạng lưới
- Tập trung validator tạo tập trung hóa
- Tỷ lệ tham gia giảm

**Chỉ Số Xác Nhận:**
- Nguồn cung stake nên hỗ trợ số lượng validator
- Bảo mật mạng lưới nên cải thiện với phi tập trung
- DAU nên tương quan với sự tham gia node

---

### 15. Hash Rate (PoW)

#### **Định Nghĩa**
Tổng sức mạnh băm mạng lưới (chuỗi PoW). Chỉ số bảo mật & sự tin tưởng của miner.

#### **Đặc Tả Kỹ Thuật**
```javascript
// Tính Toán Chính
hashRate = total_network_hashing_power

// Chỉ số chuẩn hóa
hashRate_per_unit = hashRate / network_difficulty
miner_revenue_per_hash = total_miner_revenue / hashRate

// Phân tích xu hướng
hashRate_7d_ma = rollingMean(hashRate, 7)
hashRate_30d_ma = rollingMean(hashRate, 30)
hashRate_90d_ma = rollingMean(hashRate, 90)

// Phát Hiện Đột Biến
hashRateSpike = (hashRate > hashRate_30d_ma * 1.1) ||
               (hashRate > all_time_high)
```

#### **Nguồn Dữ Liệu**
1. **Chính**: Blockchain.com Charts API (Miễn Phí)
   - Endpoint: `https://blockchain.info/charts/hash-rate`
   - Phạm Vi: Bitcoin
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 95%

2. **Phụ**: CoinMetrics Community API
   - Endpoint: CoinMetrics API
   - Phạm Vi: Các chuỗi PoW chính
   - Tần Suất: Hàng ngày
   - Độ Tin Cậy: 90%

3. **Thứ Ba**: Mining Pool APIs
   - Tổng hợp dữ liệu pool-specific
   - Phạm Vi: Tùy pool
   - Tần Suất: Thời gian thực
   - Độ Tin Cậy: 85%

#### **Khung Diễn Giải**

**Tín Hiệu Tích Cực:**
- Củng cố bảo mật mạng lưới
- Kinh tế miner lành mạnh
- Sự tin tưởng dài hạn vào mạng lưới

**Tín Hiệu Tiêu Cực:**
- Giảm đột biến cho thấy rủi ro bảo mật
- Tín hiệu đầu hàng miner
- Khả năng sinh lời giảm

**Chỉ Số Xác Nhận:**
- Doanh thu miner nên hỗ trợ hash rate
- Độ khó mạng lưới nên tương quan
- Hành động giá nên hỗ trợ kinh tế mining

---

## Kiến Trúc Tích Hợp Dữ Liệu

### Thu Thập Dữ Liệu Nhiều Nguồn

#### Nguồn Dữ Liệu Chính
1. **Artemis**
   - **Điểm Mạnh**: Chỉ số blockchain toàn diện, tier miễn phí có sẵn
   - **Phạm Vi**: 50+ blockchain chính
   - **Giới Hạn Tốc Độ**: 100 yêu cầu/ngày (miễn phí)
   - **Tích Hợp**: REST API với phản hồi JSON

2. **Token Terminal**
   - **Điểm Mạnh**: Chỉ số tài chính, tính toán chuẩn hóa
   - **Phạm Vi**: 1000+ giao thức và chuỗi
   - **Giới Hạn Tốc Độ**: 1000 yêu cầu/tháng (miễn phí)
   - **Tích Hợp**: GraphQL API

3. **Glassnode**
   - **Điểm Mạnh**: Chỉ số on-chain nâng cao, chất lượng tổ chức
   - **Phạm Vi**: BTC, ETH (tier miễn phí hạn chế)
   - **Giới Hạn Tốc Độ**: 100 yêu cầu/ngày (miễn phí)
   - **Tích Hợp**: REST API

4. **DeFi Llama**
   - **Điểm Mạnh**: Dữ liệu DeFi toàn diện nhất, hoàn toàn miễn phí
   - **Phạm Vi**: 100+ chuỗi, 1000+ giao thức
   - **Giới Hạn Tốc Độ**: Không giới hạn tốc độ (API công khai)
   - **Tích Hợp**: REST API công khai

#### Kiến Trúc Dòng Dữ Liệu
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   APIs Bên Ngoài│    │   Data Gateway  │    │   Xử Lý        │
│                 │    │                 │    │                 │
│ • Artemis       │───▶│ • Giới Hạn Tốc Độ│───▶│ • Xác Thực      │
│ • Token Terminal│    │ • Caching       │    │ • Chuẩn Hóa     │
│ • Glassnode     │    │ • Xử Lý Lỗi    │    │ • Làm Giàu      │
│ • DeFi Llama    │    │ • Retry Logic   │    │ • Lưu Trữ       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Pipeline Xử Lý Dữ Liệu

1. **Lớp Tiếp Nhận**
   ```javascript
   class DataIngestionService {
     async fetchWithRetry(source: DataSource, endpoint: string): Promise<Data> {
       const maxRetries = 3;
       const backoffMs = 1000;
       
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
           const data = await this.rateLimitedFetch(source, endpoint);
           return this.validateResponse(data);
         } catch (error) {
           if (attempt === maxRetries) throw error;
           await this.delay(backoffMs * attempt);
         }
       }
     }
   }
   ```

2. **Lớp Xác Thực**
   ```javascript
   class DataValidator {
     validateMetric(metric: MetricData): ValidationResult {
       const checks = [
         this.checkNotNull(metric.value),
         this.checkRange(metric.value, metric.minValue, metric.maxValue),
         this.checkTimestamp(metric.timestamp),
         this.checkAnomaly(metric.value, metric.historicalData)
       ];
       
       return {
         isValid: checks.every(check => check.passed),
         score: this.calculateConfidenceScore(checks),
         issues: checks.filter(check => !check.passed)
       };
     }
   }
   ```

3. **Lớp Chuẩn Hóa**
   ```javascript
   class DataNormalizer {
     normalize(data: RawData[]): NormalizedData[] {
       return data.map(item => ({
         timestamp: this.standardizeTimestamp(item.timestamp),
         value: this.convertToUSD(item.value, item.currency),
         source: item.source,
         metric: item.metric,
         chain: item.chain,
         confidence: this.calculateConfidence(item)
       }));
     }
   }
   ```

#### Chiến Lược Caching

```javascript
class CacheManager {
  private cache = new Map();
  private ttl = {
    highFrequency: 5 * 60 * 1000,    // 5 phút
    mediumFrequency: 15 * 60 * 1000, // 15 phút
    lowFrequency: 60 * 60 * 1000     // 1 giờ
  };

  async get(key: string, frequency: 'high' | 'medium' | 'low'): Promise<Data | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.ttl[frequency];
    return isExpired ? null : cached.data;
  }

  async set(key: string, data: Data, frequency: 'high' | 'medium' | 'low'): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

---

## Hệ Thống Phát Hiện Bất Thường

### Kiến Trúc Phát Hiện Bất Thường AI/ML

#### Cách Tiếp Cận Ensemble Mô Hình
```typescript
interface AnomalyDetectionModel {
  name: string;
  detect(data: TimeSeriesData[]): AnomalyResult[];
  train(data: TimeSeriesData[]): Promise<void>;
  confidence: number;
}

class AnomalyDetectionEngine {
  private models: AnomalyDetectionModel[] = [
    new IsolationForestModel(),
    new OneClassSVMModel(),
    new StatisticalOutlierModel(),
    new LSTMAnomalyModel()
  ];

  async detectAnomalies(metricData: MetricData[]): Promise<AnomalyReport> {
    const results = await Promise.all(
      this.models.map(model => model.detect(metricData))
    );
    
    return this.aggregateResults(results);
  }
}
```

#### Hệ Thống Tính Điểm Bất Thường
```javascript
class AnomalyScorer {
  calculateSeverityScore(anomaly: AnomalyDetection): number {
    const factors = {
      deviation: this.calculateDeviationScore(anomaly),
      duration: this.calculateDurationScore(anomaly),
      impact: this.calculateImpactScore(anomaly),
      confidence: this.calculateConfidenceScore(anomaly)
    };
    
    return this.weightedScore(factors, {
      deviation: 0.4,
      duration: 0.2,
      impact: 0.3,
      confidence: 0.1
    });
  }

  classifySeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }
}
```

#### Phát Hiện Bất Thường Thời Gian Thực
```typescript
class RealTimeAnomalyDetector {
  private windowSize = 100; // 100 điểm dữ liệu gần nhất
  private dataWindows = new Map<string, TimeSeriesData[]>();

  async processNewData(metric: string, value: number, timestamp: Date): Promise<AnomalyAlert[]> {
    const window = this.getDataWindow(metric);
    window.push({ value, timestamp });
    
    if (window.length > this.windowSize) {
      window.shift();
    }
    
    const anomalies = await this.detectAnomalies(window);
    return this.generateAlerts(anomalies, metric);
  }
}
```

### Hệ Thống Tạo Cảnh Báo

#### Phân Loại Cảnh Báo
```typescript
interface AlertRule {
  id: string;
  metric: string;
  condition: (data: MetricData) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: AlertAction[];
}

class AlertManager {
  private rules: AlertRule[] = [
    {
      id: 'daa_spike',
      metric: 'daily_active_addresses',
      condition: (data) => data.spikeScore > 0.8,
      severity: 'high',
      message: 'Phát hiện đột biến bất thường trong địa chỉ hoạt động hàng ngày',
      actions: ['notify', 'log', 'investigate']
    },
    {
      id: 'tvl_drop',
      metric: 'tvl',
      condition: (data) => data.change24h < -0.15,
      severity: 'critical',
      message: 'Phát hiện giảm TVL đáng kể',
      actions: ['immediate_notify', 'escalate', 'log']
    }
  ];

  async evaluateRules(data: MetricData[]): Promise<Alert[]> {
    return data.flatMap(metric => 
      this.rules
        .filter(rule => rule.metric === metric.name)
        .filter(rule => rule.condition(metric))
        .map(rule => this.createAlert(rule, metric))
    );
  }
}
```

#### Hệ Thống Thông Báo
```typescript
class NotificationService {
  async sendAlert(alert: Alert): Promise<void> {
    const channels = this.getNotificationChannels(alert.severity);
    
    await Promise.all(
      channels.map(channel => this.sendToChannel(channel, alert))
    );
  }

  private getNotificationChannels(severity: AlertSeverity): NotificationChannel[] {
    switch (severity) {
      case 'critical':
        return ['email', 'slack', 'sms', 'webhook'];
      case 'high':
        return ['email', 'slack', 'webhook'];
      case 'medium':
        return ['slack', 'webhook'];
      case 'low':
        return ['webhook'];
      default:
        return ['webhook'];
    }
  }
}
```

---

## Hướng Dẫn Triển Khai

### Cấu Hình Hệ Thống

#### Biến Môi Trường
```bash
# API Keys và Cấu Hình
ARTEMIS_API_KEY=your_artemis_key
TOKEN_TERMINAL_API_KEY=your_token_terminal_key
GLASSNODE_API_KEY=your_glassnode_key

# Cấu Hình Database
DATABASE_URL=postgresql://user:password@localhost:5432/blockchain_metrics
REDIS_URL=redis://localhost:6379

# Giới Hạn Tốc Độ
ARTEMIS_RATE_LIMIT=100
TOKEN_TERMINAL_RATE_LIMIT=1000
GLASSNODE_RATE_LIMIT=100

# Cấu Hình Cảnh Báo
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

#### Schema Database
```sql
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  chain VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(20, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  source VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(5, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anomalies (
  id SERIAL PRIMARY KEY,
  metric_id INTEGER REFERENCES metrics(id),
  anomaly_score DECIMAL(5, 4) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(100) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
```

### Lập Lịch Thu Thập Dữ Liệu

#### Lập Lịch Dựa Trên Ưu Tiên
```typescript
interface CollectionJob {
  id: string;
  metric: string;
  source: DataSource;
  priority: 'high' | 'medium' | 'low';
  interval: number; // minutes
  lastRun: Date;
}

class Scheduler {
  private jobs: CollectionJob[] = [
    {
      id: 'daa_collection',
      metric: 'daily_active_addresses',
      source: 'artemis',
      priority: 'high',
      interval: 15,
      lastRun: new Date()
    },
    {
      id: 'tvl_collection',
      metric: 'tvl',
      source: 'defi_llama',
      priority: 'high',
      interval: 5,
      lastRun: new Date()
    }
  ];

  async runScheduler(): Promise<void> {
    while (true) {
      const now = new Date();
      const dueJobs = this.jobs.filter(job => 
        now.getTime() - job.lastRun.getTime() > job.interval * 60 * 1000
      );

      // Thực hiện công việc ưu tiên cao trước
      dueJobs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const job of dueJobs) {
        await this.executeJob(job);
        job.lastRun = now;
      }

      await this.delay(60000); // Kiểm tra mỗi phút
    }
  }
}
```

### Xử Lý Lỗi và Phục Hồi

#### Xử Lý Lỗi Toàn Diện
```typescript
class ErrorHandler {
  async handleCollectionError(error: Error, context: CollectionContext): Promise<void> {
    const errorReport = {
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      context: {
        metric: context.metric,
        source: context.source,
        attempt: context.attempt
      },
      severity: this.classifyErrorSeverity(error)
    };

    await this.logError(errorReport);
    await this.notifyTeam(errorReport);
    await this.initiateRecovery(context);
  }

  private classifyErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof RateLimitError) return 'medium';
    if (error instanceof AuthenticationError) return 'high';
    if (error instanceof DataValidationError) return 'medium';
    if (error instanceof NetworkError) return 'low';
    return 'medium';
  }

  private async initiateRecovery(context: CollectionContext): Promise<void> {
    const recoveryStrategies = [
      new RetryStrategy(),
      new FallbackDataSourceStrategy(),
      new CachedDataStrategy(),
      new EstimationModelStrategy()
    ];

    for (const strategy of recoveryStrategies) {
      try {
        const result = await strategy.execute(context);
        if (result.success) return;
      } catch (error) {
        continue; // Thử chiến lược tiếp theo
      }
    }
  }
}
```

---

## Bảo Trì & Giám Sát

### Giám Sát Sức Khỏe Hệ Thống

#### Endpoints Kiểm Tra Sức Khỏe
```typescript
class HealthCheckService {
  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkExternalAPIs(),
      this.checkDataFreshness(),
      this.checkAnomalyDetection(),
      this.checkAlertSystem()
    ]);

    return {
      overall: this.calculateOverallHealth(checks),
      components: checks,
      timestamp: new Date()
    };
  }

  private async checkExternalAPIs(): Promise<HealthCheck> {
    const apiChecks = await Promise.all([
      this.checkAPI('artemis'),
      this.checkAPI('token_terminal'),
      this.checkAPI('glassnode'),
      this.checkAPI('defi_llama')
    ]);

    const healthyCount = apiChecks.filter(check => check.healthy).length;
    const totalCount = apiChecks.length;

    return {
      name: 'external_apis',
      healthy: healthyCount / totalCount > 0.7,
      details: {
        healthy_apis: healthyCount,
        total_apis: totalCount,
        failed_apis: apiChecks.filter(check => !check.healthy).map(check => check.name)
      }
    };
  }
}
```

#### Giám Sát Hiệu Suất
```typescript
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();

  recordMetric(name: string, value: number, tags: Record<string, string>): void {
    const metric = {
      timestamp: Date.now(),
      value,
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Chỉ giữ 1000 điểm dữ liệu gần nhất
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics: {}
    };

    for (const [name, data] of this.metrics.entries()) {
      const values = data.map(d => d.value);
      report.metrics[name] = {
        current: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    }

    return report;
  }
}
```

### Đảm Bảo Chất Lượng Dữ Liệu

#### Khung Đánh Giá Chất Lượng
```typescript
class DataQualityAssessment {
  async assessDataQuality(metricData: MetricData[]): Promise<QualityReport> {
    const assessments = await Promise.all([
      this.assessCompleteness(metricData),
      this.assessAccuracy(metricData),
      this.assessTimeliness(metricData),
      this.assessConsistency(metricData),
      this.assessValidity(metricData)
    ]);

    return {
      overallScore: this.calculateOverallScore(assessments),
      dimensions: assessments,
      recommendations: this.generateRecommendations(assessments),
      timestamp: new Date()
    };
  }

  private async assessCompleteness(data: MetricData[]): Promise<QualityDimension> {
    const expectedDataPoints = this.calculateExpectedDataPoints(data);
    const actualDataPoints = data.length;
    const completeness = actualDataPoints / expectedDataPoints;

    return {
      name: 'completeness',
      score: completeness,
      status: this.getStatus(completeness),
      details: {
        expected: expectedDataPoints,
        actual: actualDataPoints,
        missing: expectedDataPoints - actualDataPoints
      }
    };
  }

  private async assessAccuracy(data: MetricData[]): Promise<QualityDimension> {
    const validationResults = await Promise.all(
      data.map(item => this.validateDataPoint(item))
    );

    const validCount = validationResults.filter(r => r.isValid).length;
    const accuracy = validCount / validationResults.length;

    return {
      name: 'accuracy',
      score: accuracy,
      status: this.getStatus(accuracy),
      details: {
        valid_points: validCount,
        total_points: validationResults.length,
        issues: validationResults.filter(r => !r.isValid).map(r => r.issue)
      }
    };
  }
}
```

### Cập Nhật và Bảo Trì Hệ Thống

#### Tác Vụ Bảo Trì Tự Động
```typescript
class MaintenanceService {
  async performDailyMaintenance(): Promise<void> {
    const tasks = [
      this.cleanupOldData(),
      this.updateReferenceData(),
      this.retrainModels(),
      this.optimizeDatabase(),
      this.generateReports()
    ];

    await Promise.all(tasks);
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Giữ 90 ngày

    await this.db.query(`
      DELETE FROM metrics 
      WHERE timestamp < $1
    `, [cutoffDate]);

    await this.db.query(`
      DELETE FROM anomalies 
      WHERE detected_at < $1
    `, [cutoffDate]);
  }

  private async retrainModels(): Promise<void> {
    const models = [
      'anomaly_detection',
      'forecasting',
      'classification'
    ];

    for (const model of models) {
      try {
        await this.retrainModel(model);
        this.logger.info(`Mô hình ${model} được huấn luyện lại thành công`);
      } catch (error) {
        this.logger.error(`Huấn luyện lại mô hình ${model} thất bại`, error);
      }
    }
  }
}
```

---

## Phụ Lục: Nguồn Dữ Liệu

### Tham Khảo Nguồn Dữ Liệu Toàn Diện

#### Artemis
- **Website**: https://artemis.xyz
- **Tài Liệu API**: https://docs.artemis.xyz
- **Giới Hạn Miễn Phí**: 100 yêu cầu/ngày
- **Phạm Vi**: 50+ blockchain chính
- **Chỉ Số Có Sẵn**:
  - Địa Chỉ Hoạt Động Hàng Ngày
  - Địa Chỉ Mới
  - Giao Dịch Hàng Ngày
  - Khối Lượng Giao Dịch (USD)
  - Dòng Chảy Liên Chuỗi
  - Khối Lượng DEX

#### Token Terminal
- **Website**: https://tokenterminal.com
- **Tài Liệu API**: https://docs.tokenterminal.com
- **Giới Hạn Miễn Phí**: 1000 yêu cầu/tháng
- **Phạm Vi**: 1000+ giao thức và chuỗi
- **Chỉ Số Có Sẵn**:
  - Doanh Thu và Phí
  - Chỉ Số Người Dùng (MAU, DAU)
  - Tỷ Lệ Tài Chính (P/E, P/S)
  - TVL và Chỉ Số Tăng Trưởng

#### Glassnode
- **Website**: https://glassnode.com
- **Tài Liệu API**: https://docs.glassnode.com
- **Giới Hạn Miễn Phí**: 100 yêu cầu/ngày (chỉ số hạn chế)
- **Phạm Vi**: BTC, ETH (toàn diện), các chuỗi khác (hạn chế)
- **Chỉ Số Có Sẵn**:
  - Chỉ Số On-chain Nâng Cao
  - Dòng Chảy Sàn
  - Giao Dịch Lớn
  - Vốn Hóa Thực Tế
  - MVRV và NUPL

#### DeFi Llama
- **Website**: https://defillama.com
- **Tài Liệu API**: https://docs.llama.fi
- **Giới Hạn Miễn Phí**: Không giới hạn tốc độ (API công khai)
- **Phạm Vi**: 100+ chuỗi, 1000+ giao thức
- **Chỉ Số Có Sẵn**:
  - TVL (Tổng Giá Trị Khóa)
  - Khối Lượng DEX
  - Phí và Doanh Thu
  - Nguồn Cung Stablecoin
  - Dòng Chảy Cầu Nối

#### Blockchain.com
- **Website**: https://blockchain.com
- **Tài Liệu API**: https://blockchain.info/api
- **Giới Hạn Miễn Phí**: Không giới hạn tốc độ (API công khai)
- **Phạm Vi**: Bitcoin (toàn diện)
- **Chỉ Số Có Sẵn**:
  - Địa Chỉ Mới
  - Giao Dịch
  - Hash Rate
  - Chỉ Số Thị Trường

#### CryptoQuant
- **Website**: https://cryptoquant.com
- **Tài Liệu API**: https://docs.cryptoquant.com
- **Giới Hạn Miễn Phí**: Truy cập hạn chế vào chỉ số cơ bản
- **Phạm Vi**: Các sàn và chuỗi chính
- **Chỉ Số Có Sẵn**:
  - Dòng Chảy Sàn
  - Hoạt Động Miner
  - Chỉ Số On-chain

### Ví Dụ Tích Hợp API

#### Tích Hợp Artemis API
```javascript
class ArtemisService {
  private baseUrl = 'https://api.artemis.xyz';
  private apiKey: string;

  async getDailyActiveAddresses(chain: string, days: number = 30): Promise<TimeSeriesData[]> {
    const response = await fetch(
      `${this.baseUrl}/v1/chains/${chain}/metrics/daily-active-addresses?days=${days}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Lỗi Artemis API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map(item => ({
      timestamp: new Date(item.timestamp),
      value: item.value,
      source: 'artemis'
    }));
  }
}
```

#### Tích Hợp DeFi Llama API
```javascript
class DeFiLlamaService {
  private baseUrl = 'https://api.llama.fi';

  async getChainTVL(chain: string): Promise<TVLData[]> {
    const response = await fetch(
      `${this.baseUrl}/v2/chains/${chain}`
    );

    if (!response.ok) {
      throw new Error(`Lỗi DeFi Llama API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map(item => ({
      timestamp: new Date(item.date * 1000), // Chuyển timestamp Unix
      value: item.tvl,
      source: 'defi_llama'
    }));
  }

  async getDEXVolume(chain: string): Promise<VolumeData[]> {
    const response = await fetch(
      `${this.baseUrl}/v2/chains/${chain}/dexVolume`
    );

    if (!response.ok) {
      throw new Error(`Lỗi DeFi Llama API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map(item => ({
      timestamp: new Date(item.date * 1000),
      value: item.volume,
      source: 'defi_llama'
    }));
  }
}
```

### Chiến Lược Giới Hạn Tốc Độ

#### Giới Hạn Tốc Độ Thông Minh
```typescript
class RateLimitManager {
  private limits = new Map<string, RateLimitInfo>();
  private requests = new Map<string, RequestHistory[]>();

  async canMakeRequest(source: string): Promise<boolean> {
    const limit = this.limits.get(source);
    if (!limit) return true;

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    // Dọn dẹp yêu cầu cũ
    const history = this.requests.get(source) || [];
    const recentRequests = history.filter(req => req.timestamp > windowStart);
    this.requests.set(source, recentRequests);

    return recentRequests.length < limit.maxRequests;
  }

  async recordRequest(source: string): Promise<void> {
    const history = this.requests.get(source) || [];
    history.push({
      timestamp: Date.now(),
      source
    });
    this.requests.set(source, history);
  }

  async waitForAvailability(source: string): Promise<void> {
    while (!(await this.canMakeRequest(source))) {
      await this.delay(1000); // Chờ 1 giây
    }
  }
}
```

### Chiến Lược Phục Hồi Lỗi

#### Nguồn Dữ Liệu Dự Phòng
```typescript
class FallbackManager {
  private fallbackChains = new Map<string, string[]>([
    ['daily_active_addresses', ['artemis', 'glassnode', 'blockchain']],
    ['tvl', ['defi_llama', 'token_terminal', 'estimation']],
    ['fees', ['defi_llama', 'token_terminal', 'glassnode']],
    ['transactions', ['artemis', 'blockchain', 'explorers']]
  ]);

  async getDataWithFallback(metric: string, chain: string): Promise<MetricData> {
    const sources = this.fallbackChains.get(metric) || [];
    
    for (const source of sources) {
      try {
        const data = await this.fetchFromSource(source, metric, chain);
        if (this.validateData(data)) {
          return {
            ...data,
            source,
            fallbackUsed: source !== sources[0]
          };
        }
      } catch (error) {
        this.logger.warn(`Lấy dữ liệu ${metric} từ ${source} thất bại`, error);
        continue;
      }
    }

    throw new Error(`Tất cả nguồn dự phòng thất bại cho chỉ số: ${metric}`);
  }
}
```

Tài liệu hệ thống toàn diện này cung cấp đặc tả kỹ thuật hoàn chỉnh để triển khai và duy trì hệ thống thu thập và phân tích chỉ số blockchain. Nó bao gồm đặc tả chi tiết cho tất cả 15 chỉ số, kiến trúc tích hợp dữ liệu, hệ thống phát hiện bất thường, hướng dẫn triển khai và thủ tục bảo trì.