"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ─── Types ─── */

interface Timbratura {
  id: number;
  userId: number;
  sedeId: number;
  tipo: string;
  orario: string; // ISO string from JSON
  lat: number;
  lng: number;
  dipNome: string;
  dipCognome: string;
  sedeNome: string;
  modificataManualmente: boolean;
  noteModifica: string | null;
}

interface Dipendente {
  id: number;
  nome: string;
  cognome: string;
  attivo: boolean;
}

interface DashboardData {
  stats: {
    dipendentiAttivi: number;
    oreLavorateOggi: number;
    inSedeAdesso: number;
    oreMeseCorrente: number;
  };
  barData: { giorno: string; [sede: string]: number | string }[];
  lineData: { settimana: string; ore: number }[];
  pieData: { name: string; value: number }[];
  recentTimbrature: Timbratura[];
}

/* ─── Constants ─── */

const SEDI_COLORS: Record<string, string> = {
  "La Casa dei Gelsi": "#3b82f6",
  "Tenuta Villa Peggy's": "#f59e0b",
  "Studios Club / TooLate": "#10b981",
};

const SEDI_NAMES = Object.keys(SEDI_COLORS);

const GIORNI_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/* ─── Date helpers ─── */

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/* ─── Hour-pair calculation ─── */

/**
 * Given a list of timbrature (sorted descending by orario, as the API returns),
 * pair each Entrata with the next Uscita for the same user+sede and return total hours.
 */
function calcolaOre(timbratureList: Timbratura[]): number {
  // Group by userId
  const byUser: Record<number, Timbratura[]> = {};
  for (const t of timbratureList) {
    if (!byUser[t.userId]) byUser[t.userId] = [];
    byUser[t.userId].push(t);
  }

  let totalMs = 0;
  for (const records of Object.values(byUser)) {
    // Sort ascending by orario for pairing
    const sorted = [...records].sort(
      (a, b) => new Date(a.orario).getTime() - new Date(b.orario).getTime()
    );
    let entrata: Date | null = null;
    for (const r of sorted) {
      if (r.tipo === "Entrata") {
        entrata = new Date(r.orario);
      } else if (r.tipo === "Uscita" && entrata) {
        totalMs += new Date(r.orario).getTime() - entrata.getTime();
        entrata = null;
      }
    }
  }
  return Math.round((totalMs / 3600000) * 10) / 10;
}

/**
 * Count employees who clocked in today but have no matching Uscita.
 */
function countInSedeAdesso(todayTimbrature: Timbratura[]): number {
  const byUser: Record<number, { entrata: boolean; uscita: boolean }> = {};
  for (const t of todayTimbrature) {
    if (!byUser[t.userId]) byUser[t.userId] = { entrata: false, uscita: false };
    if (t.tipo === "Entrata") byUser[t.userId].entrata = true;
    if (t.tipo === "Uscita") byUser[t.userId].uscita = true;
  }
  return Object.values(byUser).filter((u) => u.entrata && !u.uscita).length;
}

/* ─── Chart data builders ─── */

/**
 * Bar chart: ore per sede per ciascuno degli ultimi 7 giorni (oggi incluso).
 */
function buildBarData(
  monthlyTimbrature: Timbratura[],
  today: Date
): { giorno: string; [sede: string]: number | string }[] {
  const result: { giorno: string; [sede: string]: number | string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = toDateString(d);
    const label = GIORNI_LABELS[d.getDay()];

    const dayTimbrature = monthlyTimbrature.filter((t) => {
      return toDateString(new Date(t.orario)) === dayStr;
    });

    const entry: { giorno: string; [sede: string]: number | string } = {
      giorno: label,
    };

    for (const sede of SEDI_NAMES) {
      const sedeTimbrature = dayTimbrature.filter((t) => t.sedeNome === sede);
      entry[sede] = calcolaOre(sedeTimbrature);
    }

    result.push(entry);
  }

  return result;
}

/**
 * Line chart: total ore per week for the current month (up to 5 weeks).
 */
function buildLineData(
  monthlyTimbrature: Timbratura[],
  monthStart: Date
): { settimana: string; ore: number }[] {
  // Divide the month into ISO weeks relative to the month start
  const weeks: { label: string; timbrature: Timbratura[] }[] = [];

  // Find the Monday of the week containing monthStart
  const firstDay = new Date(monthStart);
  const dayOfWeek = firstDay.getDay(); // 0=Sun
  // Adjust so week starts on Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstDay.setDate(firstDay.getDate() + mondayOffset);

  for (let w = 0; w < 5; w++) {
    const weekStart = new Date(firstDay);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekTimbrature = monthlyTimbrature.filter((t) => {
      const d = new Date(t.orario);
      return d >= weekStart && d <= weekEnd;
    });

    if (weekTimbrature.length > 0) {
      weeks.push({ label: `Sett ${w + 1}`, timbrature: weekTimbrature });
    }
  }

  // If we have no weeks from filtering, create 4 empty placeholder weeks
  if (weeks.length === 0) {
    return [1, 2, 3, 4].map((n) => ({ settimana: `Sett ${n}`, ore: 0 }));
  }

  return weeks.map((w) => ({
    settimana: w.label,
    ore: calcolaOre(w.timbrature),
  }));
}

/**
 * Pie chart: ore per sede this month.
 */
function buildPieData(
  monthlyTimbrature: Timbratura[]
): { name: string; value: number }[] {
  return SEDI_NAMES.map((sede) => {
    const sedeTimbrature = monthlyTimbrature.filter(
      (t) => t.sedeNome === sede
    );
    return { name: sede, value: calcolaOre(sedeTimbrature) };
  }).filter((entry) => entry.value > 0);
}

/* ─── Data fetching ─── */

async function fetchDashboardData(): Promise<DashboardData> {
  const today = new Date();
  const todayStr = toDateString(today);
  const monthStartStr = toDateString(startOfMonth(today));
  const monthEndStr = toDateString(endOfMonth(today));

  const [dipendentiRes, todayTimbRes, monthTimbRes] = await Promise.all([
    fetch("/api/dipendenti"),
    fetch(`/api/timbrature?dataInizio=${todayStr}&dataFine=${todayStr}`),
    fetch(
      `/api/timbrature?dataInizio=${monthStartStr}&dataFine=${monthEndStr}`
    ),
  ]);

  const [dipendenti, todayTimbrature, monthlyTimbrature]: [
    Dipendente[],
    Timbratura[],
    Timbratura[],
  ] = await Promise.all([
    dipendentiRes.json(),
    todayTimbRes.json(),
    monthTimbRes.json(),
  ]);

  const dipendentiAttivi = dipendenti.filter((d) => d.attivo).length;
  const oreLavorateOggi = calcolaOre(todayTimbrature);
  const inSedeAdesso = countInSedeAdesso(todayTimbrature);
  const oreMeseCorrente = calcolaOre(monthlyTimbrature);

  const barData = buildBarData(monthlyTimbrature, today);
  const lineData = buildLineData(monthlyTimbrature, startOfMonth(today));
  const pieData = buildPieData(monthlyTimbrature);

  // Last 10 timbrature from today (API already returns desc by orario)
  const recentTimbrature = todayTimbrature.slice(0, 10);

  return {
    stats: { dipendentiAttivi, oreLavorateOggi, inSedeAdesso, oreMeseCorrente },
    barData,
    lineData,
    pieData,
    recentTimbrature,
  };
}

/* ─── Tooltip custom ─── */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}h</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Loading spinner ─── */

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
    </div>
  );
}

/* ─── Dashboard ─── */

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Caricamento…</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) return null;

  const { stats, barData, lineData, pieData, recentTimbrature } = data;

  const now = new Date();
  const meseAnno = now.toLocaleString("it-IT", { month: "long", year: "numeric" });
  const meseAnnoLabel =
    meseAnno.charAt(0).toUpperCase() + meseAnno.slice(1);

  const statsCards = [
    {
      name: "Dipendenti attivi",
      value: String(stats.dipendentiAttivi),
      sub: "dipendenti attivi",
      icon: UsersIcon,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      name: "Ore lavorate oggi",
      value: String(stats.oreLavorateOggi),
      sub: "ore totali oggi",
      icon: ClockIcon,
      accent: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      name: "In sede adesso",
      value: String(stats.inSedeAdesso),
      sub: "presenti in questo momento",
      icon: BuildingIcon,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      name: "Ore mese corrente",
      value: stats.oreMeseCorrente.toLocaleString("it-IT"),
      sub: "ore lavorate questo mese",
      icon: CalendarIcon,
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">
          Panoramica presenze — {meseAnnoLabel}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((s) => (
          <div
            key={s.name}
            className="flex items-start gap-4 rounded-xl border border-border bg-card-bg p-5"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.bg}`}
            >
              <s.icon className={`h-5 w-5 ${s.accent}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">{s.name}</p>
              <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grafici riga 1: barre + linee ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ore per sede — ultimi 7 giorni */}
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Ore lavorate per sede — ultimi 7 giorni
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="giorno" tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 12 }} unit="h" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }} />
              <Bar dataKey="La Casa dei Gelsi" fill={SEDI_COLORS["La Casa dei Gelsi"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Tenuta Villa Peggy's" fill={SEDI_COLORS["Tenuta Villa Peggy's"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Studios Club / TooLate" fill={SEDI_COLORS["Studios Club / TooLate"]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Andamento settimanale */}
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Andamento ore — ultime 4 settimane
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="settimana" tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 12 }} unit="h" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="ore"
                name="Ore totali"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#3b82f6", stroke: "#1c1e2e", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Grafici riga 2: torta + tabella ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Distribuzione ore per sede */}
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Distribuzione ore per sede — mese corrente
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) =>
                  `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "#71717a" }}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEDI_COLORS[entry.name as keyof typeof SEDI_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}h`, "Ore"]}
                contentStyle={{
                  background: "#161825",
                  border: "1px solid #2a2d3e",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                itemStyle={{ color: "#e4e4e7" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legenda custom */}
          <div className="mt-2 flex justify-center gap-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      SEDI_COLORS[entry.name as keyof typeof SEDI_COLORS],
                  }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Tabella timbrature in tempo reale */}
        <div className="rounded-xl border border-border bg-card-bg lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Ultime timbrature in tempo reale
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              Live
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3 font-medium">Dipendente</th>
                  <th className="px-5 py-3 font-medium">Sede</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Orario</th>
                </tr>
              </thead>
              <tbody>
                {recentTimbrature.map((t) => {
                  const orario = new Date(t.orario).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const nomeCompleto = `${t.dipNome} ${t.dipCognome}`;
                  const iniziali = `${t.dipNome[0] ?? ""}${t.dipCognome[0] ?? ""}`;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                            {iniziali}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {nomeCompleto}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-text-muted">
                        {t.sedeNome}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            t.tipo === "Entrata"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {t.tipo === "Entrata" ? "↓" : "↑"} {t.tipo}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-foreground">
                        {orario}
                      </td>
                    </tr>
                  );
                })}
                {recentTimbrature.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-text-muted">
                      Nessuna timbratura oggi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─── */

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
