import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaQrcode } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { CoffeeBean } from "../types/coffee";
import { getAccessToken } from "zmp-sdk/apis";
import CoffeeCard from "../components/coffee-card";
import CoffeeSkeleton from "../components/CoffeeSkeleton";
import { useStorageImages } from "../hooks/useStorageImages";
import CollectionCard from "../components/collection-card";
import { collectionService } from "../firebase/collectionService";
import { CoffeeCollection } from "../types/collection";
import { Button, notification } from "antd";
import zmpSdk, { events, EventName, getUserID, Payment } from "zmp-sdk";
import axios from "axios";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";
import { userService } from "../firebase/userService";
import { homeService } from "../firebase/homeService";
import { HomeItem } from "../types/home";
import NotificationBell from "../components/NotificationBell";
import { configService } from "../firebase/configService";
import BraintreeGooglePay from "../components/BraintreeGooglePay";
import { shippingConfigService } from "../firebase/shippingConfigService";
import QRScanner from "../components/QRScanner";
import { QRPaymentData } from '../types/qr';
import { addressService } from "services/addressService";
import CryptoJS from 'crypto-js';
import { User } from '../types/user';
import { DishService } from "../firebase/dishService";
import DishCard from "../components/dish-card";
import { Dish } from "../types/dish";
import { StoreMenuService } from "../services/storeMenuService";
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";
import { SelectedStoreService } from "../services/selectedStoreService";
import { useCartCount } from "../hooks/useCartCount";
import StoreChangeNotification from "../components/StoreChangeNotification";
import { provinceService } from "../firebase/provinceService";
import { wardService } from "../firebase/wardService";

interface ZaloUser {
    user_id: string;
    user_id_by_app: string;
    display_name: string;
    avatar: string;
    // thêm các trường khác nếu cần
}

interface ZaloUserDetail {
    user_id: string;
    display_name: string;
    shared_info?: {
        name?: string;
        phone?: string;
    };
}

const HomePage = () => {

    const { error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [lstCollection, setLstCollection] = useState<CoffeeCollection[]>([]);
    const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
    const [lstDishes, setLstDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>();
    const cartItemCount = useCartCount(userInfo?.id);
    const [homeItems, setHomeItems] = useState<HomeItem[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [clientToken, setClientToken] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [appTransID, setAppTransID] = useState('');
    const [pathAppOpen, setPathAppOpen] = useState(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [storeDataLoading, setStoreDataLoading] = useState(true);
    
    const dishService = new DishService();

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        // Lấy thông tin cửa hàng đã chọn
        const store = SelectedStoreService.getSelectedStore();
        setSelectedStore(store);
        
        // Preload products nếu chưa có
        OptimizedStoreMenuService.preloadAllProducts();
        
        // Kiểm tra user info
        await checkLocal();
        
        // Load dữ liệu
        await loadData();
    };

    const loadData = async () => {
        setStoreDataLoading(true);
        try {
            // Load home items và collection trước
            await getHomeItems();
            await getLstCollection();
            
            // Load dữ liệu theo cửa hàng (sử dụng optimized service)
            const storeItems = await OptimizedStoreMenuService.getAllItemsForSelectedStore();
            setLstCoffee(storeItems.coffees);
            setLstBottledDrink(storeItems.bottledDrinks);
            setLstDishes(storeItems.dishes);
            
        } catch (error) {
            console.error('Error loading store data:', error);
            // Fallback: load tất cả dữ liệu nếu có lỗi
            await loadAllData();
        } finally {
            setStoreDataLoading(false);
        }
    };

    const loadAllData = async () => {
        setStoreDataLoading(true);
        try {
            await getHomeItems();
            await getLstCoffee();
            await getLstCollection();
            await getLstBottledDrink();
            await getLstDishes();
        } finally {
            setStoreDataLoading(false);
        }
    };

    useEffect(() => {
        getAccessToken().then((token) => {
            console.log(token);
        });
    }, []);

    useEffect(() => {
        if (lstCoffee.length > 0 && lstBottledDrink.length > 0 && lstDishes.length > 0) {
            setLoading(false);
        }
    }, [lstCoffee, lstBottledDrink, lstDishes]);

    useEffect(() => {
        // console.log('clientToken', clientToken);
    }, [clientToken]);


    // const getBraintreeToken = async () => {
    //     try {
    //         const response = await axios.get('https://api-coffee.8am.vn/api/payment/braintree/token');
    //         console.log('Braintree token response:', response.data);
    //         setClientToken(response.data.clientToken);
    //         return response.data;
    //     } catch (error) {
    //         console.warn('Failed to get Braintree token:', error);
    //         // Silently fail - we'll handle this when actually needed for payments
    //         return null;
    //     }
    // }

    // const handlePaymentMethodReceived = (paymentMethod: any) => {
    //     console.log('Payment method received:', paymentMethod);
    //     // Xử lý thanh toán ở đây
    // };

    const checkLocal = async () => {
        // const idUser = localStorage.getItem('idUser');
        const userId = await getUserID();

        const user = await userService.getUserByLocalId(userId);

        if (user) {
            setUserInfo(user);
        }
    };


    const getLstCoffee = async () => {
        const lstCoffee = await coffeeService.getAllCoffees();
        console.log('lstCoffee', lstCoffee);
        setLstCoffee(lstCoffee);
    }

    const handleLoginSuccess = () => {
        getLstCoffee();
        // Cart count will auto-update via hook
    };

    const getLstCollection = async () => {
        const lstCollection = await collectionService.getAllCollections();
        setLstCollection(lstCollection);
    }

    const getLstBottledDrink = async () => {
        const lstBottledDrink = await bottledDrinkService.getAllBottledDrinks();
        console.log('lstBottledDrink', lstBottledDrink);

        setLstBottledDrink(lstBottledDrink);
    }

    const getLstDishes = async () => {
        try {
            const dishes = await dishService.getAllDishes();
            console.log('lstDishes', dishes);
            setLstDishes(dishes);
        } catch (error) {
            console.error('Error fetching dishes:', error);
        }
    }

    const deleteUser = async () => {
        localStorage.clear();

        await userService.deleteUser('gstSQhLOtQXLJ920GQtn')
            .then((req) => {
                console.log('User deleted successfully', req);
            })
            .catch((error) => {
                console.error('Could not delete user:', error);
            });
    }

    const getHomeItems = async () => {
        try {
            const items = await homeService.getAllHomeItems();
            setHomeItems(items.filter(item => item.isVisible));
        } catch (error) {
            console.error("Error fetching home items:", error);
        }
    };

    const renderItem = (item: HomeItem) => {
        switch (item.type) {
            case 'collection':
                const collection = lstCollection.find(c => c.id === item.itemId);
                return collection ? (
                    <CollectionCard
                        key={item.id}
                        collection={collection}
                    />
                ) : null;
            case 'coffee':
                const coffee: any = lstCoffee.find(c => c.id === item.itemId);
                return coffee ? (
                    <CoffeeCard
                        key={item.id}
                        {...coffee}
                        onLoginSuccess={handleLoginSuccess}
                        userInfo={userInfo}
                    />
                ) : null;
            case 'drink':
                const drink: any = lstBottledDrink.find(d => d.id === item.itemId);
                return drink ? (
                    <BottledDrinkCard
                        key={item.id}
                        {...drink}
                        onLoginSuccess={handleLoginSuccess}
                        userInfo={userInfo}
                    />
                ) : null;
            case 'dish':
                const dish: any = lstDishes.find(d => d.id === item.itemId);
                return dish ? (
                    <DishCard
                        key={item.id}
                        {...dish}
                        onLoginSuccess={handleLoginSuccess}
                        userInfo={userInfo}
                    />
                ) : null;
            default:
                return null;
        }
    };

    const getLstTag = async () => {
        try {
            const newConfigZalo = await configService.getConfig();
            const response = await axios.get('https://openapi.zalo.me/v2.0/oa/tag/gettagsofoa', {
                headers: {
                    'access_token': newConfigZalo?.access_token_zalo
                }
            });
            console.log('Tags:', response.data);

            const lstTag = response.data.data;

            console.log('lstTag', lstTag);

            // // Có thể xử lý response data ở đây nếu cần
            // if (response.data.error === 0) {
            //     // Xử lý dữ liệu tags thành công
            //     return response.data.data;
            // } else {
            //     throw new Error(response.data.message);
            // }
        } catch (error) {
            console.error('Error fetching tags:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy danh sách tag'
            });
        }
    };

    const tagUser = async () => {
        try {
            const newConfigZalo = await configService.getConfig();
            const response = await axios.post(
                'https://openapi.zalo.me/v2.0/oa/tag/tagfollower',
                {
                    user_id: "1077633510330786185",
                    tag_name: "Quan tâm"
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'access_token': newConfigZalo?.access_token_zalo
                    }
                }
            );

            if (response.data.error === 0) {
                notification.success({
                    message: 'Thành công',
                    description: 'Đã gán nhãn cho người dùng thành công',
                    duration: 5,
                    placement: 'topRight'

                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error tagging user:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể gán nhãn cho người dùng'
            });
        }
    };

    const getAllUsers = async () => {
        try {
            const newConfigZalo = await configService.getConfig();
            let offset = 0;
            const count = 50; // số lượng user tối đa cho mỗi request
            let hasMore = true;
            let allUsers: ZaloUser[] = [];

            while (hasMore) {
                const response = await axios.get(
                    `https://openapi.zalo.me/v3.0/oa/user/getlist?data=${JSON.stringify({
                        offset,
                        count,
                        is_follower: "true"
                    })}`,
                    {
                        headers: {
                            'access_token': newConfigZalo?.access_token_zalo
                        }
                    }
                );

                if (response.data.error === 0) {
                    const users = response.data.data.users;
                    allUsers = [...allUsers, ...users];

                    // Kiểm tra xem còn user để lấy không
                    if (users.length < count) {
                        hasMore = false;
                    } else {
                        offset += count;
                    }

                    console.log(`Đã lấy ${allUsers.length} người dùng`);
                } else {
                    throw new Error(response.data.message);
                }
            }

            setAllUsers(allUsers);
            notification.success({
                message: 'Thành công',
                description: `Đã lấy ${allUsers.length} người dùng`,
                duration: 5,
                placement: 'topRight'
            });

        } catch (error) {
            console.error('Error fetching users:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy danh sách người dùng',
                duration: 5,
                placement: 'topRight'
            });
        }
    };

    const updateUserZaloId = async (user: any) => {
        try {
            const newConfigZalo = await configService.getConfig();
            // Lấy chi tiết người dùng từ Zalo API
            const response = await axios.get(
                `https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${user.user_id}"}`,
                {
                    headers: {
                        'access_token': newConfigZalo?.access_token_zalo
                    }
                }
            );

            console.log('response', response.data);

            if (response.data.error === 0) {
                const zaloUserDetail: ZaloUserDetail = response.data.data;
                const name = zaloUserDetail.display_name;

                // Tìm user trong Firebase có cùng tên và số điện thoại
                const firebaseUsers: any = await userService.getUsersByName(name);

                console.log('firebaseUsers', firebaseUsers);


                for (const fbUser of firebaseUsers) {
                    // if (fbUser.phoneNumber === phone && !fbUser.zaloApiId) {
                    // Cập nhật zaloApiId cho user trong Firebase
                    await userService.updateUser(fbUser.id, {
                        ...fbUser,
                        zaloUserId: zaloUserDetail.user_id
                    });
                    console.log(`Đã cập nhật zaloApiId cho user ${name}`);
                    // }
                }
            }
        } catch (error) {
            console.error('Error updating user zalo id:', error);
        }
    };

    const syncAllUsersZaloId = async () => {
        try {
            if (allUsers.length === 0) {
                notification.warning({
                    message: 'Chưa có dữ liệu',
                    description: 'Vui lòng lấy danh sách người dùng trước',
                    duration: 5,
                    placement: 'topRight'
                });
                return;
            }

            notification.info({
                message: 'Đang xử lý',
                description: 'Đang cập nhật zaloApiId cho người dùng...',
                duration: 0,
                placement: 'topRight',
                key: 'sync-progress'
            });

            // await updateUserZaloId('7677597454271532329');



            // for (const user of allUsers) {
            //     await updateUserZaloId(user);
            // }

            const lstUser = await userService.getAllUsers();

            console.log('lstUser', lstUser);
            for (const user of lstUser) {
                await updateUserZaloId(user);
            }

            notification.success({
                message: 'Thành công',
                description: 'Đã cập nhật xong zaloApiId cho người dùng',
                duration: 5,
                placement: 'topRight',
                key: 'sync-progress'
            });

        } catch (error) {
            console.error('Error syncing users:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể cập nhật zaloApiId cho người dùng',
                duration: 5,
                placement: 'topRight',
                key: 'sync-progress'
            });
        }
    };

    const getUserDetail = async () => {
        try {
            const newConfigZalo = await configService.getConfig();
            const response = await axios.get(
                `https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"8948448436023687306"}`,
                {
                    headers: {
                        'access_token': newConfigZalo?.access_token_zalo
                    }
                }
            );

            console.log('User Detail:', response.data);

            if (response.data.error === 0) {
                notification.success({
                    message: 'Thành công',
                    description: 'Đã lấy thông tin người dùng thành công',
                    duration: 5,
                    placement: 'topRight'
                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error getting user detail:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy thông tin người dùng',
                duration: 5,
                placement: 'topRight'
            });
        }
    };

    const tagAllVIPUsers = async () => {
        try {
            notification.info({
                message: 'Đang xử lý',
                description: 'Đang gán nhãn cho các hội viên...',
                duration: 0,
                placement: 'topRight',
                key: 'tagging-progress'
            });

            // Lấy tất cả users từ Firebase
            const allFirebaseUsers = await userService.getAllUsers();
            let taggedCount = 0;

            // Lọc ra những user đã là hội viên (đã follow và có số điện thoại)
            const vipUsers: any = allFirebaseUsers.filter((user: any) =>
                user.isFollowed &&
                user.phoneNumber
            );

            // Gán nhãn cho từng user
            for (const user of vipUsers) {
                try {

                    // Skip users with type TELEGRAM
                    if (user.type === 'TELEGRAM') {
                        console.log(`Bỏ qua user ${user.name} vì là user Telegram`);
                        continue;
                    }

                    const newConfigZalo = await configService.getConfig();
                    const response = await axios.post(
                        'https://openapi.zalo.me/v2.0/oa/tag/tagfollower',
                        {
                            user_id: user.localId,
                            tag_name: "Hội viên"
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'access_token': newConfigZalo?.access_token_zalo
                            }
                        }
                    );

                    if (response.data.error === 0) {
                        taggedCount++;
                        console.log(`Đã gán nhãn cho user ${user.name}`);
                    }
                } catch (error) {
                    console.error(`Lỗi khi gán nhãn cho user ${user.name}:`, error);
                }
            }

            notification.success({
                message: 'Thành công',
                description: `Đã gán nhãn cho ${taggedCount}/${vipUsers.length} hội viên`,
                duration: 5,
                placement: 'topRight',
                key: 'tagging-progress'
            });

        } catch (error) {
            console.error('Lỗi khi gán nhãn hội viên:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể gán nhãn cho hội viên',
                duration: 5,
                placement: 'topRight',
                key: 'tagging-progress'
            });
        }
    };

    const tagAllFollowedUsers = async () => {
        try {
            notification.info({
                message: 'Đang xử lý',
                description: 'Đang gán nhãn cho các hội viên...',
                duration: 0,
                placement: 'topRight',
                key: 'tagging-progress'
            });

            // Lấy tất cả users từ Firebase
            const allFirebaseUsers = await userService.getAllUsers();
            let taggedCount = 0;

            // Lọc ra những user đã là hội viên (đã follow và có số điện thoại)
            const vipUsers: any = allFirebaseUsers.filter((user: any) =>
                user.isFollowed && !user.phoneNumber
            );

            // Gán nhãn cho từng user
            for (const user of vipUsers) {
                try {
                    // Skip users with type TELEGRAM
                    if (user.type === 'TELEGRAM') {
                        console.log(`Bỏ qua user ${user.name} vì là user Telegram`);
                        continue;
                    }

                    const newConfigZalo = await configService.getConfig();
                    const response = await axios.post(
                        'https://openapi.zalo.me/v2.0/oa/tag/tagfollower',
                        {
                            user_id: user.localId,
                            tag_name: "Quan tâm"
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'access_token': newConfigZalo?.access_token_zalo
                            }
                        }
                    );

                    if (response.data.error === 0) {
                        taggedCount++;
                        console.log(`Đã gán nhãn cho user ${user.name}`);
                    }
                } catch (error) {
                    console.error(`Lỗi khi gán nhãn cho user ${user.name}:`, error);
                }
            }

            notification.success({
                message: 'Thành công',
                description: `Đã gán nhãn cho ${taggedCount}/${vipUsers.length} hội viên`,
                duration: 5,
                placement: 'topRight',
                key: 'tagging-progress'
            });

        } catch (error) {
            console.error('Lỗi khi gán nhãn hội viên:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể gán nhãn cho hội viên',
                duration: 5,
                placement: 'topRight',
                key: 'tagging-progress'
            });
        }
    };

    const calculateShippingFee = async () => {

        const customerAddress = {
            address: '123 Đường Trần Hưng Đạo, Quận 1, Hồ Chí Minh, Việt Nam',
            province: 'Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
        }

        const storeAddress = {
            address: '123 Đường Trần Hưng Đạo, Quận 1, Hồ Chí Minh, Việt Nam',
            province: 'Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
        }

        const fee = await axios.post('https://api-coffee.8am.vn/api/shipping/calculate-shipping-fee', {
            customerAddress,
            storeAddress
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('fee', fee.data.fee);

        // {
        //     "name": "area1",
        //     "fee": 20000,
        //     "insurance_fee": 0,
        //     "include_vat": 0,
        //     "cost_id": 0,
        //     "delivery_type": "",
        //     "a": 1,
        //     "dt": "local",
        //     "extFees": [],
        //     "promotion_key": "",
        //     "delivery": true,
        //     "ship_fee_only": 20000,
        //     "distance": 0,
        //     "options": {
        //         "name": "",
        //         "title": "",
        //         "shipMoney": 20000,
        //         "shipMoneyText": "20.000 đ",
        //         "vatText": "",
        //         "desc": "",
        //         "coupon": "",
        //         "maxUses": 0,
        //         "maxDates": 0,
        //         "maxDateString": "",
        //         "content": "",
        //         "activatedDate": "",
        //         "couponTitle": "",
        //         "discount": "",
        //         "couponId": 0
        //     }
        // }
    }

    const handleScanQR = () => {
        setShowScanner(true);
    };

    const handleScanSuccess = (decodedText: string, decodedData?: QRPaymentData) => {
        try {
            if (decodedData) {
                const privateKey = '6b81f2bf5493e12ff2051fe5e5efc2c6';

                if (!privateKey) {
                    throw new Error('Private key is not defined');
                }


                const amountPrice = decodedData.amount

                // Tách mã đơn hàng từ additionalData (format: "081187170 B9O12")
                const additionalData = decodedData.additionalData || '';
                const orderCode = additionalData.split(' ').length > 1
                    ? additionalData.split(' ')[1]
                    : additionalData;
                console.log('Extracted order code:', orderCode); // Log để debug

                const orderData = {
                    desc: `${decodedData.additionalData}`,
                    item: [{
                        id: decodedData.additionalData,
                        amount: amountPrice
                    }],
                    amount: amountPrice,
                    method: JSON.stringify(
                        {
                            id: "BANK",
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

                        if (!pathAppOpen) {
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
                                                    setPathAppOpen(data);

                                                    setLoading(false);

                                                    notification.success({
                                                        message: 'Thành công',
                                                        description: 'Thanh toán thành công',
                                                        duration: 3,
                                                        placement: 'top',
                                                        closable: false
                                                    });

                                                    const userId = await getUserID();
                                                    const user: any = await userService.getUserByLocalId(userId);
                                                    console.log('user', user);
                                                    // Tạo mã đơn hàng mới với thời gian
                                                    const newOrderCode = {
                                                        code: orderCode,
                                                        time: new Date()
                                                    };

                                                    // Lấy danh sách mã đơn hàng hiện tại hoặc tạo mới nếu chưa có
                                                    const currentList = user?.listOrderCodes || [];

                                                    // Kiểm tra xem mã đơn hàng đã tồn tại chưa
                                                    const isOrderCodeExists = currentList.some(item => item.code === orderCode);

                                                    // Chỉ thêm vào nếu chưa tồn tại
                                                    if (!isOrderCodeExists) {
                                                        const updatedList = [...currentList, newOrderCode];
                                                        await userService.updateUserByLocalId(userId, {
                                                            listOrderCodes: updatedList
                                                        });
                                                    }

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

                        events.on(EventName.AppClose, (data) => {

                            console.log('data app close: ', data);
                            console.log('resultCode app close: ', data?.resultCode);

                            setTimeout(() => {
                                setPathAppOpen(null);
                            }, 10000);

                            setShowScanner(false);

                            // window.location.reload();
                            return;
                        });

                        events.on(EventName.WebviewClosed, (data) => {

                            console.log('data webview closed: ', data);
                            console.log('resultCode webview closed: ', data?.resultCode);

                            setTimeout(() => {
                                setPathAppOpen(null);
                            }, 10000);

                            setShowScanner(false);

                            // window.location.reload();
                            return;
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
            }

            return;

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

    const handleScanError = (error: any) => {
        console.error('Error scanning QR code:', error);
        // notification.error({
        //     message: 'Lỗi',
        //     description: 'Không thể quét mã QR',
        //     duration: 5,
        //     placement: 'topRight'
        // });
    };

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

    const clearLocalStorage = () => {
        try {
            localStorage.clear();
            notification.success({
                message: 'Thành công',
                description: 'Đã xóa hết dữ liệu localStorage',
                duration: 3,
                placement: 'top',
                closable: false
            });
            // Reload lại trang để reset state
            window.location.reload();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể xóa localStorage',
                duration: 3,
                placement: 'top',
                closable: false
            });
        }
    };

    const handleAddProvinces = async () => {
        try {
            await provinceService.addProvinces();
            notification.success({
                message: 'Thành công',
                description: 'Đã thêm dữ liệu tỉnh/thành phố vào Firebase',
                duration: 5,
                placement: 'topRight'
            });
        } catch (error) {
            console.error('Error adding provinces:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể thêm dữ liệu tỉnh/thành phố',
                duration: 5,
                placement: 'topRight'
            });
        }
    };

    const handleAddWards = async () => {
        try {
            await wardService.addWards();
            notification.success({
                message: 'Thành công',
                description: 'Đã thêm dữ liệu phường/xã vào Firebase',
                duration: 5,
                placement: 'topRight'
            });
        } catch (error) {
            console.error('Error adding wards:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể thêm dữ liệu phường/xã',
                duration: 5,
                placement: 'topRight'
            });
        }
    };

    return (
        <div className="p-4 mb-10 bg-white pt-8"
            style={{
                paddingBottom: '50px'
            }}
        >
            <StoreChangeNotification userId={userInfo?.id} />
            <div className="mb-4 flex justify-between items-center relative">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Hôm nay
                    </div>
                    <div className="text-8am-middle-grey text-xl font-bold">
                        Mới và hot
                    </div>
                    {selectedStore && (
                        <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-600 mr-2">Cửa hàng:</span>
                            <span className="text-sm font-medium text-orange-600">{selectedStore.name}</span>
                            <button 
                                onClick={() => navigate('/store-selection')}
                                className="ml-2 text-xs text-blue-500 underline"
                            >
                                Thay đổi
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center fixed"
                    style={{
                        top: '50px',
                        right: '105px',
                        zIndex: 1000
                    }}
                >
                    {/* <NotificationBell userId={userInfo?.id} /> */}
                    <div className="relative" onClick={() => navigate('/cart')}>
                        <FaShoppingCart className="h-6 w-6 text-8am-white bg-8am-gray rounded-full p-1" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 w-5 flex items-center justify-center text-xs">
                            {cartItemCount}
                        </span>
                    </div>
                </div>
            </div>

            {storeDataLoading ? (
                <div className="flex flex-wrap gap-4">
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                </div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                    {homeItems.map((item) => renderItem(item))}
                </div>
            )}

            {/* <Button 
                type="primary" 
                className="w-full mt-4" 
                onClick={handleAddProvinces}
            >
                Thêm dữ liệu tỉnh/thành phố
            </Button>

            <Button 
                type="primary" 
                className="w-full mt-4" 
                onClick={handleAddWards}
            >
                Thêm dữ liệu phường/xã
            </Button> */}

            {/* <Button type="primary" className="w-full mt-4" onClick={calculateShippingFee}>  
                Tính phí vận chuyển
            </Button> */}

            {/* {clientToken && (
                <BraintreeGooglePay
                    clientToken={clientToken}
                    onPaymentMethodReceived={handlePaymentMethodReceived}
                />
            )} */}

            {/* <Button 
                type="primary" 
                danger
                className="w-full mt-4" 
                onClick={clearLocalStorage}
            >
                Xóa hết localStorage
            </Button> */}

            {/* <Button type="primary" className="w-full mt-4" onClick={deleteUser}>
                Xóa người dùng
            </Button> */}

            {/* <Button type="primary" className="w-full mt-4" onClick={() => navigate('/authorize')}>
                Authorize
            </Button> */}

            {/* <Button type="primary" className="w-full mt-4" onClick={getLstTag}>
                Lấy danh sách nhãn
            </Button>

            <Button type="primary" className="w-full mt-4" onClick={tagUser}>
                Gán nhãn người dùng
            </Button>

            <Button type="primary" className="w-full mt-4" onClick={getUserDetail}>
                Lấy chi tiết người dùng
            </Button>

            <Button type="primary" className="w-full mt-4" onClick={getAllUsers}>
                Lấy danh sách người dùng
            </Button>

            <Button type="primary" className="w-full mt-4" onClick={tagAllVIPUsers}>
                Gán nhãn tất cả hội viên
            </Button>

            <Button type="primary" className="w-full mt-4" onClick={tagAllFollowedUsers}>
                Gán nhãn tất cả người theo dõi
            </Button>

            <Button
                type="primary"
                className="w-full mt-4"
                onClick={syncAllUsersZaloId}
                disabled={allUsers.length === 0}
            >
                Đồng bộ Zalo ID
            </Button> */}

            {/* {allUsers.length > 0 && (
                <div className="mt-4">
                    <h3>Tổng số người dùng: {allUsers.length}</h3>
                    <div className="max-h-60 overflow-auto">
                        {allUsers.map((user, index) => (
                            <div key={user.user_id} className="p-2 border-b">
                                {index + 1}. {user.display_name} (ID: {user.user_id})
                            </div>
                        ))}
                    </div>
                </div>
            )} */}

            {/* {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg w-full max-w-md">
                        <QRScanner
                            onSuccess={handleScanSuccess}
                            onError={handleScanError}
                        />
                        <Button
                            type="primary"
                            className="w-full mt-4"
                            onClick={() => setShowScanner(false)}
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            )}

            <Button
                type="primary"
                icon={<FaQrcode />}
                className="fixed bottom-20 right-4 flex items-center justify-center"
                onClick={handleScanQR}
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    padding: 0,
                    zIndex: 1000
                }}
            /> */}

            
        </div>
    );
};

export default HomePage;
