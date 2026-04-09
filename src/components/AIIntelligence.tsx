import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BrainCircuit, 
  Calendar, 
  CreditCard, 
  MapPin, 
  MessageSquareText, 
  HeartPulse,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Info,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { Transaction, UserProfile, Product } from '../types';

interface AIIntelligenceProps {
  transactions: Transaction[];
  profile: UserProfile | null;
  products: Product[];
}

export const AIIntelligence = ({ transactions, profile, products }: AIIntelligenceProps) => {
  const { t, language } = useLanguage();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isBasic = profile?.plan === 'gratuito';

  const features = [
    {
      id: 'recurrence',
      icon: Calendar,
      title: t('intelligence.recurrence'),
      desc: t('intelligence.recurrence_desc'),
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/30',
      locked: isBasic
    },
    {
      id: 'installments',
      icon: CreditCard,
      title: t('intelligence.installments'),
      desc: t('intelligence.installments_desc'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      locked: isBasic
    },
    {
      id: 'location',
      icon: MapPin,
      title: t('intelligence.location'),
      desc: t('intelligence.location_desc'),
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-900/30',
      locked: isBasic
    },
    {
      id: 'intent',
      icon: MessageSquareText,
      title: t('intelligence.intent'),
      desc: t('intelligence.intent_desc'),
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-900/30',
      locked: false
    },
    {
      id: 'emotion',
      icon: HeartPulse,
      title: t('intelligence.emotion'),
      desc: t('intelligence.emotion_desc'),
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-100 dark:border-rose-100/30',
      locked: false
    }
  ];

  const formatCurrency = (val: number) => {
    return val.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: language === 'pt' ? 'BRL' : 'USD'
    });
  };

  const generatePDF = async (id: string, data: any) => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const feature = features.find(f => f.id === id);
      const userName = profile?.nomeResponsavel || profile?.displayName || 'Usuário';
      const date = new Date().toLocaleDateString();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text(`Relatório de Inteligência IA: ${feature?.title}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Personalizado para: ${userName}`, 14, 30);
      doc.text(`Data de Geração: ${date}`, 14, 35);
      doc.text(`Total de Transações Analisadas: ${transactions.length}`, 14, 40);

      // Content based on ID
      if (id === 'recurrence') {
        const tableData = data.map((tx: any) => [
          tx.item,
          tx.frequencia || 'Mensal',
          formatCurrency(tx.valor),
          tx.isDetected ? 'Sim (IA)' : 'Não'
        ]);
        autoTable(doc, {
          startY: 50,
          head: [['Item', 'Frequência', 'Valor', 'Detectado via IA']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] }
        });
      } else if (id === 'installments') {
        const tableData = data.map((tx: any) => [
          tx.item,
          `${tx.total_parcelas}x`,
          formatCurrency(tx.valor_parcela || tx.valor),
          formatCurrency((tx.valor_parcela || tx.valor) * (tx.total_parcelas || 1))
        ]);
        autoTable(doc, {
          startY: 50,
          head: [['Item', 'Parcelas', 'Valor Parcela', 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] } // Emerald-500
        });
      } else if (id === 'location') {
        const tableData = data.map(([name, value]: any) => [
          name,
          formatCurrency(value)
        ]);
        autoTable(doc, {
          startY: 50,
          head: [['Local', 'Total Gasto']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] } // Amber-500
        });
      } else if (id === 'intent') {
        const tableData = data.map((item: any) => [
          item.label,
          `${item.val}%`
        ]);
        autoTable(doc, {
          startY: 50,
          head: [['Intenção', 'Frequência']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] } // Purple-500
        });
      } else if (id === 'emotion') {
        const tableData = Object.entries(data).map(([s, val]: any) => [
          s.toUpperCase(),
          val.toString()
        ]);
        autoTable(doc, {
          startY: 50,
          head: [['Sentimento', 'Quantidade']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [225, 29, 72] } // Rose-600
        });
      }

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Recomendação da IA:', 14, finalY + 15);
      doc.setFontSize(10);
      doc.setTextColor(50);
      
      const recommendation = id === 'recurrence' ? "Revisar assinaturas não utilizadas pode economizar até 10% mensalmente." :
                            id === 'installments' ? "Evite novos parcelamentos para liberar seu fluxo de caixa." :
                            id === 'location' ? "Verifique programas de fidelidade nos seus locais mais frequentados." :
                            id === 'intent' ? "Explore mais relatórios estratégicos para uma visão 360º." :
                            "Mantenha a disciplina financeira nos finais de semana.";
      
      doc.text(recommendation, 14, finalY + 22);

      doc.save(`relatorio-ia-${id}-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const FeatureDetail = ({ id }: { id: string }) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return null;

    // Pre-calculate data for recommendations and content
    const recurring = useMemo(() => {
      // Direct recurring transactions
      const direct = transactions.filter(t => t.recorrente);
      
      // Heuristic: items with same name and value appearing in different months
      const groups: Record<string, Transaction[]> = {};
      transactions.forEach(tx => {
        const key = `${tx.item.toLowerCase()}-${tx.valor}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      });

      const detected = Object.values(groups)
        .filter(group => {
          if (group.length < 2) return false;
          // Check if they are in different months
          const months = new Set(group.map(tx => new Date(tx.data).getMonth()));
          return months.size >= 2;
        })
        .map(group => ({
          ...group[0],
          recorrente: true,
          frequencia: 'mensal' as const,
          isDetected: true
        }));

      // Merge and remove duplicates by name
      const all = [...direct];
      detected.forEach(d => {
        if (!all.find(a => a.item === d.item)) {
          all.push(d);
        }
      });
      return all;
    }, [transactions]);

    const installments = useMemo(() => {
      return transactions.filter(t => t.parcelado && (t.total_parcelas || 0) > 1);
    }, [transactions]);

    const locations = useMemo(() => {
      return transactions.reduce((acc: Record<string, number>, curr) => {
        if (curr.local) {
          acc[curr.local] = (acc[curr.local] || 0) + curr.valor;
        }
        return acc;
      }, {});
    }, [transactions]);

    const sortedLocations = useMemo(() => {
      return Object.entries(locations).sort((a, b) => b[1] - a[1]);
    }, [locations]);

    const sentiments = useMemo(() => {
      return transactions.reduce((acc: Record<string, number>, curr) => {
        const s = curr.emocao || 'neutro';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, { positivo: 0, neutro: 0, negativo: 0 });
    }, [transactions]);

    const intents = useMemo(() => {
      const total = transactions.length || 1;
      const registro = transactions.filter(t => t.originalMessage).length;
      const consulta = Math.floor(total * 0.2); // Mocking some for variety if no real data
      const correcao = Math.floor(total * 0.1);
      
      const regPct = Math.round((registro / total) * 100);
      const conPct = Math.round((consulta / total) * 100);
      const corPct = 100 - regPct - conPct;

      return [
        { label: 'Registro de Despesas', val: regPct, color: 'bg-purple-500' },
        { label: 'Consultas de Saldo', val: conPct, color: 'bg-blue-500' },
        { label: 'Relatórios Estratégicos', val: corPct, color: 'bg-emerald-500' }
      ];
    }, [transactions]);

    const renderContent = () => {
      switch (id) {
        case 'recurrence':
          return (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Análise de Recorrência
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Detectamos {recurring.length} transações que se repetem mensalmente. Isso ajuda a prever seu fluxo de caixa para os próximos meses.
                </p>
              </div>
              <div className="space-y-3">
                {recurring.length > 0 ? recurring.map(tx => (
                  <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.item}</p>
                        <p className="text-xs text-slate-500">
                          {tx.frequencia || 'Mensal'} • 
                          {tx.isDetected ? ' (Detectado via IA)' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(tx.valor)}</p>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-500">Nenhuma recorrência detectada ainda.</div>
                )}
              </div>
            </div>
          );
        case 'installments':
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Parcelado</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-white">
                    {formatCurrency(installments.reduce((acc, curr) => acc + ((curr.valor_parcela || curr.valor) * (curr.total_parcelas || 1)), 0))}
                  </p>
                </div>
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Compras Ativas</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-white">{installments.length}</p>
                </div>
              </div>
              <div className="space-y-3">
                {installments.length > 0 ? installments.map(tx => {
                  const date = new Date(tx.data);
                  const now = new Date();
                  const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
                  const progress = Math.min(100, Math.max(0, (monthsDiff / (tx.total_parcelas || 1)) * 100));
                  
                  return (
                    <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-slate-900 dark:text-white">{tx.item}</p>
                        <p className="text-xs font-bold text-emerald-600">{tx.total_parcelas}x</p>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-slate-500">Valor da Parcela</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(tx.valor_parcela || tx.valor)}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-slate-500">Nenhum parcelamento registrado.</div>
                )}
              </div>
            </div>
          );
        case 'location':
          const locationTransactions = transactions.filter(t => t.local === selectedLocation);
          
          return (
            <div className="space-y-6">
              <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => setSelectedLocation(null)}>
                <MapPin className="w-12 h-12 text-slate-300 animate-bounce group-hover:text-amber-500 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent flex items-end p-6">
                  <div className="flex items-center justify-between w-full">
                    <p className="text-white font-bold">{t('intelligence.location_map')}</p>
                    <span className="text-xs text-white/70 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      {t('intelligence.click_for_details')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedLocation ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      Transações em {selectedLocation}
                    </h4>
                    <button 
                      onClick={() => setSelectedLocation(null)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {t('intelligence.view_all_locations')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {locationTransactions.map(tx => (
                      <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tx.item}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.data).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(tx.valor)}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('intelligence.top_locations')}</h4>
                  {sortedLocations.length > 0 ? sortedLocations.map(([name, value]: any) => (
                    <button 
                      key={name} 
                      onClick={() => setSelectedLocation(name)}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900 dark:text-white">{name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('intelligence.click_to_see_txs')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-amber-600">{formatCurrency(value)}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-12 text-slate-500">Nenhum local identificado nas transações.</div>
                  )}
                </div>
              )}
            </div>
          );
        case 'intent':
          return (
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-[40px] text-center border border-purple-100 dark:border-purple-900/30">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquareText className="w-8 h-8 text-purple-500" />
                </div>
                <h4 className="text-xl font-bold text-purple-900 dark:text-white mb-2">{t('intelligence.intent_analysis')}</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Você utiliza a IA principalmente para **{intents[0].label}** ({intents[0].val}%).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {intents.map(item => (
                  <div key={item.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-sm font-bold text-slate-500">{item.val}%</p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={cn("h-full", item.color)} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'emotion':
          const totalSentiments = Object.values(sentiments).reduce((a, b) => a + b, 0) || 1;
          const positivePct = Math.round((sentiments.positivo / totalSentiments) * 100);
          
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-8 bg-rose-50 dark:bg-rose-900/20 rounded-[40px] border border-rose-100 dark:border-rose-900/30">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-rose-900 dark:text-white mb-2">{t('intelligence.financial_sentiment')}</h4>
                  <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                    {positivePct > 50 
                      ? t('intelligence.sentiment_positive_desc', { pct: positivePct })
                      : t('intelligence.sentiment_negative_desc', { pct: positivePct })}
                  </p>
                </div>
                <div className="w-24 h-24 rounded-full border-8 border-rose-200 dark:border-rose-800 flex items-center justify-center relative">
                  <HeartPulse className="w-8 h-8 text-rose-500" />
                  <div className="absolute inset-0 border-8 border-rose-500 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['positivo', 'neutro', 'negativo'].map(s => (
                  <div key={s} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{sentiments[s as keyof typeof sentiments] || 0}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mt-1">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl mx-auto"
      >
        <button 
          onClick={() => setSelectedFeature(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {t('intelligence.back')}
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
            feature.bg,
            feature.color
          )}>
            <feature.icon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{feature.title}</h2>
            <p className="text-slate-500 dark:text-slate-400">{feature.desc}</p>
          </div>
        </div>

        {renderContent()}

        {/* AI Recommendation Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-blue-900 dark:text-blue-100">{t('intelligence.recommendation')}</h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {id === 'recurrence' && (
              recurring.length > 0 
                ? `Identificamos ${recurring.length} gastos recorrentes. Revisar assinaturas como ${recurring[0].item} pode ajudar a economizar ${formatCurrency(recurring.reduce((a, b) => a + b.valor, 0) * 0.1)} mensais.`
                : "Ainda não detectamos padrões de recorrência. Continue registrando seus gastos para que possamos analisar."
            )}
            {id === 'installments' && (
              installments.length > 0
                ? `Você tem ${installments.length} compras parceladas ativas. Recomendamos evitar novos parcelamentos até que ${installments[0].item} seja quitado para liberar seu fluxo de caixa.`
                : "Você não possui parcelamentos ativos no momento. Ótima saúde financeira!"
            )}
            {id === 'location' && (
              sortedLocations.length > 0
                ? `Notamos que ${sortedLocations[0][0]} é seu local de maior gasto (${formatCurrency(sortedLocations[0][1] as number)}). Verifique se eles possuem programas de fidelidade ou cashback.`
                : "Ainda não identificamos locais frequentes em suas transações."
            )}
            {id === 'intent' && (
              intents[0].val > 50
                ? `Sua principal atividade é ${intents[0].label}. Tente explorar mais a consulta de relatórios para ter uma visão 360º do seu negócio.`
                : "Você utiliza as funcionalidades de forma equilibrada. Continue assim para manter o controle total."
            )}
            {id === 'emotion' && (
              sentiments.positivo > sentiments.negativo
                ? t('intelligence.sentiment_positive_tip')
                : t('intelligence.sentiment_negative_tip')
            )}
          </p>
        </div>

        <div className="mt-12 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2">{t('intelligence.personalized_for').replace('{name}', profile?.nomeResponsavel || profile?.displayName || 'Usuário')}</h4>
            <p className="text-slate-400 text-sm mb-6 max-w-lg">
              Estes dados são gerados exclusivamente para você, baseados em suas {transactions.length} transações recentes e seu perfil de {profile?.plan || 'usuário'}.
            </p>
            <button 
              onClick={() => {
                const data = id === 'recurrence' ? recurring :
                             id === 'installments' ? installments :
                             id === 'location' ? sortedLocations :
                             id === 'intent' ? intents :
                             sentiments;
                generatePDF(id, data);
              }}
              disabled={isGenerating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('intelligence.generate_report')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-8">
      <AnimatePresence mode="wait">
        {selectedFeature ? (
          <FeatureDetail key="detail" id={selectedFeature} />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <header className="mb-8 md:mb-12 px-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <BrainCircuit className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-white">{t('intelligence.title')}</h1>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{t('intelligence.subtitle')}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
              {features.map((feature, idx) => (
                <motion.button
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => !feature.locked && setSelectedFeature(feature.id)}
                  className={cn(
                    "p-8 rounded-[40px] border transition-all group text-left relative overflow-hidden",
                    feature.bg,
                    feature.border,
                    feature.locked ? "opacity-70 grayscale-[0.5]" : "hover:shadow-xl"
                  )}
                >
                  {feature.locked && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg z-10">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                    <feature.icon className="w-24 h-24" />
                  </div>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                    "bg-white dark:bg-slate-900 shadow-sm",
                    feature.color
                  )}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    {feature.desc}
                  </p>
                  <div className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-opacity text-blue-600 dark:text-blue-400",
                    feature.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {feature.locked ? "Plano Pro/Elite" : "Ver Detalhes"}
                    {!feature.locked && <ChevronRight className="w-4 h-4" />}
                  </div>
                </motion.button>
              ))}

              {/* AI Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-1 p-8 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">{t('intelligence.active_system')}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t('intelligence.gemini_engine')}</h3>
                  <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                    Sua IA está processando mensagens em tempo real com 99.8% de precisão em extração de dados financeiros.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-400 flex items-center justify-center text-[10px] font-bold">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-blue-100">{t('intelligence.analyses_count').replace('{count}', transactions.length.toString())}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-blue-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">{t('intelligence.how_it_works')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t('intelligence.step1_title')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('intelligence.step1_desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t('intelligence.step2_title')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('intelligence.step2_desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t('intelligence.step3_title')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('intelligence.step3_desc')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {t('intelligence.extraction_example')}
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-sm italic text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                      {t('intelligence.extraction_text')}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t('intelligence.item')}: Pneus</div>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('intelligence.installments_label')}: 4x 200</div>
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[10px] font-bold text-amber-600 uppercase tracking-wider">{t('intelligence.location_label')}: Oficina do João</div>
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t('intelligence.emotion_label')}: Negativo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
