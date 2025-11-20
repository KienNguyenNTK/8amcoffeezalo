import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaShare, FaBookmark } from 'react-icons/fa';
import { messageService } from '../firebase/messageService';
import { Message } from '../types/message';
import moment from 'moment';
import { giftService } from '../firebase/giftService';
import { Gift } from '../types/gift';
import GiftTag from '../components/GiftTag';
import ReceiveGiftButton from '../components/ReceiveGiftButton';
import GiftQRModal from '../components/GiftQRModal';
import { getUserID } from 'zmp-sdk';
import { userService } from '../firebase/userService';
import { GiftAssignment } from '../types/gift';

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [message, setMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [giftsLoading, setGiftsLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
    const [selectedGift, setSelectedGift] = useState<any>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [assignmentData, setAssignmentData] = useState<GiftAssignment | null>(null);
    const [giftName, setGiftName] = useState<string>("");
    const [alreadyClaimed, setAlreadyClaimed] = useState(false);
    const [claimedGiftId, setClaimedGiftId] = useState<string | null>(null);

    useEffect(() => {
    const testAPI = async () => {
        try {
        const gifts = await giftService.getAllGifts();
        console.log("✅ API connected, gift list:", gifts);
        } catch (error) {
        console.error("❌ API not reachable:", error);
        }
    };
    testAPI();
    }, []);

    useEffect(() => {
    if (id) {
      loadNewsDetail(id);
      loadUserInfo();
    }
    }, [id]);

    useEffect(() => {
        const idsFromRelated = message?.related_gifts?.map((g: any) => g.id);

        const idsFromOld = message?.giftIds;

        const giftIdList = idsFromRelated || idsFromOld;

        if (giftIdList && giftIdList.length > 0) {
            loadGifts(giftIdList);
        }
    }, [message]);

    const loadUserInfo = async () => {
        try {
        const zaloUserId = await getUserID();
        const user: any = await userService.getUserByLocalId(zaloUserId);

        if (user) {
            setUserInfo({
            id: user.id,
            name: user.name || 'Người dùng',
            phone: user.phoneNumber || '',
            });
        }
        } catch (error) {
        console.error('Error loading user info:', error);
        }
    };

    const loadGifts = async (giftIds: string[]) => {
        try {
        setGiftsLoading(true);
        const giftPromises = giftIds.map(giftId =>
            giftService.getGiftById(giftId)
        );
        const giftData = await Promise.all(giftPromises);
        setGifts(giftData);
        } catch (error) {
        console.error('Error loading gifts:', error);
        } finally {
        setGiftsLoading(false);
        }
    };

    // useEffect(() => {
    //     if (gifts.length > 0 && userInfo && message?.id) {
    //         checkUserClaim();
    //     }
    // }, [gifts, userInfo, message]);

    // const checkUserClaim = async () => {
    //     if (!userInfo?.id || !gifts.length) return;

    //     try {
    //         for (const g of gifts) {
    //             const status = await giftService.checkStatus(g.id, userInfo.id);

    //             if (status.hasAssignment) {
    //                 setAlreadyClaimed(true);
    //                 setClaimedGiftId(g.id);
    //                 return;
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Error checking claim:", err);
    //     }
    // };

    const handleConfirmGift = async () => {
        if (!selectedGift || !userInfo) return;

        try {
            const assignmentData = await giftService.assignGift({
                giftId: selectedGift.id,
                userId: userInfo.id,
                userInfo: userInfo,
                metadata: {
                    source: "message",
                    messageId: message?.id
                }
            });

            setAssignmentData(assignmentData);
            setQrCode(assignmentData.qrCode);
            setGiftName(selectedGift.name);

            handleGiftSuccess(assignmentData);
        } catch (error: any) {
            handleGiftError(error.message || "Có lỗi xảy ra");
        }
    };

    const handleGiftSuccess = (assignment: any) => {
        // Reload gifts để cập nhật số lượng
        if (message?.giftIds) {
        loadGifts(message.giftIds);
        }
        // Có thể show notification
        console.log('Gift received successfully:', assignment);
    };

    const handleGiftError = (error: string) => {
        // Show error notification
        console.error('Gift error:', error);
        alert(error);
    };

    console.log("Message:", message);
    console.log("Gift IDs:", message?.giftIds);
    console.log("Gifts loaded:", gifts);
    console.log("User info:", userInfo);

    const loadNewsDetail = async (messageId: string) => {
        try {
            setLoading(true);
            const newsData = await messageService.getMessage(messageId);
            setMessage(newsData);
        } catch (error) {
            console.error('Error loading news detail:', error);
            setError('Không thể tải nội dung tin tức');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share && message) {
            navigator.share({
                title: message.template_data?.header?.content || 'Tin tức',
                text: message.template_data?.text?.content?.replace(/<br>/g, '\n'),
                url: window.location.href,
            }).catch((error) => {
                console.log('Error sharing:', error);
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href);
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        // Kiểm tra nếu timestamp là Firestore Timestamp
        if (timestamp.seconds) {
            return moment(timestamp.seconds * 1000).format('DD/MM/YYYY HH:mm');
        }
        // Nếu là Date object hoặc string
        return moment(timestamp).format('DD/MM/YYYY HH:mm');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
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
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-10 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            >
                <FaArrowLeft className="text-gray-700" />
            </button>
            
            {/* Content */}
            <div className="p-4 pb-20 pt-24">
                {/* Banner Image */}
                {message.template_data?.banner?.image_url && (
                    <div className="w-full h-64 mb-6 rounded-xl overflow-hidden">
                        <img
                            src={message.template_data.banner.image_url}
                            alt={message.template_data?.header?.content || 'Tin tức'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Article Header */}
                <div className="mb-6">
                    {message.template_data?.header?.content && (
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                            {message.template_data.header.content}
                        </h1>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                        <FaCalendarAlt className="mr-2" />
                        <span>{formatTimestamp(message.timestamp)}</span>
                    </div>

                    {/* Tags/Categories from Related Products */}
                </div>

                {/* Article Content */}
                {message.template_data?.text?.content && (
                    <div className="prose prose-gray max-w-none mb-8">
                        <div 
                            className="text-gray-800 leading-relaxed text-base"
                            dangerouslySetInnerHTML={{ 
                                __html: message.template_data.text.content.replace(/<br>/g, '<br/>')
                            }} 
                        />
                    </div>
                )}

                {/* Table Data (if exists) */}
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

                {/* Action Buttons */}
                {/* {message.template_data?.buttons && message.template_data.buttons.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động</h3>
                        <div className="space-y-3">
                            {message.template_data.buttons.map((button, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (button.payload?.url) {
                                            window.open(button.payload.url, '_blank');
                                        }
                                    }}
                                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
                                >
                                    {button.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )} */}

                {/* Related Products Section */}
                {message.related_products && message.related_products.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm liên quan</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {message.related_products.map((product, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                                        <p className="text-sm text-gray-600 capitalize">
                                            {product.type === 'coffee' && 'Hạt cà phê'}
                                            {product.type === 'bottled_drink' && 'Đồ uống'}
                                            {product.type === 'dish' && 'Cà phê'}
                                            {product.type === 'coffee_equipment' && 'Dụng cụ cà phê'}
                                        </p>
                                        {product.price && (
                                            <p className="text-sm font-semibold text-orange-600">
                                                {product.price.toLocaleString()}đ
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (product.type === 'coffee') {
                                                navigate(`/coffee/${product.originalId}`);
                                            } else if (product.type === 'bottled_drink') {
                                                navigate(`/bottled-drink/${product.originalId}`);
                                            } else if (product.type === 'dish') {
                                                navigate(`/dish/${product.originalId}`);
                                            } else if (product.type === 'coffee_equipment') {
                                                navigate(`/coffee-equipment/${product.originalId}`);
                                            }
                                        }}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                                    >
                                        Xem
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {gifts.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Chọn quà tặng
                        </h3>

                        {gifts.map((gift) => {
                            const isOut = gift.availableQuantity <= 0;

                            return (
                                <label
                                    key={gift.id}
                                    className={`flex items-center gap-3 p-3 mb-2 border rounded-xl ${
                                        isOut
                                            ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                                            : 'bg-white cursor-pointer'
                                    }`}
                                >
                                    <input
                                      type="radio"
                                      name="giftChoice"
                                      value={gift.id}
                                      disabled={
                                            isOut ||
                                            (alreadyClaimed && claimedGiftId !== gift.id)
                                        }
                                      checked={selectedGiftId === gift.id}
                                      onChange={() => {
                                        if (!isOut && !alreadyClaimed) {
                                          setSelectedGiftId(gift.id);
                                          setSelectedGift(gift);
                                        }
                                      }}
                                    />

                                    <div className="flex-1">
                                        <div className="font-medium">{gift.name}</div>
                                        <div className="text-sm text-gray-500">{gift.description}</div>
                                        {alreadyClaimed && claimedGiftId === gift.id && (
                                          <p className="text-green-600 text-xs mt-1">Bạn đã nhận quà này</p>
                                        )}
                                        {alreadyClaimed && claimedGiftId !== gift.id && (
                                          <p className="text-red-500 text-xs mt-1">Bạn đã chọn quà khác trong tin này</p>
                                        )}
                                        {isOut && (
                                            <p className="text-xs text-red-600 mt-1">Quà đã hết</p>
                                        )}
                                    </div>
                                </label>
                            );
                        })}

                        {selectedGift && (
                            <div className="p-4 mt-4 border rounded-xl bg-gray-50">
                                <h3 className="font-semibold text-lg mb-2">Thông tin quà tặng</h3>
                                <p><strong>Tên quà:</strong> {selectedGift.name}</p>
                                <p><strong>Mô tả:</strong> {selectedGift.description}</p>
                                <p><strong>Còn lại:</strong> {selectedGift.availableQuantity}</p>
                            </div>
                        )}

                        {selectedGift && (
                            <button
                                onClick={handleConfirmGift}
                                className="w-full mt-4 py-3 bg-orange-500 text-white font-semibold rounded-xl"
                            >
                                Xác nhận nhận quà
                            </button>
                        )}
                    </div>
                )}

                {qrCode && assignmentData && (
                    <GiftQRModal
                        qrCode={qrCode}
                        giftName={giftName}
                        assignment={assignmentData}
                        onClose={() => {
                        setQrCode(null);
                        setAssignmentData(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default NewsDetail;
