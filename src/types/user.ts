interface User {
  id?: string;
  phoneNumber: string;
  name: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  zaloUserId?: string;
  lstPoint?: { orderId: string; point: number, date: Date }[];
  localId?: string;
  isFollowed?: boolean;
  avatar?: string;
  orderCode?: string;
  listOrderCodes?: Array<{
    code: string;
    time: Date;
  }>;
}

export type { User };   