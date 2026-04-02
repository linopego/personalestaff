"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import VisibilityBanner from "@/components/visibility-banner";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface TimbraturaStorico {
  id: number;
  data: string;       // YYYY-MM-DD
  orario: string;     // HH:mm
  tipo: "Entrata" | "Uscita";
  sede: string;
  lat: number;
  lng: number;
  modificata: boolean;
  noteModifica?: string;
  tipoAccesso?: string;
  motivoRemoto?: string;
}

interface ApiTimbratura {
  id: number;
  userId: number;
  sedeId: number;
  tipo: string;
  orario: string;       // ISO timestamp string
  lat: number;
  lng: number;
  modificataManualmente: boolean;
  noteModifica: string | null;
  modifiedBy: number | null;
  dipNome: string;
  dipCognome: string;
  sedeNome: string;
  tipoAccesso?: string;
  motivoRemoto?: string | null;
}

interface GiornoData {
  data: string;
  label: string;       // "Lunedì 1 Aprile"
  isOggi: boolean;
  timbrature: TimbraturaStorico[];
  oreTurno: number | null;
  turnoAperto: boolean;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const GIORNI_NOME = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const MESI_NOME = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

/* ═══════════════════════════════════════════
   API TRANSFORM
   ═══════════════════════════════════════════ */

function transformApiTimbratura(t: ApiTimbratura): TimbraturaStorico {
  const dt = new Date(t.orario);
  const data = isoDate(dt);
  const orario = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  return {
    id: t.id,
    data,
    orario,
    tipo: t.tipo as "Entrata" | "Uscita",
    sede: t.sedeNome,
    lat: t.lat,
    lng: t.lng,
    modificata: t.modificataManualmente,
    noteModifica: t.noteModifica ?? undefined,
    tipoAccesso: t.tipoAccesso,
    motivoRemoto: t.motivoRemoto ?? undefined,
  };
}

/* ═══════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════ */

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLabel(iso: string) {
  const d = parseDate(iso);
  return `${GIORNI_NOME[d.getDay()]} ${d.getDate()} ${MESI_NOME[d.getMonth()]}`;
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function calcolaOreTurno(entrata: string, uscita: string): number {
  const [eh, em] = entrata.split(":").map(Number);
  const [uh, um] = uscita.split(":").map(Number);
  let diff = uh * 60 + um - (eh * 60 + em);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

function buildGiornoData(data: string, timbrature: TimbraturaStorico[], oggi: string): GiornoData {
  const ts = timbrature.filter((t) => t.data === data).sort((a, b) => a.orario.localeCompare(b.orario));
  const entrata = ts.find((t) => t.tipo === "Entrata");
  const uscita = ts.find((t) => t.tipo === "Uscita");
  let oreTurno: number | null = null;
  let turnoAperto = false;
  if (entrata && uscita) {
    oreTurno = calcolaOreTurno(entrata.orario, uscita.orario);
  } else if (entrata && !uscita) {
    turnoAperto = true;
  }
  return { data, label: formatLabel(data), isOggi: data === oggi, timbrature: ts, oreTurno, turnoAperto };
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function StoricoPage() {
  const [tab, setTab] = useState<"settimana" | "mese">("settimana");
  const [detailTimbr, setDetailTimbr] = useState<TimbraturaStorico | null>(null);

  const oggi = isoDate(new Date());

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">Le Mie Timbrature</h1>
      <VisibilityBanner />

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("settimana")}
          className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${
            tab === "settimana"
              ? "bg-accent text-white"
              : "bg-card-bg border border-border text-text-muted"
          }`}
        >
          Questa Settimana
        </button>
        <button
          onClick={() => setTab("mese")}
          className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${
            tab === "mese"
              ? "bg-accent text-white"
              : "bg-card-bg border border-border text-text-muted"
          }`}
        >
          Questo Mese
        </button>
      </div>

      {tab === "settimana" && <TabSettimana oggi={oggi} onDetail={setDetailTimbr} />}
      {tab === "mese" && <TabMese oggi={oggi} onDetail={setDetailTimbr} />}

      {/* Bottom sheet dettaglio */}
      {detailTimbr && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setDetailTimbr(null)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-6 py-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground text-center">Dettaglio Timbratura</h2>

              <div className="rounded-xl bg-sidebar-bg p-4 space-y-3">
                <DetailRow label="Tipo" value={detailTimbr.tipo} valueColor={detailTimbr.tipo === "Entrata" ? "text-green-400" : "text-red-400"} />
                <DetailRow label="Data" value={formatLabel(detailTimbr.data)} />
                <DetailRow label="Orario" value={detailTimbr.orario} />
                <DetailRow label="Sede" value={detailTimbr.sede} />
                <DetailRow label="GPS" value={`${detailTimbr.lat.toFixed(6)}, ${detailTimbr.lng.toFixed(6)}`} small />
              </div>

              {detailTimbr.modificata && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">MODIFICATA</span>
                    <span className="text-sm font-medium text-amber-400">dall&apos;amministratore</span>
                  </div>
                  {detailTimbr.noteModifica && (
                    <p className="text-sm text-text-muted leading-relaxed">{detailTimbr.noteModifica}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => setDetailTimbr(null)}
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
   TAB SETTIMANA
   ═══════════════════════════════════════════ */

function TabSettimana({ oggi, onDetail }: { oggi: string; onDetail: (t: TimbraturaStorico) => void }) {
  const [timbrature, setTimbrature] = useState<TimbraturaStorico[]>([]);
  const [loading, setLoading] = useState(true);

  const monday = useMemo(() => getMonday(parseDate(oggi)), [oggi]);
  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
  }, [monday]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dataInizio: isoDate(monday),
        dataFine: isoDate(sunday),
      });
      const res = await fetch(`/api/timbrature?${params.toString()}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data: ApiTimbratura[] = await res.json();
      setTimbrature(data.map(transformApiTimbratura));
    } catch {
      setTimbrature([]);
    } finally {
      setLoading(false);
    }
  }, [monday, sunday]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const giorni = useMemo(() => {
    const result: GiornoData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      result.push(buildGiornoData(isoDate(d), timbrature, oggi));
    }
    return result;
  }, [monday, timbrature, oggi]);

  if (loading) return <LoadingSpinner />;

  const hasAny = giorni.some((g) => g.timbrature.length > 0);
  if (!hasAny) return <StatoVuoto />;

  return (
    <div className="flex flex-col gap-3">
      {giorni.map((g) => (
        <GiornoCard key={g.data} giorno={g} onDetail={onDetail} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB MESE
   ═══════════════════════════════════════════ */

function TabMese({ oggi, onDetail }: { oggi: string; onDetail: (t: TimbraturaStorico) => void }) {
  const oggiDate = parseDate(oggi);
  const [monthOffset, setMonthOffset] = useState(0);
  const [timbrature, setTimbrature] = useState<TimbraturaStorico[]>([]);
  const [loading, setLoading] = useState(true);

  const meseDate = new Date(oggiDate.getFullYear(), oggiDate.getMonth() + monthOffset, 1);
  const meseLabel = `${MESI_NOME[meseDate.getMonth()]} ${meseDate.getFullYear()}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const anno = meseDate.getFullYear();
      const mese = meseDate.getMonth();
      const dataInizio = isoDate(new Date(anno, mese, 1));
      const dataFine = isoDate(new Date(anno, mese + 1, 0));
      const params = new URLSearchParams({ dataInizio, dataFine });
      const res = await fetch(`/api/timbrature?${params.toString()}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data: ApiTimbratura[] = await res.json();
      setTimbrature(data.map(transformApiTimbratura));
    } catch {
      setTimbrature([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { settimane, totOre, giorniLav, mediaOre } = useMemo(() => {
    const anno = meseDate.getFullYear();
    const mese = meseDate.getMonth();
    const daysInMonth = new Date(anno, mese + 1, 0).getDate();

    // Raggruppa per settimana
    const weeks: Map<number, GiornoData[]> = new Map();
    let totOre = 0;
    let giorniLav = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(anno, mese, d);
      const iso = isoDate(dt);
      const giorno = buildGiornoData(iso, timbrature, oggi);

      if (giorno.timbrature.length === 0) continue;

      // Numero settimana nel mese (1-based)
      const weekNum = Math.ceil((d + ((new Date(anno, mese, 1).getDay() + 6) % 7)) / 7);

      if (!weeks.has(weekNum)) weeks.set(weekNum, []);
      weeks.get(weekNum)!.push(giorno);

      if (giorno.oreTurno) totOre += giorno.oreTurno;
      giorniLav++;
    }

    const mediaOre = giorniLav > 0 ? Math.round((totOre / giorniLav) * 10) / 10 : 0;
    return { settimane: [...weeks.entries()].sort((a, b) => a[0] - b[0]), totOre: Math.round(totOre * 10) / 10, giorniLav, mediaOre };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timbrature, oggi, monthOffset]);

  return (
    <div className="flex flex-col gap-4">
      {/* Selettore mese */}
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button
          onClick={() => setMonthOffset((v) => v - 1)}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{meseLabel}</span>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          disabled={monthOffset >= 0}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : settimane.length === 0 ? (
        <StatoVuoto />
      ) : (
        <>
          {settimane.map(([weekNum, giorni]) => (
            <div key={weekNum}>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Settimana {weekNum}</p>
              <div className="flex flex-col gap-3">
                {giorni.map((g) => (
                  <GiornoCard key={g.data} giorno={g} onDetail={onDetail} />
                ))}
              </div>
            </div>
          ))}

          {/* Riepilogo */}
          <div className="rounded-2xl border border-border bg-card-bg p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Riepilogo {meseLabel}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent tabular-nums">{totOre}h</p>
                <p className="text-xs text-text-muted mt-0.5">Ore totali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{giorniLav}</p>
                <p className="text-xs text-text-muted mt-0.5">Giorni lavorati</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{mediaOre}h</p>
                <p className="text-xs text-text-muted mt-0.5">Media/giorno</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   GIORNO CARD
   ═══════════════════════════════════════════ */

function GiornoCard({ giorno, onDetail }: { giorno: GiornoData; onDetail: (t: TimbraturaStorico) => void }) {
  const { label, isOggi, timbrature, oreTurno, turnoAperto } = giorno;
  const empty = timbrature.length === 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isOggi
          ? "border-accent/40 bg-accent/[0.04]"
          : "border-border bg-card-bg"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-foreground">{label}</p>
          {isOggi && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">Oggi</span>
          )}
        </div>
        {oreTurno !== null && (
          <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400 tabular-nums">
            {oreTurno.toFixed(1)}h
          </span>
        )}
        {turnoAperto && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
            In corso
          </span>
        )}
      </div>

      {empty ? (
        <p className="text-sm text-text-muted py-1">Giorno libero</p>
      ) : (
        <div className="space-y-1.5">
          {timbrature.map((t) => {
            const isRemoto = t.tipoAccesso === "remoto";
            return (
              <div key={t.id}>
                <button
                  onClick={() => onDetail(t)}
                  className="flex w-full items-center gap-3 rounded-xl bg-sidebar-bg px-3.5 py-3 min-h-[48px] active:bg-white/5 active:scale-[0.98] transition-all text-left"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    t.tipo === "Entrata" ? "bg-green-500/15" : "bg-red-500/15"
                  }`}>
                    {t.tipo === "Entrata" ? (
                      <ArrowDownIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowUpIcon className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-foreground tabular-nums">{t.orario}</p>
                      {isRemoto && (
                        <span className="rounded bg-zinc-500/20 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase">Remoto</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{isRemoto ? "Posizione remota" : t.sede}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.modificata && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">MOD</span>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                  </div>
                </button>
                {isRemoto && t.motivoRemoto && (
                  <p className="mt-0.5 px-3.5 text-xs italic text-text-muted">{t.motivoRemoto}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOADING SPINNER
   ═══════════════════════════════════════════ */

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   STATO VUOTO
   ═══════════════════════════════════════════ */

function StatoVuoto() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-lg font-semibold text-foreground">Nessuna timbratura</p>
      <p className="mt-1 text-sm text-text-muted">Non ci sono timbrature in questo periodo.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════ */

function DetailRow({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className={`${small ? "text-xs font-mono" : "text-sm font-semibold"} ${valueColor ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
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
