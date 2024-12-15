import FlavorCoffees from "../pages/FlavorCoffees";
import Profile from "../pages/profile";
import React, { useEffect } from "react";
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
import Rewards from "../pages/Rewards";
import PointHistory from "../pages/PointHistory";
import VoucherHistory from "../pages/VoucherHistory";
import { userService } from "../firebase/userService";
import AuthorizePage from '../pages/AuthorizePage';
import { getUserInfo } from "zmp-sdk/apis";
import { addressService } from "../services/addressService";

const MyApp = () => {

  useEffect(() => {
    checkLocal();
  }, []);

  const checkLocal = async () => {
    const idUser = localStorage.getItem('idUser');
    const randomId = crypto.randomUUID();
    if (!idUser) {
      localStorage.setItem('idUser', randomId);

      const { userInfo } = await getUserInfo({
        autoRequestPermission: true,
      });

      const req = {
        localId: randomId,
        name: userInfo?.name || 'Người dùng',
        phoneNumber: '',
        password: randomId,
      }

      addressService.updateAddress({
        fullName: req.name,
      });

      await userService.createUser(req)
        .then((req) => {
          console.log('User created successfully', req);

        })
        .catch((error) => {
          console.error('Could not create user:', error);
        });
    }
    else {
      console.log('idUser', idUser);

      await userService.getUserByLocalId(idUser)
        .then((req: any) => {
          console.log('User get successfully', req);

          addressService.updateAddress({
            fullName: req.name,
          });
        })
        .catch((error) => {
          console.error('Could not get user:', error);
        });

    }
  };

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
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/point-history" element={<PointHistory />} />
                <Route path="/voucher-history" element={<VoucherHistory />} />
                <Route path="/authorize" element={<AuthorizePage />} />
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
