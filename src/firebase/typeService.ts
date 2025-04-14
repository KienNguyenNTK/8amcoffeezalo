import { db } from './config'; // Adjust the import based on your firebase setup
import { Type } from '../types/type';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = '8am-type';

/**
 * Service for managing dish types
 */
export class TypeService {
  async addType(type: Type): Promise<Type> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), type);
      return { id: docRef.id, ...type };
    } catch (error) {
      throw new Error('Cannot add type: ' + error);
    }
  }

  async getAllTypes(): Promise<Type[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Type[];
    } catch (error) {
      throw new Error('Cannot retrieve types: ' + error);
    }
  }

  async getTypeById(id: string): Promise<Type | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Type;
    }
    return null;
  }

  async updateType(id: string, type: Partial<Type>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, type);
    } catch (error) {
      throw new Error('Cannot update type: ' + error);
    }
  }

  async deleteType(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw new Error('Cannot delete type: ' + error);
    }
  }
  
  async getTypeByCode(code: string): Promise<Type | null> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('code', '==', code));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Type;
    } catch (error) {
      throw new Error('Cannot retrieve type by code: ' + error);
    }
  }
}

// Create a singleton instance
const typeService = new TypeService();
export default typeService; 