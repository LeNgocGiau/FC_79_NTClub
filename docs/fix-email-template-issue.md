# 🔧 Khắc phục lỗi Email Template - Email gửi sai địa chỉ

## 🎯 Vấn đề hiện tại

**Triệu chứng:** 
- Console log hiển thị gửi email đến `nguyenthanhphatnkedu@gmail.com`
- Nhưng email thực tế được gửi đến `lengocgiau2k3@gmail.com`
- EmailJS response status = 200 (thành công)

**Nguyên nhân:** Template `template_naei5zi` trên EmailJS dashboard đã được cấu hình cứng (hardcode) địa chỉ email thay vì sử dụng biến động.

## 🛠️ Cách khắc phục

### **Phương án 1: Sửa template hiện tại**

1. **Đăng nhập EmailJS Dashboard:**
   - Truy cập: https://dashboard.emailjs.com
   - Đăng nhập với tài khoản của bạn

2. **Vào Email Templates:**
   - Click **"Email Templates"** ở menu bên trái
   - Tìm template **`template_naei5zi`**
   - Click **"Edit"**

3. **Kiểm tra Settings:**
   - **To Email:** Phải là `{{to_email}}` (KHÔNG phải email cố định)
   - **To Name:** Phải là `{{to_name}}`
   - **From Name:** Có thể là `{{from_name}}` hoặc tên cố định
   - **Reply To:** Có thể là `{{reply_to}}` hoặc email cố định

4. **Kiểm tra Content:**
   - **Subject:** `{{subject}}`
   - **Content:** `{{{html_content}}}`

5. **Save template** và test lại

### **Phương án 2: Tạo template mới**

1. **Tạo New Template:**
   - Click **"Create New Template"**
   - Template Name: `template_simple`

2. **Cấu hình Settings:**
   ```
   To Email: {{to_email}}
   To Name: {{to_name}}
   From Name: FCHCMUST
   From Email: (email của bạn)
   Reply To: noreply@fchcmust.com
   ```

3. **Cấu hình Content:**
   ```
   Subject: {{subject}}
   
   Content (HTML):
   {{{html_content}}}
   ```

4. **Save template**

5. **Cập nhật Template ID:**
   - Trong ứng dụng, vào **"Cấu hình Email"**
   - Thay đổi Template ID thành `template_simple`
   - Save cấu hình

### **Phương án 3: Test bypass template**

1. **Sử dụng nút "🔧 Test No Template":**
   - Nút này sẽ test với template đơn giản
   - Bỏ qua template hiện tại có thể bị lỗi

2. **Nếu test thành công:**
   - Tạo template mới theo Phương án 2
   - Hoặc sửa template hiện tại theo Phương án 1

## 🧪 Cách test

### **Test 1: Kiểm tra template hiện tại**
1. Thêm email `nguyenthanhphatnkedu@gmail.com` vào danh sách
2. Click nút 🧪 bên cạnh email đó
3. Kiểm tra email có đến đúng địa chỉ không

### **Test 2: Test bypass template**
1. Click nút **"🔧 Test No Template"**
2. Kiểm tra email có đến đúng địa chỉ không

### **Test 3: Test với template mới**
1. Tạo `template_simple` theo hướng dẫn
2. Cập nhật Template ID trong cấu hình
3. Test lại

## 📋 Template mẫu đúng

### **Settings:**
```
Service: (Service ID của bạn)
Template ID: template_simple
To Email: {{to_email}}
To Name: {{to_name}}
From Name: FCHCMUST - Câu lạc bộ bóng đá
From Email: (email của bạn)
Reply To: noreply@fchcmust.com
```

### **Content:**
```
Subject: {{subject}}

HTML Content:
{{{html_content}}}
```

### **Lưu ý quan trọng:**
- ✅ **To Email** phải là `{{to_email}}` (có dấu ngoặc nhọn)
- ❌ **KHÔNG** được là email cố định như `lengocgiau2k3@gmail.com`
- ✅ Sử dụng 3 dấu ngoặc `{{{html_content}}}` để render HTML
- ✅ Subject và content đều sử dụng biến động

## 🔍 Debug steps

1. **Kiểm tra EmailJS Dashboard:**
   - Template settings có đúng không?
   - To Email có phải là `{{to_email}}` không?

2. **Test với template đơn giản:**
   - Tạo template chỉ có text đơn giản
   - Không dùng HTML phức tạp

3. **Kiểm tra Service:**
   - Service có hoạt động bình thường không?
   - Có bị giới hạn quota không?

4. **Test với email khác:**
   - Thử gửi đến email provider khác (Yahoo, Outlook)
   - Xem có cùng vấn đề không

## 📞 Nếu vẫn không được

Nếu sau khi thực hiện tất cả các bước trên mà vẫn gặp vấn đề:

1. **Chụp ảnh màn hình** cấu hình template trên EmailJS dashboard
2. **Copy console log** đầy đủ
3. **Test với template hoàn toàn mới** (tên khác)
4. **Kiểm tra email service** trên EmailJS có hoạt động không

---

**Kết luận:** Vấn đề chính là template `template_naei5zi` đã được cấu hình sai. Hãy sửa lại hoặc tạo template mới theo hướng dẫn trên.
