import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserID } from 'zmp-sdk/apis';
import dayjs from 'dayjs';
import Point from '../public/images/point.svg';
import PointPlus from '../public/images/pointplus.svg';
import Voucher from '../public/images/voucher.svg';
import { giftService } from '../firebase/giftService';
import { userService } from '../firebase/userService';
import { Gift, GiftAssignment } from '../types/gift';
import { getCurrentGiftAssignment, hasAvailableGiftStore } from '../utils/giftHelpers';

const Rewards = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>();
  const [assignments, setAssignments] = useState<GiftAssignment[]>([]);
  const [activeGifts, setActiveGifts] = useState<Gift[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const userId = await getUserID();
      const user = await userService.getUserByLocalId(userId);
      if (user) {
        setUserInfo(user);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadGiftOverview = async () => {
      if (!userInfo?.id) return;

      try {
        const [assignmentList, gifts] = await Promise.all([
          giftService.getUserAssignments(userInfo.id),
          giftService.getAllActiveGifts(),
        ]);

        setAssignments(assignmentList);
        setActiveGifts(gifts);
      } catch (error) {
        console.error('Error loading reward gift overview:', error);
        setAssignments([]);
        setActiveGifts([]);
      }
    };

    loadGiftOverview();
  }, [userInfo]);

  const voucherCount = assignments.length;

  const availableGiftCount = useMemo(() => {
    return activeGifts.filter(
      (gift) => hasAvailableGiftStore(gift) || Boolean(getCurrentGiftAssignment(gift, assignments))
    ).length;
  }, [activeGifts, assignments]);

  const dateFormat = (date: any) => {
    if (!date) return '';
    if (date.seconds) {
      return dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY HH:mm:ss');
    }
    if (date instanceof Date) {
      return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
    }
    if (typeof date === 'string') {
      return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
    }
    return '';
  };

  return (
    <div className="p-4 mb-10" style={{ marginTop: '20px' }}>
      <div className="mb-4 flex items-center justify-center">
        <button
          className="p-2 rounded-full bg-8am-gray mr-4"
          style={{
            zIndex: 1000,
            position: 'fixed',
            top: '50px',
            left: '20px',
          }}
          onClick={() => navigate(-1)}
        >
          <span className="h-4 w-4 text-8am-white inline-flex items-center justify-center">{'<'}</span>
        </button>

        <div className="text-8am-black text-xl font-bold mt-5">Khách hàng thân thiết</div>
      </div>

      <div className="bg-white rounded-lg mb-4">
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <img src={Point} alt="" className="w-8 h-8" />
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#333333',
              }}
            >
              {userInfo?.lstPoint?.length > 0
                ? userInfo.lstPoint.reduce((total: number, item: any) => total + item.point, 0)
                : 0}{' '}
              Điểm
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#A3A3A3',
              }}
            >
              Xem lịch sử tích điểm
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-4 p-4 cursor-pointer border-b border-gray-100"
          onClick={() => navigate('/gifts')}
        >
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            G
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#333333',
              }}
            >
              {availableGiftCount} quà có thể nhận
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#A3A3A3',
              }}
            >
              Chọn quà, chọn cơ sở và tạo mã QR nhận quà
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => navigate('/voucher-history')}>
          <img src={Voucher} alt="" className="w-8 h-8" />
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#333333',
              }}
            >
              {voucherCount} voucher
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#A3A3A3',
              }}
            >
              Quản lý mã QR và quà tặng đã nhận
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg mb-4">
        <div className="text-8am-black font-semibold">Lịch sử tích điểm</div>
        <div className="flex items-center text-orange-500 font-medium cursor-pointer" onClick={() => navigate('/point-history')}>
          Xem hết
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {userInfo?.lstPoint?.length > 0 &&
          userInfo.lstPoint.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border-b border-gray-100 bg-white rounded-md"
              onClick={() => navigate(`/orders/${item.orderId}`)}
            >
              <div className="flex items-center gap-2">
                <img src={PointPlus} alt="" className="w-8 h-8" />
                <div>
                  <div className="text-8am-black font-semibold">Tích điểm mua hàng</div>
                  <div className="text-gray-400 text-sm">{dateFormat(item.date)}</div>
                </div>
              </div>

              <div className="text-8am-black font-semibold ml-2">+{item.point} điểm</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Rewards;
