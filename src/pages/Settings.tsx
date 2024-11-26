import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { recentlyViewedService } from '../services/recentlyViewedService';
// import { notification } from '';

const Settings = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    const clearHistory = async () => {
        try {
            await recentlyViewedService.clearRecentlyViewed();
            // notification.success({
            //     message: 'Đã xóa lịch sử xem',
            //     duration: 2,
            //     placement: 'top'
            // });
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    useEffect(() => {
        const getUser = async () => {
            const currentUser = await authService.getAuthenticatedUser();

            const phone = currentUser?.phoneNumber;
            if (phone && phone.startsWith('84')) {
                currentUser.phoneNumber = `+84 ${phone.slice(2).padStart(10, '0')}`;
            }

            setUser(currentUser);
        };

        getUser();
    }, []);

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center justify-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: "absolute",
                        left: "20px",
                        top: "40px"
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

                <div className="text-8am-black text-xl font-bold mt-5"
                >
                    Cài đặt
                </div>
            </div>

            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Số điện thoại</div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{user?.phoneNumber}</span>
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="text-8am-black">Địa chỉ</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="text-8am-black">Tài khoản / Thẻ ngân hàng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>


            </div>


            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Cài đặt thông báo</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Hỗ trợ</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Tìm cửa hàng vật lý</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

            </div>

            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Điều khoản sử dụng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Chính sách bảo mật</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Chính sách trả hàng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

            </div>

            <div className="mt-6 space-y-2">
                {/* <button 
                    className="w-full py-3 bg-gray-100 rounded-lg text-8am-black"
                    onClick={clearHistory}
                >
                    Xóa lịch sử xem
                </button> */}
                <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                    Đánh giá
                </button>
                <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Settings; 