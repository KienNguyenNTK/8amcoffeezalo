import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { recentlyViewedService } from '../services/recentlyViewedService';
import Point from '../public/images/point.svg'
import PointPlus from '../public/images/pointplus.svg'
import Voucher from '../public/images/voucher.svg'
// import { notification } from '';

const Rewards = () => {

    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const [lstPoint, setLstPoint] = useState([
        {
            id: 1,
            point: 23,
            description: 'Tích điểm mua hàng',
            date: '2021-09-01 12:00:00'
        },
        {
            id: 2,
            point: 23,
            description: 'Tích điểm mua hàng',
            date: '2021-09-01 12:00:00'
        },
        {
            id: 3,
            point: 23,
            description: 'Tích điểm mua hàng',
            date: '2021-09-02 12:00:00'
        },
        {
            id: 4,
            point: 23,
            description: 'Tích điểm mua hàng',
            date: '2021-09-02 12:00:00'
        }
    ])

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
                    App Rewards
                </div>
            </div>

            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center gap-4 p-4 border-b border-gray-100`}
                >
                    {/* <div className="text-8am-black">Số điện thoại</div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{user?.phoneNumber}</span>
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div> */}
                    <img src={Point} alt="" className='w-8 h-8' />
                    <div>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 500,
                                color: '#333333'
                            }}
                        >123 điểm</div>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#A3A3A3'
                            }}
                        >Xem lịch sử tích điểm</div>
                    </div>
                </div>

                <div 
                    className="flex items-center gap-4 p-4 border-b border-gray-100 cursor-pointer"
                    onClick={() => navigate('/voucher-history')}
                >
                    <img src={Voucher} alt="" className='w-8 h-8' />
                    <div>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 500,
                                color: '#333333'
                            }}
                        >1 voucher</div>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#A3A3A3'
                            }}
                        >Khám phá quà tặng thành viên</div>
                    </div>
                </div>
            </div>

            <div className='
                flex items-center justify-between
                 rounded-lg  mb-4
            '>
                <div className='
                    text-8am-black
                    font-semibold
                '>
                    Lịch sử tích điểm
                </div>
                <div
                    className='flex items-center text-orange-500 font-medium cursor-pointer'
                    onClick={() => navigate('/point-history')}
                >
                    Xem hết
                </div>
            </div>


            <div className='
                flex flex-col gap-4
            '>

                {
                    lstPoint.map((item, index) => (
                        <div
                            key={index}
                            className='
                            flex items-center justify-between
                            p-4 border-b border-gray-100 bg-white rounded-md
                        '
                        >
                            <div
                                className='
                                flex items-center gap-2 
                            '
                            >
                                <img src={PointPlus} alt="" className='w-8 h-8' />
                                <div>
                                    <div
                                        className='
                                    text-8am-black
                                    font-semibold
                                '
                                    >
                                        {item.description}
                                    </div>
                                    <div
                                        className='
                                    text-gray-400
                                    text-sm
                                '
                                    >
                                        {item.date}
                                    </div>
                                </div>
                            </div>

                            <div
                                className='
                                    text-8am-black
                                    font-semibold
                                    ml-2
                                '
                            >
                                +{item.point} điểm
                            </div>
                        </div>
                    ))
                }
            </div>

        </div>
    )
}

export default Rewards;


