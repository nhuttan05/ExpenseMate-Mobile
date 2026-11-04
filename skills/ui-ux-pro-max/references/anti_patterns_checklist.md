# CHECKLIST 119 ANTI-PATTERNS & KIỂM ĐỊNH KHẢ NĂNG TIẾP CẬN WCAG 2.2

Để đảm bảo mọi giao diện không bao giờ rơi vào cái bẫy "AI Slop", tài liệu này phân loại các lỗi cấm kỵ thành các nhóm kiểm định bắt buộc.

---

## 1. NHÓM 1: CÁC DẤU HIỆU CỦA "AI SLOP" (CẤM TUYỆT ĐỐI)
- [ ] **Lỗi 1: Gradient Tím - Hồng - Xanh rẻ tiền lặp lại vô tội vạ:** Nút bấm hay header nào cũng phủ gradient tím mộng mơ không liên quan gì đến thương hiệu. *(Khắc phục: Dùng màu thương hiệu vững chắc, gradient đa tầng tinh tế opacity thấp).*
- [ ] **Lỗi 2: 3 Thẻ Card "Song Sinh" đơn điệu:** Trang nào cũng chỉ gồm 3 thẻ card nằm ngang giống hệt nhau, không có nhịp điệu thị giác. *(Khắc phục: Áp dụng Bento Grid, khối to khối nhỏ, thẻ ngang thẻ dọc).*
- [ ] **Lỗi 3: Lạm dụng Font Inter cho mọi thứ:** Không thèm quan tâm ngành nghề, tiêu đề hay nội dung đều dùng 1 font duy nhất. *(Khắc phục: Xem `references/typography_guide.md` để phối hợp cặp font có cá tính).*
- [ ] **Lỗi 4: Shadow xám xịt, đen ngòm như bôi nhọ:** Dùng `shadow-xl` mặc định với opacity cao tạo cảm giác bẩn màn hình. *(Khắc phục: Dùng bóng đa tầng pha một chút sắc màu nền `shadow-[0_4px_20px_rgba(16,84,44,0.06)]`).*
- [ ] **Lỗi 5: Biểu tượng (Icon) trơ trọi không mục đích:** Đặt hàng loạt icon nhưng không có label chú thích, người dùng không hiểu bấm vào sẽ xảy ra chuyện gì.

---

## 2. NHÓM 2: CÔNG THÁI HỌC & DI ĐỘNG (MOBILE & ERGONOMICS)
- [ ] **Lỗi 6: Vùng bấm quá nhỏ (< 44x44px):** Nút icon hoặc checkbox nhỏ tí hon khiến người dùng điện thoại bấm trượt liên tục. *(Quy định: Vùng chạm touch target tối thiểu phải là $44 \times 44\text{px}$).*
- [ ] **Lỗi 7: Tràn ngang màn hình (Horizontal Scroll Bug):** Bảng biểu hoặc flex container không có `overflow-x-auto` làm cả trang web bị trượt ngang trên iPhone.
- [ ] **Lỗi 8: Nút hành động chính nằm ngoài tầm ngón tay cái:** Trên mobile, nút quan trọng đặt tít trên góc trên cùng bên trái thay vì cố định đáy màn hình (Bottom Fixed Bar).
- [ ] **Lỗi 9: Bàn phím ảo che mất ô Input:** Khi bấm vào ô nhập liệu trên điện thoại, bàn phím trồi lên che mất nút "Lưu" hoặc "Xác nhận".
- [ ] **Lỗi 10: Modal popup không cuộn được trên màn hình thấp:** Modal cố định chiều cao, người dùng điện thoại xoay ngang không bấm được nút "Đồng ý" ở đáy. *(Khắc phục: Luôn có `max-h-[90vh] overflow-y-auto`).*

---

## 3. NHÓM 3: KHẢ NĂNG TIẾP CẬN & TƯƠNG PHẢN (ACCESSIBILITY WCAG 2.2)
- [ ] **Lỗi 11: Tương phản chữ/nền yếu (< 4.5:1):** Chữ xám nhạt trên nền trắng hoặc chữ vàng trên nền xanh nhạt.
- [ ] **Lỗi 12: Chỉ dựa vào màu sắc để báo trạng thái:** Báo lỗi chỉ bằng màu đỏ mà không có biểu tượng cảnh báo `AlertTriangle` hoặc lời giải thích bằng chữ (người mù màu sẽ không nhận biết được).
- [ ] **Lỗi 13: Mất đường viền tiêu điểm khi dùng phím Tab (Focus Visible Outline):** Viết `outline-none` mà không bổ sung `focus-visible:ring-2 focus-visible:ring-emerald-600`.
- [ ] **Lỗi 14: Ảnh không có thẻ `alt` hoặc icon không có `aria-hidden`:** Khiến phần mềm đọc màn hình cho người khiếm thị đọc loạn xạ các đoạn mã SVG vô nghĩa.
- [ ] **Lỗi 15: Chữ trong ảnh:** Chèn text quan trọng vào ảnh tĩnh thay vì để HTML text, khiến người dùng không thể copy hoặc dịch tự động.

---

## 4. NHÓM 4: BẢNG BIỂU & TRÌNH BÀY DỮ LIỆU (DATA DENSITY & TABLES)
- [ ] **Lỗi 16: Số học căn trái lộn xộn:** Cột số kg, tiền VNĐ căn lề trái làm mắt người dùng không thể so sánh được hàng đơn vị, chục, trăm. *(Quy tắc: Số luôn căn phải `text-right tabular-nums`).*
- [ ] **Lỗi 17: Bảng trống trơn không có Empty State:** Khi tìm kiếm không có kết quả, bảng chỉ hiện mỗi header trống hoác. *(Khắc phục: Hiển thị minh họa + lời nhắn "Không tìm thấy nông sản phù hợp").*
- [ ] **Lỗi 18: Bảng quá 8 cột trên điện thoại mà không hỗ trợ Responsive:** Không chuyển đổi sang dạng thẻ Card trên mobile (`hidden md:table-cell`).
- [ ] **Lỗi 19: Tiêu đề cột dùng chữ thường:** Tiêu đề bảng không phân biệt được với nội dung bên dưới. *(Khắc phục: Dùng `uppercase tracking-wider text-[11px] font-bold text-slate-500`).*
- [ ] **Lỗi 20: Thiếu trạng thái Loading Skeleton:** Khi mạng chậm, bảng nhảy giật cục hoặc hiện dòng chữ "Loading..." thô kệch.

---

## 5. NHÓM 5: CHUYỂN ĐỘNG & TƯƠNG TÁC (MOTION & FEEDBACK)
- [ ] **Lỗi 21: Bấm nút không có phản hồi tức thì:** Người dùng bấm nút "Thanh toán", hệ thống đơ ra $2$ giây không có hiệu ứng xoay spinner hay disable nút, khiến họ bấm 5 lần liên tục sinh ra trùng đơn.
- [ ] **Lỗi 22: Animation quá chậm (> 400ms):** Menu mở ra mất cả giây làm người dùng cảm thấy ứng dụng ì ạch. *(Thời gian vàng: $150\text{ms} - 250\text{ms}$).*
- [ ] **Lỗi 23: Không hỗ trợ `prefers-reduced-motion`:** Những người bị chứng tiền đình hoặc say xe sẽ bị chóng mặt khi thấy các hiệu ứng phóng to thu nhỏ liên tục.
- [ ] **Lỗi 24: Toast thông báo che mất nút bấm:** Thông báo thành công nhảy ra ngay chính giữa nút quan trọng người dùng chuẩn bị bấm tiếp theo.
- [ ] **Lỗi 25: Hộp thoại xác nhận (Confirm Dialog) ghi chữ mơ hồ:** Hỏi: *"Bạn có chắc muốn hủy?"*, nút ghi *"Có"* và *"Không"*. *(Quy chuẩn: Nút phải ghi rõ hành động: "Vẫn Hủy Hợp Đồng" và "Giữ Lại").*
