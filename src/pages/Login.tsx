import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, Key, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from '../components/ui/Logo';
import { cn } from '../lib/utils';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { t } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetupHelper, setShowSetupHelper] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowSetupHelper(false);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(t('auth.error_invalid'));
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
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
          >
            {t('auth.login')}
          </button>
          <button 
            onClick={onSwitchToRegister}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-blue-400 dark:text-slate-500 hover:text-blue-500 transition-all"
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

          {error && (
            <div className="space-y-4 px-2">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
              
              {showSetupHelper && (
                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{t('auth.setup_helper_title')}</p>
                  </div>
                  
                  <ol className="text-xs text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-3 mb-4">
                    <li>{t('auth.setup_helper_step1')}</li>
                    <li>{t('auth.setup_helper_step2')}</li>
                    <li>{t('auth.setup_helper_step3')}</li>
                    <li>{t('auth.setup_helper_step4')}</li>
                  </ol>

                  <button 
                    onClick={() => {
                      setError("");
                      setShowSetupHelper(false);
                    }}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-95"
                  >
                    {t('auth.setup_helper_retry')}
                  </button>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.action_login')}
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
