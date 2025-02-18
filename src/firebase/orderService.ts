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
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { Order } from '../types/order';
import { cartService } from './cartService';
import { db } from './config';

const COLLECTION_NAME = 'orders';

async function generateOrderId() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const baseId = `${year}${month}${day}`;

  try {
    // Chỉ lấy các đơn hàng của ngày hôm nay
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('createdAt', '>=', todayStart),
      where('createdAt', '<=', todayEnd)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Nếu không có đơn hàng nào trong ngày, bắt đầu từ 0001
    if (querySnapshot.empty) {
      return `${baseId}0001`;
    }
    
    // Nếu có đơn hàng, tìm số sequence lớn nhất trong ngày
    let maxSequence = 0;
    querySnapshot.docs.forEach(doc => {
      const docId = doc.id;
      if (docId.startsWith(baseId)) {
        const sequence = parseInt(docId.slice(-4));
        maxSequence = Math.max(maxSequence, sequence);
      }
    });
    
    // Tăng thêm 1 từ số lớn nhất
    const nextSequence = String(maxSequence + 1).padStart(4, '0');
    return `${baseId}${nextSequence}`;
  } catch (error) {
    throw new Error('Could not generate order ID: ' + error);
  }
}

export const orderService = {
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const orderId = await generateOrderId();
      
      const docRef = doc(db, COLLECTION_NAME, orderId);
      await setDoc(docRef, {
        ...order,
        // status: 'waiting',
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

      return { id: orderId, ...order };
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