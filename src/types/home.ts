import { CoffeeBean } from './coffee';
import { BottledDrink } from './bottledDrink';
import { CoffeeCollection } from './collection';
import { Dish } from './dish';

export interface HomeItem {
  id: string;
  type: 'coffee' | 'drink' | 'collection' | 'dish';
  item: CoffeeBean | BottledDrink | CoffeeCollection | Dish;
  isVisible: boolean;
  order: number;
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
} 