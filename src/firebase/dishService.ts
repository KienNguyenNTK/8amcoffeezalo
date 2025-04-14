  import { db } from './config';
  import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
  import { Dish } from '../types/dish';

  const COLLECTION_NAME = '8am_dishes';

  export class DishService {
    private dishes: Dish[] = [];

    async addDish(dish: Dish): Promise<Dish> {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...dish,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return { id: docRef.id, ...dish };
      } catch (error) {
        throw new Error('Cannot add dish: ' + error);
      }
    }

    async getAllDishes(): Promise<Dish[]> {
      try {
        // Get all dishes without ordering first
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));

        // Convert to Dish objects
        const dishes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Dish[];

        // Sort dishes by code to match Excel order
        // Excel typically sorts by the code column which is usually sequential
        return dishes.sort((a, b) => {
          // First try to sort by displayOrder if it exists
          if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
            return a.displayOrder - b.displayOrder;
          }

          // If no displayOrder, sort by code
          if (a.code && b.code) {
            // Extract numbers from codes if they exist (e.g., ITEM_001 -> 001)
            const aMatch = a.code.match(/\d+/);
            const bMatch = b.code.match(/\d+/);

            if (aMatch && bMatch) {
              return parseInt(aMatch[0]) - parseInt(bMatch[0]);
            }

            // If no numbers, sort alphabetically
            return a.code.localeCompare(b.code);
          }

          return 0;
        });
      } catch (error) {
        throw new Error('Cannot retrieve dishes: ' + error);
      }
    }

    async getDishById(id: string): Promise<Dish | null> {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Dish;
      }
      return null;
    }

    async updateDish(id: string, dish: Partial<Dish>): Promise<void> {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          ...dish,
          updatedAt: new Date()
        });
      } catch (error) {
        throw new Error('Cannot update dish: ' + error);
      }
    }

    async deleteDish(id: string): Promise<void> {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      } catch (error) {
        throw new Error('Cannot delete dish: ' + error);
      }
    }

    async batchUpdateFromExcel(dishes: Dish[]): Promise<{ added: number, updated: number, errors: string[] }> {
      const result: { added: number, updated: number, errors: string[] } = {
        added: 0,
        updated: 0,
        errors: []
      };

      console.log('Starting batch update with dishes:', dishes);

      try {
        // Get all existing dishes to check for updates
        const existingDishes = await this.getAllDishes();
        console.log('Existing dishes count:', existingDishes.length);
        const existingDishMap = new Map<string, Dish>();

        // Create a map of existing dishes by code for quick lookup
        existingDishes.forEach(dish => {
          if (dish.code) {
            existingDishMap.set(dish.code, dish);
          }
        });
        console.log('Existing dish codes:', Array.from(existingDishMap.keys()));

        // Process each dish from Excel
        for (const dish of dishes) {
          try {
            console.log('Processing dish:', dish.name, 'with code:', dish.code);

            // Check if dish with this code already exists
            const existingDish = existingDishMap.get(dish.code);

            if (existingDish) {
              console.log('Updating existing dish:', existingDish.id);
              // Update existing dish
              await this.updateDish(existingDish.id!, dish);
              result.updated++;
            } else {
              console.log('Adding new dish');
              // Add new dish
              await this.addDish(dish);
              result.added++;
            }
          } catch (error) {
            console.error('Error processing dish:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`Error processing dish ${dish.name} (${dish.code}): ${errorMessage}`);
          }
        }

        console.log('Batch update completed with result:', result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('Error in batch update: ' + errorMessage);
      }
    }

    async getDishesFilteredByGroups(): Promise<Dish[]> {
      try {
        const allowedGroupCodes = ['ITEM_TYPE-J3S8', 'ITEM_TYPE-RPLX', 'ITEM_TYPE-TTMS', 'ITEM_TYPE-W0WN'];
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        
        // Convert to Dish objects and filter by group
        const dishes = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Dish[];

        // Filter dishes by allowed group codes and sort by displayOrder
        return dishes
          .filter(dish => dish.group && allowedGroupCodes.includes(dish.group))
          .sort((a, b) => {
            // First try to sort by displayOrder if it exists
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
              return a.displayOrder - b.displayOrder;
            }

            // If no displayOrder, sort by code
            if (a.code && b.code) {
              // Extract numbers from codes if they exist (e.g., ITEM_001 -> 001)
              const aMatch = a.code.match(/\d+/);
              const bMatch = b.code.match(/\d+/);

              if (aMatch && bMatch) {
                return parseInt(aMatch[0]) - parseInt(bMatch[0]);
              }

              // If no numbers, sort alphabetically
              return a.code.localeCompare(b.code);
            }

            return 0;
          });
      } catch (error) {
        throw new Error('Cannot retrieve filtered dishes: ' + error);
      }
    }
  }