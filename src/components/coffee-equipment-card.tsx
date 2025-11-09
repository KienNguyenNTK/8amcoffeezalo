import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoffeeEquipment } from '../types/coffeeEquipment';

interface CoffeeEquipmentCardProps {
  equipment: CoffeeEquipment;
  width?: number;
  height?: number;
  fontTitle?: number;
  fontName?: number;
  isShowLike?: boolean;
  userInfo?: any;
}

const CoffeeEquipmentCard: React.FC<CoffeeEquipmentCardProps> = ({
  equipment,
  width = 200,
  height = 280,
  fontTitle = 14,
  fontName = 16,
  isShowLike = true,
  userInfo
}) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!equipment.id) return;
    
    // Import validation service
    const { productValidationService } = await import('../services/productValidationService');
    
    // Kiểm tra sản phẩm tồn tại trước khi navigate
    await productValidationService.validateAndNavigate(
      equipment.id, 
      'coffee_equipment', 
      navigate,
      getEquipmentName()
    );
  };

  const getImageUrl = () => {
    if (equipment.images && equipment.images.length > 0) {
      return equipment.images[0];
    }
    if (equipment.driveImages && equipment.driveImages.length > 0) {
      return `https://lh3.googleusercontent.com/d/${equipment.driveImages[0].fileId}?authuser=server`;
    }
    return '';
  };

  const getEquipmentName = () => {
    const nameField = equipment.values.find(v => v.name.toLowerCase().includes('tên') || v.name.toLowerCase().includes('name'));
    return nameField?.value || equipment.categoryName || 'Dụng cụ cà phê';
  };

  const getPriceValue = () => {
    const priceField = equipment.values.find(v => v.name.toLowerCase().includes('giá') || v.name.toLowerCase().includes('price'));
    return priceField?.value;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md cursor-pointer"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      onClick={handleClick}
    >
      <div className="relative p-3">
        {/* Category badge */}
        <div 
          className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-lg mb-2 text-center"
          style={{ fontSize: `${fontTitle}px` }}
        >
          {equipment.categoryName}
        </div>

        {/* Product image */}
        <div className="flex justify-center mb-3">
          <img
            src={getImageUrl()}
            alt={getEquipmentName()}
            className="object-cover rounded-lg"
            style={{
              width: `${width - 40}px`,
              height: `${(height - 120)}px`,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/src/public/images/coffee.jpg'; // fallback image
            }}
          />
        </div>

        {/* Product name */}
        <h3 
          className="font-semibold text-gray-900 text-center mb-2 line-clamp-2"
          style={{ fontSize: `${fontName}px` }}
          title={getEquipmentName()}
        >
          {getEquipmentName()}
        </h3>

        {/* Price */}
        {getPriceValue() && (
          <div className="text-center">
            <span className="text-lg font-bold text-red-600">
              {typeof getPriceValue() === 'number' 
                ? getPriceValue().toLocaleString('vi-VN') + ' đ'
                : getPriceValue()
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeEquipmentCard;
