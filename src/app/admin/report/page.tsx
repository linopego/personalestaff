"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

/* ═══════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════ */

type TipoContratto = "Fisso" | "Part-time" | "A chiamata";
type Sede = "La Casa dei Gelsi" | "Tenuta Villa Peggy's" | "Studios Club / TooLate";
type MainTab = "settimanale" | "mensile";
type SubTab = "dipendente" | "sede";

const SEDI: Sede[] = ["La Casa dei Gelsi", "Tenuta Villa Peggy's", "Studios Club / TooLate"];
const SEDE_COLORS: Record<Sede, string> = {
  "La Casa dei Gelsi": "#3b82f6",
  "Tenuta Villa Peggy's": "#f59e0b",
  "Studios Club / TooLate": "#10b981",
};
const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface Dip {
  nome: string;
  contratto: TipoContratto;
  oreContr: number; // settimanali
}

const DIPENDENTI: Dip[] = [
  { nome: "Marco Bianchi",     contratto: "Fisso",       oreContr: 40 },
  { nome: "Giulia Ferretti",   contratto: "Fisso",       oreContr: 40 },
  { nome: "Francesca Romano",  contratto: "Fisso",       oreContr: 40 },
  { nome: "Elena Galli",       contratto: "Fisso",       oreContr: 36 },
  { nome: "Alessandro Conti",  contratto: "Part-time",   oreContr: 24 },
  { nome: "Sara Colombo",      contratto: "Part-time",   oreContr: 20 },
  { nome: "Andrea Marino",     contratto: "Part-time",   oreContr: 24 },
  { nome: "Luca Moretti",      contratto: "A chiamata",  oreContr: 0 },
  { nome: "Chiara Greco",      contratto: "A chiamata",  oreContr: 0 },
];

/* ═══════════════════════════════════════════
   MOCK DATA GENERATORS
   ═══════════════════════════════════════════ */

// Deterministic "random" based on string seed
function seededHours(name: string, weekOffset: number, day: number, base: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  const seed = Math.abs(h + weekOffset * 100 + day * 7) % 100;
  if (base === 0) return seed < 30 ? Math.round((4 + (seed % 5)) * 10) / 10 : 0; // a chiamata
  const daily = base / 5;
  if (day >= 5) return seed < 25 ? Math.round((daily * 0.5) * 10) / 10 : 0; // weekend
  return Math.round((daily + (seed % 30 - 15) / 10) * 10) / 10;
}

function seededSede(name: string, weekOffset: number, day: number): Sede {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return SEDI[Math.abs(h + weekOffset * 13 + day * 3) % 3];
}

function getWeekLabel(offset: number): string {
  const d = new Date(2026, 3, 1); // 1 Apr 2026 is Wed
  const monday = new Date(d);
  monday.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getMonthLabel(offset: number): string {
  const d = new Date(2026, 3 + offset, 1);
  const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  return `${mesi[d.getMonth()]} ${d.getFullYear()}`;
}

/* ═══════════════════════════════════════════
   WEEKLY DATA
   ═══════════════════════════════════════════ */

function buildWeekData(weekOffset: number) {
  return DIPENDENTI.map((d) => {
    const ore = GIORNI.map((_, day) => seededHours(d.nome, weekOffset, day, d.oreContr));
    const sedi = GIORNI.map((_, day) => ore[day] > 0 ? seededSede(d.nome, weekOffset, day) : null);
    const totale = Math.round(ore.reduce((a, b) => a + b, 0) * 10) / 10;
    const diff = d.oreContr > 0 ? Math.round((totale - d.oreContr) * 10) / 10 : null;
    // Most frequent sede for the week
    const sedeCounts = new Map<Sede, number>();
    sedi.forEach((s) => { if (s) sedeCounts.set(s, (sedeCounts.get(s) || 0) + 1); });
    let topSede: Sede | null = null;
    let topCount = 0;
    sedeCounts.forEach((c, s) => { if (c > topCount) { topCount = c; topSede = s; } });
    return { ...d, ore, totale, diff, sede: topSede };
  });
}

/* ═══════════════════════════════════════════
   MONTHLY DATA
   ═══════════════════════════════════════════ */

function buildMonthData(monthOffset: number) {
  // 4 weeks in the month
  const weeks = [0, 1, 2, 3].map((w) => buildWeekData(monthOffset * 4 + w));

  const perDip = DIPENDENTI.map((d) => {
    let oreTotMese = 0;
    let giorniLav = 0;
    const sediCount = new Map<Sede, number>();
    for (const week of weeks) {
      const wd = week.find((x) => x.nome === d.nome)!;
      oreTotMese += wd.totale;
      wd.ore.forEach((h, day) => {
        if (h > 0) {
          giorniLav++;
          const sede = seededSede(d.nome, monthOffset * 4, day);
          sediCount.set(sede, (sediCount.get(sede) || 0) + 1);
        }
      });
    }
    oreTotMese = Math.round(oreTotMese * 10) / 10;
    const oreContrMese = d.oreContr > 0 ? d.oreContr * 4 : 0;
    const diff = oreContrMese > 0 ? Math.round((oreTotMese - oreContrMese) * 10) / 10 : null;
    const media = giorniLav > 0 ? Math.round((oreTotMese / giorniLav) * 10) / 10 : 0;
    // Top sede
    let topSede: Sede | null = null;
    let topC = 0;
    sediCount.forEach((c, s) => { if (c > topC) { topC = c; topSede = s; } });
    return { ...d, oreTotMese, oreContrMese, diff, giorniLav, media, sede: topSede };
  });

  const perSede = SEDI.map((sede) => {
    let oreTot = 0;
    const dipInSede = new Set<string>();
    for (const week of weeks) {
      for (const wd of week) {
        wd.ore.forEach((h, day) => {
          if (h > 0 && seededSede(wd.nome, monthOffset * 4, day) === sede) {
            oreTot += h;
            dipInSede.add(wd.nome);
          }
        });
      }
    }
    const nDip = dipInSede.size;
    return {
      sede,
      oreTot: Math.round(oreTot * 10) / 10,
      nDip,
      media: nDip > 0 ? Math.round((oreTot / nDip) * 10) / 10 : 0,
    };
  });

  // Weekly trend per sede
  const trend = [0, 1, 2, 3].map((w) => {
    const entry: Record<string, string | number> = { settimana: `Sett ${w + 1}` };
    for (const sede of SEDI) {
      let tot = 0;
      const week = weeks[w];
      for (const wd of week) {
        wd.ore.forEach((h, day) => {
          if (h > 0 && seededSede(wd.nome, monthOffset * 4, day) === sede) tot += h;
        });
      }
      entry[sede] = Math.round(tot * 10) / 10;
    }
    return entry;
  });

  return { perDip, perSede, trend };
}

/* ═══════════════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}h</span></p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function contrattoStyle(c: TipoContratto) {
  switch (c) {
    case "Fisso": return "bg-blue-500/10 text-blue-400";
    case "Part-time": return "bg-amber-500/10 text-amber-400";
    case "A chiamata": return "bg-purple-500/10 text-purple-400";
  }
}

function diffColor(v: number | null) {
  if (v === null) return "text-text-muted";
  return v >= 0 ? "text-green-400" : "text-red-400";
}

function diffLabel(v: number | null) {
  if (v === null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "h";
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function ReportPage() {
  const [mainTab, setMainTab] = useState<MainTab>("settimanale");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [subTab, setSubTab] = useState<SubTab>("dipendente");

  const weekData = useMemo(() => buildWeekData(weekOffset), [weekOffset]);
  const monthData = useMemo(() => buildMonthData(monthOffset), [monthOffset]);

  const weekTotals = useMemo(() => {
    const tots = GIORNI.map((_, day) =>
      Math.round(weekData.reduce((s, d) => s + d.ore[day], 0) * 10) / 10
    );
    const grand = Math.round(tots.reduce((a, b) => a + b, 0) * 10) / 10;
    return { tots, grand };
  }, [weekData]);

  // Chart data for weekly comparison
  const weekChartData = useMemo(() =>
    weekData.map((d) => ({
      nome: d.nome.split(" ")[1] || d.nome.split(" ")[0], // cognome
      effettive: d.totale,
      contrattuali: d.oreContr,
    })),
  [weekData]);

  // Chart data for monthly horizontal bars
  const monthBarData = useMemo(() =>
    [...monthData.perDip]
      .sort((a, b) => b.oreTotMese - a.oreTotMese)
      .map((d) => ({ nome: d.nome.split(" ")[1] || d.nome, ore: d.oreTotMese })),
  [monthData]);

  const handleExport = (tipo: string) => alert(`Funzione di esportazione ${tipo} in arrivo`);

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? "bg-accent text-white" : "text-text-muted hover:text-foreground hover:bg-white/5"
    }`;

  const subTabCls = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      active ? "bg-white/10 text-foreground" : "text-text-muted hover:text-foreground"
    }`;

  const navBtn = "rounded-lg border border-border p-1.5 text-text-muted hover:text-foreground hover:bg-white/5 transition-colors";

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report e Statistiche</h1>
          <p className="mt-1 text-sm text-text-muted">Analisi ore lavorate per dipendente e sede</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport("PDF")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
            <DocIcon className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => handleExport("Excel")} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
            <TableIcon className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="mb-6 flex gap-2">
        <button className={tabCls(mainTab === "settimanale")} onClick={() => setMainTab("settimanale")}>
          Riepilogo Settimanale
        </button>
        <button className={tabCls(mainTab === "mensile")} onClick={() => setMainTab("mensile")}>
          Riepilogo Mensile
        </button>
      </div>

      {/* ════════════════════════════════════════════
          TAB: SETTIMANALE
          ════════════════════════════════════════════ */}
      {mainTab === "settimanale" && (
        <>
          {/* Week navigator */}
          <div className="mb-4 flex items-center gap-3">
            <button className={navBtn} onClick={() => setWeekOffset((p) => p - 1)}>
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">
              {getWeekLabel(weekOffset)}
            </span>
            <button className={navBtn} onClick={() => setWeekOffset((p) => p + 1)}>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card-bg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                    <th className="px-4 py-3 font-medium sticky left-0 bg-card-bg z-10">Dipendente</th>
                    <th className="px-3 py-3 font-medium">Contratto</th>
                    <th className="px-3 py-3 font-medium">Sede</th>
                    {GIORNI.map((g) => <th key={g} className="px-3 py-3 font-medium text-center w-16">{g}</th>)}
                    <th className="px-3 py-3 font-medium text-right">Totale</th>
                    <th className="px-3 py-3 font-medium text-right">Diff.</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((d) => (
                    <tr key={d.nome} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground sticky left-0 bg-card-bg whitespace-nowrap">{d.nome}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${contrattoStyle(d.contratto)}`}>{d.contratto}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-text-muted whitespace-nowrap">{d.sede ?? "—"}</td>
                      {d.ore.map((h, i) => (
                        <td key={i} className="px-3 py-2.5 text-center text-sm font-mono">
                          {h > 0 ? <span className="text-foreground">{h}</span> : <span className="text-text-muted/40">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right text-sm font-mono font-semibold text-foreground">{d.totale}h</td>
                      <td className={`px-3 py-2.5 text-right text-sm font-mono font-semibold ${diffColor(d.diff)}`}>{diffLabel(d.diff)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-border bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-sm font-bold text-foreground sticky left-0 bg-card-bg" colSpan={3}>Totale giornaliero</td>
                    {weekTotals.tots.map((t, i) => (
                      <td key={i} className="px-3 py-2.5 text-center text-sm font-mono font-bold text-accent">{t > 0 ? t : "—"}</td>
                    ))}
                    <td className="px-3 py-2.5 text-right text-sm font-mono font-bold text-accent">{weekTotals.grand}h</td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart: effettive vs contrattuali */}
          <div className="rounded-xl border border-border bg-card-bg p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Ore effettive vs contrattuali</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekChartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="nome" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} unit="h" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="effettive" name="Ore effettive" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="contrattuali" name="Ore contrattuali" fill="#2a2d3e" stroke="#71717a" strokeWidth={1} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════
          TAB: MENSILE
          ════════════════════════════════════════════ */}
      {mainTab === "mensile" && (
        <>
          {/* Month navigator */}
          <div className="mb-4 flex items-center gap-3">
            <button className={navBtn} onClick={() => setMonthOffset((p) => p - 1)}>
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">
              {getMonthLabel(monthOffset)}
            </span>
            <button className={navBtn} onClick={() => setMonthOffset((p) => p + 1)}>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Sub tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-sidebar-bg p-1 w-fit">
            <button className={subTabCls(subTab === "dipendente")} onClick={() => setSubTab("dipendente")}>Per Dipendente</button>
            <button className={subTabCls(subTab === "sede")} onClick={() => setSubTab("sede")}>Per Sede</button>
          </div>

          {/* ── Per Dipendente ── */}
          {subTab === "dipendente" && (
            <>
              {(["Fisso", "Part-time", "A chiamata"] as TipoContratto[]).map((tipo) => {
                const dips = monthData.perDip.filter((d) => d.contratto === tipo);
                if (dips.length === 0) return null;
                return (
                  <div key={tipo} className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${contrattoStyle(tipo)}`}>{tipo}</span>
                      <span className="text-xs text-text-muted">{dips.length} dipendenti</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                              <th className="px-4 py-3 font-medium">Dipendente</th>
                              <th className="px-3 py-3 font-medium">Sede freq.</th>
                              <th className="px-3 py-3 font-medium text-right">Ore mese</th>
                              <th className="px-3 py-3 font-medium text-right">Ore contr.</th>
                              <th className="px-3 py-3 font-medium text-right">Diff.</th>
                              <th className="px-3 py-3 font-medium text-right">Giorni lav.</th>
                              <th className="px-3 py-3 font-medium text-right">Media/gg</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dips.map((d) => (
                              <tr key={d.nome} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-2.5 text-sm font-medium text-foreground">{d.nome}</td>
                                <td className="px-3 py-2.5 text-xs text-text-muted">{d.sede ?? "—"}</td>
                                <td className="px-3 py-2.5 text-right text-sm font-mono font-semibold text-foreground">{d.oreTotMese}h</td>
                                <td className="px-3 py-2.5 text-right text-sm font-mono text-text-muted">{d.oreContrMese > 0 ? `${d.oreContrMese}h` : "—"}</td>
                                <td className={`px-3 py-2.5 text-right text-sm font-mono font-semibold ${diffColor(d.diff)}`}>{diffLabel(d.diff)}</td>
                                <td className="px-3 py-2.5 text-right text-sm font-mono text-foreground">{d.giorniLav}</td>
                                <td className="px-3 py-2.5 text-right text-sm font-mono text-foreground">{d.media}h</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Horizontal bar chart */}
              <div className="mt-6 rounded-xl border border-border bg-card-bg p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Ore totali per dipendente — {getMonthLabel(monthOffset)}</h3>
                <ResponsiveContainer width="100%" height={Math.max(monthBarData.length * 40, 200)}>
                  <BarChart data={monthBarData} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} unit="h" />
                    <YAxis dataKey="nome" type="category" width={110} tick={{ fill: "#71717a", fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="ore" name="Ore mese" radius={[0, 4, 4, 0]}>
                      {monthBarData.map((_, i) => (
                        <Cell key={i} fill={i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#f59e0b" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── Per Sede ── */}
          {subTab === "sede" && (
            <>
              {/* Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                {monthData.perSede.map((s) => (
                  <div key={s.sede} className="rounded-xl border border-border bg-card-bg p-5" style={{ borderLeftColor: SEDE_COLORS[s.sede], borderLeftWidth: 3 }}>
                    <p className="text-sm font-semibold text-foreground">{s.sede}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold" style={{ color: SEDE_COLORS[s.sede] }}>{s.oreTot}h</p>
                        <p className="text-[10px] text-text-muted">Ore totali</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{s.nDip}</p>
                        <p className="text-[10px] text-text-muted">Dipendenti</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{s.media}h</p>
                        <p className="text-[10px] text-text-muted">Media/dip</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line chart trend */}
              <div className="rounded-xl border border-border bg-card-bg p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Andamento settimanale per sede — {getMonthLabel(monthOffset)}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthData.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                    <XAxis dataKey="settimana" tick={{ fill: "#71717a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} unit="h" />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {SEDI.map((sede) => (
                      <Line
                        key={sede}
                        type="monotone"
                        dataKey={sede}
                        name={sede}
                        stroke={SEDE_COLORS[sede]}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: SEDE_COLORS[sede], stroke: "#1c1e2e", strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
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

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M21.375 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M12 17.25v-5.25" />
    </svg>
  );
}
