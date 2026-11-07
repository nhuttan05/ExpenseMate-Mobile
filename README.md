# 💳 ExpenseMate - Ứng dụng Quản lý Tài chính Cá nhân (React Native & Expo)

Ứng dụng quản lý tài chính cá nhân toàn diện, kết hợp **SQLite Database**, **Redux Toolkit**, **Axios API Client**, **Tamagui Tokens**, **Basic AI Engine**, và giao diện **Responsive** (hỗ trợ Tablet/iPad và xoay ngang Landscape), cấu trúc mã nguồn chuẩn hóa theo sơ đồ kiến trúc chuyên nghiệp.

---

## 🏛️ Cấu trúc thư mục (Chuẩn hóa theo sơ đồ Whiteboard)

```text
ExpenseMate-Mobile-App/
├── assets/                     # Tài nguyên ảnh, icons, splash screen
├── docs/                       # Tài liệu Design System & Stitch Specs
├── src/
│   ├── api/                    # Kết nối mạng qua Axios (Backend Connection)
│   │   ├── client.ts           # Cấu hình Axios instance, interceptors, timeout
│   │   └── expenseApi.ts       # Endpoint tỷ giá, backup giao dịch, mẹo tài chính
│   ├── components/             # Reusable Components
│   │   ├── layout/             # Bố cục màn hình
│   │   │   ├── ScreenContainer.tsx # Responsive wrapper (tối ưu iPad / quay ngang)
│   │   │   └── AdaptiveGrid.tsx    # Lưới đa cột thích ứng
│   │   └── ui/                 # Giao diện UI có Animation
│   │       ├── AnimatedCard.tsx    # Thẻ hiệu ứng FadeIn + SlideUp
│   │       ├── AnimatedProgressBar.tsx # Thanh tiến độ ngân sách hoạt họa
│   │       └── StatBadge.tsx       # Huy hiệu phân loại trạng thái
│   ├── context/                # Context API bổ trợ (ExpenseContext)
│   ├── data/                   # Dữ liệu tĩnh (Categories, Initial Budgets)
│   ├── hooks/                  # Custom Hooks
│   │   └── useResponsive.ts    # Tính toán kích thước, Tablet/iPad, Landscape
│   ├── navigation/             # Bộ điều hướng React Navigation (Tabs + Stack)
│   ├── pages/                  # Các màn hình ứng dụng (Application Pages)
│   │   ├── LoginScreen.tsx      # Đăng nhập local/mock
│   │   ├── RegisterScreen.tsx   # Đăng ký local/mock
│   │   ├── ForgotPasswordScreen.tsx # Khôi phục mật khẩu mock
│   │   ├── HomeScreen.tsx      # Tổng quan số dư, biểu đồ cột, thu/chi
│   │   ├── TransactionsScreen.tsx # Lịch sử giao dịch, tìm kiếm, lọc
│   │   ├── AddTransactionScreen.tsx # Thêm giao dịch với AI gợi ý danh mục
│   │   ├── EditTransactionScreen.tsx # Chỉnh sửa giao dịch
│   │   ├── CategoriesScreen.tsx # Quản lý danh mục
│   │   ├── BudgetScreen.tsx    # Quản lý ngân sách & thanh hoạt họa
│   │   ├── StatisticsScreen.tsx # Thống kê theo danh mục
│   │   ├── AIAssistantScreen.tsx # Chatbot tư vấn tài chính thông minh
│   │   ├── ProfileScreen.tsx   # Hồ sơ, đồng bộ Axios, bảo mật
│   │   ├── TransactionDetailScreen.tsx # Chi tiết biên lai giao dịch
│   │   └── NotificationsScreen.tsx # Trung tâm thông báo cảnh báo
│   ├── redux/                  # Advanced State Management (Redux Toolkit)
│   │   ├── store.ts            # Redux store & typed hooks
│   │   └── slices/             # Redux Slices
│   │       ├── expenseSlice.ts # Quản lý giao dịch, số dư, lọc
│   │       ├── budgetSlice.ts  # Quản lý ngân sách & hạn mức
│   │       └── aiSlice.ts      # Quản lý tin nhắn AI Chat
│   ├── services/               # Logic tầng dịch vụ (Frontend Logic)
│   │   ├── database.ts         # Quản lý SQLite Database (expo-sqlite)
│   │   ├── apiService.ts       # Dịch vụ gọi API qua Axios
│   │   └── aiService.ts        # AI suy luận danh mục & đánh giá sức khỏe tài chính
│   ├── tamagui.config.ts       # Cấu hình Tamagui Design Tokens & Themes
│   ├── types/                  # TypeScript Data Models
│   └── utils/                  # Tiện ích định dạng tiền tệ VND, ngày tháng
├── App.tsx                     # Entry point tích hợp Redux, Tamagui, SQLite
├── app.json                    # Cấu hình Expo, SQLite plugin, Orientation
├── eas.json                    # Cấu hình EAS Build APK không cần App Store
└── package.json
```

## Backend Auth API bằng Docker

Backend nằm trong thư mục `backend/`, sử dụng Express + TypeScript + PostgreSQL. PostgreSQL được lưu bằng volume Docker `expensemate-postgres-data`.

```bash
docker compose up -d --build
docker compose ps
```

Kiểm tra API tại `http://localhost:3000/health`. Contract đầy đủ nằm ở `backend/openapi.yaml`.

Backend hiện có các nhóm API:

- `auth`: đăng ký, đăng nhập, refresh/logout, hồ sơ và yêu cầu đặt lại mật khẩu.
- `transactions`: CRUD giao dịch, lọc/phân trang và soft delete.
- `sync/transactions`: đồng bộ giao dịch offline theo `clientId` idempotent.
- `categories`, `budgets`, `notifications`: dữ liệu cá nhân được giới hạn theo JWT user.
- `analytics/monthly`: tổng thu/chi, nhóm chi, khoản chi lớn nhất, cảnh báo ngân sách và nhận xét tài chính cơ bản.
- `wallets`, `wallets/jars`: quản lý ví, chuyển tiền atomically và phân bổ 6 hũ tài chính.
- `recurring`, `debts`: khoản định kỳ, trạng thái tạm dừng và sổ công nợ.
- `scenarios`, `challenges`, `analytics/health`: mô phỏng what-if, check-in thử thách và điểm sức khỏe tài chính.

PostgreSQL chạy trong container với cổng host `5433` (container `5432`); backend chạy ở cổng `3000`.

Khi chạy Expo Web trên chính máy tính, app tự dùng hostname hiện tại và backend ở cổng `3000`. Nếu chạy trên điện thoại thật, tạo file `.env` từ `.env.example`, thay `YOUR_COMPUTER_LAN_IP` bằng IPv4 của máy tính (ví dụ `192.168.1.10`), rồi khởi động lại Expo bằng `npx expo start -c`. Điện thoại và máy tính phải cùng mạng LAN; không dùng `localhost` trên điện thoại.

---

## ⚡ Các tính năng kỹ thuật trọng tâm

1. **Database trên thiết bị thật (SQLite - `expo-sqlite`):**
   - Lưu trữ offline-first, dữ liệu được duy trì bền vững trên bộ nhớ máy thật.
   - Bảng `transactions` và `budgets` tự động khởi tạo và seed dữ liệu mẫu ban đầu.
2. **Redux Toolkit (`@reduxjs/toolkit` + `react-redux`):**
   - Quản lý tập trung toàn bộ state ứng dụng qua `expenseSlice`, `budgetSlice`, và `aiSlice`.
   - Kết nối với SQLite qua `createAsyncThunk`.
3. **Axios API Client (`axios`):**
   - Cấu hình instance với timeout, interceptors, và cơ chế fallback đảm bảo app chạy mượt mà ngay cả khi không có kết nối server.
   - Hỗ trợ gọi API tỷ giá ngoại tệ thực tế và đồng bộ giao dịch.
4. **Basic AI Engine:**
   - **Tự động gợi ý danh mục:** Khi người dùng nhập tên giao dịch (ví dụ gõ *"Winmart"*, *"Highlands"*, *"Tiền điện"*), AI tự nhận diện và chọn danh mục tương ứng.
   - **Tư vấn tài chính:** Phân tích tỷ lệ tiết kiệm, cảnh báo vượt 80% ngân sách và đưa ra lời khuyên phân bổ 50/30/20.
   - **Nhập tự nhiên:** Câu như “Hôm nay ăn trưa 50.000 đồng” được nhận diện số tiền, tiêu đề và danh mục để tạo giao dịch.
5. **Responsive (Điện thoại, Tablet, iPad & Xoay ngang):**
   - Tự động nhận diện thiết bị qua `useResponsive`.
   - Giới hạn `maxWidth: 860px` căn giữa màn hình trên iPad/Tablet và xoay ngang, giúp các thẻ không bị kéo dãn bất hợp lý.
6. **Animation cơ bản:**
   - Thẻ nổi hoạt họa mượt mà (FadeIn + SlideUp).
   - Thanh tiến độ ngân sách tăng dần sinh động (`AnimatedProgressBar`).
7. **Tamagui UI Support:**
   - Tích hợp `TamaguiProvider` và hệ thống token chuẩn fintech.

> Ghi chú kiến trúc: project chọn Redux Toolkit cho trạng thái cục bộ và SQLite offline-first. Axios/API service có fallback mock để chạy được khi chưa có backend thật; khi triển khai server, thay `baseURL` trong `src/api/client.ts` bằng endpoint backend.

---

## 🚀 Hướng dẫn chạy và phân phối qua Internet

### 1. Trải nghiệm ngay trên thiết bị thật (iOS / Android)
```bash
npm start
```
- Mở ứng dụng **Expo Go** trên điện thoại thật và quét mã QR hiển thị trong terminal.

### 2. Build file APK trực tiếp qua EAS (Phân phối qua link Internet, không cần đưa lên CH Play/App Store)
```bash
# Đăng nhập tài khoản Expo (nếu chưa)
npx eas login

# Build file APK Android tải trực tiếp qua Internet
npx eas build --profile preview --platform android
```
> Sau khi build xong, EAS sẽ cung cấp **đường link download trực tiếp file `.apk` và mã QR**. Bất kỳ ai mở link này trên điện thoại Android đều có thể cài đặt và sử dụng ứng dụng ngay lập tức mà không cần Google Play Store!
