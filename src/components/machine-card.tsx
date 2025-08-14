import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoffeeGrinder } from '../types/grinder';
import { Brewer } from '../types/brewer';

interface MachineCardProps {
  machine: CoffeeGrinder | Brewer;
  type: 'grinder' | 'brewer';
  width?: number;
  height?: number;
  fontTitle?: number;
  fontName?: number;
  isShowLike?: boolean;
  userInfo?: any;
}

const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  type,
  width = 200,
  height = 280,
  fontTitle = 14,
  fontName = 16,
  isShowLike = true,
  userInfo
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === 'grinder') {
      navigate(`/grinder/${machine.id}`);
    } else {
      navigate(`/brewer/${machine.id}`);
    }
  };

  const getImageUrl = () => {
    if (machine.images && machine.images.length > 0) {
      return machine.images[0];
    }
    if (machine.driveImages && machine.driveImages.length > 0) {
      return `https://lh3.googleusercontent.com/d/${machine.driveImages[0].fileId}?authuser=server`;
    }
    return '';
  };

  const getMachineType = () => {
    return type === 'grinder' ? 'Máy xay cà phê' : 'Máy pha cà phê';
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      style={{ width, height }}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative" style={{ height: height * 0.6 }}>
        {getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt={machine.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,3C13.11,3 14,3.89 14,5H22V7H20V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V7H2V5H10C10,3.89 10.89,3 12,3M6,19H18V7H6V19M8,9H16V11H8V9M8,12H16V14H8V12M8,15H13V17H8V15Z" />
              </svg>
              <span className="text-xs">Chưa có ảnh</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3" style={{ height: height * 0.4 }}>
        <div className="flex flex-col h-full">
          {/* Machine type */}
          <div 
            className="text-gray-500 text-xs mb-1"
            style={{ fontSize: fontTitle }}
          >
            {getMachineType()}
          </div>

          {/* Product name */}
          <div 
            className="text-gray-900 font-bold line-clamp-2 flex-1"
            style={{ fontSize: fontName }}
            title={machine.product_name}
          >
            {machine.product_name}
          </div>

          {/* Manufacturer */}
          <div className="text-gray-600 text-xs mb-2">
            {machine.manufacture}
          </div>

          {/* Price */}
          <div className="text-orange-600 font-bold text-lg">
            {machine.price.toLocaleString()}đ
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineCard;
