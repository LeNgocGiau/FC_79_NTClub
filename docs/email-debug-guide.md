# 🔍 Hướng dẫn Debug Email - Khắc phục lỗi chỉ gửi đến một email

## 🎯 Vấn đề hiện tại
Email chỉ được gửi đến `lengocgiau2k3@gmail.com` mặc dù có nhiều email khác trong danh sách.

## 🔧 Các cải tiến đã thực hiện

### 1. **Logging chi tiết hơn**
- Thêm timestamp và recipient_id để tránh caching
- Hiển thị progress từng email
- Log chi tiết response từ EmailJS

### 2. **Retry mechanism**
- Tự động thử lại 2 lần nếu gửi thất bại
- Timeout 30 giây cho mỗi lần gửi
- Delay 2 giây giữa các lần retry

### 3. **Validation tốt hơn**
- Kiểm tra response status chi tiết hơn
- Error handling cải thiện
- Delay 1.5 giây giữa các email

## 🧪 Cách kiểm tra và debug

### Bước 1: Mở Developer Console
1. Nhấn `F12` hoặc `Ctrl+Shift+I`
2. Chuyển sang tab **Console**
3. Xóa console: `console.clear()`

### Bước 2: Test gửi email
1. Thêm ít nhất 3 email khác nhau:
   - `lengocgiau2k3@gmail.com`
   - `giau213@gmail.com` 
   - Email thứ 3 của bạn
2. Chọn tất cả email
3. Gửi email và quan sát console

### Bước 3: Phân tích log
Tìm các dòng log sau:

```
📧 [1/3] Preparing email for: lengocgiau2k3@gmail.com
📤 [Attempt 1] Sending to lengocgiau2k3@gmail.com with template: template_xxx
📬 EmailJS response for lengocgiau2k3@gmail.com: {status: 200, text: "OK"}
✅ Email sent successfully to: lengocgiau2k3@gmail.com

📧 [2/3] Preparing email for: giau213@gmail.com
📤 [Attempt 1] Sending to giau213@gmail.com with template: template_xxx
📬 EmailJS response for giau213@gmail.com: {status: 200, text: "OK"}
✅ Email sent successfully to: giau213@gmail.com
```

## 🔍 Các trường hợp có thể xảy ra

### Trường hợp 1: Code gửi đúng nhưng email không đến
**Triệu chứng:**
- Console hiển thị "✅ Email sent successfully" cho tất cả email
- Chỉ có `lengocgiau2k3@gmail.com` nhận được email

**Nguyên nhân có thể:**
- **Spam filter**: Email khác bị đưa vào spam
- **EmailJS template**: Cấu hình template sai
- **Email provider**: Gmail/Yahoo/Outlook chặn email

**Giải pháp:**
1. Kiểm tra thư mục **Spam/Junk** của tất cả email
2. Kiểm tra cấu hình EmailJS template
3. Test với email provider khác

### Trường hợp 2: Lỗi gửi email
**Triệu chứng:**
- Console hiển thị "❌ Error sending email" cho một số email
- Có retry attempts

**Nguyên nhân có thể:**
- **Rate limiting**: Gửi quá nhanh
- **Invalid email**: Email không hợp lệ
- **EmailJS quota**: Đã hết quota

**Giải pháp:**
1. Tăng delay giữa các email
2. Kiểm tra email hợp lệ
3. Kiểm tra quota EmailJS

### Trường hợp 3: Template/Service lỗi
**Triệu chứng:**
- Console hiển thị lỗi template hoặc service
- Tất cả email đều thất bại

**Nguyên nhân có thể:**
- **Template ID sai**: Template không tồn tại
- **Service ID sai**: Service không hoạt động
- **Public Key sai**: Key không đúng

**Giải pháp:**
1. Kiểm tra lại cấu hình EmailJS
2. Test với template mặc định
3. Tạo template mới

## 📋 Checklist debug

### ✅ Kiểm tra cơ bản
- [ ] Tất cả email đều được chọn (checkbox tích)
- [ ] EmailJS đã được cấu hình đúng
- [ ] Internet connection ổn định
- [ ] Console không có lỗi JavaScript

### ✅ Kiểm tra EmailJS
- [ ] Service ID đúng và hoạt động
- [ ] Template ID đúng (hoặc để trống)
- [ ] Public Key đúng
- [ ] Quota còn đủ (200 email/tháng)

### ✅ Kiểm tra email
- [ ] Tất cả email đều hợp lệ
- [ ] Kiểm tra thư mục Spam
- [ ] Test với email provider khác
- [ ] Kiểm tra email settings (allow external emails)

## 🚀 Test nhanh

### Test 1: Gửi từng email riêng lẻ
1. Chọn chỉ 1 email: `giau213@gmail.com`
2. Gửi email
3. Kiểm tra có nhận được không

### Test 2: Gửi 2 email cùng lúc
1. Chọn 2 email: `lengocgiau2k3@gmail.com` và `giau213@gmail.com`
2. Gửi email
3. So sánh kết quả

### Test 3: Thay đổi thứ tự
1. Đặt `giau213@gmail.com` lên đầu danh sách
2. Gửi email
3. Xem email nào nhận được

## 📞 Nếu vẫn không được

Nếu sau khi thực hiện tất cả các bước trên mà vẫn chỉ có 1 email nhận được, hãy:

1. **Copy toàn bộ console log** và gửi cho tôi
2. **Chụp ảnh màn hình** danh sách email đã chọn
3. **Kiểm tra EmailJS dashboard** xem có log gì không
4. **Test với EmailJS template khác** hoặc tạo template mới

---

**Lưu ý**: Với các cải tiến mới, hệ thống sẽ hiển thị chi tiết email nào thành công và email nào thất bại trong thông báo kết quả.
