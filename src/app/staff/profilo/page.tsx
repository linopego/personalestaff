"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const DIPENDENTE = {
  nome: "Laura",
  cognome: "Rossi",
  email: "l.rossi@presenzestaff.it",
  telefono: "347 2345678",
  contratto: "Fisso" as const,
  oreSettimanali: 40,
  sede: "La Casa dei Gelsi",
  dataAssunzione: "2020-06-01",
  attivo: true,
  oreSett: 32.5,
  oreMese: 128.5,
  giorniMese: 16,
};

const OGGI = new Date(2026, 3, 1); // 1 Apr 2026

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function contrattoLabel(c: string) {
  switch (c) {
    case "Fisso": return "Dipendente Fisso";
    case "Part-time": return "Part-time";
    case "A chiamata": return "A Chiamata";
    default: return c;
  }
}

function contrattoStyle(c: string) {
  switch (c) {
    case "Fisso": return "bg-green-500/15 text-green-400";
    case "Part-time": return "bg-amber-500/15 text-amber-400";
    case "A chiamata": return "bg-orange-500/15 text-orange-400";
    default: return "bg-zinc-500/15 text-zinc-400";
  }
}

function formatDataIta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESI[m - 1]} ${y}`;
}

function calcolaAnzianita(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  let anni = OGGI.getFullYear() - start.getFullYear();
  let mesi = OGGI.getMonth() - start.getMonth();
  if (mesi < 0) { anni--; mesi += 12; }
  if (anni > 0 && mesi > 0) return `${anni} anni e ${mesi} mesi`;
  if (anni > 0) return `${anni} ann${anni === 1 ? "o" : "i"}`;
  return `${mesi} mes${mesi === 1 ? "e" : "i"}`;
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "from-blue-600 to-blue-400",
    "from-emerald-600 to-emerald-400",
    "from-amber-600 to-amber-400",
    "from-purple-600 to-purple-400",
    "from-rose-600 to-rose-400",
    "from-cyan-600 to-cyan-400",
    "from-indigo-600 to-indigo-400",
    "from-orange-600 to-orange-400",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function fmtOreMin(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function ProfiloPage() {
  const { logout } = useAuth();
  const d = DIPENDENTE;
  const fullName = `${d.nome} ${d.cognome}`;
  const initials = `${d.nome[0]}${d.cognome[0]}`;

  const [notifiche, setNotifiche] = useState(true);
  const [temaScuro, setTemaScuro] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  function handleLogout() {
    setShowLogoutModal(false);
    logout();
  }

  return (
    <div className="flex flex-col gap-5 -mx-4 sm:-mx-6">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-b from-accent/20 to-transparent px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(fullName)} text-2xl font-bold text-white shadow-lg`}>
            {initials}
          </div>
          <h1 className="mt-3 text-xl font-bold text-foreground">{fullName}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contrattoStyle(d.contratto)}`}>
              {contrattoLabel(d.contratto)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            <span>{d.sede}</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 flex flex-col gap-5">
        {/* ── Dati Personali ── */}
        <Section title="Dati Personali">
          <InfoItem label="Email aziendale" value={d.email} />
          <InfoItem label="Telefono" value={d.telefono} />
          <InfoItem label="Data di assunzione" value={formatDataIta(d.dataAssunzione)} />
          <InfoItem label="Anzianità aziendale" value={calcolaAnzianita(d.dataAssunzione)} last />
        </Section>

        {/* ── Contratto ── */}
        <Section title="Contratto">
          <InfoItem label="Tipo contratto" value={contrattoLabel(d.contratto)} />
          <InfoItem label="Ore settimanali" value={`${d.oreSettimanali}h`} />
          <InfoItem label="Sede assegnata" value={d.sede} />
          <InfoItem label="Stato" last>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.attivo ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${d.attivo ? "bg-green-400" : "bg-zinc-500"}`} />
              {d.attivo ? "Attivo" : "Non attivo"}
            </span>
          </InfoItem>
        </Section>

        {/* ── Riepilogo Rapido ── */}
        <Section title="Riepilogo Rapido">
          <div className="grid grid-cols-3 gap-3 py-1">
            <QuickStat label="Ore settimana" value={fmtOreMin(d.oreSett)} />
            <QuickStat label="Ore mese" value={fmtOreMin(d.oreMese)} />
            <QuickStat label="Giorni mese" value={String(d.giorniMese)} />
          </div>
        </Section>

        {/* ── Impostazioni App ── */}
        <Section title="Impostazioni App">
          <ToggleItem label="Notifiche push" value={notifiche} onChange={setNotifiche} />
          <ToggleItem label="Tema scuro" value={temaScuro} onChange={setTemaScuro} />
          <TappableItem label="Lingua" value="Italiano" onTap={() => alert("Funzione in arrivo.")} />
          <TappableItem label="Informazioni App" value={`v1.0.0`} onTap={() => setShowInfoModal(true)} last />
        </Section>

        {/* ── Logout ── */}
        <div className="pt-2 pb-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full rounded-2xl bg-red-600 py-4 text-base font-semibold text-white min-h-[56px] active:bg-red-700 active:scale-[0.98] transition-all"
          >
            Esci dall&apos;Account
          </button>
        </div>
      </div>

      {/* ═══ MODALE LOGOUT ═══ */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowLogoutModal(false)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
                  <LogoutIcon className="h-7 w-7 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Sei sicuro di voler uscire?</h2>
                <p className="mt-1 text-sm text-text-muted">Dovrai effettuare nuovamente l&apos;accesso.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-xl border border-border py-4 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]"
                >
                  Annulla
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-red-600 py-4 text-base font-semibold text-white active:bg-red-700 active:scale-[0.97] transition-all min-h-[56px]"
                >
                  Esci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALE INFO APP ═══ */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowInfoModal(false)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-accent mb-3">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground">Presenze Staff</h2>
                <p className="text-sm text-text-muted mt-1">Versione 1.0.0</p>
                <p className="text-xs text-text-muted mt-3 leading-relaxed">
                  App per il monitoraggio presenze del personale con geolocalizzazione.
                </p>
                <p className="text-xs text-text-muted mt-2">
                  Sviluppato per La Casa dei Gelsi, Tenuta Villa Peggy&apos;s e Studios Club / TooLate.
                </p>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full rounded-xl border border-border py-4 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1">{title}</p>
      <div className="rounded-2xl border border-border bg-card-bg overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value, last, children }: { label: string; value?: string; last?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] ${last ? "" : "border-b border-border"}`}>
      <span className="text-sm text-text-muted">{label}</span>
      {children ?? <span className="text-sm font-semibold text-foreground text-right">{value}</span>}
    </div>
  );
}

function ToggleItem({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] ${last ? "" : "border-b border-border"}`}>
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors ${value ? "bg-accent" : "bg-zinc-600"}`}
      >
        <span className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function TappableItem({ label, value, onTap, last }: { label: string; value: string; onTap: () => void; last?: boolean }) {
  return (
    <button
      onClick={onTap}
      className={`flex w-full items-center justify-between px-4 py-3.5 min-h-[48px] active:bg-white/[0.03] transition-colors text-left ${last ? "" : "border-b border-border"}`}
    >
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">{value}</span>
        <ChevronRightIcon className="h-4 w-4 text-text-muted" />
      </div>
    </button>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sidebar-bg p-3 text-center">
      <p className="text-xl font-bold text-accent tabular-nums">{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
