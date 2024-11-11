import React, { useEffect, useState } from "react";
import { Page, Box, Text } from "zmp-ui";
import CoffeeCard from "../components/coffee-card";
import CartIcon from "../public/images/card-icon.svg";
import CoffeeSkeleton from "../components/CoffeeSkeleton";
import { useStorageImages } from '../hooks/useStorageImages';
import { getAccessToken } from "zmp-sdk/apis";
import { coffeeService } from "firebase/coffeeService";
import { CoffeeBean } from "types/coffee";
import { FaShoppingCart } from "react-icons/fa";

const HomePage = () => {

    const {loading, error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);

    useEffect(() => {
        getLstCoffee();
    }, []);

    useEffect(() => {
        getAccessToken().then((token) => {
            console.log(token);
        });
    }, []);

    const getLstCoffee = async () => {
        const lstCoffee = await coffeeService.getAllCoffees();
        setLstCoffee(lstCoffee);
    }

    return (
        <div className="p-4 mb-10"
            style={{
                marginTop: '50px'
            }}
        >
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <div className="text-8am-black text-3xl font-bold">
                        Hôm nay
                    </div>
                    <div className="text-8am-middle-grey text-xl font-bold">
                        Mới và hot
                    </div>
                </div>
                <div className="relative">
                    <FaShoppingCart className="h-6 w-6 text-8am-white bg-8am-gray rounded-full p-1"  />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        8
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
                    {lstCoffee.map((coffee, index) => (
                        <CoffeeCard
                            key={index}
                            {...coffee}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;
