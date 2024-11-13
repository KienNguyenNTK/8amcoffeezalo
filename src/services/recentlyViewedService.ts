const STORAGE_KEY = 'recentlyViewedCoffees';
const MAX_ITEMS = 10;

export const recentlyViewedService = {
  getRecentlyViewed() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addToRecentlyViewed(coffee: any) {
    const recentlyViewed = this.getRecentlyViewed();
    
    // Remove if already exists
    const filtered = recentlyViewed.filter((item: any) => item.id !== coffee.id);
    
    // Add to beginning of array
    filtered.unshift(coffee);
    
    // Keep only MAX_ITEMS
    const trimmed = filtered.slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  },

  clearRecentlyViewed() {
    localStorage.removeItem(STORAGE_KEY);
  }
}; 