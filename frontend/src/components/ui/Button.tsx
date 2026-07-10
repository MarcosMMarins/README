import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantCls = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-gray-400',
  outline:   'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-gray-400 shadow-sm',
};

const sizeCls = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2   gap-2',
  lg: 'text-sm px-5   py-2.5 gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
