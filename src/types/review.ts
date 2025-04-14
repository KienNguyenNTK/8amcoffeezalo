import { Order } from "./order";
import { User } from "./user";

interface Review {
    id?: string;
    user: User;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    coffeeId?: string;
    drinkId?: string;
    dishId?: string;
}

export type { Review };