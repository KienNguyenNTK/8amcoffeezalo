import FlavorCoffees from "../pages/FlavorCoffees";
import Profile from "../pages/profile";
import React from "react";
import { Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { AnimationRoutes, App, SnackbarProvider, ZMPRouter } from "zmp-ui";
import { FirebaseProvider } from '../firebase/FirebaseContext';
import Cart from "../pages/Cart";
import CoffeeDetail from "../pages/CoffeeDetail";
import Explore from "../pages/explore";
import HomePage from "../pages/index";
import Library from "../pages/library";
import Order from "../pages/Order";
import RegionCoffees from "../pages/RegionCoffees";
import Search from "../pages/Search";
import Settings from "../pages/Settings";
import AppNavigation from "./bottom-navigation/bottom-navigation";
import CollectionCoffees from "../pages/CollectionCoffees";
import Orders from "../pages/orders";
import OrderDetail from "../pages/OrderDetail";
import BottledDrinkDetail from "../pages/BottledDrinkDetail";

const MyApp = () => {
  return (
    <RecoilRoot>
      <FirebaseProvider>
        <App>
          <SnackbarProvider>
            <ZMPRouter>
              <AnimationRoutes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/library" element={<Library />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/coffee/:id" element={<CoffeeDetail />} />
                <Route path="/region/:regionName" element={<RegionCoffees />} />
                <Route path="/flavor/:flavorName" element={<FlavorCoffees />} />
                <Route path="/search" element={<Search />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order" element={<Order />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/collection/:collectionId" element={<CollectionCoffees />} />
                <Route path="/bottled-drink/:id" element={<BottledDrinkDetail />} />
              </AnimationRoutes>
              <AppNavigation />
            </ZMPRouter>
          </SnackbarProvider>
        </App>
      </FirebaseProvider>
    </RecoilRoot>
  );
};

export default MyApp;
