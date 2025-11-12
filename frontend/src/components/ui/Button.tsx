import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    children, 
    disabled, 
    icon,
    iconPosition = 'left',
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group';
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5',
      secondary: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-500 shadow-sm hover:shadow-md',
      danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 focus-visible:ring-red-500 shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus-visible:ring-green-500 shadow-lg hover:shadow-xl hover:shadow-green-500/25 hover:-translate-y-0.5',
      outline: 'border-2 border-blue-200 bg-transparent text-blue-600 hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-blue-500 hover:shadow-md',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
      gradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 focus-visible:ring-purple-500 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5',
    };

    const sizes = {
      xs: 'h-7 px-2 text-xs rounded-lg sm:px-3',
      sm: 'h-8 px-3 text-sm rounded-lg sm:px-4',
      md: 'h-10 px-3 text-sm rounded-xl sm:px-4 md:px-5',
      lg: 'h-12 px-4 text-base rounded-xl sm:px-6 md:px-8',
      xl: 'h-14 px-6 text-lg rounded-2xl sm:px-8 md:px-10',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -top-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        <div className="relative flex items-center justify-center space-x-2">
          {/* Loading spinner */}
          {isLoading && (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          
          {/* Left icon */}
          {!isLoading && icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          
          {/* Button text */}
          <span>{children}</span>
          
          {/* Right icon */}
          {!isLoading && icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
