import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import wards from '../dump/wards.json';

const COLLECTION_NAME = 'wards';

interface Ward {
    code: string;
    name: string;
    fullName: string;
    slug: string;
    type: string;
    provinceCode: string;
}

export const wardService = {
    async addWards() {
        try {
            const batch: Promise<void>[] = [];
            for (const ward of wards) {
                const docRef = doc(collection(db, COLLECTION_NAME), ward.code);
                batch.push(setDoc(docRef, ward));
            }
            await Promise.all(batch);
            return true;
        } catch (error) {
            console.error('Error adding wards:', error);
            throw error;
        }
    },

    async getAllWards() {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (Ward & { id: string })[];
        } catch (error) {
            console.error('Error getting wards:', error);
            throw error;
        }
    },

    async getWardsByProvince(provinceCode: string) {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(ward => {
                    const wardData = ward as unknown as Ward;
                    return wardData.provinceCode === provinceCode;
                }) as (Ward & { id: string })[];
        } catch (error) {
            console.error('Error getting wards by province:', error);
            throw error;
        }
    }
}; 