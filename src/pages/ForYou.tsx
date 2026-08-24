import React, { useEffect, useState, useRef } from "react";
import { FaQrcode, FaChevronRight, FaGift, FaBox, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getUserID } from "zmp-sdk";
import { notification } from "antd";

import { CoffeeBean } from "../types/coffee";
import { BottledDrink } from "../types/bottledDrink";
import { Dish } from "../types/dish";
import { CoffeeEquipment } from "../types/coffeeEquipment";
import { CoffeeCollection } from "../types/collection";
import { HomeItem } from "../types/home";
import { Message } from "../types/message";
import { Order } from "../types/order";
import { User } from "../types/user";

import CoffeeCard from "../components/coffee-card";
import BottledDrinkCard from "../components/bottled-drink-card";
import DishCard from "../components/dish-card";
import CoffeeEquipmentCard from "../components/coffee-equipment-card";
import CollectionCard from "../components/collection-card";
import CoffeeSkeleton from "../components/CoffeeSkeleton";
import NotificationBell from "../components/NotificationBell";
import QRScanner from "../components/QRScanner";
import GiftList from '../components/GiftList';
import StoreChangeNotification from "../components/StoreChangeNotification";

import { collectionService } from "../firebase/collectionService";
import { userService } from "../firebase/userService";
import { homeService } from "../firebase/homeService";
import { favoriteService } from "../firebase/favoriteService";
import { recentlyViewedService } from "../services/recentlyViewedService";
import { orderService } from "../firebase/orderService";
import { messageService } from "../firebase/messageService";
import { viewedHistoryService } from "../firebase/viewedHistoryService";
import { productCatalogService } from "../services/productCatalogService";
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";
import { SelectedStoreService } from "../services/selectedStoreService";

const ForYouPage = () => {
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

    // State cho các mục
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [favoriteDrinks, setFavoriteDrinks] = useState<BottledDrink[]>([]);
    const [favoriteDishes, setFavoriteDishes] = useState<Dish[]>([]);
    const [favoriteEquipment, setFavoriteEquipment] = useState<CoffeeEquipment[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    // Loading states cho từng section
    const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(true);
    const [purchasedItemsLoading, setPurchasedItemsLoading] = useState(true);
    const [favoritesLoading, setFavoritesLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(true);

    const isInitializing = useRef(false);

    useEffect(() => {
        initializeData();
    }, []);

    // Cập nhật dữ liệu người dùng khi userInfo thay đổi
    useEffect(() => {
        if (userInfo?.id) {
            getFavoriteCoffees(userInfo.id, true);
            getPurchasedItems(userInfo.id, true);
            getRecentlyViewed(userInfo.id, true);
        }
    }, [userInfo?.id]);

    // Tự động cập nhật Đã xem trong nền khi người dùng chuyển lại tab mà không giật nháy
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Tab became visible, silently updating recently viewed...');
                getRecentlyViewed(userInfo?.id, true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userInfo?.id]);

    const initializeData = async () => {
        if (isInitializing.current) return;
        isInitializing.current = true;

        try {
            // Lấy thông tin cửa hàng đã chọn
            const store = SelectedStoreService.getSelectedStore();
            setSelectedStore(store);

            // 1. Kiểm tra user info
            let currentUser: User | null = null;
            try {
                const zaloUserId = await getUserID();
                if (zaloUserId) {
                    const user = await userService.getUserByLocalId(zaloUserId);
                    if (user) {
                        currentUser = user as User;
                        setUserInfo(currentUser);
                    }
                }
            } catch (uErr) {
                console.warn('Could not load user in initializeData:', uErr);
            }

            // 2. Load catalog và dữ liệu cửa hàng song song
            const [catalogMap, storeItems] = await Promise.all([
                productCatalogService.getProductMap(),
                OptimizedStoreMenuService.getAllItemsForSelectedStore().catch(() => ({ coffees: [], bottledDrinks: [], dishes: [] })),
                getHomeItems().catch(() => []),
                getLstCollection().catch(() => [])
            ]);

            setLstCoffee(storeItems.coffees);
            setLstBottledDrink(storeItems.bottledDrinks);
            setLstDishes(storeItems.dishes);
            setStoreDataLoading(false);

            // 3. Load các mục cá nhân hóa song song
            if (currentUser?.id) {
                recentlyViewedService.migrateToFirebase(currentUser.id).catch(() => {});
            }

            await Promise.all([
                currentUser?.id ? getFavoriteCoffees(currentUser.id) : Promise.resolve(),
                currentUser?.id ? getPurchasedItems(currentUser.id) : Promise.resolve(),
                getRecentlyViewed(currentUser?.id),
                loadMessages()
            ]);
        } catch (error) {
            console.error('Error during initializeData:', error);
        } finally {
            setStoreDataLoading(false);
            setFavoritesLoading(false);
            setPurchasedItemsLoading(false);
            setRecentlyViewedLoading(false);
            setMessagesLoading(false);
            setLoading(false);
            isInitializing.current = false;
        }
    };

    const loadData = async () => {
        setStoreDataLoading(true);
        try {
            await getHomeItems();
            await getLstCollection();

            const storeItems = await OptimizedStoreMenuService.getAllItemsForSelectedStore();
            setLstCoffee(storeItems.coffees);
            setLstBottledDrink(storeItems.bottledDrinks);
            setLstDishes(storeItems.dishes);
        } catch (error) {
            console.error('Error loading store data:', error);
            await loadAllData();
        } finally {
            setStoreDataLoading(false);
        }
    };

    const loadAllData = async () => {
        setStoreDataLoading(true);
        try {
            const [catalog] = await Promise.all([
                productCatalogService.getCatalog(),
                getHomeItems(),
                getLstCollection()
            ]);
            setLstCoffee(catalog.coffees || []);
            setLstBottledDrink(catalog.drinks || []);
            setLstDishes(catalog.dishes || []);
        } catch (err) {
            console.error("Error loading all data in ForYou:", err);
        } finally {
            setStoreDataLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        initializeData();
    };

    const getLstCollection = async () => {
        const lstCollection = await collectionService.getAllCollections();
        setLstCollection(lstCollection);
    };

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
    const loadUserSpecificData = async (targetUserId?: string) => {
        const uid = targetUserId || userInfo?.id;
        if (!uid) return;

        console.log('Loading user specific data for user:', uid);
        await Promise.all([
            getFavoriteCoffees(uid),
            getPurchasedItems(uid),
            getRecentlyViewed(uid),
            loadMessages()
        ]);
    };

    const getFavoriteCoffees = async (targetUserId?: string, isSilent = false) => {
        let uid = targetUserId || userInfo?.id;
        if (!uid) {
            try {
                const zaloUserId = await getUserID();
                if (zaloUserId) {
                    const user = await userService.getUserByLocalId(zaloUserId);
                    if (user?.id) uid = user.id;
                }
            } catch (e) {}
        }
        if (!uid) {
            setFavoritesLoading(false);
            return;
        }

        try {
            if (!isSilent && favoriteItems.length === 0) {
                setFavoritesLoading(true);
            }
            const [favorites, catalogMap] = await Promise.all([
                favoriteService.getAllFavorites(uid),
                productCatalogService.getProductMap()
            ]);

            const coffeeResults: CoffeeBean[] = [];
            const drinkResults: BottledDrink[] = [];
            const dishResults: Dish[] = [];
            const equipmentResults: CoffeeEquipment[] = [];
            const favoriteItemsResults: any[] = [];

            for (const fav of favorites) {
                const entry = catalogMap.get(fav.coffeeId);
                if (entry) {
                    if (entry.type === 'coffee') {
                        coffeeResults.push(entry.product);
                        favoriteItemsResults.push({
                            ...entry.product,
                            type: 'coffee',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                    } else if (entry.type === 'drink') {
                        drinkResults.push(entry.product);
                        favoriteItemsResults.push({
                            ...entry.product,
                            type: 'drink',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                    } else if (entry.type === 'dish') {
                        dishResults.push(entry.product);
                        favoriteItemsResults.push({
                            ...entry.product,
                            type: 'dish',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                    } else if (entry.type === 'coffee_equipment') {
                        equipmentResults.push(entry.product);
                        favoriteItemsResults.push({
                            ...entry.product,
                            type: 'coffee_equipment',
                            createdAt: fav.createdAt,
                            favoriteId: fav.id
                        });
                    }
                }
            }

            setFavoriteCoffees(coffeeResults);
            setFavoriteDrinks(drinkResults);
            setFavoriteDishes(dishResults);
            setFavoriteEquipment(equipmentResults);

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

    const getRecentlyViewed = async (targetUserId?: string, isSilent = false) => {
        try {
            if (!isSilent && recentlyViewed.length === 0) {
                setRecentlyViewedLoading(true);
            }
            const uid = targetUserId || userInfo?.id;
            const [viewed, catalogMap] = await Promise.all([
                recentlyViewedService.getRecentlyViewed(uid),
                productCatalogService.getProductMap()
            ]);

            const validViewed: any[] = [];
            for (const item of (viewed || [])) {
                if (!item || !item.id) continue;
                const activeEntry = catalogMap.get(item.id);
                if (activeEntry) {
                    validViewed.push({
                        ...item,
                        ...activeEntry.product,
                        id: item.id,
                        type: activeEntry.type,
                    });
                } else {
                    // Món cũ/không còn tồn tại trong 4 danh mục chuẩn -> xóa khỏi lịch sử
                    if (item.historyId) {
                        viewedHistoryService.removeFromViewedHistory(item.historyId).catch(() => {});
                    }
                }
            }

            setRecentlyViewed(validViewed);
        } catch (error) {
            console.error('Error getting recently viewed:', error);
        } finally {
            setRecentlyViewedLoading(false);
        }
    };

    const getPurchasedItems = async (targetUserId?: string, isSilent = false) => {
        let uid = targetUserId || userInfo?.id;
        if (!uid) {
            try {
                const zaloUserId = await getUserID();
                if (zaloUserId) {
                    const user = await userService.getUserByLocalId(zaloUserId);
                    if (user?.id) uid = user.id;
                }
            } catch (e) {}
        }
        if (!uid) {
            setPurchasedItemsLoading(false);
            return;
        }

        try {
            if (!isSilent && purchasedItems.length === 0) {
                setPurchasedItemsLoading(true);
            }
            const [allOrders, catalogMap] = await Promise.all([
                orderService.getAllOrders().catch(() => [] as Order[]),
                productCatalogService.getProductMap()
            ]);

            const userOrders = (allOrders || []).filter((order: any) =>
                order && order.userId === uid &&
                order.status === 'paid'
            );

            const purchasedItemsData = userOrders.flatMap(order => order.items || []);
            const uniqueItemsMap = new Map();

            purchasedItemsData.forEach((item: any) => {
                if (!item) return;
                const rawId = item.coffeeId || item.drinkId || item.dishId || item.coffeeEquipmentId || item.id;
                const validEntry = rawId ? catalogMap.get(rawId) : null;
                if (!validEntry) return;

                const resolvedId = validEntry.product.id || rawId;
                const resolvedType = validEntry.type;
                const key = `${resolvedType}_${resolvedId}`;

                if (!uniqueItemsMap.has(key)) {
                    uniqueItemsMap.set(key, {
                        ...item,
                        ...validEntry.product,
                        id: resolvedId,
                        coffeeId: resolvedType === 'coffee' ? resolvedId : undefined,
                        drinkId: resolvedType === 'drink' ? resolvedId : undefined,
                        dishId: resolvedType === 'dish' ? resolvedId : undefined,
                        coffeeEquipmentId: resolvedType === 'coffee_equipment' ? resolvedId : undefined,
                        type: resolvedType,
                        totalQuantity: 0,
                        totalSpent: 0,
                        purchaseCount: 0
                    });
                }

                const existingItem = uniqueItemsMap.get(key);
                existingItem.totalQuantity += (item.quantity || 1);
                existingItem.totalSpent += (existingItem.price || item.price || 0) * (item.quantity || 1);
                existingItem.purchaseCount += 1;
            });

            const uniqueItems = Array.from(uniqueItemsMap.values());
            setPurchasedItems(uniqueItems);
        } catch (error) {
            console.error('Error fetching purchased items:', error);
        } finally {
            setPurchasedItemsLoading(false);
        }
    };

    // Helper functions sử dụng chung từ productCatalogService
    const getProductImageUrl = (item: any) => productCatalogService.getProductImageUrl(item);
    const getProductName = (item: any) => productCatalogService.getProductName(item);
    const getProductPrice = (item: any) => productCatalogService.getProductPrice(item);

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
    const LoadingSkeleton = ({ count = 3, variant = 'default' }: { count?: number, variant?: 'default' | 'news' }) => (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden animate-pulse ${variant === 'news' ? 'w-72' : 'w-40'
                        }`}
                >
                    <div className={`w-full bg-gray-200 ${variant === 'news' ? 'h-44' : 'h-32'}`}></div>
                    <div className="p-2">
                        <div className={`bg-gray-200 rounded mb-2 ${variant === 'news' ? 'h-5' : 'h-4'}`}></div>
                        {variant === 'news' && <div className="h-4 bg-gray-200 rounded mb-2"></div>}
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

            {/* Tin tức */}
            {(messagesLoading || messages.length > 0) && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {/* <FaFire className="text-orange-500" /> */}
                            Tin tức nổi bật
                        </h2>
                    </div>
                    <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
                        {messagesLoading ? (
                            <LoadingSkeleton count={2} variant="news" />
                        ) : (
                            messages.map((message, index) => {
                                // Đếm số quà từ giftIds hoặc related_gifts
                                const giftCount = new Set([
                                    ...(message.giftIds || []),
                                    ...((message.related_gifts || []).map((gift) => gift.id).filter(Boolean))
                                ]).size;
                                const hasGift = giftCount > 0;
                                const totalProducts = message.related_products?.length || 0;

                                return (
                                    <div
                                        key={`news-${index}`}
                                        className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative"
                                        onClick={() => {
                                            navigate(`/news/${message.id}`);
                                        }}
                                    >
                                        {/* Badge quà tặng */}
                                        {hasGift && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <FaGift />
                                                    CÓ QUÀ
                                                </div>
                                            </div>
                                        )}

                                        {/* Banner image */}
                                        <div className="relative w-full h-44 bg-gradient-to-br from-orange-50 to-orange-100">
                                            {message.template_data?.banner?.image_url && (
                                                <img
                                                    src={message.template_data.banner.image_url}
                                                    alt={message.template_data?.header?.content || 'Tin tức'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )}

                                            {/* Overlay gradient */}
                                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent"></div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col">
                                            <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                                                {message.template_data?.header?.content || 'Tin tức mới'}
                                            </h3>

                                            <div className="flex-grow mb-3 min-h-[7rem]">
                                                {message.template_data?.text?.content && (
                                                    <p className="text-sm text-gray-600 line-clamp-5">
                                                        {message.template_data.text.content.replace(/<br>/g, ' ')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Footer info - Tags sản phẩm và quà */}
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                {totalProducts > 0 && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                                        <FaBox className="text-[10px]" />
                                                        {totalProducts} sản phẩm
                                                    </span>
                                                )}
                                                {hasGift && (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                                        <FaGift className="text-[10px]" />
                                                        {giftCount} quà
                                                    </span>
                                                )}
                                                {(message as any).relevanceScore > 10 && (
                                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                                        <FaStar className="text-[10px]" />
                                                        Dành cho bạn
                                                    </span>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            {message.timestamp && (
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-gray-400">
                                                        {(() => {
                                                            const rawTimestamp: any = message.timestamp;
                                                            const date = rawTimestamp?.toDate ? rawTimestamp.toDate() : new Date(message.timestamp);
                                                            const now = new Date();
                                                            const diffInMs = now.getTime() - date.getTime();
                                                            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

                                                            if (diffInDays === 0) {
                                                                const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                                                                if (diffInHours === 0) {
                                                                    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                                                                    return diffInMinutes <= 1 ? 'Vừa xong' : `${diffInMinutes} phút trước`;
                                                                }
                                                                return `${diffInHours} giờ trước`;
                                                            } else if (diffInDays === 1) {
                                                                return 'Hôm qua';
                                                            } else if (diffInDays < 7) {
                                                                return `${diffInDays} ngày trước`;
                                                            } else {
                                                                return date.toLocaleDateString('vi-VN', {
                                                                    day: '2-digit',
                                                                    month: '2-digit'
                                                                });
                                                            }
                                                        })()}
                                                    </div>
                                                    <span className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                                                        Xem <FaChevronRight className="text-[10px]" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Đã xem */}
            {(recentlyViewedLoading || recentlyViewed.length > 0) && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Đã xem</h2>
                    </div>
                    <div className="flex overflow-x-auto space-x-3 pb-2">
                        {recentlyViewedLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : (
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
                                    <div className="w-full h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {getProductImageUrl(item) ? (
                                            <img
                                                src={getProductImageUrl(item)}
                                                alt={getProductName(item)}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                                                8AM Coffee
                                            </div>
                                        )}
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
                        )}
                    </div>
                </div>
            )}

            {/* Đã mua */}
            {(purchasedItemsLoading || purchasedItems.length > 0) && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Đã mua</h2>
                    </div>
                    <div className="flex overflow-x-auto space-x-3 pb-2">
                        {purchasedItemsLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : (
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
                        )}
                    </div>
                </div>
            )}

            {/* Yêu thích */}
            {(favoritesLoading || favoriteItems.length > 0) && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Yêu thích</h2>
                    </div>
                    <div className="flex overflow-x-auto space-x-3 pb-2">
                        {favoritesLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : (
                            favoriteItems.map((item, index) => (
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
                            ))
                        )}
                    </div>
                </div>
            )}

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
