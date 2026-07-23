import React, { useState } from 'react';
import { Pencil, Plus, Users as UsersIcon, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore } from '../../store';
import type { Role, User } from '../../types';

const emptyForm = { name: '', email: '', password: '', role: 'user' as Role };

export default function Users() {
  const currentUser = useStore(state => state.currentUser);
  const users = useStore(state => state.users);
  const addUser = useStore(state => state.addUser);
  const updateUser = useStore(state => state.updateUser);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const tenantId = currentUser?.role === 'master' ? useStore.getState().activeTenantId : currentUser?.tenantId;
  const visibleUsers = users.filter(user => currentUser?.role === 'master' || user.tenantId === tenantId);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) updateUser(editing.id, form);
    else addUser({ ...form, tenantId: form.role === 'master' ? undefined : tenantId || 'tenant-1' });
    setForm(emptyForm);
    setEditing(null);
    setOpen(false);
  };

  const edit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: user.password || '', role: user.role });
    setOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><UsersIcon className="text-primary-600" /> Gestão de usuários</h1>
          <p className="text-slate-500 mt-1">Crie acessos e defina o perfil de cada pessoa.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><Plus size={16} className="mr-2" /> Novo usuário</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500"><tr><th className="p-4">Nome</th><th className="p-4">E-mail</th><th className="p-4">Perfil</th><th className="p-4 text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visibleUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-800">{user.name}</td>
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4"><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{user.role === 'master' ? 'Master' : user.role === 'admin' ? 'Administrador cliente' : 'Atendente'}</span></td>
                <td className="p-4 text-right"><Button variant="outline" size="sm" onClick={() => edit(user)}><Pencil size={14} className="mr-1" /> Editar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? 'Editar usuário' : 'Novo usuário'}</h2><button type="button" onClick={() => setOpen(false)}><X /></button></div>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="E-mail" />
            <Input required minLength={6} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Senha, mínimo 6 caracteres" />
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
              {currentUser?.role === 'master' && <option value="master">Master</option>}
              <option value="admin">Administrador cliente</option>
              <option value="user">Atendente</option>
            </select>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar usuário</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
