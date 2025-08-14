import { useEffect, useState, useCallback } from 'react';
import { cartService } from '../firebase/cartService';
import { useStoreChange } from './useStoreChange';

export const useCartCount = (userId?: string) => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const currentStoreId = useStoreChange();

    const updateCartCount = useCallback(async () => {
        if (userId) {
            try {
                const count = await cartService.getCartItemCount(userId);
                console.log(`[useCartCount] Updated cart count for user ${userId}: ${count}`);
                setCartItemCount(count);
            } catch (error) {
                console.error('Error getting cart count:', error);
                setCartItemCount(0);
            }
        } else {
            setCartItemCount(0);
        }
    }, [userId]);

    useEffect(() => {
        updateCartCount();
    }, [updateCartCount, currentStoreId]);

    // Listen to cart updates
    useEffect(() => {
        const handleCartUpdate = () => {
            console.log(`[useCartCount] Cart update event received for user: ${userId}`);
            // Add a small delay to ensure database operation is complete
            setTimeout(() => {
                updateCartCount();
            }, 100);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [userId, updateCartCount]);

    return cartItemCount;
}; 