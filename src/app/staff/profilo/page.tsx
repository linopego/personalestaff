"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

interface MeData {
  id: number; nome: string; cognome: string; email: string;
  telefono: string | null; tipoContratto: string; oreSettimanali: number;
  dataAssunzione: string | null; attivo: boolean; avatarUrl: string | null;
  riepilogo: { oreSett: number; oreMese: number; giorniMese: number };
}

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

function contrattoLabel(c: string) { return c === "Fisso" ? "Dipendente Fisso" : c; }
function contrattoStyle(c: string) { return c === "Fisso" ? "bg-green-500/15 text-green-400" : c === "Part-time" ? "bg-amber-500/15 text-amber-400" : "bg-orange-500/15 text-orange-400"; }
function avatarColor(name: string) { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); const colors = ["from-blue-600 to-blue-400","from-emerald-600 to-emerald-400","from-amber-600 to-amber-400","from-purple-600 to-purple-400","from-rose-600 to-rose-400"]; return colors[Math.abs(h) % colors.length]; }
function formatDataIta(iso: string) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MESI[m - 1]} ${y}`; }
function fmtOreMin(ore: number) { const h = Math.floor(ore); const m = Math.round((ore - h) * 60); return m > 0 ? `${h}h ${m}m` : `${h}h`; }

export default function ProfiloPage() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [meData, setMeData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => { if (!r.ok) throw new Error("" + r.status); return r.json(); })
      .then(d => { if (d.error) throw new Error(d.error); setMeData(d); })
      .catch(e => setError(String(e.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  if (!meData) return <div className="p-4"><p className="text-text-muted">Impossibile caricare il profilo.</p>{error && <p className="text-xs text-red-400 mt-2">{error}</p>}</div>;

  const fullName = meData.nome + " " + meData.cognome;
  const initials = meData.nome[0] + meData.cognome[0];

  return (
    <div className="flex flex-col gap-5 -mx-4 -mt-3 sm:-mx-6 sm:-mt-6">
      <div className="relative bg-gradient-to-b from-sidebar-bg via-accent/20 to-transparent px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {meData.avatarUrl ? (
            <img src={meData.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover shadow-lg" />
          ) : (
            <div className={"flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br " + avatarColor(fullName) + " text-2xl font-bold text-white shadow-lg"}>{initials}</div>
          )}
          <h1 className="mt-3 text-xl font-bold text-foreground">{fullName}</h1>
          <span className={"mt-2 rounded-full px-3 py-1 text-xs font-semibold " + contrattoStyle(meData.tipoContratto)}>{contrattoLabel(meData.tipoContratto)}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 flex flex-col gap-5">
        <Section title="Dati Personali">
          <Row label="Email" value={meData.email} />
          <Row label="Telefono" value={meData.telefono || "\u2014"} />
          <Row label="Data assunzione" value={meData.dataAssunzione ? formatDataIta(meData.dataAssunzione) : "\u2014"} />
          <Row label="Ore settimanali" value={meData.oreSettimanali + "h"} last />
        </Section>

        <Section title="Riepilogo">
          <div className="grid grid-cols-3 gap-3 py-2 px-2">
            <Stat label="Ore settimana" value={fmtOreMin(meData.riepilogo.oreSett)} />
            <Stat label="Ore mese" value={fmtOreMin(meData.riepilogo.oreMese)} />
            <Stat label="Giorni mese" value={String(meData.riepilogo.giorniMese)} />
          </div>
        </Section>

        <Section title="Impostazioni">
          <div className="flex items-center justify-between px-4 py-3.5 min-h-[48px] border-b border-border">
            <span className="text-sm text-foreground">{theme === "dark" ? "Tema scuro" : "Tema chiaro"}</span>
            <button onClick={toggleTheme} className={"relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors " + (theme === "dark" ? "bg-accent" : "bg-zinc-600")}>
              <span className={"pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform " + (theme === "dark" ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
          <button onClick={() => alert("Funzione in arrivo.")} className="flex w-full items-center justify-between px-4 py-3.5 min-h-[48px] text-left">
            <span className="text-sm text-foreground">Lingua</span>
            <span className="text-sm text-text-muted">Italiano</span>
          </button>
        </Section>

        <button onClick={() => setShowLogout(true)} className="w-full rounded-2xl bg-red-600 py-4 text-base font-semibold text-white min-h-[56px] active:bg-red-700 active:scale-[0.98] transition-all">
          Esci dall&apos;Account
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowLogout(false)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="h-1 w-10 rounded-full bg-border" /></div>
            <div className="px-6 py-5 space-y-4 text-center">
              <h2 className="text-lg font-bold text-foreground">Sei sicuro di voler uscire?</h2>
              <div className="flex gap-3">
                <button onClick={() => setShowLogout(false)} className="flex-1 rounded-xl border border-border py-4 text-base font-semibold text-text-muted min-h-[56px]">Annulla</button>
                <button onClick={logout} className="flex-1 rounded-xl bg-red-600 py-4 text-base font-semibold text-white min-h-[56px]">Esci</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1">{title}</p><div className="rounded-2xl border border-border bg-card-bg overflow-hidden">{children}</div></div>);
}
function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (<div className={"flex items-center justify-between px-4 py-3.5 min-h-[48px] " + (last ? "" : "border-b border-border")}><span className="text-sm text-text-muted">{label}</span><span className="text-sm font-semibold text-foreground">{value}</span></div>);
}
function Stat({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-xl bg-sidebar-bg p-3 text-center"><p className="text-xl font-bold text-accent tabular-nums">{value}</p><p className="text-[11px] text-text-muted mt-0.5">{label}</p></div>);
}
