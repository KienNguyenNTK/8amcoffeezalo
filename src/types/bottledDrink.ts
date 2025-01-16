import { Ingredient } from "./ingredient";

interface BottledDrink {
    id?: string;
    name: string;
    description: string;
    coffeeId: string;
    coffeeName?: string;
    coffeeOriginText?: string; // Nguồn gốc hạt cà phê
    origin: string[];
    flavorNotes: string[];
    ingredients: Ingredient[]; // Thành phần
    volumes: {
        volume: number;    // Dung tích (ml)
        price: number;     // Giá
    }[];
    images: string[];
    driveImages: {
        fileId: string;
        webViewLink: string;
        fileName?: string;
    }[];
    expirationDays: number; // Số ngày hết hạn
    purchaseCount: number; // Số lượng đã bán
    createdAt?: Date;
    updatedAt?: Date;
}

export type { BottledDrink };