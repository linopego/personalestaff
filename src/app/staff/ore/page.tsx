"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

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

interface DayHours {
  data: string;
  label: string;
  ore: number;
  isOggi: boolean;
  sede: string | null;
}

interface ApiTimbratura {
  id: number;
  tipo: string;
  orario: string;
  sedeNome: string;
}

/* ═══════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════ */

function isoD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parseD(iso: string) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }

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
  if (ore <= 0) return "0h";
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${h}h`;
}

/* ═══════════════════════════════════════════
   Calcola ore per giorno dalle timbrature API
   ═══════════════════════════════════════════ */

function calcolaOrePerGiorno(timbrature: ApiTimbratura[]): Map<string, { ore: number; sede: string | null }> {
  const sorted = [...timbrature].sort((a, b) => a.orario.localeCompare(b.orario));
  const used = new Set<number>();
  const result = new Map<string, { ore: number; sede: string | null }>();

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].tipo !== "Entrata" || used.has(i)) continue;
    used.add(i);
    const entrata = sorted[i];

    let uscita: ApiTimbratura | null = null;
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].tipo === "Uscita" && !used.has(j)) {
        uscita = sorted[j];
        used.add(j);
        break;
      }
    }

    if (uscita) {
      const eTime = new Date(entrata.orario).getTime();
      const uTime = new Date(uscita.orario).getTime();
      const diff = Math.max(0, (uTime - eTime) / 3600000);
      const localDate = isoD(new Date(entrata.orario));

      const existing = result.get(localDate) || { ore: 0, sede: null };
      existing.ore += diff;
      if (!existing.sede) existing.sede = entrata.sedeNome;
      result.set(localDate, existing);
    }
  }

  for (const [key, value] of result) {
    result.set(key, { ...value, ore: Math.round(value.ore * 100) / 100 });
  }
  return result;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OrePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"settimana" | "mese">("settimana");

  const contratto = user?.tipoContratto ?? "Fisso";
  // Ore contrattuali — fetch from /api/me if needed, fallback
  const [oreContrattuali, setOreContrattuali] = useState(40);
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.oreSettimanali) setOreContrattuali(d.oreSettimanali);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Le Mie Ore</h1>
      </div>
      <div>
        <p className="mt-0.5 text-sm text-text-muted">{contratto === "Fisso" ? "Dipendente Fisso" : contratto} — {oreContrattuali}h/settimana</p>
      </div>

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

      {tab === "settimana" ? <TabSettimana oreContr={oreContrattuali} /> : <TabMese oreContr={oreContrattuali} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB SETTIMANA
   ═══════════════════════════════════════════ */

function TabSettimana({ oreContr }: { oreContr: number }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [timbrature, setTimbrature] = useState<ApiTimbratura[]>([]);
  const [loading, setLoading] = useState(true);

  const oggi = isoD(new Date());

  const monday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const sunday = useMemo(() => {
    const s = new Date(monday);
    s.setDate(s.getDate() + 6);
    return s;
  }, [monday]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timbrature?dataInizio=${isoD(monday)}&dataFine=${isoD(sunday)}`);
      if (res.ok) setTimbrature(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, [monday, sunday]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const oreMap = useMemo(() => calcolaOrePerGiorno(timbrature), [timbrature]);

  const days: DayHours[] = useMemo(() => {
    const result: DayHours[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const iso = isoD(d);
      const dayData = oreMap.get(iso);
      result.push({
        data: iso,
        label: `${GIORNI[i]} ${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`,
        ore: dayData?.ore ?? 0,
        isOggi: iso === oggi,
        sede: dayData?.sede ?? null,
      });
    }
    return result;
  }, [monday, oreMap, oggi]);

  const periodLabel = `Lun ${fmtShort(isoD(monday))} — Dom ${fmtShort(isoD(sunday))} ${sunday.getFullYear()}`;
  const oreLavorate = days.reduce((s, d) => s + d.ore, 0);
  const giorniLav = days.filter((d) => d.ore > 0).length;
  const diff = Math.round((oreLavorate - oreContr) * 10) / 10;
  const progress = Math.min((oreLavorate / oreContr) * 100, 100);
  const overContract = oreLavorate > oreContr;
  const maxOre = Math.max(...days.map((d) => d.ore), 1);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  if (oreLavorate === 0) return <><WeekNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} label={periodLabel} /><StatoVuoto /></>;

  return (
    <div className="flex flex-col gap-4">
      <WeekNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} label={periodLabel} />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Ore lavorate" value={fmtOreMin(oreLavorate)} accent="text-accent" />
        <MetricCard label="Ore contrattuali" value={`${oreContr}h`} accent="text-amber-400" />
        <MetricCard label="Differenza" value={`${diff > 0 ? "+" : ""}${fmtOreMin(Math.abs(diff))}`} accent={diff >= 0 ? "text-green-400" : "text-red-400"} />
        <MetricCard label="Giorni lavorati" value={`${giorniLav} / 5`} accent="text-foreground" />
      </div>

      <div className="rounded-xl border border-border bg-card-bg p-4">
        <p className="text-sm text-text-muted mb-2">
          <span className="font-semibold text-foreground">{fmtOreMin(oreLavorate)}</span> su <span className="font-semibold text-amber-400">{oreContr}h</span> contrattuali
        </p>
        <div className="h-3 rounded-full bg-sidebar-bg overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${overContract ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {overContract && (
          <p className="mt-1.5 text-xs text-amber-400">+{fmtOreMin(oreLavorate - oreContr)} oltre il contratto</p>
        )}
      </div>

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
            <p className={`text-base font-bold tabular-nums w-16 text-right ${d.ore > 0 ? "text-foreground" : "text-text-muted"}`}>
              {d.ore > 0 ? fmtOreMin(d.ore) : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB MESE
   ═══════════════════════════════════════════ */

function TabMese({ oreContr }: { oreContr: number }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [timbrature, setTimbrature] = useState<ApiTimbratura[]>([]);
  const [loading, setLoading] = useState(true);

  const meseDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const meseLabel = `${MESI[meseDate.getMonth()]} ${meseDate.getFullYear()}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fine = new Date(meseDate.getFullYear(), meseDate.getMonth() + 1, 0);
      const res = await fetch(`/api/timbrature?dataInizio=${isoD(meseDate)}&dataFine=${isoD(fine)}`);
      if (res.ok) setTimbrature(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, [meseDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { settimane, chartData, totOre, oreContrMese, diff, giorniLav, mediaOre, giornoMax, sedeFreq } = useMemo(() => {
    const oreMap = calcolaOrePerGiorno(timbrature);
    const daysInMonth = new Date(meseDate.getFullYear(), meseDate.getMonth() + 1, 0).getDate();

    const weeksMap = new Map<number, { num: number; label: string; ore: number; giorni: number }>();
    let totOre = 0;
    let giorniLav = 0;
    let giornoMax = { data: "", ore: 0 };
    const sediCount = new Map<string, number>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(meseDate.getFullYear(), meseDate.getMonth(), d);
      const iso = isoD(dt);
      const dayData = oreMap.get(iso);
      if (!dayData || dayData.ore === 0) continue;

      const mon = getMonday(dt);
      const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
      const weekNum = weeksMap.size + (weeksMap.has(isoD(mon).charCodeAt(0)) ? 0 : 0);
      const wKey = isoD(mon);

      if (!weeksMap.has(wKey as unknown as number)) {
        weeksMap.set(wKey as unknown as number, {
          num: weeksMap.size + 1,
          label: `${fmtShort(isoD(mon))} — ${fmtShort(isoD(sun))}`,
          ore: 0, giorni: 0,
        });
      }
      const w = weeksMap.get(wKey as unknown as number)!;
      w.ore += dayData.ore;
      w.giorni++;
      totOre += dayData.ore;
      giorniLav++;
      if (dayData.ore > giornoMax.ore) giornoMax = { data: iso, ore: dayData.ore };
      if (dayData.sede) sediCount.set(dayData.sede, (sediCount.get(dayData.sede) ?? 0) + 1);
    }

    const numSettimane = Math.max(weeksMap.size, 4);
    const oreContrMese = oreContr * numSettimane;
    const diff = Math.round((totOre - oreContrMese) * 10) / 10;
    const mediaOre = giorniLav > 0 ? Math.round((totOre / giorniLav) * 10) / 10 : 0;

    let sedeFreq = "—";
    let maxC = 0;
    sediCount.forEach((c, s) => { if (c > maxC) { maxC = c; sedeFreq = s; } });

    const settimane = [...weeksMap.values()].sort((a, b) => a.num - b.num);
    const chartData = settimane.map((w) => ({ name: `S${w.num}`, ore: Math.round(w.ore * 10) / 10 }));

    return { settimane, chartData, totOre: Math.round(totOre * 10) / 10, oreContrMese, diff, giorniLav, mediaOre, giornoMax, sedeFreq };
  }, [timbrature, meseDate, oreContr]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
        <button onClick={() => setMonthOffset((v) => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{meseLabel}</span>
        <button onClick={() => setMonthOffset((v) => v + 1)} disabled={monthOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {totOre === 0 ? <StatoVuoto /> : (
        <>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-card-bg p-5 text-center">
              <p className="text-sm text-text-muted">Ore lavorate</p>
              <p className="text-4xl font-bold text-accent tabular-nums mt-1">{fmtOreMin(totOre)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card-bg p-4 text-center">
                <p className="text-xs text-text-muted">Ore contrattuali</p>
                <p className="text-2xl font-bold text-amber-400 tabular-nums mt-1">{oreContrMese}h</p>
              </div>
              <div className="rounded-2xl border border-border bg-card-bg p-4 text-center">
                <p className="text-xs text-text-muted">Differenza</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {diff > 0 ? "+" : ""}{fmtOreMin(Math.abs(diff))}
                </p>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Ore per settimana</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="ore" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.ore > oreContr ? "#f59e0b" : "#3b82f6"} />
                    ))}
                    <LabelList dataKey="ore" position="top" // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${v}h`} style={{ fill: "#e4e4e7", fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {settimane.map((w) => {
              const wDiff = Math.round((w.ore - oreContr) * 10) / 10;
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

function WeekNav({ weekOffset, setWeekOffset, label }: { weekOffset: number; setWeekOffset: (fn: (v: number) => number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-card-bg border border-border px-2 py-1">
      <button onClick={() => setWeekOffset((v) => v - 1)} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold text-foreground text-center">{label}</span>
      <button onClick={() => setWeekOffset((v) => v + 1)} disabled={weekOffset >= 0} className="flex items-center justify-center w-12 h-12 rounded-lg text-text-muted active:bg-white/5 active:scale-[0.95] transition-all disabled:opacity-30">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

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
