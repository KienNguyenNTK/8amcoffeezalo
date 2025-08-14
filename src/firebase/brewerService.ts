import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Brewer, CreateBrewerRequest, UpdateBrewerRequest } from '../types/brewer';

const COLLECTION_NAME = 'brewers';

// Helper function to retry operations with exponential backoff
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Helper function to check if URL is a Firebase Storage URL
const isFirebaseStorageUrl = (url: string): boolean => {
  try {
    return url.includes('firebasestorage.googleapis.com') ||
      url.includes('storage.googleapis.com') ||
      url.startsWith('gs://');
  } catch {
    return false;
  }
};

export class BrewerService {
  private collectionName = COLLECTION_NAME;

  async getAll(): Promise<Brewer[]> {
    try {
      console.log('Getting all brewers from collection:', this.collectionName);

      // Simple query without ordering to avoid index issues
      const querySnapshot = await retryOperation(async () => {
        return getDocs(collection(db, this.collectionName));
      });

      console.log('Query snapshot size:', querySnapshot.size);

      const results = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        console.log('Document data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          // Normalize field names for backward compatibility
          createdAt: data.createdAt || data.created_at,
          updatedAt: data.updatedAt || data.updated_at,
          // Map old field names to new ones for backward compatibility
          product_name: data.product_name || data.name,
          max_temperature: data.max_temperature || data.temperature,
          max_pressure: data.max_pressure || data.pressure,
          brewing_method: data.brewing_method || data.brewing_methods
        };
      }) as Brewer[];

      // Sort in memory by creation date (newest first)
      results.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      console.log('Final results:', results);
      return results;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw new Error('Không thể lấy danh sách máy pha cà phê: ' + error);
    }
  }

  async getById(id: string): Promise<Brewer | null> {
    try {
      console.log('Getting brewer by ID:', id);
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await retryOperation(async () => getDoc(docRef));
      
      if (!docSnap.exists()) {
        console.log('No brewer found with ID:', id);
        return null;
      }
      
      const data = docSnap.data();
      console.log('Brewer document data:', { id: docSnap.id, ...data });
      
      return {
        id: docSnap.id,
        ...data,
        // Normalize field names for backward compatibility
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        product_name: data.product_name || data.name
      } as Brewer;
    } catch (error) {
      console.error('Error in getById:', error);
      throw new Error('Không thể lấy thông tin máy pha cà phê: ' + error);
    }
  }

  // Thêm máy pha mới với ảnh
  async addBrewer(brewer: Brewer, imageFiles: File[]) {
    try {
      // Upload nhiều ảnh với retry
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          return retryOperation(async () => {
            const storageRef = ref(storage, `brewer-images/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            return getDownloadURL(uploadResult.ref);
          });
        })
      );

      // Thêm document vào Firestore với retry
      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, this.collectionName), {
          ...brewer,
          images: imageUrls,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      return { ...brewer, id: docRef.id, images: imageUrls };
    } catch (error) {
      throw new Error('Không thể thêm máy pha cà phê: ' + error);
    }
  }

  // Backward compatibility - method cũ không có upload ảnh
  async create(brewer: CreateBrewerRequest): Promise<string> {
    try {
      const brewerData = {
        ...brewer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, this.collectionName), brewerData);
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Không thể tạo máy pha cà phê: ' + error);
    }
  }

  // Cập nhật thông tin máy pha với xử lý ảnh
  async updateBrewer(id: string, brewer: Partial<Brewer>, newImageFiles?: File[], oldImageUrls?: string[]) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const currentDoc = await retryOperation(async () => getDoc(docRef));

      if (!currentDoc.exists()) {
        throw new Error('Không tìm thấy máy pha cà phê');
      }

      let updateData = {
        ...brewer,
        updatedAt: new Date()
      };

      // Xử lý ảnh cũ
      if (oldImageUrls && oldImageUrls.length > 0) {
        const currentImageUrls = currentDoc.data().images || [];
        const imagesToDelete = currentImageUrls.filter((url: string) => !oldImageUrls.includes(url));

        // Xóa từng ảnh cũ riêng biệt với retry
        let deletedOldCount = 0;
        let skippedOldCount = 0;

        for (const url of imagesToDelete) {
          // Chỉ xóa nếu là Firebase Storage URL
          if (isFirebaseStorageUrl(url)) {
            try {
              await retryOperation(async () => {
                const imageRef = ref(storage, url);
                return deleteObject(imageRef);
              });
              deletedOldCount++;
              console.log(`Successfully deleted old brewer image: ${url}`);
            } catch (error) {
              console.error(`Error deleting old brewer image ${url}:`, error);
              // Tiếp tục xử lý dù có lỗi khi xóa ảnh
            }
          } else {
            skippedOldCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        if (imagesToDelete.length > 0) {
          console.log(`Update cleanup for brewer ID ${id}: ${deletedOldCount} old images deleted, ${skippedOldCount} non-Firebase URLs skipped`);
        }

        updateData = {
          ...updateData,
          images: oldImageUrls
        };
      }

      // Upload ảnh mới với retry và chunking
      if (newImageFiles?.length) {
        const chunkSize = 3; // Xử lý tối đa 3 ảnh một lần
        let newImageUrls: string[] = [];

        // Xử lý upload theo từng nhóm nhỏ
        for (let i = 0; i < newImageFiles.length; i += chunkSize) {
          const chunk = newImageFiles.slice(i, i + chunkSize);
          const chunkUrls = await Promise.all(
            chunk.map(async (file) => {
              return retryOperation(async () => {
                const storageRef = ref(storage, `brewer-images/${Date.now()}_${file.name}`);
                const uploadResult = await uploadBytes(storageRef, file);
                return getDownloadURL(uploadResult.ref);
              });
            })
          );
          newImageUrls = [...newImageUrls, ...chunkUrls];
        }

        updateData = {
          ...updateData,
          images: [...(updateData.images || []), ...newImageUrls]
        };
      }

      // Cập nhật Firestore với retry
      await retryOperation(async () => updateDoc(docRef, updateData));

      return { id, ...updateData };
    } catch (error) {
      throw new Error('Không thể cập nhật máy pha cà phê: ' + error);
    }
  }

  // Backward compatibility - method cũ không có xử lý ảnh
  async update(brewer: UpdateBrewerRequest): Promise<void> {
    try {
      const { id, ...updateData } = brewer;
      const brewerData = {
        ...updateData,
        updatedAt: new Date(),
      };
      await retryOperation(async () => updateDoc(doc(db, this.collectionName, id), brewerData));
    } catch (error) {
      throw new Error('Không thể cập nhật máy pha cà phê: ' + error);
    }
  }

  // Xóa máy pha cà phê
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await retryOperation(async () => getDoc(docRef));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const imageUrls = data.images || [];

        // Xóa tất cả ảnh từ Firebase Storage
        let deletedCount = 0;
        let skippedCount = 0;

        for (const url of imageUrls) {
          // Chỉ xóa nếu là Firebase Storage URL
          if (isFirebaseStorageUrl(url)) {
            try {
              await retryOperation(async () => {
                const imageRef = ref(storage, url);
                return deleteObject(imageRef);
              });
              deletedCount++;
              console.log(`Successfully deleted brewer image: ${url}`);
            } catch (error) {
              console.error(`Error deleting brewer image ${url}:`, error);
              // Tiếp tục xử lý dù có lỗi khi xóa ảnh
            }
          } else {
            skippedCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        // Ghi log để theo dõi số lượng ảnh đã xóa
        console.log(`Storage cleanup for brewer ID ${id}: ${deletedCount} images deleted, ${skippedCount} non-Firebase URLs skipped`);

        // Note: driveImages không cần xóa khỏi Firebase Storage vì chúng được lưu trên Google Drive
        // Chỉ cần xóa metadata trong Firestore
        const driveImages = data.driveImages || [];
        if (driveImages.length > 0) {
          console.log(`Brewer had ${driveImages.length} Google Drive images (metadata only, no storage cleanup needed)`);
        }
      }

      // Xóa document từ Firestore
      await retryOperation(async () => deleteDoc(docRef));
      console.log(`Successfully deleted brewer document with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting brewer with ID ${id}:`, error);
      throw new Error('Không thể xóa máy pha cà phê: ' + error);
    }
  }
}