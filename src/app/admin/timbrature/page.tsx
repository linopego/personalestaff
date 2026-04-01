"use client";

import { useState, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type Sede = "La Casa dei Gelsi" | "Tenuta Villa Peggy's" | "Studios Club / TooLate";
type TipoTimbro = "Entrata" | "Uscita";

interface Timbratura {
  id: number;
  dipendente: string;
  sede: Sede;
  data: string;          // YYYY-MM-DD
  orario: string;        // HH:mm
  tipo: TipoTimbro;
  lat: number;
  lng: number;
  modificata: boolean;
  noteCorrezione?: string;
}

interface TurnoCalcolato {
  entrata: Timbratura;
  uscita: Timbratura | null;
  oreTurno: number | null;
}

/* ═══════════════════════════════════════════
   MOCK DATA — 30 timbrature ultimi 14gg
   ═══════════════════════════════════════════ */

const SEDI: Sede[] = ["La Casa dei Gelsi", "Tenuta Villa Peggy's", "Studios Club / TooLate"];
const DIPENDENTI = [
  "Marco Bianchi", "Giulia Ferretti", "Alessandro Conti", "Francesca Romano",
  "Luca Moretti", "Sara Colombo", "Elena Galli", "Andrea Marino",
  "Chiara Greco", "Davide Ricci",
];

const GPS: Record<Sede, { lat: number; lng: number }> = {
  "La Casa dei Gelsi":       { lat: 45.5826, lng: 9.2756 },
  "Tenuta Villa Peggy's":    { lat: 45.6012, lng: 9.3102 },
  "Studios Club / TooLate":  { lat: 45.5543, lng: 9.2351 },
};

function gpsJitter(base: number) { return base + (Math.random() - 0.5) * 0.002; }
function date(daysAgo: number) {
  const d = new Date(2026, 3, 1); // 1 Aprile 2026
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

let _id = 0;
function t(dip: string, sede: Sede, data: string, orario: string, tipo: TipoTimbro, mod = false, note?: string): Timbratura {
  const g = GPS[sede];
  return { id: ++_id, dipendente: dip, sede, data, orario, tipo, lat: gpsJitter(g.lat), lng: gpsJitter(g.lng), modificata: mod, noteCorrezione: note };
}

const initialTimbrature: Timbratura[] = [
  // Oggi (0 gg fa)
  t("Marco Bianchi",     "La Casa dei Gelsi",       date(0), "08:02", "Entrata"),
  t("Marco Bianchi",     "La Casa dei Gelsi",       date(0), "16:05", "Uscita"),
  t("Giulia Ferretti",   "Tenuta Villa Peggy's",    date(0), "09:00", "Entrata"),
  t("Giulia Ferretti",   "Tenuta Villa Peggy's",    date(0), "17:02", "Uscita"),
  t("Alessandro Conti",  "Studios Club / TooLate",  date(0), "18:00", "Entrata"), // incompleto
  t("Francesca Romano",  "La Casa dei Gelsi",       date(0), "06:30", "Entrata"),
  t("Francesca Romano",  "La Casa dei Gelsi",       date(0), "14:35", "Uscita"),
  // 1 giorno fa
  t("Elena Galli",       "Studios Club / TooLate",  date(1), "20:00", "Entrata"),
  t("Elena Galli",       "Studios Club / TooLate",  date(1), "02:10", "Uscita", true, "Uscita registrata giorno successivo, corretta manualmente"),
  t("Sara Colombo",      "Tenuta Villa Peggy's",    date(1), "11:00", "Entrata"),
  t("Sara Colombo",      "Tenuta Villa Peggy's",    date(1), "15:00", "Uscita"),
  t("Andrea Marino",     "La Casa dei Gelsi",       date(1), "10:00", "Entrata"),
  t("Andrea Marino",     "La Casa dei Gelsi",       date(1), "16:00", "Uscita"),
  // 2 giorni fa
  t("Luca Moretti",      "Studios Club / TooLate",  date(2), "22:00", "Entrata"),
  t("Luca Moretti",      "Studios Club / TooLate",  date(2), "04:00", "Uscita"),
  t("Chiara Greco",      "Tenuta Villa Peggy's",    date(2), "18:30", "Entrata"), // incompleto
  t("Marco Bianchi",     "La Casa dei Gelsi",       date(2), "08:00", "Entrata"),
  t("Marco Bianchi",     "La Casa dei Gelsi",       date(2), "16:10", "Uscita"),
  // 4 giorni fa
  t("Giulia Ferretti",   "Tenuta Villa Peggy's",    date(4), "09:05", "Entrata"),
  t("Giulia Ferretti",   "Tenuta Villa Peggy's",    date(4), "17:00", "Uscita"),
  t("Alessandro Conti",  "Studios Club / TooLate",  date(4), "18:00", "Entrata"),
  t("Alessandro Conti",  "Studios Club / TooLate",  date(4), "00:05", "Uscita"),
  // 7 giorni fa
  t("Francesca Romano",  "La Casa dei Gelsi",       date(7), "06:28", "Entrata"),
  t("Francesca Romano",  "La Casa dei Gelsi",       date(7), "14:30", "Uscita"),
  t("Davide Ricci",      "La Casa dei Gelsi",       date(7), "19:00", "Entrata"), // incompleto
  t("Elena Galli",       "Studios Club / TooLate",  date(7), "20:05", "Entrata"),
  t("Elena Galli",       "Studios Club / TooLate",  date(7), "02:00", "Uscita"),
  // 10 giorni fa
  t("Sara Colombo",      "Tenuta Villa Peggy's",    date(10), "11:00", "Entrata"),
  t("Sara Colombo",      "Tenuta Villa Peggy's",    date(10), "15:05", "Uscita"),
  t("Andrea Marino",     "La Casa dei Gelsi",       date(10), "10:05", "Entrata"),
  t("Andrea Marino",     "La Casa dei Gelsi",       date(10), "16:00", "Uscita"),
  // 13 giorni fa
  t("Luca Moretti",      "Studios Club / TooLate",  date(13), "22:30", "Entrata"),
  t("Luca Moretti",      "Studios Club / TooLate",  date(13), "04:15", "Uscita"),
  t("Chiara Greco",      "Tenuta Villa Peggy's",    date(13), "18:00", "Entrata"),
  t("Chiara Greco",      "Tenuta Villa Peggy's",    date(13), "00:00", "Uscita"),
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function parseTurni(timbrature: Timbratura[]): TurnoCalcolato[] {
  const grouped = new Map<string, Timbratura[]>();
  for (const t of timbrature) {
    const key = `${t.dipendente}|${t.data}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  const turni: TurnoCalcolato[] = [];
  for (const entries of grouped.values()) {
    const entrate = entries.filter((e) => e.tipo === "Entrata").sort((a, b) => a.orario.localeCompare(b.orario));
    const uscite = entries.filter((e) => e.tipo === "Uscita").sort((a, b) => a.orario.localeCompare(b.orario));
    for (let i = 0; i < entrate.length; i++) {
      const ent = entrate[i];
      const usc = uscite[i] ?? null;
      let ore: number | null = null;
      if (usc) {
        const [eh, em] = ent.orario.split(":").map(Number);
        const [uh, um] = usc.orario.split(":").map(Number);
        let diff = uh * 60 + um - (eh * 60 + em);
        if (diff < 0) diff += 24 * 60; // turno notturno
        ore = Math.round((diff / 60) * 100) / 100;
      }
      turni.push({ entrata: ent, uscita: usc, oreTurno: ore });
    }
  }
  turni.sort((a, b) => {
    const cmp = b.entrata.data.localeCompare(a.entrata.data);
    if (cmp !== 0) return cmp;
    return b.entrata.orario.localeCompare(a.entrata.orario);
  });
  return turni;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatGps(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function downloadCSV(turni: TurnoCalcolato[]) {
  const header = "Data,Dipendente,Sede,Entrata,Uscita,Ore turno,GPS,Modificata,Note\n";
  const rows = turni.map((t) =>
    [
      formatDate(t.entrata.data),
      t.entrata.dipendente,
      t.entrata.sede,
      t.entrata.orario,
      t.uscita?.orario ?? "",
      t.oreTurno != null ? t.oreTurno.toFixed(2) : "",
      formatGps(t.entrata.lat, t.entrata.lng),
      t.entrata.modificata || (t.uscita?.modificata ?? false) ? "Sì" : "No",
      t.entrata.noteCorrezione || t.uscita?.noteCorrezione || "",
    ].map((v) => `"${v}"`).join(",")
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timbrature_export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function TimbraturePage() {
  const [timbrature, setTimbrature] = useState(initialTimbrature);

  // Filtri
  const [dataInizio, setDataInizio] = useState(date(13));
  const [dataFine, setDataFine] = useState(date(0));
  const [filtroDip, setFiltroDip] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | "Entrata" | "Uscita" | "incompleti">("");

  // Modale correzione
  const [editTurno, setEditTurno] = useState<TurnoCalcolato | null>(null);
  const [editOraEnt, setEditOraEnt] = useState("");
  const [editOraUsc, setEditOraUsc] = useState("");
  const [editSede, setEditSede] = useState<Sede>("La Casa dei Gelsi");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");

  /* ── Turni calcolati ── */
  const filteredTimbrature = useMemo(() => {
    return timbrature.filter((t) => {
      if (t.data < dataInizio || t.data > dataFine) return false;
      if (filtroDip && t.dipendente !== filtroDip) return false;
      if (filtroSede && t.sede !== filtroSede) return false;
      return true;
    });
  }, [timbrature, dataInizio, dataFine, filtroDip, filtroSede]);

  const turni = useMemo(() => parseTurni(filteredTimbrature), [filteredTimbrature]);

  const turniVisualizzati = useMemo(() => {
    if (!filtroTipo) return turni;
    if (filtroTipo === "incompleti") return turni.filter((t) => !t.uscita);
    if (filtroTipo === "Entrata") return turni; // mostra tutto ma focus entrate
    if (filtroTipo === "Uscita") return turni.filter((t) => t.uscita);
    return turni;
  }, [turni, filtroTipo]);

  /* ── Riepilogo ── */
  const riepilogo = useMemo(() => {
    const totTurni = turni.length;
    const incompleti = turni.filter((t) => !t.uscita).length;
    const totOre = turni.reduce((s, t) => s + (t.oreTurno ?? 0), 0);
    const giorniUnici = new Set(turni.map((t) => t.entrata.data)).size;
    const mediaGg = giorniUnici > 0 ? totOre / giorniUnici : 0;
    return { totTurni, incompleti, totOre, mediaGg };
  }, [turni]);

  /* ── Edit handlers ── */
  const openEdit = useCallback((turno: TurnoCalcolato) => {
    setEditTurno(turno);
    setEditOraEnt(turno.entrata.orario);
    setEditOraUsc(turno.uscita?.orario ?? "");
    setEditSede(turno.entrata.sede);
    setEditNote("");
    setEditError("");
  }, []);

  function saveEdit() {
    if (!editNote.trim()) { setEditError("Le note sono obbligatorie per le correzioni manuali."); return; }
    if (!editTurno) return;
    setTimbrature((prev) => {
      const next = [...prev];
      const eidx = next.findIndex((t) => t.id === editTurno.entrata.id);
      if (eidx !== -1) {
        next[eidx] = { ...next[eidx], orario: editOraEnt, sede: editSede, modificata: true, noteCorrezione: editNote };
      }
      if (editTurno.uscita) {
        const uidx = next.findIndex((t) => t.id === editTurno.uscita!.id);
        if (uidx !== -1) {
          next[uidx] = { ...next[uidx], orario: editOraUsc, sede: editSede, modificata: true, noteCorrezione: editNote };
        }
      } else if (editOraUsc) {
        // Aggiungi uscita mancante
        const newId = Math.max(...next.map((t) => t.id)) + 1;
        const g = GPS[editSede];
        next.push({
          id: newId, dipendente: editTurno.entrata.dipendente, sede: editSede,
          data: editTurno.entrata.data, orario: editOraUsc, tipo: "Uscita",
          lat: gpsJitter(g.lat), lng: gpsJitter(g.lng), modificata: true, noteCorrezione: editNote,
        });
      }
      return next;
    });
    setEditTurno(null);
  }

  const selectCls = "rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer";
  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Timbrature</h1>
          <p className="mt-1 text-sm text-text-muted">{riepilogo.totTurni} turni nel periodo selezionato</p>
        </div>
        <button
          onClick={() => downloadCSV(turniVisualizzati)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          <DownloadIcon className="h-4 w-4" />
          Esporta CSV
        </button>
      </div>

      {/* ── Filtri ── */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-muted whitespace-nowrap">Dal</label>
          <input type="date" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} className={selectCls} />
          <label className="text-xs font-medium text-text-muted whitespace-nowrap">al</label>
          <input type="date" value={dataFine} onChange={(e) => setDataFine(e.target.value)} className={selectCls} />
        </div>
        <select value={filtroDip} onChange={(e) => setFiltroDip(e.target.value)} className={selectCls}>
          <option value="">Tutti i dipendenti</option>
          {DIPENDENTI.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} className={selectCls}>
          <option value="">Tutte le sedi</option>
          {SEDI.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} className={selectCls}>
          <option value="">Tutti i tipi</option>
          <option value="Entrata">Solo entrate</option>
          <option value="Uscita">Solo uscite</option>
          <option value="incompleti">Turni incompleti</option>
        </select>
      </div>

      {/* ── Tabella ── */}
      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 font-medium">Data / Ora</th>
                <th className="px-5 py-3 font-medium">Dipendente</th>
                <th className="px-5 py-3 font-medium">Sede</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">GPS</th>
                <th className="px-5 py-3 font-medium text-right">Ore turno</th>
                <th className="px-5 py-3 font-medium text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {turniVisualizzati.map((turno) => {
                const inc = !turno.uscita;
                const mod = turno.entrata.modificata || (turno.uscita?.modificata ?? false);
                return (
                  <tr
                    key={turno.entrata.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      inc ? "bg-red-500/[0.04] hover:bg-red-500/[0.08]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-foreground">{formatDate(turno.entrata.data)}</div>
                      <div className="text-xs text-text-muted font-mono">
                        {turno.entrata.orario} → {turno.uscita?.orario ?? <span className="text-red-400">--:--</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                          {turno.entrata.dipendente.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">{turno.entrata.dipendente}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{turno.entrata.sede}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-400">
                          ↓ Entrata
                        </span>
                        {turno.uscita ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                            ↑ Uscita
                          </span>
                        ) : (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400">
                            ⚠ Incompleto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-text-muted">{formatGps(turno.entrata.lat, turno.entrata.lng)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {turno.oreTurno != null ? (
                        <span className="text-sm font-mono font-semibold text-foreground">{turno.oreTurno.toFixed(1)}h</span>
                      ) : (
                        <span className="text-sm text-red-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {mod && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400" title={turno.entrata.noteCorrezione || turno.uscita?.noteCorrezione}>
                            MOD
                          </span>
                        )}
                        <button
                          onClick={() => openEdit(turno)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-amber-400 transition-colors"
                          title="Correggi timbratura"
                        >
                          <PenIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {turniVisualizzati.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">
                    Nessuna timbratura trovata per il periodo e i filtri selezionati.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Riepilogo ── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Totale turni" value={String(riepilogo.totTurni)} accent="text-blue-400" />
        <StatBox label="Ore lavorate" value={`${riepilogo.totOre.toFixed(1)}h`} accent="text-green-400" />
        <StatBox label="Media ore/giorno" value={`${riepilogo.mediaGg.toFixed(1)}h`} accent="text-amber-400" />
        <StatBox
          label="Turni incompleti"
          value={String(riepilogo.incompleti)}
          accent={riepilogo.incompleti > 0 ? "text-red-400" : "text-green-400"}
          alert={riepilogo.incompleti > 0}
        />
      </div>

      {/* ═══ MODALE CORREZIONE ═══ */}
      {editTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditTurno(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Correzione manuale</h2>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">Modifica manuale</span>
              </div>
              <button onClick={() => setEditTurno(null)} className="text-text-muted hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Dipendente (readonly) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Dipendente</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-sidebar-bg/50 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {editTurno.entrata.dipendente.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm text-text-muted">{editTurno.entrata.dipendente}</span>
                </div>
              </div>

              {/* Data (readonly) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Data</label>
                <div className="rounded-lg border border-border bg-sidebar-bg/50 px-3 py-2.5 text-sm text-text-muted">
                  {formatDate(editTurno.entrata.data)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Ora entrata</label>
                  <input type="time" value={editOraEnt} onChange={(e) => setEditOraEnt(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Ora uscita</label>
                  <input type="time" value={editOraUsc} onChange={(e) => setEditOraUsc(e.target.value)} className={inputCls} placeholder={editTurno.uscita ? "" : "Aggiungi uscita"} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Sede</label>
                <select value={editSede} onChange={(e) => setEditSede(e.target.value as Sede)} className={`${selectCls} w-full`}>
                  {SEDI.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Note correzione <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={editNote}
                  onChange={(e) => { setEditNote(e.target.value); setEditError(""); }}
                  placeholder="Motivazione della correzione manuale..."
                  rows={3}
                  className={`${inputCls} resize-none ${editError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {editError && <p className="mt-1 text-xs text-red-400">{editError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditTurno(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                Annulla
              </button>
              <button onClick={saveEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
                Salva correzione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function StatBox({ label, value, accent, alert }: { label: string; value: string; accent: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card-bg p-5 ${alert ? "border-red-500/40" : "border-border"}`}>
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      {alert && <p className="mt-1 text-xs text-red-400">Da verificare</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
