import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Sparkles,
  BrainCircuit,
  Zap,
  Package,
  Users,
  Lightbulb,
  LineChart as LineChartIcon,
  Lock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Transaction, UserProfile, Product, Person } from '../types';
import { Logo } from './ui/Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  profile: UserProfile | null;
  products?: Product[];
  people?: Person[];
  onViewStrategicReport: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard = ({ transactions, profile, products = [], people = [], onViewStrategicReport }: DashboardProps) => {
  const { t, language } = useLanguage();
  const totals = useMemo(() => {
    const despesas = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);

    const receitas = transactions
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      despesas,
      receitas,
      saldo: receitas - despesas
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const categoryMap = transactions.reduce((acc: Record<string, { name: string; value: number; tipo: string }>, tx) => {
      if (!acc[tx.categoria]) {
        acc[tx.categoria] = { name: tx.categoria, value: 0, tipo: tx.tipo };
      }
      acc[tx.categoria].value += tx.valor;
      return acc;
    }, {});

    const data = Object.values(categoryMap);
    return {
      expenseData: data.filter(c => c.tipo === 'despesa'),
      incomeData: data.filter(c => c.tipo === 'receita')
    };
  }, [transactions]);

  const cashFlowForecast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentBalance = totals.saldo;
    const forecast = [];
    
    // Add today
    forecast.push({
      date: today.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' }),
      saldo: currentBalance
    });

    // Get pending transactions sorted by due date
    const pendingTxs = transactions
      .filter(t => t.status === 'pendente' && t.dataVencimento)
      .sort((a, b) => new Date(a.dataVencimento!).getTime() - new Date(b.dataVencimento!).getTime());

    // Generate next 7 days forecast
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dateStr = nextDate.toISOString().split('T')[0];
      
      const dayTxs = pendingTxs.filter(t => t.dataVencimento === dateStr);
      
      dayTxs.forEach(tx => {
        if (tx.tipo === 'receita') {
          currentBalance += tx.valor;
        } else {
          currentBalance -= tx.valor;
        }
      });

      forecast.push({
        date: nextDate.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' }),
        saldo: currentBalance
      });
    }

    return forecast;
  }, [transactions, totals.saldo, language]);

  const suggestions = useMemo(() => {
    const items = [];
    if (totals.despesas > totals.receitas) {
      items.push(t('dashboard.expense_higher_than_revenue'));
    }
    
    const lowStockProducts = products.filter(p => p.estoque <= p.estoqueMinimo);
    if (lowStockProducts.length > 0) {
      items.push(t('dashboard.low_stock_alert').replace('{count}', lowStockProducts.length.toString()));
    }

    if (people.filter(p => p.tipo === 'cliente').length === 0) {
      items.push(t('dashboard.no_customers_alert'));
    }

    if (items.length === 0) {
      items.push(t('dashboard.healthy_business'));
    }

    return items;
  }, [totals, products, people, t]);

  return (
    <div className="space-y-8 mb-12">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black p-5 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">{t('dashboard.revenue')}</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-white">
            {language === 'pt' ? 'R$' : '$'} {totals.receitas.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-black p-5 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">{t('dashboard.expenses')}</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-white">
            {language === 'pt' ? 'R$' : '$'} {totals.despesas.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-5 rounded-3xl border shadow-sm",
            totals.saldo >= 0 ? "bg-blue-600 border-blue-500 text-white" : "bg-rose-600 border-rose-500 text-white"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2 rounded-xl overflow-hidden", totals.saldo >= 0 ? "bg-white/10" : "bg-white/20")}>
              <Logo className="w-4 h-4 brightness-0 invert" showText={false} />
            </div>
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{t('dashboard.balance')}</span>
          </div>
          <div className="text-2xl font-bold">
            {language === 'pt' ? 'R$' : '$'} {totals.saldo.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
          </div>
        </motion.div>
      </div>

      {profile?.plan === 'elite' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-black p-5 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm flex items-center gap-4"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">{t('dashboard.products_in_stock')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-white">{products.length}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-black p-5 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm flex items-center gap-4"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">{t('dashboard.active_customers')}</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-white">{people.filter(p => p.tipo === 'cliente').length}</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sugestões Automáticas e Previsão */}
      {profile?.plan === 'elite' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30"
          >
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              {t('dashboard.insights_title')}
            </h3>
            <ul className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="text-sm font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-blue-500" />
              {t('dashboard.cash_flow_forecast')}
            </h3>
            <div className="h-48 min-h-[192px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowForecast}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(value) => `${language === 'pt' ? 'R$' : '$'} ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${language === 'pt' ? 'R$' : '$'} ${value.toFixed(2)}`, t('dashboard.forecast_tooltip')]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Infográficos (Apenas Pro e Empresarial) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-400" />
            {t('dashboard.expense_distribution')}
          </h3>
          <div className="h-64 min-h-[256px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#1e3a8a'
                  }}
                  formatter={(value: number) => `${language === 'pt' ? 'R$' : '$'} ${value.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            {t('dashboard.revenue_niches')}
          </h3>
          <div className="h-64 min-h-[256px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.incomeData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `${language === 'pt' ? 'R$' : '$'} ${value.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Intelligence Highlight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all mb-6"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <BrainCircuit className="w-32 h-32 text-blue-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-white">{t('intelligence.title')}</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-2xl leading-relaxed">
            {t('intelligence.subtitle')} Nosso motor de IA agora detecta automaticamente recorrências, parcelamentos, locais e até o seu sentimento financeiro.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => (window as any).setActiveTab?.('inteligencia')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10"
            >
              Explorar IA
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Gemini 3.1 Ativo
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-3xl text-white shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold">{t('dashboard.ai_insights_title')}</h3>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed mb-6">
          {t('dashboard.ai_growth_insight')
            .replace('{niche}', chartData.incomeData[0]?.name || (language === 'pt' ? 'Vendas' : 'Sales'))
            .replace('{expense}', chartData.expenseData[0]?.name || (language === 'pt' ? 'Operacional' : 'Operational'))}
        </p>
        <button 
          onClick={onViewStrategicReport}
          className="px-6 py-3 bg-white text-blue-900 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-2"
        >
          {t('dashboard.view_strategic_report')}
        </button>
      </motion.div>
    </div>
  );
};
