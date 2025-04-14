export interface DishInfo {
    code: string;
    name: string;
    price: number;
    isActive: boolean;  // Thêm trường isActive để kiểm tra món có được chọn không
}

export interface CustomizationGroup {
    groupName: string;     // Tên nhóm
    isRequired: boolean;   // Yêu cầu chọn
    limit: number;         // Giới hạn chọn
    dishCodes: DishInfo[]; // Mã món theo nhóm
}

export interface Customization {
    id?: string;           // ID
    name: string;          // Tên
    city: string;          // Thành phố
    dishCode: string[];    // Mã món áp dụng
    groups: CustomizationGroup[]; // Các nhóm tùy chọn
} 