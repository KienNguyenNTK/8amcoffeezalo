import { DishInfo } from './customization';

interface CartItem {
    id: string;
    userId: string;
    coffeeId?: string;
    drinkId?: string;
    dishId?: string;
    quantity?: number;
    weight?: number;
    grindType?: 'whole' | 'ground';
    grindSize?: string;
    price?: number;
    name?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    isOrdered?: boolean;
    volume?: number;
    type?: 'coffee' | 'drink' | 'dish';
    coffeeBean?: {
        id: string;
        name: string;
        price: number;
    };
    customizations?: Record<string, DishInfo[]>;
    storeId?: string;
}

export type { CartItem };