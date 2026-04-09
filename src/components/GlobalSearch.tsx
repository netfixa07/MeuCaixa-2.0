import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Users, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Product, Person } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  products: Product[];
  people: Person[];
  onNavigate: (tab: 'dashboard' | 'produtos' | 'pessoas' | 'estrategico') => void;
}

export const GlobalSearch = ({ isOpen, onClose, transactions, products, people, onNavigate }: GlobalSearchProps) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Handled by parent App.tsx
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredProducts = products.filter(p => p.nome.toLowerCase().includes(query.toLowerCase()));
  const filteredPeople = people.filter(p => p.nome.toLowerCase().includes(query.toLowerCase()));
  const filteredTransactions = transactions.filter(t => t.item.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-2 outline-none"
                />
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {query && (
                  <>
                    {filteredProducts.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">{t('search.products')}</h3>
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { onNavigate('produtos'); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left"
                          >
                            <Package className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{p.nome}</div>
                              <div className="text-xs text-slate-500">
                                {t('search.stock')}: {p.estoque} | {language === 'pt' ? 'R$' : '$'} {p.preco.toFixed(2)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredPeople.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">{t('search.customers')}</h3>
                        {filteredPeople.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { onNavigate('pessoas'); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left"
                          >
                            <Users className="w-4 h-4 text-emerald-500" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{p.nome}</div>
                              <div className="text-xs text-slate-500 capitalize">{p.tipo}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredTransactions.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">{t('search.transactions')}</h3>
                        {filteredTransactions.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { onNavigate('dashboard'); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left"
                          >
                            <History className="w-4 h-4 text-amber-500" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{t.item}</div>
                              <div className="text-xs text-slate-500">
                                {language === 'pt' ? 'R$' : '$'} {t.valor.toFixed(2)} | {new Date(t.data).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredProducts.length === 0 && filteredPeople.length === 0 && filteredTransactions.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        {t('search.no_results').replace('{query}', query)}
                      </div>
                    )}
                  </>
                )}
                {!query && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {t('search.type_to_search')}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
};
