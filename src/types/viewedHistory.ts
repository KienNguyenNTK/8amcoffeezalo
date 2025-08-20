export interface ViewedHistory {
    id?: string;
    userId: string;
    productId: string;
    productType: 'coffee' | 'drink' | 'dish' | 'coffee_equipment';
    productName: string;
    productImageUrl?: string;
    productPrice?: number;
    productData?: any; // Lưu toàn bộ data của sản phẩm để hiển thị nhanh
    viewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
