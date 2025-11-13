import React from 'react';

interface GiftTagProps {
  giftName: string;
  availableQuantity: number;
  onClick?: () => void;
}

const GiftTag: React.FC<GiftTagProps> = ({ 
  giftName, 
  availableQuantity, 
  onClick 
}) => {
  const isAvailable = availableQuantity > 0;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isAvailable
          ? 'bg-orange-100 text-orange-800 cursor-pointer hover:bg-orange-200'
          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: isAvailable ? '#fff3e0' : '#f5f5f5',
        color: isAvailable ? '#e65100' : '#9e9e9e',
      }}
    >
      🎁 {giftName}
      {isAvailable && (
        <span className="ml-2 text-xs">(còn {availableQuantity})</span>
      )}
      {!isAvailable && (
        <span className="ml-2 text-xs">(Hết quà)</span>
      )}
    </span>
  );
};

export default GiftTag;