import { notification, Spin } from 'antd';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { favoriteService } from '../firebase/favoriteService';
import LikeIcon from "../public/images/like-icon.svg";
import ShareIcon from "../public/images/share-icon.svg";
import { authService } from '../services/authService';
import ShareBottleModal from './share-bottle-modal';
import { notificationService } from '../firebase/notificationService';

interface BottledDrinkCardProps {
    imageUrl: string;
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
}

const BottledDrinkCard: React.FunctionComponent<BottledDrinkCardProps> = ({
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
}) => {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [imageUrlReal, setImageUrlReal] = useState('')
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        checkFavoriteStatus();
        getBottledDrinkById();
    }, []);


    useEffect(() => {
        if (item && (item.images || item.driveImages)) {
            const newImageUrl = item.images
                ? item.images[0]
                : `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;

            // Preload ảnh
            const img = new Image();
            img.src = newImageUrl;
            img.onload = () => {
                setImageUrlReal(newImageUrl);
                setImageLoading(false);
            };
            img.onerror = () => {
                setImageError(true);
                setImageLoading(false);
            };
        }
    }, [item]);

    const getBottledDrinkById = async () => {
        const drink = await bottledDrinkService.getBottledDrinkById(id);
        setItem(drink);
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

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

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

            //     if (onLoginSuccess) {
            //         onLoginSuccess();
            //     }
            //     return;
            // }

            // const authenticatedUser = await authService.getAuthenticatedUser();
            // if (!authenticatedUser) {
            //     return;
            // }

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

                    notificationService.addNotification({
                        userId: userInfo.id,
                        title: 'Yêu thích nước uống',
                        content: `${name} đã được yêu thích`,
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

                    notificationService.addNotification({
                        userId: userInfo.id,
                        title: 'Bỏ yêu thích nước uống',
                        content: `${name} đã được bỏ yêu thích`,
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

    const handleClick = () => {
        navigate(`/bottled-drink/${id}`);
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
            {imageLoading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Spin />
                </div>
            )}
            {imageUrlReal && (
                <img
                    src={imageUrlReal}
                    alt={imageError ? name : ''}
                    className="w-full h-full object-cover"
                    onClick={handleClick}
                    style={{ display: imageLoading && !imageError ? 'none' : 'block' }}
                />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
                <div className=" text-sm font-semibold"
                    style={{
                        color: '#FFFFFFCC',
                        fontSize: fontTitle ? fontTitle : '0.875rem',
                    }}
                >
                    {item?.origin.join(', ')}
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
                    {/* <div className="p-2 rounded-full backdrop-blur-sm bg-8am-light-grey-2" onClick={handleShareClick}>
                        <img src={ShareIcon} alt="Share" className="w-5 h-5" />
                    </div> */}

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
            {/* {item && (
                <ShareBottleModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    item={item}
                />
            )} */}
        </div>
    );
};

export default BottledDrinkCard;