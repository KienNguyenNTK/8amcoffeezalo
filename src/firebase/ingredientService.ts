
import { db } from './config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
} from 'firebase/firestore';
import { Ingredient } from '../types/ingredient';

const COLLECTION_NAME = 'ingredients';

export const ingredientService = {
    async addIngredient(name: string) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                name,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, name };
        } catch (error) {
            throw new Error('Không thể thêm thành phần: ' + error);
        }
    },

    async updateIngredient(id: string, ingredient: Partial<Ingredient>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...ingredient,
                updatedAt: new Date()
            });
            return { id, ...ingredient };
        } catch (error) {
            throw new Error('Không thể cập nhật thành phần: ' + error);
        }
    },

    async deleteIngredient(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            throw new Error('Không thể xóa thành phần: ' + error);
        }
    },

    async getAllIngredients() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Ingredient[];
    },

    async getIngredientById(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Ingredient;
        } else {
            throw new Error('Không tìm thấy thành phần');
        }
    }
};