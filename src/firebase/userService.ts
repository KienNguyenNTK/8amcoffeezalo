import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { User } from '../types/user';
import { db } from './config';

const COLLECTION_NAME = 'users';

export const userService = {
  async createUser(user: User) {
    try {
      // Check if user already exists with this phone number
      const existingUser = await this.getUserByPhoneNumber(user.phoneNumber);
      
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
  }
}; 