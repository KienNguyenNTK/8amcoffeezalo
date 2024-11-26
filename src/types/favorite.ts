interface Favorite {
  id?: string;
  userId: string;
  coffeeId: string;
  bottledDrinkId?: string;
  createdAt?: Date;
}

export type { Favorite }; 