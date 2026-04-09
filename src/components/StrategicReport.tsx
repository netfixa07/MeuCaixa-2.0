import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Lightbulb,
  Calendar,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Target,
  Zap,
  Activity,
  Download,
  Printer,
  Users,
  Sparkles,
  Package,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Transaction, Product, Person } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface StrategicReportProps {
  transactions: Transaction[];
  products?: Product[];
  people?: Person[];
  onBack: () => void;
  plan?: string;
}

export const StrategicReport = ({ transactions, products = [], people = [], onBack, plan = 'gratuito' }: StrategicReportProps) => {
  const { t, language } = useLanguage();
  const isBasic = plan === 'gratuito';
  const [isGenerating, setIsGenerating] = useState(false);
  const reportData = useMemo(() => {
    const now = new Date();
    
    // Group transactions by month
    const monthlyData: Record<string, { month: string; receitas: number; despesas: number; timestamp: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.data);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const monthName = date.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'short' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          month: monthName, 
          receitas: 0, 
          despesas: 0,
          timestamp: date.getTime()
        };
      }

      if (tx.tipo === 'receita') {
        monthlyData[monthYear].receitas += tx.valor;
      } else {
        monthlyData[monthYear].despesas += tx.valor;
      }
    });

    const sortedMonths = Object.values(monthlyData).sort((a, b) => a.timestamp - b.timestamp);
    const lastMonths = sortedMonths.slice(-4); // Last 4 months

    const current = lastMonths[lastMonths.length - 1] || { month: 'N/A', receitas: 0, despesas: 0 };
    const previous = lastMonths[lastMonths.length - 2] || { month: 'N/A', receitas: 0, despesas: 0 };

    const growthRate = previous.receitas > 0 
      ? ((current.receitas - previous.receitas) / previous.receitas) * 100 
      : 0;

    // Identify areas
    const categoryStats = transactions.reduce((acc: Record<string, { name: string; value: number; tipo: string }>, tx) => {
      if (!acc[tx.categoria]) {
        acc[tx.categoria] = { name: tx.categoria, value: 0, tipo: tx.tipo };
      }
      acc[tx.categoria].value += tx.valor;
      return acc;
    }, {});

    const sortedExpenses = Object.values(categoryStats)
      .filter(c => c.tipo === 'despesa')
      .sort((a, b) => b.value - a.value);

    const sortedIncomes = Object.values(categoryStats)
      .filter(c => c.tipo === 'receita')
      .sort((a, b) => b.value - a.value);

    const negativeArea = sortedExpenses[0]?.name || t('report.no_area_critical');
    const positiveArea = sortedIncomes[0]?.name || t('report.no_area_highlight');

    // Strategic Health Score (0-100)
    // Factors: Growth, Profit Margin, Expense Control
    const margin = current.receitas > 0 ? ((current.receitas - current.despesas) / current.receitas) * 100 : 0;
    const healthScore = Math.min(100, Math.max(0, 
      (growthRate > 0 ? 30 : 10) + 
      (margin > 20 ? 40 : 20) + 
      (current.despesas < current.receitas ? 30 : 0)
    ));

    const totalStockValue = products.reduce((acc, p) => acc + (p.preco * p.estoque), 0);

    // Sentiment and Location Analysis
    const sentimentCounts = transactions.reduce((acc: Record<string, number>, tx) => {
      if (tx.emocao) {
        acc[tx.emocao] = (acc[tx.emocao] || 0) + 1;
      }
      return acc;
    }, { positivo: 0, negativo: 0, neutro: 0 });

    const locationStats = transactions.reduce((acc: Record<string, number>, tx) => {
      if (tx.local) {
        acc[tx.local] = (acc[tx.local] || 0) + 1;
      }
      return acc;
    }, {});

    const topLocations = Object.entries(locationStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // People Analysis
    const clients = people.filter(p => p.tipo === 'cliente');
    const suppliers = people.filter(p => p.tipo === 'fornecedor');
    
    const clientSales = transactions
      .filter(tx => tx.tipo === 'receita' && tx.personId)
      .reduce((acc: Record<string, number>, tx) => {
        acc[tx.personId!] = (acc[tx.personId!] || 0) + tx.valor;
        return acc;
      }, {});

    const topClients = Object.entries(clientSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, total]) => {
        const client = people.find(c => c.id === id);
        return { name: client?.nome || 'Cliente Desconhecido', total };
      });

    // Product Analysis
    const productSales = transactions
      .filter(tx => tx.tipo === 'receita' && tx.productId)
      .reduce((acc: Record<string, number>, tx) => {
        acc[tx.productId!] = (acc[tx.productId!] || 0) + tx.valor;
        return acc;
      }, {});

    const topSellingProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, total]) => {
        const product = products.find(p => p.id === id);
        return { name: product?.nome || 'Produto Desconhecido', total };
      });

    const lowStockProducts = products.filter(p => p.estoque <= p.estoqueMinimo);

    return {
      lastMonths,
      growthRate,
      isGrowing: growthRate > 0,
      negativeArea,
      positiveArea,
      currentMonthName: current.month,
      healthScore,
      margin,
      totalStockValue,
      sentimentCounts,
      topLocations,
      topClients,
      topSellingProducts,
      lowStockCount: lowStockProducts.length,
      clientCount: clients.length,
      supplierCount: suppliers.length,
      hasData: transactions.length > 0
    };
  }, [transactions, products, people, t, language]);

  const handleExportCSV = () => {
    const headers = language === 'pt' 
      ? ['Data', 'Item', 'Categoria', 'Tipo', 'Valor', 'Status', 'Vencimento']
      : ['Date', 'Item', 'Category', 'Type', 'Value', 'Status', 'Due Date'];
    
    const decimalSeparator = language === 'pt' ? ',' : '.';
    
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => {
        return [
          new Date(tx.data).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US'),
          `"${tx.item}"`,
          `"${tx.categoria}"`,
          tx.tipo,
          tx.valor.toString().replace('.', decimalSeparator),
          tx.status || 'pago',
          tx.dataVencimento ? new Date(tx.dataVencimento).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US') : ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      const currencySymbol = language === 'pt' ? 'R$' : '$';

      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Blue-900
      doc.text('Relatório Estratégico Empresarial', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Data de Geração: ${date}`, 14, 30);
      doc.text(`Score de Saúde Estratégica: ${reportData.healthScore}/100`, 14, 35);

      // Summary Table
      autoTable(doc, {
        startY: 45,
        head: [['Métrica', 'Valor']],
        body: [
          ['Crescimento de Receita', `${reportData.growthRate.toFixed(1)}%`],
          ['Margem de Lucro', `${reportData.margin.toFixed(1)}%`],
          ['Valor Total em Estoque', `${currencySymbol} ${reportData.totalStockValue.toLocaleString()}`],
          ['Área de Destaque', reportData.positiveArea],
          ['Área Crítica', reportData.negativeArea]
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] }
      });

      // Top Clients
      if (reportData.topClients.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.text('Top Clientes', 14, (doc as any).lastAutoTable.finalY + 15);
        
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Cliente', 'Total em Vendas']],
          body: reportData.topClients.map(c => [c.name, `${currencySymbol} ${c.total.toLocaleString()}`]),
          theme: 'grid'
        });
      }

      // SWOT Analysis
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text('Análise SWOT Estratégica', 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Forças', 'Fraquezas']],
        body: [
          [
            `• Destaque em ${reportData.positiveArea}\n• Histórico de ${reportData.lastMonths.length} meses`,
            `• Gastos elevados em ${reportData.negativeArea}\n• Necessidade de ajuste`
          ]
        ],
        theme: 'grid'
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        head: [['Oportunidades', 'Ameaças']],
        body: [
          [
            `• Otimizar custos em ${reportData.negativeArea}\n• Expandir em ${reportData.positiveArea}`,
            `• Dependência de ${reportData.positiveArea}\n• Riscos de mercado`
          ]
        ],
        theme: 'grid'
      });

      // Action Plan
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Plano de Ação Estratégico', 14, 22);

      autoTable(doc, {
        startY: 30,
        head: [['Prazo', 'Ação Recomendada']],
        body: [
          ['30 Dias', `Focar na redução de custos em ${reportData.negativeArea}.`],
          ['90 Dias', `Expandir a operação na área de ${reportData.positiveArea}.`],
          ['1 Ano', 'Implementar novas tecnologias e diversificar canais.']
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }
      });

      doc.save(`relatorio-estrategico-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12 pb-24 print:pb-0"
    >
      {/* Header Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('report.back')}
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={isBasic ? undefined : handleExportPDF}
            disabled={!reportData.hasData || isGenerating || isBasic}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Gerar PDF</span>
          </button>
          <button 
            onClick={isBasic ? undefined : handleExportCSV}
            disabled={!reportData.hasData || isBasic}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('report.export')}</span>
          </button>
          <button 
            onClick={isBasic ? undefined : () => window.print()}
            disabled={!reportData.hasData || isBasic}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t('report.print')}</span>
          </button>
          <div className="hidden md:flex items-center gap-2 bg-blue-900 px-4 py-2 rounded-2xl text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20">
            <Target className="w-4 h-4 text-amber-400" />
            {t('report.title')}
          </div>
        </div>
      </div>

      {!reportData.hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 bg-blue-50 dark:bg-slate-800 rounded-full">
            <BarChart3 className="w-12 h-12 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.no_transactions')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
              {language === 'pt' 
                ? 'Registre suas primeiras transações para gerar um relatório estratégico detalhado do seu negócio.' 
                : 'Register your first transactions to generate a detailed strategic report of your business.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Strategic Summary & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(
          "lg:col-span-2 p-6 md:p-10 rounded-[32px] md:rounded-[48px] text-white shadow-2xl relative overflow-hidden",
          reportData.isGrowing ? "bg-gradient-to-br from-blue-900 to-indigo-950" : "bg-gradient-to-br from-rose-900 to-rose-950"
        )}>
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-4 block">{t('report.performance_analysis')}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              {reportData.isGrowing ? t('report.expansion') : t('report.adjustment')}
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10">
                <span className="text-[10px] md:text-xs opacity-70 block mb-1">{t('report.growth')}</span>
                <span className="text-xl md:text-2xl font-bold">{reportData.growthRate.toFixed(1)}%</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10">
                <span className="text-[10px] md:text-xs opacity-70 block mb-1">{t('report.margin')}</span>
                <span className="text-xl md:text-2xl font-bold">{reportData.margin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-blue-100 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-blue-50 dark:text-slate-900"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * reportData.healthScore) / 100}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000",
                  reportData.healthScore > 70 ? "text-emerald-500" : reportData.healthScore > 40 ? "text-amber-500" : "text-rose-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-blue-900 dark:text-white">{reportData.healthScore}</span>
              <span className="text-[8px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">Score</span>
            </div>
          </div>
          <h4 className="font-bold text-blue-900 dark:text-white mb-1">{t('report.health_score')}</h4>
          <p className="text-xs text-blue-400 dark:text-slate-500 leading-relaxed mb-4">
            {t('report.health_desc')}
          </p>
          <div className="w-full pt-4 border-t border-blue-100 dark:border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('report.stock_value')}</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {language === 'pt' ? 'R$' : '$'} {reportData.totalStockValue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
        <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Desempenho Mensal (Receitas vs Despesas)
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.lastMonths}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `${language === 'pt' ? 'R$' : '$'} ${value}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${language === 'pt' ? 'R$' : '$'} ${value.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`]}
              />
              <Legend iconType="circle" />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights: Sentiment & Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-500" />
            Análise de Sentimento Financeiro
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Positivo (Satisfação)</span>
              <span className="text-sm font-bold text-emerald-600">{reportData.sentimentCounts.positivo}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${(reportData.sentimentCounts.positivo / (transactions.length || 1)) * 100}%` }} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Negativo (Dor Financeira)</span>
              <span className="text-sm font-bold text-rose-600">{reportData.sentimentCounts.negativo}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full transition-all duration-1000" 
                style={{ width: `${(reportData.sentimentCounts.negativo / (transactions.length || 1)) * 100}%` }} 
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Neutro (Informativo)</span>
              <span className="text-sm font-bold text-blue-600">{reportData.sentimentCounts.neutro}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-1000" 
                style={{ width: `${(reportData.sentimentCounts.neutro / (transactions.length || 1)) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Locais mais Frequentes
          </h3>
          <div className="space-y-4">
            {reportData.topLocations.length > 0 ? reportData.topLocations.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-slate-900/50 rounded-2xl border border-blue-50 dark:border-slate-800">
                <span className="text-sm font-medium text-blue-900 dark:text-white">{loc.name}</span>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg">
                  {loc.count} {loc.count === 1 ? 'vez' : 'vezes'}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                Nenhum local identificado ainda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client, Supplier & Product Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Análise de Clientes
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <span className="text-sm text-blue-700 dark:text-blue-300">Clientes Ativos</span>
              <span className="text-xl font-bold text-blue-900 dark:text-white">{reportData.clientCount}</span>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest mb-4">Top 3 Clientes</h4>
              <div className="space-y-3">
                {reportData.topClients.length > 0 ? reportData.topClients.map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{client.name}</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {language === 'pt' ? 'R$' : '$'} {client.total.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400 text-[10px] italic">
                    Nenhuma venda vinculada a clientes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Performance de Produtos
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">Produtos em Estoque</span>
              <span className="text-xl font-bold text-emerald-900 dark:text-white">{products.length}</span>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-emerald-400 dark:text-slate-500 uppercase tracking-widest mb-4">Mais Vendidos</h4>
              <div className="space-y-3">
                {reportData.topSellingProducts.length > 0 ? reportData.topSellingProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{product.name}</span>
                    <span className="text-xs font-bold text-blue-600">
                      {language === 'pt' ? 'R$' : '$'} {product.total.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400 text-[10px] italic">
                    Nenhuma venda de produto registrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Gestão de Fornecedores
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
              <span className="text-sm text-amber-700 dark:text-amber-300">Fornecedores</span>
              <span className="text-xl font-bold text-amber-900 dark:text-white">{reportData.supplierCount}</span>
            </div>
            
            <div className="p-6 bg-blue-50/50 dark:bg-slate-900/50 rounded-3xl border border-blue-50 dark:border-slate-800">
              <h4 className="text-sm font-bold text-blue-900 dark:text-white mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Dica Estratégica
              </h4>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                {reportData.supplierCount < 3 
                  ? "Considere diversificar seus fornecedores para reduzir riscos de dependência."
                  : "Sua base de fornecedores está saudável. Revise contratos para otimizar custos."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Analysis - Strictly Strategic */}
      <div className="space-y-6 relative">
        {isBasic && (
          <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/30 dark:bg-black/30 rounded-[32px] md:rounded-[48px] flex items-center justify-center p-6 text-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-800 max-w-sm">
              <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-blue-900 dark:text-white mb-2">Matriz SWOT Exclusiva</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                A análise SWOT detalhada está disponível apenas nos planos Pro e Elite.
              </p>
              <button 
                onClick={onBack}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Fazer Upgrade
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-4">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold text-blue-900 dark:text-white">{t('report.swot_title')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-[40px] relative overflow-hidden group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            <div className="absolute top-4 right-4 text-emerald-200 dark:text-emerald-900/40 group-hover:text-emerald-300 transition-colors">
              <TrendingUp className="w-12 h-12" />
            </div>
            <h5 className="text-emerald-800 dark:text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('report.strengths')}
            </h5>
            <ul className="space-y-3 text-emerald-700 dark:text-emerald-500 text-sm">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_strength_1').replace('{area}', reportData.positiveArea)}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_strength_2').replace('{months}', reportData.lastMonths.length.toString())}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_strength_3')}
              </li>
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-8 rounded-[40px] relative overflow-hidden group hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <div className="absolute top-4 right-4 text-rose-200 dark:text-rose-900/40 group-hover:text-rose-300 transition-colors">
              <TrendingDown className="w-12 h-12" />
            </div>
            <h5 className="text-rose-800 dark:text-rose-400 font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              {t('report.weaknesses')}
            </h5>
            <ul className="space-y-3 text-rose-700 dark:text-rose-500 text-sm">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_weakness_1').replace('{area}', reportData.negativeArea)}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_weakness_2')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_weakness_3')}
              </li>
            </ul>
          </div>

          {/* Opportunities */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-8 rounded-[40px] relative overflow-hidden group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <div className="absolute top-4 right-4 text-blue-200 dark:text-blue-900/40 group-hover:text-blue-300 transition-colors">
              <Zap className="w-12 h-12" />
            </div>
            <h5 className="text-blue-800 dark:text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {t('report.opportunities')}
            </h5>
            <ul className="space-y-3 text-blue-700 dark:text-blue-500 text-sm">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_opportunity_1').replace('{area}', reportData.negativeArea)}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_opportunity_2').replace('{area}', reportData.positiveArea)}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_opportunity_3')}
              </li>
            </ul>
          </div>

          {/* Threats */}
          <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-[40px] relative overflow-hidden group hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <div className="absolute top-4 right-4 text-amber-200 dark:text-amber-900/40 group-hover:text-amber-300 transition-colors">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h5 className="text-amber-800 dark:text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              {t('report.threats')}
            </h5>
            <ul className="space-y-3 text-amber-700 dark:text-amber-500 text-sm">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_threat_1')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_threat_2').replace('{area}', reportData.positiveArea)}
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                {t('report.swot_threat_3')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Strategic Resolution Table */}
      <div className="relative">
        {isBasic && (
          <div className="absolute inset-0 z-20 backdrop-blur-[4px] bg-white/10 dark:bg-black/10 rounded-[32px] md:rounded-[48px]" />
        )}
        <div className="bg-white dark:bg-black p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-blue-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">{t('report.resolution_title')}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-2">{t('report.problem')}</th>
                <th className="px-6 py-2">{t('report.cause')}</th>
                <th className="px-6 py-2">{t('report.resolution')}</th>
                <th className="px-6 py-2">{t('report.priority')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50/30 dark:bg-slate-800/50 rounded-2xl">
                <td className="px-6 py-5 rounded-l-2xl border-y border-l border-blue-50 dark:border-slate-800">
                  <div className="font-bold text-blue-900 dark:text-white">{t('report.problem_1').replace('{area}', reportData.negativeArea)}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">{t('report.cause_1')}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs font-bold text-blue-900 dark:text-white">{t('report.res_1')}</div>
                </td>
                <td className="px-6 py-5 rounded-r-2xl border-y border-r border-blue-50 dark:border-slate-800">
                  <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{t('report.priority_critical')}</span>
                </td>
              </tr>
              <tr className="bg-blue-50/30 dark:bg-slate-800/50 rounded-2xl">
                <td className="px-6 py-5 rounded-l-2xl border-y border-l border-blue-50 dark:border-slate-800">
                  <div className="font-bold text-blue-900 dark:text-white">{t('report.problem_2')}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">{t('report.cause_2')}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs font-bold text-blue-900 dark:text-white">{t('report.res_2')}</div>
                </td>
                <td className="px-6 py-5 rounded-r-2xl border-y border-r border-blue-50 dark:border-slate-800">
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{t('report.priority_high')}</span>
                </td>
              </tr>
              <tr className="bg-blue-50/30 dark:bg-slate-800/50 rounded-2xl">
                <td className="px-6 py-5 rounded-l-2xl border-y border-l border-blue-50 dark:border-slate-800">
                  <div className="font-bold text-blue-900 dark:text-white">{t('report.problem_3')}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">{t('report.cause_3').replace('{area}', reportData.positiveArea)}</div>
                </td>
                <td className="px-6 py-5 border-y border-blue-50 dark:border-slate-800">
                  <div className="text-xs font-bold text-blue-900 dark:text-white">{t('report.res_3')}</div>
                </td>
                <td className="px-6 py-5 rounded-r-2xl border-y border-r border-blue-50 dark:border-slate-800">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{t('report.priority_medium')}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Personalized Recommendations */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-10 rounded-[48px] border border-blue-100 dark:border-slate-800 shadow-xl">
        <h3 className="text-2xl font-bold text-blue-900 dark:text-white mb-8 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-amber-500" />
          Recomendações Personalizadas da IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800">
            <h4 className="font-bold text-blue-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Foco em Clientes
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {reportData.clientCount === 0 
                ? "Você ainda não tem clientes cadastrados. Comece registrando seus clientes para entender quem são seus melhores compradores e personalizar suas ofertas."
                : `Você tem ${reportData.clientCount} clientes ativos. ${reportData.topClients.length > 0 ? `O cliente "${reportData.topClients[0].name}" é seu maior parceiro comercial. Considere criar um programa de fidelidade para recompensar essa parceria.` : "Continue registrando suas vendas para identificar seus principais clientes."}`}
            </p>
          </div>

          <div className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800">
            <h4 className="font-bold text-blue-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              Gestão de Estoque
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {reportData.totalStockValue === 0 
                ? "Seu estoque está vazio ou não registrado. Cadastrar seus produtos permite que a IA preveja quando você precisará reabastecer e evite perda de vendas."
                : `Seu valor total em estoque é de R$ ${reportData.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Mantenha o giro de estoque alto para evitar capital parado em produtos de baixa saída.`}
            </p>
          </div>

          <div className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800">
            <h4 className="font-bold text-blue-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Crescimento de Receita
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {reportData.isGrowing 
                ? `Seu negócio cresceu ${reportData.growthRate.toFixed(1)}% recentemente. O nicho de "${reportData.positiveArea}" está performando bem. Considere investir mais em marketing para esta categoria.`
                : `Atenção: Houve uma retração de ${Math.abs(reportData.growthRate).toFixed(1)}% na receita. Revise sua estratégia de vendas para o nicho de "${reportData.positiveArea}" e tente identificar novos canais de aquisição.`}
            </p>
          </div>

          <div className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800">
            <h4 className="font-bold text-blue-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Controle de Gastos
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {`Seus maiores gastos estão concentrados em "${reportData.negativeArea}". Analise se esses custos são essenciais para a operação ou se há margem para negociação com fornecedores.`}
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Action Plan - Time-Bound */}
      <div className="bg-blue-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800 rounded-full blur-[120px] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <BrainCircuit className="w-10 h-10 text-amber-400" />
            <h3 className="text-3xl font-bold">{t('report.action_plan')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{t('report.30_days')}</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <h5 className="font-bold text-lg mb-2">{t('report.action_30_title')}</h5>
                <p className="text-blue-200 text-xs leading-relaxed">
                  {t('report.action_30_desc').replace('{area}', reportData.negativeArea)}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{t('report.90_days')}</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <h5 className="font-bold text-lg mb-2">{t('report.action_90_title')}</h5>
                <p className="text-blue-200 text-xs leading-relaxed">
                  {t('report.action_90_desc').replace('{area}', reportData.positiveArea)}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{t('report.1_year')}</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <h5 className="font-bold text-lg mb-2">{t('report.action_1y_title')}</h5>
                <p className="text-blue-200 text-xs leading-relaxed">
                  {t('report.action_1y_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </motion.div>
  );
};
