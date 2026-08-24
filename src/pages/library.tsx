import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserID } from "zmp-sdk/apis";
import { CoffeeBean } from "../types/coffee";
import { BottledDrink } from "../types/bottledDrink";
import { Dish } from "../types/dish";
import { CoffeeEquipment } from "../types/coffeeEquipment";
import { Order } from "../types/order";

import CoffeeCard from "../components/coffee-card";
import BottledDrinkCard from "../components/bottled-drink-card";
import DishCard from "../components/dish-card";
import CoffeeEquipmentCard from "../components/coffee-equipment-card";
import SearchInput from "../components/SearchInput";

import { favoriteService } from "../firebase/favoriteService";
import { recentlyViewedService } from "../services/recentlyViewedService";
import { viewedHistoryService } from "../firebase/viewedHistoryService";
import { orderService } from "../firebase/orderService";
import { userService } from "../firebase/userService";
import { productCatalogService } from "../services/productCatalogService";
import { haptic } from "../utils/haptic";

const Library = () => {
    const [activeTab, setActiveTab] = useState('reading');
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [favoriteDrinks, setFavoriteDrinks] = useState<BottledDrink[]>([]);
    const [favoriteDishes, setFavoriteDishes] = useState<Dish[]>([]);
    const [favoriteEquipment, setFavoriteEquipment] = useState<CoffeeEquipment[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any>();
    const navigate = useNavigate();

    useEffect(() => {
        checkLocal();
    }, []);

    useEffect(() => {
        if (userInfo) {
            getPurchasedItems();
        }
        getViewed();
    }, [userInfo]);

    useEffect(() => {
        if (activeTab === 'reading') {
            getViewed();
        } else if (activeTab === 'favorite') {
            getFavoriteCoffees();
        } else if (activeTab === 'downloaded') {
            getPurchasedItems();
        }
    }, [activeTab]);

    const getViewed = async () => {
        let uid = userInfo?.id;
        if (!uid) {
            try {
                const userId = await getUserID();
                if (userId) {
                    const user = await userService.getUserByLocalId(userId);
                    if (user?.id) uid = user.id;
                }
            } catch (e) {}
        }
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
                if (item.historyId) {
                    viewedHistoryService.removeFromViewedHistory(item.historyId).catch(() => {});
                }
            }
        }
        setRecentlyViewed(validViewed);
    };

    const checkLocal = async () => {
        try {
            const userId = await getUserID();
            if (userId) {
                const user = await userService.getUserByLocalId(userId);
                if (user) {
                    setUserInfo(user);
                }
            }
        } catch (e) {
            console.error('Error checking local user:', e);
        }
    };

    const getFavoriteCoffees = async () => {
        try {
            let uid = userInfo?.id;
            if (!uid) {
                try {
                    const userId = await getUserID();
                    if (userId) {
                        const user = await userService.getUserByLocalId(userId);
                        if (user?.id) uid = user.id;
                    }
                } catch (e) {}
            }
            if (!uid) return;

            const [favorites, catalogMap] = await Promise.all([
                favoriteService.getAllFavorites(uid),
                productCatalogService.getProductMap()
            ]);
            
            const coffeeResults: CoffeeBean[] = [];
            const drinkResults: BottledDrink[] = [];
            const dishResults: Dish[] = [];
            const equipmentResults: CoffeeEquipment[] = [];

            for (const fav of favorites) {
                const entry = catalogMap.get(fav.coffeeId);
                if (entry) {
                    if (entry.type === 'coffee') coffeeResults.push(entry.product);
                    else if (entry.type === 'drink') drinkResults.push(entry.product);
                    else if (entry.type === 'dish') dishResults.push(entry.product);
                    else if (entry.type === 'coffee_equipment') equipmentResults.push(entry.product);
                }
            }

            setFavoriteCoffees(coffeeResults);
            setFavoriteDrinks(drinkResults);
            setFavoriteDishes(dishResults);
            setFavoriteEquipment(equipmentResults);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const getProductImageUrl = (item: any) => productCatalogService.getProductImageUrl(item);

    const getPurchasedItems = async () => {
        let uid = userInfo?.id;
        if (!uid) {
            try {
                const userId = await getUserID();
                if (userId) {
                    const user = await userService.getUserByLocalId(userId);
                    if (user?.id) uid = user.id;
                }
            } catch (e) {}
        }
        if (!uid) return;

        try {
            const [allOrders, catalogMap] = await Promise.all([
                orderService.getAllOrders().catch(() => [] as Order[]),
                productCatalogService.getProductMap()
            ]);

            const userOrders = (allOrders || []).filter((order: any) =>
                order && order.userId === uid &&
                order.status === 'paid'
            );

            const purchasedItems = userOrders.flatMap(order => order.items || []);
            const uniqueItemsMap = new Map();

            purchasedItems.forEach((item: any) => {
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
                        id: resolvedId,
                        coffeeId: resolvedType === 'coffee' ? resolvedId : undefined,
                        drinkId: resolvedType === 'drink' ? resolvedId : undefined,
                        dishId: resolvedType === 'dish' ? resolvedId : undefined,
                        coffeeEquipmentId: resolvedType === 'coffee_equipment' ? resolvedId : undefined,
                        type: resolvedType,
                        name: validEntry.product.name,
                        price: validEntry.product.price !== undefined ? validEntry.product.price : item.price,
                        imageUrl: validEntry.product.imageUrl || validEntry.product.image || '',
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
            console.error('Error in library getPurchasedItems:', error);
        }
    };

    return (
        <div className="p-4 mb-10 bg-white pt-10" style={{ paddingBottom: '50px' }}>
            <div className="mb-5 flex justify-between items-center">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Thư viện
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <SearchInput />
            </div>

            <div className="mb-4">
                <div className="flex gap-4 p-2 items-center justify-around"
                    style={{
                        borderTop: '1px solid #F5F5F5',
                        borderBottom: '1px solid #F5F5F5',
                    }}
                >
                    <div className="text-center">
                        <div className="text-8am-black text-base font-bold">
                            {recentlyViewed.length}
                        </div>
                        <div className="text-8am-gray text-xs">Đang xem</div>
                    </div>
                    <div className="text-center">
                        <div className="text-8am-black text-base font-bold">
                            {favoriteCoffees.length + favoriteDrinks.length + favoriteDishes.length + favoriteEquipment.length}
                        </div>
                        <div className="text-8am-gray text-xs">Yêu thích</div>
                    </div>
                    <div className="text-center">
                        <div className="text-8am-black text-base font-bold">
                            {purchasedItems.length}
                        </div>
                        <div className="text-8am-gray text-xs">Đã mua</div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-2 mb-4 justify-around">
                {[
                    { id: 'reading', label: 'Đang xem' },
                    { id: 'favorite', label: 'Yêu thích' },
                    { id: 'downloaded', label: 'Đã mua' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-2 py-2 ${activeTab === tab.id
                            ? 'bg-8am-light-grey-3 text-black'
                            : 'bg-white text-8am-gray'
                            }`}
                        style={{
                            borderRadius: '10px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                        onClick={() => {
                            haptic.light();
                            setActiveTab(tab.id);
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Display items based on active tab */}
            <div className="grid grid-cols-2 gap-4 pb-2">
                {activeTab === 'favorite' ? (
                    <>
                        {favoriteCoffees.map((coffee: any) => (
                            <div key={`fav-coffee-${coffee.id}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} {...coffee} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteDrinks.map((drink: any) => (
                            <div key={`fav-drink-${drink.id}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} {...drink} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteDishes.map((dish: any) => (
                            <div key={`fav-dish-${dish.id}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                <DishCard width={160} height={250} fontTitle={12} fontName={12} {...dish} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteEquipment.map((equipment: any) => (
                            <div key={`fav-eq-${equipment.id}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                <CoffeeEquipmentCard width={160} height={250} fontTitle={12} fontName={12} equipment={equipment} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteCoffees.length === 0 && favoriteDrinks.length === 0 && favoriteDishes.length === 0 && favoriteEquipment.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                Chưa có sản phẩm yêu thích nào
                            </div>
                        )}
                    </>
                ) : activeTab === 'reading' ? (
                    <>
                        {recentlyViewed.map((item: any, index: number) => {
                            if (item.type === 'coffee') {
                                return (
                                    <div key={`view-coffee-${item.id || index}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                        <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} {...item} isShowLike={false} userInfo={userInfo} />
                                    </div>
                                );
                            } else if (item.type === 'drink') {
                                return (
                                    <div key={`view-drink-${item.id || index}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                        <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} {...item} isShowLike={false} userInfo={userInfo} />
                                    </div>
                                );
                            } else if (item.type === 'dish') {
                                return (
                                    <div key={`view-dish-${item.id || index}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                        <DishCard width={160} height={250} fontTitle={12} fontName={12} {...item} isShowLike={false} userInfo={userInfo} />
                                    </div>
                                );
                            } else if (item.type === 'coffee_equipment') {
                                return (
                                    <div key={`view-eq-${item.id || index}`} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                                        <CoffeeEquipmentCard width={160} height={250} fontTitle={12} fontName={12} equipment={item} isShowLike={false} userInfo={userInfo} />
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {recentlyViewed.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                Chưa có sản phẩm đã xem nào
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {purchasedItems.map((item: any, index: number) => {
                            const imageUrl = getProductImageUrl(item);
                            const itemKey = `${item.type || 'item'}_${item.id || index}`;

                            return (
                                <div
                                    key={itemKey}
                                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => {
                                        if (item.type === 'coffee') {
                                            navigate(`/coffee/${item.id}`);
                                        } else if (item.type === 'drink') {
                                            navigate(`/bottled-drink/${item.id}`);
                                        } else if (item.type === 'dish') {
                                            navigate(`/dish/${item.id}`);
                                        } else if (item.type === 'coffee_equipment') {
                                            navigate(`/coffee-equipment/${item.id}`);
                                        }
                                    }}
                                >
                                    <div className="w-full h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={item.name}
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
                                    <div className="p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate mb-1" title={item.name}>
                                            {item.name}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                            <span>{item.type === 'coffee' ? 'Hạt cà phê' : item.type === 'drink' ? 'Đồ uống đóng chai' : item.type === 'dish' ? 'Món CUKCUK' : 'Dụng cụ'}</span>
                                            <span className="text-green-600 font-medium">{item.totalQuantity} đã mua</span>
                                        </div>
                                        <p className="text-sm font-bold text-orange-600">
                                            {((item.price || 0) * (item.totalQuantity || 1)).toLocaleString()}đ
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {purchasedItems.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                Chưa có sản phẩm đã mua nào
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Library;