import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BrainCircuit, 
  BarChart3, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { Logo } from './ui/Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.step1_title'),
      description: t('onboarding.step1_desc'),
      icon: <Sparkles className="w-12 h-12 text-blue-600" />,
      color: "bg-blue-50",
      accent: "text-blue-600"
    },
    {
      title: t('onboarding.step2_title'),
      description: t('onboarding.step2_desc'),
      icon: <BrainCircuit className="w-12 h-12 text-indigo-600" />,
      color: "bg-indigo-50",
      accent: "text-indigo-600"
    },
    {
      title: t('onboarding.step3_title'),
      description: t('onboarding.step3_desc'),
      icon: <BarChart3 className="w-12 h-12 text-emerald-600" />,
      color: "bg-emerald-50",
      accent: "text-emerald-600",
      showPreview: true
    },
    {
      title: t('onboarding.step4_title'),
      description: t('onboarding.step4_desc'),
      icon: <LayoutDashboard className="w-12 h-12 text-blue-600" />,
      color: "bg-blue-50",
      accent: "text-blue-600"
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-50" />

      <div className="max-w-md w-full z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Logo className="w-24 h-10" showText={false} />
          <button 
            onClick={onComplete}
            className="text-sm font-bold text-blue-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('onboarding.skip')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className={`w-24 h-24 ${steps[currentStep].color} dark:bg-slate-900 rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-sm`}>
              {steps[currentStep].icon}
            </div>

            <h2 className="text-3xl font-bold text-blue-900 dark:text-white mb-4 leading-tight">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-blue-600 dark:text-blue-400 text-lg mb-12 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {steps[currentStep].showPreview && (
              <div className="relative mb-12 rounded-3xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-2xl">
                <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-md z-10 flex items-center justify-center">
                  <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-full border border-white/50 dark:border-slate-700 shadow-sm">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('onboarding.beta_tag')}</span>
                  </div>
                </div>
                <img 
                  src="https://picsum.photos/seed/dashboard/800/600" 
                  alt="Preview" 
                  className="w-full h-48 object-cover grayscale opacity-50"
                  referrerPolicy="no-referrer"
                />
                {/* Mock UI elements to make it look like a blurred dashboard */}
                <div className="absolute top-4 left-4 right-4 flex gap-2 z-0 opacity-20">
                  <div className="h-12 w-1/3 bg-blue-200 dark:bg-slate-700 rounded-xl" />
                  <div className="h-12 w-1/3 bg-blue-200 dark:bg-slate-700 rounded-xl" />
                  <div className="h-12 w-1/3 bg-blue-200 dark:bg-slate-700 rounded-xl" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-auto pt-12">
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-8 bg-blue-600 dark:bg-blue-500" : "w-2 bg-blue-100 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-4">
            {currentStep > 0 && (
              <button 
                onClick={prev}
                className="flex-1 py-4 bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                {t('onboarding.back')}
              </button>
            )}
            <button 
              onClick={next}
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
            >
              {currentStep === steps.length - 1 ? t('onboarding.start') : t('onboarding.next')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
