"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ═══════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════ */

type MainTab = "settimanale" | "mensile";
type SubTab = "dipendente" | "sede";

const SEDE_COLORS: Record<string, string> = {
  "La Casa dei Gelsi": "#f59e0b",
  "Tenuta Villa Peggy's": "#10b981",
  "Studios Club / TooLate": "#3b82f6",
};
const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface ApiTimb {
  id: number; userId: number; tipo: string; orario: string;
  dipNome: string; dipCognome: string; sedeNome: string;
}

interface DipApi {
  id: number; nome: string; cognome: string; tipoContratto: string; oreSettimanali: number; attivo: boolean;
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function isoD(d: Date) { return d.toISOString().slice(0, 10); }

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function fmtWeek(mon: Date) {
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
  const f = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${f(mon)} – ${f(sun)}`;
}

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function calcolaOre(entrata: string, uscita: string) {
  let diff = (new Date(uscita).getTime() - new Date(entrata).getTime()) / 3600000;
  if (diff < 0) diff += 24;
  return Math.round(diff * 100) / 100;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function ReportPage() {
  const [mainTab, setMainTab] = useState<MainTab>("settimanale");
  const [subTab, setSubTab] = useState<SubTab>("dipendente");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const [dipendenti, setDipendenti] = useState<DipApi[]>([]);
  const [timbrature, setTimbrature] = useState<ApiTimb[]>([]);
  const [loading, setLoading] = useState(true);

  // Periodi
  const monday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);

  const meseDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const meseFine = useMemo(() => new Date(meseDate.getFullYear(), meseDate.getMonth() + 1, 0), [meseDate]);

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dataInizio = mainTab === "settimanale" ? isoD(monday) : isoD(meseDate);
      const dataFine = mainTab === "settimanale" ? isoD(sunday) : isoD(meseFine);
      const [dipRes, timbRes] = await Promise.all([
        fetch("/api/dipendenti"),
        fetch(`/api/timbrature?dataInizio=${dataInizio}&dataFine=${dataFine}`),
      ]);
      if (dipRes.ok) setDipendenti(await dipRes.json());
      if (timbRes.ok) setTimbrature(await timbRes.json());
    } catch { /* */ }
    setLoading(false);
  }, [mainTab, monday, sunday, meseDate, meseFine]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Dati settimanali ──
  const weekData = useMemo(() => {
    if (mainTab !== "settimanale") return [];
    const dipMap = new Map(dipendenti.map((d) => [d.id, d]));
    const result: { id: number; nome: string; contratto: string; oreContr: number; ore: number[]; totale: number; diff: number }[] = [];

    for (const dip of dipendenti) {
      if (!dip.attivo) continue;
      const ore = Array(7).fill(0);
      const dipTimb = timbrature.filter((t) => t.userId === dip.id);

      // Raggruppa per giorno
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);
        const dayStr = isoD(day);
        const dayTimb = dipTimb.filter((t) => t.orario.startsWith(dayStr));
        const entrate = dayTimb.filter((t) => t.tipo === "Entrata").sort((a, b) => a.orario.localeCompare(b.orario));
        const uscite = dayTimb.filter((t) => t.tipo === "Uscita").sort((a, b) => a.orario.localeCompare(b.orario));
        for (let j = 0; j < entrate.length; j++) {
          if (uscite[j]) ore[i] += calcolaOre(entrate[j].orario, uscite[j].orario);
        }
        ore[i] = Math.round(ore[i] * 10) / 10;
      }
      const totale = Math.round(ore.reduce((s, h) => s + h, 0) * 10) / 10;
      result.push({ id: dip.id, nome: `${dip.nome} ${dip.cognome}`, contratto: dip.tipoContratto, oreContr: dip.oreSettimanali, ore, totale, diff: Math.round((totale - dip.oreSettimanali) * 10) / 10 });
    }
    return result;
  }, [mainTab, dipendenti, timbrature, monday]);

  // ── Dati mensili per dipendente ──
  const monthDipData = useMemo(() => {
    if (mainTab !== "mensile") return [];
    return dipendenti.filter((d) => d.attivo).map((dip) => {
      const dipTimb = timbrature.filter((t) => t.userId === dip.id);
      const entrate = dipTimb.filter((t) => t.tipo === "Entrata").sort((a, b) => a.orario.localeCompare(b.orario));
      const uscite = dipTimb.filter((t) => t.tipo === "Uscita").sort((a, b) => a.orario.localeCompare(b.orario));
      let totOre = 0;
      const giorni = new Set<string>();
      for (let j = 0; j < entrate.length; j++) {
        giorni.add(entrate[j].orario.slice(0, 10));
        if (uscite[j]) totOre += calcolaOre(entrate[j].orario, uscite[j].orario);
      }
      totOre = Math.round(totOre * 10) / 10;
      const oreContrMese = dip.oreSettimanali * 4;
      return {
        nome: `${dip.nome} ${dip.cognome}`, contratto: dip.tipoContratto,
        oreTotMese: totOre, oreContrMese,
        diff: Math.round((totOre - oreContrMese) * 10) / 10,
        giorniLav: giorni.size,
        media: giorni.size > 0 ? Math.round((totOre / giorni.size) * 10) / 10 : 0,
      };
    });
  }, [mainTab, dipendenti, timbrature]);

  // ── Dati mensili per sede ──
  const monthSedeData = useMemo(() => {
    if (mainTab !== "mensile") return { sedi: [] as { sede: string; oreTot: number; nDip: number; media: number }[], trend: [] as Record<string, unknown>[] };
    const sedeMap = new Map<string, { ore: number; dips: Set<number> }>();
    const entrate = timbrature.filter((t) => t.tipo === "Entrata").sort((a, b) => a.orario.localeCompare(b.orario));
    const uscite = timbrature.filter((t) => t.tipo === "Uscita").sort((a, b) => a.orario.localeCompare(b.orario));

    for (const e of entrate) {
      if (!sedeMap.has(e.sedeNome)) sedeMap.set(e.sedeNome, { ore: 0, dips: new Set() });
      const s = sedeMap.get(e.sedeNome)!;
      s.dips.add(e.userId);
      const u = uscite.find((u) => u.userId === e.userId && u.orario > e.orario && u.orario.slice(0, 10) === e.orario.slice(0, 10));
      if (u) s.ore += calcolaOre(e.orario, u.orario);
    }

    const sediResult = [...sedeMap.entries()].map(([sede, data]) => ({
      sede, oreTot: Math.round(data.ore * 10) / 10, nDip: data.dips.size,
      media: data.dips.size > 0 ? Math.round((data.ore / data.dips.size) * 10) / 10 : 0,
    }));

    return { sedi: sediResult, trend: [] };
  }, [mainTab, timbrature]);

  const handleExport = (tipo: string) => alert(`Funzione di esportazione ${tipo} in arrivo`);

  const tabCls = (active: boolean) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "bg-accent text-white" : "text-text-muted hover:text-foreground hover:bg-white/5"}`;
  const subTabCls = (active: boolean) => `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${active ? "bg-white/10 text-foreground" : "text-text-muted hover:text-foreground"}`;
  const navBtn = "rounded-lg border border-border p-1.5 text-text-muted hover:text-foreground hover:bg-white/5 transition-colors";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  // Totali giornalieri settimanali
  const dailyTotals = GIORNI.map((_, i) => Math.round(weekData.reduce((s, d) => s + d.ore[i], 0) * 10) / 10);

  // Chart data settimanale
  const weekChartData = weekData.map((d) => ({ nome: d.nome.split(" ")[1] || d.nome, effettive: d.totale, contrattuali: d.oreContr }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report e Statistiche</h1>
          <p className="mt-1 text-sm text-text-muted">Analisi ore lavorate per dipendente e sede</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport("PDF")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">PDF</button>
          <button onClick={() => handleExport("Excel")} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">Excel</button>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <button className={tabCls(mainTab === "settimanale")} onClick={() => setMainTab("settimanale")}>Riepilogo Settimanale</button>
        <button className={tabCls(mainTab === "mensile")} onClick={() => setMainTab("mensile")}>Riepilogo Mensile</button>
      </div>

      {/* ══ SETTIMANALE ══ */}
      {mainTab === "settimanale" && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <button className={navBtn} onClick={() => setWeekOffset((p) => p - 1)}><ChevronLeftIcon className="h-4 w-4" /></button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{fmtWeek(monday)}</span>
            <button className={navBtn} onClick={() => setWeekOffset((p) => p + 1)}><ChevronRightIcon className="h-4 w-4" /></button>
          </div>

          <div className="rounded-xl border border-border bg-card-bg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                    <th className="px-4 py-3 font-medium sticky left-0 bg-card-bg z-10">Dipendente</th>
                    <th className="px-3 py-3 font-medium">Contratto</th>
                    {GIORNI.map((g) => <th key={g} className="px-3 py-3 font-medium text-center w-16">{g}</th>)}
                    <th className="px-3 py-3 font-medium text-right">Totale</th>
                    <th className="px-3 py-3 font-medium text-right">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground sticky left-0 bg-card-bg whitespace-nowrap">{d.nome}</td>
                      <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${d.contratto === "Fisso" ? "bg-blue-500/10 text-blue-400" : d.contratto === "Part-time" ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"}`}>{d.contratto}</span></td>
                      {d.ore.map((h, i) => <td key={i} className={`px-3 py-2.5 text-center text-sm font-mono ${h > 0 ? "text-foreground" : "text-text-muted"}`}>{h > 0 ? h : "—"}</td>)}
                      <td className="px-3 py-2.5 text-right text-sm font-mono font-semibold text-foreground">{d.totale}h</td>
                      <td className={`px-3 py-2.5 text-right text-sm font-mono font-semibold ${d.diff >= 0 ? "text-green-400" : "text-red-400"}`}>{d.diff > 0 ? "+" : ""}{d.diff}h</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-sidebar-bg">
                    <td className="px-4 py-2.5 text-sm font-bold text-foreground sticky left-0 bg-sidebar-bg" colSpan={2}>Totale</td>
                    {dailyTotals.map((t, i) => <td key={i} className="px-3 py-2.5 text-center text-sm font-mono font-bold text-foreground">{t > 0 ? t : "—"}</td>)}
                    <td className="px-3 py-2.5 text-right text-sm font-mono font-bold text-accent">{Math.round(weekData.reduce((s, d) => s + d.totale, 0) * 10) / 10}h</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {weekChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card-bg p-5 mb-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Ore effettive vs contrattuali</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weekChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                  <XAxis dataKey="nome" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} unit="h" />
                  <Tooltip contentStyle={{ background: "#161825", border: "1px solid #2a2d3e", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="effettive" name="Ore effettive" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="contrattuali" name="Ore contrattuali" fill="#f59e0b" opacity={0.4} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* ══ MENSILE ══ */}
      {mainTab === "mensile" && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <button className={navBtn} onClick={() => setMonthOffset((p) => p - 1)}><ChevronLeftIcon className="h-4 w-4" /></button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{MESI[meseDate.getMonth()]} {meseDate.getFullYear()}</span>
            <button className={navBtn} onClick={() => setMonthOffset((p) => p + 1)}><ChevronRightIcon className="h-4 w-4" /></button>
          </div>

          <div className="mb-4 flex gap-2">
            <button className={subTabCls(subTab === "dipendente")} onClick={() => setSubTab("dipendente")}>Per Dipendente</button>
            <button className={subTabCls(subTab === "sede")} onClick={() => setSubTab("sede")}>Per Sede</button>
          </div>

          {subTab === "dipendente" && (
            <>
              {["Fisso", "Part-time", "A chiamata"].map((tipo) => {
                const group = monthDipData.filter((d) => d.contratto === tipo);
                if (group.length === 0) return null;
                return (
                  <div key={tipo} className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1">{tipo}</p>
                    <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                            <th className="px-3 py-3 font-medium">Dipendente</th>
                            <th className="px-3 py-3 font-medium text-right">Ore mese</th>
                            <th className="px-3 py-3 font-medium text-right">Ore contr.</th>
                            <th className="px-3 py-3 font-medium text-right">+/-</th>
                            <th className="px-3 py-3 font-medium text-right">Giorni</th>
                            <th className="px-3 py-3 font-medium text-right">Media/gg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((d) => (
                            <tr key={d.nome} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                              <td className="px-3 py-2.5 text-sm font-medium text-foreground">{d.nome}</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono font-semibold text-foreground">{d.oreTotMese}h</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-amber-400">{d.oreContrMese > 0 ? `${d.oreContrMese}h` : "—"}</td>
                              <td className={`px-3 py-2.5 text-right text-sm font-mono font-semibold ${d.diff >= 0 ? "text-green-400" : "text-red-400"}`}>{d.diff > 0 ? "+" : ""}{d.diff}h</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-text-muted">{d.giorniLav}</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-text-muted">{d.media}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {subTab === "sede" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {monthSedeData.sedi.map((s) => (
                  <div key={s.sede} className="rounded-xl border bg-card-bg p-5" style={{ borderLeftColor: SEDE_COLORS[s.sede] ?? "#71717a", borderLeftWidth: 3 }}>
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
                        <p className="text-xl font-bold text-text-muted">{s.media}h</p>
                        <p className="text-[10px] text-text-muted">Media/dip</p>
                      </div>
                    </div>
                  </div>
                ))}
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
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
}
