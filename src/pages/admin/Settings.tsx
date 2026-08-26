import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Upload } from 'lucide-react';

const CONSULT_DEFAULTS = {
  companyName: 'Consult Services Tecnologia',
  logoUrl: '/branding/consult-services-logo-horizontal.png',
  primaryColor: '#003B73',
  highlightColor: '#00AEEF',
};

function getContrastColor(hex: string) {
  const color = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(color)) return '#FFFFFF';
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0F172A' : '#FFFFFF';
}

function extractPalette(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.drawImage(image, 0, 0, 48, 48);
  const colors = new Map<string, number>();
  const data = context.getImageData(0, 0, 48, 48).data;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 180) continue;
    const red = Math.min(255, Math.round(data[index] / 32) * 32);
    const green = Math.min(255, Math.round(data[index + 1] / 32) * 32);
    const blue = Math.min(255, Math.round(data[index + 2] / 32) * 32);
    const isNeutral = Math.max(red, green, blue) - Math.min(red, green, blue) < 45;
    const isNearWhite = red > 224 && green > 224 && blue > 224;
    if (isNearWhite) continue;
    const key = `${red},${green},${blue}`;
    colors.set(key, (colors.get(key) ?? 0) + (isNeutral ? 0.25 : 1));
  }

  const palette = [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.split(',').map(Number));
  const hex = (color: number[]) => `#${color.map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  const saturated = palette.filter(([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) > 55);
  const primary = saturated[0] || palette[0];
  const highlight = saturated.find(color => primary && hex(color) !== hex(primary)) || palette.find(color => primary && hex(color) !== hex(primary));

  return {
    primaryColor: primary ? hex(primary) : CONSULT_DEFAULTS.primaryColor,
    highlightColor: highlight ? hex(highlight) : CONSULT_DEFAULTS.highlightColor,
  };
}

export default function Settings() {
  const currentUser = useStore(state => state.currentUser);
  const tenants = useStore(state => state.tenants);
  const updateTenantSettings = useStore(state => state.updateTenantSettings);
  const activeTenantId = useStore(state => state.activeTenantId);
  const isMaster = currentUser?.role === 'master';
  const tenant = tenants.find(t => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));

  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(CONSULT_DEFAULTS.primaryColor);
  const [highlightColor, setHighlightColor] = useState(CONSULT_DEFAULTS.highlightColor);
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenant) return;
    setCompanyName(tenant.settings.companyName || tenant.name || CONSULT_DEFAULTS.companyName);
    setPrimaryColor(tenant.settings.primaryColor || CONSULT_DEFAULTS.primaryColor);
    // Compatibilidade: sidebarColor é o campo legado persistido pelo backend. A partir
    // deste fluxo ele representa a cor de destaque, igual ao highlightColor do 7Commander.
    setHighlightColor(tenant.settings.sidebarColor || CONSULT_DEFAULTS.highlightColor);
    setLogoUrl(tenant.settings.logoUrl || '');
    setSelectedFileName('');
    setSaved(false);
    setSaveError('');
  }, [tenant]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaved(false);
    setSaveError('');
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLogoUrl(dataUrl);
      const image = new Image();
      image.onload = () => {
        try {
          const palette = extractPalette(image);
          if (!palette) return;
          setPrimaryColor(palette.primaryColor);
          setHighlightColor(palette.highlightColor);
        } catch (error) {
          console.error('Não foi possível extrair a paleta da logo.', error);
        }
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const persistIdentity = async (identity: typeof CONSULT_DEFAULTS) => {
    if (!tenant) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await updateTenantSettings(tenant.id, {
        companyName: identity.companyName,
        primaryColor: identity.primaryColor,
        logoUrl: identity.logoUrl,
        // Campo legado: persiste a cor de destaque sem criar uma migração incompatível.
        sidebarColor: identity.highlightColor,
        sidebarTextColor: getContrastColor(identity.primaryColor),
      });
      setCompanyName(identity.companyName);
      setPrimaryColor(identity.primaryColor);
      setHighlightColor(identity.highlightColor);
      setLogoUrl(identity.logoUrl);
      setSaved(true);
    } catch (error: any) {
      setSaveError(error?.message || 'Não foi possível salvar a identidade visual.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    await persistIdentity({ companyName, logoUrl, primaryColor, highlightColor });
  };

  const handleRestore = async () => {
    setSelectedFileName('');
    await persistIdentity(CONSULT_DEFAULTS);
  };

  if (!tenant) {
    return <div className="p-8 text-center text-slate-500">Selecione um cliente no menu superior para editar a identidade visual.</div>;
  }

  const previewLogo = logoUrl || CONSULT_DEFAULTS.logoUrl;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary-color)]">Consult Services · CRM Flow</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Identidade visual</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          O CRM Flow permanece uma plataforma Consult Services. A identidade do cliente personaliza logo e cores sem remover a marca do produto.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">White label do cliente</div>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Identidade apresentada ao cliente</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Ao enviar uma logo, as cores predominantes são sugeridas automaticamente e podem ser ajustadas antes de salvar.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-white p-5">
            <img src={previewLogo} alt="Prévia da marca do cliente" className="max-h-28 max-w-full object-contain" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-800">
              Nome exibido
              <Input className="mt-1" value={companyName} onChange={event => { setSaved(false); setCompanyName(event.target.value); }} />
            </label>

            <label className="text-sm font-medium text-slate-800">
              Logo do cliente
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" variant="primary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} className="mr-2" /> Escolher arquivo
                </Button>
                <span className="text-xs font-normal text-slate-500">{selectedFileName || (logoUrl ? 'Logo atual' : 'Nenhum arquivo selecionado')}</span>
              </span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
            </label>

            <label className="text-sm font-medium text-slate-800">
              Cor principal
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={event => { setSaved(false); setPrimaryColor(event.target.value.toUpperCase()); }} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                <Input value={primaryColor} onChange={event => { setSaved(false); setPrimaryColor(event.target.value.toUpperCase()); }} className="font-mono uppercase" />
              </div>
            </label>

            <label className="text-sm font-medium text-slate-800">
              Cor de destaque
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={highlightColor} onChange={event => { setSaved(false); setHighlightColor(event.target.value.toUpperCase()); }} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                <Input value={highlightColor} onChange={event => { setSaved(false); setHighlightColor(event.target.value.toUpperCase()); }} className="font-mono uppercase" />
              </div>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <Button type="submit" loading={saving}>Salvar identidade do cliente</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={handleRestore}>Restaurar Consult Services</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">Identidade atualizada neste ambiente.</span>}
          {saveError && <span className="text-sm font-medium text-red-600">{saveError}</span>}
        </div>
      </form>
    </div>
  );
}
