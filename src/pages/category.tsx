import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { coffeeService } from "../firebase/coffeeService";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { DishService } from "../firebase/dishService";
import { useStorageImages } from "../hooks/useStorageImages";
import CoffeeCard from "../components/coffee-card";
import BottledDrinkCard from "../components/bottled-drink-card";
import DishCard from "../components/dish-card";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import CoffeeSkeleton from "../components/CoffeeSkeleton";

const Category = () => {
  const { type } = useParams();
  const { loading } = useStorageImages("Coffee");
  const [items, setItems] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>();
  const navigate = useNavigate();
  const dishService = new DishService();

  useEffect(() => {
    checkLocal();
    loadCategoryItems();
  }, [type]);

  const checkLocal = async () => {
    try {
      const userId = await getUserID();
      if (!userId) {
        console.error("Không thể lấy userId");
        return;
      }

      const user = await userService.getUserByLocalId(userId);
      if (user) {
        setUserInfo(user);
      } else {
        console.error("Không tìm thấy thông tin user");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra thông tin user:", error);
    }
  };

  const loadCategoryItems = async () => {
    if (!type) return;

    switch (type.toLowerCase()) {
      case "cà phê":
        const dishes = await dishService.getDishesFilteredByGroups();
        setItems(dishes);
        break;
      case "hạt cà phê":
        const coffees = await coffeeService.getAllCoffees();
        setItems(coffees);
        break;
      case "đồ uống đóng chai":
        const bottledDrinks = await bottledDrinkService.getAllBottledDrinks();
        setItems(bottledDrinks);
        break;
      default:
        setItems([]);
    }
  };

  // Group items into pairs
  const groupedItems = () => {
    const result: Array<any[]> = [];
    for (let i = 0; i < items.length; i += 2) {
      result.push(items.slice(i, i + 2));
    }
    return result;
  };

  // Xác định background color cho các card
  const getBgColor = (index: number) => {
    const colors = index % 2 === 0 ? "#D83A3A" : "#C37C36"; // Đỏ và Cam
    return colors;
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 mb-4 flex items-center">
        <button
          className="mr-2 p-2 rounded-full bg-gray-100"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-8am-black">{type}</h1>
      </div>

      {loading ? (
        <div className="px-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="mb-4 rounded-lg overflow-hidden">
              <div className="bg-gray-200 h-[200px] w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-8">Không có sản phẩm nào</div>
      ) : (
        <div className="px-4 space-y-4">
          {groupedItems().map((pair, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded-lg overflow-hidden flex"
            >
              {pair.map((item, index) => (
                <div
                  key={index}
                  className="relative flex-1"
                  style={{
                    height: "200px",
                    backgroundColor: getBgColor(rowIndex * 2 + index)
                  }}
                  onClick={() => {
                    if (type?.toLowerCase() === "cà phê") {
                      navigate(`/dish/${item.id}`);
                    } else if (type?.toLowerCase() === "hạt cà phê") {
                      navigate(`/coffee/${item.id}`);
                    } else if (type?.toLowerCase() === "đồ uống đóng chai") {
                      navigate(`/bottled-drink/${item.id}`);
                    }
                  }}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/30">
                    {type?.toLowerCase() === "cà phê" && item.price > 0 && (
                      <div className="text-white/80 text-xs font-medium">
                        {item.price.toLocaleString('vi-VN')}đ
                      </div>
                    )}

                    {type?.toLowerCase() === "hạt cà phê" && item.region && (
                      <div className="text-white/80 text-xs font-medium">
                        {Array.isArray(item.region) ? item.region.join(', ') : item.region}
                      </div>
                    )}

                    {type?.toLowerCase() === "đồ uống đóng chai" && item.origin && (
                      <div className="text-white/80 text-xs font-medium">
                        {Array.isArray(item.origin) ? item.origin.join(', ') : item.origin}
                      </div>
                    )}

                    <div className="text-white text-sm font-semibold line-clamp-2">
                      {item.name}
                    </div>
                  </div>
                </div>
              ))}

              {pair.length === 1 && (
                <div
                  className="flex-1"
                  style={{
                    height: "200px",
                    backgroundColor: getBgColor(rowIndex * 2 + 1)
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Category; 