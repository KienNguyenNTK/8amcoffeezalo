import CoffeeSkeleton from "../components/CoffeeSkeleton";
import SearchInput from "../components/SearchInput";
import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import { flavorService } from "../firebase/flavorService";
import { regionService } from "../firebase/regionService";
import { useStorageImages } from "../hooks/useStorageImages";
import React, { useEffect, useState } from "react";
import { FaRobot, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { CoffeeBean } from "../types/coffee";
import { Flavor } from "../types/flavor";
import { Region } from "../types/region";
import CoffeeCard from "../components/coffee-card";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import { IoMdClose } from "react-icons/io";
import DishCard from "../components/dish-card";
import { DishService } from "../firebase/dishService";
import { Dish } from "../types/dish";
import { StoreMenuService } from "../services/storeMenuService";
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";
import { SelectedStoreService } from "../services/selectedStoreService";

import { GrinderService } from "../firebase/grinderService";
import { BrewerService } from "../firebase/brewerService";
import { messageService } from "../firebase/messageService";
import { Message } from "../types/message";

const ProductsPage = () => {
  const { loading, error } = useStorageImages('Coffee');
  const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
  const [lstRegion, setLstRegion] = useState<Region[]>([]);
  const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
  const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
  const [lstDishes, setLstDishes] = useState<Dish[]>([]);
  const [lstGrinders, setLstGrinders] = useState<any[]>([]);
  const [lstBrewers, setLstBrewers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>();

  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeDataLoading, setStoreDataLoading] = useState(true);
  const dishService = new DishService();
  const grinderService = new GrinderService();
  const brewerService = new BrewerService();

  // Helper functions để tìm sản phẩm đầu tiên có ảnh (theo cấu trúc Firestore thực tế)
  const getFirstCoffeeWithImage = () => {
    return lstCoffee.find(coffee => 
      coffee.images && coffee.images.length > 0 && coffee.images[0] && coffee.images[0].trim() !== ''
    );
  };

  const getFirstBottledDrinkWithImage = () => {
    return lstBottledDrink.find(drink => 
      drink.images && drink.images.length > 0 && drink.images[0] && drink.images[0].trim() !== ''
    );
  };

  const getFirstDishWithImage = () => {
    return lstDishes.find(dish => 
      dish.imageUrl && dish.imageUrl.trim() !== ''
    );
  };

  // Function để lấy URL ảnh từ coffee (theo cấu trúc Firestore: images array)
  const getCoffeeImageUrl = (coffee: any) => {
    if (coffee.images && coffee.images.length > 0 && coffee.images[0] && coffee.images[0].trim() !== '') {
      return coffee.images[0];
    }
    return null;
  };

  // Function để lấy URL ảnh từ bottled drink
  const getBottledDrinkImageUrl = (drink: any) => {
    if (drink.images && drink.images.length > 0 && drink.images[0] && drink.images[0].trim() !== '') {
      return drink.images[0];
    }
    return null;
  };

  // Helper functions cho máy cà phê (grinders + brewers)
  const getFirstMachineWithImage = () => {
    // Tìm trong grinders trước
    const grinderWithImage = lstGrinders.find(grinder => 
      grinder.images && grinder.images.length > 0 && grinder.images[0] && grinder.images[0].trim() !== ''
    );
    if (grinderWithImage) return grinderWithImage;
    
    // Nếu không có grinder, tìm trong brewers
    const brewerWithImage = lstBrewers.find(brewer => 
      brewer.images && brewer.images.length > 0 && brewer.images[0] && brewer.images[0].trim() !== ''
    );
    return brewerWithImage;
  };

  // Function để lấy URL ảnh từ máy cà phê
  const getMachineImageUrl = (machine: any) => {
    if (machine && machine.images && machine.images.length > 0 && machine.images[0] && machine.images[0].trim() !== '') {
      return machine.images[0];
    }
    return null;
  };

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    // Lấy thông tin cửa hàng đã chọn
    const store = SelectedStoreService.getSelectedStore();
    setSelectedStore(store);

    // Preload products nếu chưa có
    OptimizedStoreMenuService.preloadAllProducts();

    // Kiểm tra user info
    await checkLocal();

    // Load dữ liệu theo cửa hàng
    await loadStoreData();
  };

  const loadStoreData = async () => {
    setStoreDataLoading(true);
    try {
      // Lấy tất cả items của cửa hàng đã chọn (sử dụng optimized service)
      const storeItems = await OptimizedStoreMenuService.getAllItemsForSelectedStore();

      setLstCoffee(storeItems.coffees);
      setLstBottledDrink(storeItems.bottledDrinks);
      setLstDishes(storeItems.dishes);

      // Vẫn load regions và flavors để hiển thị categories
      await getLstRegion();
      await getLstFlavor();
      
      // Load grinders và brewers cho máy cà phê
      await getLstGrinders();
      await getLstBrewers();
      
      // Load tin tức
      await loadMessages();

    } catch (error) {
      console.error('Error loading store data:', error);
      // Fallback: load tất cả dữ liệu nếu có lỗi
      await loadAllData();
    } finally {
      setStoreDataLoading(false);
    }
  };

  const loadAllData = async () => {
    setStoreDataLoading(true);
    try {
      await Promise.all([
        getLstCoffee(),
        getLstRegion(),
        getLstFlavor(),
        getLstBottledDrink(),
        getLstDishes(),
        getLstGrinders(),
        getLstBrewers(),
        loadMessages()
      ]);
    } finally {
      setStoreDataLoading(false);
    }
  };

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

  const getLstCoffee = async () => {
    const lstCoffee = await coffeeService.getAllCoffees();
    setLstCoffee(lstCoffee);
  }

  const getLstBottledDrink = async () => {
    const lstBottledDrink = await bottledDrinkService.getAllBottledDrinks();
    setLstBottledDrink(lstBottledDrink);
  }

  const getLstRegion = async () => {
    const lstRegion = await regionService.getAllRegions();
    setLstRegion(lstRegion);
  }

  const getLstFlavor = async () => {
    const lstFlavor = await flavorService.getAllFlavors();
    setLstFlavor(lstFlavor);
  }

  const getLstDishes = async () => {
    const dishes = await dishService.getDishesFilteredByGroups();
    setLstDishes(dishes);
  }

  const getLstGrinders = async () => {
    try {
      const grinders = await grinderService.getAll();
      setLstGrinders(grinders);
    } catch (error) {
      console.error('Error loading grinders:', error);
    }
  }

  const getLstBrewers = async () => {
    try {
      const brewers = await brewerService.getAll();
      setLstBrewers(brewers);
    } catch (error) {
      console.error('Error loading brewers:', error);
    }
  }

  const loadMessages = async () => {
    try {
      const allMessages = await messageService.getAllMessages();
      // Chỉ lấy những message có banner để hiển thị như tin tức
      const messagesWithBanner = allMessages.filter(msg =>
        msg.type === 'template' &&
        msg.template_data?.banner?.image_url
      );
      setMessages(messagesWithBanner);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  return (
    <div className="p-4 mb-10 bg-white pt-10">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="text-8am-black text-3xl font-bold">
            Sản Phẩm
          </div>
          {selectedStore && (
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-600 mr-2">Cửa hàng:</span>
              <span className="text-sm font-medium text-orange-600">{selectedStore.name}</span>
              <button
                onClick={() => navigate('/store-selection')}
                className="ml-2 text-xs text-blue-500 underline"
              >
                Thay đổi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Categories Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Danh mục</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {/* Hạt cà phê */}
          <div
            className="flex-shrink-0 w-40 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate('/category/coffee')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 mb-3 bg-amber-200 rounded-xl flex items-center justify-center overflow-hidden">
                {(() => {
                  const coffeeWithImage = getFirstCoffeeWithImage();
                  const imageUrl = coffeeWithImage ? getCoffeeImageUrl(coffeeWithImage) : null;
                  return imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Hạt cà phê" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null;
                })()}
                <svg className={`w-7 h-7 text-amber-700 ${(() => {
                  const coffeeWithImage = getFirstCoffeeWithImage();
                  const imageUrl = coffeeWithImage ? getCoffeeImageUrl(coffeeWithImage) : null;
                  return imageUrl ? 'hidden' : '';
                })()}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21V19H20V21H2M20 8V5L18 5V3C18 1.9 17.1 1 16 1H8C6.9 1 6 1.9 6 3V5L4 5V8L6 8V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V8H20M16 3V5H8V3H16M8 18V8H16V18H8M9 9V17H11V9H9M13 9V17H15V9H13" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-gray-800">Hạt cà phê</h3>
            </div>
          </div>

          {/* Đồ uống */}
          <div
            className="flex-shrink-0 w-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate('/category/bottled-drinks')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 mb-3 bg-blue-200 rounded-xl flex items-center justify-center overflow-hidden">
                {(() => {
                  const drinkWithImage = getFirstBottledDrinkWithImage();
                  const imageUrl = drinkWithImage ? getBottledDrinkImageUrl(drinkWithImage) : null;
                  return imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Đồ uống" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null;
                })()}
                <svg className={`w-7 h-7 text-blue-700 ${(() => {
                  const drinkWithImage = getFirstBottledDrinkWithImage();
                  const imageUrl = drinkWithImage ? getBottledDrinkImageUrl(drinkWithImage) : null;
                  return imageUrl ? 'hidden' : '';
                })()}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3M5,5V19H19V5H5M7.5,6A1.5,1.5 0 0,1 9,7.5A1.5,1.5 0 0,1 7.5,9A1.5,1.5 0 0,1 6,7.5A1.5,1.5 0 0,1 7.5,6M7.5,10A1.5,1.5 0 0,1 9,11.5A1.5,1.5 0 0,1 7.5,13A1.5,1.5 0 0,1 6,11.5A1.5,1.5 0 0,1 7.5,10M12,13H18V15H12V13M12,9H18V11H12V9Z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-gray-800">Đồ uống</h3>
            </div>
          </div>

          {/* Cà phê */}
          <div
            className="flex-shrink-0 w-40 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate('/category/dishes')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 mb-3 bg-green-200 rounded-xl flex items-center justify-center overflow-hidden">
                {(() => {
                  const dishWithImage = getFirstDishWithImage();
                  return dishWithImage && dishWithImage.imageUrl ? (
                    <img 
                      src={dishWithImage.imageUrl} 
                      alt="Cà phê" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null;
                })()}
                <svg className={`w-7 h-7 text-green-700 ${(() => {
                  const dishWithImage = getFirstDishWithImage();
                  return dishWithImage && dishWithImage.imageUrl ? 'hidden' : '';
                })()}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2,21V19H20V21H2M3,17C2.45,17 2,16.55 2,16V14C2,13.45 2.45,13 3,13H4C4.55,13 5,13.45 5,14V16C5,16.55 4.55,17 4,17H3M6,17C5.45,17 5,16.55 5,16V12C5,11.45 5.45,11 6,11H7C7.55,11 8,11.45 8,12V16C8,16.55 7.55,17 7,17H6M9,17C8.45,17 8,16.55 8,16V10C8,9.45 8.45,9 9,9H10C10.55,9 11,9.45 11,10V16C11,16.55 10.55,17 10,17H9M12,17C11.45,17 11,16.55 11,16V8C11,7.45 11.45,7 12,7H13C13.55,7 14,7.45 14,8V16C14,16.55 13.55,17 13,17H12M15,17C14.45,17 14,16.55 14,16V6C14,5.45 14.45,5 15,5H16C16.55,5 17,5.45 17,6V16C17,16.55 16.55,17 16,17H15M18,17C17.45,17 17,16.55 17,16V4C17,3.45 17.45,3 18,3H19C19.55,3 20,3.45 20,4V16C20,16.55 19.55,17 19,17H18Z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-gray-800">Cà phê</h3>
            </div>
          </div>

          {/* Máy cà phê */}
          <div
            className="flex-shrink-0 w-40 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate('/category/machines')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 mb-3 bg-purple-200 rounded-xl flex items-center justify-center overflow-hidden">
                {(() => {
                  const machineWithImage = getFirstMachineWithImage();
                  const imageUrl = machineWithImage ? getMachineImageUrl(machineWithImage) : null;
                  return imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Máy cà phê" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null;
                })()}
                <svg className={`w-7 h-7 text-purple-700 ${(() => {
                  const machineWithImage = getFirstMachineWithImage();
                  const imageUrl = machineWithImage ? getMachineImageUrl(machineWithImage) : null;
                  return imageUrl ? 'hidden' : '';
                })()}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3C13.11,3 14,3.89 14,5H22V7H20V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V7H2V5H10C10,3.89 10.89,3 12,3M6,19H18V7H6V19M8,9H16V11H8V9M8,12H16V14H8V12M8,15H13V17H8V15Z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-gray-800">Máy cà phê</h3>
            </div>
          </div>

          {/* Additional category for scroll effect */}
        </div>
      </div>

      {/* Featured Products of the Store */}
      <div className="mb-6">
        {storeDataLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Coffee Beans */}
            {lstCoffee.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">Hạt cà phê </h3>
                  <button
                    onClick={() => navigate('/category/coffee')}
                    className="text-sm text-orange-500 font-medium"
                  >
                    Xem thêm
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {lstCoffee.slice(0, 4).map((coffee: any, index) => (
                    <div key={index} className="flex-shrink-0">
                      <CoffeeCard
                        isShowLike={false}
                        width={200}
                        {...coffee}
                        userInfo={userInfo}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Dishes */}
            {lstDishes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">Đồ uống </h3>
                  <button
                    onClick={() => navigate('/category/dishes')}
                    className="text-sm text-blue-500 font-medium"
                  >
                    Xem thêm
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {lstDishes
                    .filter((dish): dish is Dish & { id: string } => !!dish.id)
                    .slice(0, 4)
                    .map((dish, index) => (
                      <div key={index} className="flex-shrink-0">
                        <DishCard
                          isShowLike={false}
                          width={200}
                          {...dish}
                          userInfo={userInfo}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Featured Bottled Drinks */}
            {lstBottledDrink.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">Cà phê đóng chai </h3>
                  <button
                    onClick={() => navigate('/category/bottled-drinks')}
                    className="text-sm text-green-500 font-medium"
                  >
                    Xem thêm
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {lstBottledDrink.slice(0, 4).map((drink: any, index) => (
                    <div key={index} className="flex-shrink-0">
                      <BottledDrinkCard
                        isShowLike={false}
                        width={200}
                        {...drink}
                        userInfo={userInfo}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured News */}
            {messages.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">Tin tức </h3>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {messages.slice(0, 4).map((message, index) => (
                    <div 
                      key={index} 
                      className="flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/news/${message.id}`)}
                    >
                      <div className="w-full h-32">
                        <img
                          src={message.template_data?.banner?.image_url}
                          alt={message.template_data?.header?.content || 'Tin tức'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/logo.png'; // Fallback image
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                          {message.template_data?.header?.content || 'Tin tức'}
                        </h4>
                        {message.template_data?.text?.content && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {message.template_data.text.content.replace(/<br>/g, ' ').substring(0, 80)}...
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-blue-500 text-xs">📰</span>
                            <span className="text-xs text-gray-500 ml-1">Tin tức</span>
                          </div>
                          <span className="text-xs text-orange-500 font-medium">Xem thêm →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>



  );
};

export default ProductsPage;
