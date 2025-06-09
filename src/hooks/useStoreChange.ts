import { useEffect, useState } from 'react';
import { SelectedStoreService } from '../services/selectedStoreService';

export const useStoreChange = () => {
    const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

    useEffect(() => {
        // Lấy store hiện tại
        const storeId = SelectedStoreService.getSelectedStoreId();
        setCurrentStoreId(storeId);

        // Tạo một interval để check thay đổi store
        const checkStoreChange = () => {
            const newStoreId = SelectedStoreService.getSelectedStoreId();
            if (newStoreId !== currentStoreId) {
                setCurrentStoreId(newStoreId);
                // Trigger sự kiện store change
                window.dispatchEvent(new CustomEvent('storeChanged', { 
                    detail: { newStoreId, oldStoreId: currentStoreId } 
                }));
            }
        };

        const interval = setInterval(checkStoreChange, 1000);

        return () => clearInterval(interval);
    }, [currentStoreId]);

    return currentStoreId;
}; 