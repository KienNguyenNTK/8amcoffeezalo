import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';

export const infoAppService = {
    async getInfoAppData() {
        try {
            const querySnapshot = await getDocs(collection(db, 'info_app'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data;
        } catch (error) {
            console.error('Error fetching info_app data:', error);
            throw error;
        }
    }
}; 