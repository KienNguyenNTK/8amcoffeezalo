import { notification, Rate } from 'antd';
import { default as React, useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronRight, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import BottledDrinkCard from '../components/bottled-drink-card';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import ShareBottleModal from '../components/share-bottle-modal';
import { useCartCount } from '../hooks/useCartCount';
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
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './custom-swiper.css'; // Add this line to import custom styles

// Import required modules
import { Pagination, Autoplay } from 'swiper';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { Review } from '../types/review';
import { reviewService } from '../firebase/reviewService';
import dayjs from 'dayjs';
import { userService } from '../firebase/userService';
import { getUserID } from 'zmp-sdk/apis';
import Logo from '../public/images/logo.png';
import { notificationService } from '../firebase/notificationService';

const BottledDrinkDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [drink, setDrink] = useState<BottledDrink | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedVolume, setSelectedVolume] = useState<number>(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showInfoCafeModal, setShowInfoCafeModal] = useState(false);
    const [flavorImages, setFlavorImages] = useState<{ [key: string]: string }>({});
    const [lstDrink, setLstDrink] = useState<any[]>([]);
    const [showInfoBottleModal, setShowInfoBottleModal] = useState(false);
    const [reviewDrink, setReviewDrink] = useState<any>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [userInfo, setUserInfo] = useState<any>();
    const cartItemCount = useCartCount(userInfo?.id);
    useEffect(() => {
        const checkLocal = async () => {
            // const idUser = localStorage.getItem('idUser');
            const userId = await getUserID();

            const user = await userService.getUserByLocalId(userId);

            console.log('user bottle detail: ', user);

            if (user) {
                setUserInfo(user);
            }
        };

        checkLocal();
    }, []);

    useEffect(() => {
        if (id) {
            getLstDrink();
            getBottledDrinkById();
            checkFavoriteStatus();
            getLikesCount();
        }
    }, [id, userInfo]);

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

    useEffect(() => {
        if (drink && userInfo?.id) {
            let imageUrl = ''
            if (drink.images) {
                imageUrl = drink.images[0]
            }
            else if (drink.driveImages) {
                imageUrl = `https://lh3.googleusercontent.com/d/${drink.driveImages[0].fileId}?authuser=server`
            }

            // Ghi lịch sử xem với Firebase
            recentlyViewedService.addToRecentlyViewed(
                {
                    ...drink,
                    id: drink.id,
                    name: drink.name,
                    imageUrl: imageUrl,
                    region: drink.origin,
                    type: 'drink',
                },
                'drink',
                userInfo.id
            );
        }
    }, [drink, userInfo]);

    useEffect(() => {
        if (drink && drink.id) {
            fetchReviews();
        }
    }, [drink, showReviewModal]);

    const fetchReviews = async () => {
        try {
            setIsLoadingReviews(true);
            if (!drink || !drink.id) return;
            const fetchedReviews = await reviewService.getReviewsByDrinkId(drink.id);
            setReviews(fetchedReviews);

            // Calculate average rating
            if (fetchedReviews.length > 0) {
                const avgRating = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0) / fetchedReviews.length;
                setAverageRating(avgRating);
            }

            setReviewDrink({
                lstReview: fetchedReviews,
                rating: averageRating,
                totalReview: fetchedReviews.length,
            });

        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setIsLoadingReviews(false);
        }
    };



    const getBottledDrinkById = async () => {
        if (id) {
            const drinkData = await bottledDrinkService.getBottledDrinkById(id);
            setDrink(drinkData);
            if (drinkData && drinkData?.volumes?.length > 0) {
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
            // const authenticatedUser = await authService.getAuthenticatedUser();
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

        // if (!await authService.isAuthenticated()) {
        //     notification.warning({
        //         message: 'Yêu cầu thông tin',
        //         description: 'Chúng tôi cần thông tin của bạn để có thể giúp bạn yêu thích đồ uống',
        //         duration: 1.5,
        //         placement: 'top'
        //     });
        // }

        // setTimeout(async () => {
        try {
            // if (!await authService.isAuthenticated()) {
            //     await authService.authorizeLogin();

            //     notification.success({
            //         message: 'Lấy thông tin thành công',
            //         description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
            //         duration: 1.5,
            //         placement: 'top'
            //     });

            //     handleFavoriteClick();

            //     return;
            // }

            // const authenticatedUser = await authService.getAuthenticatedUser();
            // if (!authenticatedUser) return;

            const newFavoriteState = !isFavorite;
            setIsFavorite(newFavoriteState);

            if (!userInfo) {
                notification.warning({
                    message: 'Yêu cầu thông tin',
                    description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để yêu thích đồ uống',
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
                            message: 'Không thể yêu thích nước uống',
                            duration: 1.5,
                            placement: 'top',
                            closable: false
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã yêu thích nước uống',
                        duration: 1.5,
                        placement: 'top',
                        closable: false
                    });
                    await getLikesCount();

                    notificationService.addNotification({
                        userId: userInfo.id,
                        title: 'Yêu thích nước uống',
                        content: `${drink?.name} đã được yêu thích`,
                        type: 'favorite',
                    });
                } else {
                    const result = await favoriteService.removeFavorite(userInfo.id, id);
                    if (!result) {
                        setIsFavorite(!newFavoriteState);
                        notification.error({
                            message: 'Không thể bỏ yêu thích nước uống',
                            duration: 1.5,
                            placement: 'top',
                            closable: false
                        });
                        return;
                    }
                    notification.success({
                        message: 'Đã bỏ yêu thích nước uống',
                        duration: 1.5,
                        placement: 'top',
                        closable: false
                    });
                    await getLikesCount();

                    notificationService.addNotification({
                        userId: userInfo.id,
                        title: 'Bỏ yêu thích nước uống',
                        content: `${drink?.name} đã được bỏ yêu thích`,
                        type: 'favorite',
                    });
                }
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            notification.error({
                message: 'Không thể cập nhật trạng thái yêu thích do không có thông tin người dùng',
                duration: 3,
                placement: 'top',
                closable: false
            });
            await checkFavoriteStatus();
        }
        // }, 1000);


    };

    const getPriceByVolume = (volume: number) => {
        const priceInfo = drink?.volumes.find(v => v.volume === volume);
        return priceInfo?.price || 0;
    };

    const handleFlavorNoteClick = (note: string) => {
        navigate(`/flavor/${note}`);
    };

    const handleAddToCart = async () => {

        // if (!await authService.isAuthenticated()) {
        //     notification.warning({
        //         message: 'Yêu cầu thông tin',
        //         description: 'Chúng tôi cần thông tin của bạn để có thể giúp bạn thêm vào giỏ hàng',
        //         duration: 1.5,
        //         placement: 'top'
        //     });
        // }

        // setTimeout(async () => {
        try {
            // if (!await authService.isAuthenticated()) {
            //     await authService.authorizeLogin();

            //     notification.success({
            //         message: 'Lấy thông tin thành công',
            //         description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
            //         duration: 1.5,
            //         placement: 'top'
            //     });

            //     handleAddToCart();

            //     return;
            // }

            setIsAddingToCart(true);
            // const authenticatedUser = await authService.getAuthenticatedUser();
            // if (!authenticatedUser && drink) {
            //     const cartItem: any = {
            //         id: Math.random().toString(36).substr(2, 9),
            //         userId: '',
            //         drinkId: drink.id,
            //         quantity: 1,
            //         volume: selectedVolume,
            //         price: getPriceByVolume(selectedVolume),
            //         name: drink.name,
            //         imageUrl: drink.images[0],
            //         type: 'drink'
            //     };
            //     const cartItemLocal = localStorage.getItem('cartItems');

            //     if (cartItemLocal) {
            //         const cartItems = JSON.parse(cartItemLocal);
            //         const existingItemIndex = cartItems.findIndex((item: any) =>
            //             item.drinkId === cartItem.drinkId &&
            //             item.volume === cartItem.volume
            //         );

            //         if (existingItemIndex !== -1) {
            //             cartItems[existingItemIndex].quantity += 1;
            //         } else {
            //             cartItems.push(cartItem);
            //         }

            //         localStorage.setItem('cartItems', JSON.stringify(cartItems));
            //     } else {
            //         localStorage.setItem('cartItems', JSON.stringify([cartItem]));
            //     }

            //     notification.success({
            //         message: 'Đã thêm vào giỏ hàng',
            //         duration: 1.5,
            //         placement: 'top'
            //     });

            //     getCartItemCount();
            // }
            // else 

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

            if (userInfo && drink) {
                let imageUrl = ''
                if (drink.images) {
                    imageUrl = drink.images[0]
                }
                else if (drink.driveImages) {
                    imageUrl = `https://lh3.googleusercontent.com/d/${drink.driveImages[0].fileId}?authuser=server`
                }

                const cartItem: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'> = {
                    userId: userInfo.id,
                    drinkId: drink.id,
                    quantity: 1,
                    volume: selectedVolume,
                    price: getPriceByVolume(selectedVolume),
                    name: drink.name,
                    imageUrl: imageUrl,
                    type: 'drink'
                };

                console.log('cartItem', cartItem);

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
        // }, 1000);
    };

    const formatDate = (date: any) => {
        if (date) {
            // Kiểm tra nếu là Timestamp từ Firebase
            if (date.seconds) {
                return (dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY'));
            }
            // Kiểm tra nếu là Date object
            else if (date instanceof Date) {
                return (dayjs(date).format('DD/MM/YYYY'));
            }
            // Kiểm tra nếu là string
            else if (typeof date === 'string') {
                return (dayjs(date, 'DD/MM/YYYY').format('DD/MM/YYYY'));
            }
        }
    }


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

                            <Swiper
                                modules={[Autoplay, Pagination]}
                                spaceBetween={0}
                                slidesPerView={1}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                pagination={{ clickable: true, bulletClass: 'swiper-pagination-bullet', bulletActiveClass: 'swiper-pagination-bullet-active' }}
                                loop={true}
                                style={{
                                    width: '80%',
                                    height: '100%',
                                    borderRadius: 10,
                                }}
                            >
                                {drink.images.map((image: any, index: any) => (
                                    <SwiperSlide key={index}>
                                        <img src={image} alt=""
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}

                                {drink.driveImages.map((image: any, index: any) => (
                                    <SwiperSlide key={index}>
                                        <img
                                            src={`https://lh3.googleusercontent.com/d/${image.fileId}?authuser=server`}
                                            alt=""
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            {/* <img
                                src={drink.images[0]}
                                alt={drink.name}
                                style={{
                                    width: '80%',
                                    height: '100%',
                                    borderRadius: 10,
                                }}
                            /> */}
                            <button className="fixed top-4 left-4 p-2 rounded-full bg-8am-gray"
                                style={{
                                    top: '45px',
                                    zIndex: 1000,
                                }}
                                onClick={() => navigate(-1)}
                            >
                                <FaArrowLeft className="h-4 w-4 text-8am-white" />
                            </button>
                            {/* Giỏ hàng đã chuyển xuống bottom navigation */}
                            {/* <div className="fixed top-4 right-4 flex space-x-2"
                                style={{
                                    top: '45px',
                                    right: '105px',
                                    zIndex: 1000,
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
                            </div> */}
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

                                <div className='mr-4 mt-4 flex items-center gap-3'>
                                    <div className="text-8am-middle-grey text-sm font-semibold whitespace-nowrap">
                                        Đã bán
                                        <span className="ml-1 text-8am-black font-bold">
                                            {drink.purchaseCount || 0}
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

                                    {
                                        reviews.length === 0 ? (
                                            <div className="text-8am-middle-grey text-center text-sm font-semibold"
                                                onClick={() => setShowReviewModal(true)}
                                            >
                                                Chưa có đánh giá
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center"
                                                style={{
                                                    margin: 5,
                                                }}
                                                onClick={() => setShowReviewModal(true)}
                                            >
                                                <div className="text-8am-black text-sm font-bold">
                                                    {averageRating.toFixed(1)}
                                                </div>
                                                <div className="text-8am-middle-grey text-sm font-semibold">{
                                                    reviews.length
                                                } Đánh giá</div>
                                            </div>
                                        )
                                    }
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
                                                Chưa yêu thích
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

                            <div className="mb-6 ml-4 mr-4 pt-4" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F5F5F5',
                                paddingBottom: 10,
                            }}>
                                <div className="text-8am-middle-grey text-sm font-medium">
                                    Loại cà phê:
                                </div>

                                <div
                                    className="text-8am-black font-medium"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {drink.coffeeOriginText}
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
                                    Thành phần:
                                </div>

                                <div
                                    className="text-8am-black font-medium"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {drink.ingredients.join(', ')}
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
                                    Dung tích:
                                </div>

                                <div
                                    className="text-8am-black font-medium"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {
                                        drink.volumes.map((wp) => (
                                            <div key={wp.volume}>
                                                {wp.volume}ml
                                            </div>
                                        ))
                                    }
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
                                    Thời gian hết hạn:
                                </div>

                                <div
                                    className="text-8am-black font-medium"
                                    style={{
                                        fontSize: '14px',
                                        width: '40%',
                                    }}
                                >
                                    {
                                        drink.expirationDays ? drink.expirationDays + ' ngày' : 'Không xác định'
                                    }
                                </div>
                            </div>


                            {/* <div className="pl-3 pr-3 pt-2">
                            <div className="text-8am-black text-lg font-bold mb-1 ">
                                Thông tin sơ chế
                            </div>
                        </div> */}


                            <div className="mt-6 pl-4 pr-4 pt-4"
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
                                                            width: 'fit-content',
                                                            whiteSpace: 'nowrap',
                                                            padding: '8px 12px',
                                                            paddingRight: '32px',
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
                                        Giá đồ uống đóng chai:
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="text-8am-black  font-bold mb-1 ">
                                            {/* Khối lượng: */}
                                        </div>

                                        {
                                            drink.volumes.length > 1 && (
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
                                            )
                                        }

                                    </div>
                                </div>

                                {/* Bean Type Options */}
                                {/* {drink.volumes.length > 0 && (
                                    <div className={`w-full flex items-center gap-4 ${selectedVolume ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200`}>
                                        <div className="flex justify-between items-center flex-1">
                                            <span className="text-gray-900 font-semibold">Đồ uống</span>
                                            <div className="flex items-center gap-2">

                                                <span className="text-gray-900 font-medium">
                                                    {Math.round(getPriceByVolume(selectedVolume)).toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )} */}


                                <button
                                    className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                >
                                    {
                                        isAddingToCart ?
                                            <div className='flex items-center justify-center'>
                                                Đang xử lý...
                                            </div>
                                            :
                                            <div className='flex items-center justify-center gap-2'>
                                                <FaShoppingCart className="w-5 h-5" />
                                                {drink.volumes.length > 0 ? (
                                                    <>
                                                        {Math.round(getPriceByVolume(selectedVolume)).toLocaleString()} đ
                                                    </>
                                                ) : (
                                                    'Không có giá'
                                                )}
                                            </div>
                                    }

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
                                        Cảm nhận từ khách hàng
                                    </div>
                                    <div className="text-8am-orange">
                                        <FaChevronRight />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <div className="flex space-x-4 pb-4" style={{ minWidth: 'min-content' }}>
                                        {isLoadingReviews ? (
                                            <div className="bg-8am-light-grey-3 p-4 rounded-lg" style={{ minWidth: '300px' }}>
                                                Loading reviews...
                                            </div>
                                        ) : reviews.length > 0 ? (
                                            reviews.slice(0, 5).map((rev) => (
                                                <div key={rev.id} className="bg-8am-light-grey-3 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <img
                                                            src={rev.user.avatar || Logo}
                                                            alt={rev.user.name}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                        <div>
                                                            <div className="font-bold">{rev.user.name || 'Người dùng'}</div>
                                                            <div className="flex gap-1">
                                                                <Rate value={rev.rating} allowHalf style={{ color: 'black', fontSize: '12px' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {rev.comment}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-2">
                                                        {formatDate(rev.createdAt)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-8am-light-grey-3 p-4 rounded-lg" style={{ minWidth: '300px' }}>
                                                Chưa có đánh giá nào
                                            </div>
                                        )}
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
                                                        userInfo={userInfo}
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
            {/* {drink && (
                <ShareBottleModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    item={drink}
                />
            )} */}

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