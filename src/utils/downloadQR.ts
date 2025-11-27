/**
 * Download QR Code utility
 * Hỗ trợ tải QR code từ base64 data URL hoặc HTTP/HTTPS URL
 * Tự động sử dụng Zalo SDK trên mobile và fallback sang HTML download trên desktop
 */

import { saveImageToGallery } from 'zmp-sdk/apis';
import { notification } from 'antd';

/**
 * Kiểm tra xem có đang chạy trong Zalo Mini App không
 */
const isZaloMiniApp = (): boolean => {
  try {
    // Kiểm tra xem có window.ZaloJavaScriptInterface hoặc đang trong môi trường Zalo
    return !!(
      typeof window !== 'undefined' && 
      ((window as any).ZaloJavaScriptInterface || 
       navigator.userAgent.includes('ZaloTheme') ||
       navigator.userAgent.includes('Zalo'))
    );
  } catch {
    return false;
  }
};

/**
 * Convert base64 to blob URL
 * Zalo có thể chấp nhận URL tốt hơn base64 string
 */
const base64ToImageUrl = (base64Data: string): string => {
  try {
    // Add data URL prefix if not present
    const dataURL = base64Data.startsWith('data:') 
      ? base64Data 
      : `data:image/png;base64,${base64Data}`;
    
    // Convert base64 to blob
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error('Error converting base64 to blob URL:', error);
    throw error;
  }
};

/**
 * Tải QR code về máy
 * @param qrCode - Base64 data URL hoặc HTTP/HTTPS URL
 * @param giftId - ID của quà tặng
 * @param giftName - Tên quà tặng (tùy chọn)
 * @returns Promise<boolean> - true nếu tải thành công, false nếu thất bại
 */
export const downloadQRCode = async (
  qrCode: string,
  giftId: string,
  giftName?: string
): Promise<boolean> => {
  try {
    // Nếu đang chạy trong Zalo Mini App, sử dụng Zalo SDK
    if (isZaloMiniApp()) {
      let blobUrl: string | null = null;
      
      try {
        console.log('QR Code format (first 100 chars):', qrCode.substring(0, 100));
        
        // Kiểm tra xem qrCode là base64 data URL hay HTTP URL
        const isBase64DataURL = qrCode.startsWith('data:image');
        const isHttpURL = qrCode.startsWith('http://') || qrCode.startsWith('https://');
        
        let imageUrlToSave: string;
        
        if (isHttpURL) {
          // ✅ Backend mới trả về HTTP URL từ Firebase Storage
          console.log('✅ Using Firebase Storage URL:', qrCode);
          imageUrlToSave = qrCode;
        } else {
          // Fallback cho trường hợp backend cũ vẫn trả base64
          console.warn('⚠️ Backend đang trả về base64. Khuyến nghị update backend để trả HTTP URL');
          console.log('Converting base64 to blob URL...');
          blobUrl = base64ToImageUrl(qrCode);
          imageUrlToSave = blobUrl;
          console.log('Blob URL created:', blobUrl.substring(0, 50));
        }
        
        // Sử dụng imageUrl thay vì imageBase64Data
        console.log('Calling saveImageToGallery with imageUrl...');
        await saveImageToGallery({
          imageUrl: imageUrlToSave,
        });
        
        console.log('✅ Saved image to gallery successfully');
        notification.success({
          message: 'Thành công',
          description: 'Đã lưu mã QR vào thư viện ảnh! Bạn có thể xem trong thư viện ảnh của điện thoại.',
          duration: 3,
          placement: 'top',
          closable: false
        });
        
        // Cleanup blob URL
        if (blobUrl) {
          setTimeout(() => URL.revokeObjectURL(blobUrl!), 1000);
        }
        
        return true;
      } catch (error: any) {
        console.error('Failed to save image to gallery:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          api: error.api,
          detail: error.detail
        });
        
        // Cleanup blob URL on error
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        
        // Xử lý các loại lỗi cụ thể
        if (error.code === -2005) {
          // Lỗi này do Zalo API không chấp nhận blob URL hoặc base64
          // Cần backend trả về HTTP URL thay vì base64
          console.warn('⚠️ Zalo API không hỗ trợ lưu từ base64/blob URL');
          console.warn('💡 Khuyến nghị: Backend nên upload QR lên Firebase Storage và trả về HTTP URL');
          
          // Tạm thời fallback: Hiển thị ảnh trong modal để user long-press và lưu
          const showImageModal = () => {
            // Tạo modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.9);
              z-index: 99999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
            `;
            
            // Tạo instruction text
            const instruction = document.createElement('div');
            instruction.style.cssText = `
              color: white;
              text-align: center;
              margin-bottom: 20px;
              font-size: 16px;
              line-height: 1.5;
            `;
            instruction.innerHTML = `
              <strong>📱 Cách lưu mã QR:</strong><br>
              Nhấn giữ vào ảnh bên dưới<br>
              rồi chọn "Lưu ảnh"
            `;
            
            // Tạo image element
            const img = document.createElement('img');
            img.src = qrCode;
            img.style.cssText = `
              max-width: 90%;
              max-height: 60vh;
              border: 3px solid white;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            `;
            
            // Tạo close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Đóng';
            closeBtn.style.cssText = `
              margin-top: 20px;
              padding: 12px 40px;
              background: white;
              color: black;
              border: none;
              border-radius: 25px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            `;
            closeBtn.onclick = () => document.body.removeChild(overlay);
            
            // Thêm tất cả vào overlay
            overlay.appendChild(instruction);
            overlay.appendChild(img);
            overlay.appendChild(closeBtn);
            
            // Thêm vào body
            document.body.appendChild(overlay);
            
            // Click overlay cũng đóng modal
            overlay.onclick = (e) => {
              if (e.target === overlay) {
                document.body.removeChild(overlay);
              }
            };
          };
          
          showImageModal();
        } else if (error.code === -202 || error.code === -201) {
          notification.error({
            message: 'Cần cấp quyền',
            description: 'Bạn cần cấp quyền truy cập thư viện ảnh. Vui lòng vào Cài đặt > Quyền riêng tư > Cho phép truy cập thư viện ảnh.',
            duration: 4,
            placement: 'top',
            closable: false
          });
        } else {
          notification.error({
            message: 'Lỗi',
            description: `Không thể lưu ảnh: ${error.message || 'Vui lòng thử lại'}`,
            duration: 3,
            placement: 'top',
            closable: false
          });
        }
        return false;
      }
    }

    // Fallback cho desktop browser - sử dụng phương thức download HTML thông thường
    let downloadUrl = qrCode;

    // Nếu qrCode là HTTP/HTTPS URL, fetch về blob
    if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) {
      try {
        const response = await fetch(qrCode);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      } catch (fetchError) {
        console.error('Error fetching QR code:', fetchError);
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải QR code. Vui lòng thử lại sau.',
          duration: 3,
          placement: 'top',
          closable: false
        });
        return false;
      }
    }

    // Tạo timestamp cho tên file
    const timestamp = new Date().getTime();
    const fileName = `qr-${giftId}-${timestamp}.png`;

    // Tạo thẻ <a> để download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    
    // Thêm vào DOM, click, và xóa
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Giải phóng URL nếu đã tạo blob URL
    if (downloadUrl !== qrCode) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    }

    notification.success({
      message: 'Thành công',
      description: 'Đã tải mã QR thành công!',
      duration: 2,
      placement: 'top',
      closable: false
    });
    return true;
  } catch (error) {
    console.error('Error downloading QR code:', error);
    notification.error({
      message: 'Lỗi',
      description: 'Có lỗi xảy ra khi tải QR code. Vui lòng thử lại.',
      duration: 3,
      placement: 'top',
      closable: false
    });
    return false;
  }
};

