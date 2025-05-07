import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { cartService } from "../firebase/cartService";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import SearchInput from "../components/SearchInput";

const Categories = () => {
  const [userInfo, setUserInfo] = useState<any>();
  const [cartItemCount, setCartItemCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkLocal();
  }, []);

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

  const categories = [
    {
      id: 'dishes',
      name: 'Cà phê',
      imageUrl: 'https://8amcoffee.com/wp-content/uploads/2022/05/dang-cap-espresso-khac-nhau-30.jpg',
      color: '#B73333'
    },
    {
      id: 'coffee',
      name: 'Hạt cà phê',
      imageUrl: 'https://8amcoffee.com/wp-content/uploads/2023/09/hat-ca-phe-moka-8am-coffee-7.jpg',
      color: '#8E562E'
    },
    {
      id: 'bottled-drinks',
      name: 'Đồ uống đóng chai',
      imageUrl: 'https://8amcoffee.com/wp-content/uploads/2023/09/nutricoffee-8.jpg',
      color: '#2E4371'
    },
    {
      id: 'learn',
      name: 'Học về cà phê',
      imageUrl: 'https://8amcoffee.com/wp-content/uploads/2023/09/learn-coffee.jpg',
      color: '#447145'
    }
  ];

  return (
    <div className="p-4 mb-10 bg-white pt-10">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <div className="text-8am-black text-3xl font-bold">
            Danh mục
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

      <div className="grid grid-cols-2 gap-4 pb-2">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="relative rounded-lg overflow-hidden cursor-pointer aspect-[3/4]"
            style={{
              height: 250,
              width: '100%',
              backgroundColor: category.color,
            }}
            onClick={() => navigate(`/category/${category.id}`)}
          >
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
              <div className="text-white text-xl font-bold">
                {category.name}
              </div>
              <div className="text-white/80 text-sm mt-1">
                Xem tất cả
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories; 