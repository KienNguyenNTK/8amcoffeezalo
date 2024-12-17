import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { Order } from '../types/order';
import { cartService } from './cartService';
import { db } from './config';

const COLLECTION_NAME = 'orders';

export const orderService = {
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Add order to Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...order,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update cart items status
      const cartItemIds = order.items.map(item => item.id);
      await Promise.all(
        cartItemIds.map(id =>
          cartService.updateCartItem(id, { isOrdered: true })
        )
      );

      return { id: docRef.id, ...order };
    } catch (error) {
      throw new Error('Could not create order: ' + error);
    }
  },

  async getOrdersByUser(userId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      throw new Error('Could not get orders: ' + error);
    }
  },

  async getAllOrders() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      throw new Error('Could not get orders: ' + error);
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw new Error('Could not update order status: ' + error);
    }
  },

  async getOrderById(orderId: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      return docSnap.data() as Order;
    } catch (error) {
      throw new Error('Could not get order: ' + error);
    }
  },

  async hasUserPurchased(userId: string, { coffeeId, drinkId }: { coffeeId?: string, drinkId?: string }) {
    try {

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      return orders.some(order =>
        // Check if order is not pending and completed
        order.status !== 'waiting' && order.status !== 'cancelled' &&
        // Check if any item in the order matches the coffee or drink ID
        order.items.some(item =>
          (coffeeId && item.coffeeId === coffeeId) ||
          (drinkId && item.drinkId === drinkId)
        )
      );
    } catch (error) {
      throw new Error('Could not check purchase history: ' + error);
    }
  },

  async deleteOrder(orderId: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, orderId));
      return true;
    } catch (error) {
      throw new Error('Could not delete order: ' + error);
    }
  }
};