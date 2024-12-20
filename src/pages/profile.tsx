import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";
import { useNavigate } from 'react-router-dom';
import AppRewardsIcon from "../public/images/app-reward.svg";
import CartIcon from "../public/images/cart-setting.svg";
import SettingIcon from "../public/images/setting-icon.svg";
import { authService } from "../services/authService";
import { User } from "../types/user";
import Logo from "../public/images/logo.png"
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getAccessToken, authorize, getPhoneNumber, getUserID, getUserInfo } from "zmp-sdk";
import { notification } from "antd";
import { userService } from "../firebase/userService";
import { openChat, followOA } from 'zmp-sdk';
import { configService } from "../firebase/configService";
import ImageMember from "../public/images/image-bg.png"
import axios from "axios";
import { addressService } from "../services/addressService";

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const navigate = useNavigate();
    const [hours, setHours] = useState(4)
    const [targetHours, setTargetHours] = useState(15)
    const progress = Math.min(hours / targetHours, 1)
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userRealInfo, setUserRealInfo] = useState<any>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    useEffect(() => {
        checkLocal();
        checkLogin();
        handleCheckFollowOA();
    }, []);

    useEffect(() => {
        if (userRealInfo) {
            handleCheckFollowOA();
        }
    }, [userRealInfo]);

    const checkLocal = async () => {
        try {
            setLoading(true);
            // const idUser = localStorage.getItem('idUser');
            const userId = await getUserID();

            const user = await userService.getUserByLocalId(userId);

            if (user) {
                setUserRealInfo(user);
            } else {
                console.log('Không tìm thấy thông tin người dùng');
                setUserRealInfo(null);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            setUserRealInfo(null);
        } finally {
            setLoading(false);
        }
    };


    const checkLogin = async () => {
        try {
            // const user = await authService.getAuthenticatedUser();
            // if (!user) {

            //     await authService.authorizeLogin();

            //     notification.success({
            //         message: 'Lấy thông tin thành công',
            //         description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
            //         duration: 1.5,
            //         placement: 'top'
            //     });

            //     checkLogin();

            //     // notification.warning({
            //     //     message: 'Yêu cầu đăng nhập',
            //     //     description: 'Vui lòng đăng nhập để xem giỏ hàng',
            //     //     duration: 3,
            //     //     placement: 'top'
            //     // });
            //     return;
            // }

            const { userInfo } = await getUserInfo({
                autoRequestPermission: true,
            });
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            const info = localStorage.getItem('userInfo');

            if (info) {
                setUserInfo(JSON.parse(info));
            }

            if (!user) {
                return;
            }
            setUser(user);
        } catch (error) {
            console.error('Error loading cart items:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy thông tin tài khoản do không có thông tin người dùng',
                duration: 3,
                placement: 'top',
                closable: false
            });

            navigate('/');
        } finally {
            setLoading(false);
        }
    }

    const formatPhoneNumber = (phone: string) => {
        if (phone.startsWith('84')) {
            return '0' + phone.slice(2);
        }
        return phone;
    };

    const handleCheckFollowOA = async () => {
        try {
            // Cập nhật state dựa trên kết quả
            if (userRealInfo) {
                setIsFollowed(userRealInfo.isFollowed);
            }

        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái follow:', error);
        }
    };

    const handleFollowOA = async () => {
        try {
            await followOA({
                id: '2315491439411829194'
            });
            setIsFollowed(true);
            notification.success({
                message: 'Thành công',
                description: 'Cảm ơn bạn đã quan tâm OA của chúng tôi!',
                duration: 1.5,
                placement: 'top',
                closable: false
            });

            await userService.updateUser(userRealInfo.id, { isFollowed: true });

        } catch (error) {
            console.error('Lỗi khi follow OA:', error);
        }
    };

    const sendMessageToUser = async () => {
        try {
            const configZalo = await configService.getConfig();

            const messageData = {
                recipient: {
                    user_id: "2829393805572131041"
                },
                message: {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "promotion",
                            "elements": [
                                {
                                    "attachment_id": "aERC3A0iYGgQxim8fYIK6fxzsXkaFfq7ZFRB3RCyZH6RyziRis3RNydebK3iSPCJX_cJ3k1nW1EQufjN_pUL1f6Ypq3rTef5nxp6H_HnXKFDiyD5y762HS-baqRpQe5FdA376lTfq1sRyPr8ypd74ecbaLyA-tGmuJ-97W",
                                    "type": "banner"
                                },
                                {
                                    "type": "header",
                                    "content": "💥💥Ưu đãi thành viên Platinum💥💥"
                                },
                                {
                                    "type": "text",
                                    "align": "left",
                                    "content": "Ưu đãi dành riêng cho khách hàng Nguyen Van A hạng thẻ Platinum<br>Voucher trị giá 150$"
                                },
                                {
                                    "type": "table",
                                    "content": [
                                        {
                                            "value": "VC09279222",
                                            "key": "Voucher"
                                        },
                                        {
                                            "value": "30/12/2023",
                                            "key": "Hạn sử dụng"
                                        }
                                    ]
                                },
                                {
                                    "type": "text",
                                    "align": "center",
                                    "content": "Áp dụng tất cả cửa hàng trên toàn quốc"
                                }
                            ],
                            "buttons": [
                                {
                                    "title": "Tham khảo chương trình",
                                    "image_icon": "",
                                    "type": "oa.open.url",
                                    "payload": {
                                        "url": "https://oa.zalo.me/home"
                                    }
                                },
                                {
                                    "title": "Liên hệ chăm sóc viên",
                                    "image_icon": "aeqg9SYn3nIUYYeWohGI1fYRF3V9f0GHceig8Ckq4WQVcpmWb-9SL8JLPt-6gX0QbTCfSuQv40UEst1imAm53CwFPsQ1jq9MsOnlQe6rIrZOYcrlWBTAKy_UQsV9vnfGozCuOvFfIbN5rcXddFKM4sSYVM0D50I9eWy3",
                                    "type": "oa.query.hide",
                                    "payload": "#tuvan"

                                }
                            ]
                        }
                    }
                }
            };

            const response = await axios.post(
                'https://openapi.zalo.me/v3.0/oa/message/promotion',
                messageData,
                {
                    headers: {
                        'access_token': configZalo?.access_token_zalo,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.error === 0) {
                notification.success({
                    message: 'Thành công',
                    description: 'Đã gửi tin nhắn thành công!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            } else {
                throw new Error(response.data.message);
            }

        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
                duration: 1.5,
                placement: 'top',
                closable: false
            });
        }
    };

    const handleAuthorize = async () => {
        try {
            // 1. Authorize với Zalo
            await authorize({
                scopes: ['scope.userInfo', 'scope.userPhonenumber']
            });

            // 2. Lấy thông tin token phone number và user info
            const [phoneResult, userInfoResult, accessToken] = await Promise.all([
                getPhoneNumber(),
                getUserInfo(),
                getAccessToken()
            ]);

            // 3. Lấy số điện thoại từ API Zalo
            const response = await axios.get('https://graph.zalo.me/v2.0/me/info', {
                headers: {
                    'access_token': accessToken,
                    'code': phoneResult.token,
                    'secret_key': 'g8RUo6XKj3V7RoSuEom1'
                }
            });

            const phoneNumber = response.data.data.number;
            const { userInfo } = userInfoResult;

            console.log('phoneNumber: ', phoneNumber);
            console.log('userInfo: ', userInfo);

            // 4. Lưu thông tin vào database
            await handleUserData(phoneNumber, userInfo);

            // 5. Lưu thông tin user vào localStorage
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 6. Chuyển hướng sau khi hoàn tất
            checkLocal();

        } catch (error) {
            console.error('Lỗi xác thực:', error);
            notification.error({
                message: 'Có lỗi xảy ra trong quá trình xác thực!',
                duration: 3,
                placement: 'top',
                closable: false 
            });
            checkLocal();
        }
    };

    const handleUserData = async (phoneNumber: string, userInfo: any) => {
        const userId = await getUserID();
        const user = await userService.getUserByLocalId(userId);

        if (user) {
            try {
                await userService.updateUserByLocalId(userId, {
                    phoneNumber,
                    name: userInfo.name || 'Người dùng',
                    password: userId,
                    avatar: userInfo.avatar
                });

                const currentAddress = addressService.getAddress() || {};
                addressService.updateAddress({
                    ...currentAddress,
                    phone: phoneNumber
                });

                notification.success({
                    message: 'Cập nhật thông tin thành công!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            } catch (error) {
                console.error('Không thể cập nhật user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi cập nhật thông tin!',
                    duration: 3,
                    placement: 'top',
                    closable: false
                });
            }
        } else {
            const newUser = {
                localId: userId,
                name: userInfo.name || 'Người dùng',
                phoneNumber: phoneNumber,
                password: userId,
                avatar: userInfo.avatar
            };

            try {
                await userService.createUser(newUser);
                
                const currentAddress = addressService.getAddress() || {};
                addressService.updateAddress({
                    ...currentAddress,
                    phone: phoneNumber
                });

                notification.success({
                    message: 'Đăng ký thành công!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            } catch (error) {
                console.error('Không thể tạo user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi tạo tài khoản!',
                    duration: 3,
                    placement: 'top',
                    closable: false
                });
            }
        }
    };

    // Thêm hàm kiểm tra điều kiện hội viên
    const isMember = () => {
        return userRealInfo?.phoneNumber && isFollowed;
    };

    // Thêm hàm xử lý đăng ký hội viên
    const handleJoinMember = async () => {
        if (!isFollowed) {
            try {
                await handleFollowOA();
            } catch (error) {
                console.error('Lỗi khi quan tâm OA:', error);
                return;
            }
        }
        
        if (!userRealInfo?.phoneNumber) {
            handleAuthorize();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        )
    }

    return (

        <div className="flex flex-col items-center p-4"
            style={{
                paddingBottom: 70
            }}
        >
            {/* User Profile Section */}
            <div className="flex flex-col items-center mb-6 mt-10">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl mb-3">
                    <img src={userInfo?.avatar ? userInfo.avatar : Logo} alt="Logo" className="rounded-full" />
                </div>
                {
                    userRealInfo?.name &&
                    <div className="text-xl font-semibold mb-2">
                        {userRealInfo.name}
                    </div>
                }
                {/* <button className="px-4 py-1 border border-gray-300 rounded-lg text-sm">
                    Sửa hồ sơ
                </button> 
                        */}
            </div>

            {/* {!isFollowed ? (
                <div className="w-full mb-5 bg-white rounded-lg p-4">

                    <div className="text-center text-sm text-gray-500 mb-2">
                        Quan tâm OA để nhận các đặc quyền ưu đãi
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={Logo} alt="Logo" className="w-10 h-10 rounded-lg" />
                            <div className="font-medium">8am Coffee</div>
                        </div>
                        <button
                            onClick={handleFollowOA}
                            className="px-2 py-2 bg-[#fc7500] text-white rounded-lg font-medium"
                        >
                            Quan tâm
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full mb-5 bg-white rounded-lg p-4">
                    <div className="text-center text-sm text-gray-500 mb-2">
                        Bạn đã quan tâm OA của chúng tôi
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={Logo} alt="Logo" className="w-10 h-10 rounded-lg" />
                            <div className="font-medium">8am Coffee</div>
                        </div>
                        <div className="px-2 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center gap-1">
                            Đã quan tâm
                        </div>
                    </div>
                </div>
            )} */}

            {/* <div className="w-full mb-5">
                <button
                    onClick={sendMessageToUser}
                    className="w-full py-3 bg-[#2196f3] text-white rounded-lg font-semibold flex items-center justify-center gap-2 mt-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Gửi tin nhắn
                </button>
            </div> */}

            {/* Barcode Section */}
            {
                (userRealInfo) && (
                    <div
                        className={`w-full flex flex-col justify-center items-center bg-white rounded-lg mb-5 relative ${!isFollowed ? 'cursor-pointer' : ''}`}
                        onClick={() => !isFollowed && handleFollowOA()}
                    >
                        {/* Overlay khi chưa follow */}
                        {!isFollowed && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                                <p className="text-white text-center mb-2">Quan tâm mini app để xem mã thành viên</p>
                                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                                    Quan tâm ngay
                                </button>
                            </div>
                        )}

                        {/* Nội dung mã vạch */}

                        <img src={Logo} alt="Logo" className="w-10 h-10 rounded-lg mt-2" />
                        <div className={`flex items-center p-4 justify-center w-80 pt-2 ${isFollowed ? 'opacity-100' : 'opacity-10'}`}>
                            {
                                isFollowed ? (
                                    <Barcode
                                        value={formatPhoneNumber(userRealInfo.phoneNumber) || userRealInfo?.localId}
                                        renderer="svg"
                                    />  
                                ) : (
                                    <Barcode
                                        value={'xxxx-xxxx'}
                                        renderer="svg"
                                    />
                                )
                            }
                        </div>
                    </div>
                )
            }

            {/* Menu Items */}
            <div className="w-full space-y-4">
                <div className="flex items-center p-6 bg-white rounded-lg shadow-sm" onClick={() => navigate('/orders')}>
                    <div className="mr-3">
                        <div className="w-6 h-6">
                            <img src={CartIcon} alt="Cart" />
                        </div>
                    </div>
                    <div className="text-base font-semibold">Đơn hàng</div>
                </div>

                <div className="flex items-center p-6 bg-white rounded-lg shadow-sm" onClick={() => navigate('/settings')}>
                    <div className="mr-3">
                        <div className="w-6 h-6">
                            <img src={SettingIcon} alt="Setting" />
                        </div>
                    </div>
                    <div className="text-base font-semibold">Cài đặt</div>
                </div>

                <div className="flex items-center p-6 bg-white rounded-lg shadow-sm" onClick={() => navigate('/rewards')}>
                    <div className="mr-3">
                        <div className="w-6 h-6">
                            <img src={AppRewardsIcon} alt="App Rewards" />
                        </div>
                    </div>
                    <div className="text-base font-semibold">Khách hàng thân thiết</div>
                </div>
            </div>

            {/* Membership Section */}
            <div className="w-full max-w-sm mx-auto p-6 rounded-xl space-y-4 mt-4"
                style={{
                    backgroundImage: `url(${ImageMember})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="flex justify-center items-center gap-2 mb-2">
                    <img src={Logo} alt="Member" className="w-10 h-10 rounded-lg" />
                    <span className="font-semibold text-lg">Hội viên</span>
                </div>

                {isMember() ? (
                    <>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-600 mb-2">
                                Bạn đã là hội viên
                            </div>
                            <p className="text-sm text-gray-600">
                                Số điện thoại: {formatPhoneNumber(userRealInfo.phoneNumber)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Cảm ơn bạn đã là thành viên của chúng tôi
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>Tham gia để nhận ưu đãi, trải nghiệm các loại cà phê mới, có thể hủy bất cứ lúc nào</p>
                            {!isFollowed && (
                                <p className="text-orange-500">• Bạn cần quan tâm mini app</p>
                            )}
                            {!userRealInfo?.phoneNumber && (
                                <p className="text-orange-500">• Bạn cần cung cấp số điện thoại</p>
                            )}
                        </div>

                        <button 
                            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition duration-200"
                            onClick={handleJoinMember}
                        >
                            {!isFollowed ? 'Quan tâm và gia nhập hội viên' : 'Gia nhập hội viên miễn phí'}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Thông tin chi tiết sẽ được cập nhật sau
                        </p>
                    </>
                )}
            </div>

            {/* <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-xl space-y-6 mt-4">
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-semibold">Daily goal</h2>
                    <p className="text-sm text-muted-foreground">Uống nhiều, tích điểm nhiều</p>
                </div>

                <div className="mx-auto"
                    style={{
                        position: 'relative',
                        width: 150,
                        height: 150
                    }}
                >
                    <CircularProgressbar
                        value={progress * 100}
                        text={`${hours}`}
                        strokeWidth={6}
                        styles={buildStyles({
                            textSize: '24px',
                            pathColor: '#fc7500',
                            trailColor: '#f9741627',
                            textColor: '#000000',
                        })}
                    />
                    <div className="text-center mt-2"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            top: '65%',
                            transform: 'translateY(-50%)'
                        }}
                    >
                        <span className="text-sm text-muted-foreground"
                            style={{
                                color: '#A3A3A3'
                            }}
                        >trên {targetHours} cốc</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    <span>0 ngày hoàn thành mục tiêu</span>
                </div>
            </div> */}

        </div>
    );
};

export default Profile;