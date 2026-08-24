export type MiniAppCategorySourceType = 'cukcuk' | 'dish' | 'coffee' | 'bottledDrink' | 'equipment' | 'news' | 'custom';

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
  searchPlaceholder?: string;
  categories: MiniAppCategory[];
  updatedAt?: any;
  version?: number;
}
