import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SelectedStoreService } from '../services/selectedStoreService';

interface StoreGuardProps {
    children: React.ReactNode;
}

const StoreGuard: React.FC<StoreGuardProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Các route không cần kiểm tra cửa hàng
    const excludedRoutes = [
        '/store-selection',
        '/authorize',
        '/privacy-policy'
    ];

    useEffect(() => {
        // Nếu đang ở route không cần kiểm tra thì bỏ qua
        if (excludedRoutes.includes(location.pathname)) {
            return;
        }

        // Kiểm tra xem đã chọn cửa hàng chưa
        if (!SelectedStoreService.hasSelectedStore()) {
            navigate('/store-selection', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Nếu chưa chọn cửa hàng và không phải ở route được phép thì không render gì
    if (!SelectedStoreService.hasSelectedStore() && !excludedRoutes.includes(location.pathname)) {
        return null;
    }

    return <>{children}</>;
};

export default StoreGuard; 