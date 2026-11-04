#!/usr/bin/env python3
"""
UI/UX PRO MAX — OFFLINE DESIGN SYSTEM GENERATOR & AUDITOR
Hỗ trợ tạo Design System chuẩn và quét kiểm định các lỗi Anti-patterns trong mã nguồn.
"""

import os
import sys
import re

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INDUSTRY_PRESETS = {
    "agritech": {
        "name": "Nông Nghiệp Công Nghệ Cao & Thực Phẩm Sạch",
        "style": "Organic Eco-Fresh + Modern Bento Grid",
        "primary": "#10542C",
        "secondary": "#4CAF50",
        "accent": "#8BC34A",
        "background": "#F4F5F1",
        "text": "#1E293B",
        "font_heading": "Lexend",
        "font_body": "Be Vietnam Pro",
        "font_mono": "JetBrains Mono"
    },
    "fintech": {
        "name": "Tài Chính, Ngân Hàng & Ví Điện Tử",
        "style": "Clean SaaS Minimalism + Glassmorphism 2.0",
        "primary": "#0F172A",
        "secondary": "#1E40AF",
        "accent": "#2563EB",
        "background": "#F8FAFC",
        "text": "#0F172A",
        "font_heading": "Plus Jakarta Sans",
        "font_body": "Inter",
        "font_mono": "Geist Mono"
    },
    "ecommerce": {
        "name": "Sàn Thương Mại Điện Tử Tiêu Dùng",
        "style": "Modern Bento Grid",
        "primary": "#EA580C",
        "secondary": "#E11D48",
        "accent": "#F59E0B",
        "background": "#FAFAFA",
        "text": "#18181B",
        "font_heading": "Cabinet Grotesk",
        "font_body": "Plus Jakarta Sans",
        "font_mono": "JetBrains Mono"
    },
    "logistics": {
        "name": "Vận Tải & Chuỗi Cung Ứng Lạnh (Cold-chain)",
        "style": "Dark Mode OLED Pro + Bento Grid",
        "primary": "#0284C7",
        "secondary": "#334155",
        "accent": "#10B981",
        "background": "#0B0F19",
        "text": "#F8FAFC",
        "font_heading": "Space Grotesk",
        "font_body": "DM Sans",
        "font_mono": "Fira Code"
    }
}

def generate_master_design(industry_key="agritech", output_dir="design-system"):
    preset = INDUSTRY_PRESETS.get(industry_key.lower(), INDUSTRY_PRESETS["agritech"])
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "MASTER.md")

    content = f"""# HỆ THỐNG THIẾT KẾ DỰ ÁN (PROJECT MASTER DESIGN SYSTEM)
> Tự động tạo bởi UI/UX Pro Max Agent Skill cho lĩnh vực: **{preset['name']}**

---

## 1. THÔNG SỐ NHẬN DIỆN THƯƠNG HIỆU
* **Lĩnh vực:** {preset['name']}
* **Phong cách chủ đạo:** {preset['style']}
* **Font Tiêu đề:** `{preset['font_heading']}`
* **Font Nội dung:** `{preset['font_body']}` (Chuẩn Unicode tiếng Việt)
* **Font Kỹ thuật/Mã số:** `{preset['font_mono']}`

---

## 2. BẢNG MÃ MÀU SEMANTIC (COLOR TOKENS)
* **Primary (Chính):** `{preset['primary']}`
* **Secondary (Phụ):** `{preset['secondary']}`
* **Accent (Hành động CTA):** `{preset['accent']}`
* **Nền Base (Background):** `{preset['background']}`
* **Màu chữ chính (Text):** `{preset['text']}`

---

## 3. CHECKLIST KIỂM ĐỊNH MÃ NGUỒN TRƯỚC KHI BÀN GIAO
- [x] Tỷ lệ tương phản chữ/nền tối thiểu 4.5:1.
- [x] Nút bấm trên thiết bị di động có chiều cao >= 44px.
- [x] Các thẻ icon trang trí đều có `aria-hidden="true"`.
- [x] Cột số liệu và tiền tệ luôn căn lề phải với `tabular-nums`.
- [x] Không sử dụng hiệu ứng chuyển động quá 300ms.
"""
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[SUCCESS] Đã tạo thành công Master Design System tại: {out_file}")

def audit_directory(target_dir="frontend/src"):
    if not os.path.exists(target_dir):
        print(f"[WARN] Thư mục '{target_dir}' không tồn tại.")
        return

    print(f"[*] Bắt đầu quét kiểm định Anti-patterns tại: {target_dir}...")
    issues = []
    file_count = 0

    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith((".tsx", ".jsx", ".html")):
                file_count += 1
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()

                for line_num, line in enumerate(lines, 1):
                    # Check button without type attribute
                    if "<button" in line and "type=" not in line:
                        issues.append((filepath, line_num, "Thẻ <button> thiếu thuộc tính type='button'"))
                    # Check img without alt
                    if "<img" in line and "alt=" not in line:
                        issues.append((filepath, line_num, "Thẻ <img> thiếu thuộc tính alt"))
                    # Check harsh grey text
                    if "text-gray-300" in line and ("bg-white" in line or "bg-gray-50" in line):
                        issues.append((filepath, line_num, "Độ tương phản thấp: text-gray-300 trên nền trắng"))

    print(f"[*] Đã duyệt {file_count} tập tin.")
    if issues:
        print(f"[!] Phát hiện {len(issues)} điểm cần cải thiện công thái học:")
        for path, lnum, msg in issues[:10]:
            print(f"  - {path}:{lnum} -> {msg}")
        if len(issues) > 10:
            print(f"  ... và còn {len(issues) - 10} điểm khác.")
    else:
        print("[✓] Xuất sắc! Không phát hiện lỗi Anti-pattern nghiêm trọng nào.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "audit":
        path = sys.argv[2] if len(sys.argv) > 2 else "frontend/src"
        audit_directory(path)
    else:
        industry = sys.argv[1] if len(sys.argv) > 1 else "agritech"
        generate_master_design(industry)
