"use client";

import { useState, useEffect, useMemo } from "react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_CORTI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; stato: string; assegnati: number; }

function isoD(d: Date) { return d.toISOString().slice(0, 10); }
function getMonday(d: Date) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }
function dayOfWeek(iso: string) { return new Date(iso + "T00:00:00").getDay(); }
function fmtGiorno(iso: string) { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${MESI[d.getMonth()].slice(0,3)}`; }

export default function StaffEventiPage() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => { const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m; }, [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);

  useEffect(() => {
    setLoading(true);
    const dataInizio = isoD(monday);
    const dataFine = isoD(sunday);
    // Usa l'API admin (che restituisce tutti gli eventi) ma dallo staff
    // Per ora usiamo /api/eventi/miei che restituisce tutti (adatteremo)
    fetch(`/api/eventi/tutti?dataInizio=${dataInizio}&dataFine=${dataFine}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEventi(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monday, sunday]);

  const oggi = isoD(new Date());
  const fmtPeriod = `${fmtGiorno(isoD(monday))} — ${fmtGiorno(isoD(sunday))} ${sunday.getFullYear()}`;

  // Raggruppa per giorno
  const giorniSettimana = useMemo(() => {
    const result: { data: string; label: string; isOggi: boolean; eventi: Evento[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(d.getDate() + i);
      const iso = isoD(d);
      result.push({
        data: iso,
        label: `${GIORNI_CORTI[i]} ${d.getDate()} ${MESI[d.getMonth()].slice(0,3)}`,
        isOggi: iso === oggi,
        eventi: eventi.filter(e => e.data === iso),
      });
    }
    return result;
  }, [monday, eventi, oggi]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">Eventi</h1>

      {/* Week nav */}
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button onClick={() => setWeekOffset(v => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">{fmtPeriod}</span>
        <button onClick={() => setWeekOffset(v => v + 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {giorniSettimana.map(g => (
            <div key={g.data} className={`rounded-xl border p-3 ${g.isOggi ? "border-accent/40 bg-accent/[0.03]" : "border-border bg-card-bg"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <p className={`text-sm font-semibold ${g.isOggi ? "text-accent" : "text-foreground"}`}>{g.label}</p>
                {g.isOggi && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">OGGI</span>}
              </div>
              {g.eventi.length === 0 ? (
                <p className="text-xs text-text-muted">Nessun evento</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {g.eventi.map(e => (
                    <div key={e.id} className={`rounded-lg px-2.5 py-1.5 text-xs ${e.stato === "confermato" ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                      <p className="font-semibold text-foreground">{e.nome}</p>
                      <p className="text-text-muted">{e.sede} {e.oraInizio && `· ${e.oraInizio}`} · {e.assegnati}p</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
}
