import { notification, Rate } from 'antd';
import { default as React, useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronRight, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import BottledDrinkCard from '../components/bottled-drink-card';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import ShareBottleModal from '../components/share-bottle-modal';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { cartService } from '../firebase/cartService';
import { favoriteService } from '../firebase/favoriteService';
import { flavorService } from '../firebase/flavorService';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import LikeIcon from "../public/images/like-icon.svg";
import ShareIcon from "../public/images/share-icon.svg";
import { authService } from '../services/authService';
import { BottledDrink } from '../types/bottledDrink';
import InfoBottleModal from '../components/info-bottle-modal';
import ReviewBottleModal from '../components/review-bottle-modal';
import { CartItem } from 'types/cart';

const DumpReview = [
    {
        id: '1',
        name: 'John Doe',
        rating: 4,
        review: 'This coffee is amazing!',
        date: '2021-01-01',
    },
    {
        id: '2',
        name: 'Jane Doe',
        rating: 4,
        review: 'This coffee is amazing!',
        date: '2021-01-01',
    },
    {
        id: '3',
        name: 'Mike Smith',
        rating: 5,
        review: 'Best coffee I\'ve ever had! The aroma is incredible.',
        date: '2021-02-15',
    },
    {
        id: '4',
        name: 'Sarah Wilson',
        rating: 4,
        review: 'Really smooth and balanced flavor profile.',
        date: '2021-03-22',
    },
    {
        id: '5',
        name: 'David Lee',
        rating: 4,
        review: 'Great coffee with nice chocolate notes.',
        date: '2021-04-10',
    },
    {
        id: '6',
        name: 'Emily Brown',
        rating: 5,
        review: 'Perfect morning coffee! Love the fruity undertones.',
        date: '2021-05-05',
    },
    {
        id: '7',
        name: 'James Wilson',
        rating: 4,
        review: 'Very good quality beans, makes excellent espresso.',
        date: '2021-06-18',
    },
    {
        id: '8',
        name: 'Lisa Chen',
        rating: 4,
        review: 'Rich and full-bodied. Will buy again!',
        date: '2021-07-23',
    },
    {
        id: '9',
        name: 'Robert Taylor',
        rating: 5,
        review: 'Outstanding coffee with great complexity.',
        date: '2021-08-30',
    },
    {
        id: '10',
        name: 'Maria Garcia',
        rating: 4,
        review: 'Delicious coffee with wonderful caramel notes.',
        date: '2021-09-15',
    },

]

const BottledDrinkDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [drink, setDrink] = useState<BottledDrink | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedVolume, setSelectedVolume] = useState<number>(0);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showInfoCafeModal, setShowInfoCafeModal] = useState(false);
    const [flavorImages, setFlavorImages] = useState<{ [key: string]: string }>({});
    const [lstDrink, setLstDrink] = useState<any[]>([]);
    const [showInfoBottleModal, setShowInfoBottleModal] = useState(false);
    const [reviewDrink, setReviewDrink] = useState<any>(null);
    useEffect(() => {
        if (id) {
            getCartItemCount();
            getLstDrink();
            getBottledDrinkById();
            checkFavoriteStatus();
            getLikesCount();

            setReviewDrink({
                lstReview: DumpReview,
                rating: DumpReview.reduce((acc, review) => acc + review.rating, 0) / DumpReview.length,
                totalReview: DumpReview.length,
            });
        }
    }, [id]);

    useEffect(() => {
        const loadFlavorImages = async () => {
            if (drink) {
                const images: { [key: string]: string } = {};
                for (const note of drink.flavorNotes) {
                    images[note] = await flavorService.getFlavorImageByName(note);
                }
                setFlavorImages(images);
            }
        };
        loadFlavorImages();
    }, [drink]);

    const getCartItemCount = async () => {
        const authenticatedUser = await authService.getAuthenticatedUser();
        if (authenticatedUser) {
            const count = await cartService.getCartItemCount(authenticatedUser.id);
            setCartItemCount(count);
        }
    };

    const getBottledDrinkById = async () => {
        if (id) {
            const drinkData = await bottledDrinkService.getBottledDrinkById(id);
            setDrink(drinkData);
            if (drinkData?.volumes?.length > 0) {
                setSelectedVolume(drinkData.volumes[0].volume);
            }
        }
    };

    const getLstDrink = async () => {
        const lstDrink = await bottledDrinkService.getAllBottledDrinks();
        setLstDrink(lstDrink);
    };

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

    const getLikesCount = async () => {
        if (id) {
            const count = await favoriteService.getCoffeeLikesCount(id);
            setLikesCount(count);
        }
    };

    const handleFavoriteClick = async () => {
        try {
            if (!await authService.isAuthenticated()) {
                await authService.authorizeLogin();
                return;
            }

            const authenticatedUser = await authService.getAuthenticatedUser();
            if (!authenticatedUser) return;

            const newFavoriteState = !isFavorite;
            setIsFavorite(newFavoriteState);

            if (id) {
                if (newFavoriteState) {
                    const result = await favoriteService.addFavorite(authenticatedUser.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể yêu thích nước uống',
                            duration: 2,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã yêu thích nước uống',
                        duration: 2,
                        placement: 'top'
                    });
                    await getLikesCount();
                } else {
                    const result = await favoriteService.removeFavorite(authenticatedUser.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể bỏ yêu thích nước uống',
                            duration: 2,
                            placement: 'top'
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã bỏ yêu thích nước uống',
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

    const getPriceByVolume = (volume: number) => {
        const priceInfo = drink?.volumes.find(v => v.volume === volume);
        return priceInfo?.price || 0;
    };

    const handleFlavorNoteClick = (note: string) => {
        navigate(`/flavor/${note}`);
    };

    const handleAddToCart = async () => {
        try {
            if (!await authService.isAuthenticated()) {
                await authService.authorizeLogin();
                return;
            }

            const authenticatedUser = await authService.getAuthenticatedUser();
            if (!authenticatedUser || !drink) return;

            const cartItem: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: authenticatedUser.id,
                drinkId: drink.id,
                quantity: 1,
                volume: selectedVolume,
                price: getPriceByVolume(selectedVolume),
                name: drink.name,
                imageUrl: drink.images[0],
                type: 'drink'
            };

            console.log('cartItem', cartItem);

            await cartService.addToCart(authenticatedUser.id, cartItem);
            notification.success({
                message: 'Đã thêm vào giỏ hàng',
                duration: 2,
                placement: 'top'
            });

            getCartItemCount();
        } catch (error) {
            console.error('Error adding to cart:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể thêm vào giỏ hàng',
                duration: 3,
                placement: 'top'
            });
        }
    };

    return (
        <>
            {
                drink && (
                    <div
                        style={{
                            marginBottom: 40,
                            marginTop: 100,
                        }}
                    >
                        {/* Header Image */}
                        <div className="relative w-full h-[300px] flex justify-center items-center mb-8">
                            <img
                                src={drink.images[0]}
                                alt={drink.name}
                                style={{
                                    width: '80%',
                                    height: '100%',
                                    borderRadius: 10,
                                }}
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
                                <div className="bg-8am-gray rounded-full p-2 relative"
                                    onClick={() => navigate('/cart')}
                                >
                                    <FaShoppingCart className="h-4 w-4 text-8am-white" />
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1 bg-8am-white">
                            <div className="flex justify-between mt-2">
                                <div className="flex flex-col gap-1 mt-3">
                                    <div className="text-8am-black text-2xl font-bold pl-4 pr-4">
                                        {drink.name}
                                    </div>

                                    <div className="text-8am-middle-grey text-base pl-4 pr-4 font-semibold">
                                        {drink.origin.join(', ')}
                                    </div>
                                </div>

                                <div className='mr-4 mt-4 '>
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="p-2 rounded-full bg-8am-light-grey-2 mr-2"
                                    >
                                        <img src={ShareIcon} alt="Share" className="w-5 h-5" />
                                    </button>

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
                                        width: '45%',
                                    }}
                                >
                                    <img src={Laurels1} alt="Laurels1" className="w-10 h-10" />

                                    <div className="flex flex-col items-center"
                                        style={{
                                            margin: 5,
                                        }}
                                        onClick={() => setShowReviewModal(true)}
                                    >
                                        <div className="text-8am-black text-sm font-bold">4.7</div>
                                        <div className="text-8am-middle-grey text-sm font-semibold">6 Đánh giá</div>
                                    </div>
                                    <img src={Laurels2} alt="Laurels2" className="w-10 h-10" />
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
                                                <div className="text-8am-black text-base font-bold">
                                                    {likesCount}
                                                </div>
                                                <div className="text-8am-middle-grey text-sm font-semibold">
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

                            <div className="mb-6 pl-4 pr-4 pt-2" onClick={() => setShowInfoBottleModal(true)}>
                                <div className="flex items-center justify-between">
                                    <div className="text-8am-black text-lg font-bold ">
                                        Thông tin đồ uống
                                    </div>

                                    <div className="text-8am-orange">
                                        <FaChevronRight />
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
                                    {drink.description}
                                </div>
                            </div>

                            {/* <div className="pl-3 pr-3 pt-2">
                            <div className="text-8am-black text-lg font-bold mb-1 ">
                                Thông tin sơ chế
                            </div>
                        </div> */}


                            <div className="mt-6 pl-4 pr-4"
                                style={{
                                    borderBottom: '10px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}
                            >
                                {
                                    drink.flavorNotes.length > 0 ? (
                                        <div className="flex overflow-x-auto gap-2 pb-2 w-full">
                                            {
                                                drink.flavorNotes.map((note: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="bg-8am-light-grey-3 rounded-lg p-2 pr-7 cursor-pointer hover:bg-8am-light-grey-2 flex items-center gap-2"
                                                        style={{
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        onClick={() => handleFlavorNoteClick(note)}
                                                    >
                                                        {
                                                            flavorImages && flavorImages[note] ? (
                                                                <img src={flavorImages[note]} alt={note} className="w-5 h-5" />
                                                            ) : (
                                                                <div className='w-5 h-5'></div>
                                                            )
                                                        }
                                                        <div className="text-8am-black text-base font-medium "
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            {note}
                                                        </div>
                                                    </div>
                                                )
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <div className="flex overflow-x-auto gap-2 pb-2 w-full">
                                            <CoffeeSkeleton
                                                height={30}
                                            />
                                        </div>
                                    )
                                }

                            </div>


                            {/* Price Section */}
                            <div className="flex flex-col justify-between gap-2 pl-4 pr-4 pt-4"
                                style={{
                                    borderBottom: '10px solid #F5F5F5',
                                    paddingBottom: 20,
                                }}
                            >

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
                                            value={selectedVolume}
                                            onChange={(e) => setSelectedVolume(Number(e.target.value))}
                                        >
                                            {drink.volumes.map(wp => (
                                                <option key={wp.volume} value={wp.volume}>
                                                    {wp.volume}ml
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>


                                {/* Bean Type Options */}
                                {drink.volumes.length > 0 && (
                                    <div className={`w-full flex items-center gap-4 ${selectedVolume ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200`}>
                                        {/* <input
                                            type="radio"
                                            name="coffeeType"
                                            className="w-5 h-5 accent-orange-500"
                                            onChange={() => setSelectedVolume(selectedVolume)}
                                        /> */}
                                        <div className="flex justify-between items-center flex-1">
                                            <span className="text-gray-900 font-semibold">Đồ uống</span>
                                            <div className="flex items-center gap-2">

                                                <span className="text-gray-900 font-medium">
                                                    {Math.round(getPriceByVolume(selectedVolume)).toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                <button
                                    className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-semibold"
                                    onClick={handleAddToCart}
                                >
                                    Thêm vào giỏ hàng
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

                            <div className="mt-6 pl-4 pr-4"
                                style={{
                                    borderBottom: '10px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}
                                onClick={() => setShowReviewModal(true)}
                            >
                                <div className="flex justify-between items-center mb-4 mt-4">
                                    <div className="text-8am-black text-lg font-bold">
                                        Cảm nhận từ hội viên
                                    </div>
                                    <div className="text-8am-orange">
                                        <FaChevronRight />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <div className="flex space-x-4 pb-4" style={{ minWidth: 'min-content' }}>
                                        {
                                            DumpReview.map((review) => (
                                                <div className="bg-8am-light-grey-3 p-4 rounded-lg flex flex-col gap-2" style={{ minWidth: '300px' }}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-8am-black font-medium">{review.name}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-1">
                                                            <Rate
                                                                disabled
                                                                value={review.rating}
                                                                className="text-8am-black text-sm"
                                                            />
                                                        </div>
                                                        <div className="text-gray-500 text-sm">{review.date}</div>
                                                    </div>
                                                    <div className="text-8am-gray font-medium">
                                                        {review.review}
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Brewing Methods */}
                            <div className="mt-6 pl-4 pr-4 pb-10"
                            >
                                <div className="flex justify-between items-center mb-4 mt-4">
                                    <div className="text-8am-black text-lg font-bold">
                                        Có thể bạn cũng thích
                                    </div>
                                </div>

                                {lstDrink.length === 0 ? (
                                    <div className="flex overflow-x-auto gap-4 pb-2">
                                        <CoffeeSkeleton />
                                        <CoffeeSkeleton />
                                        <CoffeeSkeleton />
                                    </div>
                                ) : (
                                    <div className="flex overflow-x-auto gap-4 pb-2">
                                        {
                                            lstDrink.map((drinkItem: any, index) => (
                                                <div key={drinkItem.id || index}>
                                                    <BottledDrinkCard
                                                        isShowLike={false}
                                                        width={230}
                                                        {...drinkItem}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >
                )}
            {drink && (
                <ShareBottleModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    item={drink}
                />
            )}

            {drink && (
                <InfoBottleModal
                    isOpen={showInfoBottleModal}
                    onClose={() => setShowInfoBottleModal(!showInfoBottleModal)}
                    item={drink}
                />
            )}

            {
                reviewDrink && (
                    <ReviewBottleModal
                        isOpen={showReviewModal}
                        onClose={() => setShowReviewModal(!showReviewModal)}
                        review={reviewDrink}
                        drink={drink}
                    />
                )
            }
        </>
    );
};

export default BottledDrinkDetail;