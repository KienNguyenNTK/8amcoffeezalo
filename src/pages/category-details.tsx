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

const CategoryDetails = () => {
    const { categoryType } = useParams();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>();
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();
    const dishService = new DishService();

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
                    const dishes = await dishService.getDishesFilteredByGroups();
                    setItems(dishes);
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

    const getCategoryTitle = () => {
        switch (categoryType) {
            case 'coffee':
                return 'Hạt cà phê';
            case 'bottled-drinks':
                return 'Đồ uống đóng chai';
            case 'dishes':
                return 'Cà phê';
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
                        zIndex: 1000
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

            </div>

            <div className="mb-4 flex items-center justify-center gap-2">
                <div className="text-8am-black text-2xl font-bold text-center">
                    {getCategoryTitle()}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4">Đang tải...</div>
            ) : (
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
                                {categoryType === 'dishes' && (
                                    <DishCard width={160} height={250} fontTitle={12} fontName={12} key={item.id} {...item} isShowLike={false} userInfo={userInfo} />
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
        </div>
    );
};

export default CategoryDetails; 