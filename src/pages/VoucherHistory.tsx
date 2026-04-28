import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserID } from "zmp-sdk";
import { giftService } from "../firebase/giftService";
import { userService } from "../firebase/userService";
import { GiftAssignment } from "../types/gift";
import { getAssignmentExpiryDate, sortAssignmentsNewestFirst } from "../utils/giftHelpers";

const VoucherHistory: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<GiftAssignment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tất cả" },
    { id: "assigned", label: "Chưa đổi" },
    { id: "redeemed", label: "Đã đổi" },
    { id: "expired", label: "Hết hạn" },
  ];

  useEffect(() => {
    const loadAssignments = async () => {
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

        const assignments = await giftService.getUserAssignments(firebaseUser.id as string);
        setList(sortAssignmentsNewestFirst(assignments).filter((assignment) => assignment.gift));
      } catch (error) {
        console.error("Load vouchers error:", error);
        setList([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const filtered = useMemo(() => {
    return list.filter((item) => selectedFilter === "all" || item.status === selectedFilter);
  }, [list, selectedFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-orange-600 rounded-full" />
      </div>
    );
  }

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
        <div className="text-8am-black text-xl font-bold mt-5">Voucher của bạn</div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedFilter === filter.id
                  ? "bg-8am-orange text-white"
                  : "bg-gray-100 text-8am-black hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="mx-auto text-4xl mb-4 text-gray-300 font-semibold">QR</div>
          <p className="text-gray-500 font-medium">Không có voucher nào</p>
          <p className="text-sm text-gray-400 mt-2">Bạn chưa nhận quà tặng nào</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((assignment) => {
          const gift = assignment.gift!;
          const expiryDate = getAssignmentExpiryDate(assignment, gift);
          const isRedeemed = assignment.status === "redeemed";
          const isExpired = assignment.status === "expired";

          return (
            <div
              key={assignment.assignmentId}
              onClick={() =>
                navigate("/qr-detail", {
                  state: {
                    gift,
                    assignment,
                  },
                })
              }
              className="cursor-pointer"
              style={{
                display: "flex",
                width: "100%",
                minHeight: "152px",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                background: "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                className="flex flex-col"
                style={{
                  width: "62%",
                  padding: "20px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div className="flex justify-between items-center">
                  <div
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: "6px",
                      color: "#666",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    VOUCHER
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        isRedeemed
                          ? "bg-gray-100 text-gray-700"
                          : isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isRedeemed ? "Đã đổi" : isExpired ? "Hết hạn" : "Chưa đổi"}
                    </span>
                  </div>
                </div>

                <div
                  className="font-bold text-8am-black"
                  style={{
                    fontSize: "1.1rem",
                    marginBottom: "6px",
                    lineHeight: "1.3",
                  }}
                >
                  {gift.name}
                </div>

                {gift.description && (
                  <div
                    className="text-gray-600 line-clamp-2"
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: "1.4",
                    }}
                  >
                    {gift.description}
                  </div>
                )}

                {assignment.storeName && (
                  <div className="text-xs text-orange-700 mt-3">Nhận tại: {assignment.storeName}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">Hiệu lực đến: {expiryDate ? expiryDate.toLocaleString("vi-VN") : "—"}</div>
              </div>

              <div
                style={{
                  width: "2px",
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)",
                  marginTop: "16px",
                  marginBottom: "16px",
                  position: "relative",
                  zIndex: 2,
                }}
              />

              <div
                className="flex flex-col justify-center relative"
                style={{
                  width: "38%",
                  padding: "20px",
                  position: "relative",
                  backgroundImage: gift.imageUrl ? `url(${gift.imageUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: gift.imageUrl ? "transparent" : "#00c853",
                }}
              >
                {!gift.imageUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl text-white/80 font-semibold">QR</span>
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
