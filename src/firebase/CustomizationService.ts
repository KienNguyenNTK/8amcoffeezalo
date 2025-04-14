import { db } from './config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Customization } from '../types/customization';

const COLLECTION_NAME = '8am_customization';

export class CustomizationService {
    async addCustomization(customization: Customization): Promise<Customization> {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...customization,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...customization };
        } catch (error) {
            throw new Error('Cannot add customization: ' + error);
        }
    }

    async getAllCustomizations(): Promise<Customization[]> {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Convert dishCode to array if it's a string
                const dishCode = typeof data.dishCode === 'string' ? [data.dishCode] : (data.dishCode || []);
                return { 
                    id: doc.id, 
                    ...data,
                    dishCode 
                } as Customization;
            });
        } catch (error) {
            throw new Error('Cannot retrieve customizations: ' + error);
        }
    }

    async getCustomizationById(id: string): Promise<Customization | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Customization;
        }
        return null;
    }

    async updateCustomization(id: string, customization: Partial<Customization>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...customization,
                updatedAt: new Date()
            });
        } catch (error) {
            throw new Error('Cannot update customization: ' + error);
        }
    }

    async deleteCustomization(id: string): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            throw new Error('Cannot delete customization: ' + error);
        }
    }

    async getCustomizationsByDishCode(dishCode: string): Promise<Customization[]> {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Customization))
                .filter(customization => customization.dishCode.includes(dishCode));
        } catch (error) {
            throw new Error('Cannot retrieve customizations by dish code: ' + error);
        }
    }

    async batchUpdateFromExcel(customizations: Customization[]): Promise<{ added: number, updated: number, errors: string[] }> {
        const result: { added: number, updated: number, errors: string[] } = { added: 0, updated: 0, errors: [] };

        try {
            // Get all existing customizations to check for updates
            const existingCustomizations = await this.getAllCustomizations();
            const existingCustomizationMap = new Map<string, Customization>();

            // Create a map of existing customizations by name for quick lookup
            existingCustomizations.forEach(customization => {
                if (customization.name) {
                    existingCustomizationMap.set(customization.name, customization);
                }
            });

            // Process each customization from Excel
            for (const customization of customizations) {
                try {
                    // Check if customization with this name already exists
                    const existingCustomization = existingCustomizationMap.get(customization.name);

                    if (existingCustomization) {
                        // Update existing customization
                        await this.updateCustomization(existingCustomization.id!, customization);
                        result.updated++;
                    } else {
                        // Add new customization
                        await this.addCustomization(customization);
                        result.added++;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    result.errors.push(`Error processing customization ${customization.name}: ${errorMessage}`);
                }
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error('Error in batch update: ' + errorMessage);
        }
    }
} 