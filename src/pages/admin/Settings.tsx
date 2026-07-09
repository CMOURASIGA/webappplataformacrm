import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function Settings() {
  const currentUser = useStore(state => state.currentUser);
  const tenants = useStore(state => state.tenants);
  const updateTenantSettings = useStore(state => state.updateTenantSettings);
  const isMaster = currentUser?.role === 'master';
  const activeTenantId = useStore(state => state.activeTenantId);
  
  const tenant = tenants.find(t => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));
  
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [sidebarColor, setSidebarColor] = useState('');
  const [sidebarTextColor, setSidebarTextColor] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.settings.companyName);
      setPrimaryColor(tenant.settings.primaryColor || '#4f46e5');
      setSidebarColor(tenant.settings.sidebarColor || '#0F172A');
      setSidebarTextColor(tenant.settings.sidebarTextColor || '#cbd5e1');
      setLogoUrl(tenant.settings.logoUrl || '');
    }
  }, [tenant]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoUrl(dataUrl);

      // Extract color
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i+3];
            const red = data[i];
            const green = data[i+1];
            const blue = data[i+2];

            // Ignore transparent pixels
            if (alpha < 127) continue;
            
            // Ignore mostly white and mostly black pixels
            const isWhite = red > 240 && green > 240 && blue > 240;
            const isBlack = red < 15 && green < 15 && blue < 15;
            
            if (!isWhite && !isBlack) {
              r += red;
              g += green;
              b += blue;
              count++;
            }
          }
          
          if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
            setPrimaryColor(hex);
          }
        } catch (error) {
          console.error("Could not extract color", error);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant) {
      updateTenantSettings(tenant.id, { companyName, primaryColor, logoUrl, sidebarColor, sidebarTextColor });
      alert('Settings saved!');
    }
  };

  if (!tenant) return (
    <div className="p-8 text-center text-slate-500">
      Selecione um tenant no menu superior para editar as configurações.
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">White Label Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-6">
              <div 
                className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <ImageIcon className="text-slate-400 w-8 h-8" />
                )}
              </div>
              <div className="text-sm text-slate-500 flex-1">
                <p>Upload the company logo.</p>
                <p className="text-xs mt-1">We will automatically extract the dominant brand color.</p>
                <input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-3 text-xs h-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
              </div>
            </div>
          </div>

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
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Sidebar Color</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color" 
                value={sidebarColor} 
                onChange={e => setSidebarColor(e.target.value)}
                className="h-10 w-10 p-1 border border-slate-300 rounded cursor-pointer"
              />
              <Input 
                value={sidebarColor} 
                onChange={e => setSidebarColor(e.target.value)} 
                className="font-mono uppercase w-32"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Sidebar Text Color</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color" 
                value={sidebarTextColor} 
                onChange={e => setSidebarTextColor(e.target.value)}
                className="h-10 w-10 p-1 border border-slate-300 rounded cursor-pointer"
              />
              <Input 
                value={sidebarTextColor} 
                onChange={e => setSidebarTextColor(e.target.value)} 
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
        <div className="p-8 rounded-lg flex flex-col items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />}
          <span className="text-2xl font-bold tracking-tight">{companyName}</span>
        </div>
      </div>
    </div>
  );
}
