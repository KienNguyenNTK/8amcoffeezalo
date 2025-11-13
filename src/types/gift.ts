export interface Gift {
  id: string;                     
  name: string;                   
  description: string;            
  totalQuantity: number;          
  availableQuantity: number;      
  assignedCount: number;          
  usedQuantity: number;          
  assignedUsers: string[];       
  redeemedUsers: string[];      
  createdAt: string;              
  updatedAt: string;             
}

export interface GiftAssignment {
  assignmentId: string;
  giftId: string;
  userId: string;
  status: 'assigned' | 'redeemed';
  assignedAt: string;
  redeemedAt?: string | null;
  qrTarget: string;
  qrQuery: string;
  qrCode: string; // Base64 data URL
  userInfo?: {
    name: string;
    phone: string;
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
  status: 'assigned' | 'redeemed' | null;
  redeemedAt: string | null;
  gift: {
    id: string;
    name: string;
    description: string;
  };
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}