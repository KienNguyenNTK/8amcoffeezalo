import CoffeeSkeleton from "../components/CoffeeSkeleton";
import { coffeeService } from "../firebase/coffeeService";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { CoffeeBean } from "../types/coffee";
import CoffeeCard from "../components/coffee-card";
import { flavorService } from "../firebase/flavorService";
import { userService } from "../firebase/userService";

const FlavorCoffees = () => {
    const { flavorName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);
    const [flavorImage, setFlavorImage] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>();

    useEffect(() => {
        checkLocal();
    }, []);

    useEffect(() => {
        if (flavorName) {
            loadCoffeesByFlavor(flavorName);
            getImageOnFlavor(flavorName);
        }
    }, [flavorName]);

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

    const loadCoffeesByFlavor = async (flavor: string) => {
        try {
            setLoading(true);
            const allCoffees = await coffeeService.getAllCoffees();
            const filteredCoffees = allCoffees.filter(coffee => 
                coffee.flavorNotes.some(note => 
                    note.toLowerCase() === flavor.toLowerCase()
                )
            );
            setCoffees(filteredCoffees);
        } catch (error) {
            console.error("Error loading coffees:", error);
        } finally {
            setLoading(false);
        }
    };

    const getImageOnFlavor = async (flavor: string) => {
        const iconUrl: any = await flavorService.getFlavorImageByName(flavor);
        setFlavorImage(iconUrl);
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

            <div className="mb-4 flex items-center justify-center gap-2">
                <img src={flavorImage} alt={flavorName} className="w-6 h-6" />
                <div className="text-8am-black text-2xl font-bold text-center">
                    {flavorName}
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
                    {coffees.map((coffee: any) => (
                        <CoffeeCard key={coffee.id} {...coffee} userInfo={userInfo}/>
                    ))}
                    {coffees.length === 0 && (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không tìm thấy cà phê nào có hương vị này
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FlavorCoffees; 