import { useState } from 'react';

interface CorpusCardProps {
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function CorpusCard({
  name,
  description,
  documentCount,
  createdAt,
  onEdit,
  onDelete,
  onView,
}: CorpusCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-200 hover:shadow-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h3>
        {isHovered && (
          <div className="flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Edit
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
        {description}
      </p>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between">
          <span>{documentCount} documents</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}