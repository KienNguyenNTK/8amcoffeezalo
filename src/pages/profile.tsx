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
import { getUserID, getUserInfo } from "zmp-sdk";
import { notification } from "antd";
import { userService } from "../firebase/userService";
import { openChat, followOA } from 'zmp-sdk';
import { configService } from "../firebase/configService";
import axios from "axios";

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
    const [addressInfo, setAddressInfo] = useState<any>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    useEffect(() => {
        checkLocal();
        checkLogin();
        handleCheckFollowOA();
    }, []);

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
            //         duration: 2,
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
                placement: 'top'
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

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(0, Math.min(24, Number(e.target.value)))
        setHours(value)
    }

    const handleTargetHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Math.min(24, Number(e.target.value)))
        setTargetHours(value)
    }

    const handleCheckFollowOA = async () => {
        try {
            const configZalo = await configService.getConfig();

            // Refresh token
            const tokenResponse = await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
                app_id: import.meta.env.VITE_ZALO_APP_ID,
                grant_type: 'refresh_token',
                refresh_token: configZalo?.refresh_token_zalo
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'secret_key': import.meta.env.VITE_ZALO_SECRET_KEY
                }
            });

            await configService.saveZaloTokens(
                tokenResponse.data.access_token,
                tokenResponse.data.refresh_token,
                tokenResponse.data.expires_in
            );

            const newConfigZalo = await configService.getConfig();
            
            // Lấy ID người dùng hiện tại
            const userId = await getUserID();
            
            // Kiểm tra trạng thái follow của người dùng hiện tại
            const response = await axios.get(
                `https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${userId}"}`,
                {
                    headers: {
                        'access_token': newConfigZalo?.access_token_zalo,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('response', response.data.data);
            

            // Cập nhật state dựa trên kết quả
            setIsFollowed(response.data.data.user_is_follower);

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
                duration: 2,
                placement: 'top'
            });
        } catch (error) {
            console.error('Lỗi khi follow OA:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể theo dõi OA. Vui lòng thử lại sau.',
                duration: 2,
                placement: 'top'
            });
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
                    duration: 2,
                    placement: 'top'
                });
            } else {
                throw new Error(response.data.message);
            }

        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
                duration: 2,
                placement: 'top'
            });
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

            {!isFollowed ? (
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
            )}

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
                user && userRealInfo && (
                    <div className="w-full flex flex-col justify-center items-center bg-white rounded-lg mb-5">
                        <div className="flex items-center justify-center p-4">
                            <Barcode value={formatPhoneNumber(user.phoneNumber)} />
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
                    <div className="text-base font-semibold">App Rewards</div>
                </div>
            </div>

            <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-xl space-y-6 mt-4">
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
            </div>

        </div>
    );
};

export default Profile;