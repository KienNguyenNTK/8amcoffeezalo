import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { CoffeeBean } from "types/coffee";
import { coffeeService } from "firebase/coffeeService";
import CoffeeCard from "../components/coffee-card";
import CoffeeSkeleton from "components/CoffeeSkeleton";

const RegionCoffees = () => {
    const { regionName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);

    useEffect(() => {
        if (regionName) {
            loadCoffeesByRegion(regionName);
        }
    }, [regionName]);

    const loadCoffeesByRegion = async (region: string) => {
        try {
            setLoading(true);
            const results = await coffeeService.searchByRegion(region);
            setCoffees(results);
        } catch (error) {
            console.error("Error loading coffees:", error);
        } finally {
            setLoading(false);
        }
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
                <div className="text-8am-black text-2xl font-bold text-center">
                    Vùng trồng: {regionName}
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
                    {coffees.map((coffee, index) => (
                        <CoffeeCard key={coffee.id} {...coffee} />
                    ))}
                    {coffees.length === 0 && (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không tìm thấy cà phê nào từ vùng này
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RegionCoffees; 