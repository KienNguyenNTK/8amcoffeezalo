export interface WorkingHours {
    open: string; // Format: "HH:mm"
    close: string; // Format: "HH:mm"
    isOpen: boolean; // Whether the store is open on this day/period
}

export interface StoreWorkingHours {
    weekdays: WorkingHours; // Monday to Friday
    weekends: WorkingHours; // Saturday and Sunday
}

export interface Store {
    id?: string;
    name: string;
    address: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    workingHours: StoreWorkingHours;
    isActive: boolean;
    priority?: number; // Thứ tự ưu tiên hiển thị, số nhỏ hơn = ưu tiên cao hơn
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreCreateInput {
    name: string;
    address: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    workingHours: StoreWorkingHours;
    isActive?: boolean;
    priority?: number;
}

export interface StoreUpdateInput extends Partial<StoreCreateInput> {
    id: string;
}

// Menu related types
export interface MenuItem {
    id?: string;
    productId: string;
    productType: 'coffee' | 'bottledDrink' | 'dish';
    name: string;
    price: number;
    isAvailable: boolean;
    description?: string;
    weight?: number; // Cho coffee
    volume?: number; // Cho bottled drink
    originalId?: string; // ID gốc của sản phẩm
    originalName?: string; // Tên gốc của sản phẩm
    codeCoffee?: string; // Mã coffee
    productCode?: string; // Mã bottled drink
    code?: string; // Mã dish
    unit?: string; // Đơn vị dish
    uniqueId?: string; // ID duy nhất để phân byiiệt variants
}

export interface StoreMenu {
    id?: string;
    storeId: string;
    menuName: string;
    items: MenuItem[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreMenuCreateInput {
    storeId: string;
    menuName: string;
    items?: MenuItem[];
    isActive?: boolean;
}

export interface StoreMenuUpdateInput extends Partial<StoreMenuCreateInput> {
    id: string;
}

// Product types for menu selection
export interface Product {
    id: string;
    name: string;
    price?: number;
    type: 'coffee' | 'bottledDrink' | 'dish';
    originalId?: string;
    originalName?: string;
    weight?: number; // Cho coffee
    volume?: number; // Cho bottled drink
    codeCoffee?: string; // Mã coffee
    productCode?: string; // Mã bottled drink
    code?: string; // Mã dish
    unit?: string; // Đơn vị dish
} 