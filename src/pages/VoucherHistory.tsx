import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaQrcode } from "react-icons/fa";
import { giftService } from "../firebase/giftService";
import { Gift, GiftAssignment } from "../types/gift";
import { getUserID } from "zmp-sdk";
import { userService } from "../firebase/userService";

// Local assignment type that allows Date for assignedAt/redeemedAt
type LocalAssignment = Omit<GiftAssignment, 'assignedAt' | 'redeemedAt'> & {
  assignedAt?: Date | string | null;
  redeemedAt?: Date | string | null;
};

interface VoucherItem {
  gift: Gift;
  assignment: LocalAssignment;
  qrCode: string;
}

const VoucherHistory: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<VoucherItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tất cả" },
    { id: "assigned", label: "Chưa đổi" },
    { id: "redeemed", label: "Đã đổi" },
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

  const loadVouchers = async () => {
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

      const results: VoucherItem[] = [];

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
      console.error("Load vouchers error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  /** Filter list */
  const filtered = list.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.assignment.status === selectedFilter;
  });

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
          Voucher của bạn
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${selectedFilter === f.id
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
          <p className="text-gray-500 font-medium">Không có voucher nào</p>
          <p className="text-sm text-gray-400 mt-2">Bạn chưa nhận quà tặng nào</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map((item, idx) => {
          const isRedeemed = item.assignment.status === "redeemed";

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
              className="cursor-pointer"
              style={{
                display: 'flex',
                width: '100%',
                height: '140px',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              {/* Left Section - Thông tin quà (nền trắng) */}
              <div
                className="flex flex-col"
                style={{
                  width: '60%',
                  padding: '20px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Status Badge - ở trên cùng */}

                <div className="flex justify-between items-center">

                  <div style={{
                    fontSize: '0.85rem',
                    marginBottom: '6px',
                    color: '#666',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    VOUCHER
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      isRedeemed 
                        ? "bg-gray-100 text-gray-700" 
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isRedeemed ? "Đã đổi" : "Chưa đổi"}
                  </span>
                </div>

                </div>

                <div
                  className="font-bold text-8am-black"
                  style={{
                    fontSize: '1.1rem',
                    marginBottom: '6px',
                    lineHeight: '1.3',
                  }}
                >
                  {item.gift.name}
                </div>

                {item.gift.description && (
                  <div
                    className="text-gray-600 line-clamp-3"
                    style={{
                      fontSize: '0.75rem',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.gift.description}
                  </div>
                )}
              </div>

              {/* Divider - Đường kẻ đứt đoạn */}
              <div
                style={{
                  width: '2px',
                  backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)',
                  marginTop: '16px',
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 2,
                }}
              />

              {/* Right Section - Ảnh làm background (không có overlay) */}
              <div
                className="flex flex-col justify-center relative"
                style={{
                  width: '40%',
                  padding: '20px',
                  position: 'relative',
                  backgroundImage: item.gift.imageUrl
                    ? `url(${item.gift.imageUrl})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: item.gift.imageUrl ? 'transparent' : '#00c853',
                }}
              >
                {/* Content - chỉ hiển thị khi không có ảnh */}
                {!item.gift.imageUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaQrcode className="text-3xl text-white/80" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoucherHistory;
