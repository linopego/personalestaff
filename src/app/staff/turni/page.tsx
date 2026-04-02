"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Turno {
  id: number;
  data: string;           // YYYY-MM-DD
  sedeId: number;
  areaOperativa: string;  // sala | bar | cassa | guardaroba | altro
  orarioInizio: string;   // HH:mm
  orarioFine: string;     // HH:mm
  note: string | null;
  stato: string;          // confermato | bozza | ...
  sedeNome: string;
  mansione: string | null;
}

type Tab = "prossimi" | "tutti";

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const GIORNI_SETTIMANA = [
  "Domenica", "Lunedì", "Martedì", "Mercoledì",
  "Giovedì", "Venerdì", "Sabato",
];

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre",
];

const AREA_BADGE: Record<string, { label: string; className: string }> = {
  sala:        { label: "Sala",        className: "bg-blue-500/15 text-blue-400" },
  bar:         { label: "Bar",         className: "bg-amber-500/15 text-amber-400" },
  cassa:       { label: "Cassa",       className: "bg-green-500/15 text-green-400" },
  guardaroba:  { label: "Guardaroba",  className: "bg-purple-500/15 text-purple-400" },
  altro:       { label: "Altro",       className: "bg-zinc-500/15 text-zinc-400" },
};

/* ═══════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════ */

/** Returns YYYY-MM-DD for a Date in local time */
function isoD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parses YYYY-MM-DD without timezone shift */
function parseD(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Giovedì 3 Aprile 2026" */
function fmtItalianDate(iso: string): string {
  const d = parseD(iso);
  return `${GIORNI_SETTIMANA[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

/** Returns total hours between two HH:mm strings */
function diffOre(inizio: string, fine: string): number {
  const [ih, im] = inizio.split(":").map(Number);
  const [fh, fm] = fine.split(":").map(Number);
  let mins = (fh * 60 + fm) - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60; // overnight shift
  return Math.round((mins / 60) * 100) / 100;
}

function fmtOre(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${String(mins).padStart(2, "0")}m` : `${hrs}h`;
}

/* ═══════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════ */

export default function TurniPage() {
  const [tab, setTab] = useState<Tab>("prossimi");
  const [turni, setTurni] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTurni = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/turni/miei");
      if (!res.ok) throw new Error("fetch failed");
      setTurni(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTurni(); }, [fetchTurni]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">I Miei Turni</h1>
      </div>

      {/* ── Tab selector ── */}
      <div className="grid grid-cols-2 gap-2">
        {(["prossimi", "tutti"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${
              tab === t
                ? "bg-accent text-white"
                : "bg-card-bg border border-border text-text-muted"
            }`}
          >
            {t === "prossimi" ? "Prossimi Turni" : "Tutti i Turni"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState onRetry={fetchTurni} />
      ) : tab === "prossimi" ? (
        <TabProssimi turni={turni} />
      ) : (
        <TabTutti turni={turni} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB PROSSIMI TURNI
   ═══════════════════════════════════════════ */

function TabProssimi({ turni }: { turni: Turno[] }) {
  const oggi = isoD(new Date());
  const domani = isoD(new Date(Date.now() + 86400000));

  const prossimi = useMemo(
    () => turni.filter((t) => t.data >= oggi).sort((a, b) => a.data.localeCompare(b.data)),
    [turni, oggi],
  );

  if (prossimi.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      {prossimi.map((turno) => (
        <TurnoCard
          key={turno.id}
          turno={turno}
          isOggi={turno.data === oggi}
          isDomani={turno.data === domani}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB TUTTI I TURNI
   ═══════════════════════════════════════════ */

function TabTutti({ turni }: { turni: Turno[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const canGoForward = useMemo(() => {
    const nextDate = new Date(year, month + 1, 1);
    return nextDate <= new Date(now.getFullYear(), now.getMonth() + 6, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (!canGoForward) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const meseLabel = `${MESI[month]} ${year}`;

  const turniMese = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return turni
      .filter((t) => t.data.startsWith(prefix))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [turni, year, month]);

  const { totaleTurni, totaleOre } = useMemo(() => {
    const totaleTurni = turniMese.length;
    const totaleOre = turniMese.reduce((sum, t) => sum + diffOre(t.orarioInizio, t.orarioFine), 0);
    return { totaleTurni, totaleOre: Math.round(totaleOre * 100) / 100 };
  }, [turniMese]);

  const oggi = isoD(new Date());
  const domani = isoD(new Date(Date.now() + 86400000));

  return (
    <div className="flex flex-col gap-3">
      {/* Month selector */}
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button
          onClick={prevMonth}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all"
          aria-label="Mese precedente"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{meseLabel}</span>
        <button
          onClick={nextMonth}
          disabled={!canGoForward}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30"
          aria-label="Mese successivo"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {turniMese.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {turniMese.map((turno) => (
              <TurnoCard
                key={turno.id}
                turno={turno}
                isOggi={turno.data === oggi}
                isDomani={turno.data === domani}
              />
            ))}
          </div>

          {/* Summary footer */}
          <div className="rounded-2xl border border-border bg-card-bg p-5 mt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Riepilogo {meseLabel}
            </p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <div>
                <p className="text-xs text-text-muted">Turni totali</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{totaleTurni}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Ore totali</p>
                <p className="text-2xl font-bold text-accent mt-0.5">{fmtOre(totaleOre)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TURNO CARD
   ═══════════════════════════════════════════ */

function TurnoCard({
  turno,
  isOggi,
  isDomani,
}: {
  turno: Turno;
  isOggi: boolean;
  isDomani: boolean;
}) {
  const area = AREA_BADGE[turno.areaOperativa.toLowerCase()] ?? AREA_BADGE["altro"];
  const confermato = turno.stato === "confermato";

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all active:scale-[0.99] ${
        isOggi
          ? "border-accent bg-accent/[0.06]"
          : "border-border bg-card-bg"
      }`}
    >
      {/* Row 1: date + today/tomorrow badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-base font-semibold text-foreground leading-tight">
          {fmtItalianDate(turno.data)}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOggi && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent">
              OGGI
            </span>
          )}
          {isDomani && !isOggi && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-400">
              DOMANI
            </span>
          )}
          {/* stato badge */}
          {confermato ? (
            <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
              Confermato
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              In attesa
            </span>
          )}
        </div>
      </div>

      {/* Row 2: sede + area badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-text-muted">{turno.sedeNome}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${area.className}`}>
          {area.label}
        </span>
      </div>

      {/* Row 3: orario (large) */}
      <p className="text-3xl font-bold tabular-nums text-foreground leading-none">
        {turno.orarioInizio}
        <span className="text-text-muted mx-1">–</span>
        {turno.orarioFine}
      </p>

      {/* Row 4: mansione (optional) */}
      {turno.mansione && (
        <p className="text-sm italic text-text-muted">{turno.mansione}</p>
      )}

      {/* Row 5: note (optional) */}
      {turno.note && (
        <p className="text-xs text-text-muted border-t border-border pt-2.5 mt-0.5 leading-snug">
          {turno.note}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════ */

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <p className="text-lg font-semibold text-foreground">Errore di caricamento</p>
      <p className="text-sm text-text-muted">Non è stato possibile caricare i turni.</p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-accent px-5 py-3 text-base font-semibold text-white min-h-[48px] active:scale-[0.97] transition-all"
      >
        Riprova
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">📅</div>
      <p className="text-lg font-semibold text-foreground">Nessun turno assegnato</p>
      <p className="mt-1 text-sm text-text-muted">Non ci sono turni in questo periodo.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

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
