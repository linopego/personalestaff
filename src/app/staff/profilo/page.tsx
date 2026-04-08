"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface MeData {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  ruolo: string;
  tipoContratto: string;
  oreSettimanali: number;
  dataAssunzione: string | null;
  attivo: boolean;
  avatarUrl: string | null;
  riepilogo: {
    oreSett: number;
    oreMese: number;
    giorniMese: number;
  };
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const OGGI = new Date();

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

  const [meData, setMeData] = useState<MeData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [notifiche, setNotifiche] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMeData(data))
      .finally(() => setLoadingMe(false));
  }, []);

  function handleLogout() {
    setShowLogoutModal(false);
    logout();
  }

  if (loadingMe) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <SpinnerIcon className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-text-muted">Caricamento profilo…</p>
      </div>
    );
  }

  if (!meData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-text-muted">Impossibile caricare il profilo.</p>
      </div>
    );
  }

  const fullName = `${meData.nome} ${meData.cognome}`;
  const initials = `${meData.nome[0]}${meData.cognome[0]}`;
  const [uploading, setUploading] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200000) { alert("Immagine troppo grande (max 200KB). Riduci le dimensioni."); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Ridimensiona con canvas
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);

        const res = await fetch("/api/profilo", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: compressed }),
        });
        if (res.ok) window.location.reload();
        else alert("Errore nel caricamento");
        setUploading(false);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  }

  async function removePhoto() {
    await fetch("/api/profilo", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-5 -mx-4 -mt-3 sm:-mx-6 sm:-mt-6">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-b from-sidebar-bg via-accent/20 to-transparent px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {meData.avatarUrl ? (
              <img src={meData.avatarUrl} alt={fullName} className="h-20 w-20 rounded-full object-cover shadow-lg" />
            ) : (
              <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(fullName)} text-2xl font-bold text-white shadow-lg`}>
                {initials}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-90 transition-all">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              {uploading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
              )}
            </label>
            {meData.avatarUrl && (
              <button onClick={removePhoto} className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[8px] shadow">✕</button>
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold text-foreground">{fullName}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contrattoStyle(meData.tipoContratto)}`}>
              {contrattoLabel(meData.tipoContratto)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 flex flex-col gap-5">
        {/* ── Dati Personali ── */}
        <Section title="Dati Personali">
          <InfoItem label="Email aziendale" value={meData.email} />
          <InfoItem label="Telefono" value={meData.telefono ?? "—"} />
          {meData.dataAssunzione && (
            <InfoItem label="Data di assunzione" value={formatDataIta(meData.dataAssunzione)} />
          )}
          {meData.dataAssunzione && (
            <InfoItem label="Anzianità aziendale" value={calcolaAnzianita(meData.dataAssunzione)} last />
          )}
          {!meData.dataAssunzione && (
            <InfoItem label="Data di assunzione" value="—" last />
          )}
        </Section>

        {/* ── Contratto ── */}
        <Section title="Contratto">
          <InfoItem label="Tipo contratto" value={contrattoLabel(meData.tipoContratto)} />
          <InfoItem label="Ore settimanali" value={`${meData.oreSettimanali}h`} />
          <InfoItem label="Stato" last>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meData.attivo ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meData.attivo ? "bg-green-400" : "bg-zinc-500"}`} />
              {meData.attivo ? "Attivo" : "Non attivo"}
            </span>
          </InfoItem>
        </Section>

        {/* ── Riepilogo Rapido ── */}
        <Section title="Riepilogo Rapido">
          <div className="grid grid-cols-3 gap-3 py-1">
            <QuickStat label="Ore settimana" value={fmtOreMin(meData.riepilogo.oreSett)} />
            <QuickStat label="Ore mese" value={fmtOreMin(meData.riepilogo.oreMese)} />
            <QuickStat label="Giorni mese" value={String(meData.riepilogo.giorniMese)} />
          </div>
        </Section>

        {/* ── Impostazioni App ── */}
        <Section title="Impostazioni App">
          <ToggleItem label="Notifiche push" value={notifiche} onChange={setNotifiche} />
          <ToggleItem label={theme === "dark" ? "Tema scuro" : "Tema chiaro"} value={theme === "dark"} onChange={toggleTheme} />
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
                <div className="flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden mb-3">
                  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14">
                    <rect width="52" height="52" rx="14" fill="#0C1445"/>
                    <circle cx="26" cy="26" r="15" stroke="#1E40AF" strokeWidth="1" strokeDasharray="2.5 2.5"/>
                    <circle cx="26" cy="26" r="10" stroke="#2563EB" strokeWidth="1.5"/>
                    <circle cx="26" cy="26" r="5.5" stroke="#3B82F6" strokeWidth="1.5"/>
                    <circle cx="26" cy="26" r="2.5" fill="#60A5FA"/>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground">Creazioni SRL</h2>
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
