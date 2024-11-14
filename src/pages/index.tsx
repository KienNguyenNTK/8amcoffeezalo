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

const HomePage = () => {

    const { loading, error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        getLstCoffee();
        getCartItemCount();
    }, []);

    useEffect(() => {
        getAccessToken().then((token) => {
            console.log(token);
        });
    }, []);



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

    return (
        <div className="p-4 mb-10"
            style={{
                marginTop: '20px'
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
                <div className="flex flex-wrap gap-4 justify-center">
                    {lstCoffee.map((coffee: any, index) => (
                        <CoffeeCard
                            key={index}
                            {...coffee}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;
