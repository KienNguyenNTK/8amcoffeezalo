import { db } from './config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import { Region } from '../types/region';

const COLLECTION_NAME = 'regions';

export const regionService = {
    async addRegion(region: Region) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...region,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...region };
        } catch (error) {
            throw new Error('Không thể thêm vùng trồng: ' + error);
        }
    },

    async getAllRegions() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Region[];
    },

    async updateRegion(id: string, region: Partial<Region>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...region,
                updatedAt: new Date()
            });
            return { id, ...region };
        } catch (error) {
            throw new Error('Không thể cập nhật vùng trồng: ' + error);
        }
    },

    async deleteRegion(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            throw new Error('Không thể xóa vùng trồng: ' + error);
        }
    }
}; 