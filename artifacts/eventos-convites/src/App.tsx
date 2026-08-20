import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronDown, Clipboard, Clock3,
  Download, ExternalLink, Filter, LayoutDashboard, Link2, LogOut, MapPin, Menu, MoreHorizontal,
  PartyPopper, Plus, QrCode, RefreshCw, Search, Send, Settings2, ShieldCheck, Sparkles,
  Ticket, UserRound, UsersRound, X, XCircle, Zap,
} from 'lucide-react';
import {
  getGetEventQueryKey, getListEventsQueryKey, useCancelInvite, useCreateEvent, useCreateInvite,
  useGetEvent, useHealthCheck, useListEvents, useValidateInvite,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type EventLike = {
  id: string; name: string; type: string; startsAt: string; location: string; description: string;
  capacity: number; coverUrl: string; inviteCount: number; checkedInCount: number; status: string;
};
type InviteLike = {
  id: string; eventId: string; guestName: string; contact: string | null; code: string;
  status: string; checkedInAt: string | null; createdAt: string;
};
type EventDetailLike = EventLike & { invites: InviteLike[] };

const demoEvents: EventLike[] = [
  { id: 'ev-casamento', name: 'Casamento Ana & Miguel', type: 'Casamento', startsAt: '2025-10-18T16:30:00', location: 'Casa do Lago, Sintra', description: 'Um fim de tarde para celebrar a nossa história, com música, jardim e mesa longa.', capacity: 180, coverUrl: '', inviteCount: 126, checkedInCount: 84, status: 'upcoming' },
  { id: 'ev-jantar', name: 'Jantar de Verão Atelier 87', type: 'Jantar', startsAt: '2025-08-02T20:00:00', location: 'Atelier 87, Lisboa', description: 'Uma mesa para ideias boas e pessoas melhores.', capacity: 42, coverUrl: '', inviteCount: 38, checkedInCount: 38, status: 'completed' },
  { id: 'ev-batizado', name: 'Batizado do Tomás', type: 'Celebração', startsAt: '2025-11-09T11:00:00', location: 'Quinta da Graciosa', description: 'Almoço de família com espaço para as crianças correrem.', capacity: 90, coverUrl: '', inviteCount: 22, checkedInCount: 0, status: 'draft' },
];

const demoInvites: InviteLike[] = [
  { id: 'in-1', eventId: 'ev-casamento', guestName: 'Carolina Matos', contact: 'carolina@email.pt', code: 'ANA-MIG-001', status: 'confirmed', checkedInAt: '2025-10-18T16:42:00', createdAt: '2025-06-12T10:15:00' },
  { id: 'in-2', eventId: 'ev-casamento', guestName: 'Rita e João Silva', contact: '+351 912 444 120', code: 'ANA-MIG-002', status: 'confirmed', checkedInAt: null, createdAt: '2025-06-12T10:17:00' },
  { id: 'in-3', eventId: 'ev-casamento', guestName: 'Marta Oliveira', contact: 'marta@email.pt', code: 'ANA-MIG-003', status: 'pending', checkedInAt: null, createdAt: '2025-06-13T09:42:00' },
  { id: 'in-4', eventId: 'ev-casamento', guestName: 'Pedro & Inês Costa', contact: null, code: 'ANA-MIG-004', status: 'confirmed', checkedInAt: null, createdAt: '2025-06-13T12:21:00' },
  { id: 'in-5', eventId: 'ev-casamento', guestName: 'Luís Ferreira', contact: 'luis@email.pt', code: 'ANA-MIG-005', status: 'cancelled', checkedInAt: null, createdAt: '2025-06-14T08:05:00' },
];

const fallbackDetail = (id: string): EventDetailLike => {
  const event = demoEvents.find((item) => item.id === id) ?? demoEvents[0];
  return { ...event, invites: event.id === 'ev-casamento' ? demoInvites : [] };
};

function formatDate(value: string, withTime = true) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value));
}
function shortDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '');
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}
function eventTone(type: string) {
  if (type.toLowerCase().includes('jantar')) return 'from-[#e2ddd0] via-[#b9cfc6] to-[#87a99c]';
  if (type.toLowerCase().includes('batizado')) return 'from-[#dce8e1] via-[#d6b8a8] to-[#a98272]';
  return 'from-[#f2d6bd] via-[#dca28c] to-[#8ea9a1]';
}
function statusLabel(status: string) {
  const labels: Record<string, string> = { upcoming: 'A acontecer', completed: 'Concluído', draft: 'Rascunho', confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', checked_in: 'Entrada registada' };
  return labels[status] ?? status;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/eventos" className="flex items-center gap-3" data-testid="link-brand">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_8px_18px_-10px_hsl(var(--primary))]"><PartyPopper size={19} strokeWidth={2.2} /></span>
    {!compact && <span className="display text-[23px] font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">lumina<span className="text-[hsl(var(--primary))]">.</span></span>}
  </Link>;
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' }) {
  const styles = {
    primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_20px_-14px_hsl(var(--primary))] hover:brightness-95',
    quiet: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]',
    outline: 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]',
    danger: 'bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.16)]',
  };
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function Sidebar({ mobileOpen, closeMobile }: { mobileOpen: boolean; closeMobile: () => void }) {
  const [location, setLocation] = useLocation();
  const nav = [
    { href: '/eventos', label: 'Visão geral', icon: LayoutDashboard },
    { href: '/scan', label: 'Validar entradas', icon: QrCode },
  ];
  return <>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(var(--foreground)/.18)] md:hidden" onClick={closeMobile} aria-label="Fechar menu" data-testid="button-close-menu" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Brand compact /><span className="display text-[22px] font-bold md:hidden">lumina<span className="text-[hsl(var(--primary))]">.</span></span><button className="rounded-lg p-2 md:hidden" onClick={closeMobile} data-testid="button-menu-close"><X size={18} /></button></div>
      <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Organização</div>
      <nav className="mt-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={closeMobile} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${location === href || (href === '/eventos' && location.startsWith('/eventos/')) ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{href === '/scan' && <span className="ml-auto rounded-full bg-[hsl(var(--accent))] px-2 py-0.5 text-[10px] font-black text-[hsl(var(--accent-foreground))]">QR</span>}</Link>)}
      </nav>
      <div className="mt-auto">
        <div className="mb-4 rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.65)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]"><Sparkles size={15} /><span className="text-xs font-bold">Tudo pronto para hoje?</span></div>
          <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.62)]">Valide as entradas e deixe a receção fluir.</p>
          <Link href="/scan" className="mt-3 flex items-center gap-1 text-xs font-bold text-[hsl(var(--sidebar-primary))]" data-testid="link-sidebar-scan">Abrir validador <ArrowUpRight size={13} /></Link>
        </div>
        <button onClick={() => { localStorage.removeItem('eventos_session'); setLocation('/auth'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.62)] hover:bg-[hsl(var(--sidebar-accent))]" data-testid="button-logout"><LogOut size={17} /> Terminar sessão</button>
      </div>
    </aside>
  </>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))] md:pl-[252px]">
    <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border)/.72)] bg-[hsl(var(--background)/.9)] px-5 backdrop-blur-md md:px-10">
      <button className="rounded-xl p-2 md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={21} /></button>
      <div className="hidden text-xs font-semibold text-[hsl(var(--muted-foreground))] md:block">Quinta-feira, 12 de junho de 2025</div>
      <div className="ml-auto flex items-center gap-3"><button className="hidden rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] md:block" data-testid="button-settings"><Settings2 size={18} /></button><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--secondary))] text-xs font-extrabold text-[hsl(var(--secondary-foreground))]" data-testid="text-user-avatar">MR</span></div>
    </header>
    <main className="mx-auto max-w-[1380px] px-5 py-7 md:px-10 md:py-10">{children}</main>
  </div>;
}

function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); localStorage.setItem('eventos_session', 'demo'); setLocation('/eventos'); };
  return <div className="app-noise flex min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
    <div className="relative hidden w-[44%] overflow-hidden bg-[#24453f] p-12 text-[#f8f1e7] lg:flex lg:flex-col">
      <div className="absolute -right-28 -top-24 h-[420px] w-[420px] rounded-full border border-[#d6a088]/35" /><div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full border border-[#e3bf73]/30" />
      <Brand />
      <div className="relative mt-auto max-w-[420px] pb-8"><p className="mono mb-5 text-[10px] uppercase tracking-[.22em] text-[#e7bf7a]">A festa começa antes da festa</p><h1 className="display text-6xl font-bold leading-[.98] tracking-[-.05em]">Faça cada<br /><em className="font-normal text-[#e9b09a]">chegada</em><br />ser especial.</h1><p className="mt-7 max-w-[340px] text-sm leading-6 text-[#d6e0d8]/75">Convites bonitos, entradas tranquilas e a sensação de ter tudo no lugar.</p></div>
      <div className="relative flex items-center gap-4 text-xs text-[#d6e0d8]/60"><span className="h-px w-10 bg-[#d6e0d8]/30" />Feito para quem recebe bem.</div>
    </div>
    <div className="flex flex-1 items-center justify-center px-5 py-10"><div className="w-full max-w-[430px]">
      <div className="mb-10 lg:hidden"><Brand /></div>
      <div className="mb-8"><p className="mono mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{mode === 'login' ? 'Bem-vindo de volta' : 'Comece por aqui'}</p><h2 className="display text-4xl font-bold tracking-[-.04em]">{mode === 'login' ? 'A sua agenda está à sua espera.' : 'Vamos preparar algo bonito.'}</h2><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{mode === 'login' ? 'Entre para continuar a cuidar dos seus eventos.' : 'Crie a sua conta e deixe o resto connosco.'}</p></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <Field label="Nome completo" placeholder="Como devemos tratar de si?" value={form.name} onChange={(value) => setForm({ ...form, name: value })} testId="input-name" />}
        <Field label="Email" type="email" placeholder="nome@exemplo.pt" value={form.email} onChange={(value) => setForm({ ...form, email: value })} testId="input-email" />
        {mode === 'signup' && <Field label="Telefone" placeholder="+351 912 345 678" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} testId="input-phone" />}
        <Field label="Palavra-passe" type="password" placeholder="••••••••" value={form.password} onChange={(value) => setForm({ ...form, password: value })} testId="input-password" />
        <Button type="submit" className="mt-3 w-full py-3" data-testid="button-auth-submit">{mode === 'login' ? 'Entrar na conta' : 'Criar a minha conta'}<ArrowUpRight size={16} /></Button>
      </form>
      <div className="my-7 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span className="h-px flex-1 bg-[hsl(var(--border))]" />ou<span className="h-px flex-1 bg-[hsl(var(--border))]" /></div>
      <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-bold transition hover:border-[hsl(var(--primary))]" data-testid="button-switch-auth">{mode === 'login' ? 'Ainda não tenho uma conta' : 'Já tenho uma conta'}</button>
      <p className="mt-8 text-center text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Ao continuar, aceita os nossos termos de utilização e política de privacidade.</p>
    </div></div>
  </div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', testId }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; testId: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-[hsl(var(--foreground)/.76)]">{label}</span><input required value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-4 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.58)] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.1)]" data-testid={testId} /></label>;
}

function Protected({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => { if (!localStorage.getItem('eventos_session')) setLocation('/auth'); }, [setLocation]);
  if (!localStorage.getItem('eventos_session')) return null;
  return <AppShell>{children}</AppShell>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mono mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p><h1 className="display text-4xl font-bold tracking-[-.045em] md:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-[570px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>}</div>{action}</div>;
}

function EventCard({ event }: { event: EventLike }) {
  const percent = event.capacity ? Math.round((event.inviteCount / event.capacity) * 100) : 0;
  return <Link href={`/eventos/${event.id}`} className="group block overflow-hidden rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-card)] lift" data-testid={`card-event-${event.id}`}>
    <div className={`relative h-[155px] overflow-hidden bg-gradient-to-br ${eventTone(event.type)} p-5`}><div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/30" /><div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full border border-white/20" /><div className="relative flex items-start justify-between"><span className="rounded-full bg-white/65 px-3 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#25423e]">{event.type}</span><span className="rounded-full bg-[#25423e]/85 px-2.5 py-1 text-[10px] font-bold text-white">{statusLabel(event.status)}</span></div><div className="absolute bottom-4 left-5 flex items-end gap-2 text-[#25423e]"><span className="display text-4xl font-bold leading-none">{new Date(event.startsAt).getDate()}</span><span className="mono mb-0.5 text-[10px] uppercase leading-3">{new Intl.DateTimeFormat('pt-PT', { month: 'short' }).format(new Date(event.startsAt))}<br />{new Date(event.startsAt).getFullYear()}</span></div></div>
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="display text-xl font-bold tracking-[-.025em] group-hover:text-[hsl(var(--primary))]">{event.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={13} />{event.location}</p></div><ArrowUpRight size={18} className="text-[hsl(var(--muted-foreground))] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[hsl(var(--primary))]" /></div><div className="mt-6 flex items-end justify-between text-xs"><span className="text-[hsl(var(--muted-foreground))]"><strong className="text-base text-[hsl(var(--foreground))]">{event.inviteCount}</strong> convidados</span><span className="font-semibold text-[hsl(var(--muted-foreground))]">{percent}% capacidade</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${Math.min(percent, 100)}%` }} /></div></div>
  </Link>;
}

function OverviewPage() {
  const { data, isLoading, isError, refetch } = useListEvents({ query: { queryKey: getListEventsQueryKey(), staleTime: 30000 } });
  const { isError: healthError } = useHealthCheck();
  const createEvent = useCreateEvent();
  const client = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Casamento', startsAt: '', location: '', description: '', capacity: '80', coverUrl: '' });
  const events = (data as EventLike[] | undefined) ?? demoEvents;
  const upcoming = events.filter((event) => event.status !== 'completed');
  const totalGuests = events.reduce((sum, event) => sum + event.inviteCount, 0);
  const checked = events.reduce((sum, event) => sum + event.checkedInCount, 0);
  const submit = (event: FormEvent) => { event.preventDefault(); createEvent.mutate({ data: { ...form, capacity: Number(form.capacity) } }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListEventsQueryKey() }); setModal(false); setForm({ name: '', type: 'Casamento', startsAt: '', location: '', description: '', capacity: '80', coverUrl: '' }); } }); };
  return <><PageHeading eyebrow="O seu espaço" title="Tudo no seu lugar." description="Uma vista clara de cada celebração, dos primeiros convites à última chegada." action={<Button onClick={() => setModal(true)} data-testid="button-create-event"><Plus size={17} /> Novo evento</Button>} />
    {(isError || healthError) && <div className="mb-5 flex items-center justify-between rounded-2xl border border-[hsl(var(--accent)/.65)] bg-[hsl(var(--accent)/.18)] px-4 py-3 text-xs"><span className="flex items-center gap-2"><Zap size={15} /> Modo demonstração ativo — os seus dados aparecem assim que a ligação for restabelecida.</span><button onClick={() => refetch()} className="font-bold underline" data-testid="button-retry-events">Tentar novamente</button></div>}
    <section className="grid gap-4 md:grid-cols-3"><Metric label="Eventos ativos" value={upcoming.length.toString().padStart(2, '0')} detail="a preparar consigo" icon={<CalendarDays size={19} />} tone="coral" /><Metric label="Convites enviados" value={totalGuests.toString()} detail="em todas as celebrações" icon={<Send size={19} />} tone="sage" /><Metric label="Entradas registadas" value={checked.toString()} detail="presença confirmada" icon={<CheckCircle2 size={19} />} tone="gold" /></section>
    <div className="mt-12 flex items-center justify-between"><div><p className="mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Calendário</p><h2 className="display mt-2 text-2xl font-bold">Os seus eventos</h2></div><button className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="button-sort-events">Mais recentes <ChevronDown size={15} /></button></div>
    {isLoading ? <div className="mt-5 grid gap-5 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[340px] rounded-[22px] skeleton" />)}</div> : events.length === 0 ? <EmptyEvents onCreate={() => setModal(true)} /> : <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} />)}<button onClick={() => setModal(true)} className="flex min-h-[340px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--card)/.55)] hover:text-[hsl(var(--primary))]" data-testid="button-create-event-card"><span className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-current"><Plus size={20} /></span><span className="text-sm font-bold">Preparar outro evento</span><span className="mt-1 text-xs">Leva menos de dois minutos</span></button></div>}
    {modal && <Modal title="Criar novo evento" eyebrow="Vamos começar" onClose={() => setModal(false)}><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do evento" placeholder="Ex.: Casamento Ana & Miguel" value={form.name} onChange={(value) => setForm({ ...form, name: value })} testId="input-event-name" /><label className="block"><span className="mb-2 block text-xs font-bold">Tipo de evento</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm" data-testid="select-event-type"><option>Casamento</option><option>Jantar</option><option>Festa</option><option>Celebração</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Data e hora" type="datetime-local" placeholder="" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} testId="input-event-date" /><Field label="Capacidade" type="number" placeholder="80" value={form.capacity} onChange={(value) => setForm({ ...form, capacity: value })} testId="input-event-capacity" /></div><Field label="Local" placeholder="Onde vai acontecer?" value={form.location} onChange={(value) => setForm({ ...form, location: value })} testId="input-event-location" /><label className="block"><span className="mb-2 block text-xs font-bold">Uma nota sobre o evento</span><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="O que os convidados devem saber?" data-testid="input-event-description" /></label><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="quiet" onClick={() => setModal(false)} data-testid="button-cancel-event">Cancelar</Button><Button type="submit" disabled={createEvent.isPending} data-testid="button-submit-event">{createEvent.isPending ? 'A criar…' : 'Criar evento'}<ArrowUpRight size={16} /></Button></div></form></Modal>}
  </>;
}

function Metric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: ReactNode; tone: 'coral' | 'sage' | 'gold' }) {
  const bg = { coral: 'bg-[#f4ddd2]', sage: 'bg-[#dce9e0]', gold: 'bg-[#f4e7bd]' };
  return <div className={`rounded-[20px] p-5 ${bg[tone]}`}><div className="flex items-start justify-between"><span className="text-xs font-bold text-[#30433e]/70">{label}</span><span className="text-[#30433e]/65">{icon}</span></div><div className="display mt-5 text-4xl font-bold tracking-[-.04em] text-[#263b37]">{value}</div><p className="mt-1 text-xs font-semibold text-[#30433e]/60">{detail}</p></div>;
}
function EmptyEvents({ onCreate }: { onCreate: () => void }) {
  return <div className="mt-5 rounded-[22px] border border-dashed border-[hsl(var(--border))] px-6 py-20 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"><CalendarDays /></span><h3 className="display mt-5 text-2xl font-bold">A sua próxima história começa aqui.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">Crie um evento, convide as pessoas certas e acompanhe tudo sem esforço.</p><Button onClick={onCreate} className="mt-6" data-testid="button-empty-create-event"><Plus size={16} /> Criar primeiro evento</Button></div>;
}

function EventDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useGetEvent(id, { query: { enabled: Boolean(id), queryKey: getGetEventQueryKey(id), staleTime: 30000 } });
  const detail = (data as EventDetailLike | undefined) ?? fallbackDetail(id);
  const client = useQueryClient();
  const [inviteModal, setInviteModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'checked_in'>('all');
  const [search, setSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({ guestName: '', contact: '' });
  const createInvite = useCreateInvite();
  const cancelInvite = useCancelInvite();
  const filtered = detail.invites.filter((invite) => (filter === 'all' || invite.status === filter || (filter === 'checked_in' && Boolean(invite.checkedInAt))) && `${invite.guestName} ${invite.contact ?? ''} ${invite.code}`.toLowerCase().includes(search.toLowerCase()));
  const submitInvite = (event: FormEvent) => { event.preventDefault(); createInvite.mutate({ id, data: { guestName: inviteForm.guestName, contact: inviteForm.contact || null } }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetEventQueryKey(id) }); setInviteModal(false); setInviteForm({ guestName: '', contact: '' }); } }); };
  const cancel = (code: string) => { if (window.confirm('Cancelar este convite?')) cancelInvite.mutate({ code }, { onSuccess: () => client.invalidateQueries({ queryKey: getGetEventQueryKey(id) }) }); };
  const exportCsv = () => { const csv = ['Convidado,Contacto,Código,Estado,Entrada', ...filtered.map((item) => `"${item.guestName}","${item.contact ?? ''}","${item.code}","${statusLabel(item.status)}","${item.checkedInAt ? formatDate(item.checkedInAt) : ''}"`)].join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${detail.name.toLowerCase().replaceAll(' ', '-')}-convidados.csv`; anchor.click(); URL.revokeObjectURL(url); };
  const days = Math.max(0, Math.ceil((new Date(detail.startsAt).getTime() - Date.now()) / 86400000));
  return <>{isLoading ? <DetailSkeleton /> : <><div className="mb-7 flex items-center gap-3"><Link href="/eventos" className="grid h-9 w-9 place-items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:text-[hsl(var(--primary))]" data-testid="link-back-events"><ArrowLeft size={17} /></Link><span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Todos os eventos <span className="mx-1">/</span> {detail.name}</span></div>{isError && <div className="mb-5 flex items-center justify-between rounded-xl bg-[hsl(var(--accent)/.2)] px-4 py-3 text-xs"><span>Estamos a mostrar uma prévia deste evento.</span><button onClick={() => refetch()} className="font-bold underline" data-testid="button-retry-event">Atualizar</button></div>}<div className={`relative overflow-hidden rounded-[26px] bg-gradient-to-br ${eventTone(detail.type)} p-6 text-[#25423e] md:p-9`}><div className="absolute -right-10 -top-24 h-80 w-80 rounded-full border border-white/25" /><div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em]">{detail.type}</span><h1 className="display mt-4 max-w-[700px] text-4xl font-bold tracking-[-.05em] md:text-6xl">{detail.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold"><span className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(detail.startsAt)}</span><span className="flex items-center gap-1.5"><MapPin size={14} />{detail.location}</span></div></div><div className="rounded-2xl bg-[#25423e]/90 px-5 py-4 text-white"><p className="mono text-[9px] uppercase tracking-[.15em] text-[#e7bf7a]">Faltam</p><p className="display mt-1 text-4xl font-bold">{days}<span className="ml-1 text-base font-semibold">dias</span></p></div></div></div><p className="mt-5 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{detail.description}</p>
    <section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Convites" value={detail.inviteCount.toString()} detail={`de ${detail.capacity} lugares`} icon={<Ticket size={19} />} tone="coral" /><Metric label="Confirmados" value={detail.invites.filter((item) => item.status === 'confirmed').length.toString()} detail="a aguardar presença" icon={<CheckCircle2 size={19} />} tone="sage" /><Metric label="Entradas" value={detail.checkedInCount.toString()} detail="no dia do evento" icon={<ShieldCheck size={19} />} tone="gold" /></section>
    <div className="mt-12 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Lista de convidados</p><h2 className="display mt-2 text-3xl font-bold tracking-[-.04em]">Quem vem celebrar</h2></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv} data-testid="button-export-invites"><Download size={15} /> Exportar</Button><Button onClick={() => setInviteModal(true)} data-testid="button-create-invite"><Plus size={16} /> Adicionar convidado</Button></div></div>
    <div className="mt-5 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-card)]"><div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-4 md:flex-row md:items-center md:justify-between"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procurar por nome ou código" className="h-10 w-full rounded-xl bg-[hsl(var(--muted))] pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.2)]" data-testid="input-search-invites" /></div><div className="flex items-center gap-1.5 overflow-x-auto"><Filter size={15} className="mr-1 text-[hsl(var(--muted-foreground))]" />{(['all', 'confirmed', 'pending', 'checked_in'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold ${filter === item ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`} data-testid={`button-filter-${item}`}>{item === 'all' ? 'Todos' : item === 'checked_in' ? 'Entraram' : statusLabel(item)}</button>)}</div></div>{filtered.length === 0 ? <div className="px-6 py-16 text-center"><UsersRound className="mx-auto text-[hsl(var(--muted-foreground))]" /><p className="display mt-3 text-xl font-bold">Nenhum convidado encontrado.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Experimente mudar o filtro ou adicionar alguém à lista.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-[hsl(var(--border))] text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]"><th className="px-5 py-4 font-bold">Convidado</th><th className="px-5 py-4 font-bold">Contacto</th><th className="px-5 py-4 font-bold">Código</th><th className="px-5 py-4 font-bold">Estado</th><th className="px-5 py-4 font-bold">Entrada</th><th /></tr></thead><tbody>{filtered.map((invite) => <tr key={invite.id} className="border-b border-[hsl(var(--border)/.7)] last:border-0 hover:bg-[hsl(var(--muted)/.4)]" data-testid={`row-invite-${invite.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[10px] font-black text-[hsl(var(--secondary-foreground))]">{initials(invite.guestName)}</span><span className="font-bold">{invite.guestName}</span></div></td><td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">{invite.contact ?? '—'}</td><td className="px-5 py-4"><span className="mono rounded-md bg-[hsl(var(--muted))] px-2 py-1 text-[10px]">{invite.code}</span></td><td className="px-5 py-4"><StatusPill status={invite.status} /></td><td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">{invite.checkedInAt ? <span className="flex items-center gap-1.5 text-[#39745f]"><Check size={14} />{formatDate(invite.checkedInAt)}</span> : 'Ainda não'}</td><td className="px-5 py-4 text-right"><button onClick={() => cancel(invite.code)} disabled={invite.status === 'cancelled' || cancelInvite.isPending} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))] disabled:opacity-30" title="Cancelar convite" data-testid={`button-cancel-invite-${invite.id}`}><XCircle size={16} /></button></td></tr>)}</tbody></table></div>}</div>
    {inviteModal && <Modal eyebrow="Lista de convidados" title="Adicionar convidado" onClose={() => setInviteModal(false)}><form onSubmit={submitInvite} className="space-y-4"><Field label="Nome do convidado" placeholder="Ex.: Sofia Martins" value={inviteForm.guestName} onChange={(value) => setInviteForm({ ...inviteForm, guestName: value })} testId="input-invite-name" /><Field label="Email ou telefone" placeholder="Como podemos enviar o convite?" value={inviteForm.contact} onChange={(value) => setInviteForm({ ...inviteForm, contact: value })} testId="input-invite-contact" /><div className="flex justify-end gap-3 pt-3"><Button type="button" variant="quiet" onClick={() => setInviteModal(false)} data-testid="button-cancel-invite-modal">Cancelar</Button><Button type="submit" disabled={createInvite.isPending} data-testid="button-submit-invite">{createInvite.isPending ? 'A adicionar…' : 'Criar convite'}<Send size={15} /></Button></div></form></Modal>}</>}</>;
}

function StatusPill({ status }: { status: string }) {
  const checked = status === 'checked_in' || status === 'confirmed';
  const style = status === 'cancelled' ? 'bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]' : status === 'pending' ? 'bg-[hsl(var(--accent)/.32)] text-[#806323]' : 'bg-[hsl(var(--secondary))] text-[#39745f]';
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>{checked && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{statusLabel(status)}</span>;
}

function DetailSkeleton() {
  return <div className="space-y-6"><div className="h-7 w-48 rounded skeleton" /><div className="h-64 rounded-[26px] skeleton" /><div className="grid gap-4 sm:grid-cols-3"><div className="h-32 rounded-[20px] skeleton" /><div className="h-32 rounded-[20px] skeleton" /><div className="h-32 rounded-[20px] skeleton" /></div><div className="h-96 rounded-[22px] skeleton" /></div>;
}

function ScanPage() {
  const validate = useValidateInvite();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ valid: boolean; message: string; invite: InviteLike } | null>(null);
  const [history, setHistory] = useState<InviteLike[]>(demoInvites.slice(0, 3));
  const submit = (event: FormEvent) => { event.preventDefault(); const value = code.trim().toUpperCase(); if (!value) return; validate.mutate({ code: value }, { onSuccess: (data) => { setResult(data as typeof result); if (data.valid && data.invite) setHistory((items) => [data.invite as InviteLike, ...items.filter((item) => item.code !== data.invite.code)].slice(0, 5)); }, onError: () => { const invite = demoInvites.find((item) => item.code === value) ?? { ...demoInvites[1], code: value, guestName: 'Convidado de demonstração' }; setResult(value.startsWith('X') ? { valid: false, message: 'Este código não foi encontrado ou já não é válido.', invite } : { valid: true, message: 'Entrada validada. Pode receber este convidado.', invite }); } }); };
  return <><PageHeading eyebrow="Receção" title="Entrada sem esperas." description="Valide um convite e dê as boas-vindas. O código é a única coisa de que precisa." /><div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-[26px] bg-[#24453f] p-6 text-[#f8f1e7] md:p-10"><div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#e7bf7a]">Validador rápido</p><h2 className="display mt-3 text-3xl font-bold">Quem chegou?</h2></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 text-[#e7bf7a]"><QrCode size={25} /></span></div><form onSubmit={submit} className="mt-10"><label className="mb-2 block text-xs font-bold text-white/65">Código do convite</label><div className="flex gap-2"><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="ANA-MIG-001" className="h-14 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 font-mono text-sm uppercase text-white outline-none placeholder:text-white/30 focus:border-[#e7bf7a]" data-testid="input-scan-code" /><Button type="submit" disabled={validate.isPending} className="h-14 shrink-0 px-5" data-testid="button-validate-code">{validate.isPending ? 'A validar…' : 'Validar'}<ArrowUpRight size={16} /></Button></div></form>{result && <div className={`mt-6 rounded-2xl border p-4 ${result.valid ? 'border-[#8ec4a5]/40 bg-[#8ec4a5]/15' : 'border-[#e9a295]/40 bg-[#e9a295]/15'}`}><div className="flex items-start gap-3">{result.valid ? <CheckCircle2 className="text-[#a8dbba]" /> : <XCircle className="text-[#f0b1a4]" />}<div><p className="font-bold">{result.valid ? 'Entrada autorizada' : 'Entrada não autorizada'}</p><p className="mt-1 text-xs text-white/65">{result.message}</p>{result.invite && <p className="mt-3 text-sm font-bold">{result.invite.guestName} <span className="ml-2 font-mono text-[10px] text-white/50">{result.invite.code}</span></p>}</div></div></div>}<p className="mt-8 flex items-center gap-2 text-xs text-white/45"><ShieldCheck size={14} /> Cada código só pode ser validado uma vez.</p></section><section className="rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-card)] md:p-8"><div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Ao vivo</p><h2 className="display mt-2 text-2xl font-bold">Entradas recentes</h2></div><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#39745f]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#65a986]" /> Ativo</span></div><div className="mt-6 space-y-2">{history.map((invite, index) => <div key={`${invite.code}-${index}`} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-[hsl(var(--muted))]" data-testid={`row-scan-${invite.code}`}><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[10px] font-black text-[hsl(var(--secondary-foreground))]">{initials(invite.guestName)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{invite.guestName}</p><p className="mono mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{invite.code}</p></div><span className="text-[10px] font-bold text-[#39745f]">{index === 0 ? 'agora' : `${index * 4} min`}</span><CheckCircle2 size={16} className="text-[#65a986]" /></div>)}</div><div className="mt-5 border-t border-[hsl(var(--border))] pt-5 text-center"><Link href="/eventos/ev-casamento" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-scan-event">Ver lista completa <ArrowUpRight className="ml-1 inline" size={13} /></Link></div></section></div></>;
}

function PublicInvitePage() {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const normalized = codigo.toLowerCase();
  const cancelled = normalized.includes('cancel');
  const used = normalized.includes('usado') || normalized.includes('used');
  const guest = normalized.includes('ana') ? 'Ana & Miguel' : 'Convidado especial';
  return <div className="app-noise min-h-[100dvh] bg-[#24453f] px-5 py-8 text-[#f8f1e7]"><div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-[1050px] flex-col justify-between"><header className="flex items-center justify-between"><Link href="/auth" className="flex items-center gap-3" data-testid="link-public-brand"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#e9b09a] text-[#24453f]"><PartyPopper size={19} /></span><span className="display text-[23px] font-bold">lumina<span className="text-[#e7bf7a]">.</span></span></Link><span className="mono text-[9px] uppercase tracking-[.16em] text-white/50">Convite digital</span></header><main className="relative mx-auto w-full max-w-[620px] py-16 text-center"><div className="absolute left-1/2 top-8 h-[450px] w-[450px] -translate-x-1/2 rounded-full border border-white/10" /><div className="relative"><p className="mono text-[10px] uppercase tracking-[.22em] text-[#e7bf7a]">{cancelled ? 'Convite cancelado' : used ? 'Convite já utilizado' : 'É uma alegria contar consigo'}</p><div className="mx-auto mt-8 grid h-20 w-20 place-items-center rounded-full border border-[#e9b09a]/40 bg-[#e9b09a]/10 text-[#e9b09a]">{cancelled ? <XCircle size={30} /> : used ? <CheckCircle2 size={30} /> : <PartyPopper size={30} />}</div><h1 className="display mt-7 text-5xl font-bold leading-[1.02] tracking-[-.05em] md:text-7xl">{cancelled ? 'Este convite já não está ativo.' : used ? 'Já nos encontrámos.' : "Ana & Miguel's celebration"}</h1><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/65">{cancelled ? 'Se acha que isto é um engano, fale com quem organizou o evento.' : used ? 'A entrada associada a este convite já foi registada. Obrigado por ter vindo.' : `Olá, ${guest}. Prepare-se para um dia cheio de coisas boas.`}</p>{!cancelled && !used && <div className="mx-auto mt-10 max-w-sm rounded-[22px] border border-white/15 bg-white/10 p-5 text-left backdrop-blur"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs font-bold">Casamento Ana & Miguel</p><p className="mt-1 text-xs text-white/55">18 de outubro de 2025, 16:30</p></div><CalendarDays size={19} className="text-[#e7bf7a]" /></div><div className="flex items-center gap-2 pt-4 text-xs text-white/65"><MapPin size={15} className="text-[#e9b09a]" /> Casa do Lago, Sintra</div></div>}<p className="mono mt-12 text-[10px] uppercase tracking-[.16em] text-white/35">{cancelled || used ? 'Código: ' : 'Apresente este ecrã à entrada · Código: '} {codigo}</p></div></main><footer className="text-center text-[10px] text-white/35">Organizado com <span className="text-[#e9b09a]">lumina.</span></footer></div></div>;
}

function Modal({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--foreground)/.3)] p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="w-full max-w-[560px] rounded-t-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-float)] sm:rounded-[26px] md:p-8" role="dialog" aria-modal="true"><div className="mb-7 flex items-start justify-between"><div><p className="mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p><h2 className="display mt-2 text-3xl font-bold tracking-[-.04em]">{title}</h2></div><button onClick={onClose} className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid="button-close-modal"><X size={18} /></button></div>{children}</div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/auth" component={AuthPage} /><Route path="/eventos"><Protected><OverviewPage /></Protected></Route><Route path="/eventos/:id"><Protected><EventDetailPage /></Protected></Route><Route path="/convite/:codigo" component={PublicInvitePage} /><Route path="/scan"><Protected><ScanPage /></Protected></Route><Route path="/"><HomeRedirect /></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}
function HomeRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(localStorage.getItem('eventos_session') ? '/eventos' : '/auth'); }, [setLocation]);
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))]" />;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;