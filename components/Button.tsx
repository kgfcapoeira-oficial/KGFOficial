import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white shadow-md shadow-blue-300/40",
    secondary: "bg-sky-100 hover:bg-sky-200 text-gray-900 border border-sky-200",
    outline: "border-2 border-blue-600 text-blue-700 hover:bg-blue-50",
    danger: "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300",
    ghost: "bg-transparent hover:bg-sky-100 text-gray-600 hover:text-gray-900"
  };

  const currentSizeClass = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.md;
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${currentSizeClass} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};