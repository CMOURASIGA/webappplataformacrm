import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Settings() {
  const currentUser = useStore(state => state.currentUser);
  const tenants = useStore(state => state.tenants);
  const updateTenantSettings = useStore(state => state.updateTenantSettings);
  
  const tenant = tenants.find(t => t.id === currentUser?.tenantId);
  
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  
  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.settings.companyName);
      setPrimaryColor(tenant.settings.primaryColor);
    }
  }, [tenant]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant) {
      updateTenantSettings(tenant.id, { companyName, primaryColor });
      alert('Settings saved!');
    }
  };

  if (!tenant) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">White Label Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
            <Input 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color" 
                value={primaryColor} 
                onChange={e => setPrimaryColor(e.target.value)}
                className="h-10 w-10 p-1 border border-slate-300 rounded cursor-pointer"
              />
              <Input 
                value={primaryColor} 
                onChange={e => setPrimaryColor(e.target.value)} 
                className="font-mono uppercase w-32"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Preview</h2>
        <div className="p-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
          <span className="text-2xl font-bold tracking-tight">{companyName}</span>
        </div>
      </div>
    </div>
  );
}
