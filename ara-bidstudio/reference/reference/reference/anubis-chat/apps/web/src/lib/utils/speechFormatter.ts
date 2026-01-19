/**
 * Speech Formatter - Lightweight NLP-style text processing for voice transcription
 * Converts spoken punctuation and formatting commands to actual punctuation
 * No external dependencies, zero latency
 */

// Punctuation mappings - spoken word to actual punctuation
// Multi-word phrases must come before single words for proper matching
const PUNCTUATION_PHRASES: [string, string][] = [
  // Multi-word punctuation (must be first for matching priority)
  ['question mark', '?'],
  ['exclamation mark', '!'],
  ['exclamation point', '!'],
  ['full stop', '.'],
  ['at sign', '@'],
  ['dollar sign', '$'],
  ['percent sign', '%'],
  ['plus sign', '+'],
  ['equals sign', '='],
  ['open quote', '"'],
  ['close quote', '"'],
  ['open quotes', '"'],
  ['close quotes', '"'],
  ['open parenthesis', '('],
  ['close parenthesis', ')'],
  ['open bracket', '['],
  ['close bracket', ']'],
  ['open brace', '{'],
  ['close brace', '}'],
  ['new line', '\n'],
  ['new paragraph', '\n\n'],

  // Single word punctuation
  ['period', '.'],
  ['dot', '.'],
  ['comma', ','],
  ['semicolon', ';'],
  ['colon', ':'],
  ['dash', '-'],
  ['hyphen', '-'],
  ['ellipsis', '...'],
  ['apostrophe', "'"],
  ['quote', '"'],
  ['quotes', '"'],
  ['parenthesis', '('],
  ['bracket', '['],
  ['brace', '{'],
  ['slash', '/'],
  ['backslash', '\\'],
  ['ampersand', '&'],
  ['hash', '#'],
  ['hashtag', '#'],
  ['asterisk', '*'],
  ['underscore', '_'],
];

// Formatting commands
const FORMATTING_COMMANDS: Record<string, (text: string) => string> = {
  // Line breaks
  'new line': (text) => `${text}\n`,
  'new paragraph': (text) => `${text}\n\n`,

  // Text formatting (these would need rich text support in the input)
  // For now, we'll just add markdown-style formatting
  bold: (text) => `${text}**`,
  italic: (text) => `${text}_`,
  code: (text) => `${text}\``,
};

// Special commands that affect the next word
const SPECIAL_COMMANDS = {
  capital: true,
  capitalize: true,
  uppercase: true,
  caps: true,
  'all caps': true,
};

/**
 * Process speech text and apply formatting
 * @param text - Raw transcribed text
 * @param isInterim - Whether this is interim (not final) text
 * @returns Formatted text with punctuation and commands applied
 */
export function formatSpeechText(text: string, _isInterim = false): string {
  if (!text) {
    return '';
  }

  let processed = text;
  const _capitalizeNext = false;
  const _uppercaseNext = false;

  // Process multi-word phrases first (longest to shortest for priority)
  for (const [phrase, replacement] of PUNCTUATION_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    processed = processed.replace(regex, (_match) => {
      // Handle special cases for line breaks - keep the space behavior
      if (phrase === 'new line') {
        return '\n';
      }
      if (phrase === 'new paragraph') {
        return '\n\n';
      }
      // For punctuation, just replace with the symbol (spacing handled later)
      return replacement;
    });
  }

  // Handle capitalization commands - don't lowercase the rest of the word
  processed = processed.replace(
    /\b(capital|capitalize|uppercase|caps|all caps)\s+(\w+)/gi,
    (_match, command, word) => {
      const cmd = command.toLowerCase();
      if (cmd === 'uppercase' || cmd === 'all caps' || cmd === 'caps') {
        return word.toUpperCase();
      }
      // Only capitalize first letter, don't change the rest
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  );

  // Clean up spacing around punctuation
  processed = processed
    // Remove spaces before punctuation
    .replace(/\s+([.!?,;:])/g, '$1')
    // Add space before opening quote if needed
    .replace(/(\w)(["'([{])/g, '$1 $2')
    // Remove spaces before closing quotes/brackets
    .replace(/\s+(["')\]}])/g, '$1')
    // Remove spaces after opening quotes/brackets
    .replace(/(["'([{])\s+/g, '$1')
    // Ensure space after sentence-ending punctuation
    .replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
    // Ensure space after comma and semicolon
    .replace(/([,;])(?=[A-Za-z])/g, '$1 ')
    // Fix colon spacing (no space for time, space for other uses)
    .replace(/:\s*(\d)/g, ':$1') // No space for time (3:30)
    .replace(/:(?=[A-Za-z])/g, ': ') // Space for other uses
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Handle special punctuation combos
    .replace(/\s*\.\s*\./g, '..') // Fix ellipsis spacing
    .replace(/\$\s*/g, '$') // Remove any space after dollar sign
    .replace(/@\s*/g, '@') // Remove any space after at sign
    // Fix decimal numbers (remove space after period in numbers)
    .replace(/(\d)\.\s+(\d)/g, '$1.$2')
    .trim();

  // Auto-capitalize first letter
  if (processed.length > 0) {
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
  }

  // Auto-capitalize after sentence endings
  processed = processed.replace(
    /([.!?])\s+([a-z])/g,
    (_match, punct, letter) => {
      return `${punct} ${letter.toUpperCase()}`;
    }
  );

  // Auto-capitalize after line breaks
  processed = processed.replace(/\n+\s*([a-z])/g, (match, letter) => {
    return match.replace(letter, letter.toUpperCase());
  });

  return processed;
}

/**
 * Get a list of available voice commands for user reference
 */
export function getVoiceCommands(): {
  punctuation: string[];
  formatting: string[];
  special: string[];
} {
  return {
    punctuation: PUNCTUATION_PHRASES.map(([phrase]) => phrase).filter(
      (v: string, i: number, a: string[]) => a.indexOf(v) === i
    ),
    formatting: Object.keys(FORMATTING_COMMANDS).sort(),
    special: Object.keys(SPECIAL_COMMANDS).sort(),
  };
}

/**
 * Check if a word is a voice command
 */
export function isVoiceCommand(word: string): boolean {
  const lower = word.toLowerCase().trim();
  return !!(
    PUNCTUATION_PHRASES.some(([phrase]) => phrase === lower) ||
    FORMATTING_COMMANDS[lower] ||
    lower in SPECIAL_COMMANDS
  );
}
