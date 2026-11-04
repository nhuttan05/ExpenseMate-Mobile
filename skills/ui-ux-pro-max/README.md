# UI/UX PRO MAX SKILL — HƯỚNG DẪN TÍCH HỢP VÀO MỌI DỰ ÁN

Đây là bộ **Skill Thiết Kế Giao Diện UI/UX Đẳng Cấp Cho AI Agent**, được xây dựng dựa trên nguyên lý loại bỏ "AI slop", chuẩn hóa quy trình **Design-First**, tích hợp 79 phong cách UI, 192 bảng màu ngành nghề, 74 cặp font chữ và checklist 119 lỗi cấm kỵ (Anti-patterns).

---

## 1. CÁCH ĐEM FOLDER NÀY VÀO BẤT KỲ DỰ ÁN NÀO

Bạn chỉ cần sao chép toàn bộ thư mục `ui-ux-pro-max` vào dự án theo các cấu trúc tương ứng với công cụ AI bạn đang dùng:

### A. Đối với Google Antigravity / Gemini Code:
Đặt thư mục vào một trong 2 vị trí sau tại thư mục gốc của dự án:
```
my-project/
  └── .agents/
        └── skills/
              └── ui-ux-pro-max/
                    ├── SKILL.md
                    ├── references/
                    ├── templates/
                    └── scripts/
```
*(Hoặc thư mục `skills/ui-ux-pro-max/` ngay tại thư mục gốc).*

### B. Đối với Cursor / Windsurf:
Đặt thư mục vào `.cursor/skills/` hoặc `.windsurf/skills/`:
```
my-project/
  └── .cursor/
        └── skills/
              └── ui-ux-pro-max/
                    └── SKILL.md
```

### C. Đối với Claude Code / Kimi Code / OpenSkills:
Đặt thư mục vào `.claude/skills/` hoặc import qua lệnh:
```bash
npx skills i ./ui-ux-pro-max
```

---

## 2. CÁCH GỌI VÀ SỬ DỤNG TRONG PROMPT

Khi làm việc với AI Agent (Antigravity, Cursor, Claude, Kimi), bạn chỉ cần gõ các câu lệnh tự nhiên:

* **Yêu cầu thiết kế toàn diện:**
  > *"Sử dụng skill ui-ux-pro-max để thiết kế lại Dashboard quản lý đơn hàng của tôi thật tinh tế, mượt mà và sang trọng."*
* **Yêu cầu theo phong cách cụ thể:**
  > *"Áp dụng phong cách Modern Bento Grid và bảng màu Organic Eco-Fresh trong skill ui-ux-pro-max để làm trang chi tiết sản phẩm."*
* **Yêu cầu kiểm định giao diện:**
  > *"Dùng checklist 119 anti-patterns của skill ui-ux-pro-max để audit lại trang này xem có lỗi công thái học hay khả năng đọc nào không."*
* **Tạo Design System chuẩn cho dự án:**
  > *"Dựa vào template MASTER.md của ui-ux-pro-max, hãy lập Design System cho dự án fintech này."*

---

## 3. CẤU TRÚC CHI TIẾT TRONG FOLDER

```
ui-ux-pro-max/
├── SKILL.md                           # Tệp điều phối chính cho AI Agent (Tôn chỉ, 6 bước Design-First)
├── README.md                          # Hướng dẫn sử dụng & tích hợp nhanh
├── templates/
│   └── MASTER.md                      # Template mẫu hệ thống thiết kế (Tokens, Colors, Spacing)
├── references/
│   ├── ui_styles.md                   # Từ điển 79 phong cách UI (Bento, Clean SaaS, Glassmorphism, Eco...)
│   ├── color_palettes.md              # 192 bảng màu ngành nghề chuẩn quy tắc 60-30-10 & WCAG 2.2
│   ├── typography_guide.md            # 74 cặp font Google Fonts + Thang tỷ lệ Hierarchy
│   ├── anti_patterns_checklist.md     # Checklist 119 lỗi cấm kỵ & tiêu chuẩn công thái học
│   └── component_specs.md             # Code mẫu chuẩn Tailwind/React cho Button, Table, Modal, Stepper
└── scripts/
    └── design_system_generator.py     # Script offline hỗ trợ sinh Design System & Quét lỗi Anti-patterns
```

---

## 4. TÍNH NĂNG OFFLINE ĐI KÈM (PYTHON CLI)

Bạn có thể chạy script độc lập trong thư mục `scripts/` (không cần cài thêm thư viện nào):

* **Tự động sinh Master Design System cho lĩnh vực Nông nghiệp / Thực phẩm sạch:**
  ```bash
  python scripts/design_system_generator.py agritech
  ```
* **Tự động sinh cho lĩnh vực Tài chính / Fintech:**
  ```bash
  python scripts/design_system_generator.py fintech
  ```
* **Quét tự động các lỗi công thái học trong mã nguồn frontend:**
  ```bash
  python scripts/design_system_generator.py audit frontend/src
  ```
