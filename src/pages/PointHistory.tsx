import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import PointPlus from '../public/images/pointplus.svg';

const PointHistory = () => {
    const navigate = useNavigate();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const lstPoint = [
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
            date: '2021-09-01 13:00:00'
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
        },
    ];

    // Group points by date
    const groupPointsByDate = (points: any[]) => {
        const groups = points.reduce((acc: any, item: any) => {
            const date = item.date.split(' ')[0]; // Get just the date part
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

    const groupedPoints = groupPointsByDate(lstPoint);

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

                <div className="text-8am-black text-xl font-bold mt-5">
                    Lịch sử tích điểm
                </div>
            </div>

            <div className='flex flex-col gap-6'>
                {groupedPoints.map((group, groupIndex) => (
                    <div key={groupIndex} className='flex flex-col gap-4'>
                        <div className='text-gray-500 font-medium pl-2'>
                            {formatDate(group.date)}
                        </div>
                        
                        {(group.items as any[]).map((item, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-4 border-b border-gray-100 bg-white rounded-md'
                            >
                                <div className='flex items-center gap-2'>
                                    <img src={PointPlus} alt="" className='w-8 h-8' />
                                    <div>
                                        <div className='text-8am-black font-semibold'>
                                            {item.description}
                                        </div>
                                        <div className='text-gray-400 text-sm'>
                                            {item.date} {/* Show only time */}
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