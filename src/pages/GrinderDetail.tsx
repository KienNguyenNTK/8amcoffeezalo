import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaShoppingCart, FaChevronRight } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { CoffeeGrinder } from '../types/grinder';
import { GrinderService } from '../firebase/grinderService';
import { favoriteService } from '../firebase/favoriteService';
import { userService } from '../firebase/userService';
import { getUserID } from 'zmp-sdk/apis';
import { useCartCount } from '../hooks/useCartCount';
import { notification } from 'antd';
import { cartService } from '../firebase/cartService';
import { CartItem } from '../types/cart';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import MachineCard from '../components/machine-card';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './custom-swiper.css';

const GrinderDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grinder, setGrinder] = useState<CoffeeGrinder | null>(null);
    const [userInfo, setUserInfo] = useState<any>();
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [relatedGrinders, setRelatedGrinders] = useState<CoffeeGrinder[]>([]);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const cartItemCount = useCartCount(userInfo?.id);
    const grinderService = new GrinderService();

    useEffect(() => {
        checkLocal();
    }, []);

    useEffect(() => {
        if (id) {
            getGrinderById();
            checkFavoriteStatus();
            getLikesCount();
            getRelatedGrinders();
        }
    }, [id, userInfo]);

    useEffect(() => {
        if (grinder && userInfo?.id) {
            let imageUrl = '';
            if (grinder.images && grinder.images.length > 0) {
                imageUrl = grinder.images[0];
            } else if (grinder.driveImages && grinder.driveImages.length > 0) {
                imageUrl = `https://lh3.googleusercontent.com/d/${grinder.driveImages[0].fileId}?authuser=server`;
            }

            // Ghi lịch sử xem với Firebase
            recentlyViewedService.addToRecentlyViewed(
                {
                    ...grinder,
                    id: grinder.id,
                    name: grinder.product_name,
                    imageUrl: imageUrl,
                    type: 'grinder',
                },
                'grinder',
                userInfo.id
            );
        }
    }, [grinder, userInfo]);

    const checkLocal = async () => {
        try {
            const userId = await getUserID();
            if (userId) {
                const user = await userService.getUserByLocalId(userId);
                if (user) {
                    setUserInfo(user);
                }
            }
        } catch (error) {
            console.error('Error checking user info:', error);
        }
    };

    const getGrinderById = async () => {
        try {
            setLoading(true);
            if (id) {
                const grinderData = await grinderService.getById(id);
                setGrinder(grinderData);
            }
        } catch (error) {
            console.error('Error loading grinder:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImages = (): string[] => {
        if (!grinder) return [];
        
        const images: string[] = [];
        
        // Add regular images
        if (grinder.images && grinder.images.length > 0) {
            images.push(...grinder.images);
        }
        
        // Add drive images
        if (grinder.driveImages && grinder.driveImages.length > 0) {
            grinder.driveImages.forEach(img => {
                images.push(`https://lh3.googleusercontent.com/d/${img.fileId}?authuser=server`);
            });
        }
        
        return images;
    };

    const checkFavoriteStatus = async () => {
        try {
            if (userInfo && id) {
                const favorite = await favoriteService.getFavorite(userInfo.id, id);
                setIsFavorite(!!favorite);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const getLikesCount = async () => {
        if (id) {
            const count = await favoriteService.getCoffeeLikesCount(id);
            setLikesCount(count);
        }
    };

    const handleFavoriteClick = async () => {
        try {
            const newFavoriteState = !isFavorite;
            setIsFavorite(newFavoriteState);

            if (!userInfo) {
                notification.warning({
                    message: 'Yêu cầu thông tin',
                    description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để yêu thích sản phẩm',
                    duration: 1.5,
                    placement: 'top'
                });
                navigate('/profile');
                return;
            }

            if (id) {
                if (newFavoriteState) {
                    const result = await favoriteService.addFavorite(userInfo.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể yêu thích sản phẩm',
                            duration: 1.5,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã yêu thích sản phẩm',
                        duration: 1.5,
                        placement: 'top'
                    });
                    await getLikesCount();
                } else {
                    const result = await favoriteService.removeFavorite(userInfo.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể bỏ yêu thích sản phẩm',
                            duration: 1.5,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã bỏ yêu thích sản phẩm',
                        duration: 1.5,
                        placement: 'top'
                    });
                    await getLikesCount();
                }
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            notification.error({
                message: 'Không thể cập nhật trạng thái yêu thích',
                duration: 3,
                placement: 'top'
            });
            await checkFavoriteStatus();
        }
    };

    const getRelatedGrinders = async () => {
        try {
            const allGrinders = await grinderService.getAll();
            // Filter out current grinder and get random 4
            const filtered = allGrinders.filter(g => g.id !== id);
            const shuffled = filtered.sort(() => 0.5 - Math.random());
            setRelatedGrinders(shuffled.slice(0, 4));
        } catch (error) {
            console.error('Error loading related grinders:', error);
        }
    };

    const handleAddToCart = async () => {
        try {
            setIsAddingToCart(true);

            if (!userInfo) {
                notification.warning({
                    message: 'Yêu cầu thông tin',
                    description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để thêm vào giỏ hàng',
                    duration: 1.5,
                    placement: 'top'
                });
                navigate('/profile');
                return;
            }

            if (userInfo && grinder) {
                let imageUrl = '';
                if (grinder.images && grinder.images.length > 0) {
                    imageUrl = grinder.images[0];
                } else if (grinder.driveImages && grinder.driveImages.length > 0) {
                    imageUrl = `https://lh3.googleusercontent.com/d/${grinder.driveImages[0].fileId}?authuser=server`;
                }

                const cartItem: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'> = {
                    userId: userInfo.id,
                    grinderId: grinder.id,
                    quantity: 1,
                    price: grinder.price,
                    name: grinder.product_name,
                    imageUrl: imageUrl,
                    type: 'grinder'
                };

                await cartService.addToCart(userInfo.id, cartItem);
                notification.success({
                    message: 'Đã thêm vào giỏ hàng',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể thêm vào giỏ hàng do không có thông tin người dùng',
                duration: 3,
                placement: 'top',
                closable: false
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    if (!grinder) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-lg text-gray-500">Không tìm thấy máy xay cà phê</div>
            </div>
        );
    }

    const images = getImages();

    return (
        <>
            {grinder && (
                <div
                    style={{
                        marginBottom: 40,
                        marginTop: 100,
                    }}
                >
                    {/* Header Image */}
                    <div className="relative w-full h-[300px] flex justify-center items-center mb-8">
                        {images.length > 0 ? (
                            <Swiper
                                modules={[Autoplay, Pagination]}
                                spaceBetween={0}
                                slidesPerView={1}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                pagination={{ 
                                    clickable: true, 
                                    bulletClass: 'swiper-pagination-bullet', 
                                    bulletActiveClass: 'swiper-pagination-bullet-active' 
                                }}
                                loop={true}
                                style={{
                                    width: '80%',
                                    height: '100%',
                                    borderRadius: 10,
                                }}
                            >
                                {images.map((image, index) => (
                                    <SwiperSlide key={index}>
                                        <img 
                                            src={image} 
                                            alt={grinder.product_name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        ) : (
                            <div className="w-80 h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <div className="text-gray-400 text-center">
                                    <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12,3C13.11,3 14,3.89 14,5H22V7H20V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V7H2V5H10C10,3.89 10.89,3 12,3M6,19H18V7H6V19M8,9H16V11H8V9M8,12H16V14H8V12M8,15H13V17H8V15Z" />
                                    </svg>
                                    <span>Chưa có ảnh</span>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            className="fixed top-4 left-4 p-2 rounded-full bg-8am-gray"
                            style={{
                                top: '45px',
                                zIndex: 1000,
                            }}
                            onClick={() => navigate(-1)}
                        >
                            <FaArrowLeft className="h-4 w-4 text-8am-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-1 bg-8am-white">
                        <div className="flex justify-between mt-2">
                            <div className="flex flex-col gap-1 mt-3">
                                <div className="text-8am-black text-2xl font-bold pl-4 pr-4">
                                    {grinder.product_name}
                                </div>

                                <div className="text-8am-middle-grey text-base pl-4 pr-4 font-semibold">
                                    {grinder.manufacture}
                                </div>
                            </div>

                            <div className='mr-4 mt-4 flex items-center gap-3'>
                                <div className="text-8am-middle-grey text-sm font-semibold whitespace-nowrap">
                                    Đã bán
                                    <span className="ml-1 text-8am-black font-bold">
                                        {(grinder as any).purchaseCount || 0}
                                    </span>
                                </div>

                                <button
                                    onClick={handleFavoriteClick}
                                    className={`
                                        relative rounded-full transition-all duration-300 ease-in-out transform hover:scale-110
                                        ${isFavorite
                                            ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-200'
                                            : 'bg-white border-2 border-gray-200 hover:border-red-300 shadow-md'
                                        } 
                                        p-1 backdrop-blur-sm hover:shadow-xl
                                    `}
                                >
                                    <div className={`transition-all duration-300 ${isFavorite ? 'animate-pulse' : ''}`}>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill={isFavorite ? "white" : "none"}
                                            className={`transition-colors duration-300 ${isFavorite ? 'text-white' : 'text-gray-400 hover:text-red-400'}`}
                                        >
                                            <path
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                            />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-4 ml-3 mr-3"
                            style={{
                                justifyContent: 'space-around',
                                alignItems: 'center',
                                width: '100%',
                                gap: 10,
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}
                        >
                            <div className="flex items-center justify-between"
                                style={{
                                    width: '45%',
                                }}
                            >
                                <img src={Laurels1} alt="Laurels1" className="w-10 h-10" />

                                <div className="text-8am-middle-grey text-center text-sm font-semibold">
                                    Chưa có đánh giá
                                </div>
                                <img src={Laurels2} alt="Laurels2" className="w-10 h-10" />
                            </div>

                            <div className="flex items-center justify-between"
                                style={{
                                    width: '35%',
                                }}
                            >
                                <div className="">
                                    {likesCount > 0 ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="text-8am-black text-base font-bold">
                                                {likesCount}
                                            </div>
                                            <div className="text-8am-middle-grey text-sm font-semibold">
                                                Yêu thích
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-8am-middle-grey text-sm font-bold">
                                            Chưa yêu thích
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 pl-4 pr-4 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="text-8am-black text-lg font-bold">
                                    Thông tin máy xay
                                </div>
                            </div>

                            <div style={{
                                fontSize: '14px',
                                color: '#8A8A8A',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 10,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                fontWeight: '500',
                                marginTop: 10,
                            }}>
                                {grinder.info}
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4 pt-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Khối lượng:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.weight} g
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Kích thước:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.size_diameter}mm × {grinder.size_height}mm
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Dung lượng pin:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.battery_capacity} mAh
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Dung tích tối đa:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.max_capacity} g
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Số cấp độ xay:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.grind_setting_count} cấp
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Đường kính lưỡi xay:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.burr_diameter} mm
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Thời gian sạc:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.charging_time} h
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Chất liệu:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.material}
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Màu sắc:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.color}
                            </div>
                        </div>

                        <div className="mb-6 ml-4 mr-4" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '10px solid #F5F5F5',
                            paddingBottom: 10,
                        }}>
                            <div className="text-8am-middle-grey text-sm font-medium">
                                Tính năng đặc biệt:
                            </div>

                            <div
                                className="text-8am-black font-medium"
                                style={{
                                    fontSize: '14px',
                                    width: '40%',
                                }}
                            >
                                {grinder.special_feature}
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="flex flex-col justify-between gap-2 pl-4 pr-4 pt-4"
                            style={{
                                borderBottom: '10px solid #F5F5F5',
                                paddingBottom: 20,
                            }}
                        >
                            <div className="flex justify-between gap-2">
                                <div className="text-8am-black text-lg font-bold mb-1">
                                    Giá máy xay:
                                </div>
                            </div>

                            <button
                                className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                            >
                                {isAddingToCart ? (
                                    <div className='flex items-center justify-center'>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    <div className='flex items-center justify-center gap-2'>
                                        <FaShoppingCart className="w-5 h-5" />
                                        {grinder.price.toLocaleString()} đ
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={handleFavoriteClick}
                                className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium bg-8am-light-grey-3`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill={isFavorite ? "currentColor" : "none"}
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                    />
                                </svg>
                                {isFavorite ? 'Yêu thích' : 'Yêu thích'}
                            </button>
                        </div>

                        {/* Reviews Section */}
                        <div className="mt-6 pl-4 pr-4"
                            style={{
                                borderBottom: '10px solid #F5F5F5',
                                paddingBottom: 10,
                            }}
                        >
                            <div className="flex justify-between items-center mb-4 mt-4">
                                <div className="text-8am-black text-lg font-bold">
                                    Cảm nhận từ khách hàng
                                </div>
                                <div className="text-8am-orange">
                                    <FaChevronRight />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <div className="flex space-x-4 pb-4" style={{ minWidth: 'min-content' }}>
                                    <div className="bg-8am-light-grey-3 p-4 rounded-lg" style={{ minWidth: '300px' }}>
                                        Chưa có đánh giá nào
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Products Section */}
                        <div className="mt-6 pl-4 pr-4 pb-10">
                            <div className="flex justify-between items-center mb-4 mt-4">
                                <div className="text-8am-black text-lg font-bold">
                                    Có thể bạn cũng thích
                                </div>
                            </div>

                            {relatedGrinders.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="text-gray-500">Đang tải sản phẩm liên quan...</div>
                                </div>
                            ) : (
                                <div className="flex overflow-x-auto gap-4 pb-2">
                                    {relatedGrinders.map((relatedGrinder) => (
                                        <div key={relatedGrinder.id}>
                                            <MachineCard
                                                machine={relatedGrinder}
                                                type="grinder"
                                                isShowLike={false}
                                                width={230}
                                                userInfo={userInfo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GrinderDetail;
