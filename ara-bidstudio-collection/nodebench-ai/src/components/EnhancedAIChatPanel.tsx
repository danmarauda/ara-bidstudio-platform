"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useMcp } from "../../hooks/useMcp";
import { useContextPills } from "../../hooks/contextPills";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Send,
  Server as ServerIcon,
  FileText,
  Brain,
  Wrench,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Settings,
  Info,
  Key,
  Eye,
  EyeOff,
  Upload,
  Hash,
  Image as ImageIcon,
  FileCheck,
  Calendar,
  Loader2,
  Bot,
  User,
  MessageSquare,
  Mic,
  MicOff,
} from 'lucide-react';

import { toast } from "sonner";

// KokonutUI-inspired AI Chat Panel with enhanced animations and modern design
export function EnhancedAIChatPanel({
  isOpen,
  onClose,
  onDocumentSelect,
  selectedDocumentId,
  selectedNodeId,
  smsMessage,
  onSmsMessageProcessed,
  selectedFileIds,
  showMcpPanel,
  onToggleMcpPanel,
  pendingQuickPrompt,
  onQuickPromptConsumed
}: AIChatPanelProps) {

  // Enhanced state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Animation controls
  const controls = useAnimation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced message sending with animations
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsLoading(true);

    // Animate input focus loss
    controls.start({ scale: 0.98, transition: { duration: 0.1 } });

    try {
      // Simulate AI response with typing animation
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `I understand you're asking about "${userMessage.content}". Let me help you with that...`,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      setIsTyping(false);
      setIsLoading(false);
      toast.error("Failed to send message");
    }
  }, [inputValue, controls]);

  // Voice input toggle with animation
  const toggleVoiceInput = useCallback(() => {
    setShowVoiceInput(!showVoiceInput);
    if (!showVoiceInput) {
      setIsRecording(true);
      // Simulate voice recording
      setTimeout(() => setIsRecording(false), 3000);
    }
  }, [showVoiceInput]);

  // Enhanced message rendering with KokonutUI-inspired design
  const renderMessage = useCallback((message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: "easeOut"
        }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-xl border ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50 ml-12'
              : 'bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white border-gray-200/50 dark:border-gray-700/50 mr-12'
          } shadow-lg`}
        >
          {/* Message header with avatar */}
          <div className="flex items-center space-x-2 mb-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isUser
                  ? 'bg-white/20'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}
            >
              {isUser ? (
                <User className="w-3 h-3 text-white" />
              ) : (
                <Bot className="w-3 h-3 text-white" />
              )}
            </motion.div>
            <span className={`text-xs font-medium ${
              isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className={`text-xs ${
              isUser ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message content with typing animation */}
          <div className="text-sm leading-relaxed">
            <AnimatePresence mode="wait">
              {isTyping && message.role === 'assistant' && index === messages.length - 1 ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-1"
                >
                  <span>AI is thinking</span>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-current rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
  }, [isTyping, messages.length]);

  // Enhanced input area with KokonutUI design
  const renderInputArea = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl p-4"
    >
      <div className="flex items-end space-x-3">
        {/* Enhanced input field */}
        <motion.div
          animate={controls}
          className="flex-1 relative"
        >
          <motion.input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ask me anything..."
            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            disabled={isLoading}
          />

          {/* Voice input toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoiceInput}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors duration-200 ${
              showVoiceInput
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex space-x-1"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-red-500 rounded-full"
                      animate={{
                        height: [4, 12, 4],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {showVoiceInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Enhanced send button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgb(59 130 246 / 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Voice input indicator */}
      <AnimatePresence>
        {showVoiceInput && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <motion.div
                animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
              >
                <Mic className="w-4 h-4 text-blue-500" />
              </motion.div>
              <span>
                {isRecording ? 'Listening... Speak now' : 'Voice input ready - click mic to start'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-4xl h-[80vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Bot className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Assistant
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by advanced AI models
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Messages area with enhanced scrolling */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How can I help you today?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      Ask me anything about your documents, tasks, or get help with any topic.
                    </p>
                  </motion.div>
                ) : (
                  messages.map((message, index) => renderMessage(message, index))
                )}
              </AnimatePresence>
            </div>

            {/* Input area */}
            {renderInputArea()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Type definitions
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSelect: (documentId: Id<"documents">) => void;
  selectedDocumentId?: Id<"documents">;
  selectedNodeId?: Id<"nodes">;
  smsMessage?: string;
  onSmsMessageProcessed?: () => void;
  selectedFileIds?: Id<"files">[];
  showMcpPanel?: boolean;
  onToggleMcpPanel?: () => void;
  pendingQuickPrompt?: string;
  onQuickPromptConsumed?: () => void;
}</content>
<parameter name="filePath">/Users/alias/Downloads/ara-bidstudio-collection/nodebench-ai/src/components/EnhancedAIChatPanel.tsx