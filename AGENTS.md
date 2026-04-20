## Prompt Tổng thể

"Tôi muốn tạo một ứng dụng web đơn giản (Full-stack) với các yêu cầu sau:
1. **Frontend & Backend:** Sử dụng Next.js (App Router) để có thể deploy dễ dàng lên Vercel.
2. **Database:** Sử dụng MongoDB (thư viện Mongoose).
3. **Tính năng:** Một trang web quản lý chi tiêu và chia tiền đơn giản (đây là 1 trong những tính năng của hệ thống, sau tôi có thể sẽ phát triển thêm):
  - Có thể đăng nhập, tạo tài khoản (nhưng chưa dùng được ngay, cần admin phê duyệt thì mới được dùng). Admin có thể xem danh sách tài khoản và phê duyệt.  
  - Chỉ có admin có quyền cao nhất, có thể xem, thêm, sửa, xóa chi tiêu của tất cả mọi người. Còn user chỉ có thể xem, thêm, sửa, xóa chi tiêu của mình.
  - Tạo các nhóm chi tiêu (ví dụ: nhóm bạn bè, nhóm gia đình)
  - Có giao diện thêm chi tiêu, thu chi (ai trả, chi cho những ai, số tiền, mô tả, ngày chi tiêu)
  - Hiển thị danh sách
  - Có thể sửa xóa chi tiêu.
  - Có chức năng chia tiền (chia đều hoặc chia theo tỉ lệ, ai phải trả cho ai bao nhiêu để kết quả được cân bằng)
4. **Yêu cầu kỹ thuật:**
  - Code bằng TypeScript.
  - Sử dụng Tailwind CSS để làm giao diện nhanh (đẹp và tối giản).
  - Cấu trúc thư mục chuẩn Next.js để có thể deploy ngay lập tức dễ dàng qua Vercel.
  - Sử dụng pattern 'Singleton' để tránh việc tạo quá nhiều kết nối khi hot-reload trong môi trường Development.
  - MONGODB_URI là biến môi trường trên Vercel."

Node version: 22.20.0