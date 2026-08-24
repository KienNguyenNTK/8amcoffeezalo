import { coffeeService } from '../firebase/coffeeService';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { DishService } from '../firebase/dishService';
import { CoffeeEquipmentService } from '../firebase/coffeeEquipmentService';
import { CoffeeBean } from '../types/coffee';
import { BottledDrink } from '../types/bottledDrink';
import { Dish } from '../types/dish';
import { CoffeeEquipment } from '../types/coffeeEquipment';

export interface CatalogEntry {
    product: any;
    type: 'coffee' | 'drink' | 'dish' | 'coffee_equipment';
}

export interface ProductCatalog {
    coffees: CoffeeBean[];
    drinks: BottledDrink[];
    dishes: Dish[];
    equipment: CoffeeEquipment[];
    productMap: Map<string, CatalogEntry>;
    timestamp: number;
}

const STORAGE_CACHE_KEY = '8am_catalog_cache_v1';

class ProductCatalogService {
    private catalog: ProductCatalog | null = null;
    private fetchPromise: Promise<ProductCatalog> | null = null;
    private readonly CACHE_TTL_MS = 60000; // 60 seconds TTL

    private dishService = new DishService();
    private coffeeEquipmentService = new CoffeeEquipmentService();

    constructor() {
        // Hydrate từ localStorage khi khởi tạo để sẵn sàng phục vụ 0ms
        this.hydrateFromStorage();
    }

    private hydrateFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.coffees)) {
                    const productMap = new Map<string, CatalogEntry>();
                    (parsed.coffees || []).forEach((c: any) => c?.id && productMap.set(c.id, { product: c, type: 'coffee' }));
                    (parsed.drinks || []).forEach((d: any) => (d?.id || d?._id) && productMap.set(d.id || d._id, { product: d, type: 'drink' }));
                    (parsed.dishes || []).forEach((d: any) => d?.id && productMap.set(d.id, { product: d, type: 'dish' }));
                    (parsed.equipment || []).forEach((e: any) => (e?.id || e?._id) && productMap.set(e.id || e._id, { product: e, type: 'coffee_equipment' }));

                    this.catalog = {
                        coffees: parsed.coffees,
                        drinks: parsed.drinks,
                        dishes: parsed.dishes,
                        equipment: parsed.equipment,
                        productMap,
                        timestamp: parsed.timestamp || 0
                    };
                }
            }
        } catch (e) {
            console.warn('Failed to hydrate catalog cache from storage:', e);
        }
    }

    private saveToStorage(catalog: ProductCatalog) {
        try {
            const dataToSave = {
                coffees: catalog.coffees,
                drinks: catalog.drinks,
                dishes: catalog.dishes,
                equipment: catalog.equipment,
                timestamp: catalog.timestamp
            };
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            console.warn('Failed to save catalog cache to storage:', e);
        }
    }

    /**
     * Lấy toàn bộ danh mục 4 nhóm sản phẩm (có cache in-memory & persistence storage)
     */
    async getCatalog(force = false): Promise<ProductCatalog> {
        const now = Date.now();
        if (!force && this.catalog && (now - this.catalog.timestamp < this.CACHE_TTL_MS)) {
            return this.catalog;
        }

        if (this.fetchPromise) {
            return this.fetchPromise;
        }

        this.fetchPromise = (async () => {
            try {
                const [coffees, drinks, dishes, equipment] = await Promise.all([
                    coffeeService.getAllCoffees().catch(() => [] as CoffeeBean[]),
                    bottledDrinkService.getAllBottledDrinks().catch(() => [] as BottledDrink[]),
                    this.dishService.getAllDishes().catch(() => [] as Dish[]),
                    this.coffeeEquipmentService.getAllEquipment().catch(() => [] as CoffeeEquipment[]),
                ]);

                const productMap = new Map<string, CatalogEntry>();

                (coffees || []).forEach(c => {
                    if (c && c.id) {
                        productMap.set(c.id, { product: c, type: 'coffee' });
                    }
                });

                (drinks || []).forEach(d => {
                    if (d && (d as any).id) {
                        productMap.set((d as any).id, { product: d, type: 'drink' });
                    }
                });

                (dishes || []).forEach(d => {
                    if (d && d.id) {
                        productMap.set(d.id, { product: d, type: 'dish' });
                    }
                });

                (equipment || []).forEach(e => {
                    if (e && (e as any).id) {
                        productMap.set((e as any).id, { product: e, type: 'coffee_equipment' });
                    }
                });

                const catalogData: ProductCatalog = {
                    coffees: coffees || [],
                    drinks: drinks || [],
                    dishes: dishes || [],
                    equipment: equipment || [],
                    productMap,
                    timestamp: Date.now()
                };

                this.catalog = catalogData;
                this.saveToStorage(catalogData);
                return catalogData;
            } finally {
                this.fetchPromise = null;
            }
        })();

        return this.fetchPromise;
    }

    /**
     * Lấy Map tra cứu sản phẩm O(1) theo ID
     */
    async getProductMap(force = false): Promise<Map<string, CatalogEntry>> {
        const catalog = await this.getCatalog(force);
        return catalog.productMap;
    }

    /**
     * Tra cứu một sản phẩm theo ID từ cache
     */
    async getProductById(id: string): Promise<CatalogEntry | null> {
        if (!id) return null;
        const map = await this.getProductMap();
        return map.get(id) || null;
    }

    /**
     * Helper chuẩn hóa URL ảnh cho mọi loại sản phẩm (hỗ trợ size optimize)
     */
    getProductImageUrl(item: any, size: 'thumb' | 'medium' | 'full' = 'medium'): string {
        if (!item) return '';

        // 1. Google Drive storage images với size optimize
        if (item.driveImages && Array.isArray(item.driveImages) && item.driveImages.length > 0 && item.driveImages[0]?.fileId) {
            const fileId = item.driveImages[0].fileId;
            let sizeParam = '';
            if (size === 'thumb') sizeParam = '=w360-h360-c-nu';
            else if (size === 'medium') sizeParam = '=w600-nu';
            return `https://lh3.googleusercontent.com/d/${fileId}${sizeParam}?authuser=server`;
        }

        // 2. Mảng images
        if (item.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
            return item.images[0];
        }

        // 3. Thông tin chi tiết dụng cụ
        if (item.type === 'coffee_equipment' && item.detailedInfo?.images && Array.isArray(item.detailedInfo.images) && item.detailedInfo.images.length > 0) {
            return item.detailedInfo.images[0];
        }

        // 4. Thuộc tính imageUrl hoặc image
        if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
            return item.imageUrl;
        }

        if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
            return item.image;
        }

        return '';
    }

    /**
     * Helper lấy tên chuẩn cho sản phẩm
     */
    getProductName(item: any): string {
        if (!item) return '';

        if (item.type === 'coffee_equipment') {
            if (item.values && Array.isArray(item.values)) {
                const nameField = item.values.find((v: any) =>
                    v.name && (v.name.toLowerCase().includes('tên') || v.name.toLowerCase().includes('name'))
                );
                if (nameField?.value) {
                    return nameField.value;
                }
            }
            if (item.name) return item.name;
            if (item.category) return item.category;
            return 'Dụng cụ cà phê';
        }

        return item.name || item.title || 'Sản phẩm';
    }

    /**
     * Helper lấy giá và định dạng hiển thị
     */
    getProductPrice(item: any): { price: number; prefix: string; formatted: string } | null {
        if (!item) return null;

        if (item.type === 'coffee') {
            if (item.priceRange?.minPrice) {
                return {
                    price: item.priceRange.minPrice,
                    prefix: 'Từ ',
                    formatted: `Từ ${item.priceRange.minPrice.toLocaleString()}đ`
                };
            }
            if (item.variants && item.variants.length > 0) {
                const minPrice = Math.min(...item.variants.map((v: any) => v.price || 0));
                return {
                    price: minPrice,
                    prefix: 'Từ ',
                    formatted: `Từ ${minPrice.toLocaleString()}đ`
                };
            }
            if (item.price) {
                return {
                    price: item.price,
                    prefix: '',
                    formatted: `${item.price.toLocaleString()}đ`
                };
            }
            return null;
        }

        if (item.type === 'coffee_equipment') {
            if (item.values && Array.isArray(item.values)) {
                const priceField = item.values.find((v: any) =>
                    v.name && (v.name.toLowerCase().includes('giá') || v.name.toLowerCase().includes('price'))
                );
                if (priceField?.value) {
                    const cleanPrice = String(priceField.value).replace(/[^\d]/g, '');
                    const parsedPrice = parseInt(cleanPrice, 10);
                    if (!isNaN(parsedPrice)) {
                        return {
                            price: parsedPrice,
                            prefix: '',
                            formatted: `${parsedPrice.toLocaleString()}đ`
                        };
                    }
                }
            }
            if (item.price) {
                return {
                    price: item.price,
                    prefix: '',
                    formatted: `${item.price.toLocaleString()}đ`
                };
            }
            return null;
        }

        if (item.price !== undefined && item.price !== null) {
            return {
                price: item.price,
                prefix: '',
                formatted: `${item.price.toLocaleString()}đ`
            };
        }

        return null;
    }

    /**
     * Xóa cache để ép tải lại danh mục mới nhất khi cần
     */
    clearCache() {
        this.catalog = null;
        this.fetchPromise = null;
        try {
            localStorage.removeItem(STORAGE_CACHE_KEY);
        } catch (e) {}
    }
}

export const productCatalogService = new ProductCatalogService();
