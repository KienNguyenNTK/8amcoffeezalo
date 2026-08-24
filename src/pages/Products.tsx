import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SearchOutlined, RightOutlined } from "@ant-design/icons";
import { getUserID } from "zmp-sdk/apis";

import CoffeeSkeleton from "../components/CoffeeSkeleton";
import CategoryIcon from "../components/CategoryIcon";
import { messageService } from "../firebase/messageService";
import { userService } from "../firebase/userService";
import { SelectedStoreService } from "../services/selectedStoreService";
import {
  miniAppConfigService,
  DEFAULT_MINIAPP_PRODUCTS_CONFIG,
} from "../firebase/miniAppConfigService";

import { productCatalogService } from "../services/productCatalogService";

import { CoffeeBean } from "../types/coffee";
import { BottledDrink } from "../types/bottledDrink";
import { Dish } from "../types/dish";
import { Message } from "../types/message";
import { MiniAppProductsConfig, MiniAppCategory } from "../types/miniAppManagement";
import { haptic } from "../utils/haptic";

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();

  // State dữ liệu cấu hình động từ Admin
  const [productsConfig, setProductsConfig] = useState<MiniAppProductsConfig>(
    DEFAULT_MINIAPP_PRODUCTS_CONFIG
  );

  // State dữ liệu sản phẩm
  const [lstCoffee, setLstCoffee] = useState<CoffeeBean[]>([]);
  const [lstBottledDrink, setLstBottledDrink] = useState<BottledDrink[]>([]);
  const [lstDishes, setLstDishes] = useState<Dish[]>([]);
  const [lstCoffeeEquipment, setLstCoffeeEquipment] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // State cửa hàng & người dùng
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeDataLoading, setStoreDataLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>();

  // 1. Khởi tạo dữ liệu & đăng ký lắng nghe realtime từ Firestore
  useEffect(() => {
    initializeData();

    // Lắng nghe thay đổi cấu hình trang Sản phẩm realtime từ Admin
    const unsubscribeConfig = miniAppConfigService.subscribeProductsPageConfig(
      (newConfig) => {
        setProductsConfig(newConfig);
      }
    );

    return () => {
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  const initializeData = async () => {
    // Lấy thông tin cửa hàng đã chọn
    const store = SelectedStoreService.getSelectedStore();
    setSelectedStore(store);

    // Kiểm tra user info
    await checkLocal();

    // Load dữ liệu theo cửa hàng
    await loadStoreData();
  };

  const loadStoreData = async () => {
    setStoreDataLoading(true);
    try {
      const [catalog] = await Promise.all([
        productCatalogService.getCatalog(),
        loadMessages(),
      ]);

      setLstCoffee(catalog.coffees || []);
      setLstBottledDrink(catalog.drinks || []);
      setLstDishes(catalog.dishes || []);
      setLstCoffeeEquipment(catalog.equipment || []);
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      setStoreDataLoading(false);
    }
  };

  const checkLocal = async () => {
    try {
      const userId = await getUserID();
      if (!userId) return;
      const user = await userService.getUserByLocalId(userId);
      if (user) setUserInfo(user);
    } catch (error) {
      console.error("Lỗi khi kiểm tra thông tin user:", error);
    }
  };


  const loadMessages = async () => {
    try {
      const allMessages = await messageService.getAllMessages();
      const messagesWithBanner = allMessages.filter(
        (msg) => msg.type === "template" && msg.template_data?.banner?.image_url
      );
      setMessages(messagesWithBanner);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Helper lấy URL ảnh cà phê hạt
  const getCoffeeImageUrl = (coffee: any) => {
    if (coffee.images && coffee.images.length > 0 && coffee.images[0]?.trim()) {
      return coffee.images[0];
    }
    if (coffee.imageUrl && coffee.imageUrl.trim()) {
      return coffee.imageUrl;
    }
    if (coffee.driveImages && coffee.driveImages.length > 0 && coffee.driveImages[0]?.fileId) {
      return `https://lh3.googleusercontent.com/d/${coffee.driveImages[0].fileId}?authuser=server`;
    }
    return null;
  };

  // Helper lấy URL ảnh đồ uống đóng chai
  const getBottledDrinkImageUrl = (drink: any) => {
    if (drink.images && drink.images.length > 0 && drink.images[0]?.trim()) {
      return drink.images[0];
    }
    if (drink.driveImages && drink.driveImages.length > 0 && drink.driveImages[0]?.fileId) {
      return `https://lh3.googleusercontent.com/d/${drink.driveImages[0].fileId}?authuser=server`;
    }
    return null;
  };

  // Helper lấy URL ảnh dụng cụ cà phê
  const getEquipmentImageUrl = (equipment: any) => {
    if (equipment.images && equipment.images.length > 0 && equipment.images[0]?.trim()) {
      return equipment.images[0];
    }
    if (equipment.driveImages && equipment.driveImages.length > 0 && equipment.driveImages[0]?.fileId) {
      return `https://lh3.googleusercontent.com/d/${equipment.driveImages[0].fileId}?authuser=server`;
    }
    return null;
  };

  // Chuyển trang khi bấm vào danh mục
  const handleCategoryClick = (category: MiniAppCategory) => {
    haptic.light();
    if (category.sourceType === "news" || category.code === "news") {
      navigate("/category/news");
    } else if (category.sourceType === "coffee") {
      navigate("/category/coffee");
    } else if (category.sourceType === "bottledDrink") {
      navigate("/category/bottled-drinks");
    } else if (category.sourceType === "equipment") {
      navigate("/category/machines");
    } else if (category.sourceType === "dishes" || category.code === "dishes") {
      navigate("/category/dishes");
    } else if (category.sourceType === "cukcuk") {
      const groupParam = category.cukcukGroupName || category.name || category.code;
      navigate(`/category/${encodeURIComponent(groupParam)}`);
    } else {
      navigate(`/category/${encodeURIComponent(category.code)}`);
    }
  };

  // Lọc sản phẩm hiển thị theo từng danh mục
  const getProductsForCategory = (category: MiniAppCategory) => {
    const excludedIds = new Set(category.excludedProductIds || []);
    const featuredIds = new Set(category.featuredProductIds || []);

    if (category.sourceType === "news" || category.code === "news") {
      return messages;
    }

    if (category.sourceType === "coffee") {
      const filtered = lstCoffee.filter((item) => !excludedIds.has(item.id || ""));
      return filtered.sort((a, b) => {
        const aFeat = featuredIds.has(a.id || "") ? 1 : 0;
        const bFeat = featuredIds.has(b.id || "") ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    if (category.sourceType === "bottledDrink") {
      const filtered = lstBottledDrink.filter((item) => !excludedIds.has(item.id || ""));
      return filtered.sort((a, b) => {
        const aFeat = featuredIds.has(a.id || "") ? 1 : 0;
        const bFeat = featuredIds.has(b.id || "") ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    if (category.sourceType === "equipment") {
      const filtered = lstCoffeeEquipment.filter((item) => !excludedIds.has(item.id || ""));
      return filtered.sort((a, b) => {
        const aFeat = featuredIds.has(a.id || "") ? 1 : 0;
        const bFeat = featuredIds.has(b.id || "") ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    // Nếu là toàn bộ món đồ uống (sourceType === 'dishes' hoặc code === 'dishes')
    if (category.sourceType === "dishes" || category.code === "dishes" || (category.name || "").toLowerCase().includes("đồ uống")) {
      const filtered = lstDishes.filter((dish) => !excludedIds.has(dish.id || ""));
      return filtered.sort((a, b) => {
        const aFeat = a.id && featuredIds.has(a.id) ? 1 : 0;
        const bFeat = b.id && featuredIds.has(b.id) ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    // Mặc định là nhóm món CUKCUK cụ thể
    const targetGroup = (category.cukcukGroupName || category.name || "").toLowerCase().trim();
    const targetCode = (category.code || "").toLowerCase().trim();
    const targetGroupCode = (category.cukcukGroupCode || "").toLowerCase().trim();

    const filtered = lstDishes.filter((dish) => {
      if (dish.id && excludedIds.has(dish.id)) return false;
      const dGroup = (dish.groupName || dish.group || "").toLowerCase().trim();
      const dCode = (dish.code || "").toLowerCase().trim();
      return (
        dGroup === targetGroup ||
        dGroup.includes(targetGroup) ||
        targetGroup.includes(dGroup) ||
        (targetGroupCode && dGroup === targetGroupCode) ||
        dGroup === targetCode
      );
    });

    return filtered.sort((a, b) => {
      const aFeat = a.id && featuredIds.has(a.id) ? 1 : 0;
      const bFeat = b.id && featuredIds.has(b.id) ? 1 : 0;
      return bFeat - aFeat;
    });
  };

  // Danh mục hiển thị ở dải icon trên cùng
  const mainCategories = useMemo(() => {
    if (productsConfig.showCategoriesSection === false) return [];
    return (productsConfig.categories || [])
      .filter((c) => c.isActive && c.showInMainCategories === true)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [productsConfig.categories, productsConfig.showCategoriesSection]);

  // Các danh mục hiển thị thành section món cuộn bên dưới
  const featuredSections = useMemo(() => {
    return (productsConfig.categories || [])
      .filter((c) => c.isActive && c.showAsFeaturedSection !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [productsConfig.categories]);

  return (
    <div className="p-4 mb-10 bg-white pt-10">
      {/* Header & Store Selector */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-8am-black text-3xl font-bold">
            {productsConfig.pageTitle || "Sản Phẩm"}
          </div>
          {selectedStore && (
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-600 mr-2">Cửa hàng:</span>
              <span className="text-sm font-medium text-orange-600">
                {selectedStore.name}
              </span>
              <button
                onClick={() => navigate("/store-selection")}
                className="ml-2 text-xs text-blue-500 underline"
              >
                Thay đổi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      {productsConfig.showSearchBar !== false && (
        <div
          className="mb-6 cursor-pointer"
          onClick={() => navigate("/search")}
        >
          <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
            <SearchOutlined className="text-orange-500 mr-3 text-base" />
            <span className="text-gray-400 text-sm">
              {productsConfig.searchPlaceholder || "Tìm kiếm cà phê, món uống..."}
            </span>
          </div>
        </div>
      )}

      {/* Main Categories Section (Đồng bộ thời gian thực từ Admin) */}
      {mainCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {productsConfig.categorySectionTitle || "Danh mục"}
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {mainCategories.map((cat) => {
              const bgGradient =
                cat.gradient ||
                "linear-gradient(135deg, #FFF8E7 0%, #FFE0B2 100%)";
              const themeColor = cat.colorTheme || "#8B4513";

              return (
                <div
                  key={cat.id}
                  className="flex-shrink-0 w-36 rounded-2xl p-3 cursor-pointer hover:shadow-lg transition-all duration-300 relative flex flex-col items-center justify-between text-center"
                  style={{
                    background: bgGradient,
                    border: `1px solid ${themeColor}`,
                  }}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {/* Badge */}
                  {cat.badge && (
                    <span className="absolute top-2 right-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-600 shadow-sm uppercase tracking-wider">
                      {cat.badge}
                    </span>
                  )}

                  {/* Icon / Photo */}
                  <div
                    className="w-12 h-12 mb-2 rounded-xl flex items-center justify-center overflow-hidden shadow-sm mt-1"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      border: `1px solid ${themeColor}`,
                    }}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const nextElement = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        cat.imageUrl ? "hidden" : ""
                      }`}
                    >
                      <CategoryIcon
                        iconName={cat.iconName}
                        size={22}
                        color={themeColor}
                      />
                    </div>
                  </div>

                  {/* Category Name */}
                  <h3 className="font-bold text-xs text-gray-900 leading-tight">
                    {cat.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Featured Products Sections */}
      <div className="mb-6">
        {storeDataLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
            <CoffeeSkeleton />
          </div>
        ) : (
          <div className="space-y-7">
            {featuredSections.map((cat) => {
              const products = getProductsForCategory(cat);
              if (products.length === 0) return null;

              const featuredIds = new Set(cat.featuredProductIds || []);

              // Render khối Tin tức chuyên biệt
              if (cat.sourceType === "news" || cat.code === "news") {
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {cat.name}
                        </h3>
                        {cat.badge && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate("/category/news")}
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: cat.colorTheme || "#7c3aed" }}
                      >
                        <span>Xem thêm</span>
                        <RightOutlined className="text-xs" />
                      </button>
                    </div>

                    <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                      {products.slice(0, 8).map((message: any, index: number) => (
                        <div
                          key={message.id || index}
                          className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/news/${message.id}`)}
                        >
                          <div className="w-full h-28 bg-gray-100 overflow-hidden">
                            <img
                              src={message.template_data?.banner?.image_url}
                              alt={message.template_data?.header?.content || "Tin tức"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/logo.png";
                              }}
                            />
                          </div>
                          <div className="p-2">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">
                              {message.template_data?.header?.content || "Tin tức"}
                            </h4>
                            {message.template_data?.text?.content && (
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                {message.template_data.text.content
                                  .replace(/<br>/g, " ")
                                  .substring(0, 45)}
                                ...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Render khối sản phẩm thông thường (CUKCUK, Cà phê hạt, Đóng chai, Dụng cụ)
              return (
                <div key={cat.id}>
                  {/* Section Title Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {cat.name}
                      </h3>
                      {cat.badge && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-orange-100 text-orange-600">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCategoryClick(cat)}
                      className="text-sm font-medium flex items-center gap-1"
                      style={{ color: cat.colorTheme || "#ea580c" }}
                    >
                      <span>Xem thêm</span>
                      <RightOutlined className="text-xs" />
                    </button>
                  </div>

                  {/* Products Horizontal Slider */}
                  <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                    {products.map((item: any, index: number) => {
                      const isFeatured = item.id && featuredIds.has(item.id);

                      // Xác định URL ảnh & giá
                      let imageUrl = "";
                      let price = 0;
                      let detailRoute = "";

                      if (cat.sourceType === "coffee") {
                        imageUrl = getCoffeeImageUrl(item) || "";
                        price =
                          item.weightAndPrice && item.weightAndPrice.length > 0
                            ? Math.min(...item.weightAndPrice.map((wp: any) => wp.price))
                            : item.price || 0;
                        detailRoute = `/coffee/${item.id}`;
                      } else if (cat.sourceType === "bottledDrink") {
                        imageUrl = getBottledDrinkImageUrl(item) || "";
                        price =
                          item.volumes && item.volumes.length > 0
                            ? Math.min(...item.volumes.map((v: any) => v.price))
                            : item.price || 0;
                        detailRoute = `/bottled-drink/${item.id}`;
                      } else if (cat.sourceType === "equipment") {
                        imageUrl = getEquipmentImageUrl(item) || "";
                        price = item.price || 0;
                        detailRoute = `/coffee-equipment/${item.id}`;
                      } else {
                        // CUKCUK Dish
                        imageUrl = item.imageUrl || "";
                        price = item.price || 0;
                        detailRoute = `/dish/${item.id}`;
                      }

                      return (
                        <div
                          key={item.id || index}
                          className="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer relative hover:shadow-md transition-shadow"
                          onClick={() => navigate(detailRoute)}
                        >
                          {/* Star ⭐ Badge for Featured Dish */}
                          {isFeatured && (
                            <span className="absolute top-1.5 left-1.5 z-10 text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded shadow">
                              ⭐ Nổi bật
                            </span>
                          )}

                          {/* Image Box */}
                          <div className="w-full h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name || item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M2 21V19H20V21H2M20 8V5L18 5V3C18 1.9 17.1 1 16 1H8C6.9 1 6 1.9 6 3V5L4 5V8L6 8V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V8H20M16 3V5H8V3H16M8 18V8H16V18H8M9 9V17H11V9H9M13 9V17H15V9H13" />
                                        </svg>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <CategoryIcon
                                  iconName={cat.iconName}
                                  size={24}
                                  color="#9ca3af"
                                />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-2">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">
                              {item.name || item.product_name || "Món uống"}
                            </h4>
                            <p className="text-xs text-orange-600 font-bold mt-1">
                              {price > 0
                                ? `${price.toLocaleString()}đ`
                                : "Liên hệ"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
