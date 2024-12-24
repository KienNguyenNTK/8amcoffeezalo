import { db } from './config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { HomeItem } from '../types/home';

const COLLECTION_NAME = 'homeManagement';

export const homeService = {
    async getAllHomeItems() {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as HomeItem[];
        } catch (error) {
            throw new Error('Không thể lấy danh sách items: ' + error);
        }
    },

    async addHomeItem(item: Omit<HomeItem, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...item,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...item };
        } catch (error) {
            throw new Error('Không thể thêm item: ' + error);
        }
    },

    async updateHomeItem(id: string, updates: Partial<HomeItem>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date()
            });
            return { id, ...updates };
        } catch (error) {
            throw new Error('Không thể cập nhật item: ' + error);
        }
    },

    async deleteHomeItem(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            throw new Error('Không thể xóa item: ' + error);
        }
    },

    async updateItemsOrder(items: HomeItem[]) {
        const batch = writeBatch(db);
        
        items.forEach((item, index) => {
            const docRef = doc(db, COLLECTION_NAME, item.id);
            batch.update(docRef, { 
                order: index,
                updatedAt: new Date()
            });
        });

        try {
            await batch.commit();
        } catch (error) {
            throw new Error('Không thể cập nhật thứ tự: ' + error);
        }
    }
};