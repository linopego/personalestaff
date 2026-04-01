"use client";

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

/* ─── Dati mock ─── */

const stats = [
  {
    name: "Dipendenti attivi",
    value: "47",
    sub: "su 52 totali",
    icon: UsersIcon,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    name: "Ore lavorate oggi",
    value: "186.5",
    sub: "+12% vs ieri",
    icon: ClockIcon,
    accent: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    name: "In sede adesso",
    value: "34",
    sub: "72% del personale",
    icon: BuildingIcon,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    name: "Ore mese corrente",
    value: "3.842",
    sub: "obiettivo 5.200",
    icon: CalendarIcon,
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const SEDI_COLORS = {
  "Milano Centro": "#3b82f6",
  "Milano Nord": "#f59e0b",
  Monza: "#10b981",
};

const giorni = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const barData = giorni.map((g, i) => ({
  giorno: g,
  "Milano Centro": [42, 45, 40, 46, 44, 12, 0][i],
  "Milano Nord": [30, 28, 32, 29, 31, 8, 0][i],
  Monza: [22, 24, 20, 23, 25, 6, 0][i],
}));

const lineData = [
  { settimana: "Sett 1", ore: 920 },
  { settimana: "Sett 2", ore: 985 },
  { settimana: "Sett 3", ore: 1012 },
  { settimana: "Sett 4", ore: 925 },
];

const pieData = [
  { name: "Milano Centro", value: 1680 },
  { name: "Milano Nord", value: 1200 },
  { name: "Monza", value: 962 },
];

const timbrature = [
  { dipendente: "Marco Bianchi", sede: "Milano Centro", tipo: "Entrata", orario: "08:02", turno: "8h" },
  { dipendente: "Giulia Ferretti", sede: "Milano Nord", tipo: "Entrata", orario: "08:05", turno: "8h" },
  { dipendente: "Alessandro Conti", sede: "Monza", tipo: "Entrata", orario: "08:10", turno: "6h" },
  { dipendente: "Francesca Romano", sede: "Milano Centro", tipo: "Entrata", orario: "08:15", turno: "8h" },
  { dipendente: "Luca Moretti", sede: "Milano Nord", tipo: "Uscita", orario: "08:18", turno: "8h" },
  { dipendente: "Sara Colombo", sede: "Milano Centro", tipo: "Entrata", orario: "08:22", turno: "4h" },
  { dipendente: "Davide Ricci", sede: "Monza", tipo: "Uscita", orario: "08:25", turno: "8h" },
  { dipendente: "Elena Galli", sede: "Milano Nord", tipo: "Entrata", orario: "08:30", turno: "8h" },
  { dipendente: "Andrea Marino", sede: "Milano Centro", tipo: "Entrata", orario: "08:32", turno: "6h" },
  { dipendente: "Chiara Greco", sede: "Monza", tipo: "Entrata", orario: "08:35", turno: "8h" },
];

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

/* ─── Dashboard ─── */

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">
          Panoramica presenze — Aprile 2026
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
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
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#71717a" }}
              />
              <Bar dataKey="Milano Centro" fill={SEDI_COLORS["Milano Centro"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Milano Nord" fill={SEDI_COLORS["Milano Nord"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Monza" fill={SEDI_COLORS["Monza"]} radius={[3, 3, 0, 0]} />
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
                  <th className="px-5 py-3 font-medium">Turno</th>
                </tr>
              </thead>
              <tbody>
                {timbrature.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                          {t.dipendente
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {t.dipendente}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-muted">
                      {t.sede}
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
                      {t.orario}
                    </td>
                    <td className="px-5 py-3 text-sm text-text-muted">
                      {t.turno}
                    </td>
                  </tr>
                ))}
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
