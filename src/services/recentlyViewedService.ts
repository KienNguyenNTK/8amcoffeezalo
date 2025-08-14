import { viewedHistoryService } from '../firebase/viewedHistoryService';
import { ViewedHistory } from '../types/viewedHistory';

// Legacy localStorage key for migration
const LEGACY_STORAGE_KEY = 'recentlyViewedCoffees';

export const recentlyViewedService = {
  // Lấy danh sách đã xem (dành cho user đã đăng nhập)
  async getRecentlyViewed(userId?: string): Promise<any[]> {
    console.log('recentlyViewedService.getRecentlyViewed called with userId:', userId);
    
    if (!userId) {
      console.log('No userId provided, using localStorage fallback');
      // Fallback to localStorage if no userId
      return this.getRecentlyViewedFromLocal();
    }

    try {
      console.log('Fetching viewed history from Firebase for userId:', userId);
      const viewedHistory = await viewedHistoryService.getViewedHistory(userId, 10);
      console.log('Raw viewedHistory from Firebase:', viewedHistory);
      
      const mappedData = viewedHistory.map(item => ({
        ...item.productData,
        id: item.productId,
        type: item.productType,
        viewedAt: item.viewedAt
      }));
      
      console.log('Mapped recently viewed data:', mappedData);
      return mappedData;
    } catch (error) {
      console.error('Error getting recently viewed from Firebase:', error);
      // Fallback to localStorage
      console.log('Falling back to localStorage');
      return this.getRecentlyViewedFromLocal();
    }
  },

  // Thêm vào danh sách đã xem
  async addToRecentlyViewed(
    productData: any, 
    productType: 'coffee' | 'drink' | 'dish' | 'grinder' | 'brewer',
    userId?: string
  ): Promise<any[]> {
    if (!userId) {
      // Fallback to localStorage if no userId
      return this.addToRecentlyViewedLocal(productData);
    }

    try {
      await viewedHistoryService.addToViewedHistory(
        userId,
        productData.id,
        productType,
        {
          ...productData,
          type: productType
        }
      );

      // Return updated list
      return await this.getRecentlyViewed(userId);
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
      // Fallback to localStorage
      return this.addToRecentlyViewedLocal(productData);
    }
  },

  // Xóa toàn bộ lịch sử đã xem
  async clearRecentlyViewed(userId?: string): Promise<void> {
    if (!userId) {
      this.clearRecentlyViewedLocal();
      return;
    }

    try {
      await viewedHistoryService.clearViewedHistory(userId);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
      // Fallback to localStorage
      this.clearRecentlyViewedLocal();
    }
  },

  // Migration: Chuyển dữ liệu từ localStorage lên Firebase
  async migrateToFirebase(userId: string): Promise<void> {
    try {
      const localData = this.getRecentlyViewedFromLocal();
      
      if (localData.length > 0) {
        for (const item of localData) {
          // Determine product type
          let productType: 'coffee' | 'drink' | 'dish' = 'coffee';
          if (item.volumes) productType = 'drink';
          else if (item.price && !item.weightAndPrice) productType = 'dish';

          await viewedHistoryService.addToViewedHistory(
            userId,
            item.id,
            productType,
            item
          );
        }

        // Clear localStorage after successful migration
        this.clearRecentlyViewedLocal();
        console.log(`Migrated ${localData.length} items to Firebase`);
      }
    } catch (error) {
      console.error('Error migrating to Firebase:', error);
    }
  },

  // Legacy methods for localStorage (fallback)
  getRecentlyViewedFromLocal(): any[] {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addToRecentlyViewedLocal(item: any): any[] {
    const recentlyViewed = this.getRecentlyViewedFromLocal();
    
    // Remove if already exists
    const filtered = recentlyViewed.filter((existingItem: any) => existingItem.id !== item.id);
    
    // Add to beginning of array
    filtered.unshift(item);
    
    // Keep only 10 items
    const trimmed = filtered.slice(0, 10);
    
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  },

  clearRecentlyViewedLocal(): void {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}; 