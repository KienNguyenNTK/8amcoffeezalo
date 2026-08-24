import React from "react";
import { FaCompass, FaShoppingCart, FaSearch, FaCube } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavigation } from "zmp-ui";
import { SelectedStoreService } from "../../services/selectedStoreService";
import { useCartCount } from "../../hooks/useCartCount";
import { userService } from "../../firebase/userService";
import { getUserID } from "zmp-sdk/apis";

import "./bottom-natigation.scss";
import { haptic } from "../../utils/haptic";

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = React.useState<any>();
  const cartItemCount = useCartCount(userInfo?.id);

  React.useEffect(() => {
    const checkLocal = async () => {
      const userId = await getUserID();
      const user = await userService.getUserByLocalId(userId);
      if (user) {
        setUserInfo(user);
      }
    };
    checkLocal();
  }, []);

  // Không hiển thị navigation nếu chưa chọn cửa hàng hoặc đang ở trang chọn cửa hàng
  const shouldShowNavigation = SelectedStoreService.hasSelectedStore() &&
    location.pathname !== '/store-selection';

  if (!shouldShowNavigation) {
    return null;
  }

  return (
    <BottomNavigation
      fixed
      activeKey={location.pathname}
      onChange={(key) => {
        haptic.light();
        navigate(key);
      }}
      className="shadow-bottom-navigation"
    >
      <BottomNavigation.Item
        key="/"
        label="Cho bạn"
        icon={<FaCompass />}
      />
      <BottomNavigation.Item
        key="/products"
        label="Sản phẩm"
        icon={<FaCube />}
      />
      <BottomNavigation.Item
        key="/search"
        label="Tìm kiếm"
        icon={<FaSearch />}
      />
      <BottomNavigation.Item
        key="/cart"
        label="Giỏ hàng"
        icon={
          <div className="relative">
            <FaShoppingCart />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {cartItemCount}
              </span>
            )}
          </div>
        }
      />
      <BottomNavigation.Item
        key="/profile"
        label="Cá nhân"
        icon={<FaCircleUser />}
      />
    </BottomNavigation>
  );
};

export default AppNavigation; 