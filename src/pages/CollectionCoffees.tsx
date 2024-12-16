import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { CoffeeBean } from "../types/coffee";
import { coffeeService } from "../firebase/coffeeService";
import { collectionService } from "../firebase/collectionService";
import CoffeeCard from "../components/coffee-card";
import CoffeeSkeleton from "../components/CoffeeSkeleton";
import { CoffeeCollection } from "../types/collection";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";

const CollectionCoffees = () => {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<CoffeeCollection | null>(null);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);
    const [userInfo, setUserInfo] = useState<any>();

    useEffect(() => {
        checkLocal();
    }, []);

    useEffect(() => {
        if (collectionId) {
            loadCollectionCoffees(collectionId);
        }
    }, [collectionId]);

    const checkLocal = async () => {
        // const idUser = localStorage.getItem('idUser');
        const userId = await getUserID();

        const user = await userService.getUserByLocalId(userId);

        if (user) {
            setUserInfo(user);
        }
    };

    const loadCollectionCoffees = async (id: string) => {
        try {
            setLoading(true);
            // First get the collection details
            const collectionData = await collectionService.getCollectionById(id);
            if (!collectionData) {
                throw new Error("Collection not found");
            }
            setCollection(collectionData);

            // Then fetch all coffees in the collection
            const coffeePromises = collectionData.coffees.map(item =>
                coffeeService.getCoffeeById(item.coffeeId)
            );

            const coffeeResults = await Promise.all(coffeePromises);
            // Filter out any null results and sort by order
            const validCoffees = coffeeResults
                .filter((coffee): coffee is CoffeeBean => coffee !== null)
                .sort((a, b) => {
                    const orderA = collectionData.coffees.find(c => c.coffeeId === a.id)?.order || 0;
                    const orderB = collectionData.coffees.find(c => c.coffeeId === b.id)?.order || 0;
                    return orderA - orderB;
                });

            setCoffees(validCoffees);
        } catch (error) {
            console.error("Error loading collection coffees:", error);
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

            {collection && (
                <div className="mb-4">
                    <div className="text-8am-black text-2xl font-bold text-center">
                        {collection.headline}
                    </div>
                    <div className="text-8am-middle-grey text-base text-center mt-2">
                        {collection.name}
                    </div>
                    <div className="text-8am-middle-grey text-sm text-center mt-2">
                        {collection.description}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-wrap gap-4">
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                    <CoffeeSkeleton />
                </div>
            ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                    {coffees.map((coffee: any) => (
                        <CoffeeCard
                            key={coffee.id}
                            {...coffee}
                            userInfo={userInfo}
                        />
                    ))}
                    {coffees.length === 0 && (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không có cà phê nào trong tuyển tập này
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollectionCoffees; 