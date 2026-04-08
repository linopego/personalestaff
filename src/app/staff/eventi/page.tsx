"use client";

import { useState, useEffect, useMemo } from "react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_CORTI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; assegnati: number; }

const SEDE_BG: Record<string, string> = {
  "La Casa dei Gelsi": "bg-amber-500/10 border-amber-500/25",
  "Tenuta Villa Peggy's": "bg-emerald-500/10 border-emerald-500/25",
  "Studios Club / TooLate": "bg-blue-500/10 border-blue-500/25",
};
const SEDE_TEXT: Record<string, string> = {
  "La Casa dei Gelsi": "text-amber-400",
  "Tenuta Villa Peggy's": "text-emerald-400",
  "Studios Club / TooLate": "text-blue-400",
};
function sedeStyle(sede: string) { return SEDE_BG[sede] || "bg-zinc-500/10 border-zinc-500/25"; }
function sedeTextColor(sede: string) { return SEDE_TEXT[sede] || "text-zinc-400"; }

function isoD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function getMonday(d: Date) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }
function dayOfWeek(iso: string) { return new Date(iso + "T00:00:00").getDay(); }
function fmtGiorno(iso: string) { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${MESI[d.getMonth()].slice(0,3)}`; }

interface Personale { nome: string; cognome: string; mansione: string|null; postazione: string|null; orarioInizio: string|null; orarioFine: string|null; }
interface EventoDettaglio { nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; descrizione: string|null; personale: Personale[]; }

export default function StaffEventiPage() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvento, setSelectedEvento] = useState<EventoDettaglio|null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function openEvento(id: number) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/eventi/tutti/${id}`);
      if (res.ok) setSelectedEvento(await res.json());
    } catch {}
    setLoadingDetail(false);
  }

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
                    <button key={e.id} onClick={() => openEvento(e.id)} className={`rounded-lg px-2.5 py-1.5 text-xs border text-left active:scale-[0.97] transition-all ${sedeStyle(e.sede)}`}>
                      <p className={`font-semibold ${sedeTextColor(e.sede)}`}>{e.nome}</p>
                      <p className="text-text-muted">{e.sede} {e.oraInizio && `· ${e.oraInizio}`} · {e.assegnati}p</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ═══ BOTTOM SHEET DETTAGLIO ═══ */}
      {(selectedEvento || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => { setSelectedEvento(null); setLoadingDetail(false); }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
            ) : selectedEvento && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4 pb-3 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">{selectedEvento.nome}</h2>
                  <p className="text-sm text-text-muted">{selectedEvento.sede} {selectedEvento.oraInizio && `· ${selectedEvento.oraInizio}`}{selectedEvento.oraFine && ` – ${selectedEvento.oraFine}`}</p>
                  {selectedEvento.descrizione && <p className="text-xs text-text-muted mt-1 italic">{selectedEvento.descrizione}</p>}
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{selectedEvento.personale.length} persone convocate</p>
                  {selectedEvento.personale.length === 0 ? (
                    <p className="text-sm text-text-muted py-4">Nessun personale assegnato.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvento.personale.sort((a, b) => (a.orarioInizio||"").localeCompare(b.orarioInizio||"")).map((p, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-lg bg-sidebar-bg px-3 py-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                            {p.nome[0]}{p.cognome[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{p.nome} {p.cognome}</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {(p.orarioInizio || p.orarioFine) && (
                                <span className="text-xs text-text-muted font-mono">{p.orarioInizio||"—"} – {p.orarioFine === "chiusura" ? "Chiusura" : (p.orarioFine||"—")}</span>
                              )}
                              {p.mansione && <span className="text-[10px] rounded-full bg-accent/10 text-accent px-1.5 py-0.5">{p.mansione}</span>}
                              {p.postazione && <span className="text-[10px] rounded-full bg-zinc-500/15 text-zinc-400 px-1.5 py-0.5">{p.postazione}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5 pt-2">
                  <button onClick={() => setSelectedEvento(null)} className="w-full rounded-xl border border-border py-3 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[48px]">
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
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
