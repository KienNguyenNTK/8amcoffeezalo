import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { downloadQRCode } from "../utils/downloadQR";

const QRDetail: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  const gift = state?.gift;
  const assignment = state?.assignment;
  const qrCode = state?.qrCode;

  const [isDownloading, setIsDownloading] = useState(false);

  if (!gift || !assignment) {
    return (
      <div className="p-6">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  const isRedeemed = assignment.status === "redeemed";

  const handleDownloadQR = async () => {
    if (!qrCode) return;
    setIsDownloading(true);
    await downloadQRCode(qrCode, gift.id, gift.name);
    setIsDownloading(false);
  };

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

      {/* Gift Image */}
      {gift.imageUrl && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex justify-center">
            <img
              src={gift.imageUrl}
              alt={gift.name}
              className="w-full max-w-xs h-64 object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Gift Info */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h2 className="font-medium text-8am-black mb-1">{gift.name}</h2>
        <p className="text-sm text-gray-500">{gift.description}</p>
      </div>

      {/* QR Section */}
      {!isRedeemed && qrCode && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex justify-center mb-4">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>
          
          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadQR}
              disabled={isDownloading}
              className="w-full bg-8am-orange text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang tải...</span>
                </>
              ) : (
                <span>Tải QR Code</span>
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Quét mã QR tại cửa hàng để đổi quà
          </p>
        </div>
      )}

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