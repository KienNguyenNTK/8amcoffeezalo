import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { ViewedHistory } from '../types/viewedHistory';

class ViewedHistoryService {
    private collectionName = 'viewedHistory';

    // Thêm sản phẩm vào lịch sử xem
    async addToViewedHistory(
        userId: string, 
        productId: string, 
        productType: 'coffee' | 'drink' | 'dish',
        productData: any
    ): Promise<void> {
        try {
            const now = new Date();
            
            // Kiểm tra xem đã xem sản phẩm này chưa
            const existingQuery = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('productId', '==', productId),
                where('productType', '==', productType)
            );
            
            const existingDocs = await getDocs(existingQuery);
            
            if (existingDocs.empty) {
                // Chưa xem -> tạo mới
                const viewedHistoryData: Omit<ViewedHistory, 'id'> = {
                    userId,
                    productId,
                    productType,
                    productName: productData.name || '',
                    productImageUrl: this.getProductImageUrl(productData),
                    productPrice: this.getProductPrice(productData),
                    productData,
                    viewedAt: now,
                    createdAt: now,
                    updatedAt: now
                };

                await addDoc(collection(db, this.collectionName), {
                    ...viewedHistoryData,
                    viewedAt: Timestamp.fromDate(now),
                    createdAt: Timestamp.fromDate(now),
                    updatedAt: Timestamp.fromDate(now)
                });
            } else {
                // Đã xem -> cập nhật thời gian
                const existingDoc = existingDocs.docs[0];
                await updateDoc(doc(db, this.collectionName, existingDoc.id), {
                    viewedAt: Timestamp.fromDate(now),
                    updatedAt: Timestamp.fromDate(now),
                    productData, // Cập nhật data mới nhất
                    productName: productData.name || '',
                    productImageUrl: this.getProductImageUrl(productData),
                    productPrice: this.getProductPrice(productData)
                });
            }

            // Giữ chỉ 20 item gần nhất cho mỗi user
            await this.cleanupOldHistory(userId);

        } catch (error) {
            console.error('Error adding to viewed history:', error);
            throw error;
        }
    }

    // Lấy lịch sử xem của user
    async getViewedHistory(userId: string, limitCount: number = 20): Promise<ViewedHistory[]> {
        try {
            console.log(`Getting viewed history for userId: ${userId}, limit: ${limitCount}`);
            
            // Tạm thời query không có orderBy để tránh cần index
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            const viewedHistory: ViewedHistory[] = [];

            console.log(`Found ${querySnapshot.size} documents in viewedHistory`);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Document data:', { id: doc.id, ...data });
                
                viewedHistory.push({
                    id: doc.id,
                    ...data,
                    viewedAt: data.viewedAt?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                } as ViewedHistory);
            });

            // Deduplicate by productId, keep only the most recent view of each product
            const uniqueProductsMap = new Map<string, ViewedHistory>();
            
            viewedHistory.forEach((item) => {
                const existingItem = uniqueProductsMap.get(item.productId);
                if (!existingItem || item.viewedAt > existingItem.viewedAt) {
                    uniqueProductsMap.set(item.productId, item);
                }
            });

            // Convert to array, sort by viewedAt (descending) và limit
            const uniqueHistory = Array.from(uniqueProductsMap.values())
                .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
                .slice(0, limitCount);

            console.log('Final unique and sorted viewedHistory array:', uniqueHistory);
            return uniqueHistory;
        } catch (error) {
            console.error('Error getting viewed history:', error);
            return [];
        }
    }

    // Xóa một item khỏi lịch sử
    async removeFromViewedHistory(historyId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, this.collectionName, historyId));
        } catch (error) {
            console.error('Error removing from viewed history:', error);
            throw error;
        }
    }

    // Xóa toàn bộ lịch sử của user
    async clearViewedHistory(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);

            querySnapshot.forEach((document) => {
                batch.delete(doc(db, this.collectionName, document.id));
            });

            await batch.commit();
        } catch (error) {
            console.error('Error clearing viewed history:', error);
            throw error;
        }
    }

    // Helper: Lấy URL hình ảnh từ product data
    private getProductImageUrl(productData: any): string {
        if (productData.imageUrl) {
            return productData.imageUrl;
        }
        if (productData.images && productData.images.length > 0) {
            return productData.images[0];
        }
        return '';
    }

    // Helper: Lấy giá từ product data
    private getProductPrice(productData: any): number | undefined {
        // For coffee
        if (productData.weightAndPrice && productData.weightAndPrice.length > 0) {
            return Math.min(...productData.weightAndPrice.map((wp: any) => wp.price));
        }
        // For bottled drinks
        if (productData.volumes && productData.volumes.length > 0) {
            return Math.min(...productData.volumes.map((v: any) => v.price));
        }
        // For dishes
        if (productData.price) {
            return productData.price;
        }
        return undefined;
    }

    // Helper: Dọn dẹp lịch sử cũ (giữ 20 unique products gần nhất)
    private async cleanupOldHistory(userId: string): Promise<void> {
        try {
            // Query tất cả records của user này (không dùng orderBy để tránh index)
            const allHistoryQuery = query(
                collection(db, this.collectionName),
                where('userId', '==', userId)
            );

            const allHistorySnapshot = await getDocs(allHistoryQuery);
            
            if (allHistorySnapshot.size > 0) {
                const allRecords: (ViewedHistory & { docId: string })[] = [];
                
                allHistorySnapshot.forEach((document) => {
                    const data = document.data();
                    allRecords.push({
                        docId: document.id,
                        id: document.id,
                        ...data,
                        viewedAt: data.viewedAt?.toDate() || new Date(),
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date()
                    } as ViewedHistory & { docId: string });
                });

                // Group by productId and keep only the most recent record for each product
                const uniqueProductsMap = new Map<string, (ViewedHistory & { docId: string })>();
                const duplicateDocIds: string[] = [];
                
                allRecords.forEach((record) => {
                    const existingRecord = uniqueProductsMap.get(record.productId);
                    if (!existingRecord || record.viewedAt > existingRecord.viewedAt) {
                        // If there was an existing record, mark it for deletion
                        if (existingRecord) {
                            duplicateDocIds.push(existingRecord.docId);
                        }
                        uniqueProductsMap.set(record.productId, record);
                    } else {
                        // Current record is older, mark it for deletion
                        duplicateDocIds.push(record.docId);
                    }
                });

                // Get unique records sorted by viewedAt
                const uniqueRecords = Array.from(uniqueProductsMap.values())
                    .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());

                // If we have more than 20 unique products, delete the oldest ones
                if (uniqueRecords.length > 20) {
                    const recordsToDelete = uniqueRecords.slice(20);
                    recordsToDelete.forEach(record => duplicateDocIds.push(record.docId));
                }

                // Delete duplicate and old records
                if (duplicateDocIds.length > 0) {
                    const batch = writeBatch(db);
                    duplicateDocIds.forEach((docId) => {
                        batch.delete(doc(db, this.collectionName, docId));
                    });
                    await batch.commit();
                    console.log(`Cleaned up ${duplicateDocIds.length} old/duplicate viewed history records`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old history:', error);
        }
    }

    // Lấy lịch sử theo loại sản phẩm
    async getViewedHistoryByType(
        userId: string, 
        productType: 'coffee' | 'drink' | 'dish',
        limitCount: number = 10
    ): Promise<ViewedHistory[]> {
        try {
            // Tạm thời query không có orderBy để tránh cần index
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('productType', '==', productType)
            );

            const querySnapshot = await getDocs(q);
            const viewedHistory: ViewedHistory[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                viewedHistory.push({
                    id: doc.id,
                    ...data,
                    viewedAt: data.viewedAt?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                } as ViewedHistory);
            });

            // Deduplicate by productId, keep only the most recent view of each product
            const uniqueProductsMap = new Map<string, ViewedHistory>();
            
            viewedHistory.forEach((item) => {
                const existingItem = uniqueProductsMap.get(item.productId);
                if (!existingItem || item.viewedAt > existingItem.viewedAt) {
                    uniqueProductsMap.set(item.productId, item);
                }
            });

            // Convert to array, sort by viewedAt (descending) và limit
            const uniqueHistory = Array.from(uniqueProductsMap.values())
                .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
                .slice(0, limitCount);

            return uniqueHistory;
        } catch (error) {
            console.error('Error getting viewed history by type:', error);
            return [];
        }
    }
}

export const viewedHistoryService = new ViewedHistoryService();
