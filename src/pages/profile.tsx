import React from "react";
import { useRecoilValue } from "recoil";
import { userState } from "state";

const Profile = () => {

    return (
        <div className="flex flex-col items-center p-4 bg-white">
           
            <div className="w-full bg-white rounded-lg mb-6">
                <div className="flex items-center justify-center p-4 border-b">
                    <img
                        src="barcode-image-url"
                        alt="Barcode"
                        className="h-12"
                    />
                </div>
                <div className="text-center text-gray-600 py-2">
                    ABC-abc-1234
                </div>
            </div>

            <div className="w-full space-y-4">
                <div className="flex items-center p-4 bg-white rounded-lg">
                    <div className="mr-3">
                        <div className="w-6 h-6">📦</div>
                    </div>
                    <div>Đơn hàng</div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-lg">
                    <div className="mr-3">
                        <div className="w-6 h-6">⚙️</div>
                    </div>
                    <div>Cài đặt</div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-lg">
                    <div className="mr-3">
                        <div className="w-6 h-6">🎁</div>
                    </div>
                    <div>App Rewards</div>
                </div>
            </div>

            <div className="w-full mt-6">
                <div className="mb-4">Daily goal</div>
                <div className="text-gray-500 mb-4">Đọc nhiều, tích điểm nhiều</div>

                <div className="relative w-full h-32 flex items-center justify-center">
                    <div className="absolute text-center">
                        <div className="text-8am-black text-4xl font-bold">4</div>
                        <div className="text-8am-gray text-xs">trên 15 phút</div>
                    </div>
                    {/* Add circular progress indicator here */}
                </div>

                <button className="w-full text-center py-2 text-gray-600">
                    Điều chỉnh mục tiêu
                </button>

                <div className="flex justify-between mt-4">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 4 ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className="text-gray-500 text-center mt-4">
                    0 ngày hoàn thành mục tiêu
                </div>
            </div>
        </div>
    );
};

export default Profile; 