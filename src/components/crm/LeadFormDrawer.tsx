import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Drawer } from '../ui/Drawer';
import type { Lead } from '../../types';

interface LeadFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

const leadSources = ['Cadastro manual', 'Telefone', 'Indicação', 'Anúncio Meta', 'Anúncio Google', 'Site', 'Redes Sociais', 'WhatsApp', 'Evento', 'Importação'];

/**
 * Cadastro/edição simples de lead — FRONTEND_SPEC §6: cadastro pequeno e edição
 * contextual usam Drawer, não Modal. Mesmo formulário e regras de antes, só a
 * casca visual mudou.
 */
export function LeadFormDrawer({ isOpen, onClose, lead }: LeadFormDrawerProps) {
  const currentUser = useStore(state => state.currentUser);
  const pipelines = useStore(state => state.pipelines);
  const activeTenantId = useStore(state => state.activeTenantId);
  const addLead = useStore(state => state.addLead);
  const updateLead = useStore(state => state.updateLead);
  const tags = useStore(state => state.tags);
  const tenantId = currentUser?.role === 'master' ? activeTenantId : currentUser?.tenantId;
  const pipeline = pipelines.find(p => p.tenantId === tenantId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Cadastro manual');
  const [otherSource, setOtherSource] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [classification, setClassification] = useState<NonNullable<Lead['classification']> | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(lead?.name || '');
    setPhone(lead?.phone || '');
    setEmail(lead?.email || '');
    setCompany(lead?.company || '');
    const savedSource = lead?.source || 'Cadastro manual';
    setSource(leadSources.includes(savedSource) ? savedSource : 'Outro');
    setOtherSource(lead && !leadSources.includes(savedSource) ? savedSource : '');
    setTagIds(lead?.tags || []);
    setClassification(lead?.classification || '');
    setError('');
  }, [isOpen, lead]);

  const automaticSource = lead?.sourceType === 'automatic';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !pipeline || !tenantId) {
      setError('Preencha nome e telefone e verifique se há um funil configurado.');
      return;
    }
    const firstStage = [...pipeline.stages].sort((a, b) => a.order - b.order)[0];
    if (!lead && !firstStage) return setError('O funil não possui etapas.');

    setSaving(true);
    setError('');
    try {
      const values = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        source: source === 'Outro' ? otherSource.trim() : source,
        sourceType: automaticSource ? 'automatic' as const : 'manual' as const,
        classification: classification || null,
        tags: tagIds,
      };
      if (lead) {
        await updateLead(lead.id, values);
      } else {
        await addLead({ ...values, tenantId, status: 'new', stageId: firstStage.id, pipelineId: pipeline.id, notes: '', tags: [] });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o lead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Editar lead' : 'Novo lead'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="lead-form" loading={saving}>{saving ? 'Salvando...' : 'Salvar lead'}</Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="cs-text-label mb-1 block">Nome *</label>
          <Input required value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="cs-text-label mb-1 block">WhatsApp / telefone *</label>
          <Input required value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="cs-text-label mb-1 block">E-mail</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="cs-text-label mb-1 block">Empresa</label>
          <Input value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="cs-text-label mb-1 block">Classificação do lead</label>
          <Select value={classification} onChange={e => setClassification(e.target.value as NonNullable<Lead['classification']> | '')}>
            <option value="">Não classificado</option>
            <option value="frio">Frio</option>
            <option value="morno">Morno</option>
            <option value="quente">Quente</option>
          </Select>
          <p className="cs-text-helper mt-1">Pode ser definida manualmente ou atualizada pela classificação de IA na conversa.</p>
        </div>
        <div>
          <label className="cs-text-label mb-1 block">Origem informada</label>
          <Select value={source} onChange={e => setSource(e.target.value)} disabled={automaticSource}>
            {automaticSource && <option value={lead?.source}>{lead?.source}</option>}
            <option value="Cadastro manual">Cadastro manual</option>
            <option value="Telefone">Telefone</option>
            <option value="Indicação">Indicação</option>
            <option value="Anúncio Meta">Anúncio Meta</option>
            <option value="Anúncio Google">Anúncio Google</option>
            <option value="Site">Site</option>
            <option value="Redes Sociais">Redes Sociais</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Evento">Evento</option>
            <option value="Importação">Importação</option>
            <option value="Outro">Outro</option>
          </Select>
          <p className="cs-text-helper mt-1">{automaticSource ? 'Origem registrada automaticamente por uma integração.' : 'Origem informada manualmente. Não representa uma integração ativa.'}</p>
        </div>
        {source === 'Outro' && (
          <div>
            <label className="cs-text-label mb-1 block">Informe a origem *</label>
            <Input required value={otherSource} onChange={event => setOtherSource(event.target.value)} />
          </div>
        )}
        <fieldset>
          <legend className="cs-text-label mb-2 block">Etiquetas</legend>
          <div className="flex flex-wrap gap-2">
            {tags.filter(tag => tag.tenantId === tenantId).map(tag => (
              <label key={tag.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold">
                <Checkbox
                  checked={tagIds.includes(tag.id)}
                  onChange={event => setTagIds(current => event.target.checked ? [...current, tag.id] : current.filter(id => id !== tag.id))}
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </label>
            ))}
            {tags.filter(tag => tag.tenantId === tenantId).length === 0 && (
              <p className="cs-text-helper">Nenhuma etiqueta cadastrada para este cliente.</p>
            )}
          </div>
        </fieldset>
        {error && <p className="text-sm text-danger-600" role="alert">{error}</p>}
      </form>
    </Drawer>
  );
}
