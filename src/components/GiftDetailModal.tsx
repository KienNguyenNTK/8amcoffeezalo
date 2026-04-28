import React, { useState } from "react";
import { Gift, GiftAssignment } from "../types/gift";
import { useNavigate } from "react-router-dom";
import { downloadQRCode } from "../utils/downloadQR";
import { formatGiftDateTime, getAssignmentExpiryDate } from "../utils/giftHelpers";

export const QRDisplay = ({ qrCode }: { qrCode: string }) => (
  <div className="flex justify-center items-center mb-4 relative w-48 h-48 mx-auto">
    <img
      src={qrCode}
      alt="QR Code"
      className="w-48 h-48 border-2 border-gray-200 rounded-lg"
    />
  </div>
);

interface GiftDetailModalProps {
  gift: Gift;
  assignment: GiftAssignment;
  qrCode: string;
  onClose: () => void;
}

const GiftDetailModal: React.FC<GiftDetailModalProps> = ({
  gift,
  assignment,
  qrCode,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const goToDetail = () => {
    navigate("/qr-detail", {
      state: { gift, assignment, qrCode },
    });
    onClose();
  };

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    await downloadQRCode(qrCode, gift.id, gift.name);
    setIsDownloading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
          🎁 Chi tiết quà tặng
        </h2>

        {/* QR Code - hiển thị trước */}
        {assignment.status === "assigned" && qrCode && (
          <div className="mb-4">
            <QRDisplay qrCode={qrCode} />
            <p className="text-xs text-gray-500 text-center mt-1">
              Quét mã QR tại cửa hàng để đổi quà
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Hiệu lực đến: {formatGiftDateTime(getAssignmentExpiryDate(assignment, gift))}
            </p>
          </div>
        )}

        {/* Thông tin quà + ảnh quà */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 text-left">
            <p className="text-lg font-semibold text-orange-600 mb-1">
              {gift.name}
            </p>
            {gift.description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-2 line-clamp-2">
                {gift.description}
              </p>
            )}
            {assignment.storeName && (
              <p className="text-sm text-orange-700 mb-2">
                Nhận tại: <strong>{assignment.storeName}</strong>
              </p>
            )}
            {/* Status */}
            <div className="mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  assignment.status === "redeemed"
                    ? "bg-gray-100 text-gray-600"
                    : assignment.status === "expired"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {assignment.status === "redeemed"
                  ? "Đã đổi"
                  : assignment.status === "expired"
                  ? "Hết hạn"
                  : "Chưa đổi"}
              </span>
            </div>
          </div>
          {gift.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={gift.imageUrl}
                alt={gift.name}
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">

          {assignment.status === "assigned" && qrCode && (
            <button
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownloadQR}
              disabled={isDownloading}
            >
              {isDownloading ? "Đang tải..." : "Tải QR"}
            </button>
          )}

          <button
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm"
            onClick={goToDetail}
          >
            Chi tiết
          </button>

          <button
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 text-sm"
            onClick={onClose}
          >
            Đóng
          </button>

        </div>

      </div>
    </div>
  );
};

export default GiftDetailModal;
