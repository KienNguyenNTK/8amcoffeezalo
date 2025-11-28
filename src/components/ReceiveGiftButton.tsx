import React, { useState } from 'react';
import { giftService, AssignGiftRequest } from '../firebase/giftService';
import GiftQRModal from './GiftQRModal';
import { GiftAssignment, Gift } from '../types/gift';

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
  const [gift, setGift] = useState<Gift | null>(null);

  const handleReceiveGift = async () => {
    try {
      setLoading(true);

      // Kiểm tra gift còn available không
      const giftData = await giftService.getGiftById(giftId);
      
      if (giftData.availableQuantity <= 0) {
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
      setGift(giftData);
      console.log('State updated → qrCode =', !!assignmentData.qrCode);

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
        {loading ? 'Đang xử lý...' : 'Nhận quà'}
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