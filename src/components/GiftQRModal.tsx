import React from 'react';
import { GiftAssignment } from '../types/gift';

interface GiftQRModalProps {
  qrCode: string;
  giftName: string;
  assignment: GiftAssignment;
  onClose: () => void;
}

const GiftQRModal: React.FC<GiftQRModalProps> = ({
  qrCode,
  giftName,
  assignment,
  onClose,
}) => {
  const handleDownloadQR = () => {
    window.open(qrCode, "_blank");
  };

  return (  
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Chúc mừng!
          </h2>
          <p className="text-gray-600 mb-4">
            Bạn đã nhận quà: <strong>{giftName}</strong>
          </p>

          <div className="flex justify-center mb-4">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-48 h-48 border-2 border-gray-200 rounded-lg"
            />
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Vui lòng lưu QR code này để đổi quà tại cửa hàng
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
                Tải QR Code
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftQRModal;