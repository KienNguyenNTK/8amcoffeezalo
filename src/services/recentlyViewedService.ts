import { getUserID } from 'zmp-sdk';
import { userService } from '../firebase/userService';
import { viewedHistoryService } from '../firebase/viewedHistoryService';
import { ViewedHistory } from '../types/viewedHistory';

// Legacy localStorage key for migration
const LEGACY_STORAGE_KEY = 'recentlyViewedCoffees';

export const recentlyViewedService = {
  // Helper: Tự động phân giải User ID từ Zalo SDK / Firestore nếu chưa có
  async resolveUserId(providedUserId?: string): Promise<{ id: string; localId?: string } | null> {
    if (providedUserId) {
      return { id: providedUserId };
    }
    try {
      const zaloUserId = await getUserID();
      if (zaloUserId) {
        const user = await userService.getUserByLocalId(zaloUserId);
        if (user && user.id) {
          return { id: user.id, localId: zaloUserId };
        }
        return { id: zaloUserId, localId: zaloUserId };
      }
    } catch (err) {
      console.warn('Could not resolve userId from Zalo SDK:', err);
    }
    return null;
  },

  // Lấy danh sách đã xem (dành cho user đã đăng nhập hoặc khách)
  async getRecentlyViewed(userId?: string): Promise<any[]> {
    const user = await this.resolveUserId(userId);
    const effectiveUserId = user?.id;
    console.log('recentlyViewedService.getRecentlyViewed called with resolved userId:', effectiveUserId);
    
    if (!effectiveUserId) {
      console.log('No userId resolved, using localStorage fallback');
      return this.getRecentlyViewedFromLocal();
    }

    try {
      console.log('Fetching viewed history from Firebase for userId:', effectiveUserId);
      const viewedHistory = await viewedHistoryService.getViewedHistory(effectiveUserId, 20);
      
      // Nếu user có localId khác docId, cũng fetch theo localId phòng trường hợp record được lưu bằng localId
      let altHistory: ViewedHistory[] = [];
      if (user.localId && user.localId !== effectiveUserId) {
        altHistory = await viewedHistoryService.getViewedHistory(user.localId, 20).catch(() => []);
      }

      const allHistory = [...viewedHistory, ...altHistory];
      console.log('Raw viewedHistory from Firebase:', allHistory);
      
      const mappedData = allHistory.map(item => ({
        ...item.productData,
        id: item.productId,
        type: item.productType,
        viewedAt: item.viewedAt,
        historyId: item.id
      }));
      
      // Hợp nhất dữ liệu Firebase và localStorage (đảm bảo không bao giờ bị mất sản phẩm vừa xem)
      const localData = this.getRecentlyViewedFromLocal();
      const combinedMap = new Map<string, any>();
      
      mappedData.forEach(item => {
        if (item && item.id) combinedMap.set(item.id, item);
      });
      
      localData.forEach(item => {
        if (item && item.id && !combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      const combinedList = Array.from(combinedMap.values());
      console.log('Mapped recently viewed data:', combinedList);
      return combinedList;
    } catch (error) {
      console.error('Error getting recently viewed from Firebase:', error);
      return this.getRecentlyViewedFromLocal();
    }
  },

  // Thêm vào danh sách đã xem
  async addToRecentlyViewed(
    productData: any, 
    productType: 'coffee' | 'drink' | 'dish' | 'coffee_equipment',
    userId?: string
  ): Promise<any[]> {
    if (!productData || !productData.id) return [];

    console.log('addToRecentlyViewed called with:', {
      productId: productData.id,
      productType,
      userId,
      productName: productData.name
    });
    
    // Luôn lưu vào localStorage làm cache tức thì
    this.addToRecentlyViewedLocal({
      ...productData,
      id: productData.id,
      type: productType
    });

    const user = await this.resolveUserId(userId);
    const effectiveUserId = user?.id;

    if (!effectiveUserId) {
      console.log('No effectiveUserId resolved, stored in localStorage');
      return this.getRecentlyViewedFromLocal();
    }

    try {
      console.log('Adding to Firebase viewed history for effective user:', effectiveUserId);
      await viewedHistoryService.addToViewedHistory(
        effectiveUserId,
        productData.id,
        productType,
        {
          ...productData,
          id: productData.id,
          type: productType
        }
      );
      console.log('Successfully added to Firebase viewed history');

      // Return updated list
      const updatedList = await this.getRecentlyViewed(effectiveUserId);
      return updatedList;
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
      return this.getRecentlyViewedFromLocal();
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
          let productType: 'coffee' | 'drink' | 'dish' | 'coffee_equipment' = 'coffee';
          if (item.volumes) productType = 'drink';
          else if (item.values && Array.isArray(item.values) && item.categoryId) productType = 'coffee_equipment';
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