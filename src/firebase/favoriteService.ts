import { db } from './config';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { Favorite } from '../types/favorite';

const COLLECTION_NAME = 'favorites';

export const favoriteService = {
  async addFavorite(userId: string, coffeeId: string) {
    try {
      // Check if already favorited
      const existing = await this.getFavorite(userId, coffeeId);
      if (existing) {
        return true;
      }

      const favorite: Favorite = {
        userId,
        coffeeId,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), favorite);
      return { id: docRef.id, ...favorite };
    } catch (error) {
      throw new Error('Could not add favorite: ' + error);
    }
  },

  async removeFavorite(userId: string, coffeeId: string) {
    try {
      const favorite = await this.getFavorite(userId, coffeeId);
      if (favorite?.id) {
        await deleteDoc(doc(db, COLLECTION_NAME, favorite.id));
        return true;
      }
      return false;
    } catch (error) {
      throw new Error('Could not remove favorite: ' + error);
    }
  },

  async getFavorite(userId: string, coffeeId: string) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('coffeeId', '==', coffeeId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Favorite;
    }
    return null;
  },

  async getUserFavorites(userId: string) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Favorite[];
  },

  async getAllFavorites(userId: string) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Favorite[];
  },

  async getCoffeeLikesCount(coffeeId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('coffeeId', '==', coffeeId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }
  }
}; 