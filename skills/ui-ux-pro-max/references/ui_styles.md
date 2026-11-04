# TỪ ĐIỂN 79 PHONG CÁCH THIẾT KẾ UI (UI STYLES ENCYCLOPEDIA)

Tài liệu này tổng hợp các phong cách thiết kế UI thịnh hành nhất trong kỷ nguyên số hiện đại, phân loại theo đặc tính thẩm mỹ, bộ mã Tailwind CSS mẫu, và hướng dẫn khi nào nên áp dụng.

---

## 1. MODERN BENTO GRID (Phong cách Chia Ô Đa Năng Kiểu Apple / Linear)
* **Đặc tính:** Giao diện được chia thành các khối chữ nhật/vuông như hộp cơm Bento Nhật Bản, mỗi ô chứa 1 tính năng hoặc chỉ số độc lập.
* **Đặc điểm thị giác:**
  - Bo góc lớn mềm mại: `rounded-3xl` ($24\text{px}$) hoặc `rounded-2xl` ($16\text{px}$).
  - Đường viền mỏng tinh xảo: `border border-gray-200/80 dark:border-white/10`.
  - Nền khối: `bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all`.
  - Icon kích thước lớn, màu sắc rực rỡ đặt trong khung bo góc: `w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600`.
* **Phù hợp nhất:** Dashboard phân tích, Portfolio, Landing Page giới thiệu tính năng SaaS, Trung tâm dữ liệu nông nghiệp HoNa Fresh.
* **Cấm kỵ:** Không chia quá nhiều ô nhỏ li ti gây rối mắt; ô quan trọng nhất phải chiếm diện tích lớn gấp đôi (`col-span-2 row-span-2`).

---

## 2. CLEAN SAAS MINIMALISM (Tối Giản Doanh Nghiệp Tinh Tế)
* **Đặc tính:** Đỉnh cao của sự thanh lịch, tập trung 100% vào nội dung và khả năng đọc, không dùng các chi tiết thừa thãi.
* **Đặc điểm thị giác:**
  - Nền trang màu xám/kem nhẹ: `bg-[#F8F9FA]` hoặc `bg-[#FAFBF9]`.
  - Khối nội dung trắng tinh khôi: `bg-white border border-gray-150 rounded-2xl`.
  - Typography có độ phân cấp cực rõ: Heading đậm `font-black text-slate-900`, Body xám thanh nhã `text-slate-600 text-sm`.
  - Điểm nhấn đơn sắc hoặc một màu thương hiệu độc nhất (Accent Color).
* **Phù hợp nhất:** Ứng dụng B2B quản lý hợp đồng, phần mềm kế toán, CRM, sàn thương mại sỉ nông sản.
* **Cấm kỵ:** Không dùng quá 2 màu rực rỡ trên cùng một màn hình; không dùng font uốn lượn khó đọc.

---

## 3. ORGANIC ECO-FRESH (Sinh Thái Hữu Cơ & Nông Nghiệp Xanh)
* **Đặc tính:** Phong cách mang hơi thở thiên nhiên, tạo cảm giác tươi mới, an toàn vệ sinh, mộc mạc nhưng hiện đại.
* **Đặc điểm thị giác:**
  - Tông màu chủ đạo: Xanh lá rừng thông `#10542C`, xanh mầm non `#4CAF50`, vàng chanh hữu cơ `#8BC34A`, nền màu kem sương mờ `#F4F5F1`.
  - Hình ảnh: Ảnh chụp thực tế nông trại, giọt sương, lá rau sạch độ phân giải cao.
  - Họa tiết: Icon mầm cây, giọt nước, cảm biến nhiệt độ chuỗi lạnh.
  - Hiệu ứng: Chuyển động nhẹ nhàng như mầm cây đón nắng.
* **Phù hợp nhất:** Sàn Nông Sản HoNa Fresh, thực phẩm sạch, năng lượng tái tạo, bảo vệ môi trường.

---

## 4. GLASSMORPHISM 2.0 (Kính Mờ Trong Suốt Đa Tầng)
* **Đặc tính:** Tạo cảm giác không gian đa chiều nhờ hiệu ứng kính mờ trong suốt, nhìn xuyên qua các lớp bên dưới.
* **Đặc điểm thị giác:**
  - Lớp phủ mờ: `backdrop-blur-md bg-white/70 dark:bg-slate-900/60`.
  - Viền phản chiếu ánh sáng: `border border-white/40 dark:border-white/10`.
  - Bóng đổ tán xạ rộng: `shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]`.
  - Chiều sâu nhiều lớp: Nền có hình tròn ánh sáng mờ gradient (Glow Orb).
* **Phù hợp nhất:** Modal Popups, thanh điều hướng nổi (Floating Navbar), Card thanh toán, Ví điện tử cao cấp.
* **Cấm kỵ:** Không lạm dụng làm mờ chữ bên trong gây khó đọc; đảm bảo độ tương phản text luôn $\ge 4.5:1$.

---

## 5. DARK MODE OLED PRO (Giao Diện Tối Chuyên Nghiệp)
* **Đặc tính:** Giảm mỏi mắt tối đa, tiết kiệm pin cho màn hình OLED, tạo cảm giác công nghệ cao (High-tech) và huyền bí.
* **Đặc điểm thị giác:**
  - Nền không đen tuyệt đối `#000` mà dùng đen xám than: `#0A0D14`, `#0F172A`, `#111827`.
  - Bề mặt card nâng sáng nhẹ: `bg-slate-900/80 border border-slate-800`.
  - Màu chữ: Chữ chính trắng ngà `#F8FAFC`, chữ phụ xám chì `#94A3B8`.
  - Điểm nhấn ánh sáng dạ quang: Neon Emerald `#10B981`, Cyber Blue `#38BDF8`, Violet Glow `#818CF8`.
* **Phù hợp nhất:** Bảng điều khiển viễn trắc IoT thời gian thực, Code Editor, Crypto/Trading, Thiết bị trạm điều khiển ban đêm.

---

## 6. NEOBRUTALISM (Hiện Đại Phá Cách)
* **Đặc tính:** Nổi loạn, cá tính, tương phản cực mạnh với đường nét thô mộc đầy chủ ý.
* **Đặc điểm thị giác:**
  - Viền đen đậm sắc nét: `border-2 border-black` hoặc `border-[3px] border-black`.
  - Bóng cứng không tán xạ: `shadow-[4px_4px_0px_#000]` hoặc `shadow-[6px_6px_0px_#000]`.
  - Màu sắc bão hòa cao: Vàng chanh, cam sáng, xanh neon.
  - Phản hồi khi hover: Nút bấm lún xuống bù trừ bóng `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]`.
* **Phù hợp nhất:** Sản phẩm cho Gen Z, công cụ sáng tạo nghệ thuật, landing page sự kiện độc đáo.
* **Cấm kỵ:** Không dùng cho hệ thống y tế khẩn cấp, ngân hàng truyền thống hoặc báo cáo tài chính trang trọng.

---

## 7. AURORA UI & MESH GRADIENT (Cực Quang Đa Sắc)
* **Đặc tính:** Sử dụng các dải màu mềm mại đan xen nhau như hiện tượng cực quang trên bầu trời Bắc Cực.
* **Đặc điểm thị giác:**
  - Các mảng màu khuếch tán lớn bằng `filter blur-[80px] -z-10 opacity-40`.
  - Kết hợp 3 - 4 màu êm dịu (Pastel) như: Hồng đào `#FECDD3`, Tím oải hương `#DDD6FE`, Xanh ngọc `#A7F3D0`.
  - Nội dung phía trên giữ tối giản với kính mờ hoặc nền trắng trong trẻo.
* **Phù hợp nhất:** AI Assistant, trang Hero của Landing Page, ứng dụng Meditation, Lifestyle.

---

## 8. SKEUOMORPHISM 2.0 / NEUMORPHISM TINH GIẢN
* **Đặc tính:** Mô phỏng vật liệu thực tế (nút bấm nổi, rãnh chìm, công tắc vật lý) nhưng đã được làm sạch, không thô thiển như thời 2010.
* **Đặc điểm thị giác:**
  - Bóng đổ kép (Double Shadow): Một bóng sáng phía trên bên trái và một bóng tối phía dưới bên phải.
  - Nút bấm khi nhấn chìm có cảm giác xúc giác (Tactile feedback).
  - Vạch chia rãnh nhẹ: `inset shadow`.
* **Phù hợp nhất:** Bảng điều khiển cảm biến công nghiệp, Smart Home, thiết bị âm thanh số.

---

## BẢNG TRA CỨU NHANH THEO LĨNH VỰC DỰ ÁN

| Lĩnh vực ứng dụng | Phong cách khuyến nghị | Phong cách phụ trợ | Tránh tuyệt đối |
| :--- | :--- | :--- | :--- |
| **Sàn Nông Sản B2B (HoNa Fresh)** | **Organic Eco-Fresh** | **Clean SaaS Minimalism** | Neobrutalism, Cyberpunk |
| **Phần Mềm Quản Trị ERP / CRM** | **Clean SaaS Minimalism** | **Modern Bento Grid** | Aurora UI, Brutalism |
| **Fintech / Ngân Hàng** | **Clean SaaS** | **Glassmorphism 2.0** | Neobrutalism, Gamified |
| **Giám Sát IoT / Telemetry Xe Lạnh** | **Dark Mode OLED Pro** | **Modern Bento Grid** | Nền trắng chói lóa, Pastel |
| **Thương Mại Điện Tử Tiêu Dùng** | **Modern Bento Grid** | **Organic Eco-Fresh** | Quá nhiều chữ, Bảng biểu dày |
