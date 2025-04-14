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

const COLLECTION_NAME = 'cart';

export const cartService = {
    async addToCart(userId: string, item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            // Check if item already exists in cart
            if (item.type === 'coffee') {
                const qCoffee = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('coffeeId', '==', item.coffeeId),
                    where('weight', '==', item.weight),
                    where('grindType', '==', item.grindType),
                    where('grindSize', '==', item.grindSize)
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

                    return { id: existingItem.id, ...item, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...item,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                return { id: docRef.id, ...item };
            }

            if (item.type === 'drink') {
                const qBottledDrink = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('drinkId', '==', item.drinkId),
                    where('volume', '==', item.volume)
                );

                const querySnapshotBottledDrink = await getDocs(qBottledDrink);

                if (!querySnapshotBottledDrink.empty && item.drinkId) {
                    const existingItem = querySnapshotBottledDrink.docs[0];
                    const newQuantity = existingItem.data().quantity + item.quantity;

                    await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
                        quantity: newQuantity,
                        updatedAt: new Date()
                    });

                    return { id: existingItem.id, ...item, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...item,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                return { id: docRef.id, ...item };
            }

            if (item.type === 'dish') {
                const qDish = query(
                    collection(db, COLLECTION_NAME),
                    where('userId', '==', userId),
                    where('dishId', '==', item.dishId)
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

                    return { id: existingItem.id, ...item, quantity: newQuantity };
                }

                // Add new item
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...item,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                return { id: docRef.id, ...item };
            }
        } catch (error) {
            console.log('error', error);
            throw new Error('Could not add item to cart: ' + error);
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

    async updateCartItem(id: string, updates: Partial<CartItem>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date()
            });
            return { id, ...updates };
        } catch (error) {
            throw new Error('Could not update cart item: ' + error);
        }
    },

    async removeFromCart(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
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
            return true;
        } catch (error) {
            throw new Error('Could not clear cart: ' + error);
        }
    },

    async getCartItemCount(userId: string) {
        const items = await this.getCartItems(userId);
        return items.length;
    }
}; 