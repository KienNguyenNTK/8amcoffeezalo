import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { DishService } from "../firebase/dishService";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import CoffeeCard from "../components/coffee-card";
import BottledDrinkCard from "../components/bottled-drink-card";
import DishCard from "../components/dish-card";
import SearchInput from "../components/SearchInput";
import { GroupService } from "../firebase/groupService";
import { Dish } from "../types/dish";
import { Group } from "../types/group";

const CategoryDetails = () => {
    const { categoryType } = useParams();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>();
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();
    const dishService = new DishService();
    const groupService = new GroupService();

    // New state for grouped dishes
    const [groupedDishes, setGroupedDishes] = useState<{
        groupCode: string;
        groupName: string;
        dishes: Dish[];
    }[]>([]);

    useEffect(() => {
        checkLocal();
        loadCategoryItems();
    }, [categoryType]);

    useEffect(() => {
        if (userInfo) {
            getCartItemCount();
        }
    }, [userInfo]);

    const checkLocal = async () => {
        try {
            const userId = await getUserID();
            if (!userId) {
                console.error('Không thể lấy userId');
                return;
            }

            const user = await userService.getUserByLocalId(userId);
            if (user) {
                setUserInfo(user);
            } else {
                console.error('Không tìm thấy thông tin user');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra thông tin user:', error);
        }
    };

    const getCartItemCount = async () => {
        if (userInfo) {
            const count = await cartService.getCartItemCount(userInfo.id);
            setCartItemCount(count);
        }
    };

    const loadCategoryItems = async () => {
        setLoading(true);
        try {
            switch (categoryType) {
                case 'coffee':
                    const coffees = await coffeeService.getAllCoffees();
                    setItems(coffees);
                    break;
                case 'bottled-drinks':
                    const drinks = await bottledDrinkService.getAllBottledDrinks();
                    setItems(drinks);
                    break;
                case 'dishes':
                    // Get dishes and groups to organize them
                    await loadGroupedDishes();
                    break;
                default:
                    setItems([]);
            }
        } catch (error) {
            console.error('Error loading category items:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGroupedDishes = async () => {
        try {
            // Get all groups
            const groups = await groupService.getAllGroups();

            // Get all filtered dishes
            const dishes = await dishService.getDishesFilteredByGroups();

            // Group the dishes by their group code
            const dishMap = new Map<string, Dish[]>();

            // Initialize the map with empty arrays for each group
            groups.forEach(group => {
                if (group.isActive) {
                    dishMap.set(group.code, []);
                }
            });

            // Add dishes to their respective groups
            dishes.forEach(dish => {
                if (dish.group && dishMap.has(dish.group)) {
                    dishMap.get(dish.group)?.push(dish);
                }
            });

            // Sort dishes within each group to prioritize dishes with images
            dishMap.forEach((groupDishes, groupCode) => {
                // Sort dishes: those with images first, then by displayOrder or name
                groupDishes.sort((a, b) => {
                    // First, prioritize dishes with images
                    const aHasImage = !!a.imageUrl;
                    const bHasImage = !!b.imageUrl;

                    if (aHasImage && !bHasImage) return -1;
                    if (!aHasImage && bHasImage) return 1;

                    // If both have images or both don't have images, sort by displayOrder
                    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                        return a.displayOrder - b.displayOrder;
                    }

                    // Finally, sort by name if displayOrder is not available
                    return (a.name || '').localeCompare(b.name || '');
                });
            });

            // Transform the map into the required format
            const groupedData = groups
                .filter(group => group.isActive)
                .map(group => ({
                    groupCode: group.code,
                    groupName: group.name,
                    dishes: dishMap.get(group.code) || []
                }))
                .filter(item => item.dishes.length > 0)
                .sort((a, b) => {
                    // Sort alphabetically by group name (A-Z)
                    return a.groupName.localeCompare(b.groupName);
                });

            setGroupedDishes(groupedData);
            setItems(dishes); // Also maintain the items array for backward compatibility
        } catch (error) {
            console.error('Error loading grouped dishes:', error);
        }
    };

    const getCategoryTitle = () => {
        switch (categoryType) {
            case 'coffee':
                return 'Hạt cà phê';
            case 'bottled-drinks':
                return 'Đồ uống đóng chai';
            case 'dishes':
                return 'Đồ uống';
            default:
                return 'Danh mục';
        }
    };

    return (
        <div className="p-4 mb-10 bg-white pt-10">
            <div className="mb-4 flex items-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        zIndex: 1000,
                        position: 'fixed',
                        top: '50px',
                        left: '20px'
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

                <div
                    className="fixed"
                    style={{
                        top: '50px',
                        right: '20px',
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

            <div className="mb-4 flex items-center justify-center gap-2">
                <div className="text-8am-black text-2xl font-bold text-center">
                    {getCategoryTitle()}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4">Đang tải...</div>
            ) : (
                <>
                    {categoryType === 'dishes' ? (
                        // Display dishes grouped by category
                        <div className="mb-14">
                            {groupedDishes.length > 0 ? (
                                groupedDishes.map((group) => (
                                    <div key={group.groupCode} className="mb-6">
                                        {/* Group header */}
                                        <div className="text-8am-black text-xl font-bold mb-2">
                                            {group.groupName}
                                        </div>

                                        {/* Group items */}
                                        <div className="grid grid-cols-2 gap-4 pb-2">
                                            {group.dishes.map((dish: any) => (
                                                <div key={dish.id} style={{
                                                    width: 'fit-content',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <DishCard
                                                        width={160}
                                                        height={250}
                                                        fontTitle={12}
                                                        fontName={12}
                                                        key={dish.id}
                                                        {...dish}
                                                        isShowLike={false}
                                                        userInfo={userInfo}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    Không có sản phẩm nào trong danh mục này
                                </div>
                            )}
                        </div>
                    ) : (
                        // Regular display for coffee and bottled drinks
                        <div className="grid grid-cols-2 gap-4 pb-2">
                            {items.length > 0 ? (
                                items.map((item: any) => (
                                    <div key={item.id} style={{
                                        width: 'fit-content',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {categoryType === 'coffee' && (
                                            <CoffeeCard width={160} height={250} fontTitle={12} fontName={12} key={item.id} {...item} isShowLike={false} userInfo={userInfo} />
                                        )}
                                        {categoryType === 'bottled-drinks' && (
                                            <BottledDrinkCard width={160} height={250} fontTitle={12} fontName={12} key={item.id} {...item} isShowLike={false} userInfo={userInfo} />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-4 text-gray-500">
                                    Không có sản phẩm nào trong danh mục này
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CategoryDetails; 