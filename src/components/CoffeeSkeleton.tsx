import React from "react";

interface CoffeeSkeletonProps {
  height?: number | string;
  width?: number | string;
}

const CoffeeSkeleton: React.FC<CoffeeSkeletonProps> = ({ height, width }) => {
  return (
    <div
      className="relative bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-[3/4] flex flex-col justify-end p-3 animate-pulse"
      style={{
        height: height ? (typeof height === 'number' ? `${height}px` : height) : '100%',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
      }}
    >
      {/* Top placeholder badge */}
      <div className="absolute top-3 left-3 w-16 h-5 bg-gray-200 rounded-full"></div>

      {/* Shimmer gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

      {/* Bottom text placeholders */}
      <div className="relative z-10 space-y-2">
        <div className="w-20 h-3 bg-gray-200/80 rounded"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
        <div className="w-16 h-3 bg-gray-200/90 rounded"></div>
      </div>
    </div>
  );
};

export default CoffeeSkeleton;