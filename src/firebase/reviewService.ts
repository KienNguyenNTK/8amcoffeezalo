import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './config';
import { Review } from '../types/review';

const COLLECTION_NAME = 'reviews';

export const reviewService = {
    // Thêm review mới
    async addReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...review,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { id: docRef.id, ...review };
        } catch (error) {
            throw error;
        }
    },

    // Lấy review theo ID
    async getReviewById(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Review;
        }
        return null;
    },

    // Lấy review theo orderItemId
    async getReviewByOrderItem(orderItemId: string) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('orderItemId', '==', orderItemId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Review;
        }
        return null;
    },

    // Lấy tất cả review của một coffee
    async getReviewsByCoffeeId(coffeeId: string) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('coffeeId', '==', coffeeId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Review[];
    },

    // Lấy tất cả review của một drink
    async getReviewsByDrinkId(drinkId: string) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('drinkId', '==', drinkId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Review[];
    },

    // Lấy tất cả review của một dish
    async getReviewsByDishId(dishId: string) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('dishId', '==', dishId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Review[];
    },

    // Cập nhật review
    async updateReview(id: string, review: Partial<Review>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...review,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Xóa review
    async deleteReview(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Tính trung bình rating cho coffee
    async getAverageRatingForCoffee(coffeeId: string) {
        const reviews = await this.getReviewsByCoffeeId(coffeeId);
        if (reviews.length === 0) return 0;

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    },

    // Tính trung bình rating cho drink
    async getAverageRatingForDrink(drinkId: string) {
        const reviews = await this.getReviewsByDrinkId(drinkId);
        if (reviews.length === 0) return 0;

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    },

    // Tính trung bình rating cho dish
    async getAverageRatingForDish(dishId: string) {
        const reviews = await this.getReviewsByDishId(dishId);
        if (reviews.length === 0) return 0;

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    },

    // Lấy tất cả review của một item
    async getItemReviews(itemId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('itemId', '==', itemId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error('Could not get reviews: ' + error);
        }
    },

    // Lấy tất cả review của một user
    async getUserReviews(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('user.id', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error('Could not get reviews: ' + error);
        }
    }
};