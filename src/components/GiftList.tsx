import React, { useEffect, useState } from 'react';
import { giftService } from '../firebase/giftService';
import { GiftAssignment, Gift } from '../types/gift';
import GiftDetailModal from './GiftDetailModal';

interface GiftListProps {
  userId: string;
}

const GiftList: React.FC<GiftListProps> = ({ userId }) => {
  const [gifts, setGifts] = useState<Array<{
    gift: Gift;
    assignment: GiftAssignment | null;
    qrCode: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<{
    qrCode: string;
    gift: Gift;
    assignment: GiftAssignment;
  } | null>(null);

  useEffect(() => {
    loadUserGifts();
  }, [userId]);

  const openGiftDetail = async (gift: Gift, assignment: GiftAssignment) => {
    try {
      const qrData = await giftService.getQRCode(assignment.assignmentId);
      setSelectedQR({
        gift,
        assignment,
        qrCode: qrData.qrCodeBranded || qrData.qrCode,
      });
    } catch (error) {
      console.error("Error fetching QR:", error);
    }
  };

  const loadUserGifts = async () => {
    try {
      setLoading(true);
      const allGifts = await giftService.getAllGifts();
      
      const userGifts = await Promise.all(
        allGifts.map(async (gift) => {
          const status = await giftService.checkStatus(gift.id, userId);

          if (status.hasAssignment && status.assignmentId) {
            const qrData = await giftService.getQRCode(status.assignmentId);

            return {
              gift,
              assignment: {
                assignmentId: status.assignmentId,
                giftId: gift.id,
                userId,
                status: status.status || 'assigned',
                assignedAt: status.redeemedAt || new Date().toISOString(),
                qrTarget: qrData.qrTarget,
                qrQuery: qrData.qrQuery,
                qrCode: qrData.qrCode,
              } as GiftAssignment,
              qrCode: qrData.qrCode,
            };
          }

          return null;
        })
      );

      setGifts(userGifts.filter(item => item !== null) as any);
    } catch (error) {
      console.error('Error loading user gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Bạn chưa có quà nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {gifts.map((item) => (
          <div
            key={item.gift.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start gap-4">
              {/* Gift Image */}
              {item.gift.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={item.gift.imageUrl}
                    alt={item.gift.name}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      // Hide image on error
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.gift.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.gift.description}</p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.assignment?.status === 'redeemed'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {item.assignment?.status === 'redeemed' ? 'Đã đổi' : 'Chưa đổi'}
                      </span>
                    </div>
                  </div>
                  {item.assignment && item.assignment.status === 'assigned' && (
                    <button
                      onClick={() => openGiftDetail(item.gift, item.assignment!)}
                      className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Xem QR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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