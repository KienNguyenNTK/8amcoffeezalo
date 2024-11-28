
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const VoucherHistory = () => {
    const navigate = useNavigate();

    const vouchers = [
        {
            id: 1,
            title: 'Giảm 20K đơn từ 100K',
            expiry: '30/12/2023',
            code: 'COFFEE20K',
            description: 'Áp dụng cho đơn hàng từ 100.000đ',
            status: 'active'
        },
        {
            id: 2,
            title: 'Freeship đơn từ 50K',
            expiry: '31/12/2023',
            code: 'FREESHIP50K',
            description: 'Áp dụng cho đơn hàng từ 50.000đ',
            status: 'active'
        }
    ];

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
                    Voucher của bạn
                </div>
            </div>

            <div className='flex flex-col gap-4'>
                {vouchers.map((voucher) => (
                    <div key={voucher.id} className='bg-white rounded-lg p-4 border border-gray-100'>
                        <div className='flex items-center gap-3 border-b border-gray-100 pb-3'>
                            {/* <img src={CoffeeIcon} alt="" className='w-10 h-10' /> */}
                            <div>
                                <div className='text-8am-black font-semibold'>{voucher.title}</div>
                                <div className='text-gray-400 text-sm'>HSD: {voucher.expiry}</div>
                            </div>
                        </div>
                        <div className='pt-3'>
                            <div className='text-gray-500 text-sm'>{voucher.description}</div>
                            <div className='mt-2 flex justify-between items-center'>
                                <div className='text-gray-400 text-sm'>Mã: {voucher.code}</div>
                                <button className='px-4 py-2 bg-orange-500 text-white rounded-lg text-sm'>
                                    Sử dụng ngay
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VoucherHistory;