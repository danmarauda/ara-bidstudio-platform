import { useState, useEffect } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className = '',
}: DialogProps) {
  const [isVisible, setIsVisible] = useState(open);
  
  useEffect(() => {
    if (open) {
      setIsVisible(true);
    }
  }, [open]);
  
  const handleAnimationEnd = () => {
    if (!open) {
      setIsVisible(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        open ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-200 ease-in-out`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
        onClick={() => onOpenChange(false)}
      />
      
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto ${
          open ? 'animate-in zoom-in duration-200' : 'animate-out zoom-out duration-200'
        } ${className}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}