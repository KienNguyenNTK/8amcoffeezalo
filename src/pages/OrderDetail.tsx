import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order } from '../types/order';
import { orderService } from '../firebase/orderService';
import { FaArrowLeft } from 'react-icons/fa';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            const orderData = await orderService.getOrderById(orderId);
            console.log(orderData);

            setOrder(orderData);
        };
        fetchOrder();
    }, [orderId]);

    const getDate = (date: any) => {
        if (date?.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Đang xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Giao hàng thành công';
            default:
                return status;
        }
    };

    if (!order) {
        return <div>Loading...</div>;
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
                <div className="text-8am-black text-xl font-bold mt-5">
                    Chi tiết đơn hàng
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 gap-2 flex flex-col">
                <div className="flex justify-between">
                    <div className="text-sm font-medium ">Mã đơn hàng:</div>
                    <div className="font-medium">{orderId}</div>
                </div>

                <div className="flex justify-between">
                    <div className="text-sm font-medium ">Thời gian đặt hàng:</div>
                    <div className="font-medium">
                        {getDate(order.createdAt)}
                    </div>
                </div>

                <div className="flex justify-between">
                    <div className="text-sm font-medium ">Trạng thái:</div>
                    <div className="text-8am-orange font-medium">
                        {getStatusText(order.status)}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
                <div className="text-sm mb-2 font-medium">Địa chỉ người nhận:</div>
                <div className="font-medium ">{order.shippingInfo.fullName}</div>
                <div className="text-sm text-gray-500">{order.shippingInfo.phone}</div>
                <div className="text-sm text-gray-500">
                    {order.shippingInfo.address}, {order.shippingInfo.ward},
                    {order.shippingInfo.district}, {order.shippingInfo.province}
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
                {order.items.map((item, index) => (
                    <div key={item.id} className="flex mb-4 border-b pb-4"
                        style={{
                            borderBottom: index === order.items.length - 1 ? "none" : "1px solid #E0E0E0",
                            paddingBottom: index === order.items.length - 1 ? "0" : "16px"
                        }}
                    >
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-24 object-cover rounded-md"
                        />
                        <div className="ml-3 flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-gray-500 text-sm">
                                {item.weight}g - {item.grindType === 'whole' ? 'Nguyên hạt' : 'Xay sẵn'}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span>Số lượng {item.quantity}</span>
                                <span className="font-medium">
                                    {item.price.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 ">
                <div className="text-sm mb-2 font-medium">Hình thức thanh toán</div>
                <div className="text-gray-500">
                    {order.paymentMethod === 'COD' && 'Thanh toán bằng tiền mặt khi nhận hàng'}
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 ">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Tạm tính</span>
                    <span className="font-medium">{order.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Phí vận chuyển</span>
                    <span className="font-medium">25.000đ</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Khuyến mãi tích điểm</span>
                    <span className="text-green-500 font-medium">-10.000đ</span>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t">
                    <span className="font-bold">Thành tiền</span>
                    <span className="font-bold text-8am-orange">
                        {(order.totalAmount + 25000 - 10000).toLocaleString()}đ
                    </span>
                </div>
            </div>

            <button
                className="w-full bg-8am-orange text-white py-3 rounded-lg font-medium"
                onClick={() => {/* Handle reorder */ }}
            >
                Mua lại
            </button>
        </div>
    );
};

export default OrderDetail; 