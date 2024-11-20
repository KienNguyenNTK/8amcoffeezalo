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
import { Region } from '../types/region';
import { db } from './config';

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
    },

    async getRegionImageByName(name: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('name', '==', name)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const region = doc.data();
                return region.imageUrl || null;
            }
            return null;
        } catch (error) {
            throw new Error('Không thể lấy ảnh vùng trồng: ' + error);
        }
    }
}; 