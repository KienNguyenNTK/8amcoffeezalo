export interface CoffeeEquipmentCategory {
  id: string;
  name: string; // Tên loại dụng cụ (Máy pha cà phê, Máy xay cà phê, Bình pha, v.v.)
  description?: string; // Mô tả loại dụng cụ
  fields: CoffeeEquipmentField[]; // Các trường thông tin của loại dụng cụ này
  createdAt: Date;
  updatedAt: Date;
}

export interface CoffeeEquipmentField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'number_range' | 'textarea' | 'date' | 'select' | 'checkbox' | 'radio' | 'range' | 'rating' | 'image' | 'multi_input' | 'auto_text' | 'multi_checkbox';
  required: boolean;
  placeholder?: string;
  tooltip?: string;
  suffix?: string;
  
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  
  // For select/radio fields
  options?: { label: string; value: string }[];
  
  // For image fields
  multiple?: boolean;
  accept?: string;
  allowDriveUpload?: boolean;
  maxFiles?: number;
  
  // For multi_input fields
  multiInputConfig?: {
    valueKeys: string[];
    valueNames: string[];
  };
  inputs?: {
    suffix?: string;
  }[];
  
  // For multi_checkbox fields
  checkboxConfig?: {
    items: { id: string; label: string }[];
  };
  
  // For auto_text fields
  autoConfig?: {
    prefix: string;
    length: number;
  };
  
  // Default value
  defaultValue?: any;
}

export interface CoffeeEquipment {
  id: string;
  categoryId: string; // ID của loại dụng cụ
  categoryName: string; // Tên loại dụng cụ (để dễ hiển thị)
  values: Array<{
    id: string;
    name: string;
    value: any;
    type: 'text' | 'number' | 'number_range' | 'textarea' | 'date' | 'select' | 'checkbox' | 'radio' | 'range' | 'rating' | 'image' | 'multi_input' | 'auto_text' | 'multi_checkbox';
    tooltip?: string;
  }>;
  images?: string[]; // Ảnh từ Firebase Storage
  driveImages?: { fileId: string; webViewLink: string; fileName: string; }[]; // Ảnh từ Google Drive
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCoffeeEquipmentCategoryRequest {
  name: string;
  description?: string;
  fields: CoffeeEquipmentField[];
}

export interface UpdateCoffeeEquipmentCategoryRequest extends CreateCoffeeEquipmentCategoryRequest {
  id: string;
}

export interface CreateCoffeeEquipmentRequest {
  categoryId: string;
  values: Array<{
    id: string;
    name: string;
    value: any;
    type: 'text' | 'number' | 'number_range' | 'textarea' | 'date' | 'select' | 'checkbox' | 'radio' | 'range' | 'rating' | 'image' | 'multi_input' | 'auto_text' | 'multi_checkbox';
    tooltip?: string;
  }>;
  images?: string[];
  driveImages?: { fileId: string; webViewLink: string; fileName: string; }[];
}

export interface UpdateCoffeeEquipmentRequest extends CreateCoffeeEquipmentRequest {
  id: string;
}
