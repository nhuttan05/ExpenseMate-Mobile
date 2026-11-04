# HỆ THỐNG THIẾT KẾ DỰ ÁN (PROJECT MASTER DESIGN SYSTEM)

> File này định nghĩa ngôn ngữ thiết kế (Design Tokens & UI Guidelines) thống nhất cho toàn bộ dự án. Mọi thành viên và AI Agent khi lập trình giao diện bắt buộc phải đối chiếu theo tài liệu này.

---

## 1. THÔNG TIN CỐT LÕI (CORE BRAND IDENTITY)
* **Tên Dự Án:** HoNa Fresh — Sàn Giao Dịch Nông Sản Sỉ Chuỗi Cung Ứng Lạnh
* **Lĩnh Vực (Industry):** Nông nghiệp công nghệ cao / AgriTech / B2B Escrow Marketplace
* **Đối Tượng Phục Vụ:** Nông dân, Hợp tác xã, Thương lái, Bếp ăn công nghiệp, Siêu thị & Người tiêu dùng
* **Phong Cách Thiết Kế Chủ Đạo:** **Organic Eco-Fresh** kết hợp **Modern Bento Grid** và **Clean SaaS Minimalism**

---

## 2. BẢNG MÀU CHÍNH THỨC (COLOR TOKENS)

| Vai trò ngữ nghĩa | Tên gọi | Mã Hex | Tailwind Class | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary** | Rừng Thông Hữu Cơ | `#10542C` | `bg-[#10542C]` | Nút chính, Navbar, Tiêu đề thương hiệu |
| **Brand Secondary** | Mầm Xanh Tươi Mới | `#4CAF50` | `bg-[#4CAF50]` | Điểm nhấn icon, Trạng thái thành công |
| **Brand Accent** | Lá Non VietGAP | `#8BC34A` | `bg-[#8BC34A]` | Viền hover, Icon bổ trợ, Badge nổi bật |
| **Background Base** | Sương Đọng Ban Mai | `#F4F5F1` | `bg-[#F4F5F1]` | Nền toàn trang, Nền khối container |
| **Surface Card** | Trắng Tinh Khiết | `#FFFFFF` | `bg-white` | Nền thẻ sản phẩm, Bảng biểu, Modal |
| **Text Primary** | Xám Chì Sẫm | `#1E293B` | `text-slate-800` | Tiêu đề, Nội dung chữ quan trọng |
| **Text Muted** | Xám Tro Nhẹ | `#64748B` | `text-slate-500` | Phụ đề, Chú thích ngày giờ |
| **Escrow Active** | Xanh Tín Nhiệm | `#1D4ED8` | `bg-blue-700` | Số dư ví tiền, Tiền cọc bảo chứng |
| **Alert / Danger** | Đỏ Cảnh Báo | `#DC2626` | `bg-rose-600` | Cảnh báo sốc nhiệt, Khiếu nại dập nát |

---

## 3. QUY CHUẨN TYPOGRAPHY (TYPOGRAPHY SPEC)
* **Font Tiêu đề (Headings):** `font-heading` &rarr; `Lexend` / `Cabinet Grotesk` (Độ đậm: `700`, `800`, `900`).
* **Font Văn bản (Body):** `font-sans` &rarr; `Be Vietnam Pro` / `Plus Jakarta Sans` (Hỗ trợ tiếng Việt 100%).
* **Font Mã số & KCS (Data/Mono):** `font-mono` &rarr; `JetBrains Mono` (Dùng cho Mã Hợp Đồng `HD-...`, Độ ngọt Brix, Số kg).

---

## 4. HỆ THỐNG KHÔNG GIAN & BO GÓC (SPACING & RADIUS)
* **Quy tắc bước nhảy:** Bội số $4\text{px}$ và $8\text{px}$ (`4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px`).
* **Bo góc (Border Radius):**
  - Card & Container: `rounded-2xl` ($16\text{px}$) hoặc `rounded-3xl` ($24\text{px}$).
  - Nút bấm & Input: `rounded-xl` ($12\text{px}$).
  - Badge & Tag: `rounded-full` ($9999\text{px}$).
* **Đường viền (Borders):**
  - Siêu mỏng thanh thoát: `border border-gray-200/80` hoặc `border-[#D7EED6]`.
* **Bóng đổ (Box Shadow):**
  - Mặc định: `shadow-2xs` hoặc `shadow-xs`.
  - Khi hover/nổi bật: `shadow-md shadow-[#10542C]/10`.

---

## 5. BỘ NGUYÊN TẮC CÔNG THÁI HỌC (ERGONOMICS & ACCESSIBILITY)
1. **Khả năng tương thích di động (Mobile First):** Mọi bảng biểu phức tạp phải hỗ trợ cuộn ngang mượt mà (`overflow-x-auto`) hoặc chuyển sang dạng danh sách thẻ trên màn hình nhỏ.
2. **Kích thước vùng chạm:** Mọi nút bấm, checkbox, link icon phải có chiều cao tối thiểu $44\text{px}$ trên thiết bị cảm ứng.
3. **Phản hồi xúc giác (Haptic / Tactile Feedback):** Mọi nút bấm khi click đều phải có hiệu ứng nén nhẹ `active:scale-[0.98]` và trạng thái `loading` rõ ràng.
4. **Không để màn hình chết (No Dead-ends):** Luôn có Empty State thân thiện và nút điều hướng quay về khi không có dữ liệu.
