import { notification, Select, Slider, Modal } from 'antd';
import { coffeeService } from '../firebase/coffeeService';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronRight, FaRuler, FaShapes, FaShoppingCart, FaStar } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import CuppingScoreChart from '../components/CuppingScoreChart';
import FlavorScoreChart from '../components/FlavorScoreChart';
import { cartService } from '../firebase/cartService';
import { favoriteService } from '../firebase/favoriteService';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import LikeIcon from "../public/images/like-icon.svg";
import ShareIcon from "../public/images/share-icon.svg";
import { authService } from '../services/authService';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { CoffeeBean } from '../types/coffee';
import ShareModal from '../components/share-modal';
import InfoCafeModal from '../components/info-cafe-modal';
import dayjs from 'dayjs';
import { flavorService } from '../firebase/flavorService';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import { Rate } from 'antd';
import ReviewModal from '../components/review-modal';
import CoffeeCard from '../components/coffee-card';
import ImgCoffee1 from '../public/images/image-coffee1.png';
import ImgCoffee2 from '../public/images/image-coffee2.png';
import ImgCoffee3 from '../public/images/image-coffee3.png';
import ImgCoffee4 from '../public/images/image-coffee4.png';
import ImgCoffee5 from '../public/images/image-coffee5.png';
import ImgCoffee6 from '../public/images/image-coffee6.png';
import PolarChart from '../components/PolarChart';
import RadioChart from '../components/RadioChart';
import { Review } from '../types/review';
import { reviewService } from '../firebase/reviewService';
import { userService } from '../firebase/userService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper';
import Logo from '../public/images/logo.png';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './custom-swiper.css'; // Add this line to import custom stylesF
import { getUserID } from 'zmp-sdk/apis';
import { notificationService } from '../firebase/notificationService';
const grindSizeOptions = [
  {
    value: 'phin-coffee',
    label: 'Phin coffee',
    info: {
      grind: 'Rất mịn',
      size: '0.1mm',
      similar: 'Bột mì'
    },
    image: ImgCoffee6
  },
  {
    value: 'espresso',
    label: 'Espresso',
    info: {
      grind: 'Mịn',
      size: '0.3mm',
      similar: 'Đường cát mịn'
    },
    image: ImgCoffee5
  },
  {
    value: 'moka-pot',
    label: 'Moka pot, Aeropress',
    info: {
      grind: 'Hơi mịn',
      size: '0.5mm',
      similar: 'Muối ăn'
    },
    image: ImgCoffee4
  },
  {
    value: 'pour-over',
    label: 'Pour-over, Chemex',
    info: {
      grind: 'Vừa',
      size: '0.75mm',
      similar: 'Cát biển'
    },
    image: ImgCoffee3
  },
  {
    value: 'french-press',
    label: 'French press, percolators',
    info: {
      grind: 'Thô',
      size: '1mm',
      similar: 'Muối biển thô'
    },
    image: ImgCoffee2
  },
  {
    value: 'cold-brew',
    label: 'Cold brew',
    info: {
      grind: 'Rất Thô',
      size: '1.5mm',
      similar: 'Muối đá'
    },
    image: ImgCoffee1
  }
];
const CoffeeDetail: React.FC = () => {
  const { id } = useParams();
  const [coffee, setCoffee] = useState<CoffeeBean | null>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    whole: true,     // Nguyên hạt
    ground: false,   // Xay
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<number>(
    coffee?.weightAndPrice[0]?.weight || 0
  );
  const [likesCount, setLikesCount] = useState(0);
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoCafeModal, setShowInfoCafeModal] = useState(false);
  const [dateCoffee, setDateCoffee] = useState('');
  const [flavorImages, setFlavorImages] = useState<{ [key: string]: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCoffee, setReviewCoffee] = useState<any>(null);
  const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
  const [selectedGrindSize, setSelectedGrindSize] = useState(grindSizeOptions[0]); // Default to medium
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    console.log('id', id);

  }, [id])

  useEffect(() => {
    checkLocal();
  }, []);

  useEffect(() => {
    if (coffee) {
      setSelectedWeight(coffee.weightAndPrice[0]?.weight || 0);
    }
  }, [coffee]);

  useEffect(() => {
    if (coffee) {

      let imageUrl = ''

      if (coffee.images) {
        imageUrl = coffee.images[0]
      }
      else if (coffee.driveImages) {
        imageUrl = `https://lh3.googleusercontent.com/d/${coffee.driveImages[0].fileId}?authuser=server`
      }

      recentlyViewedService.addToRecentlyViewed({
        id: coffee.id,
        name: coffee.name,
        imageUrl: imageUrl,
        region: coffee.region,
        type: 'coffee',
      });
    }
  }, [coffee]);


  useEffect(() => {
    getCartItemCount();
    checkFavoriteStatus();
    getLikesCount();
    getLstCoffee();
    if (id) {
      getCoffeeById(id);
    }

  }, [id, userInfo]);

  useEffect(() => {
    const loadFlavorImages = async () => {
      if (coffee) {
        const images: { [key: string]: string } = {};
        for (const note of coffee.flavorNotes) {
          images[note] = await flavorService.getFlavorImageByName(note);
        }
        setFlavorImages(images);
      }
    };
    loadFlavorImages();
  }, [coffee]);

  useEffect(() => {
    if (coffee && coffee.id) {
      fetchReviews();
    }
  }, [coffee, showReviewModal]);

  const checkLocal = async () => {
    try {
      const userId = await getUserID();
      if (!userId) {
        console.error('Không thể lấy userId');
        return;
      }

      const user = await userService.getUserByLocalId(userId);
      if (user) {
        setUserInfo(user);
      } else {
        console.error('Không tìm thấy thông tin user');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra thông tin user:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      if (!coffee || !coffee.id) return;
      const fetchedReviews = await reviewService.getReviewsByCoffeeId(coffee.id);
      setReviews(fetchedReviews);

      // Calculate average rating
      if (fetchedReviews.length > 0) {
        const avgRating = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0) / fetchedReviews.length;
        setAverageRating(avgRating);
      }

      setReviewCoffee({
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

  const getLstCoffee = async () => {
    const allCoffees = await coffeeService.getAllCoffees();
    const filteredCoffees = allCoffees
      .filter(coffee => coffee.id !== id)
      .slice(0, 5);
    setLstCoffee(filteredCoffees);
  }

  const getCoffeeById = async (id: string) => {
    const coffee = await coffeeService.getCoffeeById(id);
    setCoffee(coffee);
    if (coffee?.roastDate) {
      // Kiểm tra nếu là Timestamp từ Firebase
      if (coffee.roastDate.seconds) {
        setDateCoffee(dayjs(new Date(coffee.roastDate.seconds * 1000)).format('DD/MM/YYYY'));
      }
      // Kiểm tra nếu là Date object
      else if (coffee.roastDate instanceof Date) {
        setDateCoffee(dayjs(coffee.roastDate).format('DD/MM/YYYY'));
      }
      // Kiểm tra nếu là string
      else if (typeof coffee.roastDate === 'string') {
        setDateCoffee(dayjs(coffee.roastDate, 'DD/MM/YYYY').format('DD/MM/YYYY'));
      }
    }
  }

  // Sửa lại kiểu của hàm xử lý
  const handleOptionChange = (option: 'whole' | 'ground') => {
    setSelectedOptions(prev => ({
      whole: option === 'whole',    // Chỉ cho phép chọn 1 option
      ground: option === 'ground'
    }));
  };

  // Hàm lấy giá theo khối lượng từ coffee bean
  const getPriceByWeight = (weight: number) => {
    const priceInfo = coffee?.weightAndPrice.find(wp => wp.weight === weight);
    if (!priceInfo) return { original: 0, discounted: 0 };

    return {
      original: priceInfo.price,
      discounted: priceInfo.price * 0.84 // Giả sử giảm giá 16%
    };
  };

  const checkFavoriteStatus = async () => {
    try {
      // const authenticatedUser = await authService.getAuthenticatedUser();
      if (userInfo && id) {
        console.log('userInfo', userInfo);

        const favorite = await favoriteService.getFavorite(userInfo.id, id);
        setIsFavorite(!!favorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      if (!userInfo) {
        // notification.warning({
        //   message: 'Thông báo',
        //   description: 'Vui lòng đăng nhập để thực hiện chức năng này',
        //   duration: 1.5,
        //   placement: 'top'
        // });
        return;
      }

      if (!id) {
        // notification.error({
        //   message: 'Lỗi',
        //   description: 'Không tìm thấy thông tin sản phẩm',
        //   duration: 1.5,
        //   placement: 'top'
        // });
        return;
      }

      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      if (!userInfo) {
        notification.warning({
          message: 'Yêu cầu thông tin',
          description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để yêu thích hạt cà phê',
          duration: 1.5,
          placement: 'top'
        });

        navigate('/profile');

        return;
      }

      if (newFavoriteState) {
        const result = await favoriteService.addFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể yêu thích cà phê',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã yêu thích cà phê',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

        notificationService.addNotification({
          userId: userInfo.id,
          title: 'Yêu thích cà phê',
          content: `${coffee?.name} đã được yêu thích`,
          type: 'favorite',
        });
      } else {
        const result = await favoriteService.removeFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể bỏ yêu thích cà phê',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã bỏ yêu thích cà phê',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

        notificationService.addNotification({
          userId: userInfo.id,
          title: 'Bỏ yêu thích cà phê',
          content: `${coffee?.name} đã được bỏ yêu thích`,
          type: 'favorite',
        });
      }

      await getLikesCount();

    } catch (error) {
      console.error('Error updating favorite:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể cập nhật trạng thái yêu thích',
        duration: 3,
        placement: 'top',
        closable: false
      });
      await checkFavoriteStatus();
    }
  };


  const getLikesCount = async () => {
    if (id) {
      const count = await favoriteService.getCoffeeLikesCount(id);
      setLikesCount(count);
    }
  };

  const getCartItemCount = async () => {
    // const authenticatedUser = await authService.getAuthenticatedUser();
    if (userInfo) {
      const count = await cartService.getCartItemCount(userInfo.id);
      setCartItemCount(count);
    }
    // else if (!authenticatedUser) {
    //   const cartItemLocal = localStorage.getItem('cartItems');
    //   if (cartItemLocal) {
    //     const cartItems = JSON.parse(cartItemLocal);
    //     setCartItemCount(cartItems.length);
    //   }
    // }
  };

  const handleAddToCart = async () => {

    // if (!await authService.isAuthenticated()) {
    //   notification.warning({
    //     message: 'Yêu cầu thông tin',
    //     description: 'Chúng tôi cần thông tin của bạn để có thể giúp bạn thêm vào giỏ hàng',
    //     duration: 1.5,
    //     placement: 'top'
    //   });
    // }

    // setTimeout(async () => {
    try {
      // if (!await authService.isAuthenticated()) {
      //   await authService.authorizeLogin();

      //   notification.success({
      //     message: 'Lấy thông tin thành công',
      //     description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
      //     duration: 1.5,
      //     placement: 'top'
      //   });

      //   handleAddToCart();

      //   return;
      // }

      setIsAddingToCart(true);
      // const authenticatedUser = await authService.getAuthenticatedUser();
      // const cartItemLocal = localStorage.getItem('cartItems');
      // if (!authenticatedUser && coffee) {
      //   const cartItem: any = {
      //     id: Math.random().toString(36).substr(2, 9),
      //     userId: '',
      //     coffeeId: coffee.id,
      //     quantity: 1,
      //     weight: selectedWeight,
      //     grindType: selectedOptions.whole ? 'whole' : 'ground',
      //     grindSize: selectedOptions.ground ? selectedGrindSize.label : null,
      //     price: getPriceByWeight(selectedWeight).original,
      //     name: coffee.name,
      //     imageUrl: coffee.imageUrl,
      //     type: 'coffee'
      //   };

      //   if (cartItemLocal) {
      //     const cartItems = JSON.parse(cartItemLocal);
      //     const existingItemIndex = cartItems.findIndex((item: any) =>
      //       item.coffeeId === cartItem.coffeeId &&
      //       item.weight === cartItem.weight &&
      //       item.grindType === cartItem.grindType &&
      //       item.grindSize === cartItem.grindSize
      //     );

      //     if (existingItemIndex !== -1) {
      //       cartItems[existingItemIndex].quantity += 1;
      //     } else {
      //       cartItems.push(cartItem);
      //     }

      //     localStorage.setItem('cartItems', JSON.stringify(cartItems));
      //   } else {
      //     localStorage.setItem('cartItems', JSON.stringify([cartItem]));
      //   }

      //   notification.success({
      //     message: 'Đã thêm vào giỏ hàng',
      //     duration: 1.5,
      //     placement: 'top'
      //   });

      //   setIsAddingToCart(false);

      //   getCartItemCount();
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

      if (userInfo && coffee) {

        let imageUrl = ''
        if (coffee.images) {
          imageUrl = coffee.images[0]
        }
        else if (coffee.driveImages) {
          imageUrl = `https://lh3.googleusercontent.com/d/${coffee.driveImages[0].fileId}?authuser=server`
        }

        const cartItem: any = {
          userId: userInfo.id,
          coffeeId: coffee.id,
          quantity: 1,
          weight: selectedWeight,
          grindType: selectedOptions.whole ? 'whole' : 'ground',
          grindSize: selectedOptions.ground ? selectedGrindSize.label : null,
          price: getPriceByWeight(selectedWeight).original,
          name: coffee.name,
          imageUrl: imageUrl,
          type: 'coffee'
        };

        await cartService.addToCart(userInfo.id, cartItem);
        notification.success({
          message: 'Đã thêm vào giỏ hàng',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

        setIsAddingToCart(false);

        getCartItemCount();
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

  const handleFlavorNoteClick = (note: string) => {
    navigate(`/flavor/${encodeURIComponent(note)}`);
  }

  // Add grind size options

  const handleGrindSizeChange = (direction: 'increase' | 'decrease') => {
    const currentIndex = grindSizeOptions.findIndex(option => option.label === selectedGrindSize.label);
    let newIndex;

    if (direction === 'increase') {
      newIndex = Math.min(currentIndex + 1, grindSizeOptions.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    setSelectedGrindSize(grindSizeOptions[newIndex]);
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
        coffee && (
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
                {coffee.images.map((image: any, index: any) => (
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

                {coffee.driveImages.map((image: any, index: any) => (
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

              <button className="fixed top-4 left-4 p-2 rounded-full bg-8am-gray"
                style={{
                  top: '45px',
                  zIndex: 1000,
                }}
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="h-4 w-4 text-8am-white" />
              </button>
              <div className="fixed top-4 right-4 flex space-x-2"
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
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1 bg-8am-white">
              <div className="flex justify-between mt-2"
                style={{
                  position: 'relative',
                }}
              >
                <div className="flex flex-col gap-1 mt-3"
                  style={{
                    paddingRight: 100
                  }}
                >
                  <div className="text-8am-black text-2xl font-bold pl-4 pr-4">
                    {coffee.name}
                  </div>

                  <div className="text-8am-middle-grey text-base pl-4 pr-4 font-semibold">
                    {coffee.region.join(', ')}
                  </div>
                </div>

                <div className='mr-4 mt-4 flex items-center gap-3'
                  style={{
                    position: 'absolute',
                    right: 0,
                  }}
                >
                  <div className="text-8am-middle-grey text-sm font-semibold whitespace-nowrap">
                    Đã bán
                    <span className="ml-1 text-8am-black font-bold">
                      {coffee.purchaseCount || 0}
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

                  <div
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

              <div className="mb-6 pl-4 pr-4 pt-2" onClick={() => setShowInfoCafeModal(true)}>
                <div className="flex items-center justify-between">
                  <div className="text-8am-black text-lg font-bold ">
                    Thông tin cà phê
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
                  {coffee.beanInfo}
                </div>
              </div>

              {/* <div className="pl-3 pr-3 pt-2">
                                <div className="text-8am-black text-lg font-bold mb-1 ">
                                    Thông tin sơ chế
                                </div>
                            </div> */}

              <div className="mb-6 ml-4 mr-4 pt-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Độ cao
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {
                    coffee.altitude?.min && coffee.altitude?.max ? (
                      coffee.altitude.min === coffee.altitude.max ?
                        `${coffee.altitude.min} m` :
                        `${coffee.altitude.min} - ${coffee.altitude.max} m`
                    ) : (
                      'Không có thông tin'
                    )
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
                  Mức rang
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {coffee.roastLevel.join(', ')}
                </div>
              </div>

              <div className="mb-6  ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Ngày rang
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {dateCoffee}
                </div>
              </div>

              <div className="mb-6  ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Thời gian hết hạn
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {coffee.expirationMonths ? coffee.expirationMonths + ' tháng' : 'Không có thông tin'}
                </div>
              </div>

              <div className="mb-6  ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Phương pháp sơ chế
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {coffee.processingMethod.join(', ')}
                </div>
              </div>



              <div className="mb-6  ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Phương pháp pha chế đề xuất
                </div>

                <div
                  className="text-8am-black font-medium"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {coffee.brewingMethods.espresso && 'Espresso'}
                  {coffee.brewingMethods.espresso && coffee.brewingMethods.pourOver && ', '}
                  {coffee.brewingMethods.pourOver && 'Pour Over'}
                  {(coffee.brewingMethods.pourOver && coffee.brewingMethods.phin || coffee.brewingMethods.espresso && coffee.brewingMethods.phin) && ', '}
                  {coffee.brewingMethods.phin && 'Phin'}
                  {!coffee.brewingMethods.espresso && !coffee.brewingMethods.pourOver && !coffee.brewingMethods.phin && 'Chưa có đề xuất'}
                </div>
              </div>

              <div className="mb-6 ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                marginBottom: 20,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Loại cà phê
                </div>

                <div
                  className="text-8am-black font-medium flex flex-wrap gap-2"
                  style={{
                    fontSize: '14px',
                    width: '40%',
                  }}
                >
                  {coffee.isSingleOrigin &&
                    <span
                    >
                      Single origin
                    </span>
                  }
                  {
                    coffee.blend && coffee.blend.components.map((component, index) => (
                      <span
                        key={index}
                      >
                        {component.origin} ({component.percentage}%)
                      </span>
                    ))
                  }
                </div>
              </div>

              <div className="mt-6 pl-4 pr-4"
                style={{
                  borderBottom: '10px solid #F5F5F5',
                  paddingBottom: 10,
                }}
              >

                {
                  coffee.flavorNotes.length > 0 ? (
                    <div className="flex overflow-x-auto gap-2 pb-2 w-full">
                      {
                        coffee.flavorNotes.map((note: any, index: number) => (
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
                            {flavorImages && flavorImages[note] ? (
                              <img src={flavorImages[note]} alt={note} className="w-5 h-5" />
                            ) : (
                              <div className='w-5 h-5 bg-8am-light-grey-3 rounded-full flex items-center justify-center'>
                                <CoffeeSkeleton
                                  height={20}
                                />
                              </div>
                            )}
                            <div className="text-8am-black text-base font-medium"
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


              {
                coffee.cuppingScore.total > 0 && (
                  <div className="mt-6 pl-4 pr-4">
                    <div className="text-8am-black text-lg font-bold mb-3">
                      Điểm đánh giá Cupper's - {(coffee.cuppingScore.fragrance + coffee.cuppingScore.wetAroma + coffee.cuppingScore.brightness + coffee.cuppingScore.flavor + coffee.cuppingScore.body + coffee.cuppingScore.finish + coffee.cuppingScore.sweetness + coffee.cuppingScore.cleanCup + coffee.cuppingScore.complexity + coffee.cuppingScore.uniformity).toFixed(1)}
                    </div>
                    {/* <CuppingScoreChart cuppingScore={coffee.cuppingScore} /> */}
                    <RadioChart cuppingScore={coffee.cuppingScore} />
                  </div>
                )
              }

              {
                coffee.flavorScore.total > 0 && (
                  <div className="mt-6 pl-4 pr-4"
                    style={{
                      borderBottom: '10px solid #F5F5F5',
                      paddingBottom: 10,
                    }}
                  >
                    {/* <div className="text-8am-black text-lg font-bold mb-3">
                                            Điểm đánh giá hương vị
                                        </div> */}
                    {/* <FlavorScoreChart flavorScore={coffee.flavorScore} /> */}
                    <PolarChart flavorScore={coffee.flavorScore} />
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
                {coffee.beanType.includes('wholeBean') && (
                  <div
                    className={`w-full flex items-center gap-4 ${selectedOptions.whole ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200 cursor-pointer`}
                    onClick={() => handleOptionChange('whole')}
                  >
                    <input
                      type="radio"
                      name="coffeeType"
                      className="w-5 h-5 accent-orange-500"
                      checked={selectedOptions.whole}
                      onChange={() => handleOptionChange('whole')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-between items-center flex-1">
                      <span className="text-gray-900 font-semibold">Nguyên hạt</span>
                      <div className="flex items-center gap-2">

                        <span className="text-gray-900 font-medium">
                          {Math.round(getPriceByWeight(selectedWeight).original).toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {coffee.beanType.includes('grind') && (
                  <div
                    className={`w-full flex flex-col gap-2 ${selectedOptions.ground ? 'bg-orange-50 border-orange-500' : ''} p-4 rounded-lg border border-gray-200 cursor-pointer`}
                    onClick={() => handleOptionChange('ground')}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="coffeeType"
                        className="w-5 h-5 accent-orange-500"
                        checked={selectedOptions.ground}
                        onChange={() => handleOptionChange('ground')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-between items-center flex-1">
                        <span className="text-gray-900 font-semibold">Xay sẵn</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">
                            {Math.round(getPriceByWeight(selectedWeight).original).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedOptions.ground && (
                      <div className="mt-3">
                        <div className="text-8am-black font-medium mb-2">
                          Mức xay - {selectedGrindSize.info.grind}
                        </div>

                        <div className="w-full mt-4">
                          <div className="flex justify-between gap-4 ">
                            <button
                              onClick={() => handleGrindSizeChange('decrease')}
                              className="w-8 h-8 p-3 rounded-full bg-orange-500 text-white flex items-center justify-center "
                              disabled={grindSizeOptions[0].label === selectedGrindSize.label}
                            >
                              <span className="text-xl font-bold">-</span>
                            </button>

                            <Slider
                              style={{
                                width: 'calc(100% - 40px)'
                              }}
                              min={0}
                              max={grindSizeOptions.length - 1}
                              value={grindSizeOptions.findIndex(option => option.label === selectedGrindSize.label)}
                              onChange={(value) => setSelectedGrindSize(grindSizeOptions[value])}
                              tooltip={{
                                formatter: (value) => grindSizeOptions[value || 0].info.size
                              }}
                              marks={{
                                0: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label:
                                    <div className="text-[11px] font-medium" > {selectedGrindSize.info.size === grindSizeOptions[0].info.size && grindSizeOptions[0].info.size}</div>
                                  ,
                                },
                                1: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label: (
                                    <div className="text-[11px] font-medium">{selectedGrindSize.info.size === grindSizeOptions[1].info.size && grindSizeOptions[1].info.size}</div>
                                  ),
                                },
                                2: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label: (
                                    <div className="text-[11px] font-medium">{selectedGrindSize.info.size === grindSizeOptions[2].info.size && grindSizeOptions[2].info.size}</div>
                                  ),
                                },
                                3: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label: (
                                    <div className="text-[11px] font-medium">{selectedGrindSize.info.size === grindSizeOptions[3].info.size && grindSizeOptions[3].info.size}</div>
                                  ),
                                },
                                4: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label: (
                                    <div className="text-[11px] font-medium">{selectedGrindSize.info.size === grindSizeOptions[4].info.size && grindSizeOptions[4].info.size}</div>

                                  ),
                                },
                                5: {
                                  style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: '40px',
                                  },
                                  label: (
                                    <div className="text-[11px] font-medium">{selectedGrindSize.info.size === grindSizeOptions[5].info.size && grindSizeOptions[5].info.size}</div>

                                  ),
                                },
                              }}
                              styles={{
                                track: {
                                  background: '#F97316'
                                },
                                rail: {
                                  background: '#E5E7EB'
                                },
                                handle: {
                                  borderColor: '#F97316',
                                  background: '#F97316'
                                }
                              }}
                            />

                            <button
                              onClick={() => handleGrindSizeChange('increase')}
                              className="w-8 h-8 p-3 rounded-full bg-orange-500 text-white flex items-center justify-center "
                              disabled={grindSizeOptions[grindSizeOptions.length - 1].label === selectedGrindSize.label}
                            >
                              <span className="text-xl font-bold">+</span>
                            </button>
                          </div>

                          {selectedGrindSize && (
                            <div className="flex justify-between items-center text-base font-medium text-gray-700">
                              <span>{selectedGrindSize.label}</span>
                              <img
                                src={selectedGrindSize.image}
                                alt=""
                                className='w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => setShowImagePreview(true)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
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
                        <div key={rev.id} className="bg-8am-light-grey-3 rounded-lg p-4 " style={{ minWidth: '300px' }}>
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

                {lstCoffee.length === 0 ? (
                  <div className="flex overflow-x-auto gap-4 pb-2">
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-4 pb-2">
                    {
                      lstCoffee.map((coffeeItem: any, index) => (
                        <div key={coffeeItem.id || index}>
                          <CoffeeCard
                            isShowLike={false}
                            width={230}
                            {...coffeeItem}
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
      {/* {
        coffee && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            item={coffee}
          />
        )
      } */}

      {
        coffee && (
          <InfoCafeModal
            isOpen={showInfoCafeModal}
            onClose={() => setShowInfoCafeModal(!showInfoCafeModal)}
            item={coffee}
            dateCoffee={dateCoffee}
          />
        )
      }

      {
        reviewCoffee && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(!showReviewModal)}
            review={reviewCoffee}
            coffee={coffee}
          />
        )
      }
      <Modal
        open={showImagePreview}
        footer={null}
        onCancel={() => setShowImagePreview(false)}
        width={600}
        centered
        className="grind-size-preview-modal"
      >
        <img
          src={selectedGrindSize.image}
          alt={selectedGrindSize.label}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            marginTop: '16px'
          }}
        />
        <div className="text-center mt-4 text-lg font-medium">
          {selectedGrindSize.label} - {selectedGrindSize.info.grind}
          <div className="text-sm text-gray-500 mt-1">
            Kích thước: {selectedGrindSize.info.size}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CoffeeDetail;