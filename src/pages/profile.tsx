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
import { getUserInfo } from "zmp-sdk";
import { notification } from "antd";

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const navigate = useNavigate();
    const [hours, setHours] = useState(4)
    const [targetHours, setTargetHours] = useState(15)
    const progress = Math.min(hours / targetHours, 1)
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLogin();
    }, []);


    const checkLogin = async () => {
        try {
            const user = await authService.getAuthenticatedUser();
            if (!user) {

                await authService.authorizeLogin();

                notification.success({
                    message: 'Lấy thông tin thành công',
                    description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
                    duration: 2,
                    placement: 'top'
                });

                checkLogin();

                // notification.warning({
                //     message: 'Yêu cầu đăng nhập',
                //     description: 'Vui lòng đăng nhập để xem giỏ hàng',
                //     duration: 3,
                //     placement: 'top'
                // });
                return;
            }

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
                description: 'Không thể lấy thông tin tài khoản',
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
                <div className="text-xl font-semibold mb-2">
                    {user?.name || 'User name'}
                </div>
                {/* <button className="px-4 py-1 border border-gray-300 rounded-lg text-sm">
                    Sửa hồ sơ
                </button> 
                        */}
            </div>


            {/* Barcode Section */}
            {
                user && (
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