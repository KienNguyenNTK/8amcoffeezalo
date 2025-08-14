export interface Brewer {
  id: string;
  product_name: string; // Tên sản phẩm (Máy Pha Cà Phê Outin Nano Portable Espresso Machine)
  info: string; // Thông tin chi tiết về máy
  weight: string; // Khối lượng (ví dụ: "670g")
  heating_time: string; // Thời gian làm nóng (ví dụ: "180s")
  max_temperature: string; // Nhiệt độ tối đa (ví dụ: "96 celcius")
  max_pressure: string; // Áp suất tối đa (ví dụ: "20 bar")
  usage_limit: string; // Giới hạn sử dụng (ví dụ: "cold water: 5 times, hot water: 100 times")
  battery_capacity: string; // Dung lượng pin (ví dụ: "7500mah")
  color: string; // Màu sắc (ví dụ: "space grey, forest green, teal, pearl white, fuchsia pink")
  brewing_method: string; // Phương pháp pha (ví dụ: "capsule, ground coffee")
  max_water_volume: string; // Dung tích nước tối đa (ví dụ: "80ml")
  manufacture: string; // Nhà sản xuất (ví dụ: "outln")
  price: number; // Giá bán (VND)
  professional_standards: string; // Tiêu chuẩn chuyên nghiệp (ví dụ: "European Certified Materials")
  charging_options: string; // Tùy chọn sạc (ví dụ: "usb-c, 24V Car Charger")
  special_features: string; // Tính năng đặc biệt (ví dụ: "self heating, rich crema")
  warranty: string; // Bảo hành (ví dụ: "12 months")
  made_in: string; // Xuất xứ (ví dụ: "china")
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

export interface CreateBrewerRequest {
  product_name: string;
  info: string;
  weight: string;
  heating_time: string;
  max_temperature: string;
  max_pressure: string;
  usage_limit: string;
  battery_capacity: string;
  color: string;
  brewing_method: string;
  max_water_volume: string;
  manufacture: string;
  price: number;
  professional_standards: string;
  charging_options: string;
  special_features: string;
  warranty: string;
  made_in: string;
  images?: string[];
  driveImages?: { fileId: string; webViewLink: string; fileName: string; }[];
  status?: 'active' | 'inactive' | 'maintenance';
  location?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

export interface UpdateBrewerRequest extends CreateBrewerRequest {
  id: string;
}