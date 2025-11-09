import { coffeeService } from '../firebase/coffeeService';
import { DishService } from '../firebase/dishService';
import { bottledDrinkService } from '../firebase/bottledDrinkService';
import { CoffeeEquipmentService } from '../firebase/coffeeEquipmentService';
import { notification } from 'antd';

const dishService = new DishService();
const coffeeEquipmentService = new CoffeeEquipmentService();

export type ProductType = 'coffee' | 'dish' | 'drink' | 'coffee_equipment';

export interface ProductValidationResult {
  exists: boolean;
  product?: any;
}

export const productValidationService = {
  /**
   * Kiểm tra sản phẩm có tồn tại trong database không
   */
  async validateProduct(productId: string, productType: ProductType): Promise<ProductValidationResult> {
    try {
      let product = null;
      
      switch (productType) {
        case 'coffee':
          product = await coffeeService.getCoffeeById(productId);
          break;
        case 'dish':
          product = await dishService.getDishById(productId);
          break;
        case 'drink':
          product = await bottledDrinkService.getBottledDrinkById(productId);
          break;
        case 'coffee_equipment':
          const equipmentList = await coffeeEquipmentService.getAllEquipment();
          product = equipmentList.find(e => e.id === productId) || null;
          break;
        default:
          return { exists: false };
      }
      
      return {
        exists: product !== null,
        product
      };
    } catch (error) {
      console.error('Error validating product:', error);
      return { exists: false };
    }
  },

  /**
   * Kiểm tra và navigate đến trang chi tiết sản phẩm
   * Hiển thị thông báo lỗi nếu sản phẩm không tồn tại
   */
  async validateAndNavigate(
    productId: string, 
    productType: ProductType, 
    navigate: (path: string) => void,
    productName?: string
  ): Promise<boolean> {
    // Hiển thị loading state (có thể thêm sau)
    
    const validation = await this.validateProduct(productId, productType);
    
    if (!validation.exists) {
      // Hiển thị thông báo lỗi
      notification.error({
        message: 'Sản phẩm không tồn tại',
        description: productName 
          ? `"${productName}" đã hết hàng hoặc không còn được bán nữa.`
          : 'Sản phẩm này đã hết hàng hoặc không còn được bán nữa.',
        duration: 3,
        placement: 'top',
        closable: false
      });
      return false;
    }
    
    // Sản phẩm tồn tại, navigate đến trang chi tiết
    const routePath = this.getRoutePath(productType, productId);
    navigate(routePath);
    return true;
  },

  /**
   * Lấy route path cho từng loại sản phẩm
   */
  getRoutePath(productType: ProductType, productId: string): string {
    switch (productType) {
      case 'coffee':
        return `/coffee/${productId}`;
      case 'dish':
        return `/dish/${productId}`;
      case 'drink':
        return `/bottled-drink/${productId}`;
      case 'coffee_equipment':
        return `/coffee-equipment/${productId}`;
      default:
        return '/';
    }
  },

  /**
   * Batch validate nhiều sản phẩm cùng lúc
   * Hữu ích cho việc validate danh sách favorites, recently viewed, etc.
   */
  async batchValidateProducts(
    products: Array<{ id: string; type: ProductType; name?: string }>
  ): Promise<Array<{ id: string; type: ProductType; exists: boolean; name?: string }>> {
    const validationPromises = products.map(async (product) => {
      const validation = await this.validateProduct(product.id, product.type);
      return {
        id: product.id,
        type: product.type,
        exists: validation.exists,
        name: product.name
      };
    });
    
    return Promise.all(validationPromises);
  }
};
