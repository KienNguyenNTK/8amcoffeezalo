import { notification } from "antd";
import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import { flavorService } from "../firebase/flavorService";
import { regionService } from "../firebase/regionService";
import { useStorageImages } from "../hooks/useStorageImages";
import React, { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CoffeeBean } from "../types/coffee";
import { Flavor } from "../types/flavor";
import { Region } from "../types/region";
import CoffeeCard from "../components/coffee-card";
import { favoriteService } from "../firebase/favoriteService";
import { authService } from "../services/authService";
import { recentlyViewedService } from "../services/recentlyViewedService";
import { BottledDrink } from "../types/bottledDrink";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import BottledDrinkCard from "../components/bottled-drink-card";
import { Order } from "../types/order";
import { orderService } from "../firebase/orderService";
import SearchInput from "../components/SearchInput";

const Library = () => {
    const { loading, error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [lstRegion, setLstRegion] = useState<Region[]>([]);
    const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
    const [activeTab, setActiveTab] = useState('reading');
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [favoriteDrinks, setFavoriteDrinks] = useState<BottledDrink[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const navigate = useNavigate();
    const [cartItemCount, setCartItemCount] = useState(0);

    useEffect(() => {
        getCartItemCount();
    }, []);

    useEffect(() => {
        getAuthenticatedUser();
    }, [activeTab]);

    useEffect(() => {
        console.log(favoriteCoffees);
    }, [favoriteCoffees]);

    useEffect(() => {
        console.log('favoriteDrinks', favoriteDrinks);
    }, [favoriteDrinks]);

    useEffect(() => {
        if (activeTab === 'reading') {
            const viewed = recentlyViewedService.getRecentlyViewed();
            console.log('recentlyViewed', viewed);

            setRecentlyViewed(viewed);
        }
    }, [activeTab]);

    useEffect(() => {
        getPurchasedItems();
    }, [activeTab]);

    const getAuthenticatedUser = async () => {
        console.log('activeTab', activeTab);

        try {
            if (!await authService.isAuthenticated() && activeTab !== 'reading') {

                await authService.authorizeLogin();

                notification.success({
                    message: 'Lấy thông tin thành công',
                    description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
                    duration: 2,
                    placement: 'top'
                });

                getAuthenticatedUser();

                // setActiveTab('reading');

                // notification.warning({
                //     message: 'Yêu cầu đăng nhập',
                //     description: 'Bạn cần đăng nhập để xem danh sách yêu thích',
                //     duration: 3,
                //     placement: 'top'
                // });
                // setActiveTab('reading');
                return;
            }

            // if (await authService.isAuthenticated()) {
            getFavoriteCoffees();
            // } else {
            getLstCoffee();
            getLstRegion();
            getLstFlavor();
            // }
        } catch (error) {
            console.error('Error getting authenticated user:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy thông tin thư viện',
                duration: 3,
                placement: 'top'
            });

        }

    }

    const getFavoriteCoffees = async () => {
        try {
            const authenticatedUser = await authService.getAuthenticatedUser();
            console.log('authenticatedUser', authenticatedUser);
            if (!authenticatedUser?.id) return;

            const favorites = await favoriteService.getAllFavorites(authenticatedUser.id);
            console.log('favorites', favorites);
            const coffeePromises = favorites.map(async (fav) =>
                await coffeeService.getCoffeeById(fav.coffeeId)
            );

            const drinkPromises = favorites.map(async (fav) =>
                await bottledDrinkService.getBottledDrinkById(fav.coffeeId)
            );
            const coffees = await Promise.all(coffeePromises);
            const drinks = await Promise.all(drinkPromises);


            setFavoriteDrinks(drinks.filter(drink => drink !== null) as BottledDrink[]);
            setFavoriteCoffees(coffees.filter(coffee => coffee !== null) as CoffeeBean[]);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const getLstCoffee = async () => {
        const lstCoffee = await coffeeService.getAllCoffees();
        setLstCoffee(lstCoffee);
    }

    const getLstRegion = async () => {
        const lstRegion = await regionService.getAllRegions();
        setLstRegion(lstRegion);
    }

    const getLstFlavor = async () => {
        const lstFlavor = await flavorService.getAllFlavors();
        setLstFlavor(lstFlavor);
    }

    const getCartItemCount = async () => {
        const authenticatedUser = await authService.getAuthenticatedUser();
        if (authenticatedUser) {
            const count = await cartService.getCartItemCount(authenticatedUser.id);
            setCartItemCount(count);
        }
    }

    const getPurchasedItems = async () => {
        const authenticatedUser = await authService.getAuthenticatedUser();
        if (!authenticatedUser) return;

        const allOrders = await orderService.getAllOrders();
        const userOrders = allOrders.filter(order =>
            order.userId === authenticatedUser.id &&
            order.status !== 'pending'
        );

        const purchasedItems = userOrders.flatMap(order => order.items);

        // Create a map using a composite key of type and id
        const uniqueItemsMap = new Map();

        purchasedItems.forEach((item: any) => {
            const key = item.type === 'coffee' ?
                `coffee_${item.coffeeId || item.id}` :
                `drink_${item.drinkId || item.id}`;

            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, item);
            }
        });

        const uniqueItems = Array.from(uniqueItemsMap.values());
        console.log('uniqueItems', uniqueItems);

        setPurchasedItems(uniqueItems);
    };

    return (
        <div className="p-4 mb-10 bg-white pt-10"
            style={{
                paddingBottom: '50px'
            }}

        >
            <div className="mb-5 flex justify-between items-center">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Thư viện
                    </div>
                </div>
                <div className="fixed"
                    style={{
                        top: '50px',
                        right: '105px',
                        zIndex: 1000
                    }}
                    onClick={() => navigate('/cart')}
                >
                    <FaShoppingCart className="h-6 w-6 text-8am-white bg-8am-gray rounded-full p-1" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {cartItemCount}
                    </span>
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
                            {favoriteCoffees.length + favoriteDrinks.length}
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

                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Display books based on active tab */}
            <div className="grid grid-cols-2 gap-4 pb-2">
                {activeTab === 'favorite' ? (
                    <>
                        {favoriteCoffees.map((coffee: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} />
                            </div>
                        ))}

                        {favoriteDrinks.map((drink: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} key={drink.id} {...drink} isShowLike={false} />
                            </div>
                        ))}

                        {favoriteCoffees.length === 0 && favoriteDrinks.length === 0 && (
                            <div className="flex justify-center items-center text-gray-500 w-full "
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    width: '100vw',
                                    paddingRight: '10px'
                                }}
                            >
                                Chưa có sản phẩm nào được yêu thích
                            </div>
                        )}
                    </>

                ) : activeTab === 'reading' ? (
                    recentlyViewed.length > 0 ? (
                        recentlyViewed.map((coffee: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                {coffee.type === 'coffee' ?
                                    <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} />
                                    :
                                    <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} />
                                }
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-center items-center text-gray-500 w-full "
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                width: '100vw',
                                paddingRight: '10px'
                            }}
                        >
                            Chưa có sản phẩm nào được xem
                        </div>
                    )
                ) : activeTab === 'downloaded' ? (
                    purchasedItems.length > 0 ? (
                        purchasedItems.map((item: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <div className="relative bg-gray-100 shadow-md rounded-lg overflow-hidden cursor-pointer aspect-[3/4]"
                                    style={{
                                        height: 250,
                                        width: 160,
                                    }}
                                >
                                    <img
                                        src={item.imageUrl}
                                        className="w-full h-full object-cover"
                                        onClick={
                                            item.type === 'coffee'
                                                ? () => navigate(`/coffee/${item.id}`)
                                                : () => navigate(`/bottled-drink/${item.id})`)
                                        }
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
                                        <div className=" text-sm font-semibold"
                                            style={{
                                                color: '#FFFFFFCC',
                                                fontSize: 12,
                                                lineClamp: 1,
                                                display: '-webkit-box',
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',

                                            }}
                                        >
                                            {/* {item?.region.join(', ')} */}
                                        </div>

                                        <div className="text-white text-base font-semibold"
                                            style={{
                                                fontSize: 12,
                                            }}
                                        >
                                            {item.name}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="flex justify-center items-center text-gray-500 w-full "
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                width: '100vw',
                                paddingRight: '10px'
                            }}
                        >
                            Chưa có sản phẩm nào được mua
                        </div>
                    )
                ) : null}
            </div>
        </div>
    );
};

export default Library;