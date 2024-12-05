import { notification, Modal } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../firebase/orderService';
import { Select } from 'antd';
import ShipIcon from '../public/images/ship-icon.svg';
import PayIcon from '../public/images/pay-icon.svg';
import ZaloPayIcon from '../public/images/zalopay.svg';
import CardIcon from '../public/images/card-payment.svg';
import MomoIcon from '../public/images/momo.svg';
import ApplePayIcon from '../public/images/applePay.svg';
import { authService } from '../services/authService';
import { cartService } from '../firebase/cartService';
import { userService } from '../firebase/userService';
import { User } from 'firebase/auth';
import { addressService } from '../services/addressService';
import { IoQrCodeOutline } from 'react-icons/io5';
import { configService } from '../firebase/configService';
const { Option } = Select;

const Order = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, totalAmount, userId } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phone: '',
        address: '',
        province: '',
        district: '',
        ward: '',
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        saveCard: false,
        discountCode: '',
        paymentMethod: 'COD'
    });
    const [showCartItems, setShowCartItems] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const currentUser = await authService.getAuthenticatedUser();
            if (currentUser) {
                setUser(currentUser);
                setFormData(prev => ({ ...prev, fullName: currentUser.name, phone: currentUser.phoneNumber ? currentUser.phoneNumber.replace('84', '0') : '' }));
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        getProvince();
    }, []);

    useEffect(() => {
        const savedAddress = addressService.getAddress();
        if (savedAddress) {
            setFormData(prev => ({
                ...prev,
                address: savedAddress.address,
                province: savedAddress.province,
                district: savedAddress.district,
                ward: savedAddress.ward,
                fullName: savedAddress.fullName || prev.fullName,
                phone: savedAddress.phone || prev.phone,
                email: savedAddress.email || prev.email
            }));
        }
    }, []);

    const getProvince = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
            console.log('data', data);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    const handleProvinceChange = async (value: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${value}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts);
            setWards([]); // Reset wards when province changes
            const province: any = provinces.find((p: any) => p.code === value);
            setFormData(prev => ({ ...prev, province: province?.name, district: '', ward: '' }));
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const handleDistrictChange = async (value: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${value}?depth=2`);
            const data = await response.json();
            setWards(data.wards);
            const district: any = districts.find((d: any) => d.code === value);
            setFormData(prev => ({ ...prev, district: district?.name, ward: '' }));
        } catch (error) {
            console.error('Error fetching wards:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Save address to local storage
            addressService.saveAddress({
                address: formData.address,
                province: formData.province,
                district: formData.district,
                ward: formData.ward,
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email
            });

            const order: any = {
                userId,
                items: cartItems,
                totalAmount,
                shippingInfo: formData,
                status: 'pending' as const,
                paymentMethod: formData.paymentMethod
            };

            const orderFB = await orderService.createOrder(order);


            // Clear all items from the user's cart
            for (const item of cartItems) {
                if (item.id) {
                    await cartService.removeFromCart(item.id);
                }
            }

            await sendOrderConfirmation(order, orderFB.id);
            notification.success({
                message: 'Đặt hàng thành công',
                description: 'Đơn hàng của bạn đã được tạo và xác nhận qua Zalo',
                duration: 3,
                placement: 'top'
            });

            navigate('/profile');

        } catch (error) {
            console.error('Error creating order:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể tạo đơn hàng',
                duration: 3,
                placement: 'top'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Add new function to check if address is complete
    const isAddressComplete = () => {
        return formData.address &&
            formData.province &&
            formData.district &&
            formData.ward;
    };

    const handlePaymentMethodChange = (method: string) => {
        setFormData(prev => ({ ...prev, paymentMethod: method }));
        setIsPaymentModalVisible(false);

        if (method === 'ZALOPAY') {
            // handleZaloPayment();
        }
    };

    const sendOrderConfirmation = async (order: any, orderId: any) => {
        try {
            const authenticatedUser = await authService.getAuthenticatedUser();
            if (!authenticatedUser) return;

            // await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
            //     app_id: '2448144731783137375',
            //     grant_type: 'authorization_code',
            //     code: 'eNhWdHtXe3UYIFpR4xYkHQLrygHvkxivw7I7dbl7uIlVQhZ2PlBSD-qyXfTBpkfnaGAYxpgPfNUzEVtoC9UgQhmvzvyo_9m6X3l7v5dlZt_BEhJUJeViMCjdhE1ligrFXnggkJxhqLhtEVoQFwQPV_WLlPnakUqRxHgZxdp1_atH9TEe3FQ9GDfzxxSvY-TBx6AersRDw37HAQlj3xdeSwflihPb_zq4bWdKs4Mzb3AKLvMASBo-VyOwo_agaz0sxHgpP6kBdBUmzlq52M-pK8YRc1KMQ__qoAInP5Pg--VYpR55Nr3LpEM8jnbiRDkD0NF0ESYFkf2ffvAZ7JJu583usEeQ9P9jlhMdemuas3dFaOl0E2hMSScTxkCXNjTiabtCUH7dYYe'
            // },
            //     {
            //         headers: {
            //             'Content-Type': 'application/x-www-form-urlencoded',
            //             'secret_key': 'g8RUo6XKj3V7RoSuEom1'
            //         }
            //     }
            // ).then(async (response) => {
            //     console.log('response', response.data);

            //     await configService.saveZaloTokens(response.data.access_token, response.data.refresh_token, response.data.expires_in);
            // }).catch((error) => {
            //     console.error('error', error);
            // });

            const configZalo = await configService.getConfig();
            console.log('configZalo', configZalo);

            await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
                app_id: '2448144731783137375',
                grant_type: 'refresh_token',
                refresh_token: configZalo?.refresh_token_zalo
            },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'secret_key': 'g8RUo6XKj3V7RoSuEom1'
                    }
                }
            ).then(async (response) => {
                console.log('response', response.data);

                await configService.saveZaloTokens(response.data.access_token, response.data.refresh_token, response.data.expires_in);

            }).catch((error) => {
                console.error('error', error);
            });

            const newConfigZalo = await configService.getConfig();

            const lstUser = await axios.get('https://openapi.zalo.me/v3.0/oa/user/getlist?data={"offset":0,"count":15}', {
                headers: {
                    'access_token': newConfigZalo?.access_token_zalo,
                    'Content-Type': 'application/json'
                }
            });

            console.log('lstUser', lstUser.data.data.users);

            for (const user of lstUser.data.data.users) {
                // const userDetail = await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${user.user_id}"}`, {
                //     headers: {
                //         'access_token': newConfigZalo?.access_token_zalo,
                //         'Content-Type': 'application/json'
                //     }
                // });

                // if (userDetail.data.data.display_name.toLowerCase() === authenticatedUser.name.toLowerCase()) {
                if (user.user_id === '7677597454271532329') {
                    // Tạo nội dung tin nhắn hóa đơn

                    console.log('userDetail', user.user_id);


                    const orderItems = order.items.length === 1
                        ? `${order.items[0].name} (${order.items[0].quantity}x) - ${order.items[0].price.toLocaleString()}đ`
                        : order.items.map((item: any) =>
                            `${item.name} (${item.quantity}x) - ${item.price.toLocaleString()}đ, `
                        ).join('\n');

                    console.log('order confirmation', order);

                    const orderAddress = `${order.shippingInfo.address}, ${order.shippingInfo.ward}, ${order.shippingInfo.district}, ${order.shippingInfo.province}\n\n`;

                    const orderPaymentMethod = order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua chuyển khoản';

                    const message = `🎉 Cảm ơn bạn đã đặt hàng!\n\n` +
                        `📋 Chi tiết đơn hàng:\n${orderItems}\n\n` +
                        `💰 Tổng tiền: ${order.totalAmount.toLocaleString()}đ\n\n` +
                        `📍 Địa chỉ giao hàng:\n` +
                        `${order.shippingInfo.fullName}\n` +
                        `${order.shippingInfo.phone}\n` +
                        `${order.shippingInfo.address}, ${order.shippingInfo.ward}, ${order.shippingInfo.district}, ${order.shippingInfo.province}\n\n` +
                        `💳 Phương thức thanh toán: ${order.paymentMethod}`;

                    await axios.post('https://openapi.zalo.me/v3.0/oa/message/transaction', {
                        recipient: {
                            user_id: user.user_id
                        },
                        message: {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "transaction_order",
                                    "language": "VI",
                                    "elements": [
                                        {
                                            "type": "header",
                                            "content": 'Mã đơn hàng: ' + orderId,
                                            "align": "left"
                                        },
                                        // {
                                        //     "type": "text",
                                        //     "align": "left",
                                        //     "content": "• Cảm ơn bạn đã mua hàng.<br>• Thông tin đơn hàng của bạn như sau:"
                                        // },
                                        {
                                            "type": "table",
                                            "content": [
                                                {
                                                    "value": `${authenticatedUser.name}`,
                                                    "key": "Tên khách hàng"
                                                },
                                                {
                                                    'value': `${authenticatedUser.phoneNumber.replace('84', '0')}`,
                                                    'key': 'Số điện thoại'
                                                },
                                                {
                                                    "value": `${orderAddress}`,
                                                    "key": "Địa chỉ giao hàng"
                                                },

                                                {
                                                    "value": `${orderItems}`,
                                                    "key": "Đơn hàng"
                                                },
                                                {
                                                    "value": `${order.totalAmount.toLocaleString()}đ`,
                                                    "key": "Tổng tiền đơn hàng"
                                                },
                                                {
                                                    "value": `${orderPaymentMethod}`,
                                                    "key": "Phương thức thanh toán"
                                                }

                                            ]
                                        },
                                        // {
                                        //     "type": "text",
                                        //     "align": "center",
                                        //     "content": "📱Lưu ý điện thoại. Xin cảm ơn!"
                                        // }
                                    ],
                                    "buttons": [
                                        {
                                            "title": "Gửi tin nhắn cho khách",
                                            "type": "oa.open.sms",
                                            "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                            "payload": {
                                                "content": "alo",
                                                "phone_code": `${authenticatedUser.phoneNumber.replace('84', '0')}`
                                            }
                                        },
                                        {
                                            "title": "Gọi điện cho khách",
                                            "type": "oa.open.phone",
                                            "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                            "payload": {
                                                "phone_code": `${authenticatedUser.phoneNumber.replace('84', '0')}`
                                            }
                                        },
                                        {
                                            "title": "Xác nhận đơn hàng",
                                            "type": "oa.open.url",
                                            "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                            "payload": {
                                                "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=${user.user_id}&authenticatedUserName=${authenticatedUser.name}&authenticatedUserPhone=${authenticatedUser.phoneNumber.replace('84', '0')}&orderAddress=${orderAddress}&orderItems=${orderItems}&orderTotalAmount=${order.totalAmount}&orderPaymentMethod=${orderPaymentMethod}&accessToken=${newConfigZalo?.access_token_zalo}&`
                                            },
                                        },

                                    ]
                                }
                            }
                        }
                    }, {
                        headers: {
                            'access_token': newConfigZalo?.access_token_zalo,
                            'Content-Type': 'application/json'
                        }
                    });

                    await userService.updateUserZaloId(userId, user.user_id);

                    break;
                }
            }
        } catch (error) {
            console.error('Error sending order confirmation:', error);
        }
    };

    return (
        <div className="pt-4 pb-10 mb-10 bg-8am-white">
            <div className="mb-4 flex items-center justify-center mt-12"
                style={{
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
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
                <div className="text-8am-black text-2xl font-bold mb-2">
                    Đặt hàng
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 ml-4 mr-4">
                <div className="text-xl font-bold">Đơn hàng</div>
                <div className="text-lg flex items-center gap-2" onClick={() => setShowCartItems(!showCartItems)}>
                    {totalAmount.toLocaleString()}đ ({cartItems.length} sản phẩm)
                    {showCartItems ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>
            {showCartItems && (
                <div className={`mt-2 ml-2 mr-4 transition-all duration-300 ${showCartItems ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                    {cartItems.map((item, index) => (
                        <div key={index} className="p-2 border-b border-gray-300 flex items-center gap-2">
                            <div>
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">{item.name}</div>
                                <div className="text-sm text-gray-500">{item.price.toLocaleString()}đ</div>
                                <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 ml-4 mr-4">
                <h2 className="text-lg font-bold mb-4">Thông tin nhận hàng</h2>
                <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg">
                    {/* <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div> */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Họ và tên"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Số điện thoại"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <input
                            type="text"
                            name="address"
                            placeholder="Địa chỉ"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Tỉnh/Thành phố"
                            value={formData.province || undefined}
                            onChange={handleProvinceChange}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                            optionFilterProp="children"
                        >
                            {provinces.map((province: any) => (
                                <Option key={province.code} value={province.code}>
                                    {province.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quận/Huyện</label>
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Quận/Huyện"
                            value={formData.district || undefined}
                            onChange={handleDistrictChange}
                            disabled={!formData.province}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                            optionFilterProp="children"
                        >
                            {districts.map((district: any) => (
                                <Option key={district.code} value={district.code}>
                                    {district.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phường/Xã</label>
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Phường/Xã"
                            value={formData.ward || undefined}
                            onChange={(value) => {
                                const ward: any = wards.find((w: any) => w.code === value);
                                setFormData(prev => ({ ...prev, ward: ward?.name }));
                            }}
                            disabled={!formData.district}
                        >
                            {wards.map((ward: any) => (
                                <Option key={ward.code} value={ward.code}>
                                    {ward.name}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    {/* <div className="space-y-2">
                        <div className="text-xl font-bold mb-2">Vận chuyển</div>
                        <div className="p-4 bg-gray-100 rounded-lg flex items-center">
                            <div className="flex items-center gap-2">
                                <img src={ShipIcon} alt="Ship" className="w-6 h-6" />
                                {isAddressComplete() ? (
                                    <div className="flex justify-between items-center w-full gap-2">
                                        <div>Giao hàng tận nơi</div>
                                        <div>25.000đ</div>
                                    </div>
                                ) : (
                                    <span>Vui lòng nhập thông tin giao hàng</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Mã giảm giá</label>
                        <input
                            type="text"
                            name="discountCode"
                            placeholder="Nhập mã giảm giá"
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.discountCode}
                            onChange={handleChange}
                        />
                    </div> */}

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">Hình thức thanh toán</label>
                            <button
                                type="button"
                                className="text-orange-500 text-sm"
                                onClick={() => setIsPaymentModalVisible(true)}
                            >
                                Thay đổi
                            </button>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-100 flex items-center gap-2">

                            {
                                formData.paymentMethod === 'COD' && <img src={PayIcon} className='w-6 h-6' />
                            }

                            {
                                formData.paymentMethod === 'BANK' && <IoQrCodeOutline className='w-6 h-6' />
                            }

                            {
                                formData.paymentMethod === 'ZALOPAY' && <img src={ZaloPayIcon} alt="ZaloPay" className="w-6 h-6" />
                            }

                            {
                                formData.paymentMethod === 'MOMO' && <img src={MomoIcon} alt="Momo" className="w-6 h-6" />
                            }

                            {
                                formData.paymentMethod === 'APPLEPAY' && <img src={ApplePayIcon} alt="Apple Pay" className="w-6 h-6" />
                            }

                            {
                                formData.paymentMethod === 'CARD' && <img src={CardIcon} alt="Card" className="w-6 h-6" />
                            }


                            <span className='font-bold'>
                                {formData.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' :
                                    formData.paymentMethod === 'ZALOPAY' ? 'Thanh toán qua ZaloPay' :
                                        formData.paymentMethod === 'BANK' ? 'Thanh toán qua chuyển khoản' :
                                            formData.paymentMethod === 'MOMO' ? 'Thanh toán qua Momo' :
                                                formData.paymentMethod === 'APPLEPAY' ? 'Thanh toán qua Apple Pay' :
                                                    'Thanh toán khi nhận hàng (COD)'}
                            </span>
                        </div>

                        <Modal
                            title="Chọn phương thức thanh toán"
                            open={isPaymentModalVisible}
                            onCancel={() => setIsPaymentModalVisible(false)}
                            footer={null}
                        >
                            <div className="space-y-4">
                                <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('COD')}
                                >
                                    <img src={PayIcon} alt="COD" className="w-6 h-6" />
                                    <span>Thanh toán khi nhận hàng (COD)</span>
                                </div>
                                <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('BANK')}
                                >
                                    <IoQrCodeOutline className='w-6 h-6' />
                                    <span>Chuyển khoản</span>
                                </div>
                                {/* <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('MOMO')}
                                >
                                    <img src={MomoIcon} alt="Momo" className="w-6 h-6" />
                                    <span>Ví MoMo</span>
                                </div>
                                <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('ZALOPAY')}
                                >
                                    <img src={ZaloPayIcon} alt="ZaloPay" className="w-6 h-6" />
                                    <span>ZaloPay</span>
                                </div>
                                <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('APPLEPAY')}
                                >
                                    <img src={ApplePayIcon} alt="Apple Pay" className="w-6 h-6" />
                                    <span>Apple Pay</span>
                                </div> */}
                            </div>
                        </Modal>
                    </div>

                    <div className="text-sm text-gray-500">
                        Bằng việc tiến hành đặt mua, bạn đồng ý với
                        <button type="button" className="text-black underline ml-1">
                            Điều Kiện Giao Dịch Chung
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            loading || 
                            !formData.fullName ||
                            !formData.phone ||
                            !formData.address ||
                            !formData.province ||
                            !formData.district ||
                            !formData.ward
                        }
                        className="w-full bg-orange-500 text-white py-4 rounded-lg font-medium disabled:bg-gray-400"
                    >
                        {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                    </button>
                </form>
            </div>

            {/* Add Shipping Information Section */}

        </div>
    );
};

export default Order;