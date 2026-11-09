# HỆ THỐNG THIẾT KẾ CHUẨN (EXPENSEMATE MASTER DESIGN SYSTEM)
> **Phiên bản:** 2.0.0 Pro Max  
> **Ngôn ngữ thiết kế:** Modern Bento Grid + Clean Fintech Minimalism + Glassmorphism 2.0  
> **Tuân thủ:** WCAG 2.2 AA • Human-Centered Ergonomics • Zero AI Slop

---

## 1. NHẬN DIỆN THƯƠNG HIỆU & ĐỊNH HƯỚNG CỐT LÕI (CORE BRAND IDENTITY)

* **Tên Dự Án:** ExpenseMate — Nền Tảng Quản Lý Chi Tiêu Ảo & Mô Phỏng Tài Chính Thông Minh
* **Lĩnh Vực (Industry):** Fintech / Personal Finance Management (PFM) / Wealth Simulation
* **Triết Lý Thiết Kế:**
  * **Zero AI Slop:** Tuyệt đối không gradient tím rẻ tiền, không font mặc định thiếu phân cấp, không layout 3 card vô hồn.
  * **Quy Tắc Màu 60 - 30 - 10:** 60% Không gian trung tính sang trọng (Slate-900 / Porcelain), 30% Cấu trúc thẻ Bento viền sắc nét, 10% Điểm nhấn quyền lực tài chính (Forest Emerald `#006C49`).
  * **Công Thái Học Tối Đa (Touch Ergonomics):** Vùng chạm tương tác tối thiểu $44 \times 44\text{px}$, hỗ trợ thao tác một tay trên thiết bị di động.
  * **Minh Bạch Số Liệu:** 100% số liệu tiền tệ căn phải (`tabular-nums`), mã giao dịch hiển thị font Monospace.

---

## 2. BẢNG MÃ MÀU CHUẨN TÀI CHÍNH (SEMANTIC COLOR TOKENS)

| Phân Loại | Token Tên Gọi | Mã Hex | Ý Nghĩa Ngữ Nghĩa & Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | Forest Emerald | `#006C49` | Màu đại diện cho sự tăng trưởng, nút CTA chính, trạng thái thặng dư |
| **Deep Dark** | Deep Slate | `#0F172A` | Tiêu đề chính, nền Hero Bento, thanh trạng thái cao cấp |
| **Brand Secondary** | Mint Growth | `#059669` | Điểm nhấn icon, số liệu tăng trưởng, tỷ lệ tích lũy dương |
| **Surface Base** | Porcelain White | `#FFFFFF` | Nền các thẻ Bento Card, Modal Sheet, Dropdown menu |
| **Background Base** | Clean Slate Gray | `#F8FAFC` | Nền toàn bộ ứng dụng, tạo sự tương phản nhẹ với các thẻ card |
| **Subtle Container** | Ice Mist | `#F1F5F9` | Nền ô tìm kiếm, nền thanh công cụ, dải phân cách |
| **Border Refined** | Soft Border Line | `#E2E8F0` | Đường viền siêu mỏng 1px tạo chiều sâu cho thẻ Bento |
| **Expense / Alert** | Coral Rose | `#E11D48` | Khoản chi tiêu, cảnh báo bội chi, nút hủy/đăng xuất |
| **Text Primary** | Obsidian Ink | `#0F172A` | Tiêu đề H1-H3, số dư tài khoản chính (Contrast $\ge 12:1$) |
| **Text Secondary** | Slate Smoke | `#475569` | Nội dung mô tả, phụ đề, hướng dẫn (Contrast $\ge 5.8:1$) |
| **Text Muted** | Silver Mist | `#94A3B8` | Chú thích ngày giờ, placeholder (Contrast $\ge 4.5:1$) |

### Bảng Màu 6 Chiếc Lọ Tài Chính (T. Harv Eker JARS Tokens)
* **NEC (Nhu Cầu Thiết Yếu - 55%):** `#0284C7` (Sky Blue) — Nước, lương thực, mái nhà che chở.
* **FFA (Tự Do Tài Chính - 10%):** `#006C49` (Forest Emerald) — Mầm cây tài chính sinh lời.
* **LTSS (Tiết Kiệm Dài Hạn - 10%):** `#F59E0B` (Warm Amber) — Tích luỹ an tâm lâu dài.
* **EDU (Học Vấn & Bản Thân - 10%):** `#8B5CF6` (Royal Violet) — Trí tuệ và năng lực.
* **PLAY (Hưởng Thụ & Giải Trí - 10%):** `#EC4899` (Vibrant Pink) — Tận hưởng cuộc sống (Tự động đổi đỏ san hô `#E11D48` khi chi vượt 80%).
* **GIVE (Cho Đi & Hiếu Hỉ - 5%):** `#10B981` (Teal Green) — Lòng biết ơn và hiếu thảo.

---

## 3. QUY CHUẨN TYPOGRAPHY (TYPOGRAPHY SPECIFICATION)

| Cấp Bậc | Font Family | Size / Line Height | Trọng Số (Weight) | Ứng Dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display Number** | Plus Jakarta Sans | 32px / 40px | 800 (Extra Bold) | Số dư tổng tài sản ròng Net Worth |
| **Heading 1** | Plus Jakarta Sans | 22px / 28px | 700 (Bold) | Tiêu đề màn hình, Bento Card chính |
| **Heading 2** | Plus Jakarta Sans | 17px / 24px | 700 (Bold) | Tiêu đề nhóm hũ tài chính, mục quản lý |
| **Subheading** | Plus Jakarta Sans | 14px / 20px | 600 (Semi Bold) | Tên giao dịch, tên danh mục ví |
| **Body Text** | Be Vietnam Pro | 14px / 22px | 400 (Regular) | Nội dung hướng dẫn, nhận định AI |
| **Caption / Meta** | Be Vietnam Pro | 12px / 16px | 500 (Medium) | Ngày giờ, ghi chú nhỏ, trạng thái |
| **Monospace / Data** | JetBrains Mono | 13px / 18px | 600 (Medium) | Mã giao dịch `#TX-...`, Tỷ giá hối đoái, `tabular-nums` |

---

## 4. HỆ THỐNG KHÔNG GIAN, LƯỚI & BO GÓC (SPACING & ELEVATION)

* **Hệ thống bước nhảy 8-Point:**
  * `Spacing.xs = 4px`
  * `Spacing.sm = 8px`
  * `Spacing.md = 12px`
  * `Spacing.lg = 16px`
  * `Spacing.xl = 24px`
  * `Spacing.xxl = 32px`
* **Hệ thống Bo góc (Border Radius Hierarchy):**
  * Bento Master Card: `24px` (`BorderRadius.xxl`)
  * Sub-card & Modals: `16px` (`BorderRadius.xl`)
  * Buttons & Inputs: `12px` (`BorderRadius.lg`)
  * Micro Badges & Pills: `9999px` (`BorderRadius.full`)
* **Hệ thống Chiều sâu (Elevation & Shadows):**
  * `Flat Line:` `borderWidth: 1, borderColor: '#F1F5F9'`
  * `Subtle Lift:` `shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8`
  * `Floating Modal / Sheet:` `shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24`

---

## 5. BỘ TIÊU CHUẨN CÔNG THÁI HỌC & MICRO-INTERACTIONS

1. **Touch Targets:** Mọi nút bấm, icon thao tác và switch đều có kích thước vật lý tối thiểu $44 \times 44\text{px}$.
2. **Tactile Feedback:** Mọi nút bấm khi nhấn đều có hiệu ứng nén nhẹ `activeOpacity: 0.75` hoặc `active:scale-[0.98]`.
3. **Motion Durations:**
   * Hover & Quick Feedback: $150\text{ms}$
   * Modal Transitions: $250\text{ms} - 300\text{ms}$ (`easeOutCubic`)
   * Tab Indicator Slide: $200\text{ms}$
4. **Data Table Layout:**
   * Tiêu đề in hoa phân cấp: `text-[11px] font-bold text-slate-500 uppercase tracking-wider`.
   * Cột số tiền luôn căn lề phải: `textAlign: 'right'`.
   * Mã ID và Trạng thái căn giữa.
