import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Shield, Mail, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'gerente' | 'vendedor';
  status: 'ativo' | 'pendente';
}

export const TeamManagement = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', email: 'admin@empresa.com', role: 'admin', status: 'ativo' },
    { id: '2', email: 'vendas@empresa.com', role: 'vendedor', status: 'ativo' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'gerente' | 'vendedor'>('vendedor');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      email: newEmail,
      role: newRole,
      status: 'pendente'
    };
    
    setMembers([...members, newMember]);
    setNewEmail('');
    setIsAdding(false);
    toast.success(t('team.invite_success'));
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success(t('team.member_removed'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-blue-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            {t('team.title')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{t('team.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleAddMember}
          className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('team.new_member')}</h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('team.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('team.access_level')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'gerente', 'vendedor'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setNewRole(role)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-xs font-bold capitalize border transition-all",
                    newRole === role 
                      ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300" 
                      : "bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 hover:border-blue-300"
                  )}
                >
                  {role === 'admin' ? t('team.role_admin') : role === 'gerente' ? t('team.role_manager') : t('team.role_seller')}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
          >
            {t('team.send_invite')}
          </button>
        </motion.form>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                member.role === 'admin' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                member.role === 'gerente' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{member.email}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {member.role === 'admin' ? t('team.role_admin') : member.role === 'gerente' ? t('team.role_manager') : t('team.role_seller')}
                  </span>
                  {member.status === 'pendente' && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                      {t('team.status_pending')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {member.role !== 'admin' && (
              <button
                onClick={() => handleRemoveMember(member.id)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
