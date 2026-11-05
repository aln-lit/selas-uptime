# selas-uptime

Kiểm tra từ bên ngoài, 5 phút một lần, cho Selas và BTC Brain (anh Lit yêu cầu 05/11/2026; phiên BTC Brain và phiên Selas thống nhất phương án A).

## Kiểm gì
`check.mjs` chỉ đọc địa chỉ công khai, không có mật khẩu hay khóa nào.

| Điểm | Đạt khi |
|---|---|
| `brain.getselas.com/` | 200, có chữ "BTC Brain" |
| `brain.getselas.com/api/brain/live/v1/view` | 200, lần đọc mới nhất cách đây dưới 3 giờ (máy chủ tính lại mỗi giờ) |
| `brain.getselas.com/admin/` | vẫn khóa (302/401/403) |
| `getselas.com/` | 200, tiêu đề SELAS |
| `getselas.com/faq.html` | 200, có `FAQPage` |
| `pilot.getselas.com/` | 401 kèm `WWW-Authenticate: Basic` (cổng mật khẩu còn sống) |
| Chứng chỉ TLS của 3 tên miền | còn ít nhất 14 ngày |

Chạy thử ở máy: `node check.mjs` (Node 20 trở lên).

## Báo về đâu: hai kênh
1. **Repo này:** một lượt chạy đỏ thì GitHub gửi email cho tài khoản sửa workflow gần nhất (`aln-lit`). Bật trong GitHub: Settings → Notifications → Actions → "Send notifications for failed workflows only".
2. **Kiểm tra bên trong máy chủ Selas:** chạy riêng, báo về email quản trị của Selas (chi tiết ở tài liệu vận hành nội bộ, không để trong repo public này).

Repo này lấp chỗ kiểm tra bên trong không thấy được: khi cả một máy chủ không còn truy cập được.

## Lưu ý
- GitHub có thể chạy lịch trễ vài phút.
- Lượt "heartbeat" mỗi thứ Hai ghi `last-run.txt` để GitHub không tạm dừng lịch sau 60 ngày repo không có hoạt động.
- Tắt tạm: Actions → uptime → Disable workflow.
