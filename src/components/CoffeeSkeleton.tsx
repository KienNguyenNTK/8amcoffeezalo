import React from "react";

const CoffeeSkeleton = ({ height = 300 }: { height?: number }) => {
  return (
    <div className="w-full aspect-[3/4] bg-gray-300 animate-pulse rounded-lg" style={{ height: `${height}px` }}></div>
  );
    };

export default CoffeeSkeleton; 