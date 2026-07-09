import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Tenants() {
  const tenants = useStore(state => state.tenants);
  const addTenant = useStore(state => state.addTenant);
  
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
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Tenants (Clients)</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Create New Tenant</h2>
        <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
              <Input 
                placeholder="Acme Corp" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value, company_name: e.target.value})} 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Email</label>
              <Input 
                placeholder="contact@acme.com" 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-tight">Admin User</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Admin Name</label>
                <Input 
                  placeholder="John Doe" 
                  value={formData.admin_name} 
                  onChange={e => setFormData({...formData, admin_name: e.target.value})} 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Admin Email</label>
                <Input 
                  placeholder="admin@acme.com" 
                  type="email"
                  value={formData.admin_email} 
                  onChange={e => setFormData({...formData, admin_email: e.target.value})} 
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Admin Password</label>
                <Input 
                  placeholder="Enter a secure password" 
                  type="password"
                  value={formData.admin_password} 
                  onChange={e => setFormData({...formData, admin_password: e.target.value})} 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit">Create Tenant</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
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
                  <Button variant="ghost" size="sm">Manage</Button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-slate-500 text-sm font-medium">
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
