# CẨM NANG TYPOGRAPHY & 74 CẶP FONT GOOGLE FONTS ĐỈNH CAO

Typography quyết định hơn 80% trải nghiệm thị giác của một trang web hoặc ứng dụng. Chọn đúng cặp font và áp dụng đúng tỷ lệ phân cấp sẽ biến một giao diện khô khan thành một tác phẩm nghệ thuật chuẩn mực.

---

## 1. THANG TỶ LỆ PHÂN CẤP TYPOGRAPHY (HIERARCHY RATIOS)

Khuyến nghị sử dụng **Tỷ lệ Major Third ($1.25$)** cho ứng dụng Dashboard/SaaS, hoặc **Tỷ lệ Perfect Fourth ($1.333$)** cho Landing Page/Thương mại điện tử.

| Cấp bậc | Tên gọi | Kích thước | Line Height | Letter Spacing | Font Weight | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Hero Title | $40\text{px} - 56\text{px}$ | $1.1 - 1.15$ | `-0.02em` (`tracking-tight`) | 800 / 900 (Black) | Tiêu đề chính Landing Page |
| **H1** | Page Header | $28\text{px} - 32\text{px}$ | $1.2$ | `-0.015em` | 800 (ExtraBold) | Tiêu đề trang chính, Tên lô nông sản |
| **H2** | Section Title| $22\text{px} - 24\text{px}$ | $1.25$ | `-0.01em` | 700 (Bold) | Tiêu đề phân hệ, Tên thẻ card |
| **H3** | Subtitle | $18\text{px} - 20\text{px}$ | $1.3$ | `0` | 700 (Bold) | Tiêu đề bảng, Hộp thoại modal |
| **Body Large**| Mở đầu bài | $16\text{px}$ | $1.5$ | `0` | 400 / 500 | Đoạn mô tả nổi bật |
| **Body Base** | Văn bản chính| $14\text{px}$ | $1.5$ | `0` | 400 (Regular) | Nội dung thông tin, bảng biểu |
| **Body Small**| Phụ đề / Ghi chú| $12\text{px}$ | $1.4$ | `0.01em` | 500 (Medium) | Timestamp, Địa chỉ, Ghi chú phụ |
| **Caption** | Nhãn nhỏ / Badge| $10\text{px} - 11\text{px}$ | $1.3$ | `0.02em` (`tracking-wider`)| 700 / 800 | Header cột bảng, Badge trạng thái |
| **Mono** | Mã định danh | $11\text{px} - 13\text{px}$ | $1.4$ | `0.05em` | 600 (SemiBold) | Mã HĐ (`HD-2026`), Mã đơn (`ORD-..`), PUC |

---

## 2. CÁC CẶP FONT PHỐI HỢP ĐỈNH CAO (FONT PAIRINGS)

### CẶP 1: THƯƠNG MẠI NÔNG NGHIỆP TƯƠI SẠCH (HONA FRESH SPECIALTY)
* **Font Tiêu đề (Heading):** **Lexend** hoặc **Cabinet Grotesk** (Tròn trịa, thân thiện, tràn đầy sinh khí).
* **Font Nội dung (Body):** **Be Vietnam Pro** hoặc **Plus Jakarta Sans** (Hỗ trợ tiếng Việt hoàn hảo, bo tròn hiện đại, dễ đọc trên màn hình nhỏ).
* **Font Mã số (Code / Code):** **JetBrains Mono** (Mã lô vụ, số kg, số tiền VNĐ).
* **Nhúng Google Fonts:**
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lexend:wght@600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  ```

### CẶP 2: DOANH NGHIỆP B2B & QUẢN TRỊ CAO CẤP (ENTERPRISE CLEAN)
* **Font Tiêu đề (Heading):** **Plus Jakarta Sans** (Đĩnh đạc, chuẩn công nghệ).
* **Font Nội dung (Body):** **Inter** hoặc **Geist Sans** (Chuẩn mực giao diện toàn cầu).
* **Font Mã số (Numbers):** **Geist Mono** hoặc **Roboto Mono**.
* **Đặc tính:** Dày dặn, không bị lỗi font khi hiển thị bảng số liệu lớn.

### CẶP 3: CAO CẤP, HỮU CƠ & THỦ CÔNG (ORGANIC LUXURY)
* **Font Tiêu đề (Heading):** **Fraunces** hoặc **Playfair Display** (Font có chân Serif mềm mại, tạo cảm giác nông sản organic thượng hạng, chuẩn xuất khẩu).
* **Font Nội dung (Body):** **Plus Jakarta Sans** hoặc **Mulish** (Font không chân Sans-serif để giữ tính tiện dụng và độ thoáng).

### CẶP 4: HIỆN ĐẠI TỐI GIẢN CÔNG NGHỆ (TECH MODERN)
* **Font Tiêu đề (Heading):** **Space Grotesk** hoặc **Sora**.
* **Font Nội dung (Body):** **DM Sans**.
* **Đặc tính:** Rất phù hợp với Dashboard cảm biến IoT viễn trắc xe lạnh và bản đồ vệ tinh vùng trồng.

---

## 3. LƯU Ý SỐ 1 KHI THIẾT KẾ UI TIẾNG VIỆT
1. **Dấu tiếng Việt không bị cắt (Accents overflow):**
   - Tiếng Việt có nhiều dấu mũ đôi (`ể`, `ổ`, `ẵ`). Line-height không được đặt dưới `1.2` ở tiêu đề và không dưới `1.4` ở body văn bản, nếu không dấu sẽ bị cắt cụt (clipping).
2. **Không dùng font thiếu glyphs tiếng Việt:**
   - Kiểm tra kỹ font trước khi chọn. Ưu tiên các font hỗ trợ Unicode Vietnamese native: `Be Vietnam Pro`, `Lexend`, `Plus Jakarta Sans`, `Inter`, `Roboto`, `Open Sans`.
3. **Chữ số trong bảng tính (Tabular Numbers):**
   - Luôn áp dụng thuộc tính `font-variant-numeric: tabular-nums;` (Tailwind: `tabular-nums`) cho các cột cân nặng, giá tiền, phần trăm để các chữ số thẳng hàng tăm tắp theo chiều dọc.
