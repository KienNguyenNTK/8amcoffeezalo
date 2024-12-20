interface User {
  id?: string;
  phoneNumber: string;
  name: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  zaloUserId?: string;
  lstPoint?: { orderId: string; point: number, date: Date }[]; // Add this line
  localId?: string; // Add this line
  isFollowed?: boolean;
  avatar?: string;
}

export type { User };   