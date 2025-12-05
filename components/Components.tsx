import React from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all active:scale-95 duration-200";
  
  const variants = {
    primary: "bg-burgundy-800 text-white hover:bg-burgundy-900 shadow-lg shadow-burgundy-900/20",
    secondary: "bg-burgundy-100 text-burgundy-900 hover:bg-burgundy-200",
    outline: "border-2 border-burgundy-800 text-burgundy-800 hover:bg-burgundy-50",
    ghost: "text-gray-500 hover:text-burgundy-800 hover:bg-gray-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  active?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, active }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
    active ? 'bg-burgundy-800 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
  }`}>
    {children}
  </span>
);

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ 
  quantity, 
  onIncrease, 
  onDecrease,
  min = 1 
}) => (
  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
    <button 
      onClick={onDecrease}
      disabled={quantity <= min}
      className="p-2 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 text-burgundy-900 transition-all"
    >
      <Minus size={16} />
    </button>
    <span className="font-semibold w-8 text-center tabular-nums">{quantity}</span>
    <button 
      onClick={onIncrease}
      className="p-2 rounded-md hover:bg-white hover:shadow-sm text-burgundy-900 transition-all"
    >
      <Plus size={16} />
    </button>
  </div>
);
