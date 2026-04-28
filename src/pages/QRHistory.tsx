import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserID } from "zmp-sdk";
import { giftService } from "../firebase/giftService";
import { userService } from "../firebase/userService";
import { GiftAssignment } from "../types/gift";
import {
  formatGiftDateShort,
  formatGiftTimeShort,
  getAssignmentExpiryDate,
  sortAssignmentsNewestFirst,
} from "../utils/giftHelpers";

const QRHistory: React.FC = () => {
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
        console.error("Load QR history error:", error);
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

  const renderStatus = (status: string) => {
    if (status === "redeemed") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          Đã đổi
        </span>
      );
    }

    if (status === "expired") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          Hết hạn
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
        Chưa đổi
      </span>
    );
  };

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
        <div className="text-8am-black text-xl font-bold mt-5">Kho QR của bạn</div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
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
          <p className="text-gray-500 font-medium">Không có QR nào</p>
          <p className="text-sm text-gray-400 mt-2">Bạn chưa nhận quà tặng nào</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((assignment) => {
          const gift = assignment.gift!;
          const expiryDate = getAssignmentExpiryDate(assignment, gift);

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
              className="bg-white rounded-lg p-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {gift.imageUrl ? (
                  <div className="flex-shrink-0">
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-xl text-gray-400 font-semibold">QR</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-8am-black line-clamp-1">{gift.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{gift.description}</p>
                      {assignment.storeName && (
                        <p className="text-xs text-orange-700 mt-2">Nhận tại: {assignment.storeName}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0">{renderStatus(assignment.status)}</div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Nhận lúc: {formatGiftTimeShort(assignment.assignedAt)} {formatGiftDateShort(assignment.assignedAt)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Hiệu lực đến: {formatGiftTimeShort(expiryDate)} {formatGiftDateShort(expiryDate)}
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
