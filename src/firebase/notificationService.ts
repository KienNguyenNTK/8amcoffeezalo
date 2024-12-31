import { db } from './config';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    orderBy,
    Timestamp,
    deleteDoc,
} from 'firebase/firestore';
import { Notification } from '../types/notification';

export type { Notification };

const COLLECTION_NAME = 'notifications';

export const notificationService = {
    async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...notification,
                isRead: false,
                createdAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    async getUserNotifications(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    },

    async markAsRead(notificationId: string) {
        try {
            const notificationRef = doc(db, COLLECTION_NAME, notificationId);
            await updateDoc(notificationRef, {
                isRead: true
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    async getUnreadCount(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                where('isRead', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    },

    async deleteNotification(notificationId: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, notificationId));
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}; 