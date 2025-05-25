# 📧 Hướng dẫn thiết lập EmailJS cho hệ thống gửi email

## 🎯 Tổng quan

EmailJS cho phép gửi email trực tiếp từ JavaScript mà không cần backend server. Dịch vụ này miễn phí cho 200 email/tháng.

## 📋 Các bước thiết lập

### Bước 1: Tạo tài khoản EmailJS

1. Truy cập [https://emailjs.com](https://emailjs.com)
2. Click **"Sign Up"** để tạo tài khoản miễn phí
3. Xác nhận email và đăng nhập

### Bước 2: Tạo Email Service

1. Trong dashboard, click **"Email Services"**
2. Click **"Add New Service"**
3. Chọn email provider (Gmail, Outlook, Yahoo, etc.)
4. Nhập thông tin đăng nhập email của bạn
5. Test connection và save
6. **Lưu lại Service ID** (dạng: `service_xxxxxxx`)

### Bước 3: Tạo Email Template

1. Click **"Email Templates"**
2. Click **"Create New Template"**
3. Thiết lập template như sau:

#### Template Settings:
- **Template Name**: `Match Notification`
- **Template ID**: `template_match_notification`

#### Template Content:

**Subject:**
```
{{subject}}
```

**Content (HTML):**
```html
{{{html_content}}}
```

#### Template Variables:
Chỉ cần 2 biến đơn giản:
- `{{subject}}` - Tiêu đề email
- `{{{html_content}}}` - Nội dung HTML hoàn chỉnh (dùng 3 dấu {} để render HTML)

#### Lưu ý quan trọng:
- ✅ **Đơn giản hóa**: Chỉ cần 2 biến thay vì 10+ biến
- ✅ **Tự động thay thế**: Hệ thống tự động thay thế thông tin trận đấu
- ✅ **HTML hoàn chỉnh**: Gửi email với HTML template đầy đủ từ web
- ✅ **Không cần chỉnh sửa**: Không cần thay đổi template trên EmailJS dashboard

4. Click **"Save"** và **lưu lại Template ID**

### Bước 4: Lấy Public Key

1. Vào **"Account"** → **"General"**
2. Tìm **"Public Key"**
3. **Lưu lại Public Key** (dạng: `user_xxxxxxxxxxxxxxxx`)

### Bước 5: Cấu hình trong ứng dụng

1. Trong ứng dụng, click **"Cấu hình Email"**
2. Nhập thông tin:
   - **Service ID**: `service_xxxxxxx`
   - **Template ID**: `template_match_notification`
   - **Public Key**: `user_xxxxxxxxxxxxxxxx`
3. Click **"Lưu cấu hình"**

## 🧪 Test gửi email

1. Tạo một trận đấu mới
2. Thêm email của bạn vào danh sách
3. Chọn template và gửi thử
4. Kiểm tra hộp thư (bao gồm spam folder)

## ⚠️ Lưu ý quan trọng

### Giới hạn miễn phí:
- **200 email/tháng** cho tài khoản miễn phí
- **50 email/ngày** tối đa

### Bảo mật:
- **KHÔNG** chia sẻ Public Key công khai
- Chỉ sử dụng cho frontend applications
- EmailJS tự động validate domain

### Troubleshooting:

**Lỗi "Invalid template":**
- Kiểm tra Template ID có đúng không
- Đảm bảo template đã được save

**Lỗi "Service not found":**
- Kiểm tra Service ID có đúng không
- Đảm bảo service đã được kích hoạt

**Email không đến:**
- Kiểm tra spam folder
- Verify email service connection
- Kiểm tra quota còn lại

**Lỗi CORS:**
- EmailJS tự động handle CORS
- Đảm bảo domain được whitelist (nếu cần)

## 🔧 Template mẫu nâng cao

Để có email đẹp hơn, bạn có thể sử dụng template này:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">⚽ THÔNG BÁO TRẬN ĐẤU</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{to_name}},</h2>

                            <div style="margin: 20px 0;">
                                {{{html_content}}}
                            </div>

                            <!-- Match Info -->
                            <div style="background: #f8f9ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #667eea; margin-top: 0;">📋 Thông tin trận đấu:</h3>
                                <p><strong>🏠 Đội nhà:</strong> {{home_team}}</p>
                                <p><strong>✈️ Đội khách:</strong> {{away_team}}</p>
                                <p><strong>📅 Ngày:</strong> {{match_date}}</p>
                                <p><strong>⏰ Giờ:</strong> {{match_time}}</p>
                                <p><strong>📍 Địa điểm:</strong> {{match_venue}}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9ff; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                Trân trọng,<br>
                                <strong>{{from_name}}</strong>
                            </p>
                            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                                Email này được gửi tự động từ hệ thống quản lý trận đấu.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra [EmailJS Documentation](https://www.emailjs.com/docs/)
2. Xem [FAQ](https://www.emailjs.com/docs/faq/)
3. Liên hệ support@emailjs.com

---

**Lưu ý**: Sau khi thiết lập xong, hệ thống sẽ gửi email thật đến địa chỉ `lengocgiau2k3@gmail.com` và các email khác trong danh sách!
