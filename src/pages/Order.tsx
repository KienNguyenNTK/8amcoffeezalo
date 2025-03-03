import { Modal, notification, Select } from 'antd';
import axios from 'axios';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoQrCodeOutline } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router-dom';
import { AsyncCallbackFailObject, CheckTransactionReturns, Events, getUserID, Payment } from 'zmp-sdk';
import { configService } from '../firebase/configService';
import { userService } from '../firebase/userService';
import ApplePayIcon from '../public/images/applePay.svg';
import CardIcon from '../public/images/card-payment.svg';
import MomoIcon from '../public/images/momo.svg';
import PayIcon from '../public/images/pay-icon.svg';
import ZaloPayIcon from '../public/images/zalopay.svg';
import { addressService } from '../services/addressService';
import { authService } from '../services/authService';
import CryptoJS from 'crypto-js';
import { orderService } from '../firebase/orderService';
import { cartService } from '../firebase/cartService';
import { events, EventName } from "zmp-sdk/apis"; // Require: zmp-sdk >= 2.25.3
import { CheckoutSDK } from "zmp-sdk";
import ShipIcon from '../public/images/ship-icon.svg';
import { shippingConfigService } from '../firebase/shippingConfigService';
import { ShippingConfig, StoreLocation } from '../types/shipping';
import { BsBank } from 'react-icons/bs';
const { Option } = Select;

interface ShippingFeeResult {
    storeId: string;
    storeAddress: string;
    shortStoreAddress: string;
    baseFee: number;
    surcharge: number;
    discount: number;
    fee: number;
    distance: number;
}

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
    const { state } = useLocation();
    const [paymentResult, setPaymentResult] = useState<
        CheckTransactionReturns | AsyncCallbackFailObject
    >();

    const [transactionStatus, setTransactionStatus] = useState<any>(0);
    const [orderId, setOrderId] = useState<any>(null);
    const [appTransID, setAppTransID] = useState<any>(null);
    const [pathAppOpen, setPathAppOpen] = useState<any>(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [distance, setDistance] = useState(0);
    const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
    const [storeLocation, setStoreLocation] = useState<StoreLocation | null>(null);
    const [loadingDistance, setLoadingDistance] = useState(false);
    const [shippingFees, setShippingFees] = useState<ShippingFeeResult | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedStore, setSelectedStore] = useState<ShippingFeeResult | null>(null);

    useEffect(() => {
        loadShippingConfig();
        getProvince();
    }, []);

    useEffect(() => {
        const savedAddress = addressService.getAddress();
        if (savedAddress) {
            // Format số điện thoại nếu bắt đầu bằng 84
            const formattedPhone = savedAddress.phone?.startsWith('84')
                ? '0' + savedAddress.phone.slice(2)
                : savedAddress.phone;

            setFormData(prev => ({
                ...prev,
                address: savedAddress.address,
                province: savedAddress.province,
                district: savedAddress.district,
                ward: savedAddress.ward,
                fullName: savedAddress.fullName || prev.fullName,
                phone: formattedPhone || prev.phone,
                email: savedAddress.email || prev.email
            }));
        }
    }, []);

    // Cập nhật phí giao hàng khi địa chỉ thay đổi
    useEffect(() => {
        if (isAddressComplete()) {
            // Thêm độ trễ để tránh gọi API quá nhiều
            const timer = setTimeout(() => {
                calculateDistance();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [formData.address, formData.ward, formData.district, formData.province, shippingConfig]);

    const loadShippingConfig = async () => {
        const config = await shippingConfigService.getConfig();
        if (config) {
            setShippingConfig(config);
            setStoreLocation(config.storeLocations[0]);
        }
    };

    // const getDistance = async (address: string) => {
    //     await axios.get(`https://api.geoapify.com/v1/geocode/search?text="${address}"&lang=vi&limit=1&format=json&apiKey=5de6046ee5e843169fd8269c94f5e89f`)
    //         .then(res => {
    //             console.log('res', res);
    //             const location = res.data.results[0];
    //             if (!location) return;
    //             console.log(location);
    //             return location;
    //         })
    //         .catch(error => {
    //             console.error('Error fetching distance:', error);
    //             return null;
    //         });
    // };

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

        // if (!await authService.isAuthenticated()) {
        //     notification.warning({
        //         message: 'Yêu cầu thông tin',
        //         description: 'Chúng tôi cần thông tin của bạn để có thể giúp bạn đặt hàng',
        //         duration: 1.5,
        //         placement: 'top'
        //     });
        // }

        // setTimeout(async () => {

        try {

            handleCreateOrder(formData.paymentMethod);


            // handleSelectPaymentMethod();
        } catch (error) {
            console.error('Error creating order:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể tạo đơn hàng',
                duration: 3,
                placement: 'top',
                closable: false
            });
        }
        setLoading(false);
        // }, 1000);

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
            // const authenticatedUser = await authService.getAuthenticatedUser();
            // if (!authenticatedUser) return;

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

            // const configZalo = await configService.getConfig();
            // console.log('configZalo', configZalo);

            // await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
            //     app_id: '2448144731783137375',
            //     grant_type: 'refresh_token',
            //     refresh_token: configZalo?.refresh_token_zalo
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

            const newConfigZalo = await configService.getConfig();

            // const lstUser = await axios.get('https://openapi.zalo.me/v3.0/oa/user/getlist?data={"offset":0,"count":50}', {
            //     headers: {
            //         'access_token': newConfigZalo?.access_token_zalo,
            //         'Content-Type': 'application/json'
            //     }
            // });

            // console.log('lstUser', lstUser.data.data.users);

            // for (const user of lstUser.data.data.users) {
            // const userDetail = await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"7677597454271532329"}`, {
            //     headers: {
            //         'access_token': newConfigZalo?.access_token_zalo,
            //         'Content-Type': 'application/json'
            //     }
            // });

            // if (userDetail.data.data.display_name.toLowerCase() === authenticatedUser.name.toLowerCase()) {
            // if (userDetail.data.data.display_name.toLowerCase() === '8amcoffee') {
            // Tạo nội dung tin nhắn hóa đơn

            // console.log('userDetail', userDetail.data.data);

            const orderItems = order.items.length === 1
                ? order.items[0].type === 'coffee'
                    ? `- (Coffee) ${order.items[0].name}  - ${order.items[0].weight}g - ${order.items[0].grindType === 'whole' ? 'Nguyên hạt' : 'Xay sẵn'} ${order.items[0].grindSize ? `- ${order.items[0].grindSize}` : ''} - ${order.items[0].price.toLocaleString()}đ (${order.items[0].quantity} sản phẩm)`
                    : `- (Đồ uống) ${order.items[0].name} - ${order.items[0].volume}ml - ${order.items[0].price.toLocaleString()}đ (${order.items[0].quantity} sản phẩm)`
                : order.items.map((item: any) =>
                    item.type === 'coffee'
                        ? `- (Coffee) ${item.name}  - ${item.weight}g - ${item.grindType === 'whole' ? 'Nguyên hạt' : 'Xay sẵn'} ${item.grindSize ? `- ${item.grindSize}` : ''} - ${item.price.toLocaleString()}đ (${item.quantity} sản phẩm)`
                        : `- (Đồ uống) ${item.name} - ${item.volume}ml - ${item.price.toLocaleString()}đ (${item.quantity} sản phẩm)`
                ).join('\n');

            console.log('order confirmation', order);

            console.log('orderItems', orderItems.length);


            const orderAddress = `${order.shippingInfo.address}, ${order.shippingInfo.ward}, ${order.shippingInfo.district}, ${order.shippingInfo.province}`;


            let orderPaymentMethod = '';
            switch (order.paymentMethod) {
                case 'COD':
                    orderPaymentMethod = 'Thanh toán khi nhận hàng (COD)';
                    break;
                case 'BANK_SANDBOX':
                    orderPaymentMethod = 'Thanh toán qua chuyển khoản';
                    break;
                case 'BANK':
                    orderPaymentMethod = 'Thanh toán qua ngân hàng';
                    break;
                case 'ZALOPAY':
                    orderPaymentMethod = 'Thanh toán qua ZaloPay';
                    break;
                case 'ZALOPAY_SANDBOX':
                    orderPaymentMethod = 'Thanh toán qua ZaloPay';
                    break;
                case 'APPLE_PAY':
                    orderPaymentMethod = 'Thanh toán qua Apple Pay';
                    break;
                case 'GOOGLE_PAY':
                    orderPaymentMethod = 'Thanh toán qua Google Pay';
                    break;
                case 'CARD':
                    orderPaymentMethod = 'Thanh toán qua thẻ';
                    break;
            }

            const userId = await getUserID();

            const user: any = await userService.getUserByLocalId(userId);

            const userDetail = await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${user?.zaloUserId ? user.zaloUserId : user?.localId}"}`, {
                headers: {
                    'access_token': newConfigZalo?.access_token_zalo,
                    'Content-Type': 'application/json'
                }
            });

            let textChangeStatus: any = '';
            switch (order.status) {
                case 'waiting':
                    textChangeStatus = 'Đơn hàng đang chờ xác nhận';
                    break;
                case 'confirmed':
                    textChangeStatus = 'Đơn hàng đã được xác nhận';
                    break;
                case 'shipping':
                    textChangeStatus = 'Đơn hàng đang được giao';
                    break;
                case 'delivered':
                    textChangeStatus = 'Đơn hàng đã giao thành công';
                    break;
                case 'paid':
                    textChangeStatus = 'Đơn hàng đã thanh toán';
                    break;
                case 'cancelled':
                    textChangeStatus = 'Đơn hàng đã bị hủy';
                    break;
            }

            console.log('userDetail', userDetail.data.data);

            let messageText = '';
            let messageTextToUser = '';
            let totalAmountWithShipping = 0;
            if (order.paymentMethod === 'COD' && shippingFees) {
                totalAmountWithShipping = order.totalAmount + shippingFees.fee;
                messageText = `Mã đơn hàng: ${orderId} \nĐơn hàng: \n${orderItems} \nTổng tiền: ${order.totalAmount.toLocaleString()}đ \nPhí vận chuyển: ${shippingFees.fee.toLocaleString()}đ \nTổng tiền cần thanh toán: ${totalAmountWithShipping.toLocaleString()}đ \nTên khách hàng: ${order.shippingInfo.fullName} \nSố điện thoại: ${order.shippingInfo.phone} \nĐịa chỉ: ${order.shippingInfo.address}, ${order.shippingInfo.ward}, ${order.shippingInfo.district}, ${order.shippingInfo.province} \nPhương thức thanh toán: ${order.paymentMethod} \nTrạng thái: ${textChangeStatus}`
                messageTextToUser = `Mã đơn hàng: ${orderId} \nĐơn hàng: \n${orderItems} \nTổng tiền: ${order.totalAmount.toLocaleString()}đ \nPhí vận chuyển: ${shippingFees.fee.toLocaleString()}đ \nTổng tiền cần thanh toán: ${totalAmountWithShipping.toLocaleString()}đ \nPhương thức thanh toán: ${order.paymentMethod} \nTrạng thái: ${textChangeStatus}`
            }

            else {
                messageText = `Mã đơn hàng: ${orderId} \nĐơn hàng: \n${orderItems} \nTổng tiền: ${order.totalAmount.toLocaleString()}đ \nTên khách hàng: ${order.shippingInfo.fullName} \nSố điện thoại: ${order.shippingInfo.phone} \nĐịa chỉ: ${order.shippingInfo.address}, ${order.shippingInfo.ward}, ${order.shippingInfo.district}, ${order.shippingInfo.province} \nPhương thức thanh toán: ${order.paymentMethod} \nTrạng thái: ${textChangeStatus}`
                messageTextToUser = `Mã đơn hàng: ${orderId} \nĐơn hàng: \n${orderItems} \nTổng tiền: ${order.totalAmount.toLocaleString()}đ \nPhương thức thanh toán: ${order.paymentMethod} \nTrạng thái: ${textChangeStatus}`
            }

            if (orderItems.length > 800) {
                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '7677597454271532329'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Xem đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://coffee.updates.com.vn/order/${orderId}`
                                        }
                                    }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '7677597454271532329'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '1461459995705047021'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Xem đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://coffee.updates.com.vn/order/${orderId}`
                                        }
                                    }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '1461459995705047021'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '837853645134561285'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '837853645134561285'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi cho khách
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: userDetail.data.data.user_id ? userDetail.data.data.user_id : userId
                    },
                    message: {
                        "text": messageTextToUser,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Mở mini app",
                                        "type": "oa.open.url",
                                        "payload": {
                                            "url": `https://zalo.me/s/1410152383611769410`
                                        }
                                    }
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
            }
            else {
                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '7677597454271532329'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '7677597454271532329'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=7677597454271532329&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '1461459995705047021'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '1461459995705047021'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=1461459995705047021&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi đến tôi
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '837853645134561285'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Gửi tin nhắn cho khách",
                                        "type": "oa.open.sms",
                                        "image_icon": "https://t3.ftcdn.net/jpg/03/61/88/78/360_F_361887878_ArqB0f6xhcIzeQpqAKaDdUOOcK7cDmXD.jpg",
                                        "payload": {
                                            "content": "alo",
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
                                    },
                                    {
                                        "title": "Gọi điện cho khách",
                                        "type": "oa.open.phone",
                                        "image_icon": "https://static.vecteezy.com/system/resources/previews/004/956/066/non_2x/phone-call-icon-vector.jpg",
                                        "payload": {
                                            "phone_code": `${order.shippingInfo.phone}`
                                        }
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

                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: '837853645134561285'
                    },
                    message: {
                        "text": messageText,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Xác nhận đơn hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=confirmed`
                                        },
                                    },
                                    {
                                        "title": "Đang vận chuyển",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=shipping`
                                        },
                                    },
                                    {
                                        "title": "Đã giao hàng",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=delivered`
                                        },
                                    },
                                    {
                                        "title": "Đã thanh toán",
                                        "type": "oa.open.url",
                                        "image_icon": "https://png.pngtree.com/png-clipart/20230418/original/pngtree-order-confirm-line-icon-png-image_9065104.png",
                                        "payload": {
                                            "url": `https://api-coffee.8am.vn/api/orders/update-status/${orderId}?user_id=837853645134561285&accessToken=${newConfigZalo?.access_token_zalo}&status=paid`
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

                // Gửi cho khách
                await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    recipient: {
                        user_id: userDetail.data.data.user_id ? userDetail.data.data.user_id : userId
                    },
                    message: {
                        "text": messageTextToUser,
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "buttons": [
                                    {
                                        "title": "Mở mini app",
                                        "type": "oa.open.url",
                                        "payload": {
                                            "url": `https://zalo.me/s/1410152383611769410`
                                        }
                                    }
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
            }

        } catch (error) {
            console.error('Error sending order confirmation:', error);
        }
    };

    // const handleSelectPaymentMethod = () => {
    //     setLoading(true);
    //     Payment.selectPaymentMethod({
    //         channels: [
    //             { method: "COD", subInfo: "Thanh toán khi nhận hàng (COD)" },
    //             // { method: "BANK_SANDBOX", subInfo: "Thanh toán qua ngân hàng (BANK_SANDBOX)" },
    //             { method: 'BANK', subInfo: 'Thanh toán qua ngân hàng (BANK)' },
    //             // { method: 'ZALOPAY_SANDBOX', subInfo: 'Thanh toán qua ZaloPay (ZALOPAY)' },
    //             { method: 'ZALOPAY', subInfo: 'Thanh toán qua ZaloPay (ZALOPAY)' },
    //         ],
    //         success: (data) => {
    //             // Lựa chọn phương thức thành công
    //             const { method, isCustom, logo, displayName, subMethod } = data;
    //             console.log('data', data);
    //             handleCreateOrder(method);

    //         },
    //         fail: (err) => {
    //             // Tắt trang lựa chọn phương thức hoặc xảy ra lỗi
    //             console.log('err', err);
    //         },
    //     });
    // }

    const calculateOrderMAC = (orderData: any, privateKey: string) => {
        try {
            // Chuẩn bị dữ liệu cho các trường bắt buộc
            const params = {
                amount: orderData.amount,
                desc: orderData.desc,
                // extradata: orderData.extradata,
                item: orderData.item,
                method: orderData.method
            };

            // Sắp xếp và tạo chuỗi data theo hướng dẫn
            const dataMac = Object.keys(params)
                .sort()
                .map(key =>
                    `${key}=${typeof params[key] === 'object'
                        ? JSON.stringify(params[key])
                        : params[key]}`
                )
                .join('&');

            console.log('dataMac before hash:', dataMac); // Log để debug

            // Tạo HMAC với SHA256
            const mac = CryptoJS.HmacSHA256(dataMac, privateKey).toString();

            console.log('Generated MAC:', mac); // Log để debug

            return mac;
        } catch (error) {
            console.error('Error calculating MAC:', error);
            throw error;
        }
    };


    const handleCreateOrder = async (method: string) => {
        try {
            const privateKey = '6b81f2bf5493e12ff2051fe5e5efc2c6';

            if (!privateKey) {
                throw new Error('Private key is not defined');
            }

            // let data = state;
            // console.log("data before: ", data);
            // if (data) {
            //   if ("path" in data) {
            //     data = data.path;
            //   } else if ("data" in data ) {
            //     data = data.data;
            //   }
            // } else {
            //   data = window.location.search.slice(1);
            // }

            // console.log('data: ', data);

            const amountPrice = formData.paymentMethod === 'COD' && shippingFees ? Number(totalAmount + shippingFees.fee) : Number(totalAmount)

            const orderData = {
                desc: `${formData.fullName} - ${formData.phone} thanh toán cho 8amCoffee`,
                item: cartItems.map((item: any) => ({
                    id: item.id,
                    amount: item.price * item.quantity
                })),
                amount: amountPrice,
                // amount: 5000,
                // extradata: JSON.stringify({
                //     storeName: "8AM Coffee",
                //     storeId: "8AM_01",
                //     orderGroupId: userId,
                //     customerName: formData.fullName,
                //     customerPhone: formData.phone,
                //     customerAddress: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}`,
                //     paymentMethod: formData.paymentMethod,
                //     userId: userId,
                //     items: cartItems,
                //     totalAmount: totalAmount,
                //     // shippingInfo: {
                //     //     fullName: formData.fullName,
                //     //     phone: formData.phone,
                //     //     address: formData.address,
                //     //     ward: formData.ward,
                //     //     district: formData.district,
                //     //     province: formData.province
                //     // },
                //     status: "pending",
                // }),
                method: JSON.stringify(
                    {
                        id: method,
                        isCustom: false
                    }
                )
            };

            console.log('Order data before MAC calculation:', orderData); // Log để debug

            // Tính toán MAC
            const mac = calculateOrderMAC(orderData, privateKey);

            // Thêm MAC vào orderData
            const orderDataWithMac = {
                ...orderData,
                mac
            };

            console.log('Final order data:', orderDataWithMac); // Log để debug

            // Gọi API tạo đơn hàng
            Payment.createOrder({
                ...orderDataWithMac,
                success: async (data) => {
                    console.log('data create order: ', data);

                    const { orderId } = data;
                    console.log('Order created successfully:', orderId);

                    // await axios.get(`https://payment-mini.zalo.me/api/transaction/get-status`, {
                    //     params: {
                    //         orderId: orderId,
                    //         appId: '1410152383611769410',
                    //         mac: mac
                    //     }
                    // }).then(async (response) => {
                    //     console.log('response', response.data);
                    // }).catch((error) => {
                    //     console.error('error', error);
                    // });

                    if (method === 'ZALOPAY_SANDBOX' || method === 'ZALOPAY') {
                        console.log('method ZAlO: ', method);

                        events.on(EventName.OpenApp, (data) => {
                            console.log('data open app: ', data);
                            const path = data?.path;
                            console.log('path open app: ', path);

                            // kiểm tra path trả về từ giao dịch thanh toán
                            // RedirectPath: đã cung cấp tại trang khai báo phương thức
                            if (path.includes('/profile')) {
                                setLoading(true);
                                // Nếu đúng với RedirectPath đã cũng cấp, thực hiện redirect tới path được nhận
                                // Kiểm tra giao dịch bằng API checkTransaction nếu muốn
                                Payment.checkTransaction({
                                    data: path,
                                    success: async (rs) => {
                                        // Kết quả giao dịch khi gọi api thành công
                                        const { orderId, resultCode, msg, transTime, createdAt } = rs;

                                        console.log('rs open app: ', rs);

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

                                        // Cập nhật thông tin người dùng vào db User
                                        // await userService.updateUser(userId, {
                                        //     name: formData.fullName,
                                        //     phoneNumber: formData.phone,
                                        // });

                                        const order: any = {
                                            userId,
                                            items: cartItems,
                                            totalAmount,
                                            shippingInfo: formData,
                                            status: 'paid',
                                            paymentMethod: method
                                        };

                                        console.log('order', order);

                                        const orderFB = await orderService.createOrder(order);

                                        console.log('orderFB', orderFB);

                                        // Clear all items from the user's cart
                                        for (const item of cartItems) {
                                            if (item.id) {
                                                await cartService.removeFromCart(item.id);
                                            }
                                        }

                                        await sendOrderConfirmation(order, orderFB.id);

                                        notification.success({
                                            message: 'Đặt hàng thành công',
                                            description: 'Đơn hàng của bạn đã được tạo và thanh toán thành công',
                                            duration: 3,
                                            placement: 'top',
                                            closable: false
                                        });
                                        setLoading(false);

                                        // await userService.updateUser(userId, { phoneNumber: formData.phone, name: formData.fullName });

                                        navigate('/profile');

                                        // notification.success({
                                        //     message: 'Đặt hàng thành công',
                                        //     description: 'Đơn hàng của bạn đã được tạo',
                                        //     duration: 3,
                                        //     placement: 'top',
                                        //     closable: false
                                        // });

                                        setTimeout(() => {
                                            events.off(EventName.OpenApp);
                                        }, 1000);

                                        // navigate('/profile');
                                    },
                                    fail: (err) => {
                                        // Kết quả giao dịch khi gọi api thất bại
                                        console.log(err);
                                        setLoading(false);
                                    },
                                });
                            }
                        });

                        // events.on(EventName.PaymentClose, (data) => {
                        //     const resultCode = data?.resultCode;

                        //     console.log('data payment close: ', data);
                        //     console.log('resultCode payment close: ', resultCode);

                        //     // kiểm tra resultCode trả về từ sự kiện PaymentClose
                        //     // 0: Đang xử lý
                        //     // 1: Thành công
                        //     // -1: Thất bại

                        //     //Nếu trạng thái đang thực hiện, kiểm tra giao dịch bằng API checkTransaction nếu muốn
                        //     if (resultCode === 0) {
                        //         Payment.checkTransaction({
                        //             data: { zmpOrderId: data?.zmpOrderId },
                        //             success: (rs) => {
                        //                 // Kết quả giao dịch khi gọi api thành công
                        //                 const { orderId, resultCode, msg, transTime, createdAt } = rs;

                        //                 console.log('rs payment close: ', rs);

                        //             },
                        //             fail: (err) => {
                        //                 // Kết quả giao dịch khi gọi api thất bại
                        //                 console.log(err);
                        //             },
                        //         });
                        //     } else {
                        //         // Xử lý kết quả thanh toán thành công hoặc thất bại
                        //         const { orderId, resultCode, msg, transTime, createdAt } = data;
                        //     }
                        // });

                        // handleCheckOrderStatus(orderId);
                    }

                    else if (method === 'BANK_SANDBOX' || method === 'BANK') {

                        if (!appTransID) {
                            events.on(EventName.OnDataCallback, (resp) => {
                                setLoading(true);
                                const { eventType, data } = resp;
                                console.log('eventType: ', eventType);
                                console.log('data: ', data);
                                if (eventType === "PAY_BY_BANK") {
                                    if (data.appTransID) {
                                        Payment.checkTransaction({
                                            data,
                                            success: async (rs) => {
                                                console.log('rs: ', rs);
                                                if (rs.resultCode === 0) {
                                                    console.log('Transaction successful:', rs);
                                                    setOrderId(rs.orderId);
                                                    setAppTransID(rs.transId);

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

                                                    // Cập nhật thông tin người dùng vào db User
                                                    // await userService.updateUser(userId, {
                                                    //     name: formData.fullName,
                                                    //     phoneNumber: formData.phone,
                                                    // });

                                                    const order: any = {
                                                        userId,
                                                        items: cartItems,
                                                        totalAmount,
                                                        shippingInfo: formData,
                                                        status: 'waiting',
                                                        paymentMethod: method
                                                    };

                                                    console.log('order', order);

                                                    const orderFB = await orderService.createOrder(order);

                                                    console.log('orderFB', orderFB);

                                                    // Clear all items from the user's cart
                                                    for (const item of cartItems) {
                                                        if (item.id) {
                                                            await cartService.removeFromCart(item.id);
                                                        }
                                                    }

                                                    await sendOrderConfirmation(order, orderFB.id);

                                                    notification.success({
                                                        message: 'Đặt hàng thành công',
                                                        description: 'Đơn hàng của bạn đã được tạo',
                                                        duration: 3,
                                                        placement: 'top',
                                                        closable: false
                                                    });
                                                    setLoading(false);

                                                    // await userService.updateUser(userId, { phoneNumber: formData.phone, name: formData.fullName });

                                                    navigate('/profile');

                                                    setTimeout(() => {
                                                        events.off(EventName.OnDataCallback);
                                                    }, 1000);

                                                    // Thanh toán đang được xử lý
                                                    return;
                                                } else {
                                                    console.log('Transaction not successful:', rs);
                                                }
                                            },
                                            fail: (err) => {
                                                console.log('Error in checkTransaction:', err);
                                                setLoading(false);
                                            },
                                        });
                                    }
                                }
                            });

                        }
                    }

                    else if (method === 'COD') {
                        console.log('method COD: ', method);

                        if (!pathAppOpen) {

                            events.on(EventName.OpenApp, async (data) => {
                                console.log('App opened:', data);
                                setLoading(true);

                                setPathAppOpen(data);
                                // notification.success({
                                //     message: 'Đặt hàng thành công',
                                //     description: 'Đơn hàng của bạn đã được tạo',
                                //     duration: 3,
                                //     placement: 'top',
                                //     closable: false
                                // });



                                // navigate('/profile');

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

                                // Cập nhật thông tin người dùng vào db User
                                // await userService.updateUser(userId, {
                                //     name: formData.fullName,
                                //     phoneNumber: formData.phone,
                                // });

                                const order: any = {
                                    userId,
                                    items: cartItems,
                                    totalAmount,
                                    shippingInfo: formData,
                                    status: 'waiting',
                                    paymentMethod: method,
                                    shippingFee: shippingFees?.fee
                                };

                                console.log('order', order);


                                const orderFB = await orderService.createOrder(order);

                                console.log('orderFB', orderFB);


                                // Clear all items from the user's cart
                                for (const item of cartItems) {
                                    if (item.id) {
                                        await cartService.removeFromCart(item.id);
                                    }
                                }

                                await sendOrderConfirmation(order, orderFB.id);

                                notification.success({
                                    message: 'Đặt hàng thành công',
                                    description: 'Đơn hàng của bạn đã được tạo',
                                    duration: 3,
                                    placement: 'top',
                                    closable: false
                                });
                                setLoading(false);

                                // await userService.updateUser(userId, { phoneNumber: formData.phone, name: formData.fullName });

                                navigate('/profile');


                                setTimeout(() => {
                                    events.off(EventName.OpenApp);
                                }, 1000);

                            });
                        }
                    }

                    events.on(EventName.AppClose, (data) => {

                        console.log('data app close: ', data);
                        console.log('resultCode app close: ', data?.resultCode);
                        setTimeout(() => {
                            setPathAppOpen(null);
                        }, 10000);


                    });

                    events.on(EventName.WebviewClosed, (data) => {

                        setTimeout(() => {
                            setPathAppOpen(null);
                        }, 10000);

                        console.log('data webview closed: ', data);
                        console.log('resultCode webview closed: ', data?.resultCode);
                    });

                },
                fail: (error) => {
                    console.error('Failed to create order:', error);
                    notification.error({
                        message: 'Lỗi',
                        description: 'Không thể tạo đơn hàng',
                        duration: 3,
                        placement: 'top',
                        closable: false
                    });
                    setLoading(false);
                }
            });

            // handleCheckOrderStatus(orderId);


        } catch (error) {
            console.error('Error in handleCreateOrder:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Có lỗi xảy ra khi xử lý thanh toán',
                duration: 3,
                placement: 'top',
                closable: false
            });
            setLoading(false);
        }
    };

    // const handleCheckOrderStatus = async (orderId: string) => {
    //     try {
    //         console.log('orderId', orderId);


    //         const appId = '1410152383611769410';
    //         const privateKey = '6b81f2bf5493e12ff2051fe5e5efc2c6';

    //         // Create data string for MAC calculation
    //         const data = `appId=${appId}&orderId=${orderId}&privateKey=${privateKey}`;

    //         console.log('data', data);

    //         // Calculate HMAC
    //         const mac = CryptoJS.HmacSHA256(data, privateKey).toString();

    //         console.log('mac', mac);
    //         // Make API call with calculated MAC
    //         const response = await axios.get(`https://payment-mini.zalo.me/api/transaction/get-status`, {
    //             params: {
    //                 orderId: orderId,
    //                 appId: appId,
    //                 mac: mac
    //             }
    //         });

    //         console.log('response', response.data);
    //     } catch (error) {
    //         console.error('error', error);
    //     }
    // }

    // const handleCheckOrderStatusInterval = () => {
    //     // events.on(EventName.OnDataCallback, (resp) => {
    //     //     const { eventType, data } = resp;
    //     //     console.log('eventType: ', eventType);
    //     //     console.log('data: ', data);
    //     //     if (eventType === "PAY_BY_BANK") {
    //     //         if (data.appTransID) {
    //     const data = {
    //         appTransID: appTransID,
    //     }
    //     Payment.checkTransaction({
    //         data: data,
    //         success: (rs) => {
    //             console.log('rs: ', rs);
    //             if (rs.resultCode === 0) {
    //                 console.log('Transaction successful:', rs);
    //                 // Thanh toán đang được xử lý

    //             } else {
    //                 console.log('Transaction not successful:', rs);
    //             }
    //         },
    //         fail: (err) => {
    //             console.log('Error in checkTransaction:', err);
    //         },
    //     });
    //     // });
    // }

    // Hàm tính khoảng cách bằng công thức Haversine
    // const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    //     const R = 6371; // Bán kính Trái đất tính bằng km
    //     const dLat = (lat2 - lat1) * Math.PI / 180;
    //     const dLon = (lon2 - lon1) * Math.PI / 180;
    //     const a =
    //         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //         Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    //         Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //     return R * c; // Khoảng cách tính bằng km
    // };

    // Hàm làm tròn số tiền lên đơn vị nghìn
    // const roundToThousand = (amount: number) => {
    //     return Math.ceil(amount / 1000) * 1000;
    // };

    // // Cập nhật hàm tính phí giao hàng
    // const calculateShippingFee = (distanceInKm: number) => {
    //     if (!shippingConfig) {
    //         return 25000; // Default fallback fee
    //     }
    //     return shippingConfigService.calculateShippingFee(distanceInKm, shippingConfig);
    // };

    // Hàm lấy tọa độ từ địa chỉ sử dụng Nominatim API
    const getCoordinates = async (address: string) => {
        // try {
        //     const response = await axios.get(
        //         `https://nominatim.openstreetmap.org/search`,
        //         {
        //             params: {
        //                 q: address,
        //                 format: 'json',
        //                 limit: 1
        //             },
        //             headers: {
        //                 'User-Agent': '8amCoffee/1.0' // Thay bằng tên ứng dụng của bạn
        //             }
        //         }
        //     );

        //     if (response.data && response.data[0]) {
        //         return {
        //             lat: parseFloat(response.data[0].lat),
        //             lon: parseFloat(response.data[0].lon)
        //         };
        //     }
        //     return null;
        // } catch (error) {
        //     console.error('Error getting coordinates:', error);
        //     return null;
        // }

        try {
            const response = await axios.get(
                `https://rsapi.goong.io/geocode`,
                {
                    params: {
                        address,
                        api_key: 'ukMOx7DOpbgqqXs0r4ZDtPWshyLzOZ3WMBAhA8Ea',
                    },

                }
            );

            if (response && response.data && response.data.results && response.data.results[0]) {
                console.log('response', response);
                return {
                    lat: response.data.results[0].geometry.location.lat,
                    lon: response.data.results[0].geometry.location.lng
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }

    };

    // const getDistanceMatrix = async (origin: string, destination: string) => {
    //     try {
    //         const response = await axios.get("https://rsapi.goong.io/DistanceMatrix", {
    //             params: {
    //                 origins: origin,
    //                 destinations: destination,
    //                 api_key: 'ukMOx7DOpbgqqXs0r4ZDtPWshyLzOZ3WMBAhA8Ea',
    //             },
    //         });

    //         return response.data;
    //     } catch (error) {
    //         console.error('Error getting distance:', error);
    //         return null;
    //     }
    // }

    // Hàm tính khoảng cách và phí giao hàng
    const calculateDistance = async () => {
        if (!isAddressComplete()) {
            return;
        }

        setLoadingDistance(true);
        const deliveryAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}, Việt Nam`;

        console.log('deliveryAddress', deliveryAddress);

        try {
            const coordinates = await getCoordinates(deliveryAddress);

            console.log('coordinates', coordinates);

            const customerAddress = {
                address: deliveryAddress,
                province: formData.province,
                district: formData.district,
                ward: formData.ward,
            }

            const feePromises = shippingConfig?.storeLocations.map(async (store) => {
                const response = await axios.post('https://api-coffee.8am.vn/api/shipping/calculate-shipping-fee', {
                    customerAddress,
                    storeAddress: store
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const baseFee = response.data.fee.ship_fee_only;
                let surcharge = 0;
                let discount = 0;
                let finalFee = baseFee;

                // Tính phụ phí nếu có
                if (shippingConfig?.enableSurcharge && shippingConfig?.surchargeAmount) {
                    surcharge = shippingConfig.surchargeAmount;
                    finalFee += surcharge;
                }

                // Tính giảm phí nếu có
                if (shippingConfig?.enableFeeDiscount && shippingConfig?.feeDiscountAmount) {
                    discount = shippingConfig.feeDiscountAmount;
                    finalFee -= discount;
                }

                return {
                    storeId: store.id || '',
                    shortStoreAddress: store.address,
                    storeAddress: `${store.street}, ${store.ward}, ${store.district}, ${store.province}`,
                    baseFee: baseFee,
                    surcharge: surcharge,
                    discount: discount,
                    fee: finalFee,
                    distance: response.data.fee.distance
                };
            }) || [];

            const results = await Promise.all(feePromises);

            // Chỉ lấy cửa hàng có phí ship thấp nhất
            if (results.length > 0) {
                const lowestFeeStore = results.reduce((prev, curr) =>
                    prev.fee < curr.fee ? prev : curr
                );
                console.log('lowestFeeStore', lowestFeeStore);


                setShippingFees(lowestFeeStore); // Chỉ lưu cửa hàng có phí thấp nhất
            }

            setLoadingDistance(false);
        } catch (error) {
            console.error('Error calculating distance:', error);
            setLoadingDistance(false);
        }
    };

    // Add this new function to handle store selection
    const handleStoreSelect = (storeId: string) => {
        setSelectedStoreId(storeId);
    };

    // const handleConfirmStore = (storeId: string) => {
    //     const selectedStore = shippingFees.find(store => store.storeId === storeId);
    //     if (selectedStore) {
    //         setShippingFee(selectedStore.fee);
    //         notification.success({
    //             message: 'Đã chọn cửa hàng',
    //             description: `Đã chọn cửa hàng ${selectedStore.shortStoreAddress} với phí ship ${selectedStore.fee.toLocaleString('vi-VN')}đ`,
    //         });
    //     }
    // };

    // Component hiển thị thông tin giao hàng
    const ShippingDisplay = () => (
        <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
                <img src={ShipIcon} alt="Ship" className="w-6 h-6" />
                <span>Giao hàng tận nơi</span>
            </div>

            {loadingDistance ? (
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                    <span className="ml-2">Đang tính toán khoảng cách...</span>
                </div>
            ) : isAddressComplete() && shippingFees ? (
                <div className="space-y-4">
                    <div
                        key={shippingFees.storeId}
                        className={`p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${selectedStoreId === shippingFees.storeId ? 'border-2 border-orange-500' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <div className="text-sm text-gray font-bold">{shippingFees.shortStoreAddress}</div>
                                <div className="text-sm text-gray-600">{shippingFees.storeAddress}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-gray-600">
                                        Khoảng cách: {shippingFees.distance.toFixed(1)} km
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <div className="text-sm text-gray-600 flex justify-between">
                                        <span>Phí giao hàng cơ bản:</span>
                                        <span>{shippingFees.baseFee.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {shippingFees.surcharge > 0 && (
                                        <div className="text-sm text-gray-600 flex justify-between">
                                            <span>Phụ phí:</span>
                                            <span>+{shippingFees.surcharge.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {shippingFees.discount > 0 && (
                                        <div className="text-sm text-orange-500 flex justify-between">
                                            <span>Giảm phí:</span>
                                            <span>-{shippingFees.discount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className="text-base font-medium text-orange-500 flex justify-between border-t border-gray-200 pt-1 mt-1">
                                        <span>Tổng phí ship:</span>
                                        <span>{shippingFees.fee.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500">
                    Vui lòng nhập đầy đủ địa chỉ để tính phí vận chuyển
                </div>
            )}
        </div>
    );

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
                        zIndex: 1000,
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
                    {totalAmount ? totalAmount.toLocaleString() : 0}đ ({cartItems.length} sản phẩm)
                    {showCartItems ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>
            {showCartItems && (
                <div className={`mt-2 ml-2 mr-4 transition-all duration-300 ${showCartItems ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                    {cartItems.map((item: any, index: number) => (
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
                        <div className="p-4 rounded-lg bg-gray-100 flex items-center gap-2"
                            onClick={() => setIsPaymentModalVisible(true)}
                        >

                            {
                                formData.paymentMethod === 'COD' && <img src={PayIcon} className='w-6 h-6' />
                            }

                            {
                                formData.paymentMethod === 'BANK' && <BsBank className='w-6 h-6' />
                            }

                            {
                                formData.paymentMethod === 'ZALOPAY' && <img src={ZaloPayIcon} alt="ZaloPay" className="w-6 h-6" />
                            }

                            {/* {
                                formData.paymentMethod === 'MOMO' && <img src={MomoIcon} alt="Momo" className="w-6 h-6" />
                            }

                            {
                                formData.paymentMethod === 'APPLEPAY' && <img src={ApplePayIcon} alt="Apple Pay" className="w-6 h-6" />
                            }

                            {
                                formData.paymentMethod === 'CARD' && <img src={CardIcon} alt="Card" className="w-6 h-6" />
                            } */}


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
                                    <BsBank className='w-6 h-6' />
                                    <span>Thanh toán qua chuyển khoản</span>
                                </div>

                                <div
                                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer hover:border-orange-500"
                                    onClick={() => handlePaymentMethodChange('ZALOPAY')}
                                >
                                    <img src={ZaloPayIcon} alt="ZaloPay" className="w-6 h-6" />
                                    <span>Thanh toán qua ZaloPay</span>
                                </div>
                            </div>
                        </Modal>
                    </div>

                    {formData.paymentMethod === 'COD' && (
                        <div className="space-y-2">
                            <div className="text-xl font-bold mb-2">Vận chuyển</div>
                            <ShippingDisplay />
                        </div>
                    )}

                    {/* <div className="space-y-2">
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

                    {/* <button
                        type="button"
                        className="w-full bg-orange-500 text-white py-4 rounded-lg font-medium disabled:bg-gray-400"
                        onClick={() => handleCheckOrderStatus('836205263298110024614328830_1738832207522')}>
                        Kiểm tra trạng thái
                    </button> */}
                </form>
            </div>

            {/* Add Shipping Information Section */}

        </div>
    );
};

export default Order;