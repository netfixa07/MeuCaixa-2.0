import React from 'react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Transaction } from '../types';
import { Calendar, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TransactionItemProps {
  tx: Transaction;
  onMarkAsPaid?: (id: string) => void;
}

export const TransactionItem = React.memo(({ tx, onMarkAsPaid }: TransactionItemProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'pt' ? ptBR : enUS;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pago': return t('tx.status_paid');
      case 'pendente': return t('tx.status_pending');
      case 'atrasado': return t('tx.status_overdue');
      default: return status;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white dark:bg-black p-4 rounded-2xl border border-blue-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 transition-all shadow-sm flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
          tx.tipo === 'receita' 
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
        )}>
          {tx.item.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-blue-900 dark:text-white flex items-center gap-2">
            {tx.item}
            {tx.status && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1",
                tx.status === 'pago' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                tx.status === 'pendente' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
              )}>
                {tx.status === 'pago' && <CheckCircle2 className="w-3 h-3" />}
                {tx.status === 'pendente' && <Calendar className="w-3 h-3" />}
                {tx.status === 'atrasado' && <AlertCircle className="w-3 h-3" />}
                {getStatusText(tx.status)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-wider bg-blue-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              {tx.categoria}
            </span>
            <span className="text-[10px] text-blue-400 dark:text-slate-600">
              {format(new Date(tx.data), "dd MMM, HH:mm", { locale })}
            </span>
            {tx.dataVencimento && (
              <span className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('tx.due_date').replace('{date}', format(parseISO(tx.dataVencimento), "dd/MM/yyyy"))}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end justify-center gap-1">
        <div className={cn(
          "font-bold text-lg",
          tx.tipo === 'receita' ? "text-emerald-600 dark:text-emerald-400" : "text-blue-900 dark:text-white"
        )}>
          {tx.tipo === 'receita' ? '+' : '-'} {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: language === 'pt' ? 'BRL' : 'USD' }).format(tx.valor)}
        </div>
        {tx.status && tx.status !== 'pago' && onMarkAsPaid && tx.id && (
          <div className="flex gap-2 mt-1">
            {tx.tipo === 'receita' && (
              <button
                onClick={() => {
                  const amount = tx.valor.toFixed(2);
                  const description = encodeURIComponent(tx.item);
                  window.open(`https://cakto.com.br/pay?amount=${amount}&desc=${description}`, '_blank');
                }}
                className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
              >
                <CreditCard className="w-3 h-3" />
                {t('tx.action_charge')}
              </button>
            )}
            <button
              onClick={() => onMarkAsPaid(tx.id!)}
              className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {t('tx.action_mark_paid')}
            </button>
          </div>
        )}
        {tx.originalMessage && (
          <div className="text-[10px] text-blue-300 dark:text-slate-700 italic truncate max-w-[120px] mt-1">
            "{tx.originalMessage}"
          </div>
        )}
      </div>
    </motion.div>
  );
});

TransactionItem.displayName = 'TransactionItem';
