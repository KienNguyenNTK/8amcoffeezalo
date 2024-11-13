import React, { useEffect, useState } from "react";
import { Page, Box, Text, Input, Button } from "zmp-ui";
import CoffeeCard from "../components/coffee-card";
import { CoffeeBean } from "types/coffee";
import { useStorageImages } from "hooks/useStorageImages";
import { coffeeService } from "firebase/coffeeService";
import { FaShoppingCart } from "react-icons/fa";
import CoffeeSkeleton from "components/CoffeeSkeleton";
import { Region } from "types/region";
import { regionService } from "firebase/regionService";
import { useNavigate } from "react-router-dom";
import { Flavor } from "types/flavor";
import { flavorService } from "firebase/flavorService";
import SearchInput from "components/SearchInput";
import { useFirebase } from "../firebase/FirebaseContext";
import { authService } from "../services/authService";
import { favoriteService } from "../firebase/favoriteService";
import { notification } from "antd";
import { recentlyViewedService } from "../services/recentlyViewedService";

const Library = () => {
    const { loading, error } = useStorageImages('Coffee');
    const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
    const [lstRegion, setLstRegion] = useState<Region[]>([]);
    const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
    const [activeTab, setActiveTab] = useState('reading');
    const [favoriteCoffees, setFavoriteCoffees] = useState<CoffeeBean[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<CoffeeBean[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        getAuthenticatedUser();
    }, [activeTab]);

    useEffect(() => {
        console.log(favoriteCoffees);
    }, [favoriteCoffees]);

    useEffect(() => {
        if (activeTab === 'reading') {
            const viewed = recentlyViewedService.getRecentlyViewed();
            setRecentlyViewed(viewed);
        }
    }, [activeTab]);

    const getAuthenticatedUser = async () => {
        console.log('activeTab', activeTab);

        if (!await authService.isAuthenticated() && activeTab === 'favorite') {
            notification.warning({
                message: 'Yêu cầu đăng nhập',
                description: 'Bạn cần đăng nhập để xem danh sách yêu thích',
                duration: 3,
                placement: 'top'
            });
            setActiveTab('reading');
            return;
        }

        if (await authService.isAuthenticated() && activeTab === 'favorite') {
            getFavoriteCoffees();
        } else {
            getLstCoffee();
            getLstRegion();
            getLstFlavor();
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
            const coffees = await Promise.all(coffeePromises);
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

    return (
        <div className="p-4 mb-10"
            style={{
                marginTop: '25px'
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
                >
                    <FaShoppingCart className="h-6 w-6 text-8am-white bg-8am-gray rounded-full p-1" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        8
                    </span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex gap-4 p-2 items-center justify-around"
                    style={{
                        borderTop: '1px solid #E0E0E0',
                        borderBottom: '1px solid #E0E0E0',
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
                            {favoriteCoffees.length}
                        </div>
                        <div className="text-8am-gray text-xs">Yêu thích</div>
                    </div>
                    <div className="text-center">
                        <div className="text-8am-black text-base font-bold">0</div>
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
                            ? 'bg-8am-black text-white'
                            : 'bg-gray-100 text-8am-gray'
                            }`}
                        style={{
                            borderRadius: '10px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}

                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Display books based on active tab */}
            <div className="grid grid-cols-2 gap-4">
                {activeTab === 'favorite' ? (
                    favoriteCoffees.map(coffee => (
                        <CoffeeCard key={coffee.id} {...coffee} isShowLike={false} />
                    ))
                ) : activeTab === 'reading' ? (
                    recentlyViewed.length > 0 ? (
                        recentlyViewed.map(coffee => (
                            <CoffeeCard key={coffee.id} {...coffee} isShowLike={false} />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 w-full py-8">
                            Chưa có cà phê nào được xem
                        </div>
                    )
                ) : (
                    lstCoffee.map(coffee => (
                        <CoffeeCard key={coffee.id} {...coffee} isShowLike={false} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Library; 