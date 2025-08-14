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
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import { Dish } from "../types/dish";
import { DishService } from '../firebase/dishService';
import DishCard from "../components/dish-card";
import { GrinderService } from "../firebase/grinderService";
import { BrewerService } from "../firebase/brewerService";
import { CoffeeGrinder } from "../types/grinder";
import { Brewer } from "../types/brewer";
import MachineCard from "../components/machine-card";
const Library = () => {
    const { loading, error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [lstRegion, setLstRegion] = useState<Region[]>([]);
    const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
    const [lstDishes, setLstDishes] = useState<Dish[]>([]);
    const [activeTab, setActiveTab] = useState('reading');
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [favoriteDrinks, setFavoriteDrinks] = useState<BottledDrink[]>([]);
    const [favoriteDishes, setFavoriteDishes] = useState<Dish[]>([]);
    const [favoriteGrinders, setFavoriteGrinders] = useState<CoffeeGrinder[]>([]);
    const [favoriteBrewers, setFavoriteBrewers] = useState<Brewer[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const navigate = useNavigate();
    const [cartItemCount, setCartItemCount] = useState(0);
    const [userInfo, setUserInfo] = useState<any>();
    const dishService = new DishService();
    const grinderService = new GrinderService();
    const brewerService = new BrewerService();
    useEffect(() => {
        checkLocal();
    }, []);

    useEffect(() => {
        getCartItemCount();
    }, [userInfo]);

    useEffect(() => {
        if (userInfo) {
            getAuthenticatedUser();
        }
        if (activeTab === 'reading') {
            const getViewed = async () => {
                const viewed = await recentlyViewedService.getRecentlyViewed(userInfo?.id);
                console.log('recentlyViewed', viewed);
                setRecentlyViewed(viewed);
            };
            getViewed();
        }
        if (userInfo) {
            getPurchasedItems();
        }
    }, [activeTab, userInfo]);

    const checkLocal = async () => {
        // const idUser = localStorage.getItem('idUser');
        const userId = await getUserID();

        const user = await userService.getUserByLocalId(userId);

        if (user) {
            setUserInfo(user);
        }
    };

    const getAuthenticatedUser = async () => {
        // console.log('activeTab', activeTab);

        // if (!await authService.isAuthenticated()) {
        //     notification.warning({
        //         message: 'Yêu cầu thông tin',
        //         description: 'Chúng tôi cần thông tin của bạn để có thể giúp bạn xem đầy đủ thông tin thư viện',
        //         duration: 1.5,
        //         placement: 'top'
        //     });
        // }

        // setTimeout(async () => {
        try {
            // if (!await authService.isAuthenticated() && activeTab !== 'reading') {

            //     await authService.authorizeLogin();

            //     notification.success({
            //         message: 'Lấy thông tin thành công',
            //         description: 'Vui lòng thao tác lại, chúc bạn một ngày tốt lành!',
            //         duration: 1.5,
            //         placement: 'top'
            //     });

            //     getAuthenticatedUser();

            //     // setActiveTab('reading');

            //     // notification.warning({
            //     //     message: 'Yêu cầu đăng nhập',
            //     //     description: 'Bạn cần đăng nhập để xem danh sách yêu thích',
            //     //     duration: 3,
            //     //     placement: 'top'
            //     // });
            //     // setActiveTab('reading');
            //     return;
            // }

            // if (await authService.isAuthenticated()) {
            getFavoriteCoffees();
            // } else {
            getLstCoffee();
            getLstRegion();
            getLstFlavor();
            getLstDishes();
            // }
        } catch (error) {
            console.error('Error getting authenticated user:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Không thể lấy thông tin thư viện do không có thông tin người dùng',
                duration: 3,
                placement: 'top',
                closable: false
            });

        }
        // }, 1000);
    }

    const getFavoriteCoffees = async () => {
        try {
            if (!userInfo?.id) {
                console.log('No user info available');
                return;
            }

            const favorites = await favoriteService.getAllFavorites(userInfo.id);
            console.log('favorites in Library:', favorites);
            
            // Process each favorite to determine its type and get the correct data
            const coffeeResults: CoffeeBean[] = [];
            const drinkResults: BottledDrink[] = [];
            const dishResults: Dish[] = [];
            const grinderResults: CoffeeGrinder[] = [];
            const brewerResults: Brewer[] = [];

            for (const fav of favorites) {
                try {
                    // Try to get as coffee first
                    const coffee = await coffeeService.getCoffeeById(fav.coffeeId);
                    if (coffee) {
                        coffeeResults.push(coffee);
                        continue;
                    }

                    // Try to get as bottled drink
                    const drink = await bottledDrinkService.getBottledDrinkById(fav.coffeeId);
                    if (drink) {
                        drinkResults.push(drink);
                        continue;
                    }

                    // Try to get as dish
                    const dish = await dishService.getDishById(fav.coffeeId);
                    if (dish) {
                        dishResults.push(dish);
                        continue;
                    }

                    // Try to get as grinder
                    const grinder = await grinderService.getById(fav.coffeeId);
                    if (grinder) {
                        grinderResults.push(grinder);
                        continue;
                    }

                    // Try to get as brewer
                    const brewer = await brewerService.getById(fav.coffeeId);
                    if (brewer) {
                        brewerResults.push(brewer);
                    }
                } catch (itemError) {
                    console.log(`Could not fetch item ${fav.coffeeId}:`, itemError);
                }
            }

            console.log('Coffee results:', coffeeResults);
            console.log('Drink results:', drinkResults);
            console.log('Dish results:', dishResults);
            console.log('Grinder results:', grinderResults);
            console.log('Brewer results:', brewerResults);

            setFavoriteCoffees(coffeeResults);
            setFavoriteDrinks(drinkResults);
            setFavoriteDishes(dishResults);
            setFavoriteGrinders(grinderResults);
            setFavoriteBrewers(brewerResults);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const getLstCoffee = async () => {
        const lstCoffee = await coffeeService.getAllCoffees();
        setLstCoffee(lstCoffee);
    }

    const getLstDishes = async () => {
        const allDishes = await dishService.getDishesFilteredByGroups();
        setLstDishes(allDishes);
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
        // const authenticatedUser = await authService.getAuthenticatedUser();
        if (userInfo) {
            const count = await cartService.getCartItemCount(userInfo.id);
            setCartItemCount(count);
        }
        // else {
        //     const cartItemLocal = localStorage.getItem('cartItems');
        //     if (cartItemLocal) {
        //         const cartItems = JSON.parse(cartItemLocal);
        //         setCartItemCount(cartItems.length);
        //     }
        // }
    }

    // Helper function to get correct image URL for different product types
    const getProductImageUrl = (item: any) => {
        if (!item) return '';
        
        // For coffee: imageUrl or first image from images array
        if (item.imageUrl) {
            return item.imageUrl;
        }
        
        // For bottled drinks and others: first image from images array
        if (item.images && item.images.length > 0) {
            return item.images[0];
        }
        
        // Fallback
        return '';
    };

    const getPurchasedItems = async () => {
        // const authenticatedUser = await authService.getAuthenticatedUser();
        // if (!authenticatedUser) return;

        const allOrders = await orderService.getAllOrders();
        const userOrders = allOrders.filter(order =>
            order.userId === userInfo.id &&
            order.status === 'paid'
        );

        const purchasedItems = userOrders.flatMap(order => order.items);

        // Create a map using a composite key of type and id
        const uniqueItemsMap = new Map();

        purchasedItems.forEach((item: any) => {
            const key = item.type === 'coffee' ?
                `coffee_${item.coffeeId || item.id}` :
                item.type === 'drink' ?
                    `drink_${item.drinkId || item.id}` :
                item.type === 'grinder' ?
                    `grinder_${item.grinderId || item.id}` :
                item.type === 'brewer' ?
                    `brewer_${item.brewerId || item.id}` :
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
                        {/* Giỏ hàng đã chuyển xuống bottom navigation */}
        {/* <div className="fixed"
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
        </div> */}
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
                            {favoriteCoffees.length + favoriteDrinks.length + favoriteDishes.length}
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
                                <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteDrinks.map((drink: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} key={drink.id} {...drink} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteDishes.map((dish: any) => (
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <DishCard width={160} height={250} fontTitle={12} fontName={12} key={dish.id} {...dish} isShowLike={false} userInfo={userInfo} />
                            </div>
                        ))}

                        {favoriteGrinders.map((grinder: any) => (
                            <div key={grinder.id} style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <MachineCard
                                    machine={grinder}
                                    type="grinder"
                                    width={160}
                                    height={250}
                                    fontTitle={12}
                                    fontName={12}
                                    isShowLike={false}
                                    userInfo={userInfo}
                                />
                            </div>
                        ))}

                        {favoriteBrewers.map((brewer: any) => (
                            <div key={brewer.id} style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}>
                                <MachineCard
                                    machine={brewer}
                                    type="brewer"
                                    width={160}
                                    height={250}
                                    fontTitle={12}
                                    fontName={12}
                                    isShowLike={false}
                                    userInfo={userInfo}
                                />
                            </div>
                        ))}

                        {favoriteCoffees.length === 0 && favoriteDrinks.length === 0 && favoriteDishes.length === 0 && favoriteGrinders.length === 0 && favoriteBrewers.length === 0 && (
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
                                {coffee.type === 'coffee' &&
                                    <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} userInfo={userInfo} />
                                }
                                {
                                    coffee.type === 'drink' &&
                                    <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} userInfo={userInfo} />
                                }
                                {
                                    coffee.type === 'dish' &&
                                    <DishCard width={160} height={250} fontTitle={12} fontName={12} key={coffee.id} {...coffee} isShowLike={false} userInfo={userInfo} />
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
                                        src={getProductImageUrl(item)}
                                        className="w-full h-full object-cover"
                                        onClick={() => {
                                            if (item.type === 'coffee') navigate(`/coffee/${item.coffeeId || item.id}`);
                                            else if (item.type === 'drink') navigate(`/bottled-drink/${item.drinkId || item.id}`);
                                            else if (item.type === 'dish') navigate(`/dish/${item.dishId || item.id}`);
                                            else if (item.type === 'grinder') navigate(`/grinder/${item.grinderId || item.id}`);
                                            else if (item.type === 'brewer') navigate(`/brewer/${item.brewerId || item.id}`);
                                        }}
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
                                            {item.type === 'coffee' && 'Hạt cà phê'}
                                            {item.type === 'drink' && 'Đồ uống'}
                                            {item.type === 'dish' && 'Cà phê'}
                                            {item.type === 'grinder' && 'Máy xay'}
                                            {item.type === 'brewer' && 'Máy pha'}
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