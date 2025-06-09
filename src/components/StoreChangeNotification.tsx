import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { cartService } from '../firebase/cartService';
import { SelectedStoreService } from '../services/selectedStoreService';

interface StoreChangeNotificationProps {
    userId?: string;
}

const StoreChangeNotification: React.FC<StoreChangeNotificationProps> = ({ userId }) => {
    const [previousStoreId, setPreviousStoreId] = useState<string | null>(null);

    useEffect(() => {
        const currentStoreId = SelectedStoreService.getSelectedStoreId();
        setPreviousStoreId(currentStoreId);
    }, []);

    useEffect(() => {
        const handleStoreChange = async (event: any) => {
            const { newStoreId, oldStoreId } = event.detail;
            
            if (userId && oldStoreId && newStoreId !== oldStoreId) {
                try {
                    // Lấy tất cả items trong giỏ hàng
                    const allItems = await cartService.getAllCartItems(userId);
                    
                    // Đếm số items từ cửa hàng cũ
                    const hiddenItemsCount = allItems.filter(item => 
                        item.storeId === oldStoreId
                    ).length;

                    if (hiddenItemsCount > 0) {
                        notification.info({
                            message: 'Thay đổi cửa hàng',
                            description: `Có ${hiddenItemsCount} món từ cửa hàng trước đã được ẩn khỏi giỏ hàng. Bạn có thể xem trong trang giỏ hàng.`,
                            duration: 4,
                            placement: 'top'
                        });
                    }
                } catch (error) {
                    console.error('Error checking hidden items:', error);
                }
            }
        };

        window.addEventListener('storeChanged', handleStoreChange);
        
        return () => {
            window.removeEventListener('storeChanged', handleStoreChange);
        };
    }, [userId]);

    return null; // Component này chỉ để xử lý logic, không render gì
};

export default StoreChangeNotification; 