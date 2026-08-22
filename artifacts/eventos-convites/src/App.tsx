import { useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  MoreHorizontal,
  QrCode,
  Send,
  Ticket,
  X,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

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

function Home() {
  const [activeNav, setActiveNav] = useState('Visão geral');
  const [modalOpen, setModalOpen] = useState(false);

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
              <button
                key={label as string}
                type="button"
                onClick={() => setActiveNav(label as string)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeNav === label ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-950/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} />
                {label as string}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 text-white">
            <p className="mono text-xs uppercase tracking-wider text-blue-300">Lumina Pro</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Convites ilimitados para celebrar sem complicação.</p>
            <button type="button" className="mt-4 text-sm font-bold text-blue-300">Conhecer plano <ChevronRight className="inline" size={15} /></button>
          </div>
        </aside>

        <section className="w-full px-5 py-7 pb-24 sm:px-10 lg:px-16 lg:py-12 lg:pb-12">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="mono text-xs uppercase tracking-[0.2em] text-[#2374e1]">Sábado, 22 de agosto</p>
              <h1 className="display mt-3 text-4xl font-bold tracking-tight text-[#0b2346] sm:text-5xl">Olá, Marina.</h1>
              <p className="mt-3 max-w-xl text-slate-500">Tudo pronto para os seus próximos momentos especiais?</p>
            </div>
            <button type="button" onClick={() => setModalOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1769e0] text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1258c0]" aria-label="Criar novo evento" title="Criar novo evento">
              <CirclePlus size={21} />
            </button>
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
            <button type="button" className="flex items-center gap-1 text-sm font-bold text-[#1769e0]">Ver todos <ChevronRight size={16} /></button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {events.map((event) => (
              <article key={event.name} className="lift overflow-hidden rounded-2xl border border-[#e5dcd0] bg-[#fffdf9] shadow-[0_10px_30px_-22px_rgba(36,69,63,.4)]">
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
          <button key={label as string} type="button" onClick={() => setActiveNav(label as string)} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold ${activeNav === label || (activeNav === 'Visão geral' && label === 'Início') ? 'text-[#1769e0]' : 'text-slate-400'}`}>
            <Icon size={18} />
            {label as string}
          </button>
        ))}
      </nav>
      {modalOpen && <CreateEventModal onClose={() => setModalOpen(false)} />}
    </main>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
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
        <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); onClose(); }}>
          <label className="field-label">Nome do evento<input className="field-input" placeholder="Ex.: Festa de aniversário" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">Data<input className="field-input" type="date" required /></label>
            <label className="field-label">Horário<input className="field-input" type="time" required /></label>
          </div>
          <label className="field-label">Local<input className="field-input" placeholder="Onde vai acontecer?" /></label>
          <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={onClose} className="secondary-button">Cancelar</button><button type="submit" className="primary-button">Criar evento</button></div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return window.location.pathname === '/' ? <Home /> : <NotFound />;
}
