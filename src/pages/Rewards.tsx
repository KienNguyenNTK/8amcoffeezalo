import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { recentlyViewedService } from '../services/recentlyViewedService';
import Point from '../public/images/point.svg'
import PointPlus from '../public/images/pointplus.svg'
import Voucher from '../public/images/voucher.svg'
import { userService } from '../firebase/userService';
import { orderService } from '../firebase/orderService';
import dayjs from 'dayjs';
// import { notification } from '';

const Rewards = () => {

    const [user, setUser] = useState<User | null>(null);
    const [userFirebase, setUserFirebase] = useState<any | null>(null);
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
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
    const [lstOrder, setLstOrder] = useState<any>([]);


    useEffect(() => {
        const getUser = async () => {
            const currentUser = await authService.getAuthenticatedUser();

            const phone = currentUser?.phoneNumber;

            if (phone && phone.startsWith('84')) {
                // currentUser.phoneNumber = `+84 ${phone.slice(2).padStart(10, '0')}`;
                setPhone(`+84 ${phone.slice(2).padStart(10, '0')}`);
            }

            setUser(currentUser);
        };

        getUser();
    }, []);


    useEffect(() => {
        if (user)
            getUserFromFirebase();
    }, [user]);

    // useEffect(() => {
    //     if (userFirebase && userFirebase.lstPoint) {
    //         let lstOrderTmp: any = [];

    //         userFirebase.lstPoint.forEach(async (item: any) => {
    //             const order = await orderService.getOrderById(item.orderId);
    //             console.log('order', order);
    //             lstOrderTmp.push(order);

    //         });

    //         console.log('lstOrderTmp', lstOrderTmp);


    //         if (lstOrderTmp.length > 0)
    //             setLstOrder(lstOrderTmp);
    //     }
    // }, [userFirebase]);

    useEffect(() => {
        console.log('lstOrder', lstOrder);

    }, [lstOrder]);

    const getUserFromFirebase = async () => {
        if (user) {
            const currentUser = await userService.getUserByPhoneNumber(user.phoneNumber);
            console.log('currentUser', currentUser);

            setUserFirebase(currentUser);
        }
    }

    const getOrderByIdOrder = async (orderId: string) => {
        const order = await orderService.getOrderById(orderId);
        // console.log('order', order);
        return order;
    }

    const dateFormat = (date: any) => {
        if (date) {
            // Kiểm tra nếu là Timestamp từ Firebase
            if (date.seconds) {
              return (dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY HH:mm:ss'));
            }
            // Kiểm tra nếu là Date object
            else if (date instanceof Date) {
              return (dayjs(date).format('DD/MM/YYYY HH:mm:ss'));
            }
            // Kiểm tra nếu là string
            else if (typeof date === 'string') {
              return (dayjs(date, 'DD/MM/YYYY').format('DD/MM/YYYY HH:mm:ss'));
            }
          }
    }


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
                        >{(userFirebase && userFirebase.lstPoint && userFirebase.lstPoint.length > 0) ? userFirebase.lstPoint.reduce((total: number, item: any) => total + item.point, 0) : 0} Điểm</div>
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
                        >2 voucher</div>
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
                    (userFirebase && userFirebase.lstPoint && userFirebase.lstPoint.length > 0) && userFirebase.lstPoint.map((item, index) => (
                        <div
                            key={index}
                            className='
                            flex items-center justify-between
                            p-4 border-b border-gray-100 bg-white rounded-md'
                            onClick={() => navigate(`/orders/${item.orderId}`)}
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
                                        Tích điểm mua hàng
                                    </div>
                                    <div
                                        className='
                                    text-gray-400
                                    text-sm
                                '
                                    >
                                        {dateFormat(item.date)}
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


