import React, { useEffect, Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { AnimationRoutes, App, ZMPRouter } from "zmp-ui";
import { FirebaseProvider } from '../firebase/FirebaseContext';
import AppNavigation from "./bottom-navigation/bottom-navigation";
import StoreGuard from "./StoreGuard";
import { userService } from "../firebase/userService";
import { getUserInfo } from "zmp-sdk/apis";
import { addressService } from "../services/addressService";
import { getUserID } from "zmp-sdk";
import axios from 'axios';
import { configService } from '../firebase/configService';
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";

// Các trang chính nạp trực tiếp để đảm bảo khởi động nhanh và mượt
import ForYouPage from "../pages/ForYou";
import HomePage from "../pages/index";
import ProductsPage from "../pages/Products";
import Library from "../pages/library";
import Profile from "../pages/profile";
import Cart from "../pages/Cart";
import StoreSelection from "../pages/StoreSelection";

// Các trang chi tiết & trang phụ nạp lười (Lazy Loading) để chia nhỏ bundle
const CoffeeDetail = lazy(() => import("../pages/CoffeeDetail"));
const DishDetail = lazy(() => import("../pages/DishDetail"));
const BottledDrinkDetail = lazy(() => import("../pages/BottledDrinkDetail"));
const CoffeeEquipmentDetail = lazy(() => import("../pages/CoffeeEquipmentDetail"));
const SearchPage = lazy(() => import("../pages/Search"));
const Order = lazy(() => import("../pages/Order"));
const Orders = lazy(() => import("../pages/orders"));
const OrderDetail = lazy(() => import("../pages/OrderDetail"));
const Rewards = lazy(() => import("../pages/Rewards"));
const Gifts = lazy(() => import("../pages/Gifts"));
const PointHistory = lazy(() => import("../pages/PointHistory"));
const VoucherHistory = lazy(() => import("../pages/VoucherHistory"));
const QRHistory = lazy(() => import("../pages/QRHistory"));
const QRDetail = lazy(() => import("../pages/QRDetail"));
const AuthorizePage = lazy(() => import("../pages/AuthorizePage"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const Categories = lazy(() => import("../pages/categories"));
const CategoryDetails = lazy(() => import("../pages/category-details"));
const NewsDetail = lazy(() => import("../pages/NewsDetail"));
const RegionCoffees = lazy(() => import("../pages/RegionCoffees"));
const FlavorCoffees = lazy(() => import("../pages/FlavorCoffees"));
const CollectionCoffees = lazy(() => import("../pages/CollectionCoffees"));
const Explore = lazy(() => import("../pages/explore"));
const Settings = lazy(() => import("../pages/Settings"));

// Loading spinner nhỏ nhẹ cho Suspense
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-white">
    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

import ErrorBoundary from "./ErrorBoundary";
import NetworkStatus from "./NetworkStatus";

const MyApp = () => {
  useEffect(() => {
    OptimizedStoreMenuService.preloadAllProducts();
  }, []);

  const tagUserAsVIP = async (userId: string, isFollowed: boolean, hasPhoneNumber: boolean) => {
    if (isFollowed && hasPhoneNumber) {
      try {
        const newConfigZalo = await configService.getConfig();
        const response = await axios.post(
          'https://openapi.zalo.me/v2.0/oa/tag/tagfollower',
          {
            user_id: userId,
            tag_name: "Hội viên"
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': newConfigZalo?.access_token_zalo
            }
          }
        );

        if (response.data.error === 0) {
          console.log('Đã gán nhãn Hội viên thành công');
        }
      } catch (error) {
        console.error('Lỗi khi gán nhãn Hội viên:', error);
      }
    }

    if (isFollowed && !hasPhoneNumber) {
      try {
        const newConfigZalo = await configService.getConfig();
        const response = await axios.post(
          'https://openapi.zalo.me/v2.0/oa/tag/tagfollower',
          {
            user_id: userId,
            tag_name: "Quan tâm"
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': newConfigZalo?.access_token_zalo
            }
          }
        );

        if (response.data.error === 0) {
          console.log('Đã gán nhãn Quan tâm thành công');
        }

      } catch (error) {
        console.error('Lỗi khi gán nhãn Quan tâm:', error);
      }
    }
  };

  const unTagUserAsVIP = async (userId: string) => {
    try {
      const newConfigZalo = await configService.getConfig();

      const response = await axios.post(
        'https://openapi.zalo.me/v2.0/oa/tag/rmfollowerfromtag',
        {
          user_id: userId,
          tag_name: "Hội viên"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': newConfigZalo?.access_token_zalo
          }
        }
      );

      if (response.data.error === 0) {
        console.log('Đã gỡ nhãn Hội viên thành công');
      }
    } catch (error) {
      console.error('Lỗi khi gỡ nhãn Hội viên:', error);
    }
  };

  const getUserZaloDetail = async (userId: string) => {
    try {
      const newConfigZalo = await configService.getConfig();
      const response = await axios.get(
        `https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${userId}"}`,
        {
          headers: {
            'access_token': newConfigZalo?.access_token_zalo,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.error === 0) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user detail:', error);
      return null;
    }
  };

  const checkLocal = async () => {
    const userId = await getUserID();
    const user: any = await userService.getUserByLocalId(userId);
    let userInfo: any;
    if (!user) {
      userInfo = await getUserInfo({
        autoRequestPermission: true,
      });
    }

    console.log('userInfo', userInfo);
    console.log('userId', userId);

    const zaloUserDetail = await getUserZaloDetail((userInfo && userInfo?.idByOA) ? userInfo?.idByOA : userId);

    if (zaloUserDetail && zaloUserDetail?.user_is_follower !== true) {
      await unTagUserAsVIP(userId);
      await userService.updateUserByLocalId(userId, {
        isFollowed: false
      });
    }

    if (!user) {
      const req = {
        localId: userId,
        name: userInfo?.name || 'Người dùng',
        phoneNumber: '',
        password: userId,
        avatar: userInfo?.avatar || '',
        zaloUserId: zaloUserDetail && zaloUserDetail?.user_id ? zaloUserDetail?.user_id : '',
        isFollowed: false
      };

      addressService.updateAddress({
        fullName: req.name,
      });

      await userService.createUser(req)
        .then(async (createdUser) => {
          console.log('User created successfully', createdUser);
          if (zaloUserDetail && zaloUserDetail?.user_id) {
            await tagUserAsVIP(zaloUserDetail.user_id, false, false);
          }
        })
        .catch((error) => {
          console.error('Could not create user:', error);
        });
    } else {
      if (!user.zaloUserId) {
        if (zaloUserDetail && zaloUserDetail?.user_id) {
          await tagUserAsVIP(
            zaloUserDetail && zaloUserDetail?.user_id ? zaloUserDetail?.user_id : '',
            user.isFollowed || false,
            Boolean(user.phoneNumber)
          );

          await userService.updateUserByLocalId(userId, {
            avatar: userInfo?.avatar || '',
            name: userInfo?.name || 'Người dùng',
            localId: userId,
            password: userId,
            zaloUserId: zaloUserDetail && zaloUserDetail?.user_id ? zaloUserDetail?.user_id : ''
          });
        }
      } else {
        await tagUserAsVIP(
          user.zaloUserId,
          user.isFollowed || false,
          Boolean(user.phoneNumber)
        );

        await userService.updateUserByLocalId(userId, {
          avatar: userInfo?.avatar || '',
          name: userInfo?.name || 'Người dùng',
          localId: userId,
          password: userId,
        });
      }

      await userService.getUserByLocalId(userId)
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
          <NetworkStatus />
          <ZMPRouter>
            <ErrorBoundary>
              <StoreGuard>
                <Suspense fallback={<PageLoadingFallback />}>
                  <AnimationRoutes>
                    <Route path="/store-selection" element={<StoreSelection />} />
                    <Route path="/" element={<ForYouPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/for-you" element={<ForYouPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/coffee/:id" element={<CoffeeDetail />} />
                    <Route path="/dish/:id" element={<DishDetail />} />
                    <Route path="/region/:regionName" element={<RegionCoffees />} />
                    <Route path="/flavor/:flavorName" element={<FlavorCoffees />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:orderId" element={<OrderDetail />} />
                    <Route path="/collection/:collectionId" element={<CollectionCoffees />} />
                    <Route path="/bottled-drink/:id" element={<BottledDrinkDetail />} />
                    <Route path="/coffee-equipment/:id" element={<CoffeeEquipmentDetail />} />
                    <Route path="/rewards" element={<Rewards />} />
                    <Route path="/gifts" element={<Gifts />} />
                    <Route path="/point-history" element={<PointHistory />} />
                    <Route path="/voucher-history" element={<VoucherHistory />} />
                    <Route path="/qr-history" element={<QRHistory />} />
                    <Route path="/qr-detail" element={<QRDetail />} />
                    <Route path="/authorize" element={<AuthorizePage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/category/:categoryType" element={<CategoryDetails />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                  </AnimationRoutes>
                </Suspense>
                <AppNavigation />
              </StoreGuard>
            </ErrorBoundary>
          </ZMPRouter>
        </App>
      </FirebaseProvider>
    </RecoilRoot>
  );
};

export default MyApp;
