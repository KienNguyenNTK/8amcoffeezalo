import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order } from '../types/order';
import { orderService } from '../firebase/orderService';
import { FaArrowLeft } from 'react-icons/fa';
import { Payment } from 'zmp-sdk';
import CryptoJS from 'crypto-js';
import { events, EventName } from "zmp-sdk/apis";
import { notification } from 'antd';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [appTransID, setAppTransID] = useState<string | null>(null);

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
            case 'waiting':
                return 'Đang xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Giao hàng thành công';
            case 'paid':
                return 'Đã thanh toán';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const calculateOrderMAC = (orderData: any, privateKey: string) => {
        try {
            const params = {
                amount: orderData.amount,
                desc: orderData.desc,
                item: orderData.item,
                method: orderData.method
            };

            const dataMac = Object.keys(params)
                .sort()
                .map(key =>
                    `${key}=${typeof params[key] === 'object'
                        ? JSON.stringify(params[key])
                        : params[key]}`
                )
                .join('&');

            const mac = CryptoJS.HmacSHA256(dataMac, privateKey).toString();
            return mac;
        } catch (error) {
            console.error('Error calculating MAC:', error);
            throw error;
        }
    };

    const handlePayAgain = async () => {
        if (!order) return;

        setLoading(true);
        try {
            const privateKey = '6b81f2bf5493e12ff2051fe5e5efc2c6';

            if (!privateKey) {
                throw new Error('Private key is not defined');
            }

            const orderData = {
                desc: `${order.shippingInfo.fullName} - ${order.shippingInfo.phone} thanh toán lại cho đơn hàng ${orderId}`,
                item: order.items.map((item: any) => ({
                    id: item.id,
                    amount: item.price * item.quantity
                })),
                amount: order.totalAmount,
                // amount: 5000,
                method: JSON.stringify(
                    {
                        id: 'BANK',
                        isCustom: false
                    }
                )
            };

            const mac = calculateOrderMAC(orderData, privateKey);
            const orderDataWithMac = {
                ...orderData,
                mac
            };

            Payment.createOrder({
                ...orderDataWithMac,
                success: async (data) => {
                    console.log('Payment initiated:', data);

                    if (!appTransID) {
                        events.on(EventName.OnDataCallback, (resp) => {
                            const { eventType, data } = resp;
                            if (eventType === "PAY_BY_BANK") {
                                if (data.appTransID) {
                                    Payment.checkTransaction({
                                        data,
                                        success: async (rs) => {
                                            if (rs.resultCode === 0) {

                                                console.log('rs: ', rs);

                                                notification.success({
                                                    message: 'Thay đổi thông tin đơn hàng',
                                                    description: 'Nếu bạn đã thanh toán thành công, vui lòng liên hệ với chúng tôi hoặc đợi đơn hàng được xác nhận',
                                                    duration: 5,
                                                    placement: 'top',
                                                    closable: false,
                                                });

                                                setAppTransID(rs.transId);

                                                setTimeout(() => {
                                                    events.off(EventName.OnDataCallback);
                                                }, 1000);

                                                // setTimeout(() => {
                                                //     window.location.reload();
                                                // }, 2000);

                                                navigate('/profile');

                                            }
                                        },
                                        fail: (err) => {
                                            console.error('Error checking transaction:', err);
                                            notification.error({
                                                message: 'Lỗi',
                                                description: 'Có lỗi xảy ra khi kiểm tra giao dịch',
                                                duration: 3,
                                                placement: 'top',
                                            });
                                        },
                                    });
                                }
                            }
                        });
                    }

                    events.on(EventName.AppClose, (data) => {

                        setLoading(false);
                        console.log('data app close: ', data);
                        console.log('resultCode app close: ', data?.resultCode);



                    });

                    events.on(EventName.WebviewClosed, (data) => {

                        setLoading(false);
                        console.log('data webview closed: ', data);
                        console.log('resultCode webview closed: ', data?.resultCode);
                    });
                },
                fail: (error) => {
                    console.error('Failed to create payment:', error);
                    notification.error({
                        message: 'Lỗi',
                        description: 'Không thể tạo giao dịch thanh toán',
                        duration: 3,
                        placement: 'top',
                    });
                }
            });
        } catch (error) {
            console.error('Error in handlePayAgain:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Có lỗi xảy ra khi xử lý thanh toán',
                duration: 3,
                placement: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!order) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 mb-14" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center justify-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: "absolute",
                        left: "20px",
                        top: "40px",
                        zIndex: 1000,
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
                    {order.paymentMethod === 'BANK' && 'Thanh toán qua ngân hàng'}
                    {order.paymentMethod === 'ZALOPAY' && 'Thanh toán qua ZaloPay'}
                </div>
            </div>

            <div className="flex flex-col gap-4 bg-white rounded-lg p-4 mb-4 ">
                <div className="flex justify-between ">
                    <span className="font-bold">Thành tiền</span>
                    <span className="font-bold text-8am-orange">
                        {(order.totalAmount).toLocaleString()}đ
                    </span>
                </div>

                {
                    (order.paymentMethod === 'COD' && order.shippingFee) &&
                    <div className="flex justify-between ">
                        <span className="font-bold">Phí vận chuyển</span>
                        <span className="font-bold text-8am-grey">
                            {(order.shippingFee).toLocaleString()}đ
                        </span>
                    </div>
                }

                {
                    (order.paymentMethod === 'COD' && order.shippingFee) &&
                    <div className="flex justify-between ">
                        <span className="font-bold">Tổng cộng</span>
                        <span className="font-bold text-lg text-8am-orange">
                            {(order.totalAmount + order.shippingFee).toLocaleString()}đ
                        </span>
                    </div>
                }

            </div>

            {order.paymentMethod === 'BANK' && order.status !== 'paid' && (
                <button
                    onClick={handlePayAgain}
                    disabled={loading}
                    className="w-full bg-8am-orange text-white py-3 rounded-lg font-medium disabled:bg-gray-400"
                >
                    {loading ? 'Đang xử lý...' : 'Thanh toán lại'}
                </button>
            )}
        </div>
    );
};

export default OrderDetail; 