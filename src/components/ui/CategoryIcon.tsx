import React from 'react';
import { Category } from '@/types/expense';
import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  category: Category | string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, ...props }) => {
  switch (category) {
    case 'Food':
      return <Utensils {...props} />;
    case 'Transportation':
      return <Car {...props} />;
    case 'Entertainment':
      return <Film {...props} />;
    case 'Shopping':
      return <ShoppingBag {...props} />;
    case 'Bills':
      return <Receipt {...props} />;
    case 'Other':
    default:
      return <HelpCircle {...props} />;
  }
};
