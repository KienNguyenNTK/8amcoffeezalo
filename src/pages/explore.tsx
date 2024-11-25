import CoffeeSkeleton from "../components/CoffeeSkeleton";
import SearchInput from "../components/SearchInput";
import { cartService } from "../firebase/cartService";
import { coffeeService } from "../firebase/coffeeService";
import { flavorService } from "../firebase/flavorService";
import { regionService } from "../firebase/regionService";
import { useStorageImages } from "../hooks/useStorageImages";
import React, { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { CoffeeBean } from "../types/coffee";
import { Flavor } from "../types/flavor";
import { Region } from "../types/region";
import CoffeeCard from "../components/coffee-card";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { BottledDrink } from "../types/bottledDrink";
import BottledDrinkCard from "../components/bottled-drink-card";

const Explore = () => {
  const { loading, error } = useStorageImages('Coffee');
  const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
  const [lstRegion, setLstRegion] = useState<Region[]>([]);
  const [lstFlavor, setLstFlavor] = useState<Flavor[]>([]);
  const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  useEffect(() => {
    getLstCoffee();
    getLstRegion();
    getLstFlavor();
    getLstBottledDrink();
    getCartItemCount();
  }, []);


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
    const authenticatedUser = await authService.getAuthenticatedUser();
    if (authenticatedUser) {
      const count = await cartService.getCartItemCount(authenticatedUser.id);
      setCartItemCount(count);
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
          Hàng mới
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
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => navigate(`/region/${encodeURIComponent(region.name)}`)}
                >
                  <img src={region.imageUrl} alt={region.name} className="w-5 h-5" />
                  <div className="text-8am-black text-base font-bold">
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
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => navigate(`/flavor/${encodeURIComponent(flavor.name)}`)}
                >
                  <img src={flavor.iconUrl} alt={flavor.name} className="w-5 h-5" />
                  <div className="text-8am-black text-base font-bold">
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
          Đặc biệt
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
                  />
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore; 