export type Plan = 'gratuito' | 'pro' | 'elite';
export type UserRole = 'admin' | 'gerente' | 'funcionario';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  plan: Plan;
  role?: UserRole;
  hasSelectedPlan?: boolean;
  nomeEmpresa?: string;
  nomeResponsavel?: string;
  cnpjEmpresa?: string;
  descricaoEmpresa?: string;
  nicho?: string;
  telefone?: string;
  aprendizado?: { palavra: string; categoria: string }[];
  lastLogin?: string;
  createdAt?: string;
}

export interface Transaction {
  id?: string;
  uid: string;
  item: string;
  valor: number;
  tipo: 'despesa' | 'receita';
  categoria: string;
  data: string;
  originalMessage?: string;
  personId?: string;
  productId?: string;
  quantidade?: number;
  dataVencimento?: string;
  status?: 'pago' | 'pendente' | 'atrasado';
  desconto?: number;
  impostos?: number;
  recorrente?: boolean;
  frequencia?: 'mensal' | 'semanal' | 'diario' | 'anual' | null;
  parcelado?: boolean;
  total_parcelas?: number | null;
  valor_parcela?: number | null;
  local?: string | null;
  emocao?: 'positivo' | 'negativo' | 'neutro';
  isDetected?: boolean;
}

export interface Product {
  id?: string;
  uid: string;
  nome: string;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  categoria: string;
  localEstoque?: string;
  fotoUrl?: string;
  dataCadastro: string;
}

export interface Person {
  id?: string;
  uid: string;
  tipo: 'cliente' | 'fornecedor' | 'funcionario';
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  dataCadastro: string;
  role?: UserRole;
  status?: 'ativo' | 'inativo';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIResponse {
  item: string | null;
  valor: number | null;
  tipo: 'despesa' | 'receita' | null;
  categoria: string | null;
  recorrente: boolean;
  frequencia: 'mensal' | 'semanal' | 'diario' | 'anual' | null;
  parcelado: boolean;
  total_parcelas: number | null;
  valor_parcela: number | null;
  local: string | null;
  intencao: 'registro' | 'consulta' | 'correcao';
  emocao: 'positivo' | 'negativo' | 'neutro';
  productId?: string;
  quantidade?: number;
  personId?: string;
  dataVencimento?: string;
  status?: 'pago' | 'pendente' | 'atrasado';
}
