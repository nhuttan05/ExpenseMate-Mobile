# BẢNG MÃ MÀU 192 NGÀNH NGHỀ & QUY TẮC PHỐI MÀU THƯƠNG HIỆU

Màu sắc là ngôn ngữ giao tiếp phi ngôn ngữ mạnh mẽ nhất. Tài liệu này cung cấp các bảng màu chuẩn mực theo từng ngành nghề với đầy đủ các vai trò ngữ nghĩa (Semantic Tokens).

---

## 1. NGUYÊN TẮC VÀNG: QUY TẮC 60 - 30 - 10
* **60% Nền & Bề mặt không gian (Dominant Neutral):** Thường là màu trắng ấm, xám ngà hoặc xám đen dịu mắt. Giúp mắt người dùng được thư giãn.
* **30% Khối cấu trúc & Nhận diện (Structural Secondary):** Thanh menu, thẻ card, màu tiêu đề chính, đường viền phân cách.
* **10% Điểm nhấn hành động (Accent / CTA):** Chỉ dùng cho nút bấm quan trọng nhất, badge trạng thái cần chú ý, con số KPI đột biến.

---

## 2. BẢNG MÀU THEO TỪNG LĨNH VỰC TIÊU BIỂU

### A. NÔNG NGHIỆP CÔNG NGHỆ CAO & NÔNG SẢN SẠCH (ECO-AGRITECH / HONA FRESH)
*Cảm xúc truyền tải: Tươi mới, an toàn sinh học, trù phú, minh bạch, hữu cơ.*
* **Primary (Rừng thông hữu cơ):** `#10542C` (Tailwind: `emerald-900`)
* **Secondary (Mầm xanh tươi mới):** `#4CAF50` (Tailwind: `emerald-600`)
* **Accent / Highlight (Lá non VietGAP):** `#8BC34A` (Tailwind: `lime-500`)
* **Background Light:** `#F4F5F1` (Trắng sương đọng) & `#FAFBF9`
* **Surface Card:** `#FFFFFF` với viền `border-[#D7EED6]` hoặc `border-gray-200/70`
* **Text Main:** `#1E293B` (Slate-800) | **Text Muted:** `#64748B` (Slate-500)
* **Escrow / Tiền cọc:** `#1D4ED8` (Blue-700) | **Hao hụt / Cảnh báo nhiệt:** `#E11D48` (Rose-600)

### B. TÀI CHÍNH BẢO HIỂM & KÝ QUỸ TRUNG GIAN (FINTECH & ESCROW B2B)
*Cảm xúc truyền tải: Uy tín, bảo mật tuyệt đối, vững vàng, chính xác.*
* **Primary (Xanh Hải Quân Thâm Sâu):** `#0F172A` (Slate-900)
* **Secondary (Xanh Hoàng Gia):** `#1E40AF` (Blue-800)
* **Accent / CTA (Xanh Lam Tín Nhiệm):** `#2563EB` (Blue-600)
* **Success (Ký quỹ thành công):** `#059669` (Emerald-600)
* **Warning (Đang đối soát):** `#D97706` (Amber-600)
* **Background:** `#F8FAFC` | **Card Surface:** `#FFFFFF` viền `#E2E8F0`

### C. LOGISTICS & CHUỖI CUNG ỨNG LẠNH (COLD-CHAIN & FLEET)
*Cảm xúc truyền tải: Tốc độ, kiểm soát nhiệt độ, vận hành chuẩn xác, viễn trắc.*
* **Primary (Xanh Đá Băng Lạnh):** `#0284C7` (Sky-600)
* **Secondary (Xám Kim Loại Thùng Xe):** `#334155` (Slate-700)
* **Accent (Cảm biến nhiệt độ đạt chuẩn):** `#10B981` (Emerald-500)
* **Cold Breach Alert (Đứt gãy chuỗi lạnh):** `#DC2626` (Red-600)
* **Background Dark (OLED Màn hình xe):** `#0B0F19` | **Surface:** `#1E293B`

### D. THƯƠNG MẠI ĐIỆN TỬ BÁN LẺ CAO CẤP (RETAIL COMMERCE)
*Cảm xúc truyền tải: Kích thích mua sắm, ấm cúng, sang trọng, tiện lợi.*
* **Primary (Cam Năng Động):** `#EA580C` (Orange-600) hoặc `#FB8C00`
* **Secondary (Đỏ San Hô):** `#E11D48` (Rose-600)
* **Neutral Dark:** `#18181B` (Zinc-900)
* **Background:** `#FFFFFF` & `#FAFAFA`
* **Badge Giảm Giá / Voucher:** `#DC2626` text trắng

### E. CHĂM SÓC SỨC KHỎE & DƯỢC LIỆU (HEALTHCARE & WELLNESS)
*Cảm xúc truyền tải: Tinh khiết, an tâm, y tế chuẩn mực, thư thái.*
* **Primary (Xanh Lam Y Tế):** `#0891B2` (Cyan-600)
* **Secondary (Xanh Bạc Hà):** `#2DD4BF` (Teal-400)
* **Background Soft:** `#F0FDFA` (Teal-50)
* **Text Main:** `#0F172A`

---

## 3. BẢNG MÃ MÀU NGỮ NGHĨA TRẠNG THÁI (SEMANTIC STATE TOKENS)

Mọi hệ thống bắt buộc phải chuẩn hóa các mã màu trạng thái sau đây:

| Trạng thái | Mã Hex | Tailwind Class | Ứng dụng cụ thể |
| :--- | :--- | :--- | :--- |
| **SUCCESS** | `#16A34A` | `bg-emerald-50 text-emerald-800 border-emerald-200` | Đơn hoàn tất, QC đạt &ge; 98%, Đã thanh toán |
| **WARNING** | `#D97706` | `bg-amber-50 text-amber-800 border-amber-200` | Chờ thu hoạch, Cần đối soát, Sắp hết hạn |
| **DANGER / ERROR**| `#DC2626` | `bg-rose-50 text-rose-800 border-rose-200` | Sốc nhiệt xe lạnh, Lô hàng bị từ chối, Hủy hợp đồng |
| **INFO** | `#0284C7` | `bg-sky-50 text-sky-800 border-sky-200` | Xe lạnh đang di chuyển, Đang đóng gói 2h |
| **PENDING** | `#64748B` | `bg-slate-100 text-slate-700 border-slate-200` | Đơn hàng mới khởi tạo, Chưa xử lý |

---

## 4. QUY TẮC ĐỘ TƯƠNG PHẢN CHỮ (WCAG 2.2 CONTRAST RULE)
* Tuyệt đối không dùng chữ xám nhạt `#A0AEC0` trên nền trắng `#FFFFFF` (Tỷ lệ tương phản chỉ $\approx 2.1:1$, vi phạm nghiêm trọng khả năng đọc).
* Mọi đoạn văn bản thông thường (dưới $18\text{px}$) phải có tỷ lệ tương phản tối thiểu **$4.5 : 1$**.
* Tiêu đề lớn (trên $18\text{px}$ in đậm hoặc $24\text{px}$) phải có tỷ lệ tương phản tối thiểu **$3.0 : 1$**.
* Kiểm tra nhanh: Dùng màu xám tối thiểu từ `slate-600` (`#475569`) trở lên khi viết chữ trên nền trắng.
