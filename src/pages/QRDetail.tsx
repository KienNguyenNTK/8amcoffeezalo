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
    <div className="p-4 mb-14" style={{ marginTop: "20px" }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-center">
        <button
          className="p-2 rounded-full bg-8am-gray mr-4"
          style={{
            zIndex: 1000,
            position: 'fixed',
            top: '50px',
            left: '20px'
          }}
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="h-4 w-4 text-8am-white" />
        </button>
        <div className="text-8am-black text-xl font-bold mt-5">
          Chi tiết QR
        </div>
      </div>

      {/* QR Section - hiển thị trước */}
      {!isRedeemed && qrCode && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex justify-center mb-4">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Quét mã QR tại cửa hàng để đổi quà
          </p>
        </div>
      )}

      {/* Gift Info + Image - thông tin bên trái, ảnh nhỏ bên phải */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-medium text-8am-black mb-1">{gift.name}</h2>
            {gift.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{gift.description}</p>
            )}
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
      </div>

      {/* Info */}
      <div className="bg-white rounded-lg p-4 mb-4 gap-2 flex flex-col">
        <div className="flex justify-between">
          <div className="text-sm font-medium">Ngày nhận:</div>
          <div className="font-medium">{formatTime(assignment.assignedAt)}</div>
        </div>

        {/* Redeemed day */}
        {isRedeemed && (
          <div className="flex justify-between">
            <div className="text-sm font-medium">Ngày đổi:</div>
            <div className="font-medium">{formatTime(assignment.redeemedAt)}</div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm font-medium">Ngày hết hạn:</div>
          <div className="font-medium">Không có</div>
        </div>

        <div className="flex justify-between">
          <div className="text-sm font-medium">Trạng thái:</div>
          {isRedeemed ? (
            <div className="text-green-600 font-medium">Đã đổi</div>
          ) : (
            <div className="text-8am-orange font-medium">Chưa đổi</div>
          )}
        </div>
      </div>

      {/* How to redeem */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Cách thức đổi quà</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          <li>Đưa mã QR này cho nhân viên tại cửa hàng.</li>
          <li>Nhân viên sẽ quét và xác nhận quà cho bạn.</li>
          <li>Quà chỉ sử dụng 1 lần cho mỗi mã QR.</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDetail;