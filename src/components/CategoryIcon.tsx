import React from 'react';
import {
  ShoppingCart,
  Utensils,
  ShoppingBag,
  Fuel,
  Tv,
  Home,
  HeartPulse,
  Plane,
  Sparkles,
  Tag,
  CreditCard,
  Building,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5' }) => {
  const norm = (name || '').toLowerCase();

  if (norm.includes('shop') || norm.includes('retail') || norm.includes('amazon')) {
    return <ShoppingBag className={className} />;
  }
  if (norm.includes('groc') || norm.includes('market') || norm.includes('costco') || norm.includes('cart')) {
    return <ShoppingCart className={className} />;
  }
  if (norm.includes('din') || norm.includes('food') || norm.includes('restaurant') || norm.includes('cafe')) {
    return <Utensils className={className} />;
  }
  if (norm.includes('gas') || norm.includes('transport') || norm.includes('fuel') || norm.includes('car')) {
    return <Fuel className={className} />;
  }
  if (norm.includes('sub') || norm.includes('stream') || norm.includes('tech') || norm.includes('tv')) {
    return <Tv className={className} />;
  }
  if (norm.includes('home') || norm.includes('garden') || norm.includes('hardware')) {
    return <Home className={className} />;
  }
  if (norm.includes('health') || norm.includes('wellness') || norm.includes('med') || norm.includes('care')) {
    return <HeartPulse className={className} />;
  }
  if (norm.includes('travel') || norm.includes('flight') || norm.includes('hotel') || norm.includes('plane')) {
    return <Plane className={className} />;
  }
  if (norm.includes('entertain') || norm.includes('fun') || norm.includes('movie')) {
    return <Sparkles className={className} />;
  }
  if (norm.includes('card')) {
    return <CreditCard className={className} />;
  }
  if (norm.includes('bank')) {
    return <Building className={className} />;
  }
  if (norm.includes('tag')) {
    return <Tag className={className} />;
  }

  return <HelpCircle className={className} />;
};
