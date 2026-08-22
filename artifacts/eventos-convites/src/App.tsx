import { useEffect, useRef, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  CheckCircle2,
  LayoutDashboard,
  MoreHorizontal,
  QrCode,
  Send,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface EventRecord {
  id: string;
  name: string;
  date: string;
  location: string;
  capacity: number;
  color: string;
}

interface GuestRecord {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  used: boolean;
}

const events = [
  {
    name: 'Jantar de Verão',
    date: '24 AGO',
    details: 'Sáb, 20:00 · Casa Amarela',
    guests: '48 convidados',
    color: 'bg-[#1554c7]',
  },
  {
    name: 'Aniversário da Marina',
    date: '31 AGO',
    details: 'Sáb, 16:30 · Espaço Orla',
    guests: '32 convidados',
    color: 'bg-[#0d9488]',
  },
  {
    name: 'Brunch de Primavera',
    date: '14 SET',
    details: 'Dom, 11:00 · Jardim Botânico',
    guests: '26 convidados',
    color: 'bg-[#2563eb]',
  },
];

const defaultEvents: EventRecord[] = events.map((event, index) => ({
  id: `event-${index + 1}`,
  name: event.name,
  date: event.date,
  location: event.details.split('· ')[1] ?? 'A definir',
  capacity: Number(event.guests.match(/\d+/)?.[0] ?? 0),
  color: event.color,
}));

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

function Home() {
  const [activeNav, setActiveNav] = useState('Visão geral');
  const [modalOpen, setModalOpen] = useState(false);
  const [installInfoOpen, setInstallInfoOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setInstallInfoOpen(true);
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="app-shell">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="desktop-only flex w-64 flex-col border-r border-slate-800 bg-[#0b1f3a] px-5 py-8 text-white">
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f80ed] text-white shadow-lg shadow-blue-950/30">
              <Ticket size={20} />
            </div>
            <span className="display text-2xl font-bold text-white">Lumina</span>
          </div>
          <nav className="space-y-2" aria-label="Navegação principal">
            {[
              ['Visão geral', LayoutDashboard],
              ['Meus eventos', CalendarDays],
              ['Convites', Send],
              ['Check-in', QrCode],
            ].map(([label, Icon]) => (
                <a
                  href={label === 'Visão geral' ? '/' : label === 'Meus eventos' ? '/events' : label === 'Convites' ? '/invites' : '/check-in'}
                key={label as string}
                onClick={() => setActiveNav(label as string)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeNav === label ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-950/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <Icon size={18} />
                {label as string}
                </a>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 text-white">
            <p className="mono text-xs uppercase tracking-wider text-blue-300">Lumina Pro</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Convites ilimitados para celebrar sem complicação.</p>
            <a href="/settings" className="mt-4 inline-block text-sm font-bold text-blue-300">Conhecer plano <ChevronRight className="inline" size={15} /></a>
          </div>
        </aside>

        <section id="overview" className="w-full px-5 py-7 pb-24 sm:px-10 lg:px-16 lg:py-12 lg:pb-12">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="mono text-xs uppercase tracking-[0.2em] text-[#2374e1]">Sábado, 22 de agosto</p>
              <h1 className="display mt-3 text-4xl font-bold tracking-tight text-[#0b2346] sm:text-5xl">Olá, Marina.</h1>
              <p className="mt-3 max-w-xl text-slate-500">Tudo pronto para os seus próximos momentos especiais?</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={installApp} className="hidden items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1769e0] shadow-sm transition hover:bg-blue-50 sm:flex">
                  <Ticket size={17} />
                  Baixar app
              </button>
              <button type="button" onClick={() => setModalOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1769e0] text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1258c0]" aria-label="Criar novo evento" title="Criar novo evento">
                <CirclePlus size={21} />
              </button>
            </div>
          </header>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ['Próximos eventos', '03', CalendarDays],
              ['Convites enviados', '106', Send],
              ['Confirmações', '82%', QrCode],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between text-slate-400"><span className="text-sm">{label as string}</span><Icon size={18} /></div>
                <p className="display mt-3 text-3xl font-bold text-[#0b2346]">{value as string}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between">
            <h2 className="display text-2xl font-bold text-[#0b2346]">Seus eventos</h2>
            <a href="/events" className="flex items-center gap-1 text-sm font-bold text-[#1769e0]">Ver todos <ChevronRight size={16} /></a>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {events.map((event) => (
              <article id="events" key={event.name} className="lift overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className={`${event.color} flex h-28 items-end justify-between p-5 text-[#fffdf9]`}>
                  <span className="mono text-sm font-medium tracking-wider">{event.date}</span>
                  <button type="button" aria-label={`Mais opções para ${event.name}`} title="Mais opções"><MoreHorizontal size={20} /></button>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#0b2346]">{event.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{event.details}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">{event.guests}</span>
                    <button type="button" className="font-bold text-[#1769e0]">Gerenciar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {[
          ['Início', LayoutDashboard],
          ['Eventos', CalendarDays],
          ['Convites', Send],
          ['Check-in', QrCode],
        ].map(([label, Icon]) => (
          <a key={label as string} href={label === 'Início' ? '/' : label === 'Eventos' ? '/events' : label === 'Convites' ? '/invites' : '/check-in'} onClick={() => setActiveNav(label as string)} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold ${activeNav === label || (activeNav === 'Visão geral' && label === 'Início') ? 'text-[#1769e0]' : 'text-slate-400'}`}>
            <Icon size={18} />
            {label as string}
          </a>
        ))}
      </nav>
      {modalOpen && <CreateEventModal onClose={() => setModalOpen(false)} />}
      {installInfoOpen && <InstallInfoModal onClose={() => setInstallInfoOpen(false)} />}
    </main>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState({ name: '', date: '', time: '', location: '', capacity: '50' });
  const updateForm = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const createEvent = (event: FormEvent) => {
    event.preventDefault();
    const savedEvents = readStorage<EventRecord[]>('lumina-events', defaultEvents);
    const newEvent: EventRecord = { id: crypto.randomUUID(), name: form.name, date: `${form.date} · ${form.time}`, location: form.location, capacity: Number(form.capacity), color: 'bg-[#2563eb]' };
    localStorage.setItem('lumina-events', JSON.stringify([...savedEvents, newEvent]));
    onCreated?.();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a35]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-[#2374e1]">Novo momento</p>
            <h2 id="create-event-title" className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b2346]">Criar evento</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button text-[#60708a]" aria-label="Fechar"><X size={19} /></button>
        </div>
        <form className="mt-7 space-y-4" onSubmit={createEvent}>
          <label className="field-label">Nome do evento<input value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="field-input" placeholder="Ex.: Festa de aniversário" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">Data<input value={form.date} onChange={(e) => updateForm('date', e.target.value)} className="field-input" type="date" required /></label>
            <label className="field-label">Horário<input value={form.time} onChange={(e) => updateForm('time', e.target.value)} className="field-input" type="time" required /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Local<input value={form.location} onChange={(e) => updateForm('location', e.target.value)} className="field-input" placeholder="Onde vai acontecer?" required /></label><label className="field-label">Limite de convidados<input value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} className="field-input" type="number" min="1" required /></label></div>
          <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={onClose} className="secondary-button">Cancelar</button><button type="submit" className="primary-button">Criar evento</button></div>
        </form>
      </div>
    </div>
  );
}

function InstallInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#1769e0]">Lumina no seu dispositivo</p>
            <h2 id="install-title" className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b2346]">Baixe o app</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button text-slate-400" aria-label="Fechar"><X size={19} /></button>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">Abra o menu do seu navegador e escolha <strong>Adicionar à tela inicial</strong> ou <strong>Instalar Lumina</strong> para acessar seus eventos como um app.</p>
        <button type="button" onClick={onClose} className="primary-button mt-6 w-full">Entendi</button>
      </div>
    </div>
  );
}

const routeItems = [
  { href: '/', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/events', label: 'Meus eventos', icon: CalendarDays },
  { href: '/invites', label: 'Convites', icon: Send },
  { href: '/check-in', label: 'Check-in', icon: QrCode },
];

function WorkspacePage({ page }: { page: 'events' | 'invites' | 'check-in' | 'settings' }) {
  const [search, setSearch] = useState('');
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventVersion, setEventVersion] = useState(0);
  const pageContent = {
    events: { eyebrow: 'Planejamento', title: 'Meus eventos', description: 'Organize cada detalhe dos seus próximos momentos.', icon: CalendarDays },
    invites: { eyebrow: 'Relacionamento', title: 'Convites', description: 'Acompanhe envios e confirmações em um só lugar.', icon: Send },
    'check-in': { eyebrow: 'Recepção', title: 'Check-in', description: 'Valide convidados com rapidez na entrada do evento.', icon: QrCode },
    settings: { eyebrow: 'Workspace', title: 'Configurações', description: 'Personalize seu perfil e a experiência do Lumina.', icon: Ticket },
  }[page];
  const PageIcon = pageContent.icon;

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="desktop-only flex w-64 flex-col bg-[#0b1f3a] px-5 py-8 text-white">
          <a href="/" className="mb-16 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f80ed]"><Ticket size={20} /></span>
            <span className="display text-2xl font-bold">Lumina</span>
          </a>
          <nav className="space-y-2" aria-label="Navegação principal">
            {routeItems.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${href === `/${page}` ? 'bg-[#1d4ed8] text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon size={18} />{label}</a>
            ))}
          </nav>
        </aside>
        <section className="w-full px-5 py-7 pb-24 sm:px-10 lg:px-16 lg:py-12 lg:pb-12">
          <header className="border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3 text-[#1769e0]"><PageIcon size={20} /><span className="eyebrow">{pageContent.eyebrow}</span></div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b2346]">{pageContent.title}</h1>
            <p className="mt-3 text-slate-500">{pageContent.description}</p>
          </header>
          {page === 'events' && <EventsView refreshToken={eventVersion} onCreate={() => setCreateEventOpen(true)} />}
          {page === 'invites' && <InvitesView search={search} onSearch={setSearch} />}
          {page === 'check-in' && <CheckinView />}
          {page === 'settings' && <SettingsView />}
        </section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {routeItems.map(({ href, label, icon: Icon }) => <a key={href} href={href} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold ${href === `/${page}` ? 'text-[#1769e0]' : 'text-slate-400'}`}><Icon size={18} />{label === 'Visão geral' ? 'Início' : label.replace('Meus ', '')}</a>)}
      </nav>
      {createEventOpen && <CreateEventModal onCreated={() => setEventVersion((version) => version + 1)} onClose={() => setCreateEventOpen(false)} />}
    </main>
  );
}

function EventsView({ onCreate, refreshToken = 0 }: { onCreate: () => void; refreshToken?: number }) {
  const [storedEvents, setStoredEvents] = useState<EventRecord[]>(() => readStorage('lumina-events', defaultEvents));
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    setStoredEvents(readStorage('lumina-events', defaultEvents));
  }, [refreshToken]);

  const saveEvent = (event: EventRecord) => {
    const next = [...storedEvents, event];
    setStoredEvents(next);
    localStorage.setItem('lumina-events', JSON.stringify(next));
  };

  return <div className="mt-8"><div className="flex justify-end"><button type="button" onClick={onCreate} className="primary-button"><CirclePlus className="mr-2 inline" size={17} />Novo evento</button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{storedEvents.map((event) => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className={`flex h-12 w-12 items-center justify-center rounded-xl ${event.color} text-white`}><CalendarDays size={21} /></div><button type="button" aria-label={`Mais opções para ${event.name}`}><MoreHorizontal size={20} className="text-slate-400" /></button></div><h2 className="mt-5 font-bold text-[#0b2346]">{event.name}</h2><p className="mt-2 text-sm text-slate-500">{event.date} · {event.location}</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">Até {event.capacity} convidados</span><button type="button" onClick={() => setSelectedEvent(event)} className="font-bold text-[#1769e0]">Adicionar convidado</button></div></article>)}</div>{selectedEvent && <GuestModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}</div>;
}

function GuestModal({ event, onClose }: { event: EventRecord; onClose: () => void }) {
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [created, setCreated] = useState<GuestRecord | null>(null);
  const update = (field: keyof typeof guest, value: string) => setGuest((current) => ({ ...current, [field]: value }));
  const createGuest = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const nextGuest: GuestRecord = { ...guest, id: crypto.randomUUID(), eventId: event.id, code: `LUM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, used: false };
    const guests = readStorage<GuestRecord[]>('lumina-guests', []);
    localStorage.setItem('lumina-guests', JSON.stringify([...guests, nextGuest]));
    setCreated(nextGuest);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">{created ? <InviteCard guest={created} event={event} onClose={onClose} /> : <><div className="flex items-start justify-between"><div><p className="eyebrow text-[#1769e0]">{event.name}</p><h2 className="mt-2 text-2xl font-extrabold text-[#0b2346]">Novo convidado</h2></div><button type="button" onClick={onClose} className="icon-button text-slate-400" aria-label="Fechar"><X size={19} /></button></div><form onSubmit={createGuest} className="mt-7 space-y-4"><label className="field-label">Nome completo<input value={guest.name} onChange={(e) => update('name', e.target.value)} className="field-input" required /></label><label className="field-label">E-mail<input value={guest.email} onChange={(e) => update('email', e.target.value)} className="field-input" type="email" required /></label><label className="field-label">Telefone<input value={guest.phone} onChange={(e) => update('phone', e.target.value)} className="field-input" type="tel" required /></label><button type="submit" className="primary-button w-full">Gerar convite digital</button></form></>}</div></div>;
}

function InviteCard({ guest, event, onClose }: { guest: GuestRecord; event: EventRecord; onClose: () => void }) {
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(JSON.stringify({ code: guest.code, initials: guest.name.split(' ').map((part) => part[0]).join(''), location: event.location, event: event.name })).then(setQr); }, [guest, event]);
  return <div className="text-center"><div className="flex items-center justify-between text-left"><div><p className="eyebrow text-emerald-600">Convite gerado</p><h2 className="mt-2 text-2xl font-extrabold text-[#0b2346]">{guest.name}</h2></div><button type="button" onClick={onClose} className="icon-button text-slate-400" aria-label="Fechar"><X size={19} /></button></div>{qr && <img src={qr} alt={`QR Code do convite de ${guest.name}`} className="mx-auto mt-6 h-56 w-56 rounded-xl border border-slate-200 p-3" />}<p className="mt-4 text-sm text-slate-500">{event.name} · {event.location}</p><p className="mono mt-2 text-sm font-bold text-[#1769e0]">{guest.code}</p><button type="button" onClick={onClose} className="primary-button mt-6 w-full">Concluir</button></div>;
}

function InvitesView({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  const guests = readStorage<GuestRecord[]>('lumina-guests', []);
  const visibleGuests = guests.filter((guest) => guest.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="mt-8 max-w-3xl"><div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => onSearch(event.target.value)} className="field-input" placeholder="Buscar convidado" /><a href="/events" className="primary-button whitespace-nowrap text-center"><CirclePlus className="mr-2 inline" size={17} />Adicionar convidado</a></div><div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">{visibleGuests.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nenhum convite criado ainda. Acesse Meus eventos para adicionar um convidado.</p> : visibleGuests.map((guest) => <div key={guest.id} className="flex items-center justify-between gap-3 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{guest.name.split(' ').map((part) => part[0]).join('')}</span><div><span className="font-semibold text-[#0b2346]">{guest.name}</span><p className="text-xs text-slate-500">{guest.email} · {guest.code}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${guest.used ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{guest.used ? 'Utilizado' : 'Válido'}</span></div>)}</div></div>;
}

function CheckinView() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'duplicate' | 'invalid'>('idle');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const validate = (value = code) => {
    const guests = readStorage<GuestRecord[]>('lumina-guests', []);
    const guestIndex = guests.findIndex((guest) => guest.code.toLowerCase() === value.trim().toLowerCase());
    if (guestIndex < 0) return setStatus('invalid');
    if (guests[guestIndex].used) return setStatus('duplicate');
    guests[guestIndex].used = true;
    localStorage.setItem('lumina-guests', JSON.stringify(guests));
    setStatus('valid');
  };

  useEffect(() => {
    if (!cameraOpen || !videoRef.current) return;
    const scanner = new QrScanner(videoRef.current, (result) => {
      let scannedCode = result.data;
      try {
        const invitation = JSON.parse(result.data) as { code?: string };
        scannedCode = invitation.code ?? result.data;
      } catch {
        // Permite também códigos simples no QR Code.
      }
      setCode(scannedCode);
      setCameraOpen(false);
      scanner.stop();
      validate(scannedCode);
    }, {
      preferredCamera: 'environment',
      highlightScanRegion: true,
      highlightCodeOutline: true,
      onDecodeError: () => undefined,
    });
    scannerRef.current = scanner;
    scanner.start().catch(() => {
      setCameraError('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
      setCameraOpen(false);
    });
    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [cameraOpen]);

  const toggleCamera = () => {
    setCameraError('');
    setStatus('idle');
    setCameraOpen((open) => !open);
  };
  const feedback = { valid: 'Convite válido. Presença confirmada!', duplicate: 'Convite duplicado: este código já foi utilizado.', invalid: 'Convite não encontrado. Confira o código e tente novamente.' };
  return <div className="mt-8 grid max-w-3xl gap-6 md:grid-cols-[1fr_1.2fr]"><div className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0b1f3a] p-8 text-center text-white">{cameraOpen ? <><video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline /><div className="relative z-10 flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-blue-300 shadow-[0_0_0_999px_rgba(11,31,58,.45)]"><QrCode size={62} className="text-white/80" /></div><button type="button" onClick={toggleCamera} className="relative z-10 mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0b2346]">Fechar câmera</button></> : <><QrCode size={92} strokeWidth={1.2} className="text-blue-300" /><p className="mt-5 text-sm text-slate-300">Aponte a câmera para o QR Code do convite</p><button type="button" onClick={toggleCamera} className="primary-button mt-5 bg-[#2f80ed]">Abrir câmera</button></>}{cameraError && <p className="relative z-10 mt-4 text-xs text-red-200">{cameraError}</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="eyebrow text-[#1769e0]">Entrada manual</p><h2 className="mt-2 text-xl font-bold text-[#0b2346]">Validar convidado</h2><input value={code} onChange={(event) => { setCode(event.target.value); setStatus('idle'); }} className="field-input mt-6" placeholder="Código do convite" /><button type="button" onClick={() => validate()} className="primary-button mt-4 w-full">Validar código</button>{status !== 'idle' && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${status === 'valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{status === 'valid' && <CheckCircle2 className="mr-2 inline" size={17} />}{feedback[status]}</p>}</div></div>;
}

function SettingsView() { return <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">MS</div><div><h2 className="font-bold text-[#0b2346]">Marina Silva</h2><p className="text-sm text-slate-500">Plano Lumina Pro</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="field-label">Nome<input className="field-input" defaultValue="Marina Silva" /></label><label className="field-label">E-mail<input className="field-input" defaultValue="marina@email.com" type="email" /></label></div><button type="button" className="primary-button mt-6">Salvar alterações</button></div>; }

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return <Home />;
  if (path === '/events') return <WorkspacePage page="events" />;
  if (path === '/invites') return <WorkspacePage page="invites" />;
  if (path === '/check-in') return <WorkspacePage page="check-in" />;
  if (path === '/settings') return <WorkspacePage page="settings" />;
  return <NotFound />;
}
