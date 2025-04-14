export interface Dish {
  id?: string;
  code: string;           // Mã món
  city: string;           // Thành phố
  name: string;           // Tên
  price: number;          // Giá
  isActive?: boolean;     // Trạng thái
  barcode?: string;       // Mã barcode
  sideDish?: string;      // Món ăn kèm
  isSideDishQuantityNotUpdated?: boolean; // Không cập nhật số lượng món ăn kèm
  unit: string;           // Đơn vị
  group?: string;         // Nhóm
  groupName?: string;     // Tên nhóm
  type?: string;          // Loại món
  typeName?: string;      // Tên loại
  description?: string;   // Mô tả
  sku?: string;           // SKU
  vat: number;            // VAT (%)
  preparationTime: number; // Thời gian chế biến (phút)
  
  // Cấu hình giá
  priceConfiguration: {
    allowPriceEdit: boolean; // Cho phép sửa giá khi bán
    requireQuantity: boolean;
    allowRemoveWithoutPermission: boolean;
  };
  
  isVirtualDish?: boolean;    // Cấu hình món ảo
  serviceConfiguration?: boolean; // Cấu hình món dịch vụ
  isBuffetTicket?: boolean;   // Cấu hình món ăn là vé buffet
  
  // Thời gian bán
  salesTimeFrame?: {
    hours: string[];      // Giờ
    days: string[];       // Ngày
  };
  
  displayOrder?: number;      // Thứ tự
  imageUrl?: string;          // Hình ảnh
  qrCodeFormula?: string;     // Công thức inQR cho máy pha trà
  
  // Additional fields that may not be in Excel but are needed for the app
  unit2?: string;
  priceBySourceConfiguration?: {
    source: string;
    price: number;
  }[];
  quantityPriceConfigurations?: {
    quantity: number;
    price: number;
  }[];

  purchaseCount?: number;
}