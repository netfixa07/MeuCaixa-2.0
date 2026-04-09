import React, { useState, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Person, Transaction } from '../types';
import { ShoppingCart, Plus, Minus, Search, Tag, Percent, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface SalesProps {
  uid: string;
  products: Product[];
  people: Person[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const Sales = ({ uid, products, people }: SalesProps) => {
  const { t, language } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const clients = useMemo(() => people.filter(p => p.tipo === 'cliente'), [people]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.estoque) {
          toast.error(t('sales.error_stock'));
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.estoque <= 0) {
        toast.error(t('sales.error_no_stock'));
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > item.product.estoque) {
          toast.error(t('sales.error_stock'));
          return item;
        }
        if (newQuantity <= 0) {
          return item; // Will be filtered out or just kept at 1, let's keep at 1 and use remove button
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.preco * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(t('sales.error_empty_cart'));
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Create transaction
      const txData: Omit<Transaction, 'id'> = {
        uid,
        item: `${language === 'pt' ? 'Venda' : 'Sale'}: ${cart.map(c => `${c.quantity}x ${c.product.nome}`).join(', ')}`,
        valor: total,
        tipo: 'receita',
        categoria: language === 'pt' ? 'Vendas' : 'Sales',
        data: new Date().toISOString(),
        status: 'pago',
        desconto: discountAmount,
        impostos: taxAmount
      };

      if (selectedClient) {
        txData.personId = selectedClient;
      }

      await addDoc(collection(db, 'transactions'), txData);

      // 2. Update stock for each product
      for (const item of cart) {
        if (item.product.id) {
          const productRef = doc(db, 'products', item.product.id);
          await updateDoc(productRef, {
            estoque: item.product.estoque - item.quantity
          });
        }
      }

      toast.success(t('sales.success'));
      setCart([]);
      setDiscount(0);
      setTax(0);
      setSelectedClient('');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error(t('sales.error_checkout'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Lista de Produtos */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white flex items-center gap-2">
              <Tag className="w-6 h-6 text-blue-600" />
              {t('sales.available_products')}
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('sales.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                whileHover={{ y: -2 }}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{product.nome}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{product.categoria}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                        style: 'currency', 
                        currency: language === 'pt' ? 'BRL' : 'USD' 
                      }).format(product.preco)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${product.estoque > product.estoqueMinimo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {t('sales.in_stock', { count: product.estoque })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.estoque <= 0}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('sales.add_to_cart')}
                </button>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                {t('sales.no_products')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrinho / Resumo da Venda */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm sticky top-6">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white flex items-center gap-2 mb-6">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            {t('sales.summary_title')}
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('sales.client_label')}</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              >
                <option value="">{t('sales.client_placeholder')}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                {t('sales.cart_empty')}
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">{item.product.nome}</h4>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                      {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                        style: 'currency', 
                        currency: language === 'pt' ? 'BRL' : 'USD' 
                      }).format(item.product.preco * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id!, -1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id!, 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t('sales.subtotal')}</span>
              <span>
                {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                  style: 'currency', 
                  currency: language === 'pt' ? 'BRL' : 'USD' 
                }).format(subtotal)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-16 p-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"
              />
              <span className="text-sm text-slate-500">{t('sales.discount')}</span>
              <span className="ml-auto text-green-600 dark:text-green-400">
                - {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                  style: 'currency', 
                  currency: language === 'pt' ? 'BRL' : 'USD' 
                }).format(discountAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-16 p-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"
              />
              <span className="text-sm text-slate-500">{t('sales.tax')}</span>
              <span className="ml-auto text-red-600 dark:text-red-400">
                + {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                  style: 'currency', 
                  currency: language === 'pt' ? 'BRL' : 'USD' 
                }).format(taxAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-lg text-slate-900 dark:text-white">{t('sales.total')}</span>
              <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                  style: 'currency', 
                  currency: language === 'pt' ? 'BRL' : 'USD' 
                }).format(total)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 bg-[#145cfc] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? t('sales.processing') : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {t('sales.checkout')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
