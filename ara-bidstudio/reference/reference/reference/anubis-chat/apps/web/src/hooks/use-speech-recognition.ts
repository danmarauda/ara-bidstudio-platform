'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';
import { formatSpeechText } from '@/lib/utils/speechFormatter';

const log = createModuleLogger('speech-recognition');

// Extend the Window interface to include SpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  enableFormatting?: boolean; // Enable smart punctuation and formatting
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for speech recognition using Web Speech API
 * Falls back gracefully if not supported
 */
export function useSpeechRecognition({
  continuous = true, // Default to true for chat applications
  interimResults = true,
  language = 'en-US',
  enableFormatting = true, // Enable smart formatting by default
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Store callbacks and settings in refs to avoid stale closures
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const enableFormattingRef = useRef(enableFormatting);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    enableFormattingRef.current = enableFormatting;
  }, [onResult, onError, enableFormatting]);

  // Initialize recognition instance once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as IWindow;
      const SpeechRecognition =
        windowWithSpeech.SpeechRecognition ||
        windowWithSpeech.webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);

        // Only create recognition instance if it doesn't exist
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = continuous;
          recognition.interimResults = interimResults;
          recognition.lang = language;
          recognition.maxAlternatives = 1; // Faster processing

          // Handle results
          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            // Process all results from the last index
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
              } else {
                interimTranscript += result[0].transcript;
              }
            }

            if (finalTranscript) {
              // Apply formatting if enabled
              const formattedText = enableFormattingRef.current
                ? formatSpeechText(finalTranscript, false)
                : finalTranscript;

              // Don't accumulate in the hook - let the component handle it
              setTranscript(formattedText);
              onResultRef.current?.(formattedText, true);
              log.debug('Final transcript received', {
                transcript: finalTranscript,
                formatted: formattedText,
                confidence: event.results[event.resultIndex][0].confidence,
              });
            }

            if (interimTranscript) {
              // Apply formatting to interim results too for real-time feedback
              const formattedInterim = enableFormattingRef.current
                ? formatSpeechText(interimTranscript, true)
                : interimTranscript;

              setInterimTranscript(formattedInterim);
              onResultRef.current?.(formattedInterim, false);
            }
          };

          // Handle errors
          recognition.onerror = (event: any) => {
            const errorMessage = `Speech recognition error: ${event.error}`;
            log.error(errorMessage, { error: event.error });
            onErrorRef.current?.(errorMessage);
            setIsListening(false);

            // Handle specific errors
            if (event.error === 'no-speech') {
              log.info('No speech detected');
            } else if (event.error === 'not-allowed') {
              log.error('Microphone permission denied');
              onErrorRef.current?.(
                'Microphone permission denied. Please allow microphone access.'
              );
            } else if (event.error === 'aborted') {
              log.info('Speech recognition aborted');
            }
          };

          // Handle end
          recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript(''); // Clear interim when stopped
            log.debug('Speech recognition ended');
          };

          recognitionRef.current = recognition;
        }
      } else {
        log.warn('Speech recognition not supported in this browser');
        setIsSupported(false);
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [continuous, interimResults, isListening, language]); // Empty deps - only run once

  // Update recognition settings when props change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = language;
    }
  }, [continuous, interimResults, language]);

  // Start listening
  const startListening = useCallback(() => {
    if (!(isSupported && recognitionRef.current)) {
      log.error('Speech recognition not available');
      onErrorRef.current?.(
        'Speech recognition is not supported in your browser'
      );
      return;
    }

    try {
      // If already listening, stop first then restart
      if (isListening) {
        recognitionRef.current.abort();
      }

      recognitionRef.current.start();
      setIsListening(true);
      // Don't reset transcripts here - let the component control when to reset
      log.info('Started speech recognition');
    } catch (error: any) {
      // If it's already started, that's ok
      if (error.message?.includes('already started')) {
        setIsListening(true);
        log.info('Speech recognition already started');
      } else {
        log.error('Failed to start speech recognition', { error });
        onErrorRef.current?.('Failed to start speech recognition');
        setIsListening(false);
      }
    }
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Use stop() to process any remaining audio before stopping
        // This ensures we capture the last words spoken
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript(''); // Clear interim immediately
        log.info('Stopped speech recognition');
      } catch (error) {
        log.error('Error stopping speech recognition', { error });
        // Fallback to abort() for immediate cancellation if stop() fails
        try {
          recognitionRef.current.abort();
        } catch (_e) {
          // Ignore
        }
        setIsListening(false);
      }
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
