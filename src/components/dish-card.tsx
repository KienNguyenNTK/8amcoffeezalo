import { notification, Spin } from 'antd';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../firebase/favoriteService';
import LikeIcon from "../public/images/like-icon.svg";
import { notificationService } from '../firebase/notificationService';
import { Dish } from '../types/dish';

interface DishCardProps {
  imageUrl?: string;
  name: string;
  id: string;
  isShowLike?: boolean;
  width?: any;
  height?: any;
  fontTitle?: any;
  fontName?: any;
  isChangeFavorite?: (isFavorite: boolean) => void;
  onLoginSuccess?: () => void;
  userInfo: any;
  price: number;
  description?: string;
}

const DishCard: React.FunctionComponent<DishCardProps> = ({
  imageUrl,
  name,
  id,
  isShowLike = true,
  width = '',
  height = '',
  fontTitle = '',
  fontName = '',
  onLoginSuccess,
  userInfo,
  price,
  description
}) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

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

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    if (id) {
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
          content: `${name} đã được yêu thích`,
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
          content: `${name} đã được bỏ yêu thích`,
          type: 'favorite',
        });
      }
    }
  };

  const handleClick = () => {
    navigate(`/dish/${id}`);
  };

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
    } else {
      setImageLoading(false);
    }
  }, [imageUrl]);

  return (
    <div className="relative bg-gray-100 shadow-md rounded-lg overflow-hidden cursor-pointer aspect-[3/4]"
      style={{
        height: height ? height : '100vw',
        width: width ? `${width}px` : '100%',
      }}
    >
      {imageLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Spin />
        </div>
      )}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageError ? name : ''}
          className="w-full h-full object-cover"
          onClick={handleClick}
          style={{ display: imageLoading && !imageError ? 'none' : 'block' }}
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
        <div className="text-sm font-semibold"
          style={{
            color: '#FFFFFFCC',
            fontSize: fontTitle ? fontTitle : '0.875rem',
            lineClamp: 1,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {price ? price.toLocaleString('vi-VN') : 0}đ
        </div>

        <div className="text-white text-base font-semibold"
          style={{
            fontSize: fontName ? fontName : '1rem',
          }}
        >
          {name}
        </div>
      </div>
      {isShowLike && (
        <div className="absolute bottom-5 right-3 flex gap-2">
          {isFavorite ? (
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full backdrop-blur-sm bg-red-500"
            >
              <img src={LikeIcon} alt="Like" className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full backdrop-blur-sm bg-8am-light-grey-2"
            >
              <img src={LikeIcon} alt="Like" className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DishCard; 