import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Chrome, 
  Building2, 
  User, 
  FileText, 
  MessageSquare,
  Phone
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from './ui/Logo';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export const Auth = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    ownerName: '',
    cnpj: '',
    companyDesc: '',
    phone: ''
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = formData.email.trim();
    const password = formData.password;

    if (!isLogin && password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update last login
        try {
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (fsError) {
          console.error("Failed to update last login:", fsError);
          // Don't block login if lastLogin update fails
        }
        
        toast.success(t('common.success'));
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save profile data immediately after registration
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            nomeEmpresa: formData.companyName,
            nomeResponsavel: formData.ownerName,
            cnpjEmpresa: formData.cnpj,
            descricaoEmpresa: formData.companyDesc,
            telefone: formData.phone,
            plan: 'gratuito',
            createdAt: new Date().toISOString()
          });
        } catch (fsError) {
          handleFirestoreError(fsError, OperationType.CREATE, `users/${user.uid}`);
        }
        
        toast.success(t('common.success'));
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Este e-mail já está em uso. Tente fazer login.");
        setIsLogin(true);
      } else if (error.code === 'auth/weak-password') {
        toast.error("A senha é muito fraca. Use pelo menos 6 caracteres.");
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("O login com e-mail e senha não está ativado.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("O formato do e-mail é inválido.");
      } else if (error.code === 'auth/user-disabled') {
        toast.error("Esta conta foi desativada.");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Muitas tentativas. Tente novamente mais tarde.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("E-mail ou senha incorretos. Verifique suas credenciais.");
      } else if (error.message && error.message.includes('{"error":')) {
        try {
          const fsError = JSON.parse(error.message);
          toast.error(`Erro de Banco de Dados: ${fsError.error}`);
        } catch {
          toast.error(`Erro: ${error.message}`);
        }
      } else {
        toast.error(`Erro: ${error.message || "Ocorreu um erro inesperado."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = formData.email.trim();
    if (!email) {
      toast.error("Digite seu e-mail para redefinir a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      if (error.code === 'auth/user-not-found') {
        toast.error("Usuário não encontrado com este e-mail.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("E-mail inválido.");
      } else {
        toast.error(`Erro ao enviar e-mail: ${error.message}`);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });

      toast.success(t('common.success'));
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error(t('auth.error_google_not_allowed'));
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Login cancelado.");
      } else {
        toast.error(`Falha no Google: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl shadow-blue-900/5 border border-slate-100 dark:border-slate-800 z-10"
      >
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLogin ? t('auth.login') : t('auth.register')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isLogin ? 'Bem-vindo de volta!' : 'Comece sua jornada inteligente hoje.'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('auth.company_name')}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('auth.owner_name')}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('auth.cnpj')}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.cnpj}
                  onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('auth.phone_label')}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <textarea
                  placeholder={t('auth.company_desc')}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                  value={formData.companyDesc}
                  onChange={e => setFormData({ ...formData, companyDesc: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder={t('auth.email_placeholder')}
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              placeholder={t('auth.password_placeholder')}
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="Confirmar Senha"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? t('common.loading') : (isLogin ? t('auth.action_login') : t('auth.action_register'))}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">{t('auth.or_continue_with')}</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Google
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 dark:text-slate-400">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-blue-600 font-bold hover:underline"
          >
            {isLogin ? t('auth.register') : t('auth.login')}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
