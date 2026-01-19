import { useState } from 'react';

interface AnnotationProps {
  label: string;
  color: string;
  page: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onSelect?: () => void;
  onDelete?: () => void;
}

export function Annotation({
  label,
  color,
  page,
  boundingBox: _boundingBox,
  onSelect,
  onDelete,
}: AnnotationProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-gray-900 dark:text-white">
          {label}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page {page}
        </span>
        {isHovered && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}