import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  User as UserIcon, 
  CreditCard, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { Logo } from './ui/Logo';
import { NicheSelector } from './ui/NicheSelector';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import PhoneInput, { getCountryCallingCode, getCountries } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';

// Helper to get flag emoji from country code
function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Custom Flag Component using flagcdn.com for reliability
const FlagComponent = ({ country, countryName }: { country: string; countryName: string }) => {
  if (!country) return <span className="text-xl">🌐</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
      alt={countryName}
      className="w-6 h-auto inline-block align-middle rounded-sm shadow-sm"
      referrerPolicy="no-referrer"
      style={{ display: 'block', minWidth: '24px' }}
    />
  );
};

// Custom labels to show flag emoji
const countryLabels = Object.fromEntries(
  getCountries().map(code => [code, `${getFlagEmoji(code)}` || code])
);

interface ProfileSetupProps {
  profile: UserProfile;
  onComplete: (data: Partial<UserProfile>) => Promise<void>;
  onBack?: () => void;
}

export const ProfileSetup = ({ profile, onComplete, onBack }: ProfileSetupProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeEmpresa: profile?.nomeEmpresa || '',
    nomeResponsavel: profile?.nomeResponsavel || '',
    cnpjEmpresa: profile?.cnpjEmpresa || '',
    descricaoEmpresa: profile?.descricaoEmpresa || '',
    nicho: profile?.nicho || '',
    telefone: profile?.telefone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onComplete(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-blue-100 dark:border-slate-800"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo className="w-24 h-12" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 dark:text-white mb-2">{t('profile.title')}</h1>
          <p className="text-blue-500 dark:text-slate-500 text-sm">{t('profile.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Empresa */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('profile.company_name')}</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
              <input 
                type="text" 
                required
                placeholder={t('profile.company_placeholder')}
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-900 dark:text-white"
              />
            </div>
          </div>

          {/* Responsável */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('profile.responsible_name')}</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
                <input 
                  type="text" 
                  required
                  placeholder={t('profile.responsible_placeholder')}
                  value={formData.nomeResponsavel}
                  onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('profile.cnpj')}</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
                <input 
                  type="text" 
                  required
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpjEmpresa}
                  onChange={(e) => setFormData({ ...formData, cnpjEmpresa: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Sobre a Empresa */}
          <div className="pt-4 border-t border-blue-100 dark:border-slate-800">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('profile.about')}</label>
              <div className="relative">
                <textarea 
                  placeholder={t('profile.about_placeholder')}
                  value={formData.descricaoEmpresa}
                  onChange={(e) => setFormData({ ...formData, descricaoEmpresa: e.target.value })}
                  className="w-full p-4 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-900 dark:text-white min-h-[120px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Nicho do Negócio</label>
              <NicheSelector 
                value={formData.nicho}
                onChange={(val) => setFormData({ ...formData, nicho: val })}
                placeholder="Selecionar Nicho do Negócio"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('profile.phone')}</label>
              <div className="phone-input-container">
                <PhoneInput
                  placeholder={t('profile.phone')}
                  value={formData.telefone}
                  onChange={(val) => setFormData({ ...formData, telefone: val || '' })}
                  defaultCountry="BR"
                  labels={countryLabels}
                  flagComponent={FlagComponent}
                  className="w-full px-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all text-blue-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('common.finish_setup')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {onBack && (
              <button 
                type="button"
                onClick={onBack}
                className="w-full py-4 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {t('common.back_to_plans')}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
