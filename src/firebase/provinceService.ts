import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import provinces from '../dump/provinces.json';

const COLLECTION_NAME = 'provinces';

export const provinceService = {
    async addProvinces() {
        try {
            const batch: Promise<void>[] = [];
            for (const province of provinces) {
                const docRef = doc(collection(db, COLLECTION_NAME), province.code);
                batch.push(setDoc(docRef, province));
            }
            await Promise.all(batch);
            return true;
        } catch (error) {
            console.error('Error adding provinces:', error);
            throw error;
        }
    },

    async getAllProvinces() {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting provinces:', error);
            throw error;
        }
    }
}; 