import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Flavor } from '../types/flavor';
import { db } from './config';

const COLLECTION_NAME = 'flavors';

export const flavorService = {
    async addFlavor(flavor: Flavor) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...flavor,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...flavor };
        } catch (error) {
            throw new Error('Không thể thêm hương vị: ' + error);
        }
    },

    async getAllFlavors() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Flavor[];
    },

    async updateFlavor(id: string, flavor: Partial<Flavor>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...flavor,
                updatedAt: new Date()
            });
            return { id, ...flavor };
        } catch (error) {
            throw new Error('Không thể cập nhật hương vị: ' + error);
        }
    },

    async deleteFlavor(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            throw new Error('Không thể xóa hương vị: ' + error);
        }
    },

    async getFlavorImageByName(name: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('name', '==', name)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const flavor = doc.data();
                return flavor.iconUrl || null;
            }
            return null;
        } catch (error) {
            throw new Error('Không thể lấy ảnh hương vị: ' + error);
        }
    }

}; 