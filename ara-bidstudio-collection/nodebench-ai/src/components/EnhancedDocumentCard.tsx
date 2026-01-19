"use client";
import React, { useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  FileText,
  Calendar,
  Edit3,
  Star,
  Trash2,
  Link2,
  MoreVertical,
  Eye,
  Download,
  Share,
  Heart,
  Clock,
  User,
  Tag,
  Zap,
  Sparkles,
  Brain,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

// KokonutUI-inspired Enhanced Document Card with mouse effects and animations
export function EnhancedDocumentCard({
  doc,
  onSelect,
  onDelete,
  onToggleFavorite,
  isSelected = false,
  onToggleSelect,
  onCardMouseClick,
  onAnalyzeFile,
  analyzeRunning = false,
}: EnhancedDocumentCardProps) {

  // Enhanced state management
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(analyzeRunning);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animation controls
  const controls = useAnimation();
  const iconControls = useAnimation();

  // Convex queries and mutations
  const favoriteMutation = useMutation(api.documents.toggleFavorite);
  const deleteMutation = useMutation(api.documents.deleteDocument);

  // Enhanced click handlers
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (onCardMouseClick) {
      const shouldPreventDefault = onCardMouseClick(doc._id, e);
      if (shouldPreventDefault) return;
    }
    onSelect(doc._id);
  }, [doc._id, onSelect, onCardMouseClick]);

  const handleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await favoriteMutation({ documentId: doc._id });
      toast.success(doc.isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  }, [doc._id, doc.isFavorite, favoriteMutation]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      try {
        await deleteMutation({ documentId: doc._id });
        toast.success("Document deleted successfully");
      } catch (error) {
        toast.error("Failed to delete document");
      }
    }
  }, [doc._id, doc.title, deleteMutation]);

  const handleAnalyze = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalyzeFile) {
      setIsAnalyzing(true);
      try {
        await onAnalyzeFile(doc);
        toast.success("Document analysis completed");
      } catch (error) {
        toast.error("Analysis failed");
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [doc, onAnalyzeFile]);

  // Mouse effect calculations
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    controls.start({
      rotateX: rotateX,
      rotateY: rotateY,
      transition: { duration: 0.1 }
    });
  }, [controls]);

  const handleMouseLeave = useCallback(() => {
    controls.start({
      rotateX: 0,
      rotateY: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    });
    setIsHovered(false);
    setShowActions(false);
  }, [controls]);

  // Get document type styling
  const getDocumentStyling = useCallback(() => {
    const type = doc.documentType || 'document';
    const gradients = {
      document: 'from-blue-500 to-purple-600',
      file: 'from-green-500 to-teal-600',
      timeline: 'from-orange-500 to-red-600',
      note: 'from-indigo-500 to-blue-600',
    };

    return {
      gradient: gradients[type as keyof typeof gradients] || gradients.document,
      icon: type === 'file' ? FileText : type === 'timeline' ? Calendar : FileText,
    };
  }, [doc.documentType]);

  const { gradient, icon: DocIcon } = getDocumentStyling();

  // Enhanced action buttons
  const renderActions = () => (
    <AnimatePresence>
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="absolute top-2 right-2 flex space-x-1"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavorite}
            className={`p-2 rounded-lg backdrop-blur-xl border transition-all duration-200 ${
              doc.isFavorite
                ? 'bg-red-500/20 border-red-400/50 text-red-400'
                : 'bg-white/10 border-white/20 text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${doc.isFavorite ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-gray-400 hover:text-blue-400 transition-all duration-200 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-4 h-4" />
              </motion.div>
            ) : (
              <Brain className="w-4 h-4" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-gray-400 hover:text-red-400 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Enhanced metadata display
  const renderMetadata = () => (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(doc._creationTime).toLocaleDateString()}</span>
        </div>
        {doc.lastModified && (
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>Modified {new Date(doc.lastModified).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* AI insights indicator */}
      {doc.aiAnalyzed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-400/30"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span className="text-purple-400 font-medium">AI</span>
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className="group relative cursor-pointer"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={controls}
        className="relative h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Main card with glass morphism */}
        <motion.div
          whileHover={{
            boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(255 255 255 / 0.1)"
          }}
          className={`relative h-full p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
            isSelected
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-400/50 shadow-2xl'
              : 'bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50 hover:border-white/40 dark:hover:border-gray-600/50'
          }`}
        >
          {/* Selection indicator */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with icon and title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Animated document icon */}
              <motion.div
                animate={iconControls}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-r ${gradient}`}
              >
                <DocIcon className="w-6 h-6 text-white" />
              </motion.div>

              {/* Title and type */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {doc.documentType || 'Document'}
                </p>
              </div>
            </div>
          </div>

          {/* Content preview */}
          {doc.content && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {doc.content}
              </p>
            </motion.div>
          )}

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {doc.tags.slice(0, 3).map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-600/10 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-400/20"
                >
                  {tag}
                </motion.span>
              ))}
              {doc.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{doc.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Metadata */}
          {renderMetadata()}

          {/* Hover overlay with gradient */}
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
          />

          {/* Action buttons */}
          {renderActions()}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Type definitions
interface EnhancedDocumentCardProps {
  doc: DocumentCardData & {
    isFavorite?: boolean;
    aiAnalyzed?: boolean;
    lastModified?: number;
    tags?: string[];
  };
  onSelect: (documentId: Id<"documents">) => void;
  onDelete?: (documentId: Id<"documents">) => void;
  onToggleFavorite?: (documentId: Id<"documents">) => void;
  isSelected?: boolean;
  onToggleSelect?: (documentId: Id<"documents">) => void;
  onCardMouseClick?: (documentId: Id<"documents">, e: React.MouseEvent) => boolean | void;
  onAnalyzeFile?: (doc: DocumentCardData) => void;
  analyzeRunning?: boolean;
}

// Import the DocumentCardData type
import type { DocumentCardData } from "../utils/documentHelpers";</content>
<parameter name="filePath">/Users/alias/Downloads/ara-bidstudio-collection/nodebench-ai/src/components/EnhancedDocumentCard.tsx