import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, UserX, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fetchApi } from '../../lib/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchApi('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    const name = prompt('Nome do usuário:');
    if (!name) return;
    const email = prompt('E-mail:');
    if (!email) return;
    const role = prompt('Papel (admin/user):', 'user');
    if (!role) return;
    const password = prompt('Senha (mínimo 6 caracteres):');
    if (!password) return;

    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, role, password })
      });
      loadUsers();
    } catch (err) {
      alert('Erro ao criar usuário');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="text-primary-600" />
            Usuários da Equipe
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os atendentes e administradores do sistema.</p>
        </div>
        <Button onClick={handleCreateUser}><Plus size={16} className="mr-2" /> Novo Usuário</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">E-mail</th>
              <th className="p-4 font-medium">Papel</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{u.name}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Atendente'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
