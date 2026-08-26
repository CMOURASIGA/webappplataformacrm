import React, { useState } from 'react';
import { Mail, Plus, Users, TrendingUp, DollarSign, Trash2, Pencil, ChevronDown } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Tag,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  KpiCard,
  Modal,
  Drawer,
  Tooltip,
  DropdownMenu,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  EmptyState,
  ErrorState,
  PermissionState,
  Skeleton,
  LoadingState,
  PageHeader,
  SearchField,
  FilterBar,
  Tabs,
  Avatar,
} from '../../components/ui';

/**
 * Internal Design System reference for the CRM Flow foundation (MIGRATION_PLAN Fase 1).
 * Not linked from the sidebar/navigation — reachable directly for QA/dev reference only.
 */
export default function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [switchValue, setSwitchValue] = useState(true);
  const [tab, setTab] = useState('resumo');

  return (
    <div className="cs-page">
      <PageHeader
        title="Design System — CRM Flow"
        description="Referência interna dos componentes de fundação (Fase 1). Não faz parte da navegação do produto."
        actions={<Button variant="outline">Filtros</Button>}
        primaryAction={<Button><Plus size={16} /> Novo Lead</Button>}
      />

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Tipografia</h2>
        <p className="cs-text-page-title">Page Title</p>
        <p className="cs-text-section-title">Section Title</p>
        <p className="cs-text-body">Body — texto padrão de conteúdo.</p>
        <p className="cs-text-label">Label</p>
        <p className="cs-text-helper">Helper text — orientação complementar.</p>
        <p className="cs-text-caption">Caption</p>
        <p className="cs-text-kpi-value">R$ 12.400</p>
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Botões</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>Salvando...</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <IconButton label="Editar"><Pencil size={16} /></IconButton>
          <IconButton label="Excluir" variant="danger"><Trash2 size={16} /></IconButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Inputs, Select e controles</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="cs-text-label mb-1 block">Nome</label>
            <Input placeholder="Digite o nome" />
          </div>
          <div>
            <label className="cs-text-label mb-1 block">E-mail (erro)</label>
            <Input invalid defaultValue="email-invalido" />
            <p className="mt-1 text-xs text-danger-600">Informe um e-mail válido.</p>
          </div>
          <div>
            <label className="cs-text-label mb-1 block">Observações</label>
            <Textarea placeholder="Escreva uma nota..." />
          </div>
          <div>
            <label className="cs-text-label mb-1 block">Origem</label>
            <Select defaultValue="site">
              <option value="site">Site</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="indicacao">Indicação</option>
            </Select>
          </div>
          <div>
            <label className="cs-text-label mb-1 block">Desabilitado</label>
            <Input disabled defaultValue="Não editável" />
          </div>
          <div className="flex flex-col gap-2">
            <Checkbox label="Aceito os termos" defaultChecked />
            <Checkbox label="Opção desabilitada" disabled />
            <Radio label="Opção A" name="demo-radio" defaultChecked />
            <Radio label="Opção B" name="demo-radio" />
            <Switch checked={switchValue} onChange={setSwitchValue} label="Notificações ativas" />
          </div>
        </div>
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Badges e Tags</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Sem responsável</Badge>
          <Badge variant="info">Aguardando cliente</Badge>
          <Badge variant="success">Ganho</Badge>
          <Badge variant="warning">Em atendimento</Badge>
          <Badge variant="danger">Perdido</Badge>
          <Badge variant="primary">Ativo</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag color="#1D9BF0">Quente</Tag>
          <Tag color="#F59E0B">Morno</Tag>
          <Tag onRemove={() => {}}>Removível</Tag>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Users} label="Leads ativos" value="128" context="+12% vs. mês anterior" onClick={() => {}} />
        <KpiCard icon={DollarSign} label="Receita em funil" value="R$ 84.200" tone="success" />
        <KpiCard icon={TrendingUp} label="Taxa de conversão" value="24%" tone="warning" />
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Cards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Card padrão</CardTitle></CardHeader>
            <CardContent>Conteúdo com radius, padding, borda e sombra consistentes.</CardContent>
          </Card>
          <Card interactive onClick={() => {}}>
            <CardHeader><CardTitle>Card interativo</CardTitle></CardHeader>
            <CardContent>Hover e foco de teclado habilitados.</CardContent>
          </Card>
        </div>
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Search, Filter Bar e Tabs</h2>
        <FilterBar onClear={() => setSearch('')}>
          <SearchField value={search} onChange={setSearch} className="max-w-xs" />
          <Select defaultValue="" className="max-w-[10rem]">
            <option value="">Todas as etapas</option>
            <option value="novo">Novo</option>
          </Select>
        </FilterBar>
        <Tabs
          items={[
            { value: 'resumo', label: 'Resumo' },
            { value: 'conversas', label: 'Conversas' },
            { value: 'atividades', label: 'Atividades' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Tabela</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Lead</TableHeaderCell>
              <TableHeaderCell>Etapa</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell aria-label="Ações" />
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow clickable>
              <TableCell className="flex items-center gap-2"><Avatar name="Maria Silva" size="sm" /> Maria Silva</TableCell>
              <TableCell><Badge variant="info">Proposta</Badge></TableCell>
              <TableCell>Ana</TableCell>
              <TableCell>
                <DropdownMenu
                  items={[
                    { label: 'Editar', onSelect: () => {}, icon: <Pencil size={14} /> },
                    { label: 'Excluir', onSelect: () => {}, icon: <Trash2 size={14} />, danger: true },
                  ]}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex items-center gap-2">
          <span className="cs-text-caption">Trigger customizado (deve ser focável via Tab e operável via Enter):</span>
          <DropdownMenu
            trigger={<Button variant="outline" size="sm">Ações <ChevronDown size={14} /></Button>}
            items={[
              { label: 'Editar', onSelect: () => {}, icon: <Pencil size={14} /> },
              { label: 'Excluir', onSelect: () => {}, icon: <Trash2 size={14} />, danger: true },
            ]}
          />
        </div>
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Estados</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmptyState title="Nenhum lead encontrado" description="Ajuste os filtros ou cadastre um novo lead." action={<Button size="sm">Novo lead</Button>} />
          <ErrorState onRetry={() => {}} />
          <PermissionState />
          <LoadingState rows={3} />
        </div>
        <Skeleton className="h-6 w-40" />
      </section>

      <section className="cs-card cs-card-pad space-y-3">
        <h2 className="cs-text-section-title">Tooltip, Modal e Drawer</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip content="Enviar e-mail">
            <IconButton label="Enviar e-mail"><Mail size={16} /></IconButton>
          </Tooltip>
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>Abrir drawer</Button>
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Excluir lead"
        description="Esta ação não pode ser desfeita."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>Excluir</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir este lead? Todo o histórico associado será perdido.</p>
      </Modal>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Editar lead"
        description="Consulta e edição contextual"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button onClick={() => setDrawerOpen(false)}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="cs-text-label mb-1 block">Nome</label>
            <Input defaultValue="Maria Silva" />
          </div>
          <div>
            <label className="cs-text-label mb-1 block">Notas</label>
            <Textarea defaultValue="Cliente aguardando retorno." />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
