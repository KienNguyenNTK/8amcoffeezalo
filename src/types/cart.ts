interface CartItem {
    id: string;
    userId: string;
    coffeeId?: string;
    drinkId?: string;
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
    type?: 'coffee' | 'drink';
}

export type { CartItem };