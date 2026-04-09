import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { NICHOS_GLOBAIS } from '../../constants/niches';

interface NicheSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const NicheSelector = ({ value, onChange, placeholder = "Selecionar Nicho", className }: NicheSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredNiches = NICHOS_GLOBAIS.filter(n => 
    n.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showCustomOption = searchTerm.length > 0 && !NICHOS_GLOBAIS.some(n => n.toLowerCase() === searchTerm.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl cursor-pointer transition-all",
          isOpen ? "ring-2 ring-blue-500 bg-white dark:bg-slate-900" : "hover:bg-blue-100/50 dark:hover:bg-slate-700/50"
        )}
      >
        <span className={cn(
          "text-sm",
          value ? "text-blue-900 dark:text-white font-medium" : "text-blue-300 dark:text-slate-600"
        )}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-blue-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-blue-50 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input 
                  type="text"
                  placeholder="Buscar nicho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
              {filteredNiches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => {
                    onChange(niche);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all",
                    value === niche 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                  )}
                >
                  {niche}
                  {value === niche && <Check className="w-4 h-4" />}
                </button>
              ))}

              {showCustomOption && (
                <button
                  onClick={() => {
                    onChange(searchTerm);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border-t border-blue-50 dark:border-slate-800 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Usar nicho personalizado: <strong>{searchTerm}</strong></span>
                </button>
              )}

              {filteredNiches.length === 0 && !showCustomOption && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Nenhum nicho encontrado.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
