import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import React, { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
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
import zmpSdk from "zmp-sdk";
import axios from "axios";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";
import { userService } from "../firebase/userService";

const HomePage = () => {

    const { error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [lstCollection, setLstCollection] = useState<CoffeeCollection[]>([]);
    const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>();

    useEffect(() => {
        getLstCoffee();
        getLstCollection();
        getLstBottledDrink();
        checkLocal();
    }, []);

    useEffect(() => {
        getAccessToken().then((token) => {
            console.log(token);
        });
    }, []);

    useEffect(() => {
        if (lstCoffee.length > 0 && lstCollection.length > 0 && lstBottledDrink.length > 0) {
            setLoading(false);
        }
    }, [lstCoffee, lstCollection, lstBottledDrink]);

    useEffect(() => {
        getCartItemCount();
    }, [userInfo]);

    const checkLocal = async () => {
        const idUser = localStorage.getItem('idUser');
        if (idUser) {
            await userService.getUserByLocalId(idUser)
                .then((req) => {
                    console.log('User get successfully', req);
                    setUserInfo(req);
                })
                .catch((error) => {
                    console.error('Could not get user:', error);
                });
        }
    };

    const getCartItemCount = async () => {
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
    };


    const getLstCoffee = async () => {
        const lstCoffee = await coffeeService.getAllCoffees();
        setLstCoffee(lstCoffee);
    }

    const handleLoginSuccess = () => {
        getLstCoffee();
        getCartItemCount();
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

    const deleteUser = async () => {
        localStorage.clear();

        await userService.deleteUser('DaQWGW2uLEYK9nUjJ1hy')
            .then((req) => {
                console.log('User deleted successfully', req);
            })
            .catch((error) => {
                console.error('Could not delete user:', error);
            });
    }

    return (
        <div className="p-4 mb-10 bg-white pt-8"
            style={{
                paddingBottom: '50px'
            }}
        >
            <div className="mb-4 flex justify-between items-center relative">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Hôm nay
                    </div>
                    <div className="text-8am-middle-grey text-xl font-bold">
                        Mới và hot
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

            {loading ? (
                <div className="flex flex-wrap gap-4">
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                </div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                        {lstCoffee.slice(0, 5).map((coffee: any, index) => (
                            <CoffeeCard
                                key={index}
                                {...coffee}
                                onLoginSuccess={handleLoginSuccess}
                                userInfo={userInfo}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                        {lstBottledDrink.slice(0, 5).map((drink: any, index) => (
                            <BottledDrinkCard
                                key={index}
                                {...drink}
                                onLoginSuccess={handleLoginSuccess}
                                userInfo={userInfo}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                        {lstCollection.map((collection: CoffeeCollection, index) => (
                            <CollectionCard
                                key={index}
                                collection={collection}
                            />
                        ))}
                    </div>
                </>
            )}
            
            {/* <Button type="primary" className="w-full mt-4" onClick={deleteUser}>
                Xóa người dùng
            </Button> */}

            {/* <Button type="primary" className="w-full mt-4" onClick={() => navigate('/authorize')}>
                Authorize
            </Button> */}
        </div>
    );
};

export default HomePage;
