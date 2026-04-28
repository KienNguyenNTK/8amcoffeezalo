import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserID } from 'zmp-sdk';
import GiftClaimSection from '../components/GiftClaimSection';
import { giftService } from '../firebase/giftService';
import { userService } from '../firebase/userService';
import { Gift, GiftAssignment } from '../types/gift';
import { getCurrentGiftAssignment, hasAvailableGiftStore } from '../utils/giftHelpers';

const Gifts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(undefined);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [assignments, setAssignments] = useState<GiftAssignment[]>([]);

  const loadUserInfo = async () => {
    try {
      const zaloUserId = await getUserID();
      const user: any = await userService.getUserByLocalId(zaloUserId);
      if (!user) {
        setUserInfo(null);
        return;
      }

      const isMember = user.phoneNumber && user.isFollowed;
      if (!isMember) {
        setUserInfo(null);
        return;
      }

      setUserInfo({
        id: user.id,
        name: user.name ?? 'Người dùng',
        phone: user.phoneNumber ?? '',
        tagNames: user.tagNames ?? '',
        isFollowed: user.isFollowed ?? false,
      });
    } catch (error) {
      console.error('Error loading gift user info:', error);
      setUserInfo(null);
    }
  };

  const loadGiftData = async (userId?: string) => {
    try {
      setLoading(true);

      const [giftList, assignmentList] = await Promise.all([
        giftService.getAllActiveGifts(),
        userId ? giftService.getUserAssignments(userId) : Promise.resolve([]),
      ]);

      setGifts(giftList);
      setAssignments(assignmentList);
    } catch (error) {
      console.error('Error loading gift data:', error);
      setGifts([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo === undefined) return;

    if (userInfo === null) {
      navigate('/profile#membership', { replace: true });
      return;
    }

    loadGiftData(userInfo.id);
  }, [navigate, userInfo]);

  const availableGifts = useMemo(() => {
    return gifts.filter((gift) => hasAvailableGiftStore(gift) || Boolean(getCurrentGiftAssignment(gift, assignments)));
  }, [assignments, gifts]);

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 pb-20 pt-10">
        <div className="mb-6 flex items-center justify-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-8am-gray mr-4"
            style={{
              zIndex: 1000,
              position: 'fixed',
              top: '50px',
              left: '20px',
            }}
          >
            <span className="h-4 w-4 text-8am-white inline-flex items-center justify-center">{'<'}</span>
          </button>

          <div className="text-8am-black text-xl font-bold mt-5">Nhận quà</div>
        </div>

        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 p-4">
          <div className="text-lg font-semibold text-gray-900">Chọn quà và cơ sở nhận</div>
          <p className="text-sm text-gray-600 mt-2">
            Mỗi quà được đăng ký một lần trong mỗi chu kỳ. Khi đến quán, bạn chỉ cần đưa mã QR để nhân viên quét như trước.
          </p>
        </div>

        <GiftClaimSection
          gifts={availableGifts}
          assignments={assignments}
          userInfo={userInfo}
          loading={loading}
          emptyTitle="Chưa có quà nào mở nhận"
          emptyDescription="Khi hệ thống phân bổ quà cho cơ sở và còn lượt nhận, quà sẽ xuất hiện ở đây."
          onClaimSuccess={async () => {
            await loadGiftData(userInfo?.id);
          }}
        />
      </div>
    </div>
  );
};

export default Gifts;
