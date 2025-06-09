import { storeMenuService as firebaseStoreMenuService } from '../firebase/storeMenuService';
import { coffeeService } from '../firebase/coffeeService';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { DishService } from '../firebase/dishService';
import { SelectedStoreService } from './selectedStoreService';
import type { StoreMenu } from '../types/store';
import type { CoffeeBean } from '../types/coffee';
import type { BottledDrink } from '../types/bottledDrink';
import type { Dish } from '../types/dish';

const dishService = new DishService();

// Enhanced cache với optimistic loading
const enhancedCache = {
    products: {
        coffees: null as CoffeeBean[] | null,
        bottledDrinks: null as BottledDrink[] | null,
        dishes: null as Dish[] | null,
    },
    storeMenus: new Map<string, StoreMenu[]>(),
    storeProducts: new Map<string, {
        coffees: CoffeeBean[];
        bottledDrinks: BottledDrink[];
        dishes: Dish[];
        timestamp: number;
    }>(),
    lastProductFetch: 0,
    CACHE_DURATION: 5 * 60 * 1000, // 5 phút
    STORE_CACHE_DURATION: 2 * 60 * 1000, // 2 phút cho store-specific data
};

export class OptimizedStoreMenuService {
    
    // Preload tất cả products khi app khởi động
    static async preloadAllProducts(): Promise<void> {
        try {
            const [coffees, bottledDrinks, dishes] = await Promise.all([
                coffeeService.getAllCoffees(),
                bottledDrinkService.getAllBottledDrinks(),
                dishService.getAllDishes()
            ]);

            enhancedCache.products.coffees = coffees;
            enhancedCache.products.bottledDrinks = bottledDrinks;
            enhancedCache.products.dishes = dishes;
            enhancedCache.lastProductFetch = Date.now();

            console.log('Products preloaded successfully');
        } catch (error) {
            console.error('Error preloading products:', error);
        }
    }

    // Get products with optimistic loading
    private static async getProducts(): Promise<{
        coffees: CoffeeBean[];
        bottledDrinks: BottledDrink[];
        dishes: Dish[];
    }> {
        const now = Date.now();
        const shouldRefresh = now - enhancedCache.lastProductFetch > enhancedCache.CACHE_DURATION;

        // Nếu có cache và chưa hết hạn, return ngay
        if (!shouldRefresh && 
            enhancedCache.products.coffees && 
            enhancedCache.products.bottledDrinks && 
            enhancedCache.products.dishes) {
            return {
                coffees: enhancedCache.products.coffees,
                bottledDrinks: enhancedCache.products.bottledDrinks,
                dishes: enhancedCache.products.dishes
            };
        }

        // Nếu có cache cũ, return trước rồi refresh background
        if (enhancedCache.products.coffees && 
            enhancedCache.products.bottledDrinks && 
            enhancedCache.products.dishes) {
            
            // Return cached data ngay lập tức
            const cachedData = {
                coffees: enhancedCache.products.coffees,
                bottledDrinks: enhancedCache.products.bottledDrinks,
                dishes: enhancedCache.products.dishes
            };

            // Refresh in background
            this.preloadAllProducts();

            return cachedData;
        }

        // Không có cache, phải load fresh
        await this.preloadAllProducts();
        return {
            coffees: enhancedCache.products.coffees || [],
            bottledDrinks: enhancedCache.products.bottledDrinks || [],
            dishes: enhancedCache.products.dishes || []
        };
    }

    // Main method với optimizations
    static async getAllItemsForSelectedStore(): Promise<{
        coffees: CoffeeBean[];
        bottledDrinks: BottledDrink[];
        dishes: Dish[];
    }> {
        const storeId = SelectedStoreService.getSelectedStoreId();
        if (!storeId) {
            throw new Error('Chưa chọn cửa hàng');
        }

        const now = Date.now();
        
        // Check store-specific cache
        const storeCache = enhancedCache.storeProducts.get(storeId);
        if (storeCache && (now - storeCache.timestamp) < enhancedCache.STORE_CACHE_DURATION) {
            return {
                coffees: storeCache.coffees,
                bottledDrinks: storeCache.bottledDrinks,
                dishes: storeCache.dishes
            };
        }

        // Load menu và products song song
        const [menus, products] = await Promise.all([
            firebaseStoreMenuService.getActiveMenusByStoreId(storeId),
            this.getProducts()
        ]);

        // Collect IDs từ menu
        const coffeeIds = new Set<string>();
        const drinkIds = new Set<string>();
        const dishIds = new Set<string>();

        menus.forEach(menu => {
            menu.items?.forEach(item => {
                const id = item.originalId || item.productId;
                if (item.productType === 'coffee') {
                    coffeeIds.add(id);
                } else if (item.productType === 'bottledDrink') {
                    drinkIds.add(id);
                } else if (item.productType === 'dish') {
                    dishIds.add(id);
                }
            });
        });

        // Filter products trong memory
        const coffees = products.coffees.filter(coffee => coffee.id && coffeeIds.has(coffee.id));
        const bottledDrinks = products.bottledDrinks.filter(drink => drink.id && drinkIds.has(drink.id));
        const dishes = products.dishes.filter(dish => dish.id && dishIds.has(dish.id));

        const result = { coffees, bottledDrinks, dishes };

        // Cache store-specific results
        enhancedCache.storeProducts.set(storeId, {
            ...result,
            timestamp: now
        });

        // Preload images in background
        this.preloadImages(result);

        return result;
    }

    // Preload images để tăng tốc hiển thị
    private static preloadImages(data: {
        coffees: CoffeeBean[];
        bottledDrinks: BottledDrink[];
        dishes: Dish[];
    }): void {
        const imageUrls: string[] = [];

        // Collect image URLs
        data.coffees.forEach(coffee => {
            if (coffee.imageUrl) imageUrls.push(coffee.imageUrl);
        });
        
        data.bottledDrinks.forEach(drink => {
            if (drink.images && drink.images.length > 0) {
                imageUrls.push(...drink.images);
            }
        });
        
        data.dishes.forEach(dish => {
            if (dish.imageUrl) imageUrls.push(dish.imageUrl);
        });

        // Preload images in background
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    // Clear cache
    static clearCache(): void {
        enhancedCache.products.coffees = null;
        enhancedCache.products.bottledDrinks = null;
        enhancedCache.products.dishes = null;
        enhancedCache.storeMenus.clear();
        enhancedCache.storeProducts.clear();
        enhancedCache.lastProductFetch = 0;
    }

    // Clear specific store cache
    static clearStoreCache(storeId: string): void {
        enhancedCache.storeProducts.delete(storeId);
    }
} 