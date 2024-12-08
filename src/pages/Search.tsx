import React, { useState, useEffect } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { CoffeeBean } from '../types/coffee';
import { coffeeService } from '../firebase/coffeeService';
import CoffeeCard from '../components/coffee-card';
import CoffeeSkeleton from '../components/CoffeeSkeleton';
import { userService } from '../firebase/userService';

const Search = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);
    const [filteredCoffees, setFilteredCoffees] = useState<CoffeeBean[]>([]);
    const [userInfo, setUserInfo] = useState<any>();
    useEffect(() => {
        loadCoffees();
        checkLocal();
    }, []);

    useEffect(() => {
        filterCoffees();
    }, [searchTerm, coffees]);

    const checkLocal = async () => {
        const idUser = localStorage.getItem('idUser');
        if (idUser) {
            await userService.getUserByLocalId(idUser)
                .then((req) => {
                    setUserInfo(req);
                })
                .catch((error) => {
                    console.error('Could not get user:', error);
                });
        }
    };

    const loadCoffees = async () => {
        setLoading(true);
        try {
            const allCoffees = await coffeeService.getAllCoffees();
            setCoffees(allCoffees);
            setFilteredCoffees(allCoffees);
        } catch (error) {
            console.error('Error loading coffees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterCoffees = () => {
        if (!searchTerm.trim()) {
            setFilteredCoffees(coffees);
            return;
        }

        const filtered = coffees.filter(coffee =>
            coffee.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCoffees(filtered);
    };

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

            </div>

            <div className="mb-4">
                <div className="text-8am-black text-xl font-bold text-center">
                    Tìm kiếm cà phê
                </div>

                <div className="flex-1">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Tìm kiếm cà phê..."
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
                <div className="flex flex-wrap gap-4 justify-center">
                    {filteredCoffees.map((coffee: any) => (
                        <CoffeeCard key={coffee.id} {...coffee} userInfo={userInfo} />
                    ))}
                    {filteredCoffees.length === 0 && (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không tìm thấy cà phê nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search; 