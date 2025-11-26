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
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
          Đã đổi
        </span>
      );

    if (status === "expired")
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
          Hết hạn
        </span>
      );

    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">
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
    <div className="min-h-screen bg-white p-4 pt-10">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white shadow rounded-full"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold ml-4">Kho QR của bạn</h1>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${
              selectedFilter === f.id
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FaQrcode className="mx-auto text-5xl mb-4 opacity-40" />
          <p>Không có QR nào</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map((item, idx) => (
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
            className="p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">{item.gift.name}</h3>
                <p className="text-sm text-gray-500">{item.gift.description}</p>

                <p className="text-xs text-gray-400 mt-1">
                  Nhận lúc:{' '}
                  {item.assignment.assignedAt instanceof Date
                    ? item.assignment.assignedAt.toLocaleString()
                    : item.assignment.assignedAt
                    ? new Date(item.assignment.assignedAt).toLocaleString()
                    : '—'}
                </p>
              </div>

              {/* Status */}
              {renderStatus(item.assignment.status!)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRHistory;