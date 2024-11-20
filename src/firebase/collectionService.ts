import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './config';
import { CoffeeCollection } from '../types/collection';

const COLLECTION_NAME = 'collections';

export const collectionService = {
    async getAllCollections() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CoffeeCollection[];
    },

    async getCollectionById(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CoffeeCollection;
        }
        return null;
    }
}; 