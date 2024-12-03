import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './config';
import { AppConfig } from '../types/config';

const COLLECTION_NAME = 'app_configs';

export const configService = {
    async saveZaloTokens(accessToken: string, refreshToken: string, expiresIn: number) {
        try {
            // Get all configs first (we should only have one)
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const configs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

            const configData = {
                access_token_zalo: accessToken,
                refresh_token_zalo: refreshToken,
                token_expires_at: expiresAt,
                updatedAt: new Date()
            };

            if (configs.length > 0) {
                // Update existing config
                const configId = configs[0].id;
                await updateDoc(doc(db, COLLECTION_NAME, configId), configData);
                return { id: configId, ...configData };
            } else {
                // Create new config
                const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...configData,
                    createdAt: new Date()
                });
                return { id: docRef.id, ...configData };
            }
        } catch (error) {
            throw new Error('Could not save Zalo tokens: ' + error);
        }
    },

    async getConfig(): Promise<AppConfig | null> {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const configs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return configs.length > 0 ? configs[0] as AppConfig : null;
        } catch (error) {
            throw new Error('Could not get config: ' + error);
        }
    }
};