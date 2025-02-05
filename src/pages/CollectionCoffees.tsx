import React, { useEffect, useState } from "react";
// import ReactMarkdown from 'react-markdown';
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
import '../styles/collection-description.scss';
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";

const CollectionCoffees = () => {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<CoffeeCollection | null>(null);
    const [coffees, setCoffees] = useState<CoffeeBean[]>([]);
    const [drinks, setDrinks] = useState<BottledDrink[]>([]);
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
            const collectionData = await collectionService.getCollectionById(id);
            if (!collectionData) {
                throw new Error("Collection not found");
            }
            setCollection(collectionData);

            // Chỉ lấy các items có type và itemId hợp lệ
            const coffeePromises = collectionData.items
                .filter(item => item.type === 'coffee' && item.itemId)
                .map(item => coffeeService.getCoffeeById(item.itemId));

            const drinkPromises = collectionData.items
                .filter(item => item.type === 'drink' && item.itemId)
                .map(item => bottledDrinkService.getBottledDrinkById(item.itemId));

            // Xử lý riêng từng loại để tránh lỗi Promise.all khi có promise bị reject
            const coffeeResults = await Promise.all(
                coffeePromises.map(p => p.catch(e => {
                    console.error('Error fetching coffee:', e);
                    return null;
                }))
            );

            const drinkResults = await Promise.all(
                drinkPromises.map(p => p.catch(e => {
                    console.error('Error fetching drink:', e);
                    return null;
                }))
            );

            // Filter và sort như cũ
            const validCoffees = coffeeResults
                .filter((coffee): coffee is CoffeeBean => coffee !== null)
                .sort((a, b) => {
                    const orderA = collectionData.items.find(c => c.itemId === a.id)?.order || 0;
                    const orderB = collectionData.items.find(c => c.itemId === b.id)?.order || 0;
                    return orderA - orderB;
                });

            const validDrinks = drinkResults
                .filter((drink): drink is BottledDrink => drink !== null)
                .sort((a, b) => {
                    const orderA = collectionData.items.find(c => c.itemId === a.id)?.order || 0;
                    const orderB = collectionData.items.find(c => c.itemId === b.id)?.order || 0;
                    return orderA - orderB;
                });

            setCoffees(validCoffees);
            setDrinks(validDrinks);
        } catch (error) {
            console.error("Error loading collection coffees:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px", marginBottom: "60px" }}>
            <div className="mb-4 flex items-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: 'absolute',
                        top: '45px',
                        left: '10px',
                        zIndex: 1000,
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>
            </div>

            {collection && (
                <div className="mb-4 pt-10">
                    <div className="text-8am-black text-2xl font-bold text-center">
                        {collection.headline}
                    </div>
                    <div className="text-8am-middle-grey text-base text-center mt-2">
                        {collection.name}
                    </div>
                    <div
                        className="text-8am-middle-grey collection-description mx-2"
                        dangerouslySetInnerHTML={{ __html: collection.description }}
                    />
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
                    {drinks.map((drink: any) => (
                        <BottledDrinkCard
                            key={drink.id}
                            {...drink}
                            userInfo={userInfo}
                        />
                    ))}
                    {coffees.length === 0 && drinks.length === 0 && (
                        <div className="text-center text-gray-500 w-full py-8">
                            Không có sản phẩm nào trong tuyển tập này
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollectionCoffees;