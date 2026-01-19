"use client";
import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Save,
  Sparkles,
  Brain,
  Zap,
  Type,
  Palette,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  FileText,
  Hash,
  AtSign,
  CheckSquare,
  Minus,
} from "lucide-react";
import { toast } from "sonner";

// KokonutUI-inspired Enhanced Editor Toolbar with modern animations and effects
export function EnhancedEditorToolbar({
  editor,
  onSave,
  onAIAnalyze,
  isAnalyzing = false,
  wordCount = 0,
  charCount = 0,
  readTime = 0,
}: EnhancedEditorToolbarProps) {

  // Enhanced state management
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Animation controls
  const controls = useAnimation();
  const aiControls = useAnimation();

  // Update active formats based on editor state
  useEffect(() => {
    if (!editor) return;

    const updateFormats = () => {
      const formats = new Set<string>();
      if (editor.isActive('bold')) formats.add('bold');
      if (editor.isActive('italic')) formats.add('italic');
      if (editor.isActive('underline')) formats.add('underline');
      if (editor.isActive('strike')) formats.add('strike');
      if (editor.isActive('code')) formats.add('code');
      if (editor.isActive('heading', { level: 1 })) formats.add('h1');
      if (editor.isActive('heading', { level: 2 })) formats.add('h2');
      if (editor.isActive('heading', { level: 3 })) formats.add('h3');
      if (editor.isActive('bulletList')) formats.add('bulletList');
      if (editor.isActive('orderedList')) formats.add('orderedList');
      if (editor.isActive('blockquote')) formats.add('blockquote');
      setActiveFormats(formats);
    };

    editor.on('transaction', updateFormats);
    updateFormats();

    return () => {
      editor.off('transaction', updateFormats);
    };
  }, [editor]);

  // Typing indicator
  useEffect(() => {
    if (!editor) return;

    let timeout: NodeJS.Timeout;
    const handleUpdate = () => {
      setIsTyping(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsTyping(false), 1000);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      clearTimeout(timeout);
    };
  }, [editor]);

  // Enhanced format button with KokonutUI animations
  const FormatButton = memo(({
    icon: Icon,
    label,
    format,
    onClick,
    shortcut,
    variant = 'default'
  }: FormatButtonProps) => {
    const isActive = activeFormats.has(format);

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative p-2 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
            : variant === 'destructive'
            ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        title={`${label} ${shortcut ? `(${shortcut})` : ''}`}
      >
        <Icon className="w-4 h-4" />

        {/* Tooltip with animation */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
          >
            {label}
            {shortcut && <span className="ml-1 text-gray-400">({shortcut})</span>}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>
        </AnimatePresence>

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  });

  // Enhanced AI analysis button
  const AIAnalyzeButton = memo(() => (
    <motion.button
      animate={aiControls}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAIAnalyze}
      disabled={isAnalyzing}
      className="relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-4 h-4" />
            </motion.div>
            <span>Analyzing...</span>
          </motion.div>
        ) : (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Analyze</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  ));

  // Format handlers
  const handleFormat = useCallback((format: string, options?: any) => {
    if (!editor) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'undo':
        editor.chain().focus().undo().run();
        break;
      case 'redo':
        editor.chain().focus().redo().run();
        break;
    }
  }, [editor]);

  // Main toolbar layout
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="px-6 py-3">
        {/* Main toolbar */}
        <div className="flex items-center justify-between">
          {/* Left side - Format buttons */}
          <div className="flex items-center space-x-1">
            {/* Text formatting */}
            <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FormatButton
                icon={Bold}
                label="Bold"
                format="bold"
                onClick={() => handleFormat('bold')}
                shortcut="Ctrl+B"
              />
              <FormatButton
                icon={Italic}
                label="Italic"
                format="italic"
                onClick={() => handleFormat('italic')}
                shortcut="Ctrl+I"
              />
              <FormatButton
                icon={Underline}
                label="Underline"
                format="underline"
                onClick={() => handleFormat('underline')}
                shortcut="Ctrl+U"
              />
              <FormatButton
                icon={Strikethrough}
                label="Strikethrough"
                format="strike"
                onClick={() => handleFormat('strike')}
              />
              <FormatButton
                icon={Code}
                label="Code"
                format="code"
                onClick={() => handleFormat('code')}
                shortcut="Ctrl+E"
              />
            </div>

            {/* Headings */}
            <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg ml-2">
              <FormatButton
                icon={Heading1}
                label="Heading 1"
                format="h1"
                onClick={() => handleFormat('h1')}
                shortcut="Ctrl+Alt+1"
              />
              <FormatButton
                icon={Heading2}
                label="Heading 2"
                format="h2"
                onClick={() => handleFormat('h2')}
                shortcut="Ctrl+Alt+2"
              />
              <FormatButton
                icon={Heading3}
                label="Heading 3"
                format="h3"
                onClick={() => handleFormat('h3')}
                shortcut="Ctrl+Alt+3"
              />
            </div>

            {/* Lists */}
            <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg ml-2">
              <FormatButton
                icon={List}
                label="Bullet List"
                format="bulletList"
                onClick={() => handleFormat('bulletList')}
                shortcut="Ctrl+Shift+8"
              />
              <FormatButton
                icon={ListOrdered}
                label="Numbered List"
                format="orderedList"
                onClick={() => handleFormat('orderedList')}
                shortcut="Ctrl+Shift+7"
              />
              <FormatButton
                icon={Quote}
                label="Quote"
                format="blockquote"
                onClick={() => handleFormat('blockquote')}
                shortcut="Ctrl+Shift+>"
              />
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg ml-2">
              <FormatButton
                icon={Undo}
                label="Undo"
                format="undo"
                onClick={() => handleFormat('undo')}
                shortcut="Ctrl+Z"
              />
              <FormatButton
                icon={Redo}
                label="Redo"
                format="redo"
                onClick={() => handleFormat('redo')}
                shortcut="Ctrl+Y"
              />
            </div>
          </div>

          {/* Right side - Actions and stats */}
          <div className="flex items-center space-x-3">
            {/* Document stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <Type className="w-4 h-4" />
                <span>{charCount} chars</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{readTime} min read</span>
              </div>
            </div>

            {/* AI Analyze button */}
            <AIAnalyzeButton />

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>

            {/* Advanced options toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Advanced options panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200/50 dark:border-gray-700/50 pt-3 mt-3"
            >
              <div className="flex items-center justify-between">
                {/* Additional format options */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Advanced:
                  </span>
                  <FormatButton
                    icon={Link}
                    label="Link"
                    format="link"
                    onClick={() => handleFormat('link')}
                    shortcut="Ctrl+K"
                  />
                  <FormatButton
                    icon={Image}
                    label="Image"
                    format="image"
                    onClick={() => handleFormat('image')}
                  />
                  <FormatButton
                    icon={Table}
                    label="Table"
                    format="table"
                    onClick={() => handleFormat('table')}
                  />
                  <FormatButton
                    icon={Highlighter}
                    label="Highlight"
                    format="highlight"
                    onClick={() => handleFormat('highlight')}
                  />
                </div>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                      <span>Typing...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Enhanced Editor Status Bar with KokonutUI design
export function EnhancedEditorStatusBar({
  wordCount,
  charCount,
  readTime,
  lastSaved,
  isOnline,
  collaborators = [],
}: EnhancedEditorStatusBarProps) {

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-6 py-3"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Document stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <Type className="w-4 h-4" />
              <span>{charCount.toLocaleString()} characters</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{readTime} min read</span>
            </div>
          </div>

          {/* Last saved indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-sm"
          >
            <motion.div
              animate={{ scale: lastSaved ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={`w-2 h-2 rounded-full ${
                lastSaved ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className={lastSaved ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
              {lastSaved ? `Saved ${lastSaved}` : 'Unsaved changes'}
            </span>
          </motion.div>
        </div>

        {/* Right side - Collaborators and status */}
        <div className="flex items-center space-x-3">
          {/* Online status */}
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ scale: isOnline ? 1 : [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: isOnline ? 0 : Infinity }}
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium text-white"
                    title={collaborator.name}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </motion.div>
                ))}
              </div>
              {collaborators.length > 3 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  +{collaborators.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* AI indicator */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full border border-purple-400/20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-4 h-4 text-purple-500" />
            </motion.div>
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              AI Active
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Editor Container with KokonutUI glass morphism
export function EnhancedEditorContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Type definitions
interface EnhancedEditorToolbarProps {
  editor: any;
  onSave: () => void;
  onAIAnalyze: () => void;
  isAnalyzing?: boolean;
  wordCount?: number;
  charCount?: number;
  readTime?: number;
}

interface FormatButtonProps {
  icon: any;
  label: string;
  format: string;
  onClick: () => void;
  shortcut?: string;
  variant?: 'default' | 'destructive';
}

interface EnhancedEditorStatusBarProps {
  wordCount: number;
  charCount: number;
  readTime: number;
  lastSaved?: string;
  isOnline: boolean;
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}</content>
<parameter name="filePath">/Users/alias/Downloads/ara-bidstudio-collection/nodebench-ai/src/components/EnhancedEditorComponents.tsx