import FlavorCoffees from "../pages/FlavorCoffees";
import Profile from "../pages/profile";
import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { AnimationRoutes, App, ZMPRouter } from "zmp-ui";
import { FirebaseProvider } from '../firebase/FirebaseContext';
import Cart from "../pages/Cart";
import CoffeeDetail from "../pages/CoffeeDetail";
import Explore from "../pages/explore";
import HomePage from "../pages/index";
import Library from "../pages/library";
import ForYouPage from "../pages/ForYou";
import ProductsPage from "../pages/Products";
import Order from "../pages/Order";
import RegionCoffees from "../pages/RegionCoffees";
import SearchPage from "../pages/Search";
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
import { getUserID } from "zmp-sdk";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import axios from 'axios';
import { configService } from '../firebase/configService';
import DishDetail from "../pages/DishDetail";
import Categories from "../pages/categories";
import CategoryDetails from "../pages/category-details";
import StoreSelection from "../pages/StoreSelection";
import NewsDetail from "../pages/NewsDetail";
import StoreGuard from "./StoreGuard";
import { OptimizedStoreMenuService } from "../services/optimizedStoreMenuService";
import CoffeeEquipmentDetail from "../pages/CoffeeEquipmentDetail";
import QRHistory from "../pages/QRHistory";
import QRDetail from "../pages/QRDetail";
import Gifts from "../pages/Gifts";

const MyApp = () => {

  useEffect(() => {
    // checkLocal();
    // Preload data khi app khởi động
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

    // Kiểm tra xem user với localId có tồn tại trong database không

    const zaloUserDetail = await getUserZaloDetail((userInfo && userInfo?.idByOA) ? userInfo?.idByOA : userId);

    // Ở đây kiểm tra xem user có đang theo dõi hay không nếu chưa theo dõi thì gỡ nhãn đi

    console.log('zaloUserDetail', zaloUserDetail);
    if (zaloUserDetail && zaloUserDetail?.user_is_follower !== true) {
      await unTagUserAsVIP(userId);
      await userService.updateUserByLocalId(userId, {
        isFollowed: false
      });
    }

    if (!user) {
      // Lấy thông tin Zalo user

      const req = {
        localId: userId,
        name: userInfo?.name || 'Người dùng',
        phoneNumber: '',
        password: userId,
        avatar: userInfo?.avatar || '',
        zaloUserId: zaloUserDetail && zaloUserDetail?.user_id ? zaloUserDetail?.user_id : '',
        isFollowed: false
      }

      addressService.updateAddress({
        fullName: req.name,
      });

      await userService.createUser(req)
        .then(async (createdUser) => {
          console.log('User created successfully', createdUser);

          // Gán nhãn nếu có zaloUserId và thỏa điều kiện
          if (zaloUserDetail && zaloUserDetail?.user_id) {
            await tagUserAsVIP(zaloUserDetail.user_id, false, false);
          }
        })
        .catch((error) => {
          console.error('Could not create user:', error);
        });
    } else {

      // Lấy thông tin Zalo user nếu chưa có zaloUserId
      if (!user.zaloUserId) {
        if (zaloUserDetail && zaloUserDetail?.user_id) {
          // Gán nhãn cho user nếu thỏa điều kiện
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
        // Nếu đã có zaloUserId, kiểm tra và gán nhãn nếu thỏa điều kiện
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
          <ZMPRouter>
              <StoreGuard>
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
                <AppNavigation />
              </StoreGuard>
            </ZMPRouter>
        </App>
      </FirebaseProvider>
    </RecoilRoot>
  );
};

export default MyApp;
