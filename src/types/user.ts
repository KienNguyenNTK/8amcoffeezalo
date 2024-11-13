interface User {
  id?: string;
  phoneNumber: string;
  name: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type { User }; 