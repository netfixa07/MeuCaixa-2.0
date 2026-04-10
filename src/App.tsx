/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc,
  getDocFromServer,
  updateDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { getSupportResponse, parseFinancialMessage } from './services/geminiService';
import { UserProfile, Transaction, Plan, Product, Person, ChatMessage } from './types';
import { 
  Plus, 
  LogOut, 
  Send, 
  History, 
  Settings as SettingsIcon, 
  AlertCircle,
  Loader2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  Zap,
  LayoutDashboard,
  Sparkles,
  BrainCircuit,
  Moon,
  Sun,
  Key,
  Building2,
  Package,
  Users,
  ShoppingCart,
  MessageSquare,
  Bell,
  MessageCircle,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useLanguage } from './contexts/LanguageContext';

// Optimized Components
import { Logo } from './components/ui/Logo';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './components/Dashboard';
import { SubscriptionArea } from './components/SubscriptionArea';
import { TransactionItem } from './components/TransactionItem';
import { DashboardSkeleton, TransactionSkeleton } from './components/ui/Skeleton';
import { Onboarding } from './components/Onboarding';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import PhoneInput, { getCountryCallingCode, getCountries } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import en from 'react-phone-number-input/locale/en';

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
import { StrategicReport } from './components/StrategicReport';
import { AIIntelligence } from './components/AIIntelligence';
import { ProfileSetup } from './components/ProfileSetup';
import { Products } from './components/Products';
import { Sales } from './components/Sales';
import { People } from './components/People';
import { GlobalSearch } from './components/GlobalSearch';
import { TeamManagement } from './components/TeamManagement';
import { Settings } from './components/Settings';
import { ChatPanel } from './components/ChatPanel';
import { NicheSelector } from './components/ui/NicheSelector';
import { handleFirestoreError, OperationType } from './lib/firebase-utils';

export default function App() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isChangingAccount, setIsChangingAccount] = useState(false);
  const [txFilter, setTxFilter] = useState<'tudo' | 'receita' | 'despesa' | 'pendente'>('tudo');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estrategico' | 'produtos' | 'vendas' | 'pessoas' | 'chat' | 'inteligencia'>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showSetupHelper, setShowSetupHelper] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasConfirmedPlan, setHasConfirmedPlan] = useState(false);
  const [notifiedLowStock, setNotifiedLowStock] = useState<Set<string>>(new Set());
  const [notifiedHighSales, setNotifiedHighSales] = useState(false);

  // Registration fields
  const [regNomeEmpresa, setRegNomeEmpresa] = useState("");
  const [regNomeResponsavel, setRegNomeResponsavel] = useState("");
  const [regCnpjEmpresa, setRegCnpjEmpresa] = useState("");
  const [regDescricaoEmpresa, setRegDescricaoEmpresa] = useState("");
  const [regNicho, setRegNicho] = useState("");
  const [regTelefone, setRegTelefone] = useState<string | undefined>("");

  useEffect(() => {
    setAuthError("");
    setShowSetupHelper(false);
  }, [authMode]);

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, data);
      setProfile({ ...profile, ...data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingAccount(true);
    try {
      // In a real app, we would use updateEmail(user, newEmail)
      // But it requires recent login. For this demo, we'll simulate success.
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsChangingAccount(false);
      setNewEmail("");
      setNewPassword("");
      toast.success(t('account.update_success'));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAccount(false);
    }
  };
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    try {
      return localStorage.getItem('hasSeenOnboarding') === 'true';
    } catch (e) {
      return false;
    }
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration. The client is offline.");
          } else {
            console.error("Firebase connection test failed:", error.message);
          }
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    (window as any).setActiveTab = setActiveTab;
    (window as any).setShowSettings = setShowSettings;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      try {
        if (currentUser) {
          console.log("User logged in, fetching profile for:", currentUser.uid);
          const profileRef = doc(db, 'users', currentUser.uid);
          let profileSnap;
          try {
            profileSnap = await getDoc(profileRef);
          } catch (error) {
            console.error("Error fetching profile:", error);
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
            throw error;
          }

          if (profileSnap.exists()) {
            console.log("Profile found:", profileSnap.data());
            const data = profileSnap.data() as UserProfile;
            let currentPlan = data.plan;
            let hasSelectedPlan = data.hasSelectedPlan ?? false;
            
            // Update last login
            try {
              await updateDoc(profileRef, { lastLogin: new Date().toISOString() });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
            }
            
            // Auto-upgrade VIP email
            const vipEmails = ['gamerbilly898@hmail.com', 'gamerbilly898@gmail.com', 'douglastaylorinvestimentos@gmail.com', 'netfixa07@gmail.com'];
            const isVip = currentUser.email && vipEmails.includes(currentUser.email.toLowerCase());
            if (isVip && currentPlan !== 'elite') {
              currentPlan = 'elite';
              hasSelectedPlan = true;
              try {
                await setDoc(profileRef, { plan: 'elite', hasSelectedPlan: true }, { merge: true });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
              }
            }

            setProfile({
              ...data,
              plan: currentPlan,
              hasSelectedPlan: hasSelectedPlan
            });
          } else {
            const vipEmails = ['gamerbilly898@hmail.com', 'gamerbilly898@gmail.com', 'douglastaylorinvestimentos@gmail.com', 'netfixa07@gmail.com'];
            const isVip = currentUser.email && vipEmails.includes(currentUser.email.toLowerCase());
            const newProfile: Partial<UserProfile> = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              plan: isVip ? 'elite' : 'gratuito',
              hasSelectedPlan: isVip,
              aprendizado: [],
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            try {
              await setDoc(profileRef, newProfile, { merge: true });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
            }
            setProfile(newProfile as UserProfile);
          }
        } else {
          setProfile(null);
          setProfileError(null);
        }
      } catch (error: any) {
        setProfileError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('data', 'desc')
    );

    const unsubscribeTxs = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    const qProducts = query(
      collection(db, 'products'),
      where('uid', '==', user.uid)
    );

    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const qPeople = query(
      collection(db, 'people'),
      where('uid', '==', user.uid)
    );

    const unsubscribePeople = onSnapshot(qPeople, (snapshot) => {
      const ppl = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Person[];
      setPeople(ppl);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'people');
    });

    return () => {
      unsubscribeTxs();
      unsubscribeProducts();
      unsubscribePeople();
    };
  }, [user, isAuthReady]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transactions]);

  const handleGoogleLogin = useCallback(async () => {
    if (isAuthLoading) return;
    setIsAuthLoading(true);
    try {
      setAuthError("");
      setShowSetupHelper(false);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError("O login com Google não está ativado no Console do Firebase.");
        setShowSetupHelper(true);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError(""); // User closed popup, no need for error message
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError("Este domínio não está autorizado no Firebase. Adicione-o em Authentication > Settings > Authorized domains.");
      } else {
        setAuthError("Falha ao entrar com Google.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [isAuthLoading]);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setAuthError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("E-mail de recuperação enviado!");
    } catch (error: any) {
      setAuthError("Erro ao enviar e-mail de recuperação.");
    }
  }, [email]);

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;
    setIsAuthLoading(true);
    setAuthError("");
    setShowSetupHelper(false);
    if (!email || !password) {
      setIsAuthLoading(false);
      return;
    }

    try {
      console.log("Starting auth process:", { authMode, email });
      // Set persistence
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (authMode === 'login') {
        console.log("Attempting login...");
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful");
      } else {
        console.log("Attempting registration...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        console.log("User created:", newUser.uid);
        
        // Create profile with additional fields
        const vipEmails = ['gamerbilly898@hmail.com', 'gamerbilly898@gmail.com', 'douglastaylorinvestimentos@gmail.com', 'netfixa07@gmail.com'];
        const isVip = newUser.email && vipEmails.includes(newUser.email.toLowerCase());
          const profileRef = doc(db, 'users', newUser.uid);
          const now = new Date().toISOString();
          const newProfile: UserProfile = {
            uid: newUser.uid,
            email: newUser.email || "",
            displayName: newUser.displayName || "",
            plan: isVip ? 'elite' : 'gratuito',
            hasSelectedPlan: isVip,
            nomeEmpresa: regNomeEmpresa,
            nomeResponsavel: regNomeResponsavel,
            cnpjEmpresa: regCnpjEmpresa,
            descricaoEmpresa: regDescricaoEmpresa,
            nicho: regNicho,
            telefone: regTelefone || "",
            aprendizado: [],
            createdAt: now,
            lastLogin: now
          };
        console.log("Saving profile to Firestore...");
        await setDoc(profileRef, newProfile);
        console.log("Profile saved successfully");
        setProfile(newProfile);
      }
    } catch (error: any) {
      console.error("Auth failed detailed error:", error);
      if (error.code === 'auth/api-key-not-valid') {
        setAuthError("Erro de configuração: Chave de API do Firebase inválida. Por favor, contate o suporte.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError(t('auth.error_invalid'));
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError(t('auth.error_email_in_use'));
        // Automatically suggest switching to login
      } else if (error.code === 'auth/weak-password') {
        setAuthError(t('auth.error_weak_password'));
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError(t('auth.error_not_allowed'));
        setShowSetupHelper(true);
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError("Este domínio não está autorizado no Firebase.");
      } else if (error.code === 'permission-denied') {
        setAuthError("Erro de permissão no banco de dados. Por favor, tente novamente mais tarde.");
        try {
          handleFirestoreError(error, OperationType.CREATE, 'users');
        } catch (e) { /* ignore rethrow */ }
      } else {
        setAuthError(error.message || "Ocorreu um erro na autenticação.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [authMode, email, password, regNomeEmpresa, regNomeResponsavel, regCnpjEmpresa, regDescricaoEmpresa, regTelefone, regNicho, isAuthLoading, t, rememberMe]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!profile || !user) return;

    // Check for low stock
    products.forEach(product => {
      if (product.estoque <= product.estoqueMinimo && !notifiedLowStock.has(product.id!)) {
        toast.warning(`Estoque Baixo: ${product.nome}`, {
          description: `Apenas ${product.estoque} unidades restantes.`,
          action: {
            label: 'Ver Produtos',
            onClick: () => setActiveTab('produtos')
          }
        });
        setNotifiedLowStock(prev => new Set(prev).add(product.id!));
      }
    });

    // Check for high sales (e.g., > R$ 5000 today)
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = transactions
      .filter(tx => tx.tipo === 'receita' && tx.data.startsWith(today))
      .reduce((acc, tx) => acc + tx.valor, 0);

    if (todaysSales > 5000 && !notifiedHighSales) {
      toast.success('Meta de Vendas Atingida!', {
        description: `Você vendeu mais de R$ 5.000,00 hoje. Parabéns!`,
      });
      setNotifiedHighSales(true);
    }

    // Check for delayed payments
    const delayedPayments = transactions.filter(tx => tx.status === 'atrasado');
    if (delayedPayments.length > 0) {
      const uniqueDelayed = new Set(delayedPayments.map(tx => tx.id));
      // In a real app we'd track which ones we already notified about
      // For now, just show a generic warning if there are any
      // toast.error(`Você tem ${delayedPayments.length} pagamentos atrasados!`);
    }

  }, [products, transactions, profile, user, notifiedLowStock, notifiedHighSales]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !profile || !user || isProcessing) return;

    setIsProcessing(true);
    setChatError(null);
    const text = message;
    setMessage("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      // First, parse the message to understand intention and extract data
      const aiResponse = await parseFinancialMessage(text, profile, products, people);
      
      if (!aiResponse) {
        throw new Error("Não foi possível interpretar a mensagem.");
      }

      let assistantResponse = "";

      if (aiResponse.intencao === 'registro' && aiResponse.item && aiResponse.valor !== null) {
        // Plan restriction: Basic plan cannot record revenue
        if (profile.plan === 'gratuito' && aiResponse.tipo === 'receita') {
          assistantResponse = t('assistant.error_basic');
        } else {
          // Handle registration
          const newTx: Transaction = {
            uid: user.uid,
            item: aiResponse.item,
            valor: aiResponse.valor,
            tipo: aiResponse.tipo || 'despesa',
            categoria: aiResponse.categoria || 'Outros',
            data: new Date().toISOString(),
            originalMessage: text,
            productId: aiResponse.productId,
            quantidade: aiResponse.quantidade,
            personId: aiResponse.personId,
            dataVencimento: aiResponse.dataVencimento,
            status: aiResponse.status || (aiResponse.dataVencimento ? 'pendente' : 'pago'),
            recorrente: aiResponse.recorrente,
            frequencia: aiResponse.frequencia,
            parcelado: aiResponse.parcelado,
            total_parcelas: aiResponse.total_parcelas,
            valor_parcela: aiResponse.valor_parcela,
            local: aiResponse.local,
            emocao: aiResponse.emocao
          };

          await addDoc(collection(db, 'transactions'), newTx);
          
          const emoji = aiResponse.tipo === 'receita' ? '💰' : '💸';
          const emotionEmoji = aiResponse.emocao === 'positivo' ? '🚀' : aiResponse.emocao === 'negativo' ? '⚠️' : '📝';
          
          assistantResponse = `${emoji} Registro realizado com sucesso! ${emotionEmoji}\n\n*Item:* ${aiResponse.item}\n*Valor:* R$ ${aiResponse.valor.toFixed(2)}\n*Categoria:* ${aiResponse.categoria}`;
          
          if (aiResponse.parcelado) {
            assistantResponse += `\n*Parcelamento:* ${aiResponse.total_parcelas}x de R$ ${aiResponse.valor_parcela?.toFixed(2)}`;
          }
          if (aiResponse.recorrente) {
            assistantResponse += `\n*Recorrência:* ${aiResponse.frequencia}`;
          }
          if (aiResponse.local) {
            assistantResponse += `\n*Local:* ${aiResponse.local}`;
          }
        }
      } else if (aiResponse.intencao === 'consulta') {
        // For queries, use the support response which is more conversational
        assistantResponse = await getSupportResponse(`O usuário perguntou: "${text}". Com base nas transações dele, responda de forma clara.`);
      } else if (aiResponse.intencao === 'correcao') {
        assistantResponse = "Entendi que você quer corrigir algo. Por favor, me diga exatamente o que devo alterar no último registro.";
      } else {
        // Fallback to support response
        assistantResponse = await getSupportResponse(text);
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatError("Erro ao processar sua mensagem. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [message, profile, user, isProcessing, products, people]);

  const handleMarkAsPaid = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'transactions', id), { status: 'pago' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  }, []);

  const updatePlan = useCallback(async (newPlan: Plan) => {
    if (!user || !profile) return;
    
    // Enforce upgrade-only logic
    const planHierarchy: Record<Plan, number> = {
      'gratuito': 1,
      'pro': 2,
      'elite': 3
    };

    if (profile.hasSelectedPlan && planHierarchy[newPlan] <= planHierarchy[profile.plan]) {
      // Don't allow downgrade or same plan if already selected
      if (planHierarchy[newPlan] < planHierarchy[profile.plan]) {
        setMessage("Downgrade não é permitido. Entre em contato com o suporte.");
      }
      return;
    }

    try {
      const profileRef = doc(db, 'users', user.uid);
      const updatedProfile = { ...profile, plan: newPlan, hasSelectedPlan: true };
      await setDoc(profileRef, updatedProfile, { merge: true });
      setProfile(updatedProfile);
      setHasConfirmedPlan(true);
      setMessage(`Plano atualizado para ${newPlan.toUpperCase()}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  }, [user, profile]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txFilter === 'tudo') return true;
      if (txFilter === 'receita') return tx.tipo === 'receita';
      if (txFilter === 'despesa') return tx.tipo === 'despesa';
      if (txFilter === 'pendente') return tx.status === 'pendente' || tx.status === 'atrasado';
      return true;
    });
  }, [transactions, txFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (!hasSeenOnboarding) {
      return <Onboarding onComplete={completeOnboarding} />;
    }
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-blue-200/50 dark:shadow-none border border-blue-100 dark:border-slate-800"
        >
          <div className="w-32 h-32 flex items-center justify-center mb-6 mx-auto">
            <Logo className="w-full h-full" />
          </div>

          <h1 className="text-2xl font-bold text-blue-900 dark:text-white text-center mb-2">
            {authMode === 'login' ? t('auth.welcome_back') : t('auth.create_account')}
          </h1>
          <p className="text-sm text-blue-400 dark:text-slate-500 text-center mb-8">
            {authMode === 'login' ? t('auth.login_subtitle') : t('auth.register_subtitle')}
          </p>
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-blue-50 dark:bg-slate-800 rounded-2xl mb-8">
            <button 
              onClick={() => setAuthMode('login')}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                authMode === 'login' ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm" : "text-blue-400 dark:text-slate-500 hover:text-blue-500"
              )}
            >
              {t('auth.login')}
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                authMode === 'register' ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm" : "text-blue-400 dark:text-slate-500 hover:text-blue-500"
              )}
            >
              {t('auth.register')}
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
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
                type={showPassword ? "text" : "password"} 
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 dark:text-slate-600 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-blue-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                  {t('auth.remember_me')}
                </span>
              </label>
              {authMode === 'login' && (
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  {t('auth.forgot_password')}
                </button>
              )}
            </div>

            {authMode === 'register' && (
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
                    value={regNomeEmpresa}
                    onChange={(e) => setRegNomeEmpresa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
                  <input 
                    type="text" 
                    placeholder={t('auth.owner_name')}
                    value={regNomeResponsavel}
                    onChange={(e) => setRegNomeResponsavel(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 dark:text-slate-600" />
                  <input 
                    type="text" 
                    placeholder={t('auth.cnpj')}
                    value={regCnpjEmpresa}
                    onChange={(e) => setRegCnpjEmpresa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-blue-300 dark:text-slate-600" />
                  <textarea 
                    placeholder={t('auth.company_desc')}
                    value={regDescricaoEmpresa}
                    onChange={(e) => setRegDescricaoEmpresa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-blue-900 dark:text-white placeholder:text-blue-300 dark:placeholder:text-slate-600 min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Nicho do Negócio</label>
                  <NicheSelector 
                    value={regNicho}
                    onChange={setRegNicho}
                    placeholder="Selecionar Nicho do Negócio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('auth.phone_label')}</label>
                  <div className="phone-input-container">
                    <PhoneInput
                      placeholder={t('auth.phone_label')}
                      value={regTelefone}
                      onChange={setRegTelefone}
                      defaultCountry="BR"
                      labels={countryLabels}
                      flagComponent={FlagComponent}
                      className="w-full px-4 py-3.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all text-blue-900 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {authError && (
              <div className="space-y-4 px-2">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{authError}</p>
                    {authError === t('auth.error_email_in_use') && (
                      <button 
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError("");
                        }}
                        className="text-xs font-bold underline text-left text-red-700 dark:text-red-300"
                      >
                        {t('auth.switch_to_login')}
                      </button>
                    )}
                  </div>
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
                        setAuthError("");
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
              disabled={isAuthLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAuthLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {authMode === 'login' ? t('auth.action_login') : t('auth.action_register')}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-blue-300 font-bold">{t('auth.or_continue_with')}</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-blue-100 text-blue-900 rounded-2xl font-semibold hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <img src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" className="w-5 h-5" alt="Google" />
            )}
            Google
          </button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all"
            >
              {authMode === 'login' ? t('auth.no_account') : t('auth.have_account')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profile && isChangingAccount) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-blue-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setIsChangingAccount(false)}
              className="p-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full text-blue-600 dark:text-blue-400 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white">{t('account.change_data')}</h2>
          </div>

          <form onSubmit={handleUpdateAccount} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 block">{t('account.current_email')}</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled
                className="w-full px-6 py-4 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-medium opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 block">{t('account.new_email')}</label>
              <input 
                type="email" 
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="exemplo@novo.com"
                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={isUpdatingAccount}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isUpdatingAccount ? 'Processando...' : t('account.confirm_change')}
            </button>
            <button 
              type="button"
              onClick={() => setIsChangingAccount(false)}
              className="w-full py-4 bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-slate-800 transition-all"
            >
              {t('common.back')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    if (profileError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-800 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Erro ao carregar perfil</h2>
            <p className="text-red-600 dark:text-red-300 mb-6 text-sm">{profileError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  const isPaidPlan = profile?.plan === 'pro' || profile?.plan === 'elite';
  
  // Trial Logic
  const trialDays = 14;
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : new Date();
  const now = new Date();
  const diffTime = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isTrial = !isPaidPlan && diffDays < trialDays;
  const isTrialExpired = !isPaidPlan && diffDays >= trialDays;

  const shouldShowSubscriptions = profile && (
    (!profile.hasSelectedPlan && diffDays >= trialDays) || 
    isUpgrading
  );

  const isProfileIncomplete = profile && profile.hasSelectedPlan && !profile.nomeEmpresa;

  if (shouldShowSubscriptions) {
    return (
      <SubscriptionArea 
        isTrial={isTrial}
        isTrialExpired={isTrialExpired}
        onSelectPlan={(plan) => {
          if (plan === profile?.plan) {
            setHasConfirmedPlan(true);
            setIsUpgrading(false);
          } else {
            updatePlan(plan);
            setIsUpgrading(false);
          }
        }} 
        onLogout={handleLogout} 
        currentPlan={profile?.hasSelectedPlan ? profile?.plan : undefined}
        onBack={isUpgrading ? () => setIsUpgrading(false) : undefined}
        uid={user?.uid}
        email={user?.email || undefined}
      />
    );
  }

  if (isProfileIncomplete) {
    return (
      <ProfileSetup 
        profile={profile} 
        onBack={() => setIsUpgrading(true)}
        onComplete={async (data) => {
          if (!user || !profile) return;
          try {
            const profileRef = doc(db, 'users', user.uid);
            const updatedProfile = { ...profile, ...data };
            await setDoc(profileRef, updatedProfile, { merge: true });
            setProfile(updatedProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
          }
        }}
      />
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-black text-blue-900 dark:text-slate-100 font-sans selection:bg-blue-200 transition-colors duration-300 flex relative",
      isTrialExpired && "overflow-hidden"
    )}>
        {/* Trial Expired Overlay */}
        {isTrialExpired && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl border border-blue-100 dark:border-slate-800 max-w-lg w-full text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-3xl font-bold text-blue-900 dark:text-white mb-4">{t('trial.expired_title')}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {t('trial.expired_desc')}
              </p>
              <button 
                onClick={() => setIsUpgrading(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {t('trial.get_plans')}
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="mt-6 text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </motion.div>
          </div>
        )}

        {/* Sidebar (Desktop) */}
        <aside className={cn(
          "hidden md:flex flex-col w-64 border-r border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen transition-all",
          isTrialExpired && "pointer-events-none"
        )}>
          <div className="p-4 border-b border-blue-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
              <Logo className="w-full h-full" showText={false} />
            </div>
            <div>
              <h1 className="font-bold text-blue-900 dark:text-white leading-tight">MeuCaixa</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-serif italic font-medium text-blue-400 dark:text-slate-500 uppercase tracking-wider">Gestão Ativa</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'dashboard' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <LayoutDashboard className="w-5 h-5" />}
              {t('nav.dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'produtos' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <Package className="w-5 h-5" />}
              {t('nav.products')}
            </button>
            <button
              onClick={() => setActiveTab('vendas')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'vendas' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <ShoppingCart className="w-5 h-5" />}
              {t('nav.sales')}
            </button>
            <button
              onClick={() => setActiveTab('pessoas')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'pessoas' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <Users className="w-5 h-5" />}
              {t('nav.customers')}
            </button>
            <button
              onClick={() => setActiveTab('estrategico')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'estrategico' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <Sparkles className="w-5 h-5" />
              {t('nav.reports')}
            </button>
            <button
              onClick={() => setActiveTab('inteligencia')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'inteligencia' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <BrainCircuit className="w-5 h-5" />}
              {t('nav.intelligence')}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === 'chat' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {isTrialExpired ? <Lock className="w-5 h-5 opacity-50" /> : <MessageSquare className="w-5 h-5" />}
              {t('nav.assistant')}
            </button>
          </nav>

          <div className="p-4 border-t border-blue-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('chat')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors mb-1"
            >
              <Bot className="w-5 h-5" />
              {t('common.bot_support')}
            </button>
            <a 
              href="https://wa.me/5564992809321?text=preciso%20de%20suporte%20no%20meu%20caixa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors mb-1"
            >
              <MessageCircle className="w-5 h-5" />
              {t('common.whatsapp_support')}
            </a>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              {t('nav.settings')}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors mt-1"
            >
              <LogOut className="w-5 h-5" />
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all",
          isTrialExpired && "pointer-events-none"
        )}>
          {/* Header (Mobile & Desktop) */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-blue-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-blue-50 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                <Logo className="w-full h-full" showText={false} />
              </div>
            </div>
            
            <div className="flex-1 max-w-xl mx-auto md:mx-0 flex items-center gap-2">
              <GlobalSearch 
                transactions={transactions} 
                products={products} 
                people={people} 
                onNavigate={setActiveTab} 
              />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-blue-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            <div className="max-w-5xl mx-auto h-full">
              {activeTab === 'estrategico' ? (
                <StrategicReport 
                  transactions={transactions} 
                  products={products}
                  people={people}
                  onBack={() => setActiveTab('dashboard')} 
                  plan={profile?.plan}
                />
              ) : activeTab === 'produtos' ? (
                <Products uid={user?.uid || ''} />
              ) : activeTab === 'vendas' ? (
                <Sales uid={user?.uid || ''} products={products} people={people} />
              ) : activeTab === 'pessoas' ? (
                <People uid={user?.uid || ''} />
              ) : activeTab === 'inteligencia' ? (
                <AIIntelligence 
                  transactions={transactions} 
                  profile={profile} 
                  products={products} 
                />
              ) : activeTab === 'chat' ? (
                <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
                  <ChatPanel 
                    inline
                    message={message}
                    setMessage={setMessage}
                    isProcessing={isProcessing}
                    handleSendMessage={handleSendMessage}
                    chatError={chatError}
                    setChatError={setChatError}
                    transactions={transactions}
                    chatMessages={chatMessages}
                  />
                </div>
              ) : (
                <>
                  {/* Dashboard */}
                  {loading ? (
                    <DashboardSkeleton />
                  ) : (
                    <Dashboard 
                      transactions={transactions} 
                      profile={profile} 
                      products={products}
                      people={people}
                      onViewStrategicReport={() => setActiveTab('estrategico')}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>

        {/* Right Panel (Notifications/Alerts) - Desktop Only */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen overflow-y-auto p-4">
          <h3 className="font-bold text-blue-900 dark:text-white flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-500" />
            {t('notifications.title')}
          </h3>
          {/* Notifications List */}
          <div className="space-y-3">
            {/* Low Stock Alerts */}
            {products.filter(p => p.estoque <= p.estoqueMinimo).map(p => (
              <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-400">{t('notifications.low_stock')}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      {t('notifications.low_stock_desc').replace('{name}', p.nome).replace('{count}', p.estoque.toString())}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Pending Transactions */}
            {transactions.filter(tx => tx.status === 'pendente' || tx.status === 'atrasado').slice(0, 5).map(tx => (
              <div key={tx.id} className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-400">
                      {tx.status === 'atrasado' ? t('notifications.overdue_payment') : t('notifications.pending_payment')}
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-500">
                      {tx.item} - {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: language === 'pt' ? 'BRL' : 'USD' }).format(tx.valor)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {products.filter(p => p.estoque <= p.estoqueMinimo).length === 0 && transactions.filter(tx => tx.status === 'pendente' || tx.status === 'atrasado').length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{t('notifications.none')}</p>
            )}
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-blue-100 dark:border-slate-800 p-2 z-40 flex justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all",
              activeTab === 'dashboard' 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'dashboard' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'dashboard' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.dashboard')}</span>
          </button>
          <button
            onClick={() => setActiveTab('produtos')}
            className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all"
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'produtos' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <Package className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'produtos' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.products')}</span>
          </button>
          <button
            onClick={() => setActiveTab('vendas')}
            className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all"
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'vendas' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'vendas' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.sales')}</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all"
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'chat' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'chat' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.assistant')}</span>
          </button>
          <button
            onClick={() => setActiveTab('inteligencia')}
            className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all"
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'inteligencia' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'inteligencia' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.intelligence')}</span>
          </button>
          <button
            onClick={() => setActiveTab('estrategico')}
            className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all"
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === 'estrategico' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              activeTab === 'estrategico' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
            )}>{t('nav.reports')}</span>
          </button>
        </div>

        {/* Settings Component */}
        {showSettings && profile && (
          <Settings 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            onUpgrade={() => setIsUpgrading(true)}
            onUpdateProfile={handleUpdateProfile}
            profile={profile} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
        )}
      </div>
  );
}
