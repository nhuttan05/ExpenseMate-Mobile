# ExpenseMate - Mobile App Design System & Architecture

> Dự án được đồng bộ và phát triển dựa trên bản thiết kế **ExpenseMate Mobile App Design** trên **Google Stitch** (Project ID: `projects/6975186719029834832`).

---

## 1. Phong cách thiết kế (Design North Star)

- **Phong cách:** Modern Neo-Fintech Minimal
- **Định hướng trải nghiệm:**
  - **Tối giản & Rõ ràng:** Số liệu tài chính, biểu đồ, giao dịch được hiển thị sắc nét, giảm thiểu tối đa gánh nặng thị giác.
  - **Độ tin cậy cao:** Bố cục thẻ nổi (Paper-on-Glass / Elevated Cards), ranh giới mềm mại, không sử dụng đường kẻ viền dày gây rối mắt.
  - **Tối ưu tiếng Việt:** Typography font Inter hỗ trợ đầy đủ dấu tiếng Việt với chiều cao dòng thoáng (`line-height`), số hiển thị định dạng `tabular-nums` để các con số luôn thẳng hàng trên trục dọc.
  - **Đơn vị tiền tệ:** Việt Nam Đồng (VND - `đ`).

---

## 2. Bảng mã màu chuẩn (Design Tokens)

| Tên Token | Mã Hex | Mô tả / Ứng dụng |
| :--- | :--- | :--- |
| **Primary** | `#4F46E5` | Deep Indigo - Màu chủ đạo, nút bấm chính (CTA), điểm nhấn thương hiệu |
| **Primary Container**| `#3525CD` / `#4F46E5`| Thẻ tổng số dư, nền gradient nổi bật |
| **Secondary** | `#006C49` / `#10B981`| Emerald Green - Biểu thị Thu nhập (Income), tăng trưởng dương, chỉ báo thành công |
| **Secondary Container**| `#6CF8BB` / `#D1FAE5`| Nền chip/tag danh mục thu nhập |
| **Tertiary / Error** | `#BA1A1A` / `#EF4444`| Coral Red - Biểu thị Chi tiêu (Expense), cảnh báo vượt hạn mức ngân sách |
| **Tertiary Container**| `#FFDAD6` / `#FEE2E2`| Nền chip/tag danh mục chi tiêu, cảnh báo |
| **Background / Canvas**| `#FAF8FF` / `#F8F9FC`| Nền toàn màn hình, màu dịu mắt |
| **Surface (Card Level 1)**| `#FFFFFF` | Nền các thẻ nội dung (Card), danh sách giao dịch, biểu đồ |
| **Surface Container Low**| `#F2F3FF` | Nền nút icon phụ, ô tìm kiếm |
| **Text Primary** | `#131B2E` / `#0F172A`| Màu văn bản chính, số tiền |
| **Text Secondary**| `#464555` / `#64748B`| Màu văn bản phụ, chú thích, ngày giờ |
| **Outline Variant**| `#C7C4D8` / `#E2E8F0`| Đường viền mờ cho ô nhập liệu (Ghost border) |

---

## 3. Typography & Spacing

### Phông chữ: `Inter`
- **Display Currency:** 36px / 28px, Bold (`700`), Letter Spacing `-0.03em`, `tabular-nums`
- **Headline Large:** 24px, Bold (`700`)
- **Headline Medium:** 20px, Semi-Bold (`600`)
- **Headline Small:** 18px, Semi-Bold (`600`)
- **Title Medium:** 16px, Semi-Bold (`600`)
- **Body Large / Medium:** 16px / 14px, Regular (`400`)
- **Body Small:** 13px, Regular (`400`)
- **Label Large / Medium / Small:** 14px / 12px / 11px, Medium/Semi-Bold (`500`-`600`)

### Spacing Scale (8-point grid):
- `space-xs`: 4px
- `space-sm`: 8px
- `space-md`: 12px
- `space-lg`: 16px (Padding thẻ tiêu chuẩn)
- `space-xl`: 24px
- `space-2xl`: 32px
- `rounded-lg`: 8px
- `rounded-xl`: 12px (Nút bấm, Input)
- `rounded-2xl`: 16px (Thẻ Card)
- `rounded-full`: 9999px (Badge, Tag, Avatar, FAB)

---

## 4. Danh sách 12 Màn hình trong Dự án Stitch

1. **Khởi động & Giới thiệu (`f427287b4bdf4e37b66f25957d53c63f`):** Splash screen, giới thiệu tính năng, nút Bắt đầu.
2. **Đăng nhập & Xác thực (`06722d5fd5124696b0eb7f7c616dae8a`):** Đăng nhập qua Email/SĐT, Google, FaceID / Sinh trắc học.
3. **Trang chủ – Tổng quan (`3cd0f9633b0948e78ee5620061c993e6`):**
   - Lời chào & Avatar người dùng
   - Thẻ Tổng số dư khả dụng (Gradient Indigo, nút ẩn/hiện mắt)
   - Cặp chỉ số: Tổng thu nhập (+45.000.000 đ) & Tổng chi tiêu (-28.650.000 đ)
   - Lối tắt nhanh: Chuyển tiền, Nạp ví, Quét QR, Báo cáo
   - Biểu đồ thu chi dạng cột theo tuần (T2 - CN)
   - Thanh tiến độ Ngân sách tháng (Cảnh báo hạn mức)
   - Danh sách Giao dịch gần đây (WinMart, Lương FPT, EVN, Cafe...)
4. **Lịch sử giao dịch (`d52f363a15be403a9c555c2f2bdd3617`):** Bộ lọc thời gian, loại giao dịch, phân loại theo ngày.
5. **Chi tiết giao dịch (`e12aa23354784f4c8f01191b452a5b7a`):** Chi tiết biên lai, tài khoản nguồn, danh mục, ghi chú, hóa đơn đính kèm.
6. **Thêm giao dịch mới (`ed42bb34e7c545bb80cbab66ba271aff`):** Bàn phím số nhập tiền nhanh, chọn loại Thu/Chi, chọn danh mục, ngày giờ, ví thanh toán.
7. **Quản lý ngân sách (`f3955e100b174878bbe97afa677418d1`):** Thiết lập ngân sách theo từng danh mục (Ăn uống, Mua sắm, Di chuyển), cảnh báo chạm ngưỡng.
8. **Danh mục thu chi (`13ec82a595434ae2ac0e87e50c46885f`):** Quản lý icon, màu sắc, thêm/sửa danh mục con.
9. **Trợ lý tài chính AI (`104f8bda39cf4a73b08dcce12c0616ea`):** Chatbot AI phân tích chi tiêu, gợi ý tiết kiệm, trả lời câu hỏi tài chính thông minh.
10. **Báo cáo tài chính (`fd8f1c645989440f94bf3ebb1f0c4539`):** Biểu đồ tròn cơ cấu chi tiêu, xu hướng dòng tiền qua các tháng, xuất file PDF/Excel.
11. **Hồ sơ & Cài đặt (`5d127e00b3494f41b1bad44a5487fc0c`):** Thông tin cá nhân, cài đặt bảo mật (Mã PIN, Sinh trắc học), quản lý ví liên kết, Dark Mode.
12. **Trung tâm Thông báo (`fc8e3bd6237948738844470f2e4edb24`):** Nhắc nhở thanh toán hóa đơn, cảnh báo ngân sách, thông báo biến động số dư.
