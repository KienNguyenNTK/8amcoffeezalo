import { db, storage } from './config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { BottledDrink } from '../types/bottledDrink';

const COLLECTION_NAME = 'bottledDrinks';

export const bottledDrinkService = {
    async addBottledDrink(drink: BottledDrink, imageFiles: File[]) {
        try {
            const imageUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    const storageRef = ref(storage, `bottled-drinks/${Date.now()}_${file.name}`);
                    const uploadResult = await uploadBytes(storageRef, file);
                    return getDownloadURL(uploadResult.ref);
                })
            );

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...drink,
                images: imageUrls,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { id: docRef.id, ...drink, images: imageUrls };
        } catch (error) {
            throw new Error('Không thể thêm đồ uống: ' + error);
        }
    },

    async updateBottledDrink(id: string, drink: Partial<BottledDrink>, newImageFiles?: File[]) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const currentDoc = await getDoc(docRef);

            if (!currentDoc.exists()) {
                throw new Error('Không tìm thấy đồ uống');
            }

            let updateData = {
                ...drink,
                updatedAt: new Date()
            };

            if (newImageFiles?.length) {
                // Delete old images
                const oldImageUrls = currentDoc.data().images || [];
                await Promise.all(
                    oldImageUrls.map(async (url: string) => {
                        const imageRef = ref(storage, url);
                        try {
                            await deleteObject(imageRef);
                        } catch (error) {
                            console.error('Error deleting old image:', error);
                        }
                    })
                );

                // Upload new images
                const newImageUrls = await Promise.all(
                    newImageFiles.map(async (file) => {
                        const storageRef = ref(storage, `bottled-drinks/${Date.now()}_${file.name}`);
                        const uploadResult = await uploadBytes(storageRef, file);
                        return getDownloadURL(uploadResult.ref);
                    })
                );

                updateData = {
                    ...updateData,
                    images: newImageUrls
                };
            }

            await updateDoc(docRef, updateData);
            return { id, ...updateData };
        } catch (error) {
            throw new Error('Không thể cập nhật đồ uống: ' + error);
        }
    },

    async deleteBottledDrink(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const imageUrls = docSnap.data().images || [];
                await Promise.all(
                    imageUrls.map(async (url: string) => {
                        const imageRef = ref(storage, url);
                        try {
                            await deleteObject(imageRef);
                        } catch (error) {
                            console.error('Error deleting image:', error);
                        }
                    })
                );
            }

            await deleteDoc(docRef);
        } catch (error) {
            throw new Error('Không thể xóa đồ uống: ' + error);
        }
    },

    async getAllBottledDrinks() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as BottledDrink[];
    },

    async getBottledDrinkById(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        return { id: docSnap.id, ...docSnap.data() } as BottledDrink;
    }
}; 