import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaQrcode } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { giftService } from "../firebase/giftService";
import { Gift, GiftAssignment } from "../types/gift";
import { getUserID } from "zmp-sdk";
import { userService } from "../firebase/userService";

// Local assignment type that allows Date for assignedAt/redeemedAt
type LocalAssignment = Omit<GiftAssignment, 'assignedAt' | 'redeemedAt'> & {
  assignedAt?: Date | string | null;
  redeemedAt?: Date | string | null;
};

interface QRHistoryItem {
  gift: Gift;
  assignment: LocalAssignment;
  qrCode: string;
}

const QRHistory: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<QRHistoryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tất cả" },
    { id: "assigned", label: "Chưa đổi" },
    { id: "redeemed", label: "Đã đổi" },
    { id: "expired", label: "Hết hạn" },
  ];

  const parseDate = (value: any): Date | null => {
    if (!value && value !== 0) return null;

    if (typeof value === 'object' && typeof value.toDate === 'function') {
      try { return value.toDate(); } catch { return null; }
    }

    if (typeof value === 'object' && typeof value.seconds === 'number') {
      try { return new Date(value.seconds * 1000); } catch { return null; }
    }

    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  };

  const loadQR = async () => {
    try {
      setLoading(true);

      const zaloId = await getUserID();
      if (!zaloId) {
        setList([]);
        return;
      }

      const firebaseUser = await userService.getUserByLocalId(zaloId);
      if (!firebaseUser) {
        setList([]);
        return;
      }

      const uid = firebaseUser.id as string;
      const allGifts: Gift[] = await giftService.getAllGifts();

      const results: QRHistoryItem[] = [];

      for (const gift of allGifts) {
        const status = await giftService.checkStatus(gift.id, uid);

        if (!status || !status.hasAssignment || !status.assignmentId) continue;

        const assignmentId = status.assignmentId as string;

        const assignedEntry = Array.isArray((gift as any).assignedUsers)
          ? (gift as any).assignedUsers.find((u: any) => u.assignmentId === assignmentId)
          : null;

        const redeemedEntry = Array.isArray((gift as any).redeemedUsers)
          ? (gift as any).redeemedUsers.find((u: any) => u.assignmentId === assignmentId)
          : null;

        const assignedAt = parseDate(assignedEntry?.assignedAt) || parseDate(gift.createdAt) || null;
        const redeemedAt = parseDate(redeemedEntry?.redeemedAt) || parseDate(status.redeemedAt) || null;

        let qrData: any = {};
        try {
          qrData = await giftService.getQRCode(assignmentId);
        } catch (err) {
          console.warn('Could not fetch QR for', assignmentId, err);
        }

        const localAssignment: LocalAssignment = {
          assignmentId: assignmentId,
          giftId: gift.id,
          userId: uid,
          status: redeemedAt ? 'redeemed' : (status.status || 'assigned'),
          assignedAt,
          redeemedAt,
          qrCode: qrData?.qrCode || undefined,
          qrTarget: qrData?.qrTarget || undefined,
          qrQuery: qrData?.qrQuery || undefined,
        } as LocalAssignment;

        results.push({
          gift,
          assignment: localAssignment,
          qrCode: qrData?.qrCode || '',
        });
      }

      results.sort((a, b) => {
        const ta = a.assignment.assignedAt instanceof Date ? a.assignment.assignedAt.getTime() : (typeof a.assignment.assignedAt === 'string' ? new Date(a.assignment.assignedAt).getTime() : 0);
        const tb = b.assignment.assignedAt instanceof Date ? b.assignment.assignedAt.getTime() : (typeof b.assignment.assignedAt === 'string' ? new Date(b.assignment.assignedAt).getTime() : 0);
        return tb - ta;
      });

      setList(results);
    } catch (err) {
      console.error("Load QR error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQR();
  }, []);

  /** Filter list */
  const filtered = list.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.assignment.status === selectedFilter;
  });

  /** Badge UI */
  const renderStatus = (status: string) => {
    if (status === "redeemed")
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          Đã đổi
        </span>
      );

    if (status === "expired")
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          Hết hạn
        </span>
      );

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
        Chưa đổi
      </span>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-orange-600 rounded-full" />
      </div>
    );

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
          Kho QR của bạn
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedFilter === f.id
                  ? "bg-8am-orange text-white"
                  : "bg-gray-100 text-8am-black hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <FaQrcode className="mx-auto text-5xl mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">Không có QR nào</p>
          <p className="text-sm text-gray-400 mt-2">Bạn chưa nhận quà tặng nào</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map((item, idx) => {
          const assignedDate = item.assignment.assignedAt instanceof Date
            ? item.assignment.assignedAt
            : item.assignment.assignedAt
            ? new Date(item.assignment.assignedAt)
            : null;
          
          const formattedDate = assignedDate
            ? assignedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—';
          
          const formattedTime = assignedDate
            ? assignedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '—';

          return (
            <div
              key={idx}
              onClick={() =>
                navigate("/qr-detail", {
                  state: {
                    gift: item.gift,
                    assignment: item.assignment,
                    qrCode: item.qrCode,
                  },
                })
              }
              className="bg-white rounded-lg p-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Gift Image */}
                {item.gift.imageUrl ? (
                  <div className="flex-shrink-0">
                    <img
                      src={item.gift.imageUrl}
                      alt={item.gift.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                    <FaQrcode className="text-xl text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-8am-black line-clamp-1">
                        {item.gift.name}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {item.gift.description}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {renderStatus(item.assignment.status!)}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="text-xs text-gray-500 mt-2">
                    Nhận lúc: {formattedTime} {formattedDate}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QRHistory;