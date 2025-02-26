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
  lat: number;
  lon: number;
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
} 