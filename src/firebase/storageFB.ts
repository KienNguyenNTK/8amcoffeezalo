import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = async (file: File, path: string) => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const deleteFile = async (path: string) => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

export const listFiles = async (path: string) => {
    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        const urls = await Promise.all(
            result.items.map((itemRef) => getDownloadURL(itemRef))
        );
        return urls;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
};