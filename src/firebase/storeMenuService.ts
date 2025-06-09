import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './config';
import type { StoreMenu, StoreMenuCreateInput, StoreMenuUpdateInput, Product } from '../types/store';

const COLLECTION_NAME = 'storeMenus';
const COLLECTION_NAME_COFFEE = 'coffees';
const COLLECTION_NAME_BOTTLED_DRINK = 'bottledDrinks';
const COLLECTION_NAME_DISH = '8am_dishes';

// Helper function để loại bỏ undefined values
const cleanData = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item));
    }
    
    if (typeof obj === 'object') {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value !== undefined) {
                cleaned[key] = cleanData(value);
            }
        });
        return cleaned;
    }
    
    return obj;
};

export const storeMenuService = {
    // Get all menus for a specific store
    getMenusByStoreId: async (storeId: string): Promise<StoreMenu[]> => {
        try {
            // Thử query với orderBy trước
            const q = query(
                collection(db, COLLECTION_NAME),
                where('storeId', '==', storeId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
            })) as StoreMenu[];
        } catch (error) {
            console.error('Error fetching store menus with orderBy:', error);
            
            // Nếu là lỗi do index, thử query đơn giản hơn
            if ((error as any)?.message?.includes('index') || (error as any)?.message?.includes('requires an index')) {
                try {
                    console.log('Trying simple query without orderBy...');
                    const simpleQuery = query(
                        collection(db, COLLECTION_NAME),
                        where('storeId', '==', storeId)
                    );
                    const simpleSnapshot = await getDocs(simpleQuery);
                    
                    const menus = simpleSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
                        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
                    })) as StoreMenu[];
                    
                    // Sort manually by createdAt
                    return menus.sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        return dateB.getTime() - dateA.getTime();
                    });
                } catch (simpleError) {
                    console.error('Error with simple query:', simpleError);
                    return [];
                }
            }
            
            throw new Error('Không thể tải danh sách menu');
        }
    },

    // Get active menus for a specific store
    getActiveMenusByStoreId: async (storeId: string): Promise<StoreMenu[]> => {
        try {
            const menus = await storeMenuService.getMenusByStoreId(storeId);
            return menus.filter(menu => menu.isActive);
        } catch (error) {
            console.error('Error fetching active store menus:', error);
            throw new Error('Không thể tải danh sách menu hoạt động');
        }
    },

    // Get menu by ID
    getMenuById: async (id: string): Promise<StoreMenu | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString(),
                    updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString(),
                } as StoreMenu;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching menu:', error);
            throw new Error('Không thể tải thông tin menu');
        }
    },

    // Create new menu
    createMenu: async (menuData: StoreMenuCreateInput): Promise<string> => {
        try {
            console.log('Creating menu with data:', menuData);
            
            const cleanedData = cleanData({
                ...menuData,
                items: menuData.items || [],
                isActive: menuData.isActive ?? true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            console.log('Cleaned data for Firestore:', cleanedData);
            
            const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanedData);
            
            console.log('Menu created successfully with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error creating menu:', error);
            console.error('Error details:', (error as any)?.message || 'Unknown error');
            throw new Error('Không thể tạo menu mới: ' + ((error as any)?.message || 'Unknown error'));
        }
    },

    // Update menu
    updateMenu: async (menuData: StoreMenuUpdateInput): Promise<void> => {
        try {
            const { id, ...updateData } = menuData;
            const docRef = doc(db, COLLECTION_NAME, id);
            
            const cleanedData = cleanData({
                ...updateData,
                updatedAt: serverTimestamp(),
            });
            
            await updateDoc(docRef, cleanedData);
        } catch (error) {
            console.error('Error updating menu:', error);
            throw new Error('Không thể cập nhật menu');
        }
    },

    // Delete menu
    deleteMenu: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting menu:', error);
            throw new Error('Không thể xóa menu');
        }
    },

    // Toggle menu active status
    toggleMenuStatus: async (id: string, isActive: boolean): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                isActive,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error toggling menu status:', error);
            throw new Error('Không thể thay đổi trạng thái menu');
        }
    },

    // Get all products for menu selection
    getAllProducts: async (): Promise<Product[]> => {
        try {
            const products: Product[] = [];

            // Get coffee products
            try {
                const coffeeQuery = query(collection(db, COLLECTION_NAME_COFFEE));
                const coffeeSnapshot = await getDocs(coffeeQuery);
                coffeeSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Coffee có nhiều weight và price khác nhau
                    if (data.weightAndPrice && Array.isArray(data.weightAndPrice)) {
                        data.weightAndPrice.forEach((wp: any, index: number) => {
                            products.push({
                                id: `${doc.id}_${wp.weight}g_${index}`,
                                name: `${data.name} - ${wp.weight}g`,
                                price: wp.price,
                                type: 'coffee',
                                originalId: doc.id,
                                originalName: data.name,
                                weight: wp.weight,
                                codeCoffee: data.codeCoffee
                            });
                        });
                    } else {
                        // Fallback cho coffee không có weightAndPrice
                        products.push({
                            id: doc.id,
                            name: data.name,
                            price: data.price || 0,
                            type: 'coffee',
                            originalId: doc.id,
                            originalName: data.name,
                            codeCoffee: data.codeCoffee
                        });
                    }
                });
            } catch (error) {
                console.log('No coffee collection found');
            }

            // Get bottled drink products
            try {
                const bottledDrinkQuery = query(collection(db, COLLECTION_NAME_BOTTLED_DRINK));
                const bottledDrinkSnapshot = await getDocs(bottledDrinkQuery);
                bottledDrinkSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Bottled drinks có nhiều volume và price khác nhau
                    if (data.volumes && Array.isArray(data.volumes)) {
                        data.volumes.forEach((vol: any, index: number) => {
                            products.push({
                                id: `${doc.id}_${vol.volume}ml_${index}`,
                                name: `${data.name} - ${vol.volume}ml`,
                                price: vol.price,
                                type: 'bottledDrink',
                                originalId: doc.id,
                                originalName: data.name,
                                volume: vol.volume,
                                productCode: data.productCode
                            });
                        });
                    } else {
                        // Fallback cho bottled drink không có volumes
                        products.push({
                            id: doc.id,
                            name: data.name,
                            price: data.price || 0,
                            type: 'bottledDrink',
                            originalId: doc.id,
                            originalName: data.name,
                            productCode: data.productCode
                        });
                    }
                });
            } catch (error) {
                console.log('No bottledDrink collection found');
            }

            // Get dish products
            try {
                const dishQuery = query(collection(db, COLLECTION_NAME_DISH));
                const dishSnapshot = await getDocs(dishQuery);
                dishSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    products.push({
                        id: doc.id,
                        name: data.name,
                        price: data.price,
                        type: 'dish',
                        originalId: doc.id,
                        originalName: data.name,
                        code: data.code,
                        unit: data.unit
                    });
                });
            } catch (error) {
                console.log('No dishes collection found');
            }

            // Sort products by type and name for better organization
            return products.sort((a, b) => {
                if (a.type !== b.type) {
                    const typeOrder = { 'coffee': 1, 'bottledDrink': 2, 'dish': 3 };
                    return typeOrder[a.type] - typeOrder[b.type];
                }
                return a.name.localeCompare(b.name, 'vi');
            });
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw new Error('Không thể tải danh sách sản phẩm');
        }
    },
}; 