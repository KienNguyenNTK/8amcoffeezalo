import React, { useEffect, useState } from 'react';
import { giftService } from '../firebase/giftService';
import { Gift, GiftAssignment } from '../types/gift';
import { formatGiftDateTime, getAssignmentExpiryDate, sortAssignmentsNewestFirst } from '../utils/giftHelpers';
import GiftDetailModal from './GiftDetailModal';

interface GiftListProps {
  userId: string;
}

interface GiftListItem {
  gift: Gift;
  assignment: GiftAssignment;
}

const GiftList: React.FC<GiftListProps> = ({ userId }) => {
  const [items, setItems] = useState<GiftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<{
    qrCode: string;
    gift: Gift;
    assignment: GiftAssignment;
  } | null>(null);

  useEffect(() => {
    const loadUserGifts = async () => {
      try {
        setLoading(true);

        const assignments = sortAssignmentsNewestFirst(await giftService.getUserAssignments(userId));
        const normalizedItems = assignments
          .filter((assignment) => assignment.gift)
          .map((assignment) => ({
            gift: assignment.gift as Gift,
            assignment,
          }));

        setItems(normalizedItems);
      } catch (error) {
        console.error('Error loading user gifts:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserGifts();
  }, [userId]);

  const openGiftDetail = async (gift: Gift, assignment: GiftAssignment) => {
    try {
      const qrData = assignment.status !== 'redeemed' && assignment.status !== 'expired'
        ? await giftService.getQRCode(assignment.assignmentId)
        : null;

      setSelectedQR({
        gift,
        assignment,
        qrCode: qrData?.qrCodeBranded || qrData?.qrCode || qrData?.qr || '',
      });
    } catch (error) {
      console.error('Error fetching QR:', error);
      setSelectedQR({
        gift,
        assignment,
        qrCode: '',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Bạn chưa có quà nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => {
          const expiryDate = getAssignmentExpiryDate(item.assignment, item.gift);

          return (
            <div
              key={item.assignment.assignmentId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start gap-4">
                {item.gift.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.gift.imageUrl}
                      alt={item.gift.name}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.gift.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.gift.description}</p>
                      {item.assignment.storeName && (
                        <p className="text-xs text-orange-700 mt-2">Nhận tại: {item.assignment.storeName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Đăng ký lúc: {formatGiftDateTime(item.assignment.assignedAt)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Hiệu lực đến: {formatGiftDateTime(expiryDate)}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.assignment.status === 'redeemed'
                              ? 'bg-gray-100 text-gray-600'
                              : item.assignment.status === 'expired'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {item.assignment.status === 'redeemed'
                            ? 'Đã đổi'
                            : item.assignment.status === 'expired'
                            ? 'Hết hạn'
                            : 'Chưa đổi'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openGiftDetail(item.gift, item.assignment)}
                      className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedQR && (
        <GiftDetailModal
          gift={selectedQR.gift}
          assignment={selectedQR.assignment}
          qrCode={selectedQR.qrCode}
          onClose={() => setSelectedQR(null)}
        />
      )}
    </>
  );
};

export default GiftList;
