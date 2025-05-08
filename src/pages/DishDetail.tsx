import { notification, Modal, Rate, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronRight, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { cartService } from '../firebase/cartService';
import { favoriteService } from '../firebase/favoriteService';
import LikeIcon from "../public/images/like-icon.svg";
import { notificationService } from '../firebase/notificationService';
import { Dish } from '../types/dish';
import { DishService } from '../firebase/dishService';
import { userService } from '../firebase/userService';
import { getUserID } from 'zmp-sdk/apis';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper';
import Logo from '../public/images/logo.png';
import { Review } from '../types/review';
import { reviewService } from '../firebase/reviewService';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import ReviewDishModal from '../components/review-dish-modal';
import dayjs from 'dayjs';
import DishCard from '../components/dish-card';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import { CustomizationService } from '../firebase/CustomizationService';
import { Customization, CustomizationGroup, DishInfo } from '../types/customization';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './custom-swiper.css';
import { Type } from '../types/type';
import typeService from '../firebase/typeService';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { CoffeeBean } from '../types/coffee';
import { coffeeService } from '../firebase/coffeeService';
import { CartItem } from '../types/cart';

const DishDetail: React.FC = () => {
  const { id } = useParams();
  const [dish, setDish] = useState<Dish | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [userInfo, setUserInfo] = useState<any>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const dishService = new DishService();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewDish, setReviewDish] = useState<any>(null);
  const [lstDishes, setLstDishes] = useState<Dish[]>([]);
  const [dishType, setDishType] = useState<Type | null>(null);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, DishInfo[]>>({});
  const [isHBCustomization, setIsHBCustomization] = useState(false);
  const customizationService = new CustomizationService();

  useEffect(() => {
    checkLocal();
  }, []);

  useEffect(() => {
    if (id) {
      getDishById(id);
      getCartItemCount();
      checkFavoriteStatus();
      getLikesCount();
    }
  }, [id, userInfo]);

  useEffect(() => {
    if (dish && dish.id) {
      fetchReviews();
      getRecommendedDishes();
      getDishType();
    }
  }, [dish, showReviewModal]);

  useEffect(() => {
    if (dish) {
      recentlyViewedService.addToRecentlyViewed({
        ...dish,
        type: 'dish',
      });
    }
  }, [dish]);

  useEffect(() => {
    if (dish?.id) {
      fetchCustomizations();
    }
  }, [dish]);

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

  const getDishById = async (id: string) => {
    const dish = await dishService.getDishById(id);
    setDish(dish);
  }

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

  const handleFavoriteClick = async () => {
    try {
      if (!userInfo) {
        return;
      }

      if (!id) {
        return;
      }

      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      if (newFavoriteState) {
        const result = await favoriteService.addFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể yêu thích món ăn',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã yêu thích món ăn',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

        notificationService.addNotification({
          userId: userInfo.id,
          title: 'Yêu thích món ăn',
          content: `${dish?.name} đã được yêu thích`,
          type: 'favorite',
        });
      } else {
        const result = await favoriteService.removeFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể bỏ yêu thích món ăn',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã bỏ yêu thích món ăn',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

        notificationService.addNotification({
          userId: userInfo.id,
          title: 'Bỏ yêu thích món ăn',
          content: `${dish?.name} đã được bỏ yêu thích`,
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
    if (userInfo) {
      const count = await cartService.getCartItemCount(userInfo.id);
      setCartItemCount(count);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      if (!dish || !dish.id) return;
      const fetchedReviews = await reviewService.getReviewsByDishId(dish.id);
      setReviews(fetchedReviews);

      // Calculate average rating
      if (fetchedReviews.length > 0) {
        const avgRating = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0) / fetchedReviews.length;
        setAverageRating(avgRating);
      }

      setReviewDish({
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

  const getRecommendedDishes = async () => {
    if (!dish) return;
    const allDishes = await dishService.getAllDishes();
    const filteredDishes = allDishes
      .filter(d => d.id !== dish.id && d.group === dish.group)
      .slice(0, 5);
    setLstDishes(filteredDishes);
  };

  const formatDate = (date: any) => {
    if (date) {
      if (date.seconds) {
        return dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY');
      } else if (date instanceof Date) {
        return dayjs(date).format('DD/MM/YYYY');
      } else if (typeof date === 'string') {
        return dayjs(date, 'DD/MM/YYYY').format('DD/MM/YYYY');
      }
    }
  };

  // Gọi hàm lấy ra type
  const getDishType = async () => {
    const type = await typeService.getTypeByCode(dish?.type || '');
    setDishType(type);
  };

  const fetchCustomizations = async () => {
    try {
      if (!dish?.code) return;
      const customizationList = await customizationService.getCustomizationsByDishCode(dish.code);
      console.log('customizationList', customizationList);

      setCustomizations(customizationList);

      // Check if this is an HB customization
      const isHB = customizationList.length > 0 && customizationList[0].name === "HB";
      console.log('Is HB Customization:', isHB);
      setIsHBCustomization(isHB);

      // Initialize selected options
      const initialOptions: Record<string, DishInfo[]> = {};
      customizationList.forEach(customization => {
        customization.groups.forEach(group => {
          initialOptions[group.groupName] = [];
        });
      });
      setSelectedOptions(initialOptions);
    } catch (error) {
      console.error('Error fetching customizations:', error);
    }
  };

  const handleOptionSelect = (groupName: string, option: DishInfo, isSelected: boolean) => {
    setSelectedOptions(prev => {
      const group = customizations[0]?.groups.find(g => g.groupName === groupName);
      if (!group) return prev;

      // Check if this is an HB customization
      console.log('Processing option selection, isHBCustomization:', isHBCustomization);

      // Special handling for HB customization - all groups treated as one radio group
      if (isHBCustomization) {
        // If user selects an option, clear all previous selections
        const newSelections = { ...prev };

        // First clear all selections if this option is being selected
        if (isSelected) {
          customizations.forEach(customization => {
            customization.groups.forEach(g => {
              newSelections[g.groupName] = [];
            });
          });
        }

        // Then add the newly selected option if it's being selected
        if (isSelected) {
          newSelections[groupName] = [option];
        } else {
          newSelections[groupName] = [];
        }

        return newSelections;
      }

      // Normal handling for non-HB customizations
      const currentSelections = [...(prev[groupName] || [])];

      // If limit is 1, treat it like a radio button (replace existing selection)
      if (group.limit === 1) {
        return {
          ...prev,
          [groupName]: isSelected ? [option] : []
        };
      }

      // For other cases (including limit = 0 which means unlimited)
      if (isSelected) {
        // If limit is 0, allow unlimited selections
        // If limit > 1, check if we can add more items
        if (group.limit > 0 && currentSelections.length >= group.limit) {
          notification.warning({
            message: `Chỉ được chọn tối đa ${group.limit} tùy chọn`,
            duration: 1.5,
            placement: 'top'
          });
          return prev;
        }
        return {
          ...prev,
          [groupName]: [...currentSelections, option]
        };
      } else {
        return {
          ...prev,
          [groupName]: currentSelections.filter(item => item.code !== option.code)
        };
      }
    });
  };

  const validateCustomizations = (): boolean => {
    // If dish price is 0, require at least one customization option to be selected
    if (dish?.price === 0) {
      const hasAnySelection = Object.values(selectedOptions).some(options => options.length > 0);
      if (!hasAnySelection) {
        notification.error({
          message: 'Vui lòng chọn tùy chọn món',
          description: 'Món này yêu cầu ít nhất một tùy chọn',
          duration: 1.5,
          placement: 'top'
        });
        return false;
      }
    }

    // Validate required customization groups
    for (const customization of customizations) {
      for (const group of customization.groups) {
        const selectedCount = selectedOptions[group.groupName]?.length || 0;
        if (group.isRequired && selectedCount === 0) {
          notification.error({
            message: `Vui lòng chọn ${group.groupName}`,
            duration: 1.5,
            placement: 'top'
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleAddToCart = async () => {
    try {
      if (!validateCustomizations()) {
        return;
      }

      setIsAddingToCart(true);

      if (userInfo && dish) {
        const totalPrice = dish.price + calculateTotalCustomizationPrice();

        // Check if the total price is still 0 after adding customizations
        if (totalPrice === 0) {
          notification.error({
            message: 'Không thể thêm vào giỏ hàng',
            description: 'Vui lòng chọn tùy chọn món để cập nhật giá',
            duration: 1.5,
            placement: 'top'
          });
          setIsAddingToCart(false);
          return;
        }

        const cartItem: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: userInfo.id,
          dishId: dish.id,
          quantity: 1,
          price: totalPrice,
          name: dish.name,
          imageUrl: dish.imageUrl,
          type: 'dish',
          customizations: selectedOptions
        };

        await cartService.addToCart(userInfo.id, cartItem);
        notification.success({
          message: 'Đã thêm vào giỏ hàng',
          duration: 1.5,
          placement: 'top',
          closable: false
        });

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
  };

  const calculateTotalCustomizationPrice = () => {
    let total = 0;
    Object.values(selectedOptions).forEach(options => {
      options.forEach(option => {
        total += option.price;
      });
    });

    // Log the total price for debugging
    console.log('Total customization price:', total);
    console.log('Selected options:', selectedOptions);

    return total;
  };

  return (
    <>
      {dish && (
        <div style={{ marginBottom: 40, marginTop: 100 }}>
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
              pagination={{ clickable: true }}
              loop={true}
              style={{
                width: '80%',
                height: '100%',
                borderRadius: 10,
              }}
            >
              <SwiperSlide>
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </SwiperSlide>
            </Swiper>

            <button className="fixed top-4 left-4 p-2 rounded-full bg-8am-gray"
                style={{
                    top: '45px',
                    zIndex: 1000,
                    position: 'fixed'
                }}
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft className="h-4 w-4 text-8am-white" />
            </button>

            <div
              className="fixed top-4 right-4 flex space-x-2"
              style={{
                top: '45px',
                right: '105px',
                zIndex: 1000,
              }}
            >
              <div
                className="bg-8am-gray rounded-full p-2 relative"
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
                  {dish.name}
                </div>

                <div className="text-8am-middle-grey text-base pl-4 pr-4 font-semibold">
                  {dishType?.name || 'Không có thông tin'}
                </div>
              </div>

              <div className='mr-4 mt-4 flex items-center gap-3'>
                <div className="text-8am-middle-grey text-sm font-semibold">
                  Đã bán
                  <span className="ml-1 text-8am-black font-bold">
                    {dish.purchaseCount || 0}
                  </span>
                </div>

                <button
                  onClick={handleFavoriteClick}
                  className={`rounded-full ${isFavorite
                    ? 'bg-red-500'
                    : 'bg-8am-light-grey-2'
                    } backdrop-blur-sm `}
                  style={{
                    padding: 6,
                  }}
                >
                  <img
                    src={LikeIcon}
                    alt="Like"
                    className={`w-3 h-3`}
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

            {/* Dish Information */}
            {/* <div className="mb-6 ml-4 mr-4 pt-4" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #F5F5F5',
              paddingBottom: 10,
            }}>
              <div className="text-8am-middle-grey text-sm font-medium">
                Giá
              </div>

              <div className="text-8am-black font-medium" style={{ fontSize: '14px', width: '40%' }}>
                {dish.price.toLocaleString('vi-VN')}đ
              </div>
            </div> */}

            {dish.preparationTime > 0 && (
              <div className="mb-6 ml-4 mr-4" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F5F5F5',
                paddingBottom: 10,
              }}>
                <div className="text-8am-middle-grey text-sm font-medium">
                  Thời gian chuẩn bị
                </div>

                <div className="text-8am-black font-medium" style={{ fontSize: '14px', width: '40%' }}>
                  {dish.preparationTime} phút
                </div>
              </div>
            )}

            {/* Dish Information */}
            <div className="mb-6 pl-4 pr-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-8am-black text-lg font-bold">
                  Thông tin cà phê
                </div>

                {/* <div className="text-8am-orange">
                  <FaChevronRight />
                </div> */}
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
                {dish.description}
              </div>
            </div>

            {/* <div className="mb-6 ml-4 mr-4 pt-4" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #F5F5F5',
              paddingBottom: 10,
            }}>
              <div className="text-8am-middle-grey text-sm font-medium">
                Loại món
              </div>

              <div
                className="text-8am-black font-medium"
                style={{
                  fontSize: '14px',
                  width: '40%',
                }}
              >
                {dish.type || 'Không có thông tin'}
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
                Đơn vị
              </div>

              <div
                className="text-8am-black font-medium"
                style={{
                  fontSize: '14px',
                  width: '40%',
                }}
              >
                {dish.unit || 'Không có thông tin'}
              </div>
            </div> */}

            <div className="flex flex-col justify-between gap-2 pl-4 pr-4 pt-4" style={{
              borderBottom: '10px solid #F5F5F5',
              paddingBottom: 20,
            }}>
              <div className="text-8am-black text-lg font-bold mb-1">
                Tùy chọn món
              </div>

              {/* Customization Options */}
              {customizations.map((customization) => (
                <div key={customization.id}>
                  {customization.groups.map((group) => {
                    // Filter out inactive dishCodes
                    const activeDishCodes = group.dishCodes.filter(dishCode => dishCode.isActive);

                    // Skip rendering if all dishCodes are inactive
                    if (activeDishCodes.length === 0) {
                      return null;
                    }

                    return (
                      <div
                        key={group.groupName}
                        className="mb-6"
                        style={{
                          borderBottom: '1px solid #F5F5F5',
                          paddingBottom: 15
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-8am-black text-lg font-bold">
                            {group.groupName}
                          </div>
                          <div className="text-8am-middle-grey text-sm flex gap-2">
                            <div>
                              {group.isRequired ? 'Bắt buộc' : 'Tùy chọn'} {group.limit > 0 ? '-' : ''}
                            </div>
                            {group.limit > 0 && (
                              <div>
                                Chọn tối đa {group.limit}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {activeDishCodes.map((option) => (
                            <div
                              key={option.code}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type={isHBCustomization || group.limit === 1 ? 'radio' : 'checkbox'}
                                  name={isHBCustomization ? "hb-single-selection" : (group.limit === 1 ? `${group.groupName}-option` : undefined)}
                                  checked={selectedOptions[group.groupName]?.some(item => item.code === option.code)}
                                  onChange={(e) => handleOptionSelect(group.groupName, option, e.target.checked)}
                                  className="w-5 h-5"
                                />
                                <div>
                                  <div className="text-8am-black font-medium">
                                    {option.name}
                                  </div>
                                  <div className="text-8am-middle-grey text-sm">
                                    +{option.price.toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <button
                className="w-full bg-orange-500 text-white py-4 rounded-lg mt-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? 'Đang xử lý...' : (
                  <div className="flex items-center gap-2">
                    <FaShoppingCart className="h-4 w-4" />
                    <span>{(dish?.price + calculateTotalCustomizationPrice()).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </button>

              <button
                onClick={handleFavoriteClick}
                className="w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium bg-8am-light-grey-3"
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

            {/* Customer Reviews */}
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
                      Đang tải đánh giá...
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.slice(0, 5).map((rev) => (
                      <div key={rev.id} className="bg-8am-light-grey-3 rounded-lg p-4" style={{ minWidth: '300px' }}>
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

            {/* You May Also Like */}
            <div className="mt-6 pl-4 pr-4 pb-10">
              <div className="flex justify-between items-center mb-4 mt-4">
                <div className="text-8am-black text-lg font-bold">
                  Có thể bạn cũng thích
                </div>
              </div>

              {lstDishes.length === 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-2">
                  <CoffeeSkeleton />
                  <CoffeeSkeleton />
                  <CoffeeSkeleton />
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {lstDishes
                    .filter((dish): dish is Dish & { id: string } => !!dish.id)
                    .map((dishItem, index) => (
                      <div key={dishItem.id}>
                        <DishCard
                          isShowLike={false}
                          width={230}
                          {...dishItem}
                          userInfo={userInfo}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Add to Cart Section */}

          </div>
        </div>
      )}

      {reviewDish && (
        <ReviewDishModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          review={reviewDish}
          dish={dish}
        />
      )}
    </>
  );
};

export default DishDetail; 