import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { User } from '../types/user';
import { db } from './config';
import { orderService } from './orderService';
import { favoriteService } from './favoriteService';
import { cartService } from './cartService';
import { reviewService } from './reviewService';

const COLLECTION_NAME = 'users';

export const userService = {
  async createUser(user: User) {
    try {
      // Check if user already exists with this phone number
      const existingUser = await this.getUserByLocalId(user.localId || '');

      if (existingUser) {
        console.log('User with this phone number already exists');
        return existingUser;
      }

      // If no existing user, create new user
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const newUser = { id: docRef.id, ...user };
      console.log('New user created:', newUser);
      return newUser;

    } catch (error) {
      console.error('Could not create user:', error);
      throw new Error('Could not create user: ' + error);
    }
  },

  async getUserByPhoneNumber(phoneNumber: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('phoneNumber', '==', phoneNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }

      return null;
    } catch (error) {
      console.error('Could not get user by phone number:', error);
      throw new Error('Could not get user: ' + error);
    }
  },

  async updateUser(id: string, userData: Partial<User>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...userData,
        updatedAt: new Date()
      });
      return { id, ...userData };
    } catch (error) {
      throw new Error('Could not update user: ' + error);
    }
  },

  //Thêm hàm cập nhật user theo localId
  async updateUserByLocalId(localId: string, userData: Partial<User>) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('localId', '==', localId)
      );
      const querySnapshot = await getDocs(q);
      const docRef = doc(db, COLLECTION_NAME, querySnapshot.docs[0].id);
      await updateDoc(docRef, { ...userData, updatedAt: new Date() });
      return { localId, ...userData };
    } catch (error) {
      throw new Error('Could not update user: ' + error);
    }
  },

  async updateUserZaloId(userId: string, zaloUserId: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(docRef, {
        zaloUserId: zaloUserId || '',
        updatedAt: new Date()
      });
      return { userId, zaloUserId };
    } catch (error) {
      throw new Error('Could not update user Zalo ID: ' + error);
    }
  },

  async deleteUser(userId: string) {
    try {
      // 1. Delete all user's orders
      const userOrders = await orderService.getAllOrders();
      const filteredOrders = userOrders.filter(order => order.userId === userId);
      await Promise.all(filteredOrders.map((order: any) => orderService.deleteOrder(order.id)));

      // 2. Delete all user's favorites
      const favorites = await favoriteService.getUserFavorites(userId);
      await Promise.all(favorites.map((fav: any) => favoriteService.deleteFavorite(fav.id)));

      // 3. Clear user's cart
      await cartService.clearCart(userId);

      // 4. Delete all user's reviews

      const review = await reviewService.getUserReviews(userId);
      await Promise.all(review.map(review => reviewService.deleteReview(review.id)));

      // 5. Finally delete the user document
      await deleteDoc(doc(db, COLLECTION_NAME, userId));

      return true;
    } catch (error) {
      console.error('Error deleting user and related data:', error);
      throw new Error('Could not delete user and related data: ' + error);
    }
  },

  // Lấy ra người dùng theo localId
  async getUserByLocalId(localId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('localId', '==', localId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user by localId:', error);
      throw error;
    }
  }
};