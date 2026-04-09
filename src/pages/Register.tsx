import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, Building2, User as UserIcon, Key, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from '../components/ui/Logo';
import { NicheSelector } from '../components/ui/NicheSelector';
import PhoneInput from 'react-phone-number-input';
import { getCountries } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '../lib/utils';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

// Helper to get flag emoji from country code
function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Custom Flag Component
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

const countryLabels = Object.fromEntries(
  getCountries().map(code => [code, `${getFlagEmoji(code)}` || code])
);

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { t } = useLanguage();
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [nicho, setNicho] = useState("");
  const [telefone, setTelefone] = useState<string | undefined>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetupHelper, setShowSetupHelper] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowSetupHelper(false);

    if (!nomeEmpresa || !nomeResponsavel || !cnpjEmpresa || !nicho) {
      setError(t('auth.error_required_fields'));
      return;
    }

    setLoading(true);

    try {
      await register(email, password, {
        displayName: nomeResponsavel,
        nomeEmpresa,
        nomeResponsavel,
        cnpjEmpresa,
        descricaoEmpresa,
        nicho,
        telefone: telefone || ""
      });
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.error_email_in_use'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('auth.error_weak_password'));
      } else if (err.code === 'auth/api-key-not-valid') {
        setError(t('auth.error_api_key'));
        setShowSetupHelper(true);
      } else {
        setError(err.message || t('auth.error_google_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setShowSetupHelper(false);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError(t('auth.error_google_not_enabled'));
        setShowSetupHelper(true);
      } else if (err.code === 'auth/api-key-not-valid') {
        setError(t('auth.error_api_key'));
        setShowSetupHelper(true);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(t('auth.error_unauthorized_domain'));
        setShowSetupHelper(true);
      } else {
        setError(t('auth.error_google_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-blue-200/50 dark:shadow-none border border-blue-100 dark:border-slate-800"
      >
        <div className="w-48 h-48 flex items-center justify-center mb-8 mx-auto">
          <Logo className="w-full h-full" />
        </div>
        
        <div className="flex p-1 bg-blue-50 dark:bg-slate-800 rounded-2xl mb-8">
          <button 
            onClick={onSwitchToLogin}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-blue-400 dark:text-slate-500 hover:text-blue-500 transition-all"
          >
            {t('auth.login')}
          </button>
          <button 
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
          >
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
            <input 
              type="email" 
              placeholder={t('auth.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
            <input 
              type="password" 
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
              required
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-2 border-t border-blue-50 dark:border-slate-800"
          >
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
              <input 
                type="text" 
                placeholder={t('auth.company_name')}
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                required
              />
            </div>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
              <input 
                type="text" 
                placeholder={t('auth.owner_name')}
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                required
              />
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
              <input 
                type="text" 
                placeholder={t('auth.cnpj')}
                value={cnpjEmpresa}
                onChange={(e) => setCnpjEmpresa(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                required
              />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-blue-300 dark:text-slate-600" />
              <textarea 
                placeholder={t('auth.company_desc')}
                value={descricaoEmpresa}
                onChange={(e) => setDescricaoEmpresa(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('auth.business_niche')}</label>
              <NicheSelector 
                value={nicho}
                onChange={setNicho}
                placeholder={t('auth.business_niche')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('auth.phone_label')}</label>
              <div className="phone-input-container">
                <PhoneInput
                  placeholder={t('auth.phone_label')}
                  value={telefone}
                  onChange={setTelefone}
                  defaultCountry="BR"
                  labels={countryLabels}
                  flagComponent={FlagComponent}
                  className="w-full px-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all text-blue-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="space-y-4 px-2">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.action_register')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-blue-300 font-bold">{t('auth.or_continue_with')}</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-blue-900 dark:text-white rounded-2xl font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" className="w-5 h-5" alt="Google" />
              Google
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
