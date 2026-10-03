import React from 'react';
import { Category } from '@/types/expense';
import { CATEGORY_CONFIG } from '@/utils/constants';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
}) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors font-medium ${config.bgLight} ${config.borderLight} ${sizeClasses[size]}`}
    >
      {showIcon && <CategoryIcon category={category} className={iconSizes[size]} />}
      <span>{config.name}</span>
    </span>
  );
};
