"use client";

import { useState, useMemo, useEffect } from "react";
import VisibilityBanner from "@/components/visibility-banner";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Timb {
  id: number; data: string; orario: string; tipo: "Entrata" | "Uscita";
  sede: string; lat: number; lng: number; modificata: boolean;
  noteModifica?: string; tipoAccesso?: string; motivoRemoto?: string;
  timestamp: number;
}

interface Turno {
  entrata: Timb;
  uscita: Timb | null;
  ore: number | null;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

function fmtData(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;
}

function fmtDataCorta(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function isoD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function getMonday(d: Date) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }

/* ═══════════════════════════════════════════
   PARSE TURNI — paira entrata/uscita in ordine cronologico
   ═══════════════════════════════════════════ */

function parseTurni(timbrature: Timb[]): Turno[] {
  const sorted = [...timbrature].sort((a, b) => a.timestamp - b.timestamp);
  const turni: Turno[] = [];
  let i = 0;
  while (i < sorted.length) {
    if (sorted[i].tipo === "Entrata") {
      const entrata = sorted[i];
      // Cerca la prossima uscita
      let uscita: Timb | null = null;
      if (i + 1 < sorted.length && sorted[i + 1].tipo === "Uscita") {
        uscita = sorted[i + 1];
        i += 2;
      } else {
        i += 1;
      }
      let ore: number | null = null;
      if (uscita) {
        ore = Math.round(((uscita.timestamp - entrata.timestamp) / 3600000) * 100) / 100;
      }
      turni.push({ entrata, uscita, ore });
    } else {
      // Uscita senza entrata — skip
      i += 1;
    }
  }
  return turni.reverse(); // più recenti prima
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function StoricoPage() {
  const [tab, setTab] = useState<"settimana" | "mese">("settimana");
  const [timbrature, setTimbrature] = useState<Timb[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTimb, setDetailTimb] = useState<Timb | null>(null);

  // Week nav
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = useMemo(() => { const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m; }, [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);

  // Month nav
  const [monthOffset, setMonthOffset] = useState(0);
  const meseDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const meseFine = useMemo(() => new Date(meseDate.getFullYear(), meseDate.getMonth() + 1, 0), [meseDate]);

  useEffect(() => {
    setLoading(true);
    const dataInizio = tab === "settimana" ? isoD(monday) : isoD(meseDate);
    const dataFine = tab === "settimana" ? isoD(sunday) : isoD(meseFine);
    fetch(`/api/timbrature?dataInizio=${dataInizio}&dataFine=${dataFine}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTimbrature(data.map((t: Record<string, unknown>) => ({
            id: t.id as number, tipo: t.tipo as "Entrata" | "Uscita",
            data: new Date(t.orario as string).toLocaleDateString("sv-SE"),
            orario: new Date(t.orario as string).toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit" }),
            sede: (t.sedeNome as string) || "Remoto",
            lat: t.lat as number, lng: t.lng as number,
            modificata: t.modificataManualmente as boolean,
            noteModifica: t.noteModifica as string | undefined,
            tipoAccesso: t.tipoAccesso as string | undefined,
            motivoRemoto: t.motivoRemoto as string | undefined,
            timestamp: new Date(t.orario as string).getTime(),
          })));
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, [tab, monday, sunday, meseDate, meseFine]);

  const turni = useMemo(() => parseTurni(timbrature), [timbrature]);
  const oggi = isoD(new Date());

  // Riepilogo mese
  const totOre = useMemo(() => turni.reduce((s, t) => s + (t.ore ?? 0), 0), [turni]);
  const totTurni = turni.length;

  const fmtPeriod = `${fmtDataCorta(isoD(monday))} — ${fmtDataCorta(isoD(sunday))}`;
  const meseLabel = `${MESI[meseDate.getMonth()]} ${meseDate.getFullYear()}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">Le Mie Timbrature</h1>
      <VisibilityBanner />

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setTab("settimana")} className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${tab === "settimana" ? "bg-accent text-white" : "bg-card-bg border border-border text-text-muted"}`}>Questa Settimana</button>
        <button onClick={() => setTab("mese")} className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${tab === "mese" ? "bg-accent text-white" : "bg-card-bg border border-border text-text-muted"}`}>Questo Mese</button>
      </div>

      {/* Nav */}
      {tab === "settimana" ? (
        <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
          <button onClick={() => setWeekOffset(v => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all"><ChevronLeftIcon className="h-5 w-5" /></button>
          <span className="text-sm font-semibold text-foreground">{fmtPeriod}</span>
          <button onClick={() => setWeekOffset(v => v + 1)} disabled={weekOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30"><ChevronRightIcon className="h-5 w-5" /></button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
          <button onClick={() => setMonthOffset(v => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all"><ChevronLeftIcon className="h-5 w-5" /></button>
          <span className="text-sm font-semibold text-foreground">{meseLabel}</span>
          <button onClick={() => setMonthOffset(v => v + 1)} disabled={monthOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30"><ChevronRightIcon className="h-5 w-5" /></button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : turni.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold text-foreground">Nessuna timbratura</p>
          <p className="mt-1 text-sm text-text-muted">Non ci sono timbrature in questo periodo.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {turni.map((turno, i) => {
              const isOggi = turno.entrata.data === oggi;
              const isRemotoEnt = turno.entrata.tipoAccesso === "remoto";
              const isRemotoUsc = turno.uscita?.tipoAccesso === "remoto";
              const crossDay = turno.uscita && turno.entrata.data !== turno.uscita.data;

              return (
                <div key={turno.entrata.id} className={`rounded-2xl border p-4 ${isOggi ? "border-accent/40 bg-accent/[0.04]" : "border-border bg-card-bg"}`}>
                  {/* Header con ore */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-text-muted">{fmtData(turno.entrata.data)}</p>
                    {turno.ore != null ? (
                      <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400 tabular-nums">{turno.ore.toFixed(1)}h</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">In corso</span>
                    )}
                  </div>

                  {/* Entrata */}
                  <button onClick={() => setDetailTimb(turno.entrata)} className="w-full flex items-center gap-3 rounded-xl bg-sidebar-bg px-3.5 py-3 min-h-[48px] active:bg-white/5 active:scale-[0.98] transition-all text-left mb-1.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                      <ArrowDownIcon className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-foreground tabular-nums">{turno.entrata.orario}</p>
                        <span className="text-xs text-text-muted">{fmtDataCorta(turno.entrata.data)}</span>
                        {isRemotoEnt && <span className="rounded bg-zinc-500/20 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">REMOTO</span>}
                        {turno.entrata.modificata && <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-400">MOD</span>}
                      </div>
                      <p className="text-xs text-text-muted truncate">{isRemotoEnt ? "Posizione remota" : turno.entrata.sede}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-text-muted shrink-0" />
                  </button>

                  {/* Uscita */}
                  {turno.uscita ? (
                    <button onClick={() => setDetailTimb(turno.uscita!)} className="w-full flex items-center gap-3 rounded-xl bg-sidebar-bg px-3.5 py-3 min-h-[48px] active:bg-white/5 active:scale-[0.98] transition-all text-left">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                        <ArrowUpIcon className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-foreground tabular-nums">{turno.uscita.orario}</p>
                          {crossDay && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">{fmtDataCorta(turno.uscita.data)}</span>}
                          {!crossDay && <span className="text-xs text-text-muted">{fmtDataCorta(turno.uscita.data)}</span>}
                          {isRemotoUsc && <span className="rounded bg-zinc-500/20 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">REMOTO</span>}
                        </div>
                        <p className="text-xs text-text-muted truncate">{isRemotoUsc ? "Posizione remota" : turno.uscita.sede}</p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-text-muted shrink-0" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-sidebar-bg/50 border border-dashed border-amber-500/30 px-3.5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                        <ArrowUpIcon className="h-4 w-4 text-amber-400" />
                      </div>
                      <p className="text-sm text-amber-400">Uscita non registrata</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Riepilogo mese */}
          {tab === "mese" && (
            <div className="rounded-2xl border border-border bg-card-bg p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Riepilogo {meseLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent tabular-nums">{Math.round(totOre * 10) / 10}h</p>
                  <p className="text-xs text-text-muted mt-0.5">Ore totali</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{totTurni}</p>
                  <p className="text-xs text-text-muted mt-0.5">Turni</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ BOTTOM SHEET DETTAGLIO ═══ */}
      {detailTimb && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setDetailTimb(null)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="h-1 w-10 rounded-full bg-border" /></div>
            <div className="px-6 py-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground text-center">Dettaglio Timbratura</h2>
              <div className="rounded-xl bg-sidebar-bg p-4 space-y-3">
                <DetailRow label="Tipo" value={detailTimb.tipo} valueColor={detailTimb.tipo === "Entrata" ? "text-green-400" : "text-red-400"} />
                <DetailRow label="Data" value={fmtData(detailTimb.data)} />
                <DetailRow label="Orario" value={detailTimb.orario} />
                <DetailRow label="Sede" value={detailTimb.tipoAccesso === "remoto" ? "Posizione remota" : detailTimb.sede} />
                <DetailRow label="GPS" value={`${detailTimb.lat.toFixed(6)}, ${detailTimb.lng.toFixed(6)}`} small />
              </div>
              {detailTimb.modificata && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">MODIFICATA</span>
                  {detailTimb.noteModifica && <p className="text-sm text-text-muted mt-2">{detailTimb.noteModifica}</p>}
                </div>
              )}
              {detailTimb.motivoRemoto && (
                <p className="text-xs text-text-muted italic">{detailTimb.motivoRemoto}</p>
              )}
              <button onClick={() => setDetailTimb(null)} className="w-full rounded-xl border border-border py-4 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]">Chiudi</button>
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

function DetailRow({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) {
  return (<div className="flex items-center justify-between"><span className="text-sm text-text-muted">{label}</span><span className={`${small ? "text-xs font-mono" : "text-sm font-semibold"} ${valueColor ?? "text-foreground"}`}>{value}</span></div>);
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>);
}
function ArrowUpIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>);
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
}
