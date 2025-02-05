import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { OpeningHours, ClosingHours } from '../types/businessHours';
import { db } from './config';

const OPENING_HOURS_COLLECTION = 'openingHours';
const CLOSING_HOURS_COLLECTION = 'closingHours';
const DEFAULT_DOC_ID = 'default';

export const businessHoursService = {
    async getOpeningHours(): Promise<OpeningHours | null> {
        try {
            const docRef = doc(db, OPENING_HOURS_COLLECTION, DEFAULT_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create default document if it doesn't exist
                const defaultOpeningHours: OpeningHours = {
                    id: DEFAULT_DOC_ID,
                    openTime: '07:00',
                    closeTime: '22:00'
                };
                await setDoc(docRef, {
                    ...defaultOpeningHours,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                return defaultOpeningHours;
            }

            return {
                id: docSnap.id,
                ...docSnap.data()
            } as OpeningHours;
        } catch (error) {
            throw new Error('Không thể lấy giờ mở cửa: ' + error);
        }
    },

    async updateOpeningHours(openingHours: OpeningHours): Promise<void> {
        try {
            const docRef = doc(db, OPENING_HOURS_COLLECTION, DEFAULT_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create new document
                await setDoc(docRef, {
                    ...openingHours,
                    id: DEFAULT_DOC_ID,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                // Update existing document
                await updateDoc(docRef, {
                    ...openingHours,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            throw new Error('Không thể cập nhật giờ mở cửa: ' + error);
        }
    },

    async getClosingHours(): Promise<ClosingHours | null> {
        try {
            const docRef = doc(db, CLOSING_HOURS_COLLECTION, DEFAULT_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create default document if it doesn't exist
                const defaultClosingHours: ClosingHours = {
                    id: DEFAULT_DOC_ID,
                    closingTimes: []
                };
                await setDoc(docRef, {
                    ...defaultClosingHours,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                return defaultClosingHours;
            }

            return {
                id: docSnap.id,
                ...docSnap.data()
            } as ClosingHours;
        } catch (error) {
            throw new Error('Không thể lấy giờ đóng cửa: ' + error);
        }
    },

    async updateClosingHours(closingHours: ClosingHours): Promise<void> {
        try {
            const docRef = doc(db, CLOSING_HOURS_COLLECTION, DEFAULT_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create new document
                await setDoc(docRef, {
                    ...closingHours,
                    id: DEFAULT_DOC_ID,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                // Update existing document
                await updateDoc(docRef, {
                    ...closingHours,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            throw new Error('Không thể cập nhật giờ đóng cửa: ' + error);
        }
    }
}; 