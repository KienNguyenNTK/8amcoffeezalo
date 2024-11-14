import { notification } from 'antd';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../firebase/favoriteService';
import LikeIcon from "../public/images/like-icon.svg";
import { authService } from '../services/authService';

interface CoffeeCardProps {
  imageUrl: string;
  name: string;
  id: string;
  isShowLike?: boolean;
  width?: any;
  isChangeFavorite?: (isFavorite: boolean) => void;
  onLoginSuccess?: () => void;
}

const CoffeeCard: React.FunctionComponent<CoffeeCardProps> = ({
  imageUrl,
  name,
  id,
  isShowLike = true,
  width = '',
  onLoginSuccess,
}) => {
  const navigate = useNavigate();
  // const { currentUser } = useFirebase();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  useEffect(() => {
    console.log('isFavorite', isFavorite);
  }, [isFavorite]);

  const checkFavoriteStatus = async () => {
    try {
      const authenticatedUser = await authService.getAuthenticatedUser();
      console.log('authenticatedUser 32', authenticatedUser);
      if (authenticatedUser && id) {
        const favorite = await favoriteService.getFavorite(authenticatedUser.id, id);
        setIsFavorite(!!favorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      console.log('authService.isAuthenticated()', await authService.isAuthenticated());
      if (!await authService.isAuthenticated()) {

        await authService.authorizeLogin();

        if (onLoginSuccess) {
          onLoginSuccess();
        }

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

  const handleClick = () => {
    navigate(`/coffee/${id}`);
  };

  return (
    <div onClick={handleClick} className="relative bg-gray-100 shadow-md rounded-lg overflow-hidden cursor-pointer aspect-[3/4]"
      style={{
        height: '72vw',
        width: width ? `${width}px` : '100%',
      }}
    >
      {/* {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Spin />
        </div>
      )} */}
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        // onLoad={() => setImageLoading(false)}
        // style={{ display: imageLoading ? 'none' : 'block' }}
      />
      {isShowLike && (
        <div className="absolute bottom-5 right-3 flex gap-2">
          {
            isFavorite ? (
              <button
                onClick={handleFavoriteClick}
                className="p-2 rounded-full backdrop-blur-sm  bg-red-500"
              >
                <img src={LikeIcon} alt="Like" className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleFavoriteClick}
                className="p-2 rounded-full backdrop-blur-sm  bg-8am-light-grey-2"
              >
                <img src={LikeIcon} alt="Like" className="w-5 h-5" />
              </button>
            )
          }
        </div>
      )}
    </div>
  );
};

export default CoffeeCard; 