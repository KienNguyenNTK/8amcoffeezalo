import { addDoc, collection, doc, getDoc, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { AppConfig } from '../types/config';
import axios from 'axios';

const COLLECTION_NAME = 'app_configs';
const ZALO_APP_ID = '2448144731783137375';
const ZALO_SECRET_KEY = 'g8RUo6XKj3V7RoSuEom1';

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

            console.log('configs', configs);

            if (configs.length === 0) {
                return null;
            }

            const config = configs[0] as AppConfig;
            const now = new Date();
            const updatedAt = config.updatedAt ? (config.updatedAt as any).toDate?.() || config.updatedAt : null;

            if (!updatedAt) {
                throw new Error('Invalid updatedAt timestamp');
            }

            // Check if token needs refresh (after 20 hours)
            const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate >= 20) {
                console.log('Access token expired, refreshing...');
                try {
                    const response = await axios.post(
                        'https://oauth.zaloapp.com/v4/oa/access_token',
                        {
                            app_id: ZALO_APP_ID,
                            grant_type: 'refresh_token',
                            refresh_token: config.refresh_token_zalo
                        },
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'secret_key': ZALO_SECRET_KEY
                            }
                        }
                    );

                    // Save new tokens
                    await this.saveZaloTokens(
                        response.data.access_token,
                        response.data.refresh_token,
                        response.data.expires_in
                    );

                    // Get updated config
                    return await this.getConfig();
                } catch (error) {
                    console.error('Error refreshing Zalo token:', error);
                    throw new Error('Failed to refresh Zalo token');
                }
            }

            return config;
        } catch (error) {
            throw new Error('Could not get config: ' + error);
        }
    },

    async sendZaloMessage(userId: string, message: string) {
        try {
            const config = await this.getConfig(); // This will automatically refresh token if needed
            if (!config?.access_token_zalo) {
                throw new Error('No valid access token found');
            }

            const response = await axios.post(
                'https://openapi.zalo.me/v3.0/oa/message/cs',
                {
                    recipient: {
                        user_id: userId
                    },
                    message: {
                        text: message
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'access_token': config.access_token_zalo
                    }
                }
            );

            console.log('Zalo message sent successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending Zalo message:', error);
            throw new Error('Failed to send Zalo message: ' + error);
        }
    }
};