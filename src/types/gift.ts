export interface GiftUserSummary {
  userId: string;
  name?: string;
  phone?: string;
  assignmentId?: string;
  assignedAt?: string | null;
  redeemedAt?: string | null;
  storeId?: string;
  storeName?: string;
  cycleKey?: string;
  expiresAt?: string | null;
}

export interface GiftStoreAllocation {
  storeId: string;
  storeName: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
}

export interface GiftResetConfig {
  enabled: boolean;
  dailyResetHour: number;
  dailyResetMinute: number;
  lastResetAt?: string;
}

export interface Gift {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  storeAllocations?: GiftStoreAllocation[];
  resetConfig?: GiftResetConfig;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
  assignedUsers?: Array<string | GiftUserSummary>;
  redeemedUsers?: Array<string | GiftUserSummary>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GiftAssignment {
  assignmentId: string;
  giftId: string;
  userId: string;
  storeId?: string;
  storeName?: string;
  cycleKey?: string;
  status: 'assigned' | 'redeemed' | 'expired';
  assignedAt?: string | null;
  redeemedAt?: string | null;
  expiresAt?: string | null;
  qrTarget?: string;
  qrQuery?: string;
  qrCode?: string;
  qrCodeBranded?: string;
  qr?: string;
  userInfo?: {
    name?: string;
    phone?: string;
  };
  metadata?: {
    source?: string;
    messageId?: string;
    [key: string]: any;
  };
  gift?: Gift;
}

export interface GiftStatus {
  hasAssignment: boolean;
  assignmentId: string | null;
  status: 'assigned' | 'redeemed' | 'expired' | null;
  redeemedAt: string | null;
  expiresAt?: string | null;
  cycleKey?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  assignment?: GiftAssignment | null;
  gift?: {
    id: string;
    name: string;
    description?: string;
  };
  user?: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface AssignGiftRequest {
  giftId: string;
  userId: string;
  storeId: string;
  storeName?: string;
  userInfo?: {
    name?: string;
    phone?: string;
  };
  metadata?: {
    source?: string;
    messageId?: string;
    [key: string]: any;
  };
}

export interface RedeemGiftRequest {
  giftId?: string;
  userId?: string;
  assignmentId?: string;
  storeId?: string;
}

export interface GiftQRCodeResponse {
  assignmentId?: string;
  status?: 'assigned' | 'redeemed' | 'expired';
  storeId?: string;
  storeName?: string;
  qrCode?: string;
  qrCodeBranded?: string;
  qr?: string;
  qrTarget?: string;
  qrQuery?: string;
  expiresAt?: string | null;
}
