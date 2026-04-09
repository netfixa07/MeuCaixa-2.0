import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Person } from '../types';
import { Plus, Search, Edit2, Trash2, Users, Truck, AlertCircle, X, Mail, Phone, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { ConfirmModal } from './ui/ConfirmModal';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

interface PeopleProps {
  uid: string;
}

export function People({ uid }: PeopleProps) {
  const { t } = useLanguage();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cliente' | 'fornecedor'>('cliente');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'people'),
      where('uid', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const peopleData: Person[] = [];
      snapshot.forEach((doc) => {
        peopleData.push({ id: doc.id, ...doc.data() } as Person);
      });
      setPeople(peopleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPeople = people.filter(p => 
    p.tipo === activeTab &&
    (p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.documento?.includes(searchTerm))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const personData = {
        uid: auth.currentUser.uid,
        tipo: activeTab,
        nome,
        email,
        telefone,
        documento,
        dataCadastro: new Date().toISOString()
      };

      if (editingPerson?.id) {
        await updateDoc(doc(db, 'people', editingPerson.id), personData);
        toast.success(t('customers.save_success') || 'Pessoa atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'people'), personData);
        toast.success(t('customers.save_success') || 'Pessoa cadastrada com sucesso!');
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'people');
      toast.error(t('customers.save_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'people', id));
      toast.success(t('customers.delete_success') || 'Excluído com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'people');
      toast.error(t('customers.delete_error'));
    }
  };

  const editPerson = (person: Person) => {
    setEditingPerson(person);
    setNome(person.nome);
    setEmail(person.email || '');
    setTelefone(person.telefone || '');
    setDocumento(person.documento || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingPerson(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setDocumento('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t('customers.title')}
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'cliente' ? t('common.new_client') : t('common.new_supplier')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
        <button
          onClick={() => setActiveTab('cliente')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'cliente'
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Users className="w-4 h-4" />
          {t('customers.type_client')}
        </button>
        <button
          onClick={() => setActiveTab('fornecedor')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'fornecedor'
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Truck className="w-4 h-4" />
          {t('customers.type_supplier')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'cliente' ? t('customers.search_clients') : t('customers.search_suppliers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filteredPeople.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {activeTab === 'cliente' ? t('customers.no_customers') : t('customers.no_suppliers')}
            </p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{person.nome}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {person.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {person.email}
                    </span>
                  )}
                  {person.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {person.telefone}
                    </span>
                  )}
                  {person.documento && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {person.documento}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => editPerson(person)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (person.id) {
                      setPersonToDelete(person.id);
                      setIsDeleteModalOpen(true);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {editingPerson 
                    ? (activeTab === 'cliente' ? t('customers.edit_client') : t('customers.edit_supplier'))
                    : (activeTab === 'cliente' ? t('common.new_client') : t('common.new_supplier'))
                  }
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('customers.name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('customers.email_label')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('customers.phone_label')}
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('customers.document_label')}
                  </label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPersonToDelete(null);
        }}
        onConfirm={() => {
          if (personToDelete) {
            handleDelete(personToDelete);
          }
        }}
        title={t('customers.delete_confirm_title') || 'Excluir'}
        message={t('customers.delete_confirm')}
        variant="danger"
      />
    </div>
  );
}
