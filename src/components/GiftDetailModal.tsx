import React from "react";
import { Gift, GiftAssignment } from "../types/gift";
import { useNavigate } from "react-router-dom";

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

  const goToDetail = () => {
    navigate("/qr-detail", {
      state: { gift, assignment, qrCode },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
          🎁 Chi tiết quà tặng
        </h2>

        {/* Gift Info */}
        <div className="mt-1 mb-2">
          <p className="text-xl font-bold text-orange-600 text-center">
            {gift.name}
          </p>

          <p className="text-sm text-gray-700 leading-relaxed text-center mt-1 mb-2">
            {gift.description}
          </p>

          {/* Status */}
          <div className="text-center mt-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                assignment.status === "redeemed"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {assignment.status === "redeemed" ? "Đã đổi" : "Chưa đổi"}
            </span>
          </div>
        </div>

        {/* QR – được đẩy xuống dưới hơn để phần text nằm cao hơn */}
        {assignment.status !== "redeemed" && (
          <div className="mt-4">
            <QRDisplay qrCode={qrCode} />
            <p className="text-xs text-gray-500 text-center mt-1">
              Quét mã QR tại cửa hàng để đổi quà
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-6">

          {assignment.status !== "redeemed" && (
            <button
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 text-sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = qrCode;
                link.download = `qr-${gift.id}.png`;
                link.click();
              }}
            >
              Tải QR
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