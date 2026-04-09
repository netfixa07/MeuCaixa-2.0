import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { ConfirmModal } from './ui/ConfirmModal';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

interface ProductsProps {
  uid: string;
}

export const Products = ({ uid }: ProductsProps) => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [localEstoque, setLocalEstoque] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'), where('uid', '==', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });
    return () => unsubscribe();
  }, [uid]);

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const lowStockTerm = language === 'pt' ? 'baixo' : 'low';
    const lowStockFullTerm = language === 'pt' ? 'estoque baixo' : 'low stock';
    
    if (term === lowStockTerm || term === lowStockFullTerm) {
      return p.estoque <= p.estoqueMinimo;
    }
    return p.nome.toLowerCase().includes(term) ||
           p.categoria.toLowerCase().includes(term) ||
           (p.localEstoque && p.localEstoque.toLowerCase().includes(term));
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      uid,
      nome,
      preco: parseFloat(preco),
      estoque: parseInt(estoque, 10),
      estoqueMinimo: parseInt(estoqueMinimo, 10),
      categoria,
      localEstoque,
      dataCadastro: new Date().toISOString()
    };

    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success(t('products.save_success') || 'Produto atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success(t('products.save_success') || 'Produto criado com sucesso!');
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error(t('products.save_error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success(t('products.delete_success') || 'Produto excluído com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      toast.error(t('products.delete_error') || 'Erro ao excluir produto');
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setNome(product.nome);
      setPreco(product.preco.toString());
      setEstoque(product.estoque.toString());
      setEstoqueMinimo(product.estoqueMinimo.toString());
      setCategoria(product.categoria);
      setLocalEstoque(product.localEstoque || '');
    } else {
      setEditingProduct(null);
      setNome('');
      setPreco('');
      setEstoque('');
      setEstoqueMinimo('');
      setCategoria('');
      setLocalEstoque('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            {t('products.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('products.subtitle')}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          {t('products.new')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder={t('products.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">{t('products.table_product')}</th>
                <th className="p-4 font-medium">{t('products.table_category')}</th>
                <th className="p-4 font-medium">{t('products.table_location')}</th>
                <th className="p-4 font-medium">{t('products.table_price')}</th>
                <th className="p-4 font-medium">{t('products.table_stock')}</th>
                <th className="p-4 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {t('products.no_products')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{product.nome}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs font-medium">
                        {product.categoria}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                      {product.localEstoque || '-'}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-white">
                      {new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
                        style: 'currency', 
                        currency: language === 'pt' ? 'BRL' : 'USD' 
                      }).format(product.preco)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${product.estoque <= product.estoqueMinimo ? 'text-red-500' : 'text-emerald-500'}`}>
                          {product.estoque} un
                        </span>
                        {product.estoque <= product.estoqueMinimo && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openModal(product)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (product.id) {
                            setProductToDelete(product.id);
                            setIsDeleteModalOpen(true);
                          }
                        }} 
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingProduct ? t('products.edit') : t('products.new')}
                </h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('products.name_label')}</label>
                  <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('products.price_label', { currency: language === 'pt' ? 'R$' : '$' })}
                    </label>
                    <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('products.category_label')}</label>
                    <input required type="text" value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('products.stock_label')}</label>
                    <input required type="number" value={estoque} onChange={e => setEstoque(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('products.min_stock_label')}</label>
                    <input required type="number" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('products.location_label')}</label>
                  <input type="text" value={localEstoque} onChange={e => setLocalEstoque(e.target.value)} placeholder={t('products.location_placeholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={() => {
          if (productToDelete) {
            handleDelete(productToDelete);
          }
        }}
        title={t('products.delete_confirm_title') || 'Excluir Produto'}
        message={t('products.delete_confirm')}
        variant="danger"
      />
    </div>
  );
};
