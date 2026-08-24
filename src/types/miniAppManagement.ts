export type MiniAppCategorySourceType = 'dishes' | 'cukcuk' | 'dish' | 'coffee' | 'bottledDrink' | 'equipment' | 'news' | 'custom';

export type CategoryDisplayLayout = 'horizontal_scroll' | 'grid_2_cols' | 'grid_3_cols' | 'list';

export interface MiniAppCategory {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  sourceType: MiniAppCategorySourceType;
  cukcukGroupName?: string;
  cukcukGroupCode?: string;
  badge?: string; // 'HOT', 'NEW', 'ĐẶC BIỆT', 'HEALTHY', etc.
  iconName?: string;
  imageUrl?: string;
  colorTheme?: string; // Hex color code
  gradient?: string; // CSS gradient string
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
  excludedProductIds?: string[];
  featuredProductIds?: string[];
  displayLayout?: CategoryDisplayLayout;
  showInMainCategories?: boolean;
  showAsFeaturedSection?: boolean;
}

export interface MiniAppProductsConfig {
  pageTitle: string;
  categorySectionTitle: string;
  showSearchBar: boolean;
  showCategoriesSection?: boolean;
  searchPlaceholder?: string;
  categories: MiniAppCategory[];
  updatedAt?: any;
  version?: number;
}

export interface MiniAppSearchCategoryFilter {
  id: string;
  name: string;
  type: 'all' | 'cukcuk' | 'dishes' | 'dish' | 'coffee' | 'drink' | 'bottledDrink' | 'coffee_equipment' | 'equipment' | 'news' | 'custom';
  groupName?: string;
  icon?: string;
  imageUrl?: string;
  badge?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface MiniAppSearchConfig {
  headerTitle: string;
  searchPlaceholder: string;
  trendingSearches: string[];
  suggestedTags: string[];
  maxRecentSearches: number;
  enableVoiceSearch: boolean;
  showCategoryFilters?: boolean;
  showCategoryGrid?: boolean;
  categorySectionTitle?: string;
  categories?: MiniAppSearchCategoryFilter[];
  updatedAt?: any;
  version?: number;
}
