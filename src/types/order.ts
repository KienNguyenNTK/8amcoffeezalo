interface OrderItem {
    id: string;
    coffeeId: string;
    quantity: number;
    weight: number;
    grindType: 'whole' | 'ground';
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
    };
    status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
    paymentMethod: 'cod';
    createdAt?: Date;
    updatedAt?: Date;
}

export type { Order, OrderItem }; 