import { db, storage } from './config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { CoffeeBean } from '../types/coffee';

const COLLECTION_NAME = 'coffees';

export const coffeeService = {
    // Thêm cà phê mới với ảnh
    async addCoffee(coffee: CoffeeBean, imageFile: File) {
        try {
            console.log(coffee);
            // Upload ảnh
            const storageRef = ref(storage, `coffee-images/${Date.now()}_${imageFile.name}`);
            const uploadResult = await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(uploadResult.ref);

            // Thêm document vào Firestore
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...coffee,
                imageUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { id: docRef.id, ...coffee, imageUrl };
        } catch (error) {
            throw new Error('Không thể thêm cà phê: ' + error);
        }
    },

    // Lấy tất cả cà phê
    async getAllCoffees() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CoffeeBean[];
    },

    // Lấy cà phê theo ID
    async getCoffeeById(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CoffeeBean;
        }
        return null;
    },

    // Cập nhật thông tin cà phê
    async updateCoffee(id: string, coffee: Partial<CoffeeBean>, newImageFile?: File) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const currentDoc = await getDoc(docRef);

            if (!currentDoc.exists()) {
                throw new Error('Không tìm thấy cà phê');
            }

            let updateData = {
                ...coffee,
                updatedAt: new Date()
            };

            // Nếu có ảnh mới
            if (newImageFile) {
                // Xóa ảnh cũ
                const oldImageUrl = currentDoc.data().imageUrl;
                if (oldImageUrl) {
                    const oldImageRef = ref(storage, oldImageUrl);
                    await deleteObject(oldImageRef);
                }

                // Upload ảnh mới
                const storageRef = ref(storage, `coffee-images/${Date.now()}_${newImageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, newImageFile);
                const newImageUrl = await getDownloadURL(uploadResult.ref);

                updateData = {
                    ...updateData,
                    imageUrl: newImageUrl
                };
            }

            await updateDoc(docRef, updateData);
            return { id, ...updateData };
        } catch (error) {
            throw new Error('Không thể cập nhật cà phê: ' + error);
        }
    },

    // Xóa cà phê
    async deleteCoffee(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const imageUrl = docSnap.data().imageUrl;
                if (imageUrl) {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                }
            }

            await deleteDoc(docRef);
        } catch (error) {
            throw new Error('Không thể xóa cà phê: ' + error);
        }
    },

    // Tìm kiếm cà phê theo region
    async searchByRegion(region: string) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('region', 'array-contains', region)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CoffeeBean[];
    },

    // Add this method to the coffeeService object
    async searchCoffees(searchTerm: string) {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const allCoffees = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CoffeeBean[];
        
        return allCoffees.filter(coffee => 
            coffee.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
}; 