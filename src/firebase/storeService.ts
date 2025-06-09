import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './config';
import type { Store, StoreCreateInput, StoreUpdateInput } from '../types/store';

const COLLECTION_NAME = 'storeLocations';

export const storeService = {
    // Get all stores
    getStores: async (): Promise<Store[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            
            const stores = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
            })) as Store[];

            // Sắp xếp theo priority (số nhỏ hơn = ưu tiên cao hơn), sau đó theo createdAt
            return stores.sort((a, b) => {
                // Nếu có priority, sắp xếp theo priority trước
                if (a.priority !== undefined && b.priority !== undefined) {
                    return a.priority - b.priority;
                }
                // Nếu chỉ có một store có priority, ưu tiên store đó
                if (a.priority !== undefined && b.priority === undefined) {
                    return -1;
                }
                if (a.priority === undefined && b.priority !== undefined) {
                    return 1;
                }
                // Nếu cả hai đều không có priority, sắp xếp theo createdAt (mới nhất trước)
                return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
            });
        } catch (error) {
            console.error('Error fetching stores:', error);
            throw new Error('Không thể tải danh sách cửa hàng');
        }
    },

    // Get active stores only
    getActiveStores: async (): Promise<Store[]> => {
        try {
            const stores = await storeService.getStores();
            return stores.filter(store => store.isActive);
        } catch (error) {
            console.error('Error fetching active stores:', error);
            throw new Error('Không thể tải danh sách cửa hàng hoạt động');
        }
    },

    // Get store by ID
    getStoreById: async (id: string): Promise<Store | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString(),
                    updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString(),
                } as Store;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching store:', error);
            throw new Error('Không thể tải thông tin cửa hàng');
        }
    },

    // Create new store
    createStore: async (storeData: StoreCreateInput): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...storeData,
                isActive: storeData.isActive ?? true,
                priority: storeData.priority ?? 999, // Mặc định là 999 nếu không có priority
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Error creating store:', error);
            throw new Error('Không thể tạo cửa hàng mới');
        }
    },

    // Update store
    updateStore: async (storeData: StoreUpdateInput): Promise<void> => {
        try {
            const { id, ...updateData } = storeData;
            const docRef = doc(db, COLLECTION_NAME, id);
            
            await updateDoc(docRef, {
                ...updateData,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating store:', error);
            throw new Error('Không thể cập nhật thông tin cửa hàng');
        }
    },

    // Delete store
    deleteStore: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting store:', error);
            throw new Error('Không thể xóa cửa hàng');
        }
    },

    // Toggle store active status
    toggleStoreStatus: async (id: string, isActive: boolean): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                isActive,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error toggling store status:', error);
            throw new Error('Không thể thay đổi trạng thái cửa hàng');
        }
    },

    // Get stores for shipping configuration (simplified format)
    getStoresForShipping: async () => {
        try {
            const stores = await storeService.getActiveStores();
            return stores.map(store => ({
                id: store.id,
                address: store.address,
                province: store.province,
                district: store.district,
                ward: store.ward,
                street: store.street,
                priority: store.priority,
            }));
        } catch (error) {
            console.error('Error fetching stores for shipping:', error);
            throw new Error('Không thể tải danh sách cửa hàng cho vận chuyển');
        }
    },
}; 