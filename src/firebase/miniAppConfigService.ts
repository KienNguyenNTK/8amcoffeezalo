import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { MiniAppProductsConfig, MiniAppCategory, MiniAppSearchConfig } from '../types/miniAppManagement';

const CONFIG_COLLECTION = 'miniapp_config';
const PRODUCTS_PAGE_DOC = 'products_page';
const SEARCH_PAGE_DOC = 'search_page';

export const DEFAULT_MINIAPP_SEARCH_CONFIG: MiniAppSearchConfig = {
  headerTitle: 'Tìm Kiếm',
  searchPlaceholder: 'Tìm cà phê, món uống, dụng cụ...',
  maxRecentSearches: 10,
  enableVoiceSearch: true,
  showCategoryFilters: true,
  showCategoryGrid: true,
  categorySectionTitle: 'Khám phá theo danh mục',
  trendingSearches: [
    'Cold Brew',
    'Catimor Trạm Hành',
    'Robusta Honey',
    'Specialty Pour Over',
    'V60 Dripper',
    'Espresso Arabica',
  ],
  suggestedTags: [
    'Cà phê đặc sản',
    'Ủ lạnh',
    'Rang mộc',
    'Pha phin',
    'Pha máy',
  ],
  categories: [
    { id: 'all', name: 'Tất cả', type: 'all', icon: '✨', isActive: true, displayOrder: 1 },
    { id: 'specialty', name: 'Specialty', type: 'cukcuk', groupName: 'Specialty', icon: '🔥', isActive: true, displayOrder: 2 },
    { id: 'cold-brew', name: 'Cold Brew', type: 'cukcuk', groupName: 'Cold Brew', icon: '❄️', isActive: true, displayOrder: 3 },
    { id: 'arabica-base', name: 'Arabica Base', type: 'cukcuk', groupName: 'Arabica Base', icon: '☕', isActive: true, displayOrder: 4 },
    { id: 'robusta-base', name: 'Robusta Base', type: 'cukcuk', groupName: 'Robusta Base', icon: '⚡', isActive: true, displayOrder: 5 },
    { id: 'chai', name: 'Chai', type: 'cukcuk', groupName: 'Chai', icon: '🌿', isActive: true, displayOrder: 6 },
    { id: 'non-caffein', name: 'Non Caffein', type: 'cukcuk', groupName: 'Non Caffein', icon: '🍃', isActive: true, displayOrder: 7 },
    { id: 'coffee', name: 'Hạt cà phê', type: 'coffee', icon: '🏪', isActive: true, displayOrder: 8 },
    { id: 'drink', name: 'Đóng chai', type: 'bottledDrink', icon: '🛍️', isActive: true, displayOrder: 9 },
    { id: 'machines', name: 'Dụng cụ', type: 'equipment', icon: '🛠️', isActive: true, displayOrder: 10 },
  ],
};

export const DEFAULT_MINIAPP_PRODUCTS_CONFIG: MiniAppProductsConfig = {
  pageTitle: 'Sản Phẩm',
  categorySectionTitle: 'Danh mục',
  showSearchBar: true,
  searchPlaceholder: 'Tìm kiếm cà phê, món uống...',
  version: 1,
  categories: [
    {
      id: 'cukcuk_specialty',
      code: 'specialty',
      name: 'Specialty',
      subtitle: 'Cà phê hạt đặc sản chọn lọc',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Specialty',
      iconName: 'FireOutlined',
      colorTheme: '#8B4513',
      gradient: 'linear-gradient(135deg, #FFF8E7 0%, #FFE0B2 100%)',
      displayOrder: 1,
      isActive: true,
      badge: 'ĐẶC BIỆT',
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cukcuk_cold_brew',
      code: 'cold-brew',
      name: 'Cold Brew',
      subtitle: 'Cà phê ủ lạnh thanh mát',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Cold Brew',
      iconName: 'ExperimentOutlined',
      colorTheme: '#1565C0',
      gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      displayOrder: 2,
      isActive: true,
      badge: 'HOT',
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cukcuk_arabica_base',
      code: 'arabica-base',
      name: 'Arabica Base',
      subtitle: 'Nền Arabica chua thanh thanh tao',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Arabica Base',
      iconName: 'CoffeeOutlined',
      colorTheme: '#C67C4E',
      gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFE082 100%)',
      displayOrder: 3,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cukcuk_robusta_base',
      code: 'robusta-base',
      name: 'Robusta Base',
      subtitle: 'Nền Robusta đậm đà truyền thống',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Robusta Base',
      iconName: 'ThunderboltOutlined',
      colorTheme: '#4E342E',
      gradient: 'linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)',
      displayOrder: 4,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cukcuk_chai',
      code: 'chai',
      name: 'Chai',
      subtitle: 'Thức uống trà hương gia vị ấm áp',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Chai',
      iconName: 'BranchesOutlined',
      colorTheme: '#AD1457',
      gradient: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
      displayOrder: 5,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cukcuk_non_caffein',
      code: 'non-caffein',
      name: 'Non Caffein',
      subtitle: 'Đồ uống không caffein lành mạnh',
      sourceType: 'cukcuk',
      cukcukGroupName: 'Non Caffein',
      iconName: 'CloudOutlined',
      colorTheme: '#2E7D32',
      gradient: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      displayOrder: 6,
      isActive: true,
      badge: 'HEALTHY',
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cat_coffee_beans',
      code: 'coffee',
      name: 'Hạt cà phê',
      subtitle: 'Hạt rang mộc nguyên chất đóng gói',
      sourceType: 'coffee',
      iconName: 'ShopOutlined',
      colorTheme: '#A0522D',
      gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFCC80 100%)',
      displayOrder: 7,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cat_bottled_drinks',
      code: 'bottled-drinks',
      name: 'Đồ uống đóng chai',
      subtitle: 'Cà phê tươi đóng chai mang đi tiện lợi',
      sourceType: 'bottledDrink',
      iconName: 'ShoppingOutlined',
      colorTheme: '#00838F',
      gradient: 'linear-gradient(135deg, #E0F7FA 0%, #80DEEA 100%)',
      displayOrder: 8,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cat_coffee_equipment',
      code: 'machines',
      name: 'Dụng cụ cà phê',
      subtitle: 'Phễu V60, bình pha, máy xay cao cấp',
      sourceType: 'equipment',
      iconName: 'ToolOutlined',
      colorTheme: '#6A1B9A',
      gradient: 'linear-gradient(135deg, #F3E5F5 0%, #CE93D8 100%)',
      displayOrder: 9,
      isActive: true,
      displayLayout: 'horizontal_scroll',
      showInMainCategories: true,
      showAsFeaturedSection: true,
    },
    {
      id: 'cat_news',
      code: 'news',
      name: 'Tin tức & Ưu đãi',
      subtitle: 'Bản tin, chương trình ưu đãi mới nhất',
      sourceType: 'news',
      iconName: 'TagOutlined',
      colorTheme: '#7C3AED',
      gradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
      displayOrder: 10,
      isActive: true,
      badge: 'HOT',
      displayLayout: 'horizontal_scroll',
      showInMainCategories: false,
      showAsFeaturedSection: true,
    },
  ],
};

export const miniAppConfigService = {
  /**
   * Lấy cấu hình trang Sản phẩm từ Firestore
   */
  async getProductsPageConfig(): Promise<MiniAppProductsConfig> {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, PRODUCTS_PAGE_DOC);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as MiniAppProductsConfig;
        return {
          ...DEFAULT_MINIAPP_PRODUCTS_CONFIG,
          ...data,
          categories: (data.categories || DEFAULT_MINIAPP_PRODUCTS_CONFIG.categories).sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
          ),
        };
      }
      return DEFAULT_MINIAPP_PRODUCTS_CONFIG;
    } catch (error) {
      console.warn('Lỗi tải cấu hình trang sản phẩm từ Firestore, dùng mặc định:', error);
      return DEFAULT_MINIAPP_PRODUCTS_CONFIG;
    }
  },

  /**
   * Lắng nghe thay đổi thời gian thực từ Firestore
   */
  subscribeProductsPageConfig(callback: (config: MiniAppProductsConfig) => void): () => void {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, PRODUCTS_PAGE_DOC);
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as MiniAppProductsConfig;
            callback({
              ...DEFAULT_MINIAPP_PRODUCTS_CONFIG,
              ...data,
              categories: (data.categories || DEFAULT_MINIAPP_PRODUCTS_CONFIG.categories).sort(
                (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
              ),
            });
          } else {
            callback(DEFAULT_MINIAPP_PRODUCTS_CONFIG);
          }
        },
        (error) => {
          console.warn('Lỗi subscription cấu hình trang sản phẩm:', error);
          callback(DEFAULT_MINIAPP_PRODUCTS_CONFIG);
        }
      );
    } catch (error) {
      console.warn('Lỗi kết nối realtime Firestore config:', error);
      callback(DEFAULT_MINIAPP_PRODUCTS_CONFIG);
      return () => {};
    }
  },

  /**
   * Lấy cấu hình trang Tìm kiếm từ Firestore
   */
  async getSearchPageConfig(): Promise<MiniAppSearchConfig> {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, SEARCH_PAGE_DOC);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as MiniAppSearchConfig;
        return {
          ...DEFAULT_MINIAPP_SEARCH_CONFIG,
          ...data,
          categories: (data.categories || DEFAULT_MINIAPP_SEARCH_CONFIG.categories || []).sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
          ),
        };
      }
      return DEFAULT_MINIAPP_SEARCH_CONFIG;
    } catch (error) {
      console.warn('Lỗi tải cấu hình trang tìm kiếm từ Firestore, dùng mặc định:', error);
      return DEFAULT_MINIAPP_SEARCH_CONFIG;
    }
  },

  /**
   * Lắng nghe thay đổi thời gian thực cấu hình trang Tìm kiếm
   */
  subscribeSearchPageConfig(callback: (config: MiniAppSearchConfig) => void): () => void {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, SEARCH_PAGE_DOC);
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as MiniAppSearchConfig;
            callback({
              ...DEFAULT_MINIAPP_SEARCH_CONFIG,
              ...data,
              categories: (data.categories || DEFAULT_MINIAPP_SEARCH_CONFIG.categories || []).sort(
                (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
              ),
            });
          } else {
            callback(DEFAULT_MINIAPP_SEARCH_CONFIG);
          }
        },
        (error) => {
          console.warn('Lỗi subscription cấu hình trang tìm kiếm:', error);
          callback(DEFAULT_MINIAPP_SEARCH_CONFIG);
        }
      );
    } catch (error) {
      console.warn('Lỗi kết nối realtime Firestore search config:', error);
      callback(DEFAULT_MINIAPP_SEARCH_CONFIG);
      return () => {};
    }
  },
};
