import { notification } from 'antd';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import { cartService } from '../firebase/cartService';
import { authService } from '../services/authService';
import { CartItem } from '../types/cart';
import { userService } from '../firebase/userService';


const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCart, setUserCart] = useState<any>();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    useEffect(() => {
        const checkLocal = async () => {
            const idUser = localStorage.getItem('idUser');
            if (idUser) {
                await userService.getUserByLocalId(idUser)
                    .then((req) => {
                        setUserInfo(req);
                    })
                    .catch((error) => {
                        console.error('Could not get user:', error);
                    });
            }
        };

        checkLocal();
    }, []);

    useEffect(() => {
        loadCartItems();
    }, [userInfo]);

    const loadCartItems = async () => {
        try {
            // const user = await authService.getAuthenticatedUser();

            setUserCart(userInfo);


            // if (!user) {

            //     await authService.authorizeLogin();

            //     notification.success({
            //         message: 'Lấy thông tin thành công',
            //         description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
            //         duration: 2,
            //         placement: 'top'
            //     });

            //     loadCartItems();

            //     // notification.warning({
            //     //     message: 'Yêu cầu đăng nhập',
            //     //     description: 'Vui lòng đăng nhập để xem giỏ hàng',
            //     //     duration: 3,
            //     //     placement: 'top'
            //     // });
            //     // navigate('/profile');
            //     return;
            // }

            if (userInfo && userInfo.id) {
                const items = await cartService.getCartItems(userInfo.id);
                setCartItems(items);
            }
            // else if (!user) {
            //     const cartItemLocal = localStorage.getItem('cartItems');
            //     if (cartItemLocal) {
            //         setCartItems(JSON.parse(cartItemLocal));
            //     }
            //     else {
            //         setCartItems([]);
            //     }
            // }
        } catch (error) {
            console.error('Error loading cart items:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể tải giỏ hàng do không có thông tin người dùng',
                duration: 3,
                placement: 'top'
            });
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        if (!userCart) {

            const cartItemLocal = localStorage.getItem('cartItems');
            if (cartItemLocal) {
                const cartItems = JSON.parse(cartItemLocal);
                const newCartItems = cartItems.map((item: CartItem) => {
                    if (item.id === itemId) {
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                });
                localStorage.setItem('cartItems', JSON.stringify(newCartItems));

                setCartItems(newCartItems);
                return;
            }
            return;
        }

        try {
            await cartService.updateCartItem(itemId, { quantity: newQuantity });
            setCartItems(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );
        } catch (error) {
            console.error('Error updating quantity:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể cập nhật số lượng',
                duration: 3,
                placement: 'top'
            });
        }
    };

    const removeItem = async (itemId: string) => {

        if (!userCart) {
            const cartItemLocal = localStorage.getItem('cartItems');
            if (cartItemLocal) {
                const cartItems = JSON.parse(cartItemLocal);
                const newCartItems = cartItems.filter((item: CartItem) => item.id !== itemId);
                localStorage.setItem('cartItems', JSON.stringify(newCartItems));
                notification.success({
                    message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                    duration: 2,
                    placement: 'top'
                });
                setCartItems(newCartItems);
                return;
            }
            return;
        }

        try {
            await cartService.removeFromCart(itemId);
            setCartItems(prev => prev.filter(item => item.id !== itemId));
            notification.success({
                message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                duration: 2,
                placement: 'top'
            });
        } catch (error) {
            console.error('Error removing item:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể xóa sản phẩm',
                duration: 3,
                placement: 'top'
            });
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleOrder = async () => {
        // const user = await authService.getAuthenticatedUser();
        // if (!user) {
        //     navigate('/order', {
        //         state: {
        //             cartItems,
        //             totalAmount: calculateTotal(),
        //             userId: ''
        //         }
        //     });
        // }
        // else 
        if (userInfo) {
            navigate('/order', {
                state: {
                    cartItems,
                    totalAmount: calculateTotal(),
                    userId: userInfo.id
                }
            });
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-center mt-10">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: 'absolute',
                        top: '45px',
                        left: '10px',
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>
                <div className="text-8am-black text-2xl font-bold">
                    Giỏ hàng
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            ) : cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    Giỏ hàng trống
                </div>
            ) : (
                <>
                    <div className="space-y-2 overflow-y-auto h-[calc(100vh-300px)]">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-lg p-2 shadow-sm">
                                <div className="flex gap-2">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    {
                                        item.type === 'coffee' && (
                                            <div className="flex-1">
                                                <div className="text-8am-black font-bold">{item.name}</div>
                                                <div className="text-8am-middle-grey text-sm">
                                                    {item.weight}g - {item.grindType === 'whole' ? 'Nguyên hạt' : 'Xay sẵn'}
                                                </div>
                                                <div className="text-8am-middle-grey text-sm">
                                                    {item.grindSize}
                                                </div>
                                                <div className="text-8am-black font-bold mt-1">
                                                    {item.price.toLocaleString()}đ
                                                </div>
                                            </div>
                                        )
                                    }

                                    {
                                        item.type === 'drink' && (
                                            <div className="flex-1">
                                                <div className="text-8am-black font-bold">{item.name}</div>
                                                <div className="text-8am-middle-grey text-sm">
                                                    {item.volume}ml
                                                </div>
                                                <div className="text-8am-black font-bold mt-1">
                                                    {item.price.toLocaleString()}đ
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-4">
                                        <button
                                            className="p-2 rounded-full bg-gray-100"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <FaMinus className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <span className="text-8am-black font-bold">{item.quantity}</span>
                                        <button
                                            className="p-2 rounded-full bg-gray-100"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <FaPlus className="h-4 w-4 text-gray-600" />
                                        </button>
                                    </div>
                                    <button
                                        className="p-2 rounded-full bg-red-100"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <FaTrash className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="fixed left-0 right-0 bg-white p-4 shadow-lg"
                        style={{
                            bottom: '50px',
                        }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-8am-middle-grey">Tổng tiền:</div>
                            <div className="text-8am-black text-xl font-bold">
                                {calculateTotal().toLocaleString()}đ
                            </div>
                        </div>

                        <button
                            className="w-full bg-orange-500 text-white py-4 rounded-lg font-medium"
                            onClick={handleOrder}
                        >
                            Đặt hàng
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart; 