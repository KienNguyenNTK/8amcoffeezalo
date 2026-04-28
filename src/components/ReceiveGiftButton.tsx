import React, { useState } from 'react';
import { giftService } from '../firebase/giftService';
import GiftQRModal from './GiftQRModal';
import { GiftAssignment, Gift, AssignGiftRequest } from '../types/gift';
import { findGiftStoreAllocation } from '../utils/giftHelpers';

interface ReceiveGiftButtonProps {
  giftId: string;
  userId: string;
  storeId: string;
  storeName?: string;
  userInfo: {
    name: string;
    phone: string;
  };
  messageId?: string;
  onSuccess?: (assignment: GiftAssignment) => void;
  onError?: (error: string) => void;
}

const ReceiveGiftButton: React.FC<ReceiveGiftButtonProps> = ({
  giftId,
  userId,
  storeId,
  storeName,
  userInfo,
  messageId,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<GiftAssignment | null>(null);
  const [giftName, setGiftName] = useState<string>('');
  const [gift, setGift] = useState<Gift | null>(null);

  const handleReceiveGift = async () => {
    try {
      setLoading(true);

      const giftData = await giftService.getGiftById(giftId);
      const allocation = findGiftStoreAllocation(giftData, storeId);
      
      if (!allocation) {
        onError?.('Quà chưa được phân bổ cho cơ sở này.');
        return;
      }

      if (allocation.availableQuantity <= 0) {
        onError?.('Cơ sở này đã hết lượt đăng ký quà.');
        return;
      }

      const assignRequest: AssignGiftRequest = {
        giftId,
        userId,
        storeId,
        storeName,
        userInfo,
        metadata: {
          source: 'message',
          storeId,
          storeName,
          messageId,
        },
      };

      const assignmentData = await giftService.assignGift(assignRequest);
      
      setAssignment(assignmentData);
      setQrCode(assignmentData.qrCode || assignmentData.qrCodeBranded || assignmentData.qr || null);
      setGift(giftData);

      setGiftName(giftData.name);
      onSuccess?.(assignmentData);
    } catch (error: any) {
      console.error('Error receiving gift:', error);
      onError?.(error.message || 'Có lỗi xảy ra khi nhận quà');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleReceiveGift}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
      >
        {loading ? 'Đang xử lý...' : 'Đăng ký nhận quà'}
      </button>

      {qrCode && assignment && (
        <GiftQRModal
          qrCode={qrCode}
          giftName={giftName}
          giftId={giftId}
          gift={gift || undefined}
          assignment={assignment}
          onClose={() => {
            setQrCode(null);
            setAssignment(null);
            setGift(null);
          }}
        />
      )}
    </>
  );
};

export default ReceiveGiftButton;
