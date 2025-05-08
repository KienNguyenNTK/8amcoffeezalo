import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import PointPlus from '../public/images/pointplus.svg';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { userService } from '../firebase/userService';
import dayjs from 'dayjs';
import { getUserID } from 'zmp-sdk/apis';

const PointHistory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [userFirebase, setUserFirebase] = useState<any | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    useEffect(() => {
        const checkLocal = async () => {
            // const idUser = localStorage.getItem('idUser');
            const userId = await getUserID();

            const user = await userService.getUserByLocalId(userId);

            if (user) {
                setUserInfo(user);
            }
        };

        checkLocal();
    }, []);

    useEffect(() => {
        const getUser = async () => {
            // const currentUser = await authService.getAuthenticatedUser();
            setUser(userInfo);
        };
        getUser();
    }, [userInfo]);

    useEffect(() => {
        if (user)
            getUserFromFirebase();
    }, [user]);

    const getUserFromFirebase = async () => {
        if (user) {
            const currentUser = await userService.getUserByPhoneNumber(user.phoneNumber);
            setUserFirebase(currentUser);
        }
    }

    const dateFormat = (date: any) => {
        if (date) {
            if (date.seconds) {
                return dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY HH:mm:ss');
            }
            else if (date instanceof Date) {
                return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
            }
            else if (typeof date === 'string') {
                return dayjs(date, 'DD/MM/YYYY').format('DD/MM/YYYY HH:mm:ss');
            }
        }
    }

    const groupPointsByDate = (points: any[]) => {
        if (!points) return [];
        const groups = points.reduce((acc: any, item: any) => {
            const date: any = dateFormat(item.date)?.split(' ')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});

        return Object.entries(groups).map(([date, items]) => ({
            date,
            items
        }));
    };

    const groupedPoints = userFirebase?.lstPoint ? groupPointsByDate(userFirebase.lstPoint) : [];

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center justify-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        zIndex: 1000,
                        position: 'fixed',
                        top: '50px',
                        left: '20px'
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

                <div className="text-8am-black text-xl font-bold mt-5">
                    Lịch sử tích điểm
                </div>
            </div>

            <div className='flex flex-col gap-6'>
                {groupedPoints.map((group, groupIndex) => (
                    <div key={groupIndex} className='flex flex-col gap-4'>
                        <div className='text-gray-500 font-medium pl-2'>
                            {group.date}
                        </div>

                        {(group.items as any[]).map((item, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-4 border-b border-gray-100 bg-white rounded-md'
                                onClick={() => navigate(`/orders/${item.orderId}`)}
                            >
                                <div className='flex items-center gap-2'>
                                    <img src={PointPlus} alt="" className='w-8 h-8' />
                                    <div>
                                        <div className='text-8am-black font-semibold'>
                                            Tích điểm mua hàng
                                        </div>
                                        <div className='text-gray-400 text-sm'>
                                            {dateFormat(item.date)}
                                        </div>
                                    </div>
                                </div>
                                <div className='text-8am-black font-semibold ml-2'>
                                    +{item.point} điểm
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PointHistory;