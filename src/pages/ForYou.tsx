import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import React, { useEffect, useState } from "react";
import { FaQrcode, FaEye, FaHeart, FaShoppingBag, FaNewspaper, FaChevronRight } from "react-icons/fa";
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
import { DishService } from "../firebase/dishService";
import DishCard from "../components/dish-card";
import { Dish } from "../types/dish";
import { CoffeeEquipmentService } from "../firebase/coffeeEquipmentService";
import { CoffeeEquipment } from "../types/coffeeEquipment";
import CoffeeEquipmentCard from "../components/coffee-equipment-card";
import { StoreMenuService } from "../services/storeMenuService";
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";
import { SelectedStoreService } from "../services/selectedStoreService";

import StoreChangeNotification from "../components/StoreChangeNotification";
import { provinceService } from "../firebase/provinceService";
import { wardService } from "../firebase/wardService";
import { favoriteService } from "../firebase/favoriteService";
import { recentlyViewedService } from "../services/recentlyViewedService";
import { orderService } from "../firebase/orderService";
import { messageService } from "../firebase/messageService";
import { Message } from "../types/message";
import { viewedHistoryService } from "../firebase/viewedHistoryService";
import { User } from "../types/user";
import GiftList from '../components/GiftList';


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

const ForYouPage = () => {

    const { error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [lstCollection, setLstCollection] = useState<CoffeeCollection[]>([]);
    const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
    const [lstDishes, setLstDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<User | null>(null);

    const [homeItems, setHomeItems] = useState<HomeItem[]>([]);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [storeDataLoading, setStoreDataLoading] = useState(true);

    // Thêm state cho các mục mới
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [favoriteDrinks, setFavoriteDrinks] = useState<BottledDrink[]>([]);
    const [favoriteDishes, setFavoriteDishes] = useState<Dish[]>([]);
    const [favoriteEquipment, setFavoriteEquipment] = useState<CoffeeEquipment[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<any[]>([]); // Lưu trữ favorites với timestamp
    const [messages, setMessages] = useState<Message[]>([]);

    // Loading states cho từng section
    const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(true);
    const [purchasedItemsLoading, setPurchasedItemsLoading] = useState(true);
    const [favoritesLoading, setFavoritesLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(true);

    const dishService = new DishService();
    const coffeeEquipmentService = new CoffeeEquipmentService();

    useEffect(() => {
        initializeData();
    }, []);

    // Reload recently viewed when page becomes visible (user returns from detail page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && userInfo?.id) {
                console.log('Page became visible, reloading recently viewed...');
                getRecentlyViewed();
            }
        };

        const handleFocus = () => {
            if (userInfo?.id) {
                console.log('Window focused, reloading recently viewed...');
                getRecentlyViewed();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [userInfo]);

    useEffect(() => {
        console.log('userInfo changed:', userInfo);
        if (userInfo && userInfo.id) {
            console.log('Loading user specific data...');
            loadUserSpecificData();
        }
    }, [userInfo]);

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

        // Load messages cho tin tức
        await loadMessages();
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

    const checkLocal = async () => {
        try {
            const zaloUserId = await getUserID();
            console.log('Zalo userId:', zaloUserId);

            const user = await userService.getUserByLocalId(zaloUserId);
            console.log('User from Firebase:', user);

            if (user) {
                const fullUser = user as User;
                setUserInfo(fullUser);
                console.log('UserInfo set with Firebase ID:', fullUser.id);
                console.log('UserInfo set with Zalo localId:', fullUser.localId);

                // Debug: So sánh với hardcoded userId từ ảnh
                const expectedUserId1 = 'avFSXruGhBJ0Dvuxiafp'; // từ users collection 
                const expectedUserId2 = 'avFSXruGh8J0Dvuxiafp'; // từ viewedHistory (có thêm h)
                console.log('Expected userId from users collection:', expectedUserId1);
                console.log('Expected userId from viewedHistory:', expectedUserId2);
                console.log('Does Firebase ID match users collection?', fullUser.id === expectedUserId1);
                console.log('Does Firebase ID match viewedHistory?', fullUser.id === expectedUserId2);
                console.log('Does Zalo localId match?', fullUser.localId === zaloUserId);
            } else {
                console.log('No user found in Firebase for Zalo userId:', zaloUserId);
            }
        } catch (error) {
            console.error('Error in checkLocal:', error);
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

    const getHomeItems = async () => {
        try {
            const items = await homeService.getAllHomeItems();
            setHomeItems(items.filter(item => item.isVisible));
        } catch (error) {
            console.error("Error fetching home items:", error);
        }
    };

    const loadMessages = async () => {
        try {
            setMessagesLoading(true);
            const allMessages = await messageService.getAllMessages();
            // Chỉ lấy những message có banner để hiển thị như tin tức
            const messagesWithBanner = allMessages.filter(msg =>
                msg.type === 'template' &&
                msg.template_data?.banner?.image_url
            );

            // Sắp xếp tin tức theo mức độ liên quan với user
            const sortedMessages = sortMessagesByRelevance(messagesWithBanner);
            setMessages(sortedMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setMessagesLoading(false);
        }
    };

    // Function để tính toán mức độ liên quan của tin tức với user
    const sortMessagesByRelevance = (messages: Message[]) => {
        if (!userInfo?.id || messages.length === 0) {
            // Nếu không có user info, sắp xếp theo thời gian mới nhất
            return messages.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
        }

        // Tạo danh sách ID của các sản phẩm user đã tương tác
        const userInteractedProductIds = new Set<string>();

        // Thêm sản phẩm đã mua
        purchasedItems.forEach(item => {
            if (item.type === 'coffee') userInteractedProductIds.add(item.coffeeId || item.id);
            else if (item.type === 'drink') userInteractedProductIds.add(item.drinkId || item.id);
            else if (item.type === 'dish') userInteractedProductIds.add(item.dishId || item.id);
            else if (item.type === 'coffee_equipment') userInteractedProductIds.add(item.coffeeEquipmentId || item.id);
        });

        // Thêm sản phẩm đã xem
        recentlyViewed.forEach(item => {
            userInteractedProductIds.add(item.id);
        });

        // Thêm sản phẩm yêu thích
        favoriteItems.forEach(item => {
            userInteractedProductIds.add(item.id);
        });

        console.log('User interacted product IDs:', Array.from(userInteractedProductIds));

        // Tính điểm liên quan cho mỗi tin tức
        const messagesWithRelevance = messages.map(message => {
            let relevanceScore = 0;

            if (message.related_products && message.related_products.length > 0) {
                // Tính điểm dựa trên số lượng sản phẩm liên quan mà user đã tương tác
                const relatedProductIds = message.related_products.map(p => p.originalId || p.id);
                const matchingProducts = relatedProductIds.filter(id =>
                    userInteractedProductIds.has(id)
                );

                relevanceScore = matchingProducts.length;

                // Bonus điểm nếu có nhiều sản phẩm liên quan
                if (matchingProducts.length > 0) {
                    relevanceScore += matchingProducts.length * 10; // Điểm cao hơn cho tin có nhiều sản phẩm liên quan
                }
            }

            // Thêm điểm thời gian (tin mới hơn có điểm cao hơn một chút)
            const timeScore = message.timestamp ?
                new Date(message.timestamp).getTime() / 1000000000 : 0; // Chia để có điểm nhỏ

            return {
                ...message,
                relevanceScore: relevanceScore + timeScore
            };
        });

        // Sắp xếp theo điểm liên quan giảm dần
        return messagesWithRelevance.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            // Nếu điểm liên quan bằng nhau, sắp xếp theo thời gian mới nhất
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });
    };

    // Thêm các function để load dữ liệu theo user
    const loadUserSpecificData = async () => {
        if (userInfo?.id) {
            console.log('Loading user specific data for user:', userInfo.id);

            // Migration: Chuyển dữ liệu từ localStorage lên Firebase trước
            await recentlyViewedService.migrateToFirebase(userInfo.id);

            // Sau đó load dữ liệu từ Firebase
            await getFavoriteCoffees();
            await getPurchasedItems();
            await getRecentlyViewed();

            // Load lại messages sau khi đã có dữ liệu user để sắp xếp chính xác
            await loadMessages();
        } else {
            console.log('No userInfo available for loading user specific data');
        }
    };

    const getFavoriteCoffees = async () => {
        try {
            setFavoritesLoading(true);
            if (!userInfo?.id) {
                console.log('No user info available');
                return;
            }

            const favorites = await favoriteService.getAllFavorites(userInfo.id);
            console.log('favorites in ForYou:', favorites);

            // Process each favorite to determine its type and get the correct data
            const coffeeResults: CoffeeBean[] = [];
            const drinkResults: BottledDrink[] = [];
            const dishResults: Dish[] = [];
            const equipmentResults: CoffeeEquipment[] = [];
            const favoriteItemsResults: any[] = [];

            for (const fav of favorites) {
                try {
                    // Try to get as coffee first
                    const coffee = await coffeeService.getCoffeeById(fav.coffeeId);
                    if (coffee) {
                        coffeeResults.push(coffee);
                        favoriteItemsResults.push({
                            ...coffee,
                            type: 'coffee',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                        continue;
                    }

                    // Try to get as bottled drink
                    const drink = await bottledDrinkService.getBottledDrinkById(fav.coffeeId);
                    if (drink) {
                        drinkResults.push(drink);
                        favoriteItemsResults.push({
                            ...drink,
                            type: 'drink',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                        continue;
                    }

                    // Try to get as dish
                    const dish = await dishService.getDishById(fav.coffeeId);
                    if (dish) {
                        dishResults.push(dish);
                        favoriteItemsResults.push({
                            ...dish,
                            type: 'dish',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                        continue;
                    }

                    // Try to get as coffee equipment
                    const allEquipment = await coffeeEquipmentService.getAllEquipment();
                    const equipment = allEquipment.find(eq => eq.id === fav.coffeeId);
                    if (equipment) {
                        equipmentResults.push(equipment);
                        favoriteItemsResults.push({
                            ...equipment,
                            type: 'coffee_equipment',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                    }
                } catch (itemError) {
                    console.log(`Could not fetch item ${fav.coffeeId}:`, itemError);
                }
            }

            console.log('Coffee results:', coffeeResults);
            console.log('Drink results:', drinkResults);
            console.log('Dish results:', dishResults);
            console.log('Equipment results:', equipmentResults);

            setFavoriteCoffees(coffeeResults);
            setFavoriteDrinks(drinkResults);
            setFavoriteDishes(dishResults);
            setFavoriteEquipment(equipmentResults);

            // Sort favorite items by createdAt descending (newest first)
            const sortedFavoriteItems = favoriteItemsResults.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setFavoriteItems(sortedFavoriteItems);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setFavoritesLoading(false);
        }
    };

    const getRecentlyViewed = async () => {
        try {
            setRecentlyViewedLoading(true);
            console.log('Getting recently viewed for user:', userInfo?.id);
            const viewed = await recentlyViewedService.getRecentlyViewed(userInfo?.id);
            console.log('Recently viewed data:', viewed);
            console.log('Recently viewed count:', viewed.length);
            console.log('Coffee equipment in recently viewed:', viewed.filter(item => item.type === 'coffee_equipment'));
            setRecentlyViewed(viewed);
        } catch (error) {
            console.error('Error getting recently viewed:', error);
            setRecentlyViewed([]);
        } finally {
            setRecentlyViewedLoading(false);
        }
    };

    const getPurchasedItems = async () => {
        if (!userInfo?.id) return;

        try {
            setPurchasedItemsLoading(true);
            const allOrders = await orderService.getAllOrders();
            const userOrders = allOrders.filter(order =>
                order.userId === userInfo.id &&
                order.status === 'paid'
            );

            const purchasedItemsData = userOrders.flatMap(order => order.items);

            // Create a map using a composite key of type and id
            const uniqueItemsMap = new Map();

            purchasedItemsData.forEach((item: any) => {
                const key = item.type === 'coffee' ?
                    `coffee_${item.coffeeId || item.id}` :
                    item.type === 'drink' ?
                        `drink_${item.drinkId || item.id}` :
                        item.type === 'coffee_equipment' ?
                            `coffee_equipment_${item.coffeeEquipmentId || item.id}` :
                            `dish_${item.dishId || item.id}`;

                if (!uniqueItemsMap.has(key)) {
                    uniqueItemsMap.set(key, {
                        ...item,
                        totalQuantity: 0,
                        totalSpent: 0,
                        purchaseCount: 0
                    });
                }

                const existingItem = uniqueItemsMap.get(key);
                existingItem.totalQuantity += item.quantity;
                existingItem.totalSpent += item.price * item.quantity;
                existingItem.purchaseCount += 1;
            });

            const uniqueItems = Array.from(uniqueItemsMap.values());
            console.log('uniqueItems', uniqueItems);

            // For coffee equipment items, fetch detailed info to get proper name
            const enrichedItems = await Promise.all(uniqueItems.map(async (item) => {
                if (item.type === 'coffee_equipment' && item.coffeeEquipmentId) {
                    try {
                        const allEquipment = await coffeeEquipmentService.getAllEquipment();
                        const equipmentDetail = allEquipment.find(eq => eq.id === item.coffeeEquipmentId);
                        if (equipmentDetail) {
                            // Merge the detailed equipment info with the purchased item
                            return {
                                ...item,
                                values: equipmentDetail.values,
                                categoryName: equipmentDetail.categoryName,
                                images: equipmentDetail.images,
                                // Keep the original name as fallback, but let getProductName handle the logic
                                detailedInfo: equipmentDetail
                            };
                        }
                    } catch (error) {
                        console.log('Error fetching equipment details for:', item.coffeeEquipmentId, error);
                    }
                }
                return item;
            }));

            setPurchasedItems(enrichedItems);
        } catch (error) {
            console.error('Error fetching purchased items:', error);
        } finally {
            setPurchasedItemsLoading(false);
        }
    };

    // Helper function to get correct image URL for different product types
    const getProductImageUrl = (item: any) => {
        if (!item) return '';

        // For coffee: imageUrl or first image from images array
        if (item.imageUrl) {
            return item.imageUrl;
        }

        // For bottled drinks, coffee equipment: first image from images array
        if (item.images && item.images.length > 0) {
            return item.images[0];
        }

        // For coffee equipment with detailed info (from enriched purchased items)
        if (item.type === 'coffee_equipment' && item.detailedInfo?.images && item.detailedInfo.images.length > 0) {
            return item.detailedInfo.images[0];
        }

        // For items with driveImages (Google Drive storage)
        if (item.driveImages && item.driveImages.length > 0) {
            return `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;
        }

        // Fallback
        return '';
    };

    // Helper function to get correct name for different product types
    const getProductName = (item: any) => {
        if (!item) return '';

        // For coffee equipment: get name from values array or use direct name field
        if (item.type === 'coffee_equipment') {
            // First try to get name from values array (detailed info)
            if (item.values && Array.isArray(item.values)) {
                const nameField = item.values.find((v: any) =>
                    v.name.toLowerCase().includes('tên') ||
                    v.name.toLowerCase().includes('name')
                );
                if (nameField?.value) {
                    return nameField.value;
                }
            }

            // Fallback to direct name or category name
            return item.name || item.categoryName || 'Dụng cụ cà phê';
        }

        // For other products: use direct name field
        return item.name || item.product_name || '';
    };

    // Helper function to get correct price for different product types
    const getProductPrice = (item: any) => {
        if (!item) return null;

        // Tự động xác định loại sản phẩm dựa trên cấu trúc dữ liệu
        let productType = item.type;

        // Nếu item thuộc favoriteCoffees, đây là coffee
        if (favoriteCoffees.includes(item)) {
            productType = 'coffee';
        }
        // Nếu item thuộc favoriteDrinks, đây là bottled drink
        else if (favoriteDrinks.includes(item)) {
            productType = 'drink';
        }
        // Nếu item thuộc favoriteDishes, đây là dish
        else if (favoriteDishes.includes(item)) {
            productType = 'dish';
        }
        // Nếu item thuộc favoriteEquipment, đây là coffee equipment
        else if (favoriteEquipment.includes(item)) {
            productType = 'coffee_equipment';
        }
        // Auto-detect dựa trên cấu trúc dữ liệu
        else if (item.weightAndPrice && Array.isArray(item.weightAndPrice)) {
            productType = 'coffee';
        }
        else if (item.volumes && Array.isArray(item.volumes)) {
            productType = 'drink';
        }
        else if (item.values && Array.isArray(item.values) && item.categoryId) {
            productType = 'coffee_equipment';
        }
        else if (item.price && typeof item.price === 'number' && !item.weightAndPrice && !item.volumes) {
            productType = 'dish';
        }

        // For coffee: get minimum price from weightAndPrice array
        if (productType === 'coffee' && item.weightAndPrice && item.weightAndPrice.length > 0) {
            const minPrice = Math.min(...item.weightAndPrice.map((wp: any) => wp.price));
            return { price: minPrice, prefix: 'Từ ' };
        }

        // For bottled drinks: get minimum price from volumes array
        if (productType === 'drink' && item.volumes && item.volumes.length > 0) {
            const minPrice = Math.min(...item.volumes.map((v: any) => v.price));
            return { price: minPrice, prefix: 'Từ ' };
        }

        // For dishes: direct price
        if (productType === 'dish' && item.price && typeof item.price === 'number') {
            return { price: item.price, prefix: '' };
        }

        // For coffee equipment: price from values array
        if (productType === 'coffee_equipment') {
            // Try to get price from values array (detailed info)
            if (item.values && Array.isArray(item.values)) {
                const priceField = item.values.find((v: any) =>
                    v.name.toLowerCase().includes('giá') ||
                    v.name.toLowerCase().includes('price')
                );
                if (priceField && typeof priceField.value === 'number') {
                    return { price: priceField.value, prefix: '' };
                }
            }

            // Fallback to direct price field for orders data
            if (item.price && typeof item.price === 'number') {
                return { price: item.price, prefix: '' };
            }
        }

        // Legacy: direct price field for backward compatibility
        if (item.price && typeof item.price === 'number') {
            return { price: item.price, prefix: '' };
        }

        return null;
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

    // Loading skeleton component
    const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-40 bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full h-32 bg-gray-200"></div>
                    <div className="p-2">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="p-4 mb-10 bg-white pt-10"
            style={{
                paddingBottom: '30px'
            }}
        >
            <StoreChangeNotification userId={userInfo?.id} />
            <div className="mb-6 flex justify-between items-center relative">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Dành cho bạn
                    </div>
                </div>
            </div>

            {/* Đã xem */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Đã xem</h2>
                </div>
                <div className="flex overflow-x-auto space-x-3 pb-2">
                    {recentlyViewedLoading ? (
                        <LoadingSkeleton count={3} />
                    ) : recentlyViewed.length > 0 ? (
                        recentlyViewed.map((item, index) => (
                            <div
                                key={`viewed-${index}`}
                                className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
                                onClick={() => {
                                    if (item.type === 'coffee') navigate(`/coffee/${item.id}`);
                                    else if (item.type === 'drink') navigate(`/bottled-drink/${item.id}`);
                                    else if (item.type === 'dish') navigate(`/dish/${item.id}`);
                                    else if (item.type === 'coffee_equipment') navigate(`/coffee-equipment/${item.id}`);
                                }}
                            >
                                <div className="w-full h-32">
                                    <img
                                        src={getProductImageUrl(item)}
                                        alt={getProductName(item)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-2">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {getProductName(item)}
                                    </h4>
                                    {(() => {
                                        const priceInfo = getProductPrice(item);
                                        return priceInfo ? (
                                            <p className="text-sm text-orange-600 font-semibold mt-1">
                                                {priceInfo.prefix}{priceInfo.price.toLocaleString()}đ
                                            </p>
                                        ) : null;
                                    })()}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.type === 'coffee' && 'Hạt cà phê'}
                                        {item.type === 'drink' && 'Đồ uống'}
                                        {item.type === 'dish' && 'Cà phê'}
                                        {item.type === 'coffee_equipment' && 'Dụng cụ'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex-shrink-0 w-40 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Chưa xem</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Đã mua */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Đã mua</h2>
                </div>
                <div className="flex overflow-x-auto space-x-3 pb-2">
                    {purchasedItemsLoading ? (
                        <LoadingSkeleton count={3} />
                    ) : purchasedItems.length > 0 ? (
                        purchasedItems.map((item, index) => (
                            <div
                                key={`purchased-${index}`}
                                className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
                                onClick={() => {
                                    if (item.type === 'coffee') navigate(`/coffee/${item.coffeeId || item.id}`);
                                    else if (item.type === 'drink') navigate(`/bottled-drink/${item.drinkId || item.id}`);
                                    else if (item.type === 'dish') navigate(`/dish/${item.dishId || item.id}`);
                                    else if (item.type === 'coffee_equipment') navigate(`/coffee-equipment/${item.coffeeEquipmentId || item.id}`);
                                }}
                            >
                                <div className="w-full h-32">
                                    <img
                                        src={getProductImageUrl(item)}
                                        alt={getProductName(item)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-2">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">{getProductName(item)}</h4>
                                    {(() => {
                                        const priceInfo = getProductPrice(item);
                                        return priceInfo ? (
                                            <p className="text-sm text-orange-600 font-semibold mt-1">
                                                {priceInfo.prefix}{priceInfo.price.toLocaleString()}đ
                                            </p>
                                        ) : null;
                                    })()}
                                    {item.totalQuantity && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Đã mua: {item.totalQuantity} lần
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {item.type === 'coffee' && 'Hạt cà phê'}
                                        {item.type === 'drink' && 'Đồ uống'}
                                        {item.type === 'dish' && 'Cà phê'}
                                        {item.type === 'coffee_equipment' && 'Dụng cụ'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex-shrink-0 w-40 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Chưa mua</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Yêu thích */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Yêu thích</h2>
                </div>
                <div className="flex overflow-x-auto space-x-3 pb-2">
                    {favoritesLoading ? (
                        <LoadingSkeleton count={3} />
                    ) : (() => {
                        if (favoriteItems.length === 0) {
                            return (
                                <div className="flex-shrink-0 w-40 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">Chưa thích</span>
                                </div>
                            );
                        }

                        return favoriteItems.map((item, index) => (
                            <div
                                key={`favorite-${index}`}
                                className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
                                onClick={() => {
                                    if (item.type === 'coffee') navigate(`/coffee/${item.id}`);
                                    else if (item.type === 'drink') navigate(`/bottled-drink/${item.id}`);
                                    else if (item.type === 'dish') navigate(`/dish/${item.id}`);
                                    else if (item.type === 'coffee_equipment') navigate(`/coffee-equipment/${item.id}`);
                                }}
                            >
                                <div className="w-full h-32">
                                    <img
                                        src={getProductImageUrl(item)}
                                        alt={getProductName(item)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-2">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {getProductName(item)}
                                    </h4>
                                    {(() => {
                                        const priceInfo = getProductPrice(item);
                                        return priceInfo ? (
                                            <p className="text-sm text-orange-600 font-semibold mt-1">
                                                {priceInfo.prefix}{priceInfo.price.toLocaleString()}đ
                                            </p>
                                        ) : null;
                                    })()}
                                    <div className="flex items-center mt-1">
                                        <span className="text-red-500 text-xs">♥</span>
                                        <span className="text-xs text-gray-500 ml-1">
                                            {item.type === 'coffee' && 'Hạt cà phê'}
                                            {item.type === 'drink' && 'Đồ uống'}
                                            {item.type === 'dish' && 'Cà phê'}
                                            {item.type === 'coffee_equipment' && 'Dụng cụ'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Tin tức */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Tin tức</h2>
                </div>
                <div className="flex overflow-x-auto space-x-3 pb-2">
                    {messagesLoading ? (
                        <LoadingSkeleton count={3} />
                    ) : messages.length > 0 ? (
                        messages.map((message, index) => (
                            <div
                                key={`news-${index}`}
                                className={`flex-shrink-0 w-40 bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer ${(message as any).relevanceScore > 10 ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                                    }`}
                                onClick={() => {
                                    navigate(`/news/${message.id}`);
                                }}
                            >
                                <div className="w-full h-32">
                                    <img
                                        src={message.template_data?.banner?.image_url}
                                        alt={message.template_data?.header?.content || 'Tin tức'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-2">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {message.template_data?.header?.content || 'Tin tức'}
                                    </h4>
                                    {message.template_data?.text?.content && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {message.template_data.text.content.replace(/<br>/g, ' ').substring(0, 50)}...
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center">
                                            <span className="text-blue-500 text-xs">📰</span>
                                            <span className="text-xs text-gray-500 ml-1">Tin tức</span>
                                        </div>
                                        {(message as any).relevanceScore > 10 && (
                                            <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">
                                                Liên quan
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex-shrink-0 w-40 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Tin tức</span>
                        </div>
                    )}
                </div>
            </div>

            {userInfo?.id && (
                <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Quà đã nhận</h2>
                </div>
                <GiftList userId={userInfo.id} />
                </div>
            )}

        </div>
    );
};

export default ForYouPage;
