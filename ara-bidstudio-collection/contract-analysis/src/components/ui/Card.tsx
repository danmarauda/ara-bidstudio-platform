import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';