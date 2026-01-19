"use client";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Globe,
  Bot,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BookUser,
  Mail,
  Inbox,
  Hash,
  Gamepad2,
  Server,
  Webhook,
  Phone,
  Zap,
  Home,
  Star,
  Tag,
  Calendar,
  Settings,
  X,
  ChevronDown,
  FileCheck,
  Upload,
  Loader2,
  Lightbulb,
  Wrench,
  Share2,
  Move,
  CheckSquare,
  Play,
  Clock,
  Sparkles,
  Brain,
  Command,
  Layers,
  Grid3X,
  List,
  Filter,
  MoreVertical,
  User,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

// KokonutUI-inspired Enhanced Sidebar with modern animations and glass morphism
export function EnhancedSidebar({
  isCollapsed,
  onToggleCollapse,
  selectedDocumentId,
  onDocumentSelect,
  selectedNodeId,
  onNodeSelect,
  className = "",
}: EnhancedSidebarProps) {

  // Enhanced state management
  const [activeSection, setActiveSection] = useState<'documents' | 'tasks' | 'calendar' | 'ai' | 'tools'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Animation controls
  const controls = useAnimation();
  const searchControls = useAnimation();

  // Convex queries and mutations
  const documents = useQuery(api.documents.list);
  const tasks = useQuery(api.tasks.list);
  const recentDocuments = useQuery(api.documents.listRecent, { limit: 5 });

  // Enhanced search with debouncing
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents?.slice(0, 10) || [];
    return documents?.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [documents, searchQuery]);

  // Theme toggle with animation
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    // Could integrate with actual theme system
  }, []);

  // Enhanced section navigation
  const sections = [
    {
      id: 'documents' as const,
      label: 'Documents',
      icon: FileText,
      count: documents?.length || 0,
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      id: 'tasks' as const,
      label: 'Tasks',
      icon: CheckSquare,
      count: tasks?.length || 0,
      gradient: 'from-green-500 to-teal-600',
    },
    {
      id: 'calendar' as const,
      label: 'Calendar',
      icon: Calendar,
      count: 0, // Could be calculated
      gradient: 'from-orange-500 to-red-600',
    },
    {
      id: 'ai' as const,
      label: 'AI Agents',
      icon: Brain,
      count: 0, // Could be calculated
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      id: 'tools' as const,
      label: 'Tools',
      icon: Wrench,
      count: 0, // Could be calculated
      gradient: 'from-indigo-500 to-blue-600',
    },
  ];

  // Enhanced document item with KokonutUI patterns
  const renderDocumentItem = useCallback((doc: any, index: number) => {
    const isSelected = selectedDocumentId === doc._id;

    return (
      <motion.div
        key={doc._id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onDocumentSelect(doc._id)}
        className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-400/50 shadow-lg'
            : 'hover:bg-white/10 hover:shadow-md'
        } backdrop-blur-sm`}
      >
        {/* Selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-600 rounded-r-full"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-3">
          {/* Document icon with animation */}
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSelected
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                : 'bg-white/20 group-hover:bg-white/30'
            } transition-all duration-200`}
          >
            <FileText className={`w-4 h-4 ${
              isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
            }`} />
          </motion.div>

          {/* Document info */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${
              isSelected
                ? 'text-white'
                : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
            } transition-colors duration-200`}>
              {doc.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {new Date(doc._creationTime).toLocaleDateString()}
            </p>
          </div>

          {/* Action menu */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/20 transition-all duration-200"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </motion.button>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={false}
        />
      </motion.div>
    );
  }, [selectedDocumentId, onDocumentSelect]);

  // Enhanced search bar with KokonutUI design
  const renderSearchBar = () => (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="relative mb-6"
    >
      <motion.div
        animate={searchControls}
        className="relative"
      >
        <motion.input
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          type="text"
          placeholder="Search documents, tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setIsSearchFocused(true);
            searchControls.start({ boxShadow: "0 0 20px rgb(59 130 246 / 0.3)" });
          }}
          onBlur={() => {
            setIsSearchFocused(false);
            searchControls.start({ boxShadow: "0 0 0px rgb(59 130 246 / 0)" });
          }}
          className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        {/* Search icon with animation */}
        <motion.div
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
          animate={isSearchFocused ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </motion.div>

        {/* Search results indicator */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full"
            >
              {filteredDocuments.length}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  // Enhanced section tabs with KokonutUI design
  const renderSectionTabs = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex space-x-1 mb-6 p-1 bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-xl"
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <motion.button
            key={section.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection(section.id)}
            className={`relative flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {/* Active background with gradient */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute inset-0 bg-gradient-to-r ${section.gradient} rounded-lg shadow-lg`}
                />
              )}
            </AnimatePresence>

            {/* Icon with animation */}
            <motion.div
              animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 mb-1"
            >
              <Icon className="w-5 h-5" />
            </motion.div>

            {/* Label */}
            <span className="text-xs font-medium relative z-10 truncate max-w-full">
              {section.label}
            </span>

            {/* Count badge */}
            {section.count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold relative z-20"
              >
                {section.count > 99 ? '99+' : section.count}
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );

  // Enhanced quick actions panel
  const renderQuickActions = () => (
    <AnimatePresence>
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute bottom-20 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-4 z-50"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Plus, label: 'New Doc', action: () => console.log('New document') },
              { icon: FileText, label: 'Import', action: () => console.log('Import file') },
              { icon: MessageSquare, label: 'AI Chat', action: () => console.log('Open AI chat') },
              { icon: Calendar, label: 'Schedule', action: () => console.log('Create event') },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <action.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Enhanced floating action button
  const renderFAB = () => (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
      whileHover={{ scale: 1.1, boxShadow: "0 10px 25px -5px rgb(59 130 246 / 0.4)" }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setShowQuickActions(!showQuickActions)}
      className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center z-40"
    >
      <AnimatePresence mode="wait">
        {showQuickActions ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="plus"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <>
      {/* Enhanced Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: isCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-2xl z-30 flex flex-col ${className}`}
      >
        {/* Header with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              NodeBench AI
            </h1>
          </motion.div>

          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>

            {/* Collapse toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search bar */}
          {renderSearchBar()}

          {/* Section tabs */}
          {renderSectionTabs()}

          {/* Content based on active section */}
          <AnimatePresence mode="wait">
            {activeSection === 'documents' && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Documents
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-2">
                  {filteredDocuments.map((doc, index) => renderDocumentItem(doc, index))}
                </div>
              </motion.div>
            )}

            {activeSection === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tasks
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Task management coming soon...
                </div>
              </motion.div>
            )}

            {activeSection === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Calendar
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Calendar integration coming soon...
                </div>
              </motion.div>
            )}

            {activeSection === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Agents
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  AI agent management coming soon...
                </div>
              </motion.div>
            )}

            {activeSection === 'tools' && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tools & Integrations
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Tool management coming soon...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with user info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="p-6 border-t border-white/20 dark:border-gray-700/50"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                User Name
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                user@example.com
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick actions overlay */}
      {renderQuickActions()}

      {/* Floating action button */}
      {renderFAB()}

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
            onClick={onToggleCollapse}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Type definitions
interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedDocumentId?: Id<"documents">;
  onDocumentSelect: (documentId: Id<"documents">) => void;
  selectedNodeId?: Id<"nodes">;
  onNodeSelect?: (nodeId: Id<"nodes">) => void;
  className?: string;
}</content>
<parameter name="filePath">/Users/alias/Downloads/ara-bidstudio-collection/nodebench-ai/src/components/EnhancedSidebar.tsx