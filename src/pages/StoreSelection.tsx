import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Box, Text, Button, Spinner } from 'zmp-ui';
import { storeService } from '../firebase/storeService';
import type { Store } from '../types/store';
import { SelectedStoreService } from '../services/selectedStoreService';

const StoreSelection: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    useEffect(() => {
        fetchActiveStores();
    }, []);

    const fetchActiveStores = async () => {
        try {
            const activeStores = await storeService.getActiveStores();
            setStores(activeStores);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStoreSelect = (store: Store) => {
        setSelectedStore(store);
        // Lưu thông tin cửa hàng đã chọn
        SelectedStoreService.setSelectedStore(store);
        
        // Chuyển đến trang chính sau khi chọn xong
        setTimeout(() => {
            navigate('/explore');
        }, 500);
    };

    const formatWorkingHours = (workingHours: any) => {
        const formatTime = (period: any) => {
            if (!period.isOpen) return 'Đóng cửa';
            return `${period.open} - ${period.close}`;
        };

        return (
            <div>
                <div>T2-T6: {formatTime(workingHours.weekdays)}</div>
                <div>T7-CN: {formatTime(workingHours.weekends)}</div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-4 mb-10 bg-white pt-10 min-h-screen">
                <div className="text-center">
                    <Spinner />
                    <div className="mt-4 text-8am-black">Đang tải danh sách cửa hàng...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 mb-10 bg-white pt-10 min-h-screen">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-8am-orange rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div className="text-8am-black text-3xl font-bold mb-2">
                    Chọn cửa hàng
                </div>
                <div className="text-8am-middle-grey">
                    Vui lòng chọn cửa hàng gần bạn nhất để xem menu
                </div>
            </div>

            {/* Store List */}
            <div className="space-y-4">
                {stores.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-8am-middle-grey">Hiện tại chưa có cửa hàng nào hoạt động</div>
                    </div>
                ) : (
                    stores.map((store) => (
                        <div
                            key={store.id}
                            className={`bg-white rounded-lg shadow-sm border transition-all duration-300 cursor-pointer ${
                                selectedStore?.id === store.id 
                                    ? 'border-8am-orange bg-orange-50' 
                                    : 'border-gray-200'
                            }`}
                            onClick={() => handleStoreSelect(store)}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-8am-black text-lg font-bold mb-1">
                                            {store.name}
                                        </div>
                                        
                                        <div className="mb-2">
                                            <div className="text-8am-black text-sm mb-1">{store.address}</div>
                                            <div className="text-8am-middle-grey text-sm">
                                                {store.ward}, {store.district}, {store.province}
                                            </div>
                                        </div>

                                        <div className="text-8am-middle-grey text-sm">
                                            {formatWorkingHours(store.workingHours)}
                                        </div>
                                    </div>

                                    <div className="ml-4 flex-shrink-0">
                                        {selectedStore?.id === store.id ? (
                                            <div className="w-6 h-6 bg-8am-orange rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 border-2 border-8am-light-grey rounded-full"></div>
                                        )}
                                    </div>
                                </div>

                                {selectedStore?.id === store.id && (
                                    <div className="mt-3 pt-3 border-t border-8am-orange">
                                        <div className="text-8am-orange text-sm font-medium">
                                            ✓ Đã chọn cửa hàng này
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <div className="text-8am-middle-grey text-sm">
                    Bạn có thể thay đổi cửa hàng bất cứ lúc nào trong cài đặt
                </div>
            </div>
        </div>
    );
};

export default StoreSelection; 