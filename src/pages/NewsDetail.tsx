import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import GiftClaimSection from '../components/GiftClaimSection';
import { giftService } from '../firebase/giftService';
import { messageService } from '../firebase/messageService';
import { userService } from '../firebase/userService';
import { Gift, GiftAssignment } from '../types/gift';
import { Message, RelatedGiftMessageItem } from '../types/message';
import { getUserID } from 'zmp-sdk';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [assignments, setAssignments] = useState<GiftAssignment[]>([]);
  const [userInfo, setUserInfo] = useState<any>(undefined);
  const giftSectionRef = useRef<HTMLDivElement | null>(null);

  const relatedGiftIds = useMemo(() => {
    const idsFromRelated = message?.related_gifts?.map((gift) => gift.id) || [];
    const idsFromOld = message?.giftIds || [];
    return Array.from(new Set([...idsFromRelated, ...idsFromOld].filter(Boolean)));
  }, [message]);

  const relatedGiftItems = useMemo(() => {
    if (!message?.related_gifts) return [];

    return Array.from(
      message.related_gifts
        .filter((gift) => Boolean(gift.id))
        .reduce(
          (giftMap, gift) => giftMap.set(gift.id, gift),
          new Map<string, RelatedGiftMessageItem>()
        )
        .values()
    );
  }, [message]);

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
    } catch (loadUserError) {
      console.error(loadUserError);
      setUserInfo(null);
    }
  };

  const loadNewsDetail = async (messageId: string) => {
    try {
      setLoading(true);
      const newsData = await messageService.getMessage(messageId);
      setMessage(newsData);
    } catch (loadMessageError) {
      console.error('Error loading news detail:', loadMessageError);
      setError('Không thể tải nội dung tin tức');
    } finally {
      setLoading(false);
    }
  };

  const loadGifts = async (giftIds: string[]) => {
    if (giftIds.length === 0) {
      setGifts([]);
      return;
    }

    try {
      setGiftsLoading(true);
      const giftData = await Promise.all(giftIds.map((giftId) => giftService.getGiftById(giftId)));
      setGifts(giftData);
    } catch (loadGiftError) {
      console.error('Error loading gifts:', loadGiftError);
      setGifts([]);
    } finally {
      setGiftsLoading(false);
    }
  };

  const loadAssignments = async (targetUserId?: string) => {
    if (!targetUserId) {
      setAssignments([]);
      return;
    }

    try {
      const nextAssignments = await giftService.getUserAssignments(targetUserId);
      setAssignments(nextAssignments);
    } catch (loadAssignmentError) {
      console.error('Error loading gift assignments:', loadAssignmentError);
      setAssignments([]);
    }
  };

  const refreshGiftState = async () => {
    await Promise.all([loadGifts(relatedGiftIds), loadAssignments(userInfo?.id)]);
  };

  useEffect(() => {
    if (id) {
      loadNewsDetail(id);
      loadUserInfo();
    }
  }, [id]);

  useEffect(() => {
    if (relatedGiftIds.length > 0) {
      loadGifts(relatedGiftIds);
    } else {
      setGifts([]);
    }
  }, [relatedGiftIds]);

  useEffect(() => {
    if (userInfo?.id) {
      loadAssignments(userInfo.id);
    } else if (userInfo === null) {
      setAssignments([]);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!message) return;

    const hasGift =
      (message.related_gifts && message.related_gifts.length > 0) ||
      (message.giftIds && message.giftIds.length > 0);

    if (!hasGift) return;
    if (userInfo === undefined) return;

    if (userInfo === null) {
      navigate('/profile#membership', { replace: true });
    }
  }, [message, navigate, userInfo]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.seconds) {
      return moment(timestamp.seconds * 1000).format('DD/MM/YYYY HH:mm');
    }
    return moment(timestamp).format('DD/MM/YYYY HH:mm');
  };

  const getProductTypeLabel = (type: string) => {
    if (type === 'coffee') return 'Hạt cà phê';
    if (type === 'bottled_drink') return 'Đồ uống';
    if (type === 'dish') return 'Cà phê';
    if (type === 'coffee_equipment') return 'Dụng cụ cà phê';
    return 'Sản phẩm';
  };

  const openProductDetail = (product: NonNullable<Message['related_products']>[number]) => {
    if (product.type === 'coffee') {
      navigate(`/coffee/${product.originalId}`);
    } else if (product.type === 'bottled_drink') {
      navigate(`/bottled-drink/${product.originalId}`);
    } else if (product.type === 'dish') {
      navigate(`/dish/${product.originalId}`);
    } else if (product.type === 'coffee_equipment') {
      navigate(`/coffee-equipment/${product.originalId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
          <p className="text-gray-600 mt-4">Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy tin tức</h2>
          <p className="text-gray-600 mb-6">{error || 'Tin tức này có thể đã bị xóa hoặc không tồn tại'}</p>
          <button
            onClick={() => navigate('/for-you')}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-10 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-700 text-lg">{'<'}</span>
      </button>

      <div className="p-4 pb-20 pt-24">
        {message.template_data?.banner?.image_url && (
          <div className="w-full h-64 mb-6 rounded-xl overflow-hidden">
            <img
              src={message.template_data.banner.image_url}
              alt={message.template_data?.header?.content || 'Tin tức'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mb-6">
          {message.template_data?.header?.content && (
            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
              {message.template_data.header.content}
            </h1>
          )}

          <div className="flex items-center text-sm text-gray-600 mb-4">
            <span className="mr-2">Ngay:</span>
            <span>{formatTimestamp(message.timestamp)}</span>
          </div>
        </div>

        {message.template_data?.text?.content && (
          <div className="prose prose-gray max-w-none mb-8">
            <div
              className="text-gray-800 leading-relaxed text-base"
              dangerouslySetInnerHTML={{
                __html: message.template_data.text.content.replace(/<br>/g, '<br/>'),
              }}
            />
          </div>
        )}

        {message.template_data?.table?.rows && message.template_data.table.rows.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {message.template_data.table.rows.map((row, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <span className="font-medium text-gray-700">{row.key}:</span>
                  <span className="text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {message.related_products && message.related_products.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sản phẩm liên quan</h3>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {message.related_products.length} sản phẩm liên quan
                </p>
              </div>
              {relatedGiftIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => giftSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700"
                >
                  Đến quà
                </button>
              )}
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {message.related_products.map((product, index) => (
                <div
                  key={`${product.type}-${product.originalId || product.id || index}`}
                  className="flex w-[252px] shrink-0 snap-start items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">{product.name}</h4>
                    <p className="mt-1 text-xs text-gray-600">{getProductTypeLabel(product.type)}</p>
                    {product.price && (
                      <p className="mt-1 text-sm font-semibold text-orange-600">{product.price.toLocaleString()}đ</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openProductDetail(product)}
                    className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                  >
                    Xem
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {relatedGiftIds.length > 0 && (
          <div ref={giftSectionRef} className="scroll-mt-24 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn quà tặng</h3>
            <GiftClaimSection
              gifts={gifts}
              assignments={assignments}
              userInfo={userInfo}
              loading={giftsLoading}
              messageId={message.id}
              relatedGiftItems={relatedGiftItems}
              emptyTitle="Tin này chưa có quà khả dụng"
              emptyDescription="Nếu quà đã hết hoặc chưa được phân bổ cơ sở, hệ thống sẽ ẩn khả năng đăng ký."
              onClaimSuccess={refreshGiftState}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
