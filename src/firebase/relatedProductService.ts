import { RelatedProduct } from '../types/message';
import { coffeeService } from './coffeeService';
import { bottledDrinkService } from './bottledDrinkService';
import { DishService } from './dishService';
import { BrewerService } from './brewerService';
import { GrinderService } from './grinderService';

const dishService = new DishService();
const brewerService = new BrewerService();
const grinderService = new GrinderService();

export const relatedProductService = {
    /**
     * Lấy tất cả sản phẩm từ các collection khác nhau
     */
    async getAllProducts(): Promise<RelatedProduct[]> {
        const products: RelatedProduct[] = [];

        try {
            // Lấy cà phê
            try {
                const coffees = await coffeeService.getAllCoffees();
                coffees.forEach(coffee => {
                    // Coffee có nhiều weight và price khác nhau
                    if (coffee.weightAndPrice && Array.isArray(coffee.weightAndPrice)) {
                        coffee.weightAndPrice.forEach((wp, index) => {
                            products.push({
                                id: `coffee_${coffee.id}_${wp.weight}g_${index}`,
                                name: `${coffee.name} - ${wp.weight}g`,
                                type: 'coffee',
                                price: wp.price,
                                originalId: coffee.id
                            });
                        });
                    } else {
                        // Fallback cho coffee không có weightAndPrice
                        products.push({
                            id: `coffee_${coffee.id}`,
                            name: coffee.name,
                            type: 'coffee',
                            price: 0,
                            originalId: coffee.id
                        });
                    }
                });
            } catch (error) {
                console.warn('Error loading coffees:', error);
            }

            // Lấy đồ uống đóng chai
            try {
                const bottledDrinks = await bottledDrinkService.getAllBottledDrinks();
                bottledDrinks.forEach(drink => {
                    // Bottled drink có nhiều volume và price khác nhau
                    if (drink.volumes && Array.isArray(drink.volumes)) {
                        drink.volumes.forEach((vol, index) => {
                            products.push({
                                id: `bottled_drink_${drink.id}_${vol.volume}ml_${index}`,
                                name: `${drink.name} - ${vol.volume}ml`,
                                type: 'bottled_drink',
                                price: vol.price,
                                originalId: drink.id
                            });
                        });
                    } else {
                        // Fallback cho drink không có volumes
                        products.push({
                            id: `bottled_drink_${drink.id}`,
                            name: drink.name,
                            type: 'bottled_drink',
                            price: 0,
                            originalId: drink.id
                        });
                    }
                });
            } catch (error) {
                console.warn('Error loading bottled drinks:', error);
            }

            // Lấy món ăn
            try {
                const dishes = await dishService.getAllDishes();
                dishes.forEach(dish => {
                    products.push({
                        id: `dish_${dish.id}`,
                        name: dish.name,
                        type: 'dish',
                        price: dish.price,
                        originalId: dish.id
                    });
                });
            } catch (error) {
                console.warn('Error loading dishes:', error);
            }

            // Lấy máy pha
            try {
                const brewers = await brewerService.getAll();
                brewers.forEach(brewer => {
                    products.push({
                        id: `brewer_${brewer.id}`,
                        name: brewer.product_name,
                        type: 'brewer',
                        price: brewer.price,
                        originalId: brewer.id
                    });
                });
            } catch (error) {
                console.warn('Error loading brewers:', error);
            }

            // Lấy máy xay
            try {
                const grinders = await grinderService.getAll();
                grinders.forEach(grinder => {
                    products.push({
                        id: `grinder_${grinder.id}`,
                        name: grinder.product_name,
                        type: 'grinder',
                        price: grinder.price,
                        originalId: grinder.id
                    });
                });
            } catch (error) {
                console.warn('Error loading grinders:', error);
            }

        } catch (error) {
            console.error('Error loading all products:', error);
            throw new Error('Không thể tải danh sách sản phẩm: ' + error);
        }

        // Sắp xếp theo loại sản phẩm và tên
        return products.sort((a, b) => {
            if (a.type !== b.type) {
                const typeOrder = ['coffee', 'bottled_drink', 'dish', 'brewer', 'grinder'];
                return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
            }
            return a.name.localeCompare(b.name);
        });
    },

    /**
     * Lấy sản phẩm theo loại
     */
    async getProductsByType(type: RelatedProduct['type']): Promise<RelatedProduct[]> {
        const allProducts = await this.getAllProducts();
        return allProducts.filter(product => product.type === type);
    },

    /**
     * Tìm kiếm sản phẩm theo tên
     */
    async searchProducts(query: string): Promise<RelatedProduct[]> {
        const allProducts = await this.getAllProducts();
        const normalizedQuery = query.toLowerCase().trim();
        
        return allProducts.filter(product => 
            product.name.toLowerCase().includes(normalizedQuery)
        );
    }
};
