import React, { useState, useEffect } from "react";
import { FaMicrophone, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { coffeeService } from "../firebase/coffeeService";
import { bottledDrinkService } from "../firebase/bottledDrinkService";
import { DishService } from "../firebase/dishService";
import { GrinderService } from "../firebase/grinderService";
import { BrewerService } from "../firebase/brewerService";
import { userService } from "../firebase/userService";
import { getUserID } from "zmp-sdk/apis";
import CoffeeCard from "../components/coffee-card";
import BottledDrinkCard from "../components/bottled-drink-card";
import DishCard from "../components/dish-card";
import MachineCard from "../components/machine-card";
import { CoffeeBean } from "../types/coffee";
import { BottledDrink } from "../types/bottledDrink";
import { Dish } from "../types/dish";
import { CoffeeGrinder } from "../types/grinder";
import { Brewer } from "../types/brewer";

interface SearchResult {
  type: 'coffee' | 'drink' | 'dish' | 'grinder' | 'brewer';
  item: any;
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchSuggestions] = useState<string[]>([
    "Ưu Đãi Dành Cho Sinh Viên Đại Học",
    "iPhone 16 Pro",
    "iPhone 16",
    "iPhone 16e",
    "Catimor Tram Hanh",
    "Honduras Brandy",
    "Robusta Honey",
    "Cold Brew",
    "Espresso",
    "V60 Dripper"
  ]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>();
  const navigate = useNavigate();

  const dishService = new DishService();
  const grinderService = new GrinderService();
  const brewerService = new BrewerService();

  useEffect(() => {
    checkLocal();
    loadRecentSearches();
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
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const updatedSearches = [
      trimmedQuery,
      ...recentSearches.filter(item => item !== trimmedQuery)
    ].slice(0, 10); // Giới hạn 10 tìm kiếm gần đây

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    saveToRecentSearches(query);

    try {
      const searchTerm = query.toLowerCase();
      const results: SearchResult[] = [];

      // Helper function để tính điểm phù hợp
      const calculateRelevanceScore = (text: string, searchTerm: string): number => {
        if (!text) return 0;
        const lowerText = text.toLowerCase();
        
        // Exact match có điểm cao nhất
        if (lowerText === searchTerm) return 100;
        
        // Bắt đầu bằng search term
        if (lowerText.startsWith(searchTerm)) return 80;
        
        // Chứa search term
        if (lowerText.includes(searchTerm)) return 60;
        
        // Tách từ và kiểm tra từng từ
        const words = searchTerm.split(' ');
        let wordMatches = 0;
        words.forEach(word => {
          if (word.length > 1 && lowerText.includes(word)) {
            wordMatches++;
          }
        });
        
        if (wordMatches > 0) return (wordMatches / words.length) * 40;
        
        return 0;
      };

      // Tìm kiếm trong hạt cà phê
      const coffees = await coffeeService.getAllCoffees();
      coffees.forEach((coffee: CoffeeBean) => {
        let maxScore = 0;
        
        // Tìm kiếm chính trong tên sản phẩm (ưu tiên cao nhất)
        const nameScore = calculateRelevanceScore(coffee.name, searchTerm);
        maxScore = Math.max(maxScore, nameScore);
        
        // Tìm kiếm trong region (điểm thấp hơn)
        if (coffee.region?.length > 0) {
          coffee.region.forEach(r => {
            const regionScore = calculateRelevanceScore(r, searchTerm) * 0.7;
            maxScore = Math.max(maxScore, regionScore);
          });
        }
        
        // Tìm kiếm trong flavor notes (điểm thấp hơn)
        if (coffee.flavorNotes?.length > 0) {
          coffee.flavorNotes.forEach(f => {
            const flavorScore = calculateRelevanceScore(f, searchTerm) * 0.5;
            maxScore = Math.max(maxScore, flavorScore);
          });
        }
        
        // Chỉ thêm vào kết quả nếu điểm >= 30
        if (maxScore >= 30) {
          results.push({ type: 'coffee', item: { ...coffee, relevanceScore: maxScore } });
        }
      });

      // Tìm kiếm trong đồ uống đóng chai
      const drinks = await bottledDrinkService.getAllBottledDrinks();
      drinks.forEach((drink: BottledDrink) => {
        let maxScore = 0;
        
        const nameScore = calculateRelevanceScore(drink.name || '', searchTerm);
        const productNameScore = calculateRelevanceScore(drink.product_name || '', searchTerm);
        maxScore = Math.max(maxScore, nameScore, productNameScore);
        
        const coffeeNameScore = calculateRelevanceScore(drink.coffeeName || '', searchTerm) * 0.8;
        maxScore = Math.max(maxScore, coffeeNameScore);
        
        if (drink.flavorNotes?.length > 0) {
          drink.flavorNotes.forEach(f => {
            const flavorScore = calculateRelevanceScore(f, searchTerm) * 0.5;
            maxScore = Math.max(maxScore, flavorScore);
          });
        }
        
        if (maxScore >= 30) {
          results.push({ type: 'drink', item: { ...drink, relevanceScore: maxScore } });
        }
      });

      // Tìm kiếm trong món ăn/đồ uống
      const dishes = await dishService.getAllDishes();
      dishes.forEach((dish: Dish) => {
        let maxScore = 0;
        
        const nameScore = calculateRelevanceScore(dish.name || '', searchTerm);
        maxScore = Math.max(maxScore, nameScore);
        
        const descScore = calculateRelevanceScore(dish.description || '', searchTerm) * 0.7;
        maxScore = Math.max(maxScore, descScore);
        
        if (dish.ingredients?.length > 0) {
          dish.ingredients.forEach(i => {
            const ingredientScore = calculateRelevanceScore(i.name || '', searchTerm) * 0.5;
            maxScore = Math.max(maxScore, ingredientScore);
          });
        }
        
        if (maxScore >= 30) {
          results.push({ type: 'dish', item: { ...dish, relevanceScore: maxScore } });
        }
      });

      // Tìm kiếm trong máy xay
      const grinders = await grinderService.getAll();
      grinders.forEach((grinder: CoffeeGrinder) => {
        let maxScore = 0;
        
        const nameScore = calculateRelevanceScore(grinder.name || '', searchTerm);
        const brandScore = calculateRelevanceScore(grinder.brand || '', searchTerm) * 0.8;
        maxScore = Math.max(maxScore, nameScore, brandScore);
        
        if (maxScore >= 30) {
          results.push({ type: 'grinder', item: { ...grinder, relevanceScore: maxScore } });
        }
      });

      // Tìm kiếm trong máy pha
      const brewers = await brewerService.getAll();
      brewers.forEach((brewer: Brewer) => {
        let maxScore = 0;
        
        const nameScore = calculateRelevanceScore(brewer.name || '', searchTerm);
        const brandScore = calculateRelevanceScore(brewer.brand || '', searchTerm) * 0.8;
        maxScore = Math.max(maxScore, nameScore, brandScore);
        
        if (maxScore >= 30) {
          results.push({ type: 'brewer', item: { ...brewer, relevanceScore: maxScore } });
        }
      });

      // Sắp xếp kết quả theo điểm liên quan giảm dần
      results.sort((a, b) => (b.item.relevanceScore || 0) - (a.item.relevanceScore || 0));

      setSearchResults(results);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    performSearch(suggestion);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const removeRecentSearch = (index: number) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Helper function để lấy URL ảnh từ sản phẩm
  const getProductImageUrl = (item: any, type: string) => {
    if (!item) return '';

    switch (type) {
      case 'coffee':
        if (item.images && item.images.length > 0 && item.images[0]) {
          return item.images[0];
        }
        if (item.imageUrl) {
          return item.imageUrl;
        }
        if (item.driveImages && item.driveImages.length > 0) {
          return `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;
        }
        break;
      case 'drink':
        if (item.images && item.images.length > 0) {
          return item.images[0];
        }
        if (item.driveImages && item.driveImages.length > 0) {
          return `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;
        }
        break;
      case 'dish':
        if (item.imageUrl) {
          return item.imageUrl;
        }
        break;
      case 'grinder':
      case 'brewer':
        if (item.images && item.images.length > 0) {
          return item.images[0];
        }
        if (item.driveImages && item.driveImages.length > 0) {
          return `https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`;
        }
        break;
    }
    return '';
  };

  // Helper function để lấy giá sản phẩm
  const getProductPrice = (item: any, type: string) => {
    switch (type) {
      case 'coffee':
        if (item.weightAndPrice && item.weightAndPrice.length > 0) {
          const minPrice = Math.min(...item.weightAndPrice.map((wp: any) => wp.price));
          return { price: minPrice, prefix: 'Từ ' };
        }
        break;
      case 'drink':
        if (item.volumes && item.volumes.length > 0) {
          const minPrice = Math.min(...item.volumes.map((v: any) => v.price));
          return { price: minPrice, prefix: 'Từ ' };
        }
        break;
      case 'dish':
      case 'grinder':
      case 'brewer':
        if (item.price && typeof item.price === 'number') {
          return { price: item.price, prefix: '' };
        }
        break;
    }
    return null;
  };

  // Helper function để lấy tên hiển thị
  const getProductName = (item: any, type: string) => {
    if (type === 'drink') {
      return item.product_name || item.name;
    }
    return item.name;
  };

  // Helper function để lấy loại sản phẩm
  const getProductTypeName = (type: string) => {
    switch (type) {
      case 'coffee': return 'Hạt cà phê';
      case 'drink': return 'Đồ uống';
      case 'dish': return 'Cà phê';
      case 'grinder': return 'Máy xay';
      case 'brewer': return 'Máy pha';
      default: return '';
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
        key={`${type}-${item.id}`}
        className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
        onClick={() => {
          if (type === 'coffee') navigate(`/coffee/${item.id}`);
          else if (type === 'drink') navigate(`/bottled-drink/${item.id}`);
          else if (type === 'dish') navigate(`/dish/${item.id}`);
          else if (type === 'grinder') navigate(`/grinder/${item.id}`);
          else if (type === 'brewer') navigate(`/brewer/${item.id}`);
        }}
      >
        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21V19H20V21H2M20 8V5L18 5V3C18 1.9 17.1 1 16 1H8C6.9 1 6 1.9 6 3V5L4 5V8L6 8V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V8H20M16 3V5H8V3H16M8 18V8H16V18H8M9 9V17H11V9H9M13 9V17H15V9H13" />
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21V19H20V21H2M20 8V5L18 5V3C18 1.9 17.1 1 16 1H8C6.9 1 6 1.9 6 3V5L4 5V8L6 8V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V8H20M16 3V5H8V3H16M8 18V8H16V18H8M9 9V17H11V9H9M13 9V17H15V9H13" />
            </svg>
          )}
        </div>
        <div className="p-2">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {productName}
          </h4>
          {priceInfo && (
            <p className="text-sm text-orange-600 font-semibold mt-1">
              {priceInfo.prefix}{priceInfo.price.toLocaleString()}đ
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">{typeName}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pt-10">
      <div className="p-4 mb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tìm kiếm</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-3">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm và cửa hàng"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
              />
              <button type="button" className="ml-3 p-1">
                <FaMicrophone className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Kết quả tìm kiếm ({searchResults.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 pb-2">
              {searchResults.map((result) => renderSearchResult(result))}
            </div>
          </div>
        ) : searchQuery.trim() && !loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy kết quả nào cho "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Đã Xem Gần Đây</h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-blue-500 text-sm"
                  >
                    Xóa
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700">{search}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(index);
                        }}
                        className="p-1"
                      >
                        <FaTimes className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thử Tìm Kiếm</h2>
              <div className="grid grid-cols-1 gap-2">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;