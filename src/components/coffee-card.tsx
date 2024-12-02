import { notification } from 'antd';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../firebase/favoriteService';
import LikeIcon from "../public/images/like-icon.svg";
import ShareIcon from "../public/images/share-icon.svg";
import { authService } from '../services/authService';
import ShareModal from './share-modal';
import { coffeeService } from '../firebase/coffeeService';

interface CoffeeCardProps {
  imageUrl: string;
  name: string;
  id: string;
  isShowLike?: boolean;
  width?: any;
  height?: any;
  fontTitle?:any;
  fontName?:any;
  isChangeFavorite?: (isFavorite: boolean) => void;
  onLoginSuccess?: () => void;
}

const CoffeeCard: React.FunctionComponent<CoffeeCardProps> = ({
  imageUrl,
  name,
  id,
  isShowLike = true,
  width = '',
  height = '',
  fontTitle = '',
  fontName = '',
  onLoginSuccess,
}) => {
  const navigate = useNavigate();
  // const { currentUser } = useFirebase();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [item, setItem] = useState<any>(null);
  useEffect(() => {
    checkFavoriteStatus();
    getCoffeeById();
  }, []);

  useEffect(() => {
    console.log('isFavorite', isFavorite);
  }, [isFavorite]);

  const getCoffeeById = async () => {
    const coffee = await coffeeService.getCoffeeById(id);
    setItem(coffee);
  };

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

    // localStorage.removeItem('recentlyViewedCoffees');

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

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  return (
    <div className="relative bg-gray-100 shadow-md rounded-lg overflow-hidden cursor-pointer aspect-[3/4]"
      style={{
        height: height ? height : '100vw',
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
        onClick={handleClick}
      // onLoad={() => setImageLoading(false)}
      // style={{ display: imageLoading ? 'none' : 'block' }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
        <div className=" text-sm font-semibold"
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
          {item?.region.join(', ')}
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

          <div className="p-2 rounded-full backdrop-blur-sm bg-8am-light-grey-2" onClick={handleShareClick}>
            <img src={ShareIcon} alt="Share" className="w-5 h-5" />
          </div>

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
      {item && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          item={item}
        />
      )}
    </div>
  );
};

export default CoffeeCard; 