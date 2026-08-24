import React, { useState, useEffect } from "react";
import { FaMicrophone, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { userService } from "../firebase/userService";
import { miniAppConfigService, DEFAULT_MINIAPP_SEARCH_CONFIG } from "../firebase/miniAppConfigService";
import { getUserID } from "zmp-sdk/apis";
import { CoffeeBean } from "../types/coffee";
import { BottledDrink } from "../types/bottledDrink";
import { Dish } from "../types/dish";
import { CoffeeEquipment } from "../types/coffeeEquipment";
import { productCatalogService } from "../services/productCatalogService";
import { MiniAppSearchConfig, MiniAppSearchCategoryFilter } from "../types/miniAppManagement";

interface SearchResult {
  type: 'coffee' | 'drink' | 'dish' | 'coffee_equipment';
  item: any;
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchConfig, setSearchConfig] = useState<MiniAppSearchConfig>(DEFAULT_MINIAPP_SEARCH_CONFIG);
  const [categoryFilters, setCategoryFilters] = useState<MiniAppSearchCategoryFilter[]>(
    DEFAULT_MINIAPP_SEARCH_CONFIG.categories || []
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>(
    DEFAULT_MINIAPP_SEARCH_CONFIG.trendingSearches
  );
  const [suggestedTags, setSuggestedTags] = useState<string[]>(
    DEFAULT_MINIAPP_SEARCH_CONFIG.suggestedTags
  );
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>();
  const navigate = useNavigate();

  useEffect(() => {
    checkLocal();
    loadRecentSearches();

    // Lắng nghe cấu hình trang Tìm kiếm realtime từ Firestore
    const unsubscribe = miniAppConfigService.subscribeSearchPageConfig((cfg) => {
      setSearchConfig(cfg);
      if (cfg.categories && cfg.categories.length > 0) {
        const activeCats = cfg.categories
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCategoryFilters(activeCats);
      }
      if (cfg.trendingSearches && cfg.trendingSearches.length > 0) {
        setTrendingKeywords(cfg.trendingSearches);
      }
      if (cfg.suggestedTags && cfg.suggestedTags.length > 0) {
        setSuggestedTags(cfg.suggestedTags);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkLocal = async () => {
    try {
      const userId = await getUserID();
      if (!userId) return;
      const user = await userService.getUserByLocalId(userId);
      if (user) {
        setUserInfo(user);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const maxRecent = searchConfig.maxRecentSearches || 10;
    const updatedSearches = [
      trimmedQuery,
      ...recentSearches.filter((item) => item !== trimmedQuery),
    ].slice(0, maxRecent);

    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const removeRecentSearch = (index: number) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Hàm tính điểm liên quan
  const calculateRelevanceScore = (text: string, searchTerm: string): number => {
    if (!text) return 0;
    const lowerText = text.toLowerCase();

    if (lowerText === searchTerm) return 100;
    if (lowerText.startsWith(searchTerm)) return 80;
    if (lowerText.includes(searchTerm)) return 60;

    const words = searchTerm.split(" ");
    let wordMatches = 0;
    words.forEach((word) => {
      if (word.length > 1 && lowerText.includes(word)) {
        wordMatches++;
      }
    });

    if (wordMatches > 0) return (wordMatches / words.length) * 40;
    return 0;
  };

  // Thực hiện tìm kiếm & lọc danh mục
  const executeSearch = async (query: string, categoryId: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    const activeFilter = categoryFilters.find((c) => c.id === categoryId) || categoryFilters[0] || { id: "all", type: "all" };

    if (!trimmedQuery && categoryId === "all") {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    if (trimmedQuery) {
      saveToRecentSearches(query);
    }

    try {
      const results: SearchResult[] = [];
      const filterType = activeFilter.type;

      const catalog = await productCatalogService.getCatalog();

      // 1. Lọc hạt cà phê
      if (filterType === "all" || filterType === "coffee") {
        (catalog.coffees || []).forEach((coffee: CoffeeBean) => {
          if (!trimmedQuery) {
            results.push({ type: "coffee", item: { ...coffee, relevanceScore: 50 } });
          } else {
            let maxScore = calculateRelevanceScore(coffee.name, trimmedQuery);
            if (coffee.region?.length) {
              coffee.region.forEach((r) => {
                maxScore = Math.max(maxScore, calculateRelevanceScore(r, trimmedQuery) * 0.7);
              });
            }
            if (coffee.flavorNotes?.length) {
              coffee.flavorNotes.forEach((f) => {
                maxScore = Math.max(maxScore, calculateRelevanceScore(f, trimmedQuery) * 0.5);
              });
            }
            if (maxScore >= 25) {
              results.push({ type: "coffee", item: { ...coffee, relevanceScore: maxScore } });
            }
          }
        });
      }

      // 2. Lọc đồ uống đóng chai
      if (filterType === "all" || filterType === "drink" || filterType === "bottledDrink") {
        (catalog.drinks || []).forEach((drink: BottledDrink) => {
          const drinkName = drink.name || (drink as any).product_name || "";
          if (!trimmedQuery) {
            results.push({ type: "drink", item: { ...drink, relevanceScore: 50 } });
          } else {
            let maxScore = calculateRelevanceScore(drinkName, trimmedQuery);
            const coffeeNameScore = calculateRelevanceScore(drink.coffeeName || "", trimmedQuery) * 0.8;
            maxScore = Math.max(maxScore, coffeeNameScore);

            if (drink.flavorNotes?.length) {
              drink.flavorNotes.forEach((f) => {
                maxScore = Math.max(maxScore, calculateRelevanceScore(f, trimmedQuery) * 0.5);
              });
            }
            if (maxScore >= 25) {
              results.push({ type: "drink", item: { ...drink, relevanceScore: maxScore } });
            }
          }
        });
      }

      // 3. Lọc món ăn / Đồ uống CUKCUK
      if (filterType === "all" || filterType === "cukcuk" || filterType === "dishes" || filterType === "dish") {
        (catalog.dishes || []).forEach((dish: Dish) => {
          const dGroup = (dish.groupName || dish.group || "").toLowerCase().trim();
          const targetGroup = (activeFilter.groupName || activeFilter.name || "").toLowerCase().trim();

          if ((filterType === "cukcuk" || filterType === "dish") && targetGroup) {
            const matchesGroup = dGroup.includes(targetGroup) || targetGroup.includes(dGroup);
            if (!matchesGroup) return;
          }

          if (!trimmedQuery) {
            results.push({ type: "dish", item: { ...dish, relevanceScore: 50 } });
          } else {
            let maxScore = calculateRelevanceScore(dish.name || "", trimmedQuery);
            if (dish.description) {
              maxScore = Math.max(maxScore, calculateRelevanceScore(dish.description, trimmedQuery) * 0.5);
            }
            if (maxScore >= 25) {
              results.push({ type: "dish", item: { ...dish, relevanceScore: maxScore } });
            }
          }
        });
      }

      // 4. Lọc dụng cụ cà phê
      if (filterType === "all" || filterType === "coffee_equipment" || filterType === "equipment") {
        (catalog.equipment || []).forEach((item: CoffeeEquipment) => {
          const eqName = (item as any).name || item.categoryName || "Dụng cụ cà phê";
          if (!trimmedQuery) {
            results.push({ type: "coffee_equipment", item: { ...item, relevanceScore: 50 } });
          } else {
            let maxScore = calculateRelevanceScore(eqName, trimmedQuery);
            if (item.values?.length) {
              item.values.forEach((v) => {
                maxScore = Math.max(maxScore, calculateRelevanceScore(v.name || "", trimmedQuery) * 0.7);
              });
            }
            if (maxScore >= 25) {
              results.push({ type: "coffee_equipment", item: { ...item, relevanceScore: maxScore } });
            }
          }
        });
      }

      // Sắp xếp kết quả
      results.sort((a, b) => (b.item.relevanceScore || 0) - (a.item.relevanceScore || 0));

      // Khử trùng lặp
      const uniqueMap = new Map<string, SearchResult>();
      results.forEach((r) => {
        const id = r.item.id || r.item._id || r.item.name;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, r);
        }
      });

      setSearchResults(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error executing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, selectedCategoryId);
  };

  const handleCategorySelect = (cat: MiniAppSearchCategoryFilter) => {
    setSelectedCategoryId(cat.id);
    executeSearch(searchQuery, cat.id);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    executeSearch(suggestion, selectedCategoryId);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    executeSearch(query, selectedCategoryId);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (selectedCategoryId === "all") {
      setSearchResults([]);
    } else {
      executeSearch("", selectedCategoryId);
    }
  };

  // Helper lấy URL ảnh
  const getProductImageUrl = (item: any, type: string) => {
    if (!item) return "";
    if (item.images && item.images.length > 0 && item.images[0]) {
      return item.images[0];
    }
    if (item.imageUrl) {
      return item.imageUrl;
    }
    if (item.driveImages && item.driveImages.length > 0) {
      return `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;
    }
    return "";
  };

  // Helper lấy giá sản phẩm
  const getProductPrice = (item: any, type: string) => {
    if (type === "coffee" && item.weightAndPrice?.length) {
      const minPrice = Math.min(...item.weightAndPrice.map((wp: any) => wp.price));
      return { price: minPrice, prefix: "Từ " };
    }
    if (type === "drink" && item.volumes?.length) {
      const minPrice = Math.min(...item.volumes.map((v: any) => v.price));
      return { price: minPrice, prefix: "Từ " };
    }
    if (item.price && typeof item.price === "number") {
      return { price: item.price, prefix: "" };
    }
    return null;
  };

  const getProductName = (item: any, type: string) => {
    if (type === "drink") return item.name || item.product_name || "Đồ uống đóng chai";
    if (type === "coffee_equipment") return item.name || item.categoryName || "Dụng cụ cà phê";
    return item.name || item.product_name || "Sản phẩm";
  };

  const getProductTypeName = (type: string) => {
    switch (type) {
      case "coffee":
        return "Hạt cà phê";
      case "drink":
        return "Đóng chai";
      case "dish":
        return "Đồ uống";
      case "coffee_equipment":
        return "Dụng cụ";
      default:
        return "";
    }
  };

  const renderSearchResult = (result: SearchResult) => {
    const { type, item } = result;
    const imageUrl = getProductImageUrl(item, type);
    const priceInfo = getProductPrice(item, type);
    const productName = getProductName(item, type);
    const typeName = getProductTypeName(type);

    return (
      <div
        key={`${type}-${item.id || item.name}`}
        className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
        onClick={() => {
          if (type === "coffee") navigate(`/coffee/${item.id}`);
          else if (type === "drink") navigate(`/bottled-drink/${item.id}`);
          else if (type === "dish") navigate(`/dish/${item.id}`);
          else if (type === "coffee_equipment") navigate(`/coffee-equipment/${item.id}`);
        }}
      >
        <div className="w-full h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 21V19H20V21H2M20 8V5L18 5V3C18 1.9 17.1 1 16 1H8C6.9 1 6 1.9 6 3V5L4 5V8L6 8V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V8H20M16 3V5H8V3H16M8 18V8H16V18H8M9 9V17H11V9H9M13 9V17H15V9H13" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-2.5 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
              {typeName}
            </span>
            <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mt-1">
              {productName}
            </h4>
          </div>
          {priceInfo && (
            <p className="text-xs text-orange-600 font-bold mt-2">
              {priceInfo.prefix}{priceInfo.price.toLocaleString()}đ
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-20">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {searchConfig.headerTitle || "Tìm kiếm & Khám phá"}
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <div className="flex items-center bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-200">
              <svg className="w-5 h-5 text-gray-400 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchConfig.searchPlaceholder || "Tìm cà phê, món uống, dụng cụ..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  executeSearch(e.target.value, selectedCategoryId);
                }}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-gray-400 hover:text-gray-600 mr-1"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              )}
              {searchConfig.enableVoiceSearch !== false && (
                <button type="button" className="ml-1 p-1 text-gray-400">
                  <FaMicrophone className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* DẢI BỘ LỌC DANH MỤC (CATEGORY FILTERS BAR) */}
          {searchConfig.showCategoryFilters !== false && categoryFilters.length > 0 && (
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              {categoryFilters.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-sm font-bold scale-[1.02]"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span>{cat.icon || "☕"}</span>
                    )}
                    <span>{cat.name}</span>
                    {cat.badge && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelected ? 'bg-white text-orange-600' : 'bg-red-500 text-white'}`}>
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
            <p className="text-xs text-gray-400">Đang tìm kiếm...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-800">
                {selectedCategoryId !== "all"
                  ? `Danh mục: ${categoryFilters.find((c) => c.id === selectedCategoryId)?.name} (${searchResults.length})`
                  : `Kết quả tìm kiếm (${searchResults.length})`}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-4">
              {searchResults.map((result) => renderSearchResult(result))}
            </div>
          </div>
        ) : (searchQuery.trim() || selectedCategoryId !== "all") && !loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 p-6">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-semibold text-gray-700">Không tìm thấy sản phẩm phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Thử tìm với từ khóa khác hoặc chọn danh mục "Tất cả"</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryId("all");
                setSearchResults([]);
              }}
              className="mt-4 px-4 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full"
            >
              Xem tất cả gợi ý
            </button>
          </div>
        ) : (
          <>
            {/* Trending Searches */}
            {trendingKeywords.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-3">🔥 Từ khóa thịnh hành</h2>
                <div className="flex flex-wrap gap-2">
                  {trendingKeywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(keyword)}
                      className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-3">✨ Gợi ý nhanh</h2>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(tag)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900">🕒 Đã xem gần đây</h2>
                  <button onClick={clearRecentSearches} className="text-orange-600 text-xs font-semibold">
                    Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <span>{search}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(index);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;