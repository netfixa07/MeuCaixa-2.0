import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, Bot, MessageCircle, Sparkles } from 'lucide-react';
import { getSupportResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface PlanSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanSupportChat = ({ isOpen, onClose }: PlanSupportChatProps) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('sub.consultant_welcome'),
      timestamp: new Date().toISOString()
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;

    const userText = message;
    setMessage("");
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const response = await getSupportResponse(userText);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Plan support chat error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-full md:max-w-md md:h-[600px] bg-white dark:bg-slate-900 md:rounded-[32px] shadow-2xl border-t md:border border-blue-100 dark:border-slate-800 z-[70] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{t('sub.consultant_title')}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-100 font-medium tracking-wide uppercase">{t('sub.consultant_online')}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/50">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === 'user' ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-sm" 
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-100 dark:border-slate-700"
                  )}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium px-1 uppercase tracking-wider">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isProcessing && (
                <div className="flex flex-col gap-2 self-start items-start max-w-[85%]">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('sub.consultant_placeholder')}
                    disabled={isProcessing}
                    className="w-full py-4 pl-5 pr-12 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 outline-none disabled:opacity-50 transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-4 h-4 text-blue-400 opacity-50" />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!message.trim() || isProcessing}
                  className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-4 font-medium uppercase tracking-widest">
                Consultoria MeuCaixa • Respostas instantâneas
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
