import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  DocumentData, 
  QueryDocumentSnapshot,
  query,
  where 
} from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  CoffeeEquipmentCategory, 
  CoffeeEquipment, 
  CreateCoffeeEquipmentCategoryRequest,
  CreateCoffeeEquipmentRequest
} from '../types/coffeeEquipment';

const CATEGORIES_COLLECTION = 'coffeeEquipmentCategories';
const EQUIPMENT_COLLECTION = 'coffeeEquipment';

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

export class CoffeeEquipmentService {
  // ================= CATEGORY MANAGEMENT =================

  // Get all categories
  async getAllCategories(): Promise<CoffeeEquipmentCategory[]> {
    try {
      console.log('Getting all coffee equipment categories from collection:', CATEGORIES_COLLECTION);

      const querySnapshot = await retryOperation(async () => {
        return getDocs(collection(db, CATEGORIES_COLLECTION));
      });

      console.log('Categories query snapshot size:', querySnapshot.size);

      const results = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        console.log('Category document data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as CoffeeEquipmentCategory[];

      // Sort by creation date (newest first)
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log('Final category results:', results);
      return results;
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw new Error('Không thể lấy danh sách loại dụng cụ cà phê: ' + error);
    }
  }

  // Create new category
  async createCategory(category: CreateCoffeeEquipmentCategoryRequest): Promise<CoffeeEquipmentCategory> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanCategory = Object.fromEntries(
        Object.entries(category).filter(([_, value]) => value !== undefined)
      );
      
      const categoryData = {
        ...cleanCategory,
        description: category.description || '', // Ensure description is not undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
      });

      return { 
        id: docRef.id, 
        ...categoryData,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt
      } as CoffeeEquipmentCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Không thể tạo loại dụng cụ cà phê: ' + error);
    }
  }

  // Update category
  async updateCategory(categoryId: string, updates: Partial<CoffeeEquipmentCategory>): Promise<void> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData = {
        ...cleanUpdates,
        updatedAt: new Date(),
      };

      await retryOperation(async () => {
        return updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), updateData);
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Không thể cập nhật loại dụng cụ cà phê: ' + error);
    }
  }

  // Delete category
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await retryOperation(async () => {
        return deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Không thể xóa loại dụng cụ cà phê: ' + error);
    }
  }

  // ================= EQUIPMENT MANAGEMENT =================

  // Get all equipment
  async getAllEquipment(): Promise<CoffeeEquipment[]> {
    try {
      console.log('Getting all coffee equipment from collection:', EQUIPMENT_COLLECTION);

      const querySnapshot = await retryOperation(async () => {
        return getDocs(collection(db, EQUIPMENT_COLLECTION));
      });

      console.log('Equipment query snapshot size:', querySnapshot.size);

      const results = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        console.log('Equipment document data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as CoffeeEquipment[];

      // Sort by creation date (newest first)
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log('Final equipment results:', results);
      return results;
    } catch (error) {
      console.error('Error in getAllEquipment:', error);
      throw new Error('Không thể lấy danh sách dụng cụ cà phê: ' + error);
    }
  }

  // Get equipment by category
  async getEquipmentByCategory(categoryId: string): Promise<CoffeeEquipment[]> {
    try {
      console.log('Getting equipment by category:', categoryId);

      const q = query(
        collection(db, EQUIPMENT_COLLECTION),
        where('categoryId', '==', categoryId)
      );

      const querySnapshot = await retryOperation(async () => {
        return getDocs(q);
      });

      const results = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as CoffeeEquipment[];

      // Sort by creation date (newest first)
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return results;
    } catch (error) {
      console.error('Error in getEquipmentByCategory:', error);
      throw new Error('Không thể lấy danh sách dụng cụ theo loại: ' + error);
    }
  }

  // Create new equipment with images
  async createEquipment(equipment: CreateCoffeeEquipmentRequest, imageFiles: File[] = []): Promise<CoffeeEquipment> {
    try {
      // Upload images if any
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          return retryOperation(async () => {
            const storageRef = ref(storage, `coffee-equipment-images/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            return getDownloadURL(uploadResult.ref);
          });
        })
      );

      // Get category name for easier display
      const categoryDoc = await retryOperation(async () => {
        return getDoc(doc(db, CATEGORIES_COLLECTION, equipment.categoryId));
      });

      const categoryName = categoryDoc.exists() ? categoryDoc.data().name : 'Unknown Category';

      // Filter out undefined values to avoid Firestore errors
      const cleanEquipment = Object.fromEntries(
        Object.entries(equipment).filter(([_, value]) => value !== undefined)
      );
      
      const equipmentData = {
        ...cleanEquipment,
        categoryName,
        images: imageUrls,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await retryOperation(async () => {
        return addDoc(collection(db, EQUIPMENT_COLLECTION), equipmentData);
      });

      return { 
        id: docRef.id, 
        ...equipmentData,
        createdAt: equipmentData.createdAt,
        updatedAt: equipmentData.updatedAt
      } as CoffeeEquipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw new Error('Không thể tạo dụng cụ cà phê: ' + error);
    }
  }

  // Update equipment with image handling
  async updateEquipment(
    equipmentId: string, 
    equipment: Partial<CoffeeEquipment>, 
    newImageFiles?: File[], 
    oldImageUrls?: string[]
  ): Promise<CoffeeEquipment> {
    try {
      const docRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const currentDoc = await retryOperation(async () => getDoc(docRef));

      if (!currentDoc.exists()) {
        throw new Error('Không tìm thấy dụng cụ cà phê');
      }

      // Filter out undefined values to avoid Firestore errors
      const cleanEquipment = Object.fromEntries(
        Object.entries(equipment).filter(([_, value]) => value !== undefined)
      );
      
      let updateData = {
        ...cleanEquipment,
        updatedAt: new Date()
      };

      // Handle old images
      if (oldImageUrls && oldImageUrls.length > 0) {
        const currentImageUrls = currentDoc.data().images || [];
        const imagesToDelete = currentImageUrls.filter((url: string) => !oldImageUrls.includes(url));

        // Delete old images
        let deletedOldCount = 0;
        let skippedOldCount = 0;

        for (const url of imagesToDelete) {
          if (isFirebaseStorageUrl(url)) {
            try {
              await retryOperation(async () => {
                const imageRef = ref(storage, url);
                return deleteObject(imageRef);
              });
              deletedOldCount++;
              console.log(`Successfully deleted old equipment image: ${url}`);
            } catch (error) {
              console.error(`Error deleting old equipment image ${url}:`, error);
            }
          } else {
            skippedOldCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        if (imagesToDelete.length > 0) {
          console.log(`Update cleanup for equipment ID ${equipmentId}: ${deletedOldCount} old images deleted, ${skippedOldCount} non-Firebase URLs skipped`);
        }

        updateData = {
          ...updateData,
          images: oldImageUrls
        } as any;
      }

      // Upload new images
      if (newImageFiles?.length) {
        const chunkSize = 3;
        let newImageUrls: string[] = [];

        for (let i = 0; i < newImageFiles.length; i += chunkSize) {
          const chunk = newImageFiles.slice(i, i + chunkSize);
          const chunkUrls = await Promise.all(
            chunk.map(async (file) => {
              return retryOperation(async () => {
                const storageRef = ref(storage, `coffee-equipment-images/${Date.now()}_${file.name}`);
                const uploadResult = await uploadBytes(storageRef, file);
                return getDownloadURL(uploadResult.ref);
              });
            })
          );
          newImageUrls = [...newImageUrls, ...chunkUrls];
        }

        updateData = {
          ...updateData,
          images: [...((updateData as any).images || []), ...newImageUrls]
        } as any;
      }

      // Update in Firestore
      await retryOperation(async () => updateDoc(docRef, updateData));

      return { 
        id: equipmentId, 
        ...updateData,
        createdAt: currentDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: updateData.updatedAt as Date
      } as CoffeeEquipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw new Error('Không thể cập nhật dụng cụ cà phê: ' + error);
    }
  }

  // Delete equipment
  async deleteEquipment(equipmentId: string): Promise<void> {
    try {
      const docRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const docSnap = await retryOperation(async () => getDoc(docRef));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const imageUrls = data.images || [];

        // Delete all images from Firebase Storage
        let deletedCount = 0;
        let skippedCount = 0;

        for (const url of imageUrls) {
          if (isFirebaseStorageUrl(url)) {
            try {
              await retryOperation(async () => {
                const imageRef = ref(storage, url);
                return deleteObject(imageRef);
              });
              deletedCount++;
              console.log(`Successfully deleted equipment image: ${url}`);
            } catch (error) {
              console.error(`Error deleting equipment image ${url}:`, error);
            }
          } else {
            skippedCount++;
            console.log(`Skipped non-Firebase Storage URL: ${url}`);
          }
        }

        console.log(`Storage cleanup for equipment ID ${equipmentId}: ${deletedCount} images deleted, ${skippedCount} non-Firebase URLs skipped`);

        // Note: driveImages don't need deletion from Firebase Storage
        const driveImages = data.driveImages || [];
        if (driveImages.length > 0) {
          console.log(`Equipment had ${driveImages.length} Google Drive images (metadata only, no storage cleanup needed)`);
        }
      }

      // Delete document from Firestore
      await retryOperation(async () => deleteDoc(docRef));
      console.log(`Successfully deleted equipment document with ID: ${equipmentId}`);
    } catch (error) {
      console.error(`Error deleting equipment with ID ${equipmentId}:`, error);
      throw new Error('Không thể xóa dụng cụ cà phê: ' + error);
    }
  }
}

export const coffeeEquipmentService = new CoffeeEquipmentService();

