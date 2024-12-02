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
import { Button } from "antd";
import zmpSdk from "zmp-sdk";
import axios from "axios";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";

const HomePage = () => {

    const { error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [lstCollection, setLstCollection] = useState<CoffeeCollection[]>([]);
    const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getLstCoffee();
        getCartItemCount();
        getLstCollection();
        getLstBottledDrink();
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

    const getCartItemCount = async () => {
        const authenticatedUser = await authService.getAuthenticatedUser();
        if (authenticatedUser) {
            const count = await cartService.getCartItemCount(authenticatedUser.id);
            setCartItemCount(count);
        }
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

    const sendMessageToUser = async () => {
        try {
            console.log('authService.isAuthenticated()', await authService.isAuthenticated());

            const authenticatedUser = await authService.getAuthenticatedUser();
            console.log('authenticatedUser', authenticatedUser);

            // const accessToken = await axios.post('https://oauth.zaloapp.com/v4/oa/access_token', 
            //     new URLSearchParams({
            //         refresh_token: import.meta.env.VITE_REFRESH_TOKEN,
            //         app_id: import.meta.env.VITE_APP_ID,
            //         grant_type: 'refresh_token'
            //     }).toString(),
            //     {
            //         headers: {
            //             'Content-Type': 'application/x-www-form-urlencoded',
            //             'secret_key': import.meta.env.VITE_SECRET_KEY,
            //         }
            //     }
            // );

            // console.log('accessToken', accessToken.data.access_token);

            const lstUser = await axios.get('https://openapi.zalo.me/v3.0/oa/user/getlist?data={"offset":0,"count":15}', {
                headers: {
                    'access_token': import.meta.env.VITE_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            console.log('lstUser', lstUser);

            lstUser.data.data.users.forEach(async (user: any) => {
                const userDetail = await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${user.user_id}"}`, {
                    headers: {
                        'access_token': import.meta.env.VITE_ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('userDetail', userDetail.data.data);

                if (userDetail.data.data.display_name.toLowerCase() === authenticatedUser.name.toLowerCase()) {
                    const response = await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
                        recipient: {
                            user_id: user.user_id
                        },
                        message: {
                            text: 'Hello, this is a test message'
                        }
                    }, {
                        headers: {
                            'access_token': import.meta.env.VITE_ACCESS_TOKEN,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('Message sent successfully:', response.data);
                }
            });

        } catch (error) {
            console.error(error);
        }
    };

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
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                        {lstBottledDrink.slice(0, 5).map((drink: any, index) => (
                            <BottledDrinkCard
                                key={index}
                                {...drink}
                                onLoginSuccess={handleLoginSuccess}
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

            {/* <Button type="primary" className="w-full mt-4" onClick={sendMessageToUser}>
                Gửi tin nhắn người dùng
            </Button> */}
        </div>
    );
};

export default HomePage;
