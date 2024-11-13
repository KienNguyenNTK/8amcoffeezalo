import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button } from 'zmp-ui';
import { CoffeeBean } from '../types/coffee';
import { FaArrowLeft, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { coffeeService } from 'firebase/coffeeService';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import ShareIcon from "../public/images/share-icon.svg";
import LikeIcon from "../public/images/like-icon.svg";
import CuppingScoreChart from '../components/CuppingScoreChart';
import FlavorScoreChart from '../components/FlavorScoreChart';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { favoriteService } from '../firebase/favoriteService';
import { authService } from '../services/authService';
import { notification } from 'antd';

const CoffeeDetail: React.FC = () => {

    const { id } = useParams();
    const [coffee, setCoffee] = useState<CoffeeBean | null>(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (id) {
            getCoffeeById(id);
        }
    }, [id]);

    useEffect(() => {
        if (coffee) {
            setSelectedWeight(coffee.weightAndPrice[0]?.weight || 0);
            // setSelectedOptions({
            //     whole: coffee.beanType.wholeBean,
            //     ground: coffee.beanType.grind,
            // });

        }
    }, [coffee]);

    useEffect(() => {
        if (coffee) {
            recentlyViewedService.addToRecentlyViewed({
                id: coffee.id,
                name: coffee.name,
                imageUrl: coffee.imageUrl,
                region: coffee.region
            });
        }
    }, [coffee]);

    const getCoffeeById = async (id: string) => {
        const coffee = await coffeeService.getCoffeeById(id);
        setCoffee(coffee);
    }

    // Sửa lại state
    const [selectedOptions, setSelectedOptions] = useState({
        whole: true,     // Nguyên hạt
        ground: false,   // Xay
    });

    // Sửa lại kiểu của hàm xử lý
    const handleOptionChange = (option: 'whole' | 'ground') => {
        setSelectedOptions(prev => ({
            whole: option === 'whole',    // Chỉ cho phép chọn 1 option
            ground: option === 'ground'
        }));
    };

    // Thêm state cho khối lượng đã chọn
    const [selectedWeight, setSelectedWeight] = useState<number>(
        coffee?.weightAndPrice[0]?.weight || 0
    );

    // Hàm lấy giá theo khối lượng từ coffee bean
    const getPriceByWeight = (weight: number) => {
        const priceInfo = coffee?.weightAndPrice.find(wp => wp.weight === weight);
        if (!priceInfo) return { original: 0, discounted: 0 };

        return {
            original: priceInfo.price,
            discounted: priceInfo.price * 0.84 // Giả sử giảm giá 16%
        };
    };

    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        checkFavoriteStatus();
    }, []);

    const checkFavoriteStatus = async () => {
        try {
            const authenticatedUser = await authService.getAuthenticatedUser();
            if (authenticatedUser && id) {
                const favorite = await favoriteService.getFavorite(authenticatedUser.id, id);
                setIsFavorite(!!favorite);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const handleFavoriteClick = async () => {
        try {
            if (!await authService.isAuthenticated()) {
                notification.warning({
                    message: 'Chấp nhận quyền truy cập',
                    description: 'Bạn cần chấp nhận quyền truy cập để yêu thích cà phê',
                    duration: 3,
                    placement: 'top'
                });

                await authService.authorizeLogin();
                return;
            }

            const authenticatedUser = await authService.getAuthenticatedUser();
            if (!authenticatedUser) {
                return;
            }

            const newFavoriteState = !isFavorite;
            setIsFavorite(newFavoriteState);

            if (id) {
                if (newFavoriteState) {
                    const result = await favoriteService.addFavorite(authenticatedUser.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể yêu thích cà phê',
                            duration: 2,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã yêu thích cà phê',
                        duration: 2,
                        placement: 'top'
                    });
                    await getLikesCount();
                } else {
                    const result = await favoriteService.removeFavorite(authenticatedUser.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể bỏ yêu thích cà phê',
                            duration: 2,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã bỏ yêu thích cà phê',
                        duration: 2,
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

    const [likesCount, setLikesCount] = useState(0);

    const getLikesCount = async () => {
        if (id) {
            const count = await favoriteService.getCoffeeLikesCount(id);
            setLikesCount(count);
        }
    };

    useEffect(() => {
        getLikesCount();
    }, [id]);

    return (
        <>
            {
                coffee && (
                    <div className="bg-white"
                        style={{
                            paddingBottom: 70,
                        }}
                    >
                        {/* Header Image */}
                        <div className="relative w-full h-[300px]">
                            <img
                                src={coffee.imageUrl}
                                alt={coffee.name}
                                className="w-full h-full object-cover"
                            />
                            <button className="fixed top-4 left-4 p-2 rounded-full bg-8am-gray"
                                style={{
                                    top: '45px',
                                }}
                                onClick={() => navigate(-1)}
                            >
                                <FaArrowLeft className="h-4 w-4 text-8am-white" />
                            </button>
                            <div className="fixed top-4 right-4 flex space-x-2"
                                style={{
                                    top: '45px',
                                    right: '105px',
                                }}
                            >
                                <div className="bg-8am-gray rounded-full p-2 relative">
                                    <FaShoppingCart className="h-4 w-4 text-8am-white" />
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        1
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <div className="flex justify-between mt-2">
                                <div className="flex flex-col gap-1">
                                    <div className="text-8am-black text-2xl font-bold pl-3 pr-3">
                                        {coffee.name}
                                    </div>

                                    <div className="text-8am-middle-grey text-lg pl-3 pr-3">
                                        {coffee.region.join(', ')}
                                    </div>
                                </div>

                                <div className='mr-3'>
                                    <button
                                        onClick={handleFavoriteClick}
                                        className={`p-2 rounded-full ${isFavorite
                                                ? 'bg-red-500'
                                                : 'bg-8am-light-grey-2'
                                            } backdrop-blur-sm hover:bg-white/30`}
                                    >
                                        <img
                                            src={LikeIcon}
                                            alt="Like"
                                            className={`w-5 h-5 ${isFavorite ? 'brightness-0 invert' : ''
                                                }`}
                                        />
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
                                        width: '35%',
                                    }}
                                >
                                    <img src={Laurels1} alt="Laurels1" className="w-4 h-4" />

                                    <div className="flex flex-col items-center"
                                        style={{
                                            margin: 5,
                                        }}
                                    >
                                        <div className="text-8am-middle-grey text-sm font-bold">No review </div>
                                    </div>
                                    <img src={Laurels2} alt="Laurels2" className="w-4 h-4" />
                                </div>

                                <div className="flex items-center justify-between"
                                    style={{
                                        width: '35%',
                                    }}
                                >

                                    <div className=""
                                    >
                                        {likesCount > 0 ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="text-8am-middle-grey text-sm font-bold">
                                                    {likesCount}
                                                </div>
                                                <div className="text-8am-middle-grey text-sm font-bold">
                                                    Yêu thích
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-8am-middle-grey text-sm font-bold">
                                                No favorite
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* <div className="flex items-center space-x-2 mb-4">
                                <div className="flex items-center">
                                    <span className="text-orange-500 font-bold">{coffee.cuppingScore.total}</span>
                                    <span className="text-gray-500 ml-1">/ 100</span>
                                </div>
                                <div className="text-gray-400">|</div>
                                <div className="text-gray-500">{coffee.flavorNotes.length} flavor notes</div>
                            </div> */}

                            <div className="mb-6 pl-3 pr-3 pt-2">
                                <div className="text-8am-black text-lg font-bold mb-1 ">
                                    Thông tin cà phê
                                </div>

                                <div style={{
                                    fontSize: '14px',
                                    color: '#8A8A8A',
                                }}>
                                    {coffee.beanInfo}
                                </div>
                            </div>

                            <div className="pl-3 pr-3 pt-2">
                                <div className="text-8am-black text-lg font-bold mb-1 ">
                                    Thông tin sơ chế
                                </div>
                            </div>

                            <div className="mb-6 ml-2 mr-2 pt-4" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}>
                                <div className="text-8am-middle-grey text-sm font-bold">
                                    Mức rang
                                </div>

                                <div
                                    className="text-8am-black"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {coffee.roastLevel.join(', ')}
                                </div>
                            </div>

                            <div className="mb-6  ml-2 mr-2" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}>
                                <div className="text-8am-middle-grey text-sm font-bold">
                                    Ngày rang
                                </div>

                                <div
                                    className="text-8am-black"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {coffee.daysFromRoast} ngày
                                </div>
                            </div>

                            <div className="mb-6  ml-2 mr-2" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}>
                                <div className="text-8am-middle-grey text-sm font-bold">
                                    Phương pháp sơ chế
                                </div>

                                <div
                                    className="text-8am-black"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {coffee.processingMethod === 'natural' && 'Tự nhiên'}
                                    {coffee.processingMethod === 'washed' && 'Ướt'}
                                    {coffee.processingMethod === 'honey' && 'Mật ong'}
                                </div>
                            </div>

                            <div className="mb-6  ml-2 mr-2" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}>
                                <div className="text-8am-middle-grey text-sm font-bold">
                                    Phương pháp pha chế
                                </div>

                                <div
                                    className="text-8am-black"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {coffee.brewingMethods.espresso ? 'Espresso' : ''}
                                    {coffee.brewingMethods.pourOver ? 'Pour Over' : ''}
                                    {coffee.brewingMethods.phin ? 'Phin' : ''}
                                    {!coffee.brewingMethods.espresso && !coffee.brewingMethods.pourOver && !coffee.brewingMethods.phin && 'Chưa có đề xuất'}
                                </div>
                            </div>

                            <div className="mt-6 pl-3 pr-3"
                                style={{
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}
                            >
                                <div className="text-8am-black text-lg font-bold mb-3">Hương vị cà phê</div>
                                <div className="flex flex-wrap gap-2">
                                    {coffee.flavorNotes.map((note, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm"
                                        >
                                            {note}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pl-3 pr-3"
                                style={{
                                    borderBottom: '10px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}
                            >
                                <div className="text-8am-black text-lg font-bold mb-3">Loại cà phê</div>
                                <div className="flex flex-wrap gap-2">
                                    {coffee.isSingleOrigin &&
                                        <span
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mr-2"
                                        >
                                            Single origin
                                        </span>
                                    }
                                    {
                                        coffee.blend && coffee.blend.components.map((component, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mr-2"
                                            >
                                                {component.origin} ({component.percentage}%)
                                            </span>
                                        ))
                                    }
                                    {/* {coffee.isBlended && 'Hỗn hợp'} */}
                                </div>
                            </div>
                            {
                                coffee.cuppingScore.total > 0 && (
                                    <div className="mt-6 pl-3 pr-3">
                                        <div className="text-8am-black text-lg font-bold mb-3">
                                            Điểm đánh giá Cupper's
                                        </div>
                                        <CuppingScoreChart cuppingScore={coffee.cuppingScore} />
                                    </div>
                                )
                            }

                            {
                                coffee.flavorScore.total > 0 && (
                                    <div className="mt-6 pl-3 pr-3"
                                        style={{
                                            borderBottom: '10px solid #F5F5F5',
                                            paddingBottom: 10,
                                        }}
                                    >
                                        <div className="text-8am-black text-lg font-bold mb-3">
                                            Điểm đánh giá hương vị
                                        </div>
                                        <FlavorScoreChart flavorScore={coffee.flavorScore} />
                                    </div>
                                )
                            }

                            {/* Details */}
                            {/* <div className="space-y-4 mb-6">
                                <div>
                                    <Text size="small" className="text-gray-500 mb-1">Processing Method</Text>
                                    <Text bold>{coffee.processingMethod}</Text>
                                </div>

                                <div>
                                    <Text size="small" className="text-gray-500 mb-1">Region</Text>
                                    <Text bold>{coffee.region.join(', ')}</Text>
                                </div>

                                <div>
                                    <Text size="small" className="text-gray-500 mb-1">Roast Level</Text>
                                    <Text bold>{coffee.roastLevel}</Text>
                                </div>
                            </div> */}

                            {/* Price Section */}
                            <div className="flex flex-col justify-between gap-2 pl-3 pr-3 pt-4">
                                {/* Select Weight Section */}

                                <div className="flex justify-between gap-2">
                                    <div className="text-8am-black text-lg font-bold mb-1 ">
                                        Giá hạt cà phê:
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="text-8am-black  font-bold mb-1 ">
                                            {/* Khối lượng: */}
                                        </div>

                                        <select
                                            className="w-50 p-3 border rounded-lg bg-white"
                                            value={selectedWeight}
                                            onChange={(e) => setSelectedWeight(Number(e.target.value))}
                                        >
                                            {coffee.weightAndPrice.map(wp => (
                                                <option key={wp.weight} value={wp.weight}>
                                                    {wp.weight}g
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>


                                {/* Bean Type Options */}
                                {coffee.beanType.wholeBean && (
                                    <div className={`w-full flex items-center gap-4 ${selectedOptions.whole ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200`}>
                                        <input
                                            type="radio"
                                            name="coffeeType"
                                            className="w-5 h-5 accent-orange-500"
                                            checked={selectedOptions.whole}
                                            onChange={() => handleOptionChange('whole')}
                                        />
                                        <div className="flex justify-between items-center flex-1">
                                            <span className="text-gray-900">Nguyên hạt</span>
                                            <div className="flex items-center gap-2">

                                                <span className="text-gray-900 font-medium">
                                                    {Math.round(getPriceByWeight(selectedWeight).original).toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {coffee.beanType.grind && (
                                    <div className={`w-full flex items-center gap-4 ${selectedOptions.ground ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200`}>
                                        <input
                                            type="radio"
                                            name="coffeeType"
                                            className="w-5 h-5 accent-orange-500"
                                            checked={selectedOptions.ground}
                                            onChange={() => handleOptionChange('ground')}
                                        />
                                        <div className="flex justify-between items-center flex-1">
                                            <span className="text-gray-900">Xay sẵn</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 font-medium">
                                                    {Math.round(getPriceByWeight(selectedWeight).original).toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-medium">
                                    Thêm vào giỏ hng
                                </button>

                                <button
                                    onClick={handleFavoriteClick}
                                    className={`w-full border py-4 rounded-lg flex items-center justify-center gap-2 font-medium ${isFavorite
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'border-gray-200 text-gray-900'
                                        }`}
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
                                    {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                                </button>
                            </div>

                            {/* Flavor Notes */}


                            {/* Brewing Methods */}

                        </div>
                    </div >
                )}
        </>
    );
};

export default CoffeeDetail; 