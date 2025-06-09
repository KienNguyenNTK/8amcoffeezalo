import { storeMenuService as firebaseStoreMenuService } from '../firebase/storeMenuService';
import { coffeeService } from '../firebase/coffeeService';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { DishService } from '../firebase/dishService';
import { SelectedStoreService } from './selectedStoreService';
import type { StoreMenu, MenuItem } from '../types/store';
import type { CoffeeBean } from '../types/coffee';
import type { BottledDrink } from '../types/bottledDrink';
import type { Dish } from '../types/dish';

const dishService = new DishService();

// Cache cho products để tránh load lại
const productCache = {
    coffees: null as CoffeeBean[] | null,
    bottledDrinks: null as BottledDrink[] | null,
    dishes: null as Dish[] | null,
    lastFetch: 0,
    CACHE_DURATION: 5 * 60 * 1000 // 5 phút
};

export class StoreMenuService {
    
    // Lấy tất cả menu của cửa hàng đã chọn
    static async getActiveMenusForSelectedStore(): Promise<StoreMenu[]> {
        const storeId = SelectedStoreService.getSelectedStoreId();
        if (!storeId) {
            throw new Error('Chưa chọn cửa hàng');
        }
        
        return await firebaseStoreMenuService.getActiveMenusByStoreId(storeId);
    }

    // Lấy tất cả coffee của cửa hàng đã chọn
    static async getCoffeesForSelectedStore(): Promise<CoffeeBean[]> {
        const menus = await this.getActiveMenusForSelectedStore();
        const coffeeIds = new Set<string>();
        
        // Lấy tất cả coffeeId từ các menu
        menus.forEach(menu => {
            menu.items?.forEach(item => {
                if (item.productType === 'coffee') {
                    // Sử dụng originalId nếu có, không thì dùng productId
                    const id = item.originalId || item.productId;
                    coffeeIds.add(id);
                }
            });
        });

        if (coffeeIds.size === 0) {
            return [];
        }

        // Load tất cả coffee một lần và filter
        const allCoffees = await coffeeService.getAllCoffees();
        return allCoffees.filter(coffee => coffee.id && coffeeIds.has(coffee.id));
    }

    // Lấy tất cả bottled drinks của cửa hàng đã chọn
    static async getBottledDrinksForSelectedStore(): Promise<BottledDrink[]> {
        const menus = await this.getActiveMenusForSelectedStore();
        const drinkIds = new Set<string>();
        
        // Lấy tất cả drinkId từ các menu
        menus.forEach(menu => {
            menu.items?.forEach(item => {
                if (item.productType === 'bottledDrink') {
                    // Sử dụng originalId nếu có, không thì dùng productId
                    const id = item.originalId || item.productId;
                    drinkIds.add(id);
                }
            });
        });

        if (drinkIds.size === 0) {
            return [];
        }

        // Load tất cả bottled drinks một lần và filter
        const allDrinks = await bottledDrinkService.getAllBottledDrinks();
        return allDrinks.filter(drink => drink.id && drinkIds.has(drink.id));
    }

    // Lấy tất cả dishes của cửa hàng đã chọn
    static async getDishesForSelectedStore(): Promise<Dish[]> {
        const menus = await this.getActiveMenusForSelectedStore();
        const dishIds = new Set<string>();
        
        // Lấy tất cả dishId từ các menu
        menus.forEach(menu => {
            menu.items?.forEach(item => {
                if (item.productType === 'dish') {
                    // Sử dụng originalId nếu có, không thì dùng productId
                    const id = item.originalId || item.productId;
                    dishIds.add(id);
                }
            });
        });

        if (dishIds.size === 0) {
            return [];
        }

        // Load tất cả dishes một lần và filter
        const allDishes = await dishService.getAllDishes();
        return allDishes.filter(dish => dish.id && dishIds.has(dish.id));
    }

    // Lấy tất cả items của cửa hàng đã chọn (tổng hợp) - Version tối ưu
    static async getAllItemsForSelectedStore(): Promise<{
        coffees: CoffeeBean[];
        bottledDrinks: BottledDrink[];
        dishes: Dish[];
    }> {
        const storeId = SelectedStoreService.getSelectedStoreId();
        if (!storeId) {
            throw new Error('Chưa chọn cửa hàng');
        }

        // Kiểm tra cache
        const now = Date.now();
        const shouldRefreshCache = now - productCache.lastFetch > productCache.CACHE_DURATION;

        // Load menu và products (sử dụng cache nếu có)
        const menuPromise = firebaseStoreMenuService.getActiveMenusByStoreId(storeId);
        
        let allCoffees: CoffeeBean[];
        let allBottledDrinks: BottledDrink[];
        let allDishes: Dish[];
        let menus: StoreMenu[];

        if (shouldRefreshCache || !productCache.coffees || !productCache.bottledDrinks || !productCache.dishes) {
            // Load fresh data và cache lại
            const [freshMenus, freshCoffees, freshBottledDrinks, freshDishes] = await Promise.all([
                menuPromise,
                coffeeService.getAllCoffees(),
                bottledDrinkService.getAllBottledDrinks(),
                dishService.getAllDishes()
            ]);

            // Update cache
            productCache.coffees = freshCoffees;
            productCache.bottledDrinks = freshBottledDrinks;
            productCache.dishes = freshDishes;
            productCache.lastFetch = now;

            allCoffees = freshCoffees;
            allBottledDrinks = freshBottledDrinks;
            allDishes = freshDishes;
            menus = freshMenus;
        } else {
            // Sử dụng cache
            menus = await menuPromise;
            allCoffees = productCache.coffees;
            allBottledDrinks = productCache.bottledDrinks;
            allDishes = productCache.dishes;
        }

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
        const coffees = allCoffees.filter(coffee => coffee.id && coffeeIds.has(coffee.id));
        const bottledDrinks = allBottledDrinks.filter(drink => drink.id && drinkIds.has(drink.id));
        const dishes = allDishes.filter(dish => dish.id && dishIds.has(dish.id));

        return {
            coffees,
            bottledDrinks,
            dishes
        };
    }

    // Kiểm tra xem một item có trong menu của cửa hàng không
    static async isItemAvailableInStore(itemId: string, itemType: 'coffee' | 'bottledDrink' | 'dish'): Promise<boolean> {
        const menus = await this.getActiveMenusForSelectedStore();
        
        return menus.some(menu => 
            menu.items?.some(item => 
                item.productId === itemId && item.productType === itemType
            )
        );
    }

    // Lấy thông tin cửa hàng đã chọn
    static getSelectedStoreInfo() {
        return {
            store: SelectedStoreService.getSelectedStore(),
            storeId: SelectedStoreService.getSelectedStoreId(),
            storeName: SelectedStoreService.getSelectedStoreName()
        };
    }

    // Clear cache để force refresh data
    static clearCache() {
        productCache.coffees = null;
        productCache.bottledDrinks = null;
        productCache.dishes = null;
        productCache.lastFetch = 0;
    }
} 