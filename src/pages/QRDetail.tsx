import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const QRDetail: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  const gift = state?.gift;
  const assignment = state?.assignment;
  const qrCode = state?.qrCode;

  if (!gift || !assignment) {
    return (
      <div className="p-6">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  const isRedeemed = assignment.status === "redeemed";

  const formatTime = (d: any) => {
    if (!d) return "—";
    try {
      if (d?.seconds || d?.nanoseconds) {
        const t = (d.seconds || 0) * 1000 + Math.floor((d.nanoseconds || 0) / 1e6);
        const dt = new Date(t);
        return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
      }

      const dt = typeof d === "string" ? new Date(d) : d;
      return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 pt-10">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white shadow rounded-full"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold ml-4">Chi tiết QR</h1>
      </div>

      {/* Name, description */}
      <div className="mb-6 text-center">
        <h2 className="text-lg font-bold">{gift.name}</h2>
        <p className="text-gray-600">{gift.description}</p>
      </div>

      {/* QR Section */}
      {!isRedeemed && qrCode && (
        <div className="bg-gray-50 border rounded-xl p-4 mb-4 flex justify-center">
          <img
            src={qrCode}
            alt="QR Code"
            className="w-64 h-64 object-contain"
          />
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Ngày nhận:</span>
          <span className="font-medium">{formatTime(assignment.assignedAt)}</span>
        </div>

        {/* Redeêmd day */}
        {isRedeemed && (
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Ngày đổi:</span>
            <span className="font-medium">{formatTime(assignment.redeemedAt)}</span>
          </div>
        )}

        <div className="flex justify-between py-1">
          <span className="text-gray-600">Ngày hết hạn:</span>
          <span className="font-medium">Không có</span>
        </div>

        <div className="flex justify-between py-1">
          <span className="text-gray-600">Trạng thái:</span>
          {isRedeemed ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs">
              Đã đổi
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs">
              Chưa đổi
            </span>
          )}
        </div>
      </div>

      {/* How to redeem */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm">
        <h3 className="font-semibold mb-2">Cách thức đổi quà</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Đưa mã QR này cho nhân viên tại cửa hàng.</li>
          <li>Nhân viên sẽ quét và xác nhận quà cho bạn.</li>
          <li>Quà chỉ sử dụng 1 lần cho mỗi mã QR.</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDetail;