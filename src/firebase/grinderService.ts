import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { CoffeeGrinder, CreateCoffeeGrinderRequest, UpdateCoffeeGrinderRequest } from '../types/grinder';

const COLLECTION_NAME = 'grinders';

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

export class GrinderService {
  private collectionName = COLLECTION_NAME;

  async getAll(): Promise<CoffeeGrinder[]> {
    try {
      console.log('Getting all grinders from collection:', this.collectionName);
      
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
      size_diameter: data.size_diameter || (data.size ? data.size.split(',')[0]?.trim() : undefined),
      size_height: data.size_height || (data.size ? data.size.split(',')[1]?.trim() : undefined),
      max_capacity: data.max_capacity || data.capacity_per_grind
        };
      }) as CoffeeGrinder[];
      
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
      throw new Error('Không thể lấy danh sách máy xay cà phê: ' + error);
    }
  }

  async getById(id: string): Promise<CoffeeGrinder | null> {
    try {
      console.log('Getting grinder by ID:', id);
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await retryOperation(async () => getDoc(docRef));
      
      if (!docSnap.exists()) {
        console.log('No grinder found with ID:', id);
        return null;
      }
      
      const data = docSnap.data();
      console.log('Grinder document data:', { id: docSnap.id, ...data });
      
      return {
        id: docSnap.id,
        ...data,
        // Normalize field names for backward compatibility
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        // Map old field names to new ones for backward compatibility
        product_name: data.product_name || data.name,
        size_diameter: data.size_diameter || (data.size ? data.size.split(',')[0]?.trim() : undefined),
        size_height: data.size_height || (data.size ? data.size.split(',')[1]?.trim() : undefined),
        max_capacity: data.max_capacity || data.capacity_per_grind
      } as CoffeeGrinder;
    } catch (error) {
      console.error('Error in getById:', error);
      throw new Error('Không thể lấy thông tin máy xay cà phê: ' + error);
    }
  }

  // Thêm máy xay mới với ảnh
  async addGrinder(grinder: CoffeeGrinder, imageFiles: File[]) {
    try {
      // Upload nhiều ảnh với retry
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          return retryOperation(async () => {
            const storageRef = ref(storage, `grinder-images/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            return getDownloadURL(uploadResult.ref);
          });
        })
      );

      // Thêm document vào Firestore với retry
      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, this.collectionName), {
          ...grinder,
          images: imageUrls,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      return { ...grinder, id: docRef.id, images: imageUrls };
    } catch (error) {
      throw new Error('Không thể thêm máy xay cà phê: ' + error);
    }
  }

  // Backward compatibility - method cũ không có upload ảnh
  async create(grinder: CreateCoffeeGrinderRequest): Promise<string> {
    try {
      const grinderData = {
        ...grinder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, this.collectionName), grinderData);
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Không thể tạo máy xay cà phê: ' + error);
    }
  }

  // Cập nhật thông tin máy xay với xử lý ảnh
  async updateGrinder(id: string, grinder: Partial<CoffeeGrinder>, newImageFiles?: File[], oldImageUrls?: string[]) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const currentDoc = await retryOperation(async () => getDoc(docRef));

      if (!currentDoc.exists()) {
        throw new Error('Không tìm thấy máy xay cà phê');
      }

      let updateData = {
        ...grinder,
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
              console.log(`Successfully deleted old grinder image: ${url}`);
            } catch (error) {
              console.error(`Error deleting old grinder image ${url}:`, error);
              // Tiếp tục xử lý dù có lỗi khi xóa ảnh
            }
          } else {
            skippedOldCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        if (imagesToDelete.length > 0) {
          console.log(`Update cleanup for grinder ID ${id}: ${deletedOldCount} old images deleted, ${skippedOldCount} non-Firebase URLs skipped`);
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
                const storageRef = ref(storage, `grinder-images/${Date.now()}_${file.name}`);
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
      throw new Error('Không thể cập nhật máy xay cà phê: ' + error);
    }
  }

  // Backward compatibility - method cũ không có xử lý ảnh
  async update(grinder: UpdateCoffeeGrinderRequest): Promise<void> {
    try {
      const { id, ...updateData } = grinder;
      const grinderData = {
        ...updateData,
        updatedAt: new Date(),
      };
      await retryOperation(async () => updateDoc(doc(db, this.collectionName, id), grinderData));
    } catch (error) {
      throw new Error('Không thể cập nhật máy xay cà phê: ' + error);
    }
  }

  // Xóa máy xay cà phê
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
              console.log(`Successfully deleted grinder image: ${url}`);
            } catch (error) {
              console.error(`Error deleting grinder image ${url}:`, error);
              // Tiếp tục xử lý dù có lỗi khi xóa ảnh
            }
          } else {
            skippedCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        // Ghi log để theo dõi số lượng ảnh đã xóa
        console.log(`Storage cleanup for grinder ID ${id}: ${deletedCount} images deleted, ${skippedCount} non-Firebase URLs skipped`);
        
        // Note: driveImages không cần xóa khỏi Firebase Storage vì chúng được lưu trên Google Drive
        // Chỉ cần xóa metadata trong Firestore
        const driveImages = data.driveImages || [];
        if (driveImages.length > 0) {
          console.log(`Grinder had ${driveImages.length} Google Drive images (metadata only, no storage cleanup needed)`);
        }
      }

      // Xóa document từ Firestore
      await retryOperation(async () => deleteDoc(docRef));
      console.log(`Successfully deleted grinder document with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting grinder with ID ${id}:`, error);
      throw new Error('Không thể xóa máy xay cà phê: ' + error);
    }
  }
}