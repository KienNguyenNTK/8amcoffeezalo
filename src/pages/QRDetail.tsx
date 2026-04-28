import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { giftService } from "../firebase/giftService";
import { GiftAssignment } from "../types/gift";
import { formatGiftDateTime, getAssignmentExpiryDate } from "../utils/giftHelpers";

const QRDetail: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  const gift = state?.gift || state?.assignment?.gift;
  const assignment = state?.assignment as GiftAssignment | undefined;
  const [qrCode, setQrCode] = useState<string | null>(state?.qrCode || null);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    const loadQrCode = async () => {
      if (!assignment?.assignmentId) return;
      if (assignment.status === "redeemed" || assignment.status === "expired") return;
      if (qrCode) return;

      try {
        setLoadingQr(true);
        const qrData = await giftService.getQRCode(assignment.assignmentId);
        setQrCode(qrData.qrCodeBranded || qrData.qrCode || qrData.qr || null);
      } catch (error) {
        console.error("Error loading QR detail:", error);
      } finally {
        setLoadingQr(false);
      }
    };

    loadQrCode();
  }, [assignment, qrCode]);

  if (!gift || !assignment) {
    return (
      <div className="p-6">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  const isRedeemed = assignment.status === "redeemed";
  const isExpired = assignment.status === "expired";
  const expiryDate = getAssignmentExpiryDate(assignment, gift);

  return (
    <div className="p-4 mb-14" style={{ marginTop: "20px" }}>
      <div className="mb-4 flex items-center justify-center">
        <button
          className="p-2 rounded-full bg-8am-gray mr-4"
          style={{
            zIndex: 1000,
            position: "fixed",
            top: "50px",
            left: "20px",
          }}
          onClick={() => navigate(-1)}
        >
          <span className="h-4 w-4 text-8am-white inline-flex items-center justify-center">{'<'}</span>
        </button>
        <div className="text-8am-black text-xl font-bold mt-5">Chi tiết QR</div>
      </div>

      {!isRedeemed && !isExpired && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex justify-center mb-4">
            {loadingQr ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
            ) : qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-64 h-64 object-contain" />
            ) : (
              <div className="text-sm text-gray-500">Không thể tải mã QR</div>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center">Quét mã QR tại đúng cửa hàng để đổi quà</p>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-medium text-8am-black mb-1">{gift.name}</h2>
            {gift.description && <p className="text-sm text-gray-500 line-clamp-2">{gift.description}</p>}
            {assignment.storeName && (
              <p className="text-sm text-orange-700 mt-2">
                Nhận tại: <strong>{assignment.storeName}</strong>
              </p>
            )}
          </div>
          {gift.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={gift.imageUrl}
                alt={gift.name}
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 gap-2 flex flex-col">
        <div className="flex justify-between">
          <div className="text-sm font-medium">Ngày nhận:</div>
          <div className="font-medium">{formatGiftDateTime(assignment.assignedAt)}</div>
        </div>

        {assignment.storeName && (
          <div className="flex justify-between">
            <div className="text-sm font-medium">Cơ sở nhận:</div>
            <div className="font-medium text-right">{assignment.storeName}</div>
          </div>
        )}

        {isRedeemed && (
          <div className="flex justify-between">
            <div className="text-sm font-medium">Ngày đổi:</div>
            <div className="font-medium">{formatGiftDateTime(assignment.redeemedAt)}</div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm font-medium">Hiệu lực đến:</div>
          <div className="font-medium">{formatGiftDateTime(expiryDate)}</div>
        </div>

        <div className="flex justify-between">
          <div className="text-sm font-medium">Trạng thái:</div>
          {isRedeemed ? (
            <div className="text-green-600 font-medium">Đã đổi</div>
          ) : isExpired ? (
            <div className="text-red-600 font-medium">Hết hạn</div>
          ) : (
            <div className="text-8am-orange font-medium">Chưa đổi</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Cách thức đổi quà</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          <li>Đưa mã QR này cho nhân viên tại đúng cửa hàng đã đăng ký.</li>
          <li>Nhân viên sẽ quét và xác nhận quà cho bạn.</li>
          <li>Mã QR chỉ có hiệu lực trong chu kỳ quà hiện tại.</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDetail;
