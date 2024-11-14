import { useEffect, useState } from 'react';
import { listFiles } from '../firebase/storageFB';

export const useStorageImages = (folderPath: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const urls = await listFiles(folderPath);
        setImages(urls);
      } catch (err) {
        setError('Failed to fetch images');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [folderPath]);

  return { images, loading, error };
}; 