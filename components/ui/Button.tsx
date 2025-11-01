// components/ui/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ai';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-green-600 text-white hover:bg-green-700',
  secondary: 'bg-white hover:bg-green-50 border border-gray-300 text-gray-700',
  ai: 'bg-teal-500 text-white hover:bg-teal-600',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  return (
    <button
      className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold transition-colors disabled:bg-opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
