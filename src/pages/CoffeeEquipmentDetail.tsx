import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { FaArrowLeft, FaShoppingCart, FaHeart, FaShare, FaChevronRight } from 'react-icons/fa';
import { CoffeeEquipmentService } from '../firebase/coffeeEquipmentService';
import { CoffeeEquipment } from '../types/coffeeEquipment';
import { cartService } from '../firebase/cartService';
import { userService } from '../firebase/userService';
import { favoriteService } from '../firebase/favoriteService';
import { reviewService } from '../firebase/reviewService';
import { getUserID } from 'zmp-sdk/apis';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper';
import Laurels1 from '../public/images/laurels1.svg';
import Laurels2 from '../public/images/laurels2.svg';
import Logo from '../public/images/logo.png';
import { useCartCount } from '../hooks/useCartCount';
import { Review } from '../types/review';
import { Rate } from 'antd';
import CoffeeEquipmentCard from '../components/coffee-equipment-card';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import { recentlyViewedService } from '../services/recentlyViewedService';
import dayjs from 'dayjs';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './custom-swiper.css';

const CoffeeEquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<CoffeeEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewEquipment, setReviewEquipment] = useState<any>(null);
  const [lstEquipment, setLstEquipment] = useState<CoffeeEquipment[]>([]);
  const cartItemCount = useCartCount(userInfo?.id);

  const equipmentService = new CoffeeEquipmentService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        // Get user info
        const userId = await getUserID();
        const user = await userService.getUserByLocalId(userId);
        setUserInfo(user);

        // Get equipment by ID
        const equipmentList = await equipmentService.getAllEquipment();
        const foundEquipment = equipmentList.find(e => e.id === id);

        if (foundEquipment) {
          setEquipment(foundEquipment);
        } else {
          // Sản phẩm không tồn tại, hiển thị thông báo và quay lại
          notification.error({
            message: 'Sản phẩm không tồn tại',
            description: 'Sản phẩm này đã hết hàng hoặc không còn được bán nữa.',
            duration: 3,
            placement: 'top',
            closable: false
          });
          
          // Quay lại trang trước sau 1.5 giây
          setTimeout(() => {
            navigate(-1);
          }, 1500);
          return;
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.',
          duration: 3,
          placement: 'top',
          closable: false
        });
        
        // Quay lại trang trước sau 1.5 giây
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Track recently viewed when equipment and user info are available
  useEffect(() => {

    console.log('equipment', equipment);
    console.log('userInfo', userInfo);

    if (equipment && userInfo?.id) {
      let imageUrl = '';
      
      if (equipment.images && equipment.images.length > 0) {
        imageUrl = equipment.images[0];
      } else if (equipment.driveImages && equipment.driveImages.length > 0) {
        imageUrl = `https://lh3.googleusercontent.com/d/${equipment.driveImages[0].fileId}?authuser=server`;
      }

      // Get equipment name
      const nameField = equipment.values.find(v => 
        v.name.toLowerCase().includes('tên') || 
        v.name.toLowerCase().includes('name')
      );
      const equipmentName = nameField?.value || equipment.categoryName || 'Dụng cụ cà phê';

      // Add to recently viewed
      console.log('Adding coffee equipment to recently viewed:', {
        id: equipment.id,
        name: equipmentName,
        type: 'coffee_equipment',
        userId: userInfo.id
      });
      
      recentlyViewedService.addToRecentlyViewed(
        {
          ...equipment,
          id: equipment.id,
          name: equipmentName,
          imageUrl: imageUrl,
          categoryName: equipment.categoryName,
          type: 'coffee_equipment',
        },
        'coffee_equipment',
        userInfo.id
      ).then((result) => {
        console.log('Coffee equipment added to recently viewed successfully:', result);
      }).catch((error) => {
        console.error('Error adding coffee equipment to recently viewed:', error);
      });
    }
  }, [equipment, userInfo]);

  useEffect(() => {
    if (id && userInfo) {
      checkFavoriteStatus();
      getLikesCount();
    }
  }, [id, userInfo]);

  useEffect(() => {
    if (equipment && equipment.id) {
      fetchReviews();
      getRecommendedEquipment();
    }
  }, [equipment, showReviewModal]);

  const getImageUrl = (index: number = 0) => {
    if (!equipment) return '';

    if (equipment.images && equipment.images.length > index) {
      return equipment.images[index];
    }
    if (equipment.driveImages && equipment.driveImages.length > index) {
      return `https://lh3.googleusercontent.com/d/${equipment.driveImages[index].fileId}?authuser=server`;
    }
    return '';
  };

  const getAllImages = () => {
    if (!equipment) return [];

    const images: string[] = [];
    if (equipment.images) {
      images.push(...equipment.images);
    }
    if (equipment.driveImages) {
      images.push(...equipment.driveImages.map(img =>
        `https://lh3.googleusercontent.com/d/${img.fileId}?authuser=server`
      ));
    }
    return images;
  };

  const getFieldValue = (fieldName: string) => {
    if (!equipment) return null;
    const field = equipment.values.find(v =>
      v.name.toLowerCase().includes(fieldName.toLowerCase())
    );
    return field?.value;
  };

  const getPriceValue = () => {
    const priceField = equipment?.values.find(v =>
      v.name.toLowerCase().includes('giá') ||
      v.name.toLowerCase().includes('price')
    );
    return priceField?.value;
  };

  const getProductName = () => {
    const nameField = equipment?.values.find(v =>
      v.name.toLowerCase().includes('tên') ||
      v.name.toLowerCase().includes('name') ||
      v.name.toLowerCase().includes('product')
    );
    return nameField?.value || equipment?.categoryName || 'Dụng cụ cà phê';
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
      if (!userInfo) {
        notification.warning({
          message: 'Yêu cầu thông tin',
          description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để yêu thích dụng cụ',
          duration: 1.5,
          placement: 'top'
        });
        navigate('/profile');
        return;
      }

      if (!id) return;

      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      if (newFavoriteState) {
        const result = await favoriteService.addFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể yêu thích dụng cụ',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã yêu thích dụng cụ',
          duration: 1.5,
          placement: 'top',
          closable: false
        });
      } else {
        const result = await favoriteService.removeFavorite(userInfo.id, id);
        if (!result) {
          setIsFavorite(!newFavoriteState);
          notification.error({
            message: 'Không thể bỏ yêu thích dụng cụ',
            duration: 1.5,
            placement: 'top',
            closable: false
          });
          return;
        }
        notification.success({
          message: 'Đã bỏ yêu thích dụng cụ',
          duration: 1.5,
          placement: 'top',
          closable: false
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

  const handleAddToCart = async () => {
    try {
      if (!equipment || !userInfo) {
        notification.warning({
          message: 'Yêu cầu thông tin',
          description: 'Bạn cần phải quan tâm oa và cung cấp thông tin để thêm vào giỏ hàng',
          duration: 1.5,
          placement: 'top'
        });
        navigate('/profile');
        return;
      }

      setIsAddingToCart(true);

      await cartService.addToCart(userInfo.id, {
        coffeeEquipmentId: equipment.id,
        type: 'coffee_equipment',
        quantity: 1,
        price: getPriceValue() || 0,
        name: getProductName(),
        imageUrl: getImageUrl(),
        userId: userInfo.id
      });

      notification.success({
        message: 'Đã thêm vào giỏ hàng!',
        duration: 1.5,
        placement: 'top',
        closable: false
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi xảy ra khi thêm vào giỏ hàng',
        duration: 3,
        placement: 'top',
        closable: false
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      if (!equipment || !equipment.id) return;

      // Note: Assuming equipment reviews use the same service structure
      // You might need to create a specific method for equipment reviews
      const fetchedReviews = await reviewService.getReviewsByDishId(equipment.id); // or create getReviewsByEquipmentId
      setReviews(fetchedReviews);

      // Calculate average rating
      if (fetchedReviews.length > 0) {
        const avgRating = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0) / fetchedReviews.length;
        setAverageRating(avgRating);
      }

      setReviewEquipment({
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

  const getRecommendedEquipment = async () => {
    try {
      const allEquipment = await equipmentService.getAllEquipment();
      const filteredEquipment = allEquipment
        .filter(eq => eq.id !== equipment?.id && eq.categoryId === equipment?.categoryId)
        .slice(0, 5);
      setLstEquipment(filteredEquipment);
    } catch (error) {
      console.error('Error loading recommended equipment:', error);
    }
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
    return '';
  };

  const renderFieldValue = (field: any) => {
    if (field.type === 'image') {
      return null; // Images are shown separately
    }

    if (field.type === 'rating') {
      return (
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < (field.value || 0) ? 'text-yellow-400' : 'text-gray-300'}>
              ⭐
            </span>
          ))}
          <span className="ml-2">{field.value}/5</span>
        </div>
      );
    }

    if (field.type === 'multi_input') {
      return (
        <div className="space-y-1">
          {Object.entries(field.value || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{key}:</span>
              <span>{value as string}</span>
            </div>
          ))}
        </div>
      );
    }

    if (field.type === 'multi_checkbox') {
      if (Array.isArray(field.value)) {
        return field.value.join(', ');
      }
    }

    if (typeof field.value === 'number') {
      return `${field.value.toLocaleString()} ${field.suffix || ''}`;
    }

    // Trả về giá trị nếu có, ngược lại trả về null để không hiển thị
    if (field.value === null ||
      field.value === undefined ||
      field.value === '' ||
      (typeof field.value === 'string' && field.value.trim() === '')) {
      return null;
    }

    return field.value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">{error || 'Không tìm thấy dụng cụ'}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const allImages = getAllImages();

  return (
    <>
      {equipment && (
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
              pagination={{ clickable: true, bulletClass: 'swiper-pagination-bullet', bulletActiveClass: 'swiper-pagination-bullet-active' }}
              loop={true}
              style={{
                width: '80%',
                height: '100%',
                borderRadius: 10,
              }}
            >
              {allImages.map((image, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={image}
                    alt={getProductName()}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/src/public/images/coffee.jpg';
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
          </div>

          {/* Content */}
          <div className="space-y-1 bg-8am-white">
            <div className="flex justify-between mt-2">
              <div className="flex flex-col gap-1 mt-3">
                <div className="text-8am-black text-2xl font-bold pl-4 pr-4">
                  {getProductName()}
                </div>
                <div className="text-8am-middle-grey text-base pl-4 pr-4 font-semibold">
                  {equipment.categoryName}
                </div>
              </div>

              <div className='mr-4 mt-4 flex items-center gap-3'>
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

            {/* Equipment Information */}
            <div className="mb-6 pl-4 pr-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-8am-black text-lg font-bold">
                  Thông tin dụng cụ
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
                {(() => {
                  // Tìm field mô tả hoặc thông tin chi tiết
                  const descField = equipment.values?.find((v: any) =>
                    v.name.toLowerCase().includes('mô tả') ||
                    v.name.toLowerCase().includes('thông tin') ||
                    v.name.toLowerCase().includes('description') ||
                    v.name.toLowerCase().includes('chi tiết')
                  );
                  return descField?.value || `${getProductName()} - ${equipment.categoryName}`;
                })()}
              </div>
            </div>

            {/* Equipment Specifications */}
            {equipment.values
              .filter(field => {
                // Kiểm tra loại field
                if (field.type === 'image') return false;

                // Kiểm tra tên field để loại trừ
                const fieldNameLower = field.name.toLowerCase();
                if (fieldNameLower.includes('tên') ||
                  fieldNameLower.includes('name') ||
                  fieldNameLower.includes('giá') ||
                  fieldNameLower.includes('price') ||
                  fieldNameLower.includes('mô tả') ||
                  fieldNameLower.includes('thông tin') ||
                  fieldNameLower.includes('description') ||
                  fieldNameLower.includes('chi tiết')) {
                  return false;
                }

                // Kiểm tra giá trị có hợp lệ không
                const value = field.value;
                if (value === null ||
                  value === undefined ||
                  value === '' ||
                  (typeof value === 'string' && value.trim() === '') ||
                  (Array.isArray(value) && value.length === 0) ||
                  (typeof value === 'object' && Object.keys(value).length === 0)) {
                  return false;
                }

                return true;
              })
              .map((field, index) => (
                <div key={index} className="mb-6 ml-4 mr-4" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #F5F5F5',
                  paddingBottom: 10,
                }}>
                  <div className="text-8am-middle-grey text-sm font-medium">
                    {field.name}
                    {field.tooltip && (
                      <span className="text-gray-400 text-sm ml-2" title={field.tooltip}>
                        ❓
                      </span>
                    )}
                  </div>
                  <div
                    className="text-8am-black font-medium"
                    style={{
                      fontSize: '14px',
                      width: '40%',
                    }}
                  >
                    {renderFieldValue(field)}
                  </div>
                </div>
              ))}

            {/* Price and Cart Section */}
            <div className="flex flex-col justify-between gap-2 pl-4 pr-4 pt-4"
              style={{
                borderBottom: '10px solid #F5F5F5',
                paddingBottom: 20,
              }}
            >
              {getPriceValue() && (
                <div className="mb-4">
                  <div className="text-8am-black text-lg font-bold mb-2">
                    Giá dụng cụ
                  </div>
                </div>
              )}

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
                    {getPriceValue() ? (
                      <>
                        {typeof getPriceValue() === 'number'
                          ? getPriceValue().toLocaleString('vi-VN') + ' đ'
                          : getPriceValue()
                        }
                      </>
                    ) : (
                      'Thêm vào giỏ'
                    )}
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

              {lstEquipment.length === 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-2">
                  <CoffeeSkeleton />
                  <CoffeeSkeleton />
                  <CoffeeSkeleton />
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {lstEquipment.map((equipmentItem, index) => (
                    <div
                      key={equipmentItem.id || index}
                      className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/coffee-equipment/${equipmentItem.id}`)}
                      style={{ minWidth: '230px' }}
                    >
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        {(() => {
                          // Xác định URL ảnh với priority
                          let imageUrl = '';

                          if (equipmentItem.images && equipmentItem.images.length > 0 && equipmentItem.images[0] && equipmentItem.images[0].trim() !== '') {
                            imageUrl = equipmentItem.images[0];
                          } else if (equipmentItem.driveImages && equipmentItem.driveImages.length > 0 && equipmentItem.driveImages[0]?.fileId) {
                            imageUrl = `https://lh3.googleusercontent.com/d/${equipmentItem.driveImages[0].fileId}?authuser=server`;
                          }

                          if (imageUrl) {
                            return (
                              <img
                                src={imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <svg class="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12,3C13.11,3 14,3.89 14,5H22V7H20V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V7H2V5H10C10,3.89 10.89,3 12,3M6,19H18V7H6V19M8,9H16V11H8V9M8,12H16V14H8V12M8,15H13V17H8V15Z" />
                                        </svg>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            );
                          } else {
                            // Fallback icon khi không có ảnh
                            return (
                              <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,3C13.11,3 14,3.89 14,5H22V7H20V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V7H2V5H10C10,3.89 10.89,3 12,3M6,19H18V7H6V19M8,9H16V11H8V9M8,12H16V14H8V12M8,15H13V17H8V15Z" />
                              </svg>
                            );
                          }
                        })()}
                      </div>
                      <div className="p-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {(() => {
                            // Lấy tên từ values array giống như trong card
                            const nameField = equipmentItem.values?.find((v: any) =>
                              v.name.toLowerCase().includes('tên') || v.name.toLowerCase().includes('name')
                            );
                            return nameField?.value || equipmentItem.categoryName || 'Dụng cụ cà phê';
                          })()}
                        </h4>
                        {(() => {
                          // Lấy giá từ values array giống như trong card
                          const priceField = equipmentItem.values?.find((v: any) =>
                            v.name.toLowerCase().includes('giá') || v.name.toLowerCase().includes('price')
                          );
                          const priceValue = priceField?.value;

                          if (priceValue) {
                            return (
                              <p className="text-sm text-orange-600 font-semibold mt-1">
                                {typeof priceValue === 'number'
                                  ? priceValue.toLocaleString('vi-VN') + 'đ'
                                  : priceValue
                                }
                              </p>
                            );
                          }
                          return null;
                        })()}
                        <p className="text-xs text-gray-500 mt-1">
                          {equipmentItem.categoryName || 'Dụng cụ cà phê'}
                        </p>
                      </div>
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

export default CoffeeEquipmentDetail;
