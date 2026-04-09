import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Layout, 
  MessageSquare, 
  Camera, 
  Smartphone,
  CheckCircle2,
  Monitor,
  Zap
} from 'lucide-react';
import { UserProfile } from '../types';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { NicheSelector } from './ui/NicheSelector';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  profile: UserProfile;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const Settings = ({ isOpen, onClose, onUpgrade, onUpdateProfile, profile, darkMode, setDarkMode }: SettingsProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'perfil' | 'notificacoes' | 'aparencia' | 'idioma' | 'seguranca' | 'layout'>('perfil');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    nicho: profile?.nicho || '',
  });

  // Mock states for settings
  const [notifications, setNotifications] = useState({ all: true, critical: true, deadlines: false });
  const [themeAuto, setThemeAuto] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [staticLayout, setStaticLayout] = useState(true);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    toast.success(t('common.success'));
    setFeedbackText('');
    setShowFeedback(false);
  };

  const handleLanguageConfirm = () => {
    setLanguage(selectedLanguage);
    toast.success(t('common.success'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto flex-shrink-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('settings.title')}</h2>
            
            <nav className="space-y-2 flex md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {[
                { id: 'perfil', icon: User, label: t('settings.profile') },
                { id: 'notificacoes', icon: Bell, label: t('settings.notifications') },
                { id: 'aparencia', icon: Sun, label: t('settings.appearance') },
                { id: 'idioma', icon: Globe, label: t('settings.language') },
                { id: 'seguranca', icon: Shield, label: t('settings.security') },
                { id: 'layout', icon: Layout, label: t('settings.layout') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                {t('settings.feedback')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white dark:bg-slate-950">
            {activeTab === 'perfil' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.profile')}</h3>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-950 shadow-lg">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{t('settings.profile_photo')}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.photo_desc')}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('settings.full_name')}</label>
                    <input 
                      type="text" 
                      value={formData.displayName} 
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nicho do Negócio</label>
                    <NicheSelector 
                      value={formData.nicho}
                      onChange={(val) => setFormData({ ...formData, nicho: val })}
                      placeholder="Selecionar Nicho"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('settings.email')}</label>
                    <input type="email" defaultValue={profile?.email} disabled className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('settings.user_type')}</label>
                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                      <option>{t('settings.admin')}</option>
                      <option>{t('settings.manager')}</option>
                      <option>{t('settings.employee')}</option>
                      <option>{t('settings.lawyer')}</option>
                      <option>{t('settings.client')}</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      onUpgrade();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-800/50"
                  >
                    <Zap className="w-5 h-5" />
                    {t('settings.upgrade')}
                  </button>
                  <button 
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await onUpdateProfile(formData);
                        toast.success(t('common.success'));
                      } catch (error) {
                        toast.error(t('common.error'));
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : t('settings.save')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notificacoes' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.notifications')}</h3>
                
                <div className="space-y-4">
                  {[
                    { id: 'all', label: t('settings.notif_all'), desc: t('settings.notif_all_desc'), state: notifications.all },
                    { id: 'critical', label: t('settings.notif_critical'), desc: t('settings.notif_critical_desc'), state: notifications.critical },
                    { id: 'deadlines', label: t('settings.notif_deadlines'), desc: t('settings.notif_deadlines_desc'), state: notifications.deadlines },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{item.label}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.state ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.state ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'aparencia' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.appearance')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setDarkMode(false); setThemeAuto(false); }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${!darkMode && !themeAuto ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}
                  >
                    <Sun className={`w-8 h-8 ${!darkMode && !themeAuto ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-medium dark:text-white">{t('settings.theme_light')}</span>
                  </button>
                  <button 
                    onClick={() => { setDarkMode(true); setThemeAuto(false); }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${darkMode && !themeAuto ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}
                  >
                    <Moon className={`w-8 h-8 ${darkMode && !themeAuto ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-medium dark:text-white">{t('settings.theme_dark')}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-slate-500" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{t('settings.theme_auto')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.theme_auto_desc')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setThemeAuto(!themeAuto)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${themeAuto ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${themeAuto ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'idioma' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.language')}</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'pt', label: 'Português (Brasil)' },
                    { id: 'en', label: 'English (US)' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id as any)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedLanguage === lang.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}
                    >
                      <span className="font-medium dark:text-white">{lang.label}</span>
                      {selectedLanguage === lang.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleLanguageConfirm}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('settings.lang_confirm')}
                </button>
              </motion.div>
            )}

            {activeTab === 'seguranca' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.security_title')}</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="font-medium text-slate-900 dark:text-white">{t('settings.change_password')}</h4>
                    <input type="password" placeholder={t('settings.current_password')} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                    <input type="password" placeholder={t('settings.new_password')} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                    <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                      {t('settings.update_password')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-slate-500" />
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{t('settings.biometric')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.biometric_desc')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBiometric(!biometric)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${biometric ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${biometric ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'layout' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('settings.layout_title')}</h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Layout className="w-5 h-5 text-slate-500" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{t('settings.static_elements')}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.static_desc')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStaticLayout(!staticLayout)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${staticLayout ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${staticLayout ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-50 w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">{t('settings.feedback_title')}</h3>
                <button onClick={() => setShowFeedback(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleFeedbackSubmit}>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t('settings.feedback_placeholder')}
                  className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none dark:text-white mb-4"
                  required
                />
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                  {t('settings.send')}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
