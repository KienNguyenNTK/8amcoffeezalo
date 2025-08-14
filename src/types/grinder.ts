export interface CoffeeGrinder {
  id: string;
  product_name: string; // Tên sản phẩm (Cối xay điện OutIn Fino Portable Electric Espresso Coffee Grinder)
  info: string; // Thông tin chi tiết về sản phẩm
  weight: string; // Khối lượng (ví dụ: "690g")
  size_diameter: string; // Đường kính (ví dụ: "73mm")
  size_height: string; // Chiều cao (ví dụ: "199mm")
  battery_capacity: string; // Dung lượng pin (ví dụ: "1000mah")
  max_capacity: string; // Dung tích tối đa (ví dụ: "25g")
  grind_setting_count: string; // Số cấp độ xay (ví dụ: "28")
  burr_diameter: string; // Đường kính lưỡi xay (ví dụ: "38mm")
  material: string; // Vật liệu (ví dụ: "food grade plastic, aluminum, silicone")
  charging_time: string; // Thời gian sạc (ví dụ: "1 hour")
  color: string; // Màu sắc (ví dụ: "white, brown")
  special_feature: string; // Tính năng đặc biệt (ví dụ: "Auto-stop, Clog-Protection")
  price: number; // Giá bán (VND)
  manufacture: string; // Nhà sản xuất (ví dụ: "outln")
  images?: string[]; // Mảng URL hình ảnh
  driveImages?: { fileId: string; webViewLink: string; fileName: string; }[]; // Hình ảnh từ Google Drive
  status?: 'active' | 'inactive' | 'maintenance'; // Trạng thái (optional)
  location?: string; // Vị trí đặt máy (optional)
  purchase_date?: string; // Ngày mua (optional)
  warranty_expiry?: string; // Hết hạn bảo hành (optional)
  notes?: string; // Ghi chú (optional)
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoffeeGrinderRequest {
  product_name: string;
  info: string;
  weight: string;
  size_diameter: string;
  size_height: string;
  battery_capacity: string;
  max_capacity: string;
  grind_setting_count: string;
  burr_diameter: string;
  material: string;
  charging_time: string;
  color: string;
  special_feature: string;
  price: number;
  manufacture: string;
  images?: string[];
  driveImages?: { fileId: string; webViewLink: string; fileName: string; }[];
  status?: 'active' | 'inactive' | 'maintenance';
  location?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

export interface UpdateCoffeeGrinderRequest extends CreateCoffeeGrinderRequest {
  id: string;
}

// Backward compatibility
export type Grinder = CoffeeGrinder;
export type CreateGrinderRequest = CreateCoffeeGrinderRequest;
export type UpdateGrinderRequest = UpdateCoffeeGrinderRequest;