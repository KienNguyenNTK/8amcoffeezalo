import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { CartItem } from '../types/cart';
import { db } from './config';
import { SelectedStoreService } from '../services/selectedStoreService';

const COLLECTION_NAME = 'cart';

// Helper function to trigger cart update events
const triggerCartUpdate = () => {
    if (typeof window !== 'undefined') {
        console.log('[cartService] Dispatching cartUpdated event');
        // Use setTimeout to ensure event is dispatched after current execution stack
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        }, 0);
    }
};

export const cartService = {
    async addToCart(userId: string, item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            // Lấy storeId hiện tại và thêm vào item
            const currentStoreId = SelectedStoreService.getSelectedStoreId();
            const itemWithStore = {
                ...item,
                storeId: currentStoreId
            };

            // Check if item already exists in cart
            if (item.type === 'coffee') {
                const qCoffee = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('coffeeId', '==', item.coffeeId),
                    where('weight', '==', item.weight),
                    where('grindType', '==', item.grindType),
                    where('grindSize', '==', item.grindSize),
                    where('storeId', '==', currentStoreId)
                );

                const querySnapshotCoffee = await getDocs(qCoffee);

                if (!querySnapshotCoffee.empty && item.coffeeId) {
                    // Update existing item quantity
                    const existingItem = querySnapshotCoffee.docs[0];
                    const newQuantity = existingItem.data().quantity + item.quantity;

                    await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
                        quantity: newQuantity,
                        updatedAt: new Date()
                    });

                    triggerCartUpdate();
                    return { id: existingItem.id, ...itemWithStore, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...itemWithStore,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                triggerCartUpdate();
                return { id: docRef.id, ...itemWithStore };
            }

            if (item.type === 'drink') {
                const qBottledDrink = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('drinkId', '==', item.drinkId),
                    where('volume', '==', item.volume),
                    where('storeId', '==', currentStoreId)
                );

                const querySnapshotBottledDrink = await getDocs(qBottledDrink);

                if (!querySnapshotBottledDrink.empty && item.drinkId) {
                    const existingItem = querySnapshotBottledDrink.docs[0];
                    const newQuantity = existingItem.data().quantity + item.quantity;

                    await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
                        quantity: newQuantity,
                        updatedAt: new Date()
                    });

                    triggerCartUpdate();
                    return { id: existingItem.id, ...itemWithStore, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...itemWithStore,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                triggerCartUpdate();
                return { id: docRef.id, ...itemWithStore };
            }

            if (item.type === 'dish') {
                const qDish = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('dishId', '==', item.dishId),
                    where('storeId', '==', currentStoreId)
                );

                const querySnapshotDish = await getDocs(qDish);

                // For dishes, we'll consider items with the same customizations as the same item
                const existingItem = querySnapshotDish.docs.find(doc => {
                    const data = doc.data();
                    if (!data.customizations || !item.customizations) return false;
                    
                    // Compare customizations
                    const currentCustomizations = JSON.stringify(item.customizations);
                    const existingCustomizations = JSON.stringify(data.customizations);
                    return currentCustomizations === existingCustomizations;
                });

                if (existingItem) {
                    const newQuantity = existingItem.data().quantity + item.quantity;

                    await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
                        quantity: newQuantity,
                        updatedAt: new Date()
                    });

                    triggerCartUpdate();
                    return { id: existingItem.id, ...itemWithStore, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...itemWithStore,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                triggerCartUpdate();
                return { id: docRef.id, ...itemWithStore };
            }

            if (item.type === 'coffee_equipment') {
                const qEquipment = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('coffeeEquipmentId', '==', item.coffeeEquipmentId),
                    where('storeId', '==', currentStoreId)
                );

                const querySnapshotEquipment = await getDocs(qEquipment);

                if (!querySnapshotEquipment.empty && item.coffeeEquipmentId) {
                    // Update existing item quantity
                    const existingItem = querySnapshotEquipment.docs[0];
                    const newQuantity = existingItem.data().quantity + (item.quantity || 1);

                    await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
                        quantity: newQuantity,
                        updatedAt: new Date()
                    });

                    triggerCartUpdate();
                    return { id: existingItem.id, ...itemWithStore, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...itemWithStore,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                triggerCartUpdate();
                return { id: docRef.id, ...itemWithStore };
            }

            // Default case: add new item without specific type handling
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...itemWithStore,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            triggerCartUpdate();
            return { id: docRef.id, ...itemWithStore };
        } catch (error) {
            console.log('error', error);
            throw new Error('Could not add item to cart: ' + error);
        }
    },

    async addToCartLegacy(userId: string, item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) {
        // Legacy method that returns null on error
        try {
            return await this.addToCart(userId, item);
        } catch (error) {
            console.error('Error adding to cart:', error);
            return null;
        }
    },

    async getCartItems(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CartItem[];
        } catch (error) {
            throw new Error('Could not get cart items: ' + error);
        }
    },

    // Lấy cart items cho cửa hàng hiện tại
    async getCartItemsForCurrentStore(userId: string) {
        try {
            const currentStoreId = SelectedStoreService.getSelectedStoreId();
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                where('storeId', '==', currentStoreId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CartItem[];
        } catch (error) {
            throw new Error('Could not get cart items for current store: ' + error);
        }
    },

    // Lấy tất cả cart items (bao gồm từ các cửa hàng khác)
    async getAllCartItems(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CartItem[];
        } catch (error) {
            throw new Error('Could not get all cart items: ' + error);
        }
    },

    async updateCartItem(id: string, updates: Partial<CartItem>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date()
            });
            triggerCartUpdate();
            return { id, ...updates };
        } catch (error) {
            throw new Error('Could not update cart item: ' + error);
        }
    },

    async removeFromCart(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            triggerCartUpdate();
            return true;
        } catch (error) {
            throw new Error('Could not remove item from cart: ' + error);
        }
    },

    async clearCart(userId: string) {
        try {
            const items = await this.getCartItems(userId);
            const deletePromises = items.map(item => this.removeFromCart(item.id));
            await Promise.all(deletePromises);
            triggerCartUpdate();
            return true;
        } catch (error) {
            throw new Error('Could not clear cart: ' + error);
        }
    },

    async getCartItemCount(userId: string) {
        try {
            const currentStoreId = SelectedStoreService.getSelectedStoreId();
            if (!currentStoreId) {
                console.log('[cartService] No store selected, returning 0');
                return 0;
            }
            
            const items = await this.getCartItemsForCurrentStore(userId);
            // Tính tổng số lượng sản phẩm (quantity) thay vì chỉ đếm số items
            const totalQuantity = items.reduce((total, item) => total + (item.quantity || 1), 0);
            console.log(`[cartService] Cart items for user ${userId}: ${items.length} items, total quantity: ${totalQuantity}`);
            return totalQuantity;
        } catch (error) {
            console.error('Error getting cart item count:', error);
            return 0;
        }
    }
}; 