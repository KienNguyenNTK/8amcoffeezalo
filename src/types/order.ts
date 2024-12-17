interface OrderItem {
    id: string;
    coffeeId?: string;
    drinkId?: string;
    quantity: number;
    weight?: number;
    grindType?: 'whole' | 'ground';
    volume?: number;
    price: number;
    name: string;
    imageUrl: string;
}

interface Order {
    id?: string;
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    shippingInfo: {
        email: string;
        fullName: string;
        phone: string;
        address: string;
        district: string;
        ward: string;
        province: string;
    };
    status: 'waiting' | 'confirmed' | 'shipping' | 'delivered' | 'paid' | 'cancelled';
    paymentMethod: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type { Order, OrderItem }; 