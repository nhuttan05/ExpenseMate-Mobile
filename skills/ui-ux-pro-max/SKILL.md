---
name: ui-ux-pro-max
description: >-
  Bộ kỹ năng thiết kế UI/UX đẳng cấp, tinh tế và mượt mà cho AI Agent.
  Loại bỏ hoàn toàn "AI slop", áp dụng quy tắc Design-First, chuẩn WCAG 2.2,
  79 phong cách UI, 192 bảng màu theo ngành, 74 cặp font chữ và checklist 119 anti-patterns.
  Kích hoạt khi người dùng yêu cầu thiết kế giao diện, làm web/app đẹp, làm mượt UI,
  viết CSS/Tailwind, xây dựng Design System hoặc audit trải nghiệm người dùng.
---

# UI/UX PRO MAX — BỘ KỸ NĂNG THIẾT KẾ GIAO DIỆN CHUYÊN NGHIỆP CHO AI AGENT

> **Tôn chỉ cốt lõi:** Tuyệt đối loại bỏ "AI Slop" (những giao diện AI cẩu thả lặp đi lặp lại: nền tím gradient rẻ tiền, font Inter mặc định nhàm chán, layout 3-card vô hồn, khoảng trắng không phân cấp). Mọi giao diện AI tạo ra phải đạt đẳng cấp sản phẩm thương mại cao cấp, tỉ mỉ từng pixel, chuyển động mượt mà và chuẩn công thái học (Human-Centered Design).

---

## 1. QUY TRÌNH THỰC THI 6 BƯỚC (DESIGN-FIRST WORKFLOW)

Khi nhận bất kỳ yêu cầu nào liên quan đến giao diện (trang web, mobile app, dashboard, modal, component), Agent **KHÔNG ĐƯỢC CODE NGAY**, mà phải tuân theo 6 bước:

```
[BƯỚC 1: Phân tích ngữ cảnh] ➔ [BƯỚC 2: Chọn DNA Thiết kế] ➔ [BƯỚC 3: Thiết lập Không gian & Lưới]
       ➔ [BƯỚC 4: Xây dựng Component] ➔ [BƯỚC 5: Micro-interactions] ➔ [BƯỚC 6: Audit Anti-patterns]
```

### BƯỚC 1: Phân Tích Ngữ Cảnh & Người Dùng (Context & Intent)
Trước khi chọn màu hay bố cục, trả lời 5 câu hỏi:
1. **Lĩnh vực (Domain):** E-commerce, SaaS B2B, Fintech, Nông nghiệp/GreenTech, Y tế, EdTech hay Giải trí?
2. **Đối tượng (User Persona):** Doanh nghiệp nghiêm túc (cần mật độ thông tin cao, rõ ràng) hay người tiêu dùng đại chúng (cần tối giản, hình ảnh đẹp, cảm xúc)?
3. **Môi trường sử dụng (Context):** Mobile ngoài trời nắng (cần tương phản cao), Desktop văn phòng (cần đa nhiệm, phím tắt), hay Tablet trạm kho?
4. **Mật độ thông tin (Data Density):**
   - *Compact (Dày đặc):* Dành cho bảng biểu tài chính, ERP, trạm QC, trader.
   - *Comfortable (Tiêu chuẩn):* Dành cho SaaS dashboard, trang quản trị.
   - *Spacious (Thoáng đãng):* Dành cho Landing page, trang giới thiệu sản phẩm cao cấp.

---

### BƯỚC 2: Chọn "DNA Thiết Kế" (Style + Palette + Typography)
Tra cứu trong thư mục `references/` để chọn bộ 3 hoàn hảo:

1. **Chọn 1 trong 79 Phong Cách UI (`references/ui_styles.md`):**
   - *Modern Bento Grid:* Chia ô thông minh kiểu Apple/Linear, bo góc lớn, icon tinh tế.
   - *Clean SaaS Minimalism:* Tinh tế, phẳng có chiều sâu, viền mỏng `border-gray-200/80`, bóng đổ đa lớp.
   - *Glassmorphism 2.0:* Nền mờ kính cao cấp `backdrop-blur-md bg-white/70`, viền `border-white/20`.
   - *Warm Organic / Eco-Fresh:* Màu xanh lá cây tự nhiên, be ấm, nâu đất nhẹ (Rất hợp với Nông nghiệp sạch, HoNa Fresh).
   - *Dark Mode OLED Pro:* Đen sâu `#090A0F`, xám than `#12141A`, điểm nhấn neon dạ quang tinh tế.
   - *Neobrutalism:* Viền đen dày `border-2 border-black`, bóng cứng `shadow-[4px_4px_0px_#000]`, năng động Gen Z.

2. **Chọn 1 trong 192 Bảng Màu Theo Ngành (`references/color_palettes.md`):**
   - Tuân thủ nghiêm ngặt **Quy tắc 60 - 30 - 10**:
     * **60% Nền & Bề mặt:** Nền chủ đạo trung tính (`#FAFAFA`, `#F4F5F1`, hoặc `#0B0F17`).
     * **30% Cấu trúc & Nội dung:** Card, sidebar, chữ chính, viền bảng (`#FFFFFF`, `#10542C`, `#1E293B`).
     * **10% Điểm nhấn (Accent / CTA):** Nút hành động chính, huy hiệu quan trọng, link active (`#4CAF50`, `#2563EB`, `#F59E0B`).

3. **Chọn Cặp Font Typography (`references/typography_guide.md`):**
   - Không lạm dụng duy nhất 1 font `Inter`. Hãy kết hợp có chủ đích:
     * *Thương Mại & Tươi Sống:* **Plus Jakarta Sans / Be Vietnam Pro** (Body) + **Cabinet Grotesk / Lexend** (Heading).
     * *Công Nghệ & Lập Trình:* **Inter / Geist** (Body) + **JetBrains Mono / Fira Code** (Mã đơn, ID, JSON).
     * *Cao Cấp & Sang Trọng:* **Playfair Display / Fraunces** (Heading) + **Plus Jakarta Sans** (Body).

---

### BƯỚC 3: Hệ Thống Không Gian & Lưới (Spatial & Grid System)
* **Quy tắc Bội số 8px (8-Point Grid):**
  - Mọi `padding`, `margin`, `gap`, `height` phải là bội số của 4 hoặc 8:
    `4px (0.5), 8px (1), 12px (1.5), 16px (2), 24px (3), 32px (4), 48px (6), 64px (8)`.
* **Phân lớp Chiều sâu (Z-Index & Elevation Elevation System):**
  - Layer 0: Nền trang (`bg-[#F9FAF9]`).
  - Layer 1: Container / Section card (`bg-white border border-gray-100 shadow-xs`).
  - Layer 2: Card tương tác, dropdown menu (`bg-white shadow-md border border-gray-200/80`).
  - Layer 3: Popover, Modal dialog (`backdrop-blur-md bg-white/95 shadow-2xl`).
  - Layer 4: Toast notification, Tooltip (`z-50`).

---

### BƯỚC 4: Tiêu Chuẩn Thiết Kế Component Cao Cấp (`references/component_specs.md`)
* **Nút Bấm (Buttons):**
  - Chiều cao tối thiểu cho ngón tay chạm: $40\text{px} - 44\text{px}$ trên mobile.
  - Phải có đủ 5 trạng thái: `Default`, `Hover`, `Active` (scale 0.98), `Focus-visible` (ring 2px), `Disabled` (opacity-50 cursor-not-allowed).
  - Luôn có thuộc tính `type="button"` trừ khi là submit form.
* **Form & Input:**
  - Label rõ ràng, không dùng placeholder thay thế cho label.
  - Báo lỗi kèm icon và hướng dẫn khắc phục cụ thể, không chỉ báo màu đỏ chung chung.
* **Bảng Dữ Liệu (Master Tables):**
  - Header in hoa nhẹ (`text-[11px] font-bold uppercase tracking-wider text-slate-500`).
  - Căn lề số học: **Chữ căn trái, Số căn phải, Mã ID/Ngày tháng căn giữa**.
  - Hiển thị trạng thái bằng Badge màu bo tròn (`rounded-full px-2.5 py-0.5`).
* **Trạng Thái Trống & Đang Tải (Empty & Loading States):**
  - Tuyệt đối không để màn hình trắng trơn.
  - Sử dụng **Skeleton Loader** thay vì 1 spinner đơn độc xoay tròn giữa màn hình.
  - Empty state phải có: Icon minh họa dễ thương + Tiêu đề + Giải thích ngắn + Nút hành động kêu gọi (Call-to-Action).

---

### BƯỚC 5: Chuyển Động & Phản Hồi Xúc Giác (Micro-Interactions & Motion)
* **Thời gian chuyển động chuẩn (Timing):**
  - *Hover & Tooltip:* $150\text{ms} - 200\text{ms}$ (`ease-out`).
  - *Modal, Dialog, Drawer:* $250\text{ms} - 350\text{ms}$ (`cubic-bezier(0.16, 1, 0.3, 1)` - Spring curve).
  - *Toast, Notification:* $300\text{ms}$ trượt vào, tự tắt sau $4000\text{ms}$.
* **Phản hồi tương tác:**
  - Nhấp chuột/chạm: Hiệu ứng co nhẹ (`active:scale-[0.98]`).
  - Hàng bảng: Đổi màu nền mượt mà (`hover:bg-emerald-50/30 transition-colors`).
  - Tôn trọng người dùng: Luôn hỗ trợ `@media (prefers-reduced-motion: reduce)`.

---

### BƯỚC 6: Kiểm Định Checklist 119 Anti-Patterns (`references/anti_patterns_checklist.md`)
Trước khi bàn giao code, Agent phải tự rà soát:
- [ ] Tỷ lệ tương phản chữ/nền có đạt chuẩn WCAG 2.2 AA (tối thiểu $4.5:1$ cho chữ thường, $3:1$ cho chữ lớn)?
- [ ] Vùng chạm tương tác trên thiết bị di động có đạt tối thiểu $44 \times 44\text{px}$?
- [ ] Có bị tràn ngang (Horizontal overflow) ngoài ý muốn trên màn hình nhỏ $360\text{px} - 390\text{px}$ không?
- [ ] Các icon trang trí có thuộc tính `aria-hidden="true"`, các icon hành động có `aria-label` không?
- [ ] Có tránh được các lỗi "AI slop" (nền gradient tím, font Inter đơn điệu, shadow xám xịt)?

---

## 2. HƯỚNG DẪN TẠO DESIGN SYSTEM CHO DỰ ÁN MỚI

Khi bắt đầu một dự án hoặc phân hệ mới, chạy lệnh hoặc áp dụng file mẫu:
1. Đọc template tại `templates/MASTER.md`.
2. Điền các Design Tokens (Màu sắc, Typography, Spacing, Radius, Shadow).
3. Lưu vào `design-system/MASTER.md` của dự án để tất cả các lập trình viên hoặc AI Agent tiếp theo tuân thủ 100% nhất quán.

---

## 3. CÁCH GỌI VÀ SỬ DỤNG BỘ SKILL NÀY

* **Khi người dùng yêu cầu:**
  - *"Thiết kế lại trang X thật đẹp/sang trọng/mượt mà"*
  - *"Tạo component Y chuẩn UX/UI"*
  - *"Audit giao diện này xem có lỗi UX nào không"*
  - *"Làm một dashboard mang phong cách Bento Grid / Minimalist"*
* **Hành động của Agent:**
  1. Tự động tham chiếu tới các tài liệu trong `references/`.
  2. Xác định rõ Persona và Style trước khi viết mã.
  3. Áp dụng toàn bộ quy chuẩn CSS/Tailwind và Micro-interactions.
  4. Trả lời kèm bản tóm tắt các quyết định thiết kế (Design Decisions) đã đưa vào code.
