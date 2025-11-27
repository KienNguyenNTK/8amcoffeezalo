# 📱 Hướng dẫn sửa Backend để tải QR Code về điện thoại Zalo

## 🎯 Vấn đề
Zalo Mini App API `saveImageToGallery` **KHÔNG hỗ trợ** lưu ảnh từ:
- ❌ Base64 string (`imageBase64Data`)
- ❌ Blob URL (`blob:https://...`)
- ❌ Data URL (`data:image/png;base64,...`)

**Zalo chỉ hỗ trợ:** ✅ HTTP/HTTPS URL công khai

## 🎯 Giải pháp
Backend cần **upload QR code lên Firebase Storage** và trả về **HTTP URL** thay vì base64.

---

## 📋 CÁC BƯỚC THỰC HIỆN

### BƯỚC 1: Cài đặt Firebase Admin SDK

```bash
npm install firebase-admin qrcode
```

---

### BƯỚC 2: Lấy Service Account Key từ Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. ⚙️ Project Settings > **Service Accounts**
4. Click **Generate New Private Key**
5. Download file JSON
6. Lưu file vào `config/serviceAccountKey.json` (hoặc đường dẫn khác)

⚠️ **LƯU Ý:** File này chứa thông tin bí mật, thêm vào `.gitignore`:

```
# .gitignore
config/serviceAccountKey.json
```

---

### BƯỚC 3: Khởi tạo Firebase Admin

Tạo file: `config/firebase.js`

```javascript
const admin = require('firebase-admin');

// Load service account key
const serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com' // ⚠️ Thay bằng Storage Bucket của bạn
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
```

**Cách lấy Storage Bucket name:**
- Firebase Console > Storage > Files
- URL sẽ có dạng: `gs://your-project-id.appspot.com`
- Lấy phần `your-project-id.appspot.com`

---

### BƯỚC 4: Tạo Utility Function Upload QR

Tạo file: `utils/uploadQRCode.js`

```javascript
const { bucket } = require('../config/firebase');
const QRCode = require('qrcode');

/**
 * Generate QR Code và upload lên Firebase Storage
 * @param {string} data - Dữ liệu để tạo QR code
 * @param {string} fileName - Tên file (ví dụ: qr-assignment-123.png)
 * @returns {Promise<string>} - Public URL của QR code
 */
async function generateAndUploadQRCode(data, fileName) {
  try {
    console.log('🔄 Generating QR code for:', fileName);

    // 1. Generate QR code buffer (PNG format)
    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('✅ QR code generated, size:', qrBuffer.length, 'bytes');

    // 2. Upload lên Firebase Storage
    const file = bucket.file(`qr-codes/${fileName}`);
    
    await file.save(qrBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache 1 năm
      },
      public: true, // Cho phép public access
    });

    console.log('📤 Uploaded to Firebase Storage');

    // 3. Make file public và lấy URL
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    
    console.log('✅ QR Code URL:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('❌ Error uploading QR code:', error);
    throw new Error('Failed to upload QR code: ' + error.message);
  }
}

/**
 * Xóa QR code từ Firebase Storage (cleanup)
 * @param {string} fileName - Tên file cần xóa
 */
async function deleteQRCode(fileName) {
  try {
    const file = bucket.file(`qr-codes/${fileName}`);
    await file.delete();
    console.log('🗑️ QR Code deleted:', fileName);
    return true;
  } catch (error) {
    console.error('❌ Error deleting QR code:', error);
    return false;
  }
}

module.exports = {
  generateAndUploadQRCode,
  deleteQRCode
};
```

---

### BƯỚC 5: Cập nhật API Assign Gift

#### ❌ CODE CŨ (Trả về base64):

```javascript
router.post('/assign', async (req, res) => {
  try {
    const { giftId, userId, userInfo, metadata } = req.body;
    
    // ... logic kiểm tra gift availability ...
    
    const assignmentId = generateAssignmentId();
    const qrData = JSON.stringify({ assignmentId, giftId, userId });
    
    // ❌ Tạo QR base64 - KHÔNG hoạt động với Zalo
    const qrCodeBase64 = await QRCode.toDataURL(qrData);
    
    const assignment = {
      assignmentId,
      giftId,
      userId,
      qrCode: qrCodeBase64, // ❌ Base64
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      userInfo,
      metadata
    };
    
    await saveToDatabase(assignment);
    res.json(assignment);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### ✅ CODE MỚI (Upload và trả về URL):

```javascript
const { generateAndUploadQRCode } = require('../utils/uploadQRCode');

router.post('/assign', async (req, res) => {
  try {
    const { giftId, userId, userInfo, metadata } = req.body;
    
    // 1. Validate input
    if (!giftId || !userId) {
      return res.status(400).json({ error: 'Missing giftId or userId' });
    }
    
    // 2. Kiểm tra gift còn available không
    const gift = await getGiftById(giftId);
    if (!gift || gift.availableQuantity <= 0) {
      return res.status(409).json({ error: 'Gift not available' });
    }
    
    // 3. Kiểm tra user đã nhận gift này chưa
    const existingAssignment = await checkExistingAssignment(giftId, userId);
    if (existingAssignment) {
      return res.status(409).json({ error: 'User already received this gift' });
    }
    
    // 4. Tạo assignment ID
    const assignmentId = `assignment_${Date.now()}_${userId.substring(0, 8)}`;
    
    // 5. Chuẩn bị dữ liệu cho QR code
    const qrData = JSON.stringify({
      assignmentId,
      giftId,
      userId,
      timestamp: Date.now()
    });
    
    // 6. ✅ Generate QR và upload lên Firebase Storage
    const qrCodeUrl = await generateAndUploadQRCode(
      qrData,
      `qr-${assignmentId}.png`
    );
    
    // 7. Tạo assignment object
    const assignment = {
      assignmentId,
      giftId,
      userId,
      status: 'assigned',
      qrCode: qrCodeUrl, // ✅ HTTP URL - hoạt động với Zalo!
      qrTarget: qrData,
      qrQuery: qrData,
      assignedAt: new Date().toISOString(),
      redeemedAt: null,
      userInfo,
      metadata
    };
    
    // 8. Lưu vào database
    await saveAssignmentToDatabase(assignment);
    
    // 9. Cập nhật gift quantity
    await decrementGiftQuantity(giftId);
    
    console.log('✅ Gift assigned successfully:', assignmentId);
    res.json(assignment);
    
  } catch (error) {
    console.error('❌ Error assigning gift:', error);
    res.status(500).json({ 
      error: 'Failed to assign gift',
      message: error.message 
    });
  }
});
```

---

### BƯỚC 6: (Optional) Cleanup khi Redeem

Khi user đã đổi quà, xóa QR code để tiết kiệm storage:

```javascript
const { deleteQRCode } = require('../utils/uploadQRCode');

router.post('/redeem', async (req, res) => {
  try {
    const { assignmentId, userId } = req.body;
    
    // 1. Validate
    if (!assignmentId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 2. Lấy thông tin assignment
    const assignment = await getAssignmentById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    if (assignment.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (assignment.status === 'redeemed') {
      return res.status(409).json({ error: 'Gift already redeemed' });
    }
    
    // 3. Cập nhật status
    assignment.status = 'redeemed';
    assignment.redeemedAt = new Date().toISOString();
    await updateAssignmentInDatabase(assignment);
    
    // 4. Optional: Xóa QR code để tiết kiệm storage
    if (assignment.qrCode && assignment.qrCode.includes('storage.googleapis.com')) {
      const fileName = `qr-${assignmentId}.png`;
      await deleteQRCode(fileName);
      console.log('🗑️ QR code deleted after redemption');
    }
    
    // 5. Cập nhật gift statistics
    await incrementGiftRedeemedCount(assignment.giftId);
    
    res.json({ 
      success: true,
      message: 'Gift redeemed successfully',
      assignment 
    });
    
  } catch (error) {
    console.error('❌ Error redeeming gift:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### BƯỚC 7: Cấu hình Firebase Storage Rules

1. Vào Firebase Console > Storage > **Rules**
2. Cập nhật rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // QR codes folder
    match /qr-codes/{fileName} {
      // Cho phép read public (không cần authentication)
      allow read: if true;
      
      // Chỉ server mới có quyền write/delete
      allow write, delete: if false;
    }
    
    // Các folder khác (nếu có)
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

### BƯỚC 8: Cấu hình CORS (nếu cần)

Nếu gặp lỗi CORS khi load ảnh từ Firebase Storage:

Tạo file `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Chạy command (cần Google Cloud SDK):

```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

---

### BƯỚC 9: Cập nhật Environment Variables

Tạo file `.env`:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json

# API
PORT=3000
NODE_ENV=production
```

Cập nhật `config/firebase.js`:

```javascript
require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(
  __dirname, 
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
```

---

## 🧪 TESTING

### Test 1: Test API với Postman

**Request:**
```http
POST http://localhost:3000/api/gifts/assign
Content-Type: application/json

{
  "giftId": "gift123",
  "userId": "user456",
  "userInfo": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789"
  },
  "metadata": {
    "source": "message",
    "messageId": "msg789"
  }
}
```

**Expected Response:**
```json
{
  "assignmentId": "assignment_1704229087455_user456",
  "giftId": "gift123",
  "userId": "user456",
  "status": "assigned",
  "qrCode": "https://storage.googleapis.com/your-bucket/qr-codes/qr-assignment_1704229087455_user456.png",
  "qrTarget": "{\"assignmentId\":\"...\",\"giftId\":\"...\"}",
  "qrQuery": "{\"assignmentId\":\"...\",\"giftId\":\"...\"}",
  "assignedAt": "2024-01-02T15:31:27.455Z",
  "redeemedAt": null,
  "userInfo": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789"
  },
  "metadata": {
    "source": "message",
    "messageId": "msg789"
  }
}
```

### Test 2: Kiểm tra URL trong browser

Copy URL từ `qrCode` field và mở trong browser:
```
https://storage.googleapis.com/your-bucket/qr-codes/qr-assignment_xxx.png
```

Phải thấy ảnh QR code hiển thị.

### Test 3: Test trên Frontend Zalo Mini App

1. Deploy backend
2. Test nhận quà trên app
3. Bấm "Tải QR" 
4. **Kết quả mong đợi:** Ảnh QR được lưu vào thư viện ảnh điện thoại

---

## 📊 SO SÁNH TRƯỚC VÀ SAU

| Aspect | ❌ Trước (Base64) | ✅ Sau (Firebase URL) |
|--------|-------------------|----------------------|
| **Format** | `data:image/png;base64,iVBORw0KG...` | `https://storage.googleapis.com/.../qr.png` |
| **Kích thước response** | ~7-10KB (base64 trong JSON) | ~100 bytes (chỉ URL) |
| **Tải về điện thoại** | ❌ Không hoạt động | ✅ Hoạt động hoàn hảo |
| **Performance** | Chậm (transfer data lớn) | Nhanh (chỉ transfer URL) |
| **Caching** | Khó cache | Dễ cache (CDN) |
| **Storage** | Lưu trong DB | Lưu trong Firebase Storage |

---

## 🎯 CHECKLIST HOÀN THÀNH

- [ ] Cài đặt `firebase-admin` và `qrcode`
- [ ] Tải Service Account Key từ Firebase Console
- [ ] Tạo `config/firebase.js` và khởi tạo Firebase Admin
- [ ] Tạo `utils/uploadQRCode.js` với functions upload/delete
- [ ] Cập nhật API `/assign` để upload QR và trả về URL
- [ ] (Optional) Cập nhật API `/redeem` để xóa QR sau khi đổi quà
- [ ] Cấu hình Firebase Storage Rules cho phép read public
- [ ] Test API với Postman - kiểm tra response có URL
- [ ] Test mở URL trong browser - xem có hiển thị QR không
- [ ] Deploy backend lên server
- [ ] Test trên Frontend Zalo Mini App
- [ ] Verify ảnh QR lưu được vào thư viện điện thoại

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Error: Could not load the default credentials"

**Nguyên nhân:** Service Account Key chưa được load đúng.

**Giải pháp:**
- Kiểm tra đường dẫn đến file `serviceAccountKey.json`
- Đảm bảo file JSON hợp lệ
- Thử dùng đường dẫn tuyệt đối

### Lỗi: "Error: Storage bucket not found"

**Nguyên nhân:** Storage Bucket name không đúng.

**Giải pháp:**
- Vào Firebase Console > Storage
- Copy bucket name chính xác (ví dụ: `my-app.appspot.com`)
- Cập nhật trong `config/firebase.js`

### Lỗi: "403 Forbidden" khi truy cập URL

**Nguyên nhân:** File chưa được set public.

**Giải pháp:**
- Kiểm tra Storage Rules cho phép read public
- Đảm bảo `await file.makePublic()` được gọi
- Test lại

### Lỗi: CORS khi load ảnh

**Nguyên nhân:** Firebase Storage chưa cấu hình CORS.

**Giải pháp:**
- Tạo file `cors.json` như hướng dẫn ở Bước 8
- Chạy lệnh `gsutil cors set cors.json gs://your-bucket`

---

## 📚 TÀI LIỆU THAM KHẢO

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Storage Upload Files](https://firebase.google.com/docs/storage/admin/start)
- [QRCode npm package](https://www.npmjs.com/package/qrcode)
- [Zalo Mini App saveImageToGallery API](https://miniapp.zaloplatforms.com/documents/api/saveImageToGallery/)

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Firebase Admin SDK đã khởi tạo đúng chưa
2. ✅ Service Account Key có quyền Storage Admin không
3. ✅ Storage Rules cho phép read public chưa
4. ✅ URL trả về có mở được trong browser không
5. ✅ Frontend có nhận đúng URL từ API không

---

**Tạo bởi:** AI Assistant
**Ngày tạo:** 27/11/2025
**Phiên bản:** 1.0

---

## 🎉 KẾT LUẬN

Sau khi hoàn thành các bước trên, người dùng sẽ có thể:
- ✅ Nhận quà và xem QR code
- ✅ Bấm nút "Tải QR" trên điện thoại
- ✅ QR code tự động lưu vào thư viện ảnh
- ✅ Mang QR code đến cửa hàng để đổi quà

**Chúc bạn thành công! 🚀**

