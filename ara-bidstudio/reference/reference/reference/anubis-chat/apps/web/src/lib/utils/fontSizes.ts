/**
 * Font size utilities for dynamic sizing based on user preferences
 */

export type FontSize = 'small' | 'medium' | 'large';

export interface FontSizeClasses {
  messageContent: string;
  messageHeader: string;
  dateSeparator: string;
  inputText: string;
  characterCount: string;
  recordingText: string;
}

/**
 * Get font size classes based on user preference
 */
export function getFontSizeClasses(
  fontSize: FontSize = 'medium'
): FontSizeClasses {
  switch (fontSize) {
    case 'small':
      return {
        // Current ultra-compact sizes (what we implemented)
        messageContent: 'text-[11px] sm:text-xs',
        messageHeader: 'text-[9px] sm:text-[10px]',
        dateSeparator: 'text-[8px] sm:text-[10px] md:text-[11px]',
        inputText: 'text-xs sm:text-sm',
        characterCount: 'text-[10px] sm:text-xs',
        recordingText: 'text-xs sm:text-sm',
      };
    case 'medium':
      return {
        // Slightly larger than small
        messageContent: 'text-xs sm:text-sm',
        messageHeader: 'text-[10px] sm:text-xs',
        dateSeparator: 'text-[9px] sm:text-xs md:text-sm',
        inputText: 'text-sm sm:text-base',
        characterCount: 'text-xs sm:text-sm',
        recordingText: 'text-sm sm:text-base',
      };
    case 'large':
      return {
        // Standard comfortable reading sizes
        messageContent: 'text-sm sm:text-base',
        messageHeader: 'text-xs sm:text-sm',
        dateSeparator: 'text-xs sm:text-sm md:text-base',
        inputText: 'text-base sm:text-lg',
        characterCount: 'text-sm sm:text-base',
        recordingText: 'text-base sm:text-lg',
      };
    default:
      return getFontSizeClasses('medium');
  }
}
