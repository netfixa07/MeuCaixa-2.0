import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, Mic, Paperclip, AlertCircle, XCircle, Bot } from 'lucide-react';
import { Transaction, ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  message: string;
  setMessage: (msg: string) => void;
  isProcessing: boolean;
  handleSendMessage: (e: React.FormEvent) => void;
  chatError: string | null;
  setChatError: (err: string | null) => void;
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  inline?: boolean;
}

export const ChatPanel = ({
  isOpen = true,
  onClose,
  message,
  setMessage,
  isProcessing,
  handleSendMessage,
  chatError,
  setChatError,
  transactions,
  chatMessages,
  inline = false
}: ChatPanelProps) => {
  const { t, language } = useLanguage();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, transactions, chatMessages]);

  if (!isOpen && !inline) return null;

  const content = (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 overflow-hidden",
      inline 
        ? "w-full h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm" 
        : "fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:max-h-[80vh] md:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base">{t('assistant.title')}</h3>
            <p className="text-[10px] md:text-xs text-blue-100">{t('assistant.online')}</p>
          </div>
        </div>
        {(!inline || !onClose) && (
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col gap-2">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700 max-w-[90%] md:max-w-[85%] self-start">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {t('assistant.welcome')}
              </p>
            </div>
          </div>

          {/* Render Support Chat Messages */}
          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col gap-2 max-w-[90%] md:max-w-[85%]",
              msg.role === 'user' ? "self-end items-end" : "self-start items-start"
            )}>
              <div className={cn(
                "p-4 rounded-2xl shadow-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-100 dark:border-slate-700"
              )}>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {chatError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="flex-1">{chatError}</p>
              <button onClick={() => setChatError(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('assistant.input_placeholder')}
                disabled={isProcessing}
                className="w-full py-3 md:py-2.5 pl-4 pr-10 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="submit"
              disabled={!message.trim() || isProcessing}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-blue-600 flex-shrink-0"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
    </div>
  );

  if (inline) return content;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 300, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        <div className="pointer-events-auto w-full h-full">
          {content}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
