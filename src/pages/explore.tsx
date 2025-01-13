import CoffeeSkeleton from "../components/CoffeeSkeleton";
import SearchInput from "../components/SearchInput";
import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import { flavorService } from "../firebase/flavorService";
import { regionService } from "../firebase/regionService";
import { useStorageImages } from "../hooks/useStorageImages";
import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaRobot } from "react-icons/fa";
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

const Explore = () => {
  const { loading, error } = useStorageImages('Coffee');
  const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
  const [lstRegion, setLstRegion] = useState<Region[]>([]);
  const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
  const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [userInfo, setUserInfo] = useState<any>();
  const [showChatbot, setShowChatbot] = useState(false);
  useEffect(() => {
    getLstCoffee();
    getLstRegion();
    getLstFlavor();
    getLstBottledDrink();
    getCartItemCount();
    checkLocal();
  }, []);

  const checkLocal = async () => {
    // const idUser = localStorage.getItem('idUser');
    const userId = await getUserID();

    const user = await userService.getUserByLocalId(userId);

    if (user) {
      setUserInfo(user);
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

  const getCartItemCount = async () => {
    // const authenticatedUser = await authService.getAuthenticatedUser();
    if (userInfo) {
      const count = await cartService.getCartItemCount(userInfo.id);
      setCartItemCount(count);
    }
    else {
      const cartItemLocal = localStorage.getItem('cartItems');
      if (cartItemLocal) {
        const cartItems = JSON.parse(cartItemLocal);
        setCartItemCount(cartItems.length);
      }
    }
  }

  return (
    <div className="p-4 mb-10 bg-white pt-10"
    >
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-8am-black text-3xl font-bold">
            Khám phá
          </div>
        </div>
        <div className="fixed"
          style={{
            top: '50px',
            right: '105px',
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

      <div className="mb-4">
        <SearchInput />
      </div>

      <div className="mb-4">
        <div className="text-8am-black text-xl font-bold">
          Cà phê
        </div>

        {loading ? (
          <div className="flex overflow-x-auto gap-4 pb-2">
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-2">
            {
              lstCoffee.map((coffee: any, index) => (
                <div key={index}
                  style={{
                  }}
                >
                  <CoffeeCard
                    key={index}
                    isShowLike={false}
                    width={230}
                    {...coffee}
                    userInfo={userInfo}
                  />
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-8am-black text-xl font-bold mb-2">
          Danh mục cho bạn
        </div>

        {lstRegion && lstRegion.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-2">
            {
              lstRegion.map((region: any, index: number) => (
                <div
                  key={index}
                  className="bg-8am-light-grey-3 rounded-lg p-2 pr-7 cursor-pointer hover:bg-8am-light-grey-2 flex items-center gap-2"
                  style={{
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    padding: '8px 12px',
                    paddingRight: '32px'
                  }}
                  onClick={() => navigate(`/region/${encodeURIComponent(region.name)}`)}
                >
                  {region.imageUrl && (
                    <img src={region.imageUrl} alt={region.name} className="w-5 h-5" />
                  )}
                  <div className="text-8am-black text-base font-medium">
                    {region.name}
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-2">
            <CoffeeSkeleton
              height={30}
            />
            <CoffeeSkeleton
              height={30}
            />
            <CoffeeSkeleton
              height={30}
            />
          </div>
        )}

        {lstFlavor && lstFlavor.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-2">
            {
              lstFlavor.map((flavor, index) => (
                <div
                  key={index}
                  className="bg-8am-light-grey-3 rounded-lg p-2 pr-7 cursor-pointer hover:bg-8am-light-grey-2 flex items-center gap-2"
                  style={{
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    padding: '8px 12px',
                    paddingRight: '32px',
                  }}
                  onClick={() => navigate(`/flavor/${encodeURIComponent(flavor.name)}`)}
                >
                  <img src={flavor.iconUrl} alt={flavor.name} className="w-5 h-5" />
                  <div className="text-8am-black text-base font-medium">
                    {flavor.name}
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-2">
            <CoffeeSkeleton
              height={30}
            />
            <CoffeeSkeleton
              height={30}
            />

            <CoffeeSkeleton
              height={30}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-8am-black text-xl font-bold mb-2">
          Đồ uống đóng chai
        </div>

        {loading ? (
          <div className="flex overflow-x-auto gap-4 pb-2">
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-2">
            {
              lstBottledDrink.map((drink: any, index) => (
                <div key={index}
                  style={{
                  }}
                >
                  <BottledDrinkCard
                    key={index}
                    isShowLike={false}
                    width={230}
                    {...drink}
                    userInfo={userInfo}
                  />
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* <div 
        className="fixed bottom-20 right-4 bg-8am-red rounded-full p-3 shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
        onClick={() => setShowChatbot(true)}
      >
        <FaRobot className="w-6 h-6 text-white" />
      </div> */}

      {/* {showChatbot && (
        <div className="fixed bottom-32 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <FaRobot className="w-5 h-5 text-8am-red" />
              <span className="font-medium">Chat với Hồng</span>
            </div>
            <IoMdClose 
              className="w-6 h-6 cursor-pointer hover:text-gray-600"
              onClick={() => setShowChatbot(false)}
            />
          </div>
          <div className="h-96 p-4 overflow-y-auto">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              Xin chào! Tôi là Hồng, tôi có thể giúp gì cho bạn?
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:border-8am-red"
              />
              <button className="bg-8am-red text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Gửi
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Explore; 