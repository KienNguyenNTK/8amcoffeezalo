import React from 'react';
import {
  CoffeeOutlined,
  FireOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  CloudOutlined,
  ShopOutlined,
  ShoppingOutlined,
  ToolOutlined,
  FilterOutlined,
  CrownOutlined,
  StarOutlined,
  TrophyOutlined,
  HeartOutlined,
  SmileOutlined,
  SunOutlined,
  GiftOutlined,
  TagOutlined,
  RocketOutlined,
  BulbOutlined,
  CompassOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

interface CategoryIconProps {
  iconName?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  className = '',
  style = {},
  size,
  color,
}) => {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(size ? { fontSize: size } : {}),
    ...(color ? { color } : {}),
  };

  switch (iconName) {
    case 'FireOutlined':
      return <FireOutlined className={className} style={mergedStyle} />;
    case 'ExperimentOutlined':
      return <ExperimentOutlined className={className} style={mergedStyle} />;
    case 'ThunderboltOutlined':
      return <ThunderboltOutlined className={className} style={mergedStyle} />;
    case 'BranchesOutlined':
      return <BranchesOutlined className={className} style={mergedStyle} />;
    case 'CloudOutlined':
      return <CloudOutlined className={className} style={mergedStyle} />;
    case 'ShopOutlined':
      return <ShopOutlined className={className} style={mergedStyle} />;
    case 'ShoppingOutlined':
      return <ShoppingOutlined className={className} style={mergedStyle} />;
    case 'ToolOutlined':
      return <ToolOutlined className={className} style={mergedStyle} />;
    case 'FilterOutlined':
      return <FilterOutlined className={className} style={mergedStyle} />;
    case 'CrownOutlined':
      return <CrownOutlined className={className} style={mergedStyle} />;
    case 'StarOutlined':
      return <StarOutlined className={className} style={mergedStyle} />;
    case 'TrophyOutlined':
      return <TrophyOutlined className={className} style={mergedStyle} />;
    case 'HeartOutlined':
      return <HeartOutlined className={className} style={mergedStyle} />;
    case 'SmileOutlined':
      return <SmileOutlined className={className} style={mergedStyle} />;
    case 'SunOutlined':
      return <SunOutlined className={className} style={mergedStyle} />;
    case 'GiftOutlined':
      return <GiftOutlined className={className} style={mergedStyle} />;
    case 'TagOutlined':
      return <TagOutlined className={className} style={mergedStyle} />;
    case 'RocketOutlined':
      return <RocketOutlined className={className} style={mergedStyle} />;
    case 'BulbOutlined':
      return <BulbOutlined className={className} style={mergedStyle} />;
    case 'CompassOutlined':
      return <CompassOutlined className={className} style={mergedStyle} />;
    case 'AppstoreOutlined':
      return <AppstoreOutlined className={className} style={mergedStyle} />;
    case 'CoffeeOutlined':
    default:
      return <CoffeeOutlined className={className} style={mergedStyle} />;
  }
};

export default CategoryIcon;
