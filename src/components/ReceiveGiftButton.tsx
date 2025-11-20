import React, { useState } from 'react';
import { giftService, AssignGiftRequest } from '../firebase/giftService';
import GiftQRModal from './GiftQRModal';
import { GiftAssignment } from '../types/gift';

interface ReceiveGiftButtonProps {
  giftId: string;
  userId: string;
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
  userInfo,
  messageId,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<GiftAssignment | null>(null);
  const [giftName, setGiftName] = useState<string>('');

  const handleReceiveGift = async () => {
    try {
      setLoading(true);

      // Kiểm tra gift còn available không
      const gift = await giftService.getGiftById(giftId);
      
      if (gift.availableQuantity <= 0) {
        onError?.('Quà đã hết!');
        return;
      }

      // Gán gift cho user
      const assignRequest: AssignGiftRequest = {
        giftId,
        userId,
        userInfo,
        metadata: {
          source: 'message',
          messageId,
        },
      };

      const assignmentData = await giftService.assignGift(assignRequest);
      console.log("Assignment data returned:", assignmentData);
      console.log("QR field value:", assignmentData.qrCode?.slice(0, 100) || assignmentData.qrCode);
      
      setAssignment(assignmentData);
      setQrCode(assignmentData.qrCode);
      console.log('State updated → qrCode =', !!assignmentData.qrCode);

      setGiftName(gift.name);
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
        {loading ? 'Đang xử lý...' : 'Nhận quà'}
      </button>

      {qrCode && assignment && (
        <GiftQRModal
          qrCode={qrCode}
          giftName={giftName}
          assignment={assignment}
          onClose={() => {
            setQrCode(null);
            setAssignment(null);
          }}
        />
      )}
    </>
  );
};

export default ReceiveGiftButton;