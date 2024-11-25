import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";
import { useNavigate } from 'react-router-dom';
import AppRewardsIcon from "../public/images/app-reward.svg";
import CartIcon from "../public/images/cart-setting.svg";
import SettingIcon from "../public/images/setting-icon.svg";
import { authService } from "../services/authService";
import { User } from "../types/user";

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getUser = async () => {
            const currentUser = await authService.getAuthenticatedUser();
            setUser(currentUser);
        };
        getUser();
    }, []);

    return (
        <div className="flex flex-col items-center p-4">
            {/* User Profile Section */}
            <div className="flex flex-col items-center mb-6 mt-10">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl mb-3">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-xl font-semibold mb-2">
                    {user?.name || 'User name'}
                </div>
                <button className="px-4 py-1 border border-gray-300 rounded-lg text-sm">
                    Sửa hồ sơ
                </button>
            </div>

            {/* Barcode Section */}
            <div className="w-full bg-white rounded-lg mb-6">
                <div className="flex items-center justify-center p-4 border-b">
                    <Barcode value="ABC-abc-1234" />
                </div>
            </div>

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

                <div className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                    <div className="mr-3">
                        <div className="w-6 h-6">
                            <img src={AppRewardsIcon} alt="App Rewards" />
                        </div>
                    </div>
                    <div className="text-base font-semibold">App Rewards</div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 