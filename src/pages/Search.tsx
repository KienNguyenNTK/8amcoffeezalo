import React, { useState, useEffect } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { CoffeeBean } from '../types/coffee';
import { coffeeService } from '../firebase/coffeeService';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import CoffeeCard from '../components/coffee-card';
import BottledDrinkCard from '../components/bottled-drink-card';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import { userService } from '../firebase/userService';
import { BottledDrink } from '../types/bottledDrink';
import { getUserID } from 'zmp-sdk/apis';
import { DishService } from '../firebase/dishService';
import { Dish } from '../types/dish';
import DishCard from '../components/dish-card';

const Search = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);
    const [drinks, setDrinks] = useState<BottledDrink[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [filteredCoffees, setFilteredCoffees] = useState<CoffeeBean[]>([]);
    const [filteredDrinks, setFilteredDrinks] = useState<BottledDrink[]>([]);
    const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
    const [userInfo, setUserInfo] = useState<any>();
    const dishService = new DishService();

    useEffect(() => {
        loadData();
        checkLocal();
    }, []);

    useEffect(() => {
        filterItems();
    }, [searchTerm, coffees, drinks, dishes]);

    const checkLocal = async () => {
        // const idUser = localStorage.getItem('idUser');
        const userId = await getUserID();

        const user = await userService.getUserByLocalId(userId);

        if (user) {
            setUserInfo(user);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [allCoffees, allDrinks, allDishes] = await Promise.all([
                coffeeService.getAllCoffees(),
                bottledDrinkService.getAllBottledDrinks(),
                dishService.getDishesFilteredByGroups()
            ]);
            setCoffees(allCoffees);
            setDrinks(allDrinks);
            setDishes(allDishes);
            setFilteredCoffees(allCoffees);
            setFilteredDrinks(allDrinks);
            setFilteredDishes(allDishes);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        if (!searchTerm.trim()) {
            setFilteredCoffees(coffees);
            setFilteredDrinks(drinks);
            setFilteredDishes(dishes);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();

        const filteredCoffeeResults = coffees.filter(coffee =>
            coffee.name.toLowerCase().includes(searchTermLower)
        );
        setFilteredCoffees(filteredCoffeeResults);

        const filteredDrinkResults = drinks.filter(drink =>
            drink.name.toLowerCase().includes(searchTermLower)
        );
        setFilteredDrinks(filteredDrinkResults);

        const filteredDishResults = dishes.filter(dish =>
            dish.name.toLowerCase().includes(searchTermLower)
        );
        setFilteredDishes(filteredDishResults);
    };

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px", marginBottom: "60px" }}>
            <div className="mb-4 flex items-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        zIndex: 1000
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>
            </div>

            <div className="mb-4">
                <div className="text-8am-black text-xl font-bold text-center">
                    Tìm kiếm
                </div>

                <div className="flex-1">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        className="w-full pl-4 pr-4 py-2 rounded-lg bg-gray-100 h-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-wrap gap-4">
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                </div>
            ) : (
                <div>
                    {(filteredCoffees.length > 0 || filteredDrinks.length > 0 || filteredDishes.length > 0) ? (
                        <>
                            {filteredDishes.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-3">Món ăn</h2>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {filteredDishes.map((dish: any) => (
                                            <DishCard 
                                                key={dish.id} 
                                                {...dish} 
                                                userInfo={userInfo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredCoffees.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-3">Cà phê</h2>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {filteredCoffees.map((coffee: any) => (
                                            <CoffeeCard key={coffee.id} {...coffee} userInfo={userInfo} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredDrinks.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Đồ uống đóng chai</h2>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {filteredDrinks.map((drink: any) => (
                                            <BottledDrinkCard key={drink.id} {...drink} userInfo={userInfo} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không tìm thấy sản phẩm nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search; 