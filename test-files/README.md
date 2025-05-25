# Hướng dẫn test tính năng xem trước file

## 🎯 Tính năng mới

Bây giờ bạn có thể xem trực tiếp file **giống 100% với bản gốc**:

### 📄 **PDF Files**
- Hiển thị từng trang PDF như hình ảnh
- Giữ nguyên layout, font, màu sắc
- Zoom và scroll để xem chi tiết

### 📝 **Word Documents (.docx)**
- Chuyển đổi thành HTML với định dạng gốc
- Giữ nguyên font Times New Roman
- Bảo toàn bold, italic, headings
- Hiển thị như document viewer

### 📄 **Text Files (.txt)**
- Font Consolas monospace
- Giữ nguyên khoảng cách, thụt lề
- Hiển thị chính xác như Notepad

## 🧪 Cách test

1. **Mở ứng dụng** tại `http://localhost:3001`
2. **Vào Chat AI** (nút Bot)
3. **Upload file** (PDF, DOCX, TXT)
4. **Click nút "Xem trước" (👁️)**
5. **Xem kết quả** giống 100% file gốc

## 📁 Files test

- `test-files/sample.txt` - Text file
- `test-files/sample-word.txt` - Text mô phỏng Word
- Tạo file PDF, DOCX thật để test

## ✨ Kết quả mong đợi

- **PDF**: Hiển thị từng trang như hình ảnh
- **DOCX**: HTML với format gốc
- **TXT**: Monospace font, giữ nguyên format
- **Images**: Hiển thị full size

**Hãy test và xem sự khác biệt!** 🚀
