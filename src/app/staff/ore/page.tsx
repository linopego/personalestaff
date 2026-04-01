"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

/* ═══════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════ */

const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const ORE_CONTRATTUALI_SETT = 40;
const CONTRATTO = "Dipendente Fisso";

interface DayHours {
  data: string;        // YYYY-MM-DD
  label: string;       // "Lunedì 30 Mar"
  ore: number;         // ore decimali
  isOggi: boolean;
  sede: string | null;
}

/* ═══════════════════════════════════════════
   MOCK DATA — ore per giorno (coerente con storico)
   ═══════════════════════════════════════════ */

const ORE_MOCK: Record<string, { ore: number; sede: string }> = {
  // Settimana 30 Mar - 5 Apr (corrente)
  "2026-03-30": { ore: 8.08, sede: "La Casa dei Gelsi" },
  "2026-03-31": { ore: 8.08, sede: "Tenuta Villa Peggy's" },
  "2026-04-01": { ore: 4.5, sede: "La Casa dei Gelsi" }, // oggi, in corso
  // Settimana 23-29 Mar
  "2026-03-23": { ore: 7.75, sede: "Studios Club / TooLate" },
  "2026-03-24": { ore: 8.0, sede: "La Casa dei Gelsi" },
  "2026-03-25": { ore: 7.92, sede: "Tenuta Villa Peggy's" },
  "2026-03-26": { ore: 8.08, sede: "La Casa dei Gelsi" },
  "2026-03-27": { ore: 8.0, sede: "Studios Club / TooLate" },
  "2026-03-28": { ore: 6.5, sede: "Tenuta Villa Peggy's" },
  // Settimana 16-22 Mar
  "2026-03-16": { ore: 8.08, sede: "La Casa dei Gelsi" },
  "2026-03-17": { ore: 8.08, sede: "Tenuta Villa Peggy's" },
  "2026-03-18": { ore: 8.0, sede: "La Casa dei Gelsi" },
  "2026-03-20": { ore: 8.5, sede: "Studios Club / TooLate" },
  "2026-03-21": { ore: 6.0, sede: "La Casa dei Gelsi" },
  // Settimana 9-15 Mar
  "2026-03-09": { ore: 8.0, sede: "La Casa dei Gelsi" },
  "2026-03-10": { ore: 7.5, sede: "Tenuta Villa Peggy's" },
  "2026-03-11": { ore: 8.25, sede: "La Casa dei Gelsi" },
  "2026-03-12": { ore: 8.0, sede: "Studios Club / TooLate" },
  "2026-03-13": { ore: 7.75, sede: "La Casa dei Gelsi" },
};

/* ═══════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════ */

const OGGI = "2026-04-01";

function parseD(iso: string) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }
function isoD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function fmtShort(iso: string) {
  const d = parseD(iso);
  return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`;
}

function fmtOreMin(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${h}h`;
}

function weekDays(monday: Date): DayHours[] {
  const result: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const iso = isoD(d);
    const mock = ORE_MOCK[iso];
    result.push({
      data: iso,
      label: `${GIORNI[i]} ${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`,
      ore: mock?.ore ?? 0,
      isOggi: iso === OGGI,
      sede: mock?.sede ?? null,
    });
  }
  return result;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OrePage() {
  const [tab, setTab] = useState<"settimana" | "mese">("settimana");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Le Mie Ore</h1>
        <p className="mt-0.5 text-sm text-text-muted">{CONTRATTO} — {ORE_CONTRATTUALI_SETT}h/settimana</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {(["settimana", "mese"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${
              tab === t ? "bg-accent text-white" : "bg-card-bg border border-border text-text-muted"
            }`}
          >
            {t === "settimana" ? "Settimana" : "Mese"}
          </button>
        ))}
      </div>

      {tab === "settimana" ? <TabSettimana /> : <TabMese />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB SETTIMANA
   ═══════════════════════════════════════════ */

function TabSettimana() {
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => {
    const m = getMonday(parseD(OGGI));
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const periodLabel = `Lun ${fmtShort(isoD(monday))} — Dom ${fmtShort(isoD(sunday))} ${sunday.getFullYear()}`;

  const days = useMemo(() => weekDays(monday), [monday]);
  const oreLavorate = days.reduce((s, d) => s + d.ore, 0);
  const giorniLav = days.filter((d) => d.ore > 0).length;
  const diff = Math.round((oreLavorate - ORE_CONTRATTUALI_SETT) * 10) / 10;
  const progress = Math.min((oreLavorate / ORE_CONTRATTUALI_SETT) * 100, 100);
  const overContract = oreLavorate > ORE_CONTRATTUALI_SETT;
  const maxOre = Math.max(...days.map((d) => d.ore), 1);

  const hasData = oreLavorate > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Selettore settimana */}
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button onClick={() => setWeekOffset((v) => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground text-center">{periodLabel}</span>
        <button onClick={() => setWeekOffset((v) => v + 1)} disabled={weekOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {!hasData ? <StatoVuoto /> : (
        <>
          {/* Metriche */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Ore lavorate" value={fmtOreMin(oreLavorate)} accent="text-accent" />
            <MetricCard label="Ore contrattuali" value={`${ORE_CONTRATTUALI_SETT}h`} accent="text-amber-400" />
            <MetricCard label="Differenza" value={`${diff > 0 ? "+" : ""}${fmtOreMin(Math.abs(diff))}`} accent={diff >= 0 ? "text-green-400" : "text-red-400"} />
            <MetricCard label="Giorni lavorati" value={`${giorniLav} / 5`} accent="text-foreground" />
          </div>

          {/* Barra progresso */}
          <div className="rounded-xl border border-border bg-card-bg p-4">
            <p className="text-sm text-text-muted mb-2">
              <span className="font-semibold text-foreground">{fmtOreMin(oreLavorate)}</span> su <span className="font-semibold text-amber-400">{ORE_CONTRATTUALI_SETT}h</span> contrattuali
            </p>
            <div className="h-3 rounded-full bg-sidebar-bg overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${overContract ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {overContract && (
              <p className="mt-1.5 text-xs text-amber-400">+{fmtOreMin(oreLavorate - ORE_CONTRATTUALI_SETT)} oltre il contratto</p>
            )}
          </div>

          {/* Lista giorni */}
          <div className="flex flex-col gap-2">
            {days.map((d) => (
              <div
                key={d.data}
                className={`flex items-center gap-3 rounded-xl p-3.5 min-h-[48px] ${
                  d.isOggi ? "bg-accent/[0.06] border border-accent/30" : "bg-card-bg border border-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-foreground">{d.label}</p>
                    {d.isOggi && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">OGGI</span>}
                  </div>
                  {d.sede && <p className="text-xs text-text-muted mt-0.5">{d.sede}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Mini bar */}
                  <div className="w-16 h-2 rounded-full bg-sidebar-bg overflow-hidden hidden sm:block">
                    {d.ore > 0 && (
                      <div
                        className="h-full rounded-full bg-accent/60"
                        style={{ width: `${(d.ore / maxOre) * 100}%` }}
                      />
                    )}
                  </div>
                  <p className={`text-base font-bold tabular-nums w-16 text-right ${d.ore > 0 ? "text-foreground" : "text-text-muted"}`}>
                    {d.ore > 0 ? fmtOreMin(d.ore) : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB MESE
   ═══════════════════════════════════════════ */

function TabMese() {
  const oggiDate = parseD(OGGI);
  const [monthOffset, setMonthOffset] = useState(0);

  const meseDate = new Date(oggiDate.getFullYear(), oggiDate.getMonth() + monthOffset, 1);
  const meseLabel = `${MESI[meseDate.getMonth()]} ${meseDate.getFullYear()}`;

  const { settimane, chartData, totOre, oreContr, diff, giorniLav, mediaOre, giornoMax, sedeFreq } = useMemo(() => {
    const anno = meseDate.getFullYear();
    const mese = meseDate.getMonth();
    const daysInMonth = new Date(anno, mese + 1, 0).getDate();

    // Calcola settimane nel mese
    const weeksMap = new Map<string, { num: number; label: string; monday: Date; ore: number; giorni: number }>();
    let totOre = 0;
    let giorniLav = 0;
    let giornoMax = { data: "", ore: 0 };
    const sediCount = new Map<string, number>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(anno, mese, d);
      const iso = isoD(dt);
      const mock = ORE_MOCK[iso];
      if (!mock) continue;

      const monday = getMonday(dt);
      const mondayIso = isoD(monday);

      if (!weeksMap.has(mondayIso)) {
        const sun = new Date(monday);
        sun.setDate(sun.getDate() + 6);
        const num = weeksMap.size + 1;
        weeksMap.set(mondayIso, {
          num,
          label: `${fmtShort(mondayIso)} — ${fmtShort(isoD(sun))}`,
          monday,
          ore: 0,
          giorni: 0,
        });
      }
      const w = weeksMap.get(mondayIso)!;
      w.ore += mock.ore;
      w.giorni++;
      totOre += mock.ore;
      giorniLav++;
      if (mock.ore > giornoMax.ore) giornoMax = { data: iso, ore: mock.ore };
      sediCount.set(mock.sede, (sediCount.get(mock.sede) ?? 0) + 1);
    }

    // Settimane nel mese (approssimazione)
    const numSettimane = Math.max(weeksMap.size, 4);
    const oreContr = ORE_CONTRATTUALI_SETT * numSettimane;
    const diff = Math.round((totOre - oreContr) * 10) / 10;
    const mediaOre = giorniLav > 0 ? Math.round((totOre / giorniLav) * 10) / 10 : 0;

    let sedeFreq = "—";
    let maxC = 0;
    sediCount.forEach((c, s) => { if (c > maxC) { maxC = c; sedeFreq = s; } });

    const settimane = [...weeksMap.values()].sort((a, b) => a.num - b.num);
    const chartData = settimane.map((w) => ({
      name: `S${w.num}`,
      ore: Math.round(w.ore * 10) / 10,
    }));

    return {
      settimane,
      chartData,
      totOre: Math.round(totOre * 10) / 10,
      oreContr,
      diff,
      giorniLav,
      mediaOre,
      giornoMax,
      sedeFreq,
    };
  }, [meseDate]);

  const hasData = totOre > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Selettore mese */}
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button onClick={() => setMonthOffset((v) => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{meseLabel}</span>
        <button onClick={() => setMonthOffset((v) => v + 1)} disabled={monthOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {!hasData ? <StatoVuoto /> : (
        <>
          {/* Metriche grandi */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-card-bg p-5 text-center">
              <p className="text-sm text-text-muted">Ore lavorate</p>
              <p className="text-4xl font-bold text-accent tabular-nums mt-1">{fmtOreMin(totOre)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card-bg p-4 text-center">
                <p className="text-xs text-text-muted">Ore contrattuali</p>
                <p className="text-2xl font-bold text-amber-400 tabular-nums mt-1">{oreContr}h</p>
              </div>
              <div className="rounded-2xl border border-border bg-card-bg p-4 text-center">
                <p className="text-xs text-text-muted">Differenza</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {diff > 0 ? "+" : ""}{fmtOreMin(Math.abs(diff))}
                </p>
              </div>
            </div>
          </div>

          {/* Grafico */}
          <div className="rounded-2xl border border-border bg-card-bg p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Ore per settimana</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 14 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="ore" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.ore > ORE_CONTRATTUALI_SETT ? "#f59e0b" : "#3b82f6"} />
                  ))}
                  <LabelList
                    dataKey="ore"
                    position="top"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${v}h`}
                    style={{ fill: "#e4e4e7", fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista settimane */}
          <div className="flex flex-col gap-2">
            {settimane.map((w) => {
              const wDiff = Math.round((w.ore - ORE_CONTRATTUALI_SETT) * 10) / 10;
              return (
                <div key={w.num} className="flex items-center justify-between rounded-xl border border-border bg-card-bg p-4 min-h-[48px]">
                  <div>
                    <p className="text-base font-medium text-foreground">Settimana {w.num}</p>
                    <p className="text-xs text-text-muted">{w.label} — {w.giorni} giorni</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-base font-bold text-foreground tabular-nums">{fmtOreMin(Math.round(w.ore * 10) / 10)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${wDiff >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {wDiff > 0 ? "+" : ""}{wDiff}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Riepilogo */}
          <div className="rounded-2xl bg-sidebar-bg p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Riepilogo</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <SummaryItem label="Giorni lavorati" value={String(giorniLav)} />
              <SummaryItem label="Media ore/giorno" value={`${mediaOre}h`} />
              <SummaryItem label="Giorno con più ore" value={giornoMax.data ? `${fmtShort(giornoMax.data)} (${fmtOreMin(giornoMax.ore)})` : "—"} />
              <SummaryItem label="Sede più frequentata" value={sedeFreq} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════ */

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-bg p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function StatoVuoto() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-lg font-semibold text-foreground">Nessuna ora registrata</p>
      <p className="mt-1 text-sm text-text-muted">Non ci sono ore registrate in questo periodo.</p>
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
