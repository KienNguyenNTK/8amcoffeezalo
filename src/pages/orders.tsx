import React, { useEffect, useState } from "react";
import { Order } from "../types/order";
import { orderService } from "../firebase/orderService";
import { authService } from "../services/authService";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>();
    const [loading, setLoading] = useState(false);
    const [numberOrder, setNumberOrder] = useState<any>(null);
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
        const fetchOrders = async () => {
            setLoading(true);
            // const currentUser = await authService.getAuthenticatedUser();
            // console.log('currentUser', currentUser.id);
            if (userInfo && userInfo.id) {
                const userOrders = await orderService.getAllOrders();

                const filteredOrders = userOrders.filter(order => order.userId === userInfo.id);

                // Sắp xếp đơn hàng theo thời gian tạo mới nhất
                filteredOrders.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setOrders(filteredOrders);
                setNumberOrder(filteredOrders.length);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [userInfo]);

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

    const handleOrderClick = (orderId: any) => {
        navigate(`/orders/${orderId}`);
    };

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center justify-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: "absolute",
                        left: "20px",
                        top: "40px",
                        zIndex: 1000
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

                <div className="text-8am-black text-xl font-bold mt-5"
                >
                    Đơn hàng
                </div>
            </div>
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                ) : (
                    <>
                        {numberOrder === 0 &&
                            <div className='flex flex-col items-center justify-center'>
                                <div className="text-8am-black text-xl font-bold mt-5 text-center">
                                    Bạn không có đơn hàng nào
                                </div>
                                <div className="text-8am-black text-sm mt-2 text-center">
                                    Thông tin đơn hàng sẽ được cập nhật khi bạn mua hàng
                                </div>
                            </div>}
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg p-4 active:bg-gray-50"
                                onClick={() => handleOrderClick(order.id)}
                            >
                                <div className="text-8am-orange text-sm mb-2 font-medium">
                                    {getStatusText(order.status)}
                                </div>

                                {order.items.map((item) => (
                                    <div key={item.id} className="flex mb-4">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-16 h-24 object-cover rounded-md"
                                        />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-medium">{item.name}</h3>
                                            <p className="text-gray-500 text-sm">{item.weight}g - {item.grindType === 'whole' ? 'Nguyên hạt' : 'Xay sẵn'}</p>
                                            <div className="flex justify-between mt-2">
                                                <span>Số lượng {item.quantity}</span>
                                                <span className="font-medium">
                                                    {item.price.toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default Orders;