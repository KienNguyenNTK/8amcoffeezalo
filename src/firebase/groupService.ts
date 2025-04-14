import { db } from './config';
import { Group } from '../types/group';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = '8am-group';

export class GroupService {
  private groups: Group[] = [];

  async addGroup(group: Group): Promise<Group> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...group,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, ...group };
    } catch (error) {
      throw new Error('Cannot add group: ' + error);
    }
  }

  async getAllGroups(): Promise<Group[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const groups = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Group[];
      
      // Sort groups by displayOrder
      return groups.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return 0;
      });
    } catch (error) {
      throw new Error('Cannot retrieve groups: ' + error);
    }
  }

  async getGroupById(id: string): Promise<Group | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Group;
    }
    return null;
  }

  async updateGroup(id: string, group: Partial<Group>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...group,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error('Cannot update group: ' + error);
    }
  }

  async deleteGroup(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw new Error('Cannot delete group: ' + error);
    }
  }

  async batchUpdateFromExcel(groups: Group[]): Promise<{ added: number, updated: number, errors: string[] }> {
    const result: { added: number, updated: number, errors: string[] } = { added: 0, updated: 0, errors: [] };
    
    try {
      // Get all existing groups to check for updates
      const existingGroups = await this.getAllGroups();
      const existingGroupMap = new Map<string, Group>();
      
      // Create a map of existing groups by code for quick lookup
      existingGroups.forEach(group => {
        if (group.code) {
          existingGroupMap.set(group.code, group);
        }
      });
      
      // Process each group from Excel
      for (const group of groups) {
        try {
          // Check if group with this code already exists
          const existingGroup = existingGroupMap.get(group.code);
          
          if (existingGroup) {
            // Update existing group
            await this.updateGroup(existingGroup.id!, group);
            result.updated++;
          } else {
            // Add new group
            await this.addGroup(group);
            result.added++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error processing group ${group.name} (${group.code}): ${errorMessage}`);
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error('Error in batch update: ' + errorMessage);
    }
  }
} 