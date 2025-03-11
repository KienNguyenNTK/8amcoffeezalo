export interface ShippingRange {
  minDistance: number;
  maxDistance: number;
  fee: number;
}

export interface StoreLocation {
  id?: string; // Add ID for each location
  address: string;
  province: string;
  district: string;
  ward: string;
  street: string;
}

export interface ShippingConfig {
  id?: string;
  ranges: ShippingRange[];
  maxFee: number; // Maximum shipping fee cap
  enableMaxFee: boolean; // Whether to apply maximum fee cap
  storeLocations: StoreLocation[]; // Changed from storeLocation to storeLocations array
  updatedAt?: string;
  createdAt?: string;
  thresholdDistance?: number; // Distance threshold for special pricing
  feePerKm?: number; // Fee per kilometer beyond the threshold
  isThresholdDistance?: boolean; // Whether to apply threshold distance
  enableSurcharge?: boolean; // Whether to apply surcharge
  surchargeAmount?: number; // Amount of surcharge if enabled
  enableFeeDiscount?: boolean; // Whether to apply fee discount
  feeDiscountAmount?: number; // Amount of fee discount if enabled
  enableFreeShipping?: boolean; // Whether to enable free shipping
} 