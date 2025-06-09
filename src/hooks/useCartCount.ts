import { useEffect, useState } from 'react';
import { cartService } from '../firebase/cartService';
import { useStoreChange } from './useStoreChange';

export const useCartCount = (userId?: string) => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const currentStoreId = useStoreChange();

    const updateCartCount = async () => {
        if (userId) {
            try {
                const count = await cartService.getCartItemCount(userId);
                setCartItemCount(count);
            } catch (error) {
                console.error('Error getting cart count:', error);
                setCartItemCount(0);
            }
        } else {
            setCartItemCount(0);
        }
    };

    useEffect(() => {
        updateCartCount();
    }, [userId, currentStoreId]);

    // Listen to cart updates
    useEffect(() => {
        const handleCartUpdate = () => {
            updateCartCount();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [userId]);

    return cartItemCount;
}; 