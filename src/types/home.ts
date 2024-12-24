import { CoffeeBean } from './coffee';
import { BottledDrink } from './bottledDrink';
import { CoffeeCollection } from './collection';

export interface HomeItem {
  id: string;
  type: 'coffee' | 'drink' | 'collection';
  item: CoffeeBean | BottledDrink | CoffeeCollection;
  isVisible: boolean;
  order: number;
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
} 