# ✅ Checklist hoàn thành Setup QR Code Download

## 🎯 Trạng thái hiện tại

### ✅ BACKEND - Đã hoàn thành
- ✅ Cài đặt `firebase-admin` package
- ✅ Tạo `src/config/firebaseAdmin.js` 
- ✅ Tạo `src/utils/uploadQRCode.js`
- ✅ Cập nhật `src/controllers/giftController.js` để upload QR lên Firebase Storage
- ✅ Backend giờ trả về HTTP URL thay vì base64

### ✅ FRONTEND - Đã hoàn thành
- ✅ Cập nhật `src/utils/downloadQR.ts` hỗ trợ HTTP URL
- ✅ Code tự động phát hiện HTTP URL và sử dụng trực tiếp
- ✅ Có fallback cho trường hợp backend cũ (base64)
- ✅ Modal hiển thị QR cho user long-press nếu API Zalo lỗi

---

## 🔧 CÁC BƯỚC CẦN LÀM TIẾP

### BƯỚC 1: Setup Firebase Service Account Key ⚠️ **BẮT BUỘC**

**Thời gian:** 5 phút

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. ⚙️ **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download file JSON
6. Lưu file vào `config/serviceAccountKey.json` (tạo thư mục `config` nếu chưa có)

**Lưu ý:** File này đã được thêm vào `.gitignore` tự động.

---

### BƯỚC 2: Cấu hình Firebase Storage Rules ⚠️ **BẮT BUỘC**

**Thời gian:** 2 phút

1. Vào Firebase Console > **Storage** > **Rules**
2. Copy và paste rules sau:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // QR codes folder - public read access
    match /qr-codes/{fileName} {
      allow read: if true;
      allow write, delete: if false;
    }
  }
}
```

3. Click **Publish**

**Tại sao cần bước này?**
- Cho phép tất cả mọi người đọc (xem) ảnh QR
- Chỉ có server mới có quyền tạo/xóa QR code

---

### BƯỚC 3: Deploy Backend

**Thời gian:** 5-10 phút

```bash
# Đảm bảo file serviceAccountKey.json đã có trong config/
cd backend

# Deploy lên server của bạn (ví dụ)
git add .
git commit -m "feat: upload QR to Firebase Storage"
git push origin main

# Hoặc deploy thủ công
npm run build
npm run deploy
```

**Lưu ý:** Đảm bảo file `serviceAccountKey.json` có trên server production.

---

### BƯỚC 4: Deploy Frontend

**Thời gian:** 3-5 phút

```bash
cd frontend

# Deploy Zalo Mini App
npm run deploy
```

---

### BƯỚC 5: Test hoàn chỉnh ⚠️ **QUAN TRỌNG**

**Thời gian:** 5-10 phút

#### Test 1: Test Backend API

Dùng Postman hoặc curl:

```bash
curl -X POST https://api-coffee.8am.vn/api/gifts/assign \
  -H "Content-Type: application/json" \
  -d '{
    "giftId": "test-gift-123",
    "userId": "test-user-456",
    "userInfo": {
      "name": "Test User",
      "phone": "0123456789"
    }
  }'
```

**Kiểm tra response:**
```json
{
  "qrCode": "https://storage.googleapis.com/your-bucket/qr-codes/qr-xxx.png"
  // ✅ Phải là HTTP URL, KHÔNG phải data:image/png;base64,...
}
```

#### Test 2: Test URL trong Browser

1. Copy URL từ `qrCode` field
2. Mở trong browser
3. **Kết quả mong đợi:** Thấy ảnh QR code hiển thị

#### Test 3: Test trên Zalo Mini App (điện thoại)

1. Mở app trên điện thoại Zalo
2. Nhận một món quà
3. Xem QR code
4. Bấm nút **"Tải QR"**
5. **Kết quả mong đợi:** 
   - ✅ Thông báo "Đã lưu mã QR vào thư viện ảnh!"
   - ✅ Mở app "Ảnh" trên điện thoại, thấy QR code đã được lưu

---

## 🎉 KẾT QUẢ MONG ĐỢI

### Trước khi sửa:
- ❌ User bấm "Tải QR" → Lỗi
- ❌ QR code không tải được về điện thoại
- ❌ Lỗi: `code: -2005, message: 'Định dạng tập tin không được hỗ trợ'`

### Sau khi sửa:
- ✅ User bấm "Tải QR" → Thành công
- ✅ QR code tự động lưu vào thư viện ảnh điện thoại
- ✅ User có thể mang QR đến cửa hàng để đổi quà
- ✅ Response API nhẹ hơn (URL thay vì base64)
- ✅ Performance tốt hơn (image được cache)

---

## 🆘 Troubleshooting

### Vấn đề 1: Vẫn thấy lỗi -2005

**Nguyên nhân:** Backend chưa được deploy hoặc vẫn trả base64.

**Cách kiểm tra:**
```bash
# Test API và xem qrCode field
curl https://api-coffee.8am.vn/api/gifts/assign -X POST ...
```

**Giải pháp:**
- Kiểm tra backend đã deploy chưa
- Kiểm tra `serviceAccountKey.json` đã có trên server chưa
- Check logs backend xem có lỗi gì không

### Vấn đề 2: URL trả về nhưng không mở được

**Nguyên nhân:** Firebase Storage Rules chưa cho phép public read.

**Giải pháp:**
- Vào Firebase Console > Storage > Rules
- Cập nhật rules như BƯỚC 2
- Click Publish

### Vấn đề 3: "403 Forbidden" khi mở URL

**Nguyên nhân:** File chưa được set public.

**Giải pháp:**
- Check code backend có gọi `await file.makePublic()` không
- Hoặc thêm vào `uploadQRCode.js`:
```javascript
await file.makePublic();
```

### Vấn đề 4: Vẫn hiển thị modal long-press

**Nguyên nhân:** Backend vẫn trả base64 hoặc lỗi -2005 vẫn xảy ra.

**Cách kiểm tra:**
- Mở DevTools trên Zalo Mini App
- Check console logs xem:
  - `✅ Using Firebase Storage URL` → Backend đã đúng
  - `⚠️ Backend đang trả về base64` → Backend chưa update

**Giải pháp:**
- Deploy backend mới
- Kiểm tra serviceAccountKey.json
- Test API trực tiếp

---

## 📊 Metrics để theo dõi

Sau khi deploy, theo dõi:

1. **Firebase Storage:**
   - Số lượng file trong folder `qr-codes/`
   - Dung lượng sử dụng
   - Số requests đến Storage

2. **Backend Logs:**
   - Log "✅ QR Code uploaded" khi assign gift
   - Log "🗑️ QR Code deleted" khi redeem gift (nếu có)

3. **User Behavior:**
   - Có bao nhiêu user nhấn "Tải QR"?
   - Có bao nhiêu lần tải thành công?
   - Có lỗi gì không?

---

## 📚 Files quan trọng

### Backend:
- `config/serviceAccountKey.json` - **BÍ MẬT, không commit lên Git**
- `src/config/firebaseAdmin.js` - Khởi tạo Firebase Admin SDK
- `src/utils/uploadQRCode.js` - Upload/Delete QR functions
- `src/controllers/giftController.js` - API assign gift

### Frontend:
- `src/utils/downloadQR.ts` - Download QR function
- `src/components/GiftDetailModal.tsx` - Modal hiển thị QR
- `src/components/GiftQRModal.tsx` - Modal nhận quà

---

## 🎯 Next Steps (Optional)

### Cải thiện thêm:

1. **Analytics:**
   - Track số lần tải QR thành công/thất bại
   - Track thời gian trung bình để tải

2. **Optimization:**
   - Thêm loading state khi đang tải
   - Cache QR URL ở frontend
   - Lazy load QR image

3. **Cleanup:**
   - Tự động xóa QR code sau khi redeem
   - Cronjob xóa QR code cũ (> 30 ngày)

4. **Monitoring:**
   - Alert khi Firebase Storage đầy
   - Alert khi có lỗi upload
   - Dashboard theo dõi usage

---

## ✅ Checklist tổng thể

- [ ] **Bước 1:** Tạo và lưu `serviceAccountKey.json`
- [ ] **Bước 2:** Cấu hình Firebase Storage Rules
- [ ] **Bước 3:** Deploy Backend
- [ ] **Bước 4:** Deploy Frontend
- [ ] **Bước 5.1:** Test Backend API với Postman
- [ ] **Bước 5.2:** Test URL trong browser
- [ ] **Bước 5.3:** Test trên Zalo Mini App (điện thoại)
- [ ] **Verification:** Xác nhận QR code xuất hiện trong thư viện ảnh điện thoại

---

**Sau khi hoàn thành tất cả checklist ở trên, tính năng tải QR về điện thoại sẽ hoạt động hoàn hảo! 🎉**

---

**Tạo bởi:** AI Assistant  
**Ngày:** 27/11/2025  
**Status:** ✅ Sẵn sàng deploy

