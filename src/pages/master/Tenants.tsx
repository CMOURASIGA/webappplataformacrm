import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Tenant } from '../../types';
import { X } from 'lucide-react';

export default function Tenants() {
  const tenants = useStore(state => state.tenants);
  const addTenant = useStore(state => state.addTenant);
  const updateTenant = useStore(state => state.updateTenant);
  const users = useStore(state => state.users);
  const pipelines = useStore(state => state.pipelines);
  const [managed, setManaged] = useState<Tenant | null>(null);
  const [managedName, setManagedName] = useState('');
  const [managedStatus, setManagedStatus] = useState<Tenant['status']>('active');
  const [feedback, setFeedback] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.admin_email) {
      addTenant(formData);
      setFormData({
        name: '',
        company_name: '',
        email: '',
        admin_name: '',
        admin_email: '',
        admin_password: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Clientes</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Cadastrar cliente</h2>
        <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nome da empresa</label>
              <Input 
                placeholder="Acme Corp" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value, company_name: e.target.value})} 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">E-mail da empresa</label>
              <Input 
                placeholder="contact@acme.com" 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-tight">Usuário administrador</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do administrador</label>
                <Input 
                  placeholder="John Doe" 
                  value={formData.admin_name} 
                  onChange={e => setFormData({...formData, admin_name: e.target.value})} 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">E-mail do administrador</label>
                <Input 
                  placeholder="admin@acme.com" 
                  type="email"
                  value={formData.admin_email} 
                  onChange={e => setFormData({...formData, admin_email: e.target.value})} 
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Senha do administrador</label>
                <Input 
                  placeholder="Digite uma senha segura"
                  type="password"
                  value={formData.admin_password} 
                  onChange={e => setFormData({...formData, admin_password: e.target.value})} 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit">Criar cliente</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {feedback && <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-700">{feedback}</div>}
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criado em</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: tenant.settings.primaryColor }}
                    >
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="ml-4 font-bold text-slate-900 text-sm">{tenant.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-emerald-100 text-emerald-700">
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => { setManaged(tenant); setManagedName(tenant.name); setManagedStatus(tenant.status); }}>Gerenciar</Button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-slate-500 text-sm font-medium">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {managed && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={async event => { event.preventDefault(); await updateTenant(managed.id, { name: managedName.trim(), status: managedStatus, settings: { ...managed.settings, companyName: managedName.trim() } }); setManaged(null); setFeedback('Empresa atualizada com sucesso.'); }} className="w-full max-w-xl space-y-5 rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-800">Gerenciar empresa</h2><p className="text-sm text-slate-500">Criada em {new Date(managed.createdAt).toLocaleDateString('pt-BR')}</p></div><button type="button" onClick={() => setManaged(null)}><X /></button></div><label className="block text-sm font-bold">Nome da empresa<Input value={managedName} onChange={event => setManagedName(event.target.value)} required /></label><label className="block text-sm font-bold">Status<select value={managedStatus} onChange={event => setManagedStatus(event.target.value as Tenant['status'])} className="mt-1 w-full rounded-md border border-slate-300 p-2 font-normal"><option value="active">Ativa</option><option value="suspended">Desativada</option></select></label><div className="grid grid-cols-3 gap-3"><div className="rounded-lg bg-slate-50 p-3 text-center"><strong className="block text-xl">{users.filter(user => user.tenantId === managed.id).length}</strong><span className="text-xs text-slate-500">Usuários</span></div><div className="rounded-lg bg-slate-50 p-3 text-center"><strong className="block text-xl">{pipelines.filter(item => item.tenantId === managed.id).length}</strong><span className="text-xs text-slate-500">Funis</span></div><div className="rounded-lg bg-slate-50 p-3 text-center"><strong className="block text-xl">{users.filter(user => user.tenantId === managed.id && user.role === 'admin').length}</strong><span className="text-xs text-slate-500">Administradores</span></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setManaged(null)}>Cancelar</Button><Button type="submit">Salvar alterações</Button></div></form></div>}
    </div>
  );
}
