import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  Rocket, 
  CheckCircle2, 
  XCircle,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Plan } from '../types';
import { Logo } from './ui/Logo';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionAreaProps {
  onSelectPlan: (plan: Plan) => void;
  onLogout: () => void;
  currentPlan?: Plan;
  onBack?: () => void;
  uid?: string;
  email?: string;
  isTrial?: boolean;
  isTrialExpired?: boolean;
}

import { PlanSupportChat } from './PlanSupportChat';

export const SubscriptionArea = ({ onSelectPlan, onLogout, currentPlan, onBack, uid, email, isTrial, isTrialExpired }: SubscriptionAreaProps) => {
  const { t } = useLanguage();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const planHierarchy: Record<Plan, number> = {
    'gratuito': 1,
    'pro': 2,
    'elite': 3
  };

  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'elite';

  const canSelect = (plan: Plan) => {
    if (isTrialExpired && plan === 'gratuito') return false;
    if (!currentPlan) return true;
    return planHierarchy[plan] >= planHierarchy[currentPlan];
  };

  const handleSelectPlan = (plan: Plan) => {
    const links = {
      gratuito: 'https://pay.cakto.com.br/puj2obo_827674',
      pro: 'https://pay.cakto.com.br/pm5maec_827675',
      elite: 'https://pay.cakto.com.br/3amiea7_827676'
    };

    if (plan !== 'gratuito' && uid) {
      // Abre o link de pagamento em uma nova aba com a referência do usuário
      const externalRef = JSON.stringify({ uid, plan });
      const baseUrl = links[plan];
      const paymentUrl = `${baseUrl}?external_reference=${encodeURIComponent(externalRef)}`;
      window.open(paymentUrl, '_blank');
    }
    
    // Atualiza o plano no app
    onSelectPlan(plan);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-8 left-8 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              {t('sub.cancel_upgrade')}
            </button>
          )}
          <div className="flex justify-center mb-6">
            <Logo className="w-32 h-16" showText={false} />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 dark:text-white mb-4">
            {currentPlan ? t('sub.upgrade_title') : t('sub.welcome_title')}
          </h1>
          <p className="text-blue-600 dark:text-blue-400 max-w-md mx-auto">
            {currentPlan 
              ? t('sub.upgrade_desc') 
              : t('sub.welcome_desc')}
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plano Gratuito */}
        <div className="bg-white dark:bg-black p-8 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-xl flex flex-col">
          <div className="mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white">{t('sub.plan_free')}</h2>
            <p className="text-blue-500 dark:text-slate-500 text-sm">{t('sub.free_desc')}</p>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-white mb-6">
            {t('sub.price_free')}
            {isTrial && (
              <div className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full mt-2 block w-fit">
                {t('trial.14_days_free')}
              </div>
            )}
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_limited_access')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_basic_functions')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-400 dark:text-slate-600">
              <XCircle className="w-5 h-5 text-rose-300 dark:text-rose-900/50" />
              {t('sub.feature_no_deep_customization')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-400 dark:text-slate-600">
              <XCircle className="w-5 h-5 text-rose-300 dark:text-rose-900/50" />
              {t('sub.feature_no_advanced_tracking')}
            </li>
          </ul>
          <button 
            onClick={() => handleSelectPlan('gratuito')}
            disabled={!canSelect('gratuito')}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all",
              canSelect('gratuito') 
                ? (currentPlan === 'gratuito' ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30")
                : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            {isTrialExpired && !isPaidPlan ? t('trial.expired_title') : (currentPlan === 'gratuito' ? t('sub.action_enter') : t('sub.action_choose'))}
          </button>
        </div>

        {/* Plano Pro */}
        <div className="bg-blue-600 dark:bg-blue-700 p-8 rounded-3xl border border-blue-500 dark:border-blue-600 shadow-2xl shadow-blue-600/20 flex flex-col scale-105 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-blue-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {t('sub.most_popular')}
          </div>
          <div className="mb-6">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('sub.plan_pro')}</h2>
            <p className="text-blue-100 text-sm">{t('sub.pro_desc')}</p>
          </div>
          <div className="text-3xl font-bold text-white mb-6">
            {t('sub.price_pro')}
            <span className="text-sm font-normal opacity-70 ml-1">{t('sub.price_monthly')}</span>
            {isTrial && (
              <div className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mt-2 block w-fit">
                {t('trial.14_days_free')}
              </div>
            )}
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-blue-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              {t('sub.feature_custom_ai')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              {t('sub.feature_full_plans')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              {t('sub.feature_auto_adjustments')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              {t('sub.feature_intelligent_tracking')}
            </li>
          </ul>
          <button 
            onClick={() => handleSelectPlan('pro')}
            disabled={!canSelect('pro')}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all shadow-lg",
              canSelect('pro') 
                ? (currentPlan === 'pro' ? "bg-emerald-400 text-blue-900 hover:bg-emerald-500 shadow-amber-400/20" : "bg-white text-blue-600 hover:bg-blue-50")
                : "bg-blue-500 dark:bg-blue-600 text-blue-200 cursor-not-allowed"
            )}
          >
            {currentPlan === 'pro' ? t('sub.action_enter') : (isTrial ? t('sub.action_choose') : t('sub.action_subscribe_pro'))}
          </button>
        </div>

        {/* Plano Elite */}
        <div className="bg-white dark:bg-black p-8 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-xl flex flex-col">
          <div className="mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white">{t('sub.plan_elite')}</h2>
            <p className="text-blue-500 dark:text-slate-500 text-sm">{t('sub.elite_desc')}</p>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-white mb-6">
            {t('sub.price_elite')}
            <span className="text-sm font-normal opacity-50 ml-1">{t('sub.price_monthly')}</span>
            {isTrial && (
              <div className="text-[10px] font-bold bg-blue-100 dark:bg-slate-800 text-blue-600 px-2 py-0.5 rounded-full mt-2 block w-fit">
                {t('trial.14_days_free')}
              </div>
            )}
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_pro_plus')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_advanced_mode')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_exclusive_challenges')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_high_performance')}
            </li>
            <li className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('sub.feature_accelerated_evolution')}
            </li>
          </ul>
          <button 
            onClick={() => handleSelectPlan('elite')}
            disabled={!canSelect('elite')}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all",
              canSelect('elite') 
                ? (currentPlan === 'elite' ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-blue-900 dark:bg-blue-950 text-white hover:bg-blue-950 dark:hover:bg-black")
                : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            {currentPlan === 'elite' ? t('sub.action_enter') : (isTrial ? t('sub.action_choose') : t('sub.action_talk_consultant'))}
          </button>
        </div>
      </div>
      <div className="mt-12 text-center flex flex-col items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-bold border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-lg shadow-blue-600/5"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block text-sm leading-tight">{t('sub.talk_consultant')}</span>
            <span className="block text-[10px] opacity-60 font-medium uppercase tracking-wider">{t('sub.consultant_desc')}</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.button>

        {!currentPlan && !isTrialExpired && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => handleSelectPlan('gratuito')}
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
            >
              Continuar com Plano Básico (Gratuito)
            </button>
            <button 
              onClick={onLogout}
              className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        )}
        {isTrialExpired && (
          <button 
            onClick={onLogout}
            className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('nav.logout')}
          </button>
        )}
      </div>

      <PlanSupportChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </motion.div>
  </div>
);
}
