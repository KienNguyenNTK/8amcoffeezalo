export interface ShippingRange {
  minDistance: number;
  maxDistance: number;
  fee: number;
}

export interface StoreLocation {
  address: string;
  lat: number;
  lon: number;
}

export interface ShippingConfig {
  id?: string;
  ranges: ShippingRange[];
  maxFee: number; // Maximum shipping fee cap
  enableMaxFee: boolean; // Whether to apply maximum fee cap
  storeLocation: StoreLocation;
  updatedAt?: string;
  createdAt?: string;
  thresholdDistance?: number; // Distance threshold for special pricing
  feePerKm?: number; // Fee per kilometer beyond the threshold
  isThresholdDistance?: boolean; // Whether to apply threshold distance
} 