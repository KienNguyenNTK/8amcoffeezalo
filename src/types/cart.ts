interface CartItem {
    id: string;
    userId: string;
    coffeeId: string;
    quantity: number;
    weight: number;
    grindType: 'whole' | 'ground';
    grindSize?: string;
    price: number;
    name: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    isOrdered?: boolean;
}

export type { CartItem };