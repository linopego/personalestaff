"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type TipoTimbro = "Entrata" | "Uscita";

interface ApiTimbratura {
  id: number;
  userId: number;
  sedeId: number | null;
  tipo: TipoTimbro;
  orario: string;
  lat: number;
  lng: number;
  modificataManualmente: boolean;
  noteModifica: string | null;
  modifiedBy: number | null;
  tipoAccesso: string;
  motivoRemoto: string | null;
  dipNome: string;
  dipCognome: string;
  sedeNome: string | null;
}

interface Timbratura {
  id: number;
  userId: number;
  sedeId: number | null;
  dipendente: string;
  sede: string;
  data: string;          // YYYY-MM-DD
  orario: string;        // HH:mm
  tipo: TipoTimbro;
  lat: number;
  lng: number;
  modificata: boolean;
  noteCorrezione?: string;
  tipoAccesso: string;
  motivoRemoto?: string;
}

interface TurnoCalcolato {
  entrata: Timbratura;
  uscita: Timbratura | null;
  oreTurno: number | null;
}

interface Dipendente {
  id: number;
  nome: string;
  cognome: string;
}

interface Sede {
  id: number;
  nome: string;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

function defaultDataInizio() {
  const d = new Date();
  d.setDate(d.getDate() - 13);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultDataFine() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function fromApi(r: ApiTimbratura): Timbratura {
  const dt = new Date(r.orario);
  const data = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return {
    id: r.id,
    userId: r.userId,
    sedeId: r.sedeId,
    dipendente: `${r.dipNome} ${r.dipCognome}`,
    sede: r.sedeNome ?? "Remoto",
    data,
    orario: `${hh}:${mm}`,
    tipo: r.tipo,
    lat: r.lat,
    lng: r.lng,
    modificata: r.modificataManualmente,
    noteCorrezione: r.noteModifica ?? undefined,
    tipoAccesso: r.tipoAccesso ?? "sede",
    motivoRemoto: r.motivoRemoto ?? undefined,
  };
}

function parseTurni(timbrature: Timbratura[]): TurnoCalcolato[] {
  const grouped = new Map<string, Timbratura[]>();
  for (const t of timbrature) {
    const key = `${t.userId}|${t.data}`;
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
  // Data
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([]);
  const [sedi, setSedi] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtri
  const [dataInizio, setDataInizio] = useState(defaultDataInizio);
  const [dataFine, setDataFine] = useState(defaultDataFine);
  const [filtroDip, setFiltroDip] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | "Entrata" | "Uscita" | "incompleti">("");

  // Modale eliminazione
  const [deleteTurno, setDeleteTurno] = useState<TurnoCalcolato | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modale correzione
  const [editTurno, setEditTurno] = useState<TurnoCalcolato | null>(null);
  const [editOraEnt, setEditOraEnt] = useState("");
  const [editOraUsc, setEditOraUsc] = useState("");
  const [editSedeId, setEditSedeId] = useState<number | "">("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");

  /* ── Fetch dipendenti + sedi on mount ── */
  useEffect(() => {
    Promise.all([
      fetch("/api/dipendenti").then((r) => r.json()),
      fetch("/api/sedi").then((r) => r.json()),
    ]).then(([dips, sediData]) => {
      setDipendenti(dips);
      setSedi(sediData);
    });
  }, []);

  /* ── Fetch timbrature when filters change ── */
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dataInizio) params.set("dataInizio", dataInizio);
    if (dataFine) params.set("dataFine", dataFine);
    if (filtroDip) params.set("userId", filtroDip);
    if (filtroSede) params.set("sedeId", filtroSede);

    fetch(`/api/timbrature?${params.toString()}`)
      .then((r) => r.json())
      .then((data: ApiTimbratura[]) => {
        setTimbrature(data.map(fromApi));
      })
      .finally(() => setLoading(false));
  }, [dataInizio, dataFine, filtroDip, filtroSede]);

  /* ── Turni calcolati ── */
  const turni = useMemo(() => parseTurni(timbrature), [timbrature]);

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
    setEditSedeId(turno.entrata.sedeId ?? "");
    setEditNote("");
    setEditError("");
  }, []);

  async function handleDelete() {
    if (!deleteTurno) return;
    setDeleting(true);
    try {
      // Delete entrata
      await fetch(`/api/timbrature/${deleteTurno.entrata.id}`, { method: "DELETE" });
      // Delete uscita if exists
      if (deleteTurno.uscita) {
        await fetch(`/api/timbrature/${deleteTurno.uscita.id}`, { method: "DELETE" });
      }
    } catch { /* */ }
    // Refresh data
    const params = new URLSearchParams();
    if (dataInizio) params.set("dataInizio", dataInizio);
    if (dataFine) params.set("dataFine", dataFine);
    if (filtroDip) params.set("userId", filtroDip);
    if (filtroSede) params.set("sedeId", filtroSede);
    const fresh = await fetch(`/api/timbrature?${params.toString()}`).then((r) => r.json());
    setTimbrature((fresh as ApiTimbratura[]).map(fromApi));
    setDeleting(false);
    setDeleteTurno(null);
  }

  async function saveEdit() {
    if (!editNote.trim()) { setEditError("Le note sono obbligatorie per le correzioni manuali."); return; }
    if (!editTurno) return;

    setSaving(true);
    try {
      // Update entrata
      const entData = {
        noteModifica: editNote.trim(),
        orario: `${editTurno.entrata.data}T${editOraEnt}:00`,
        ...(editSedeId !== "" ? { sedeId: editSedeId } : {}),
      };
      const entRes = await fetch(`/api/timbrature/${editTurno.entrata.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entData),
      });
      if (!entRes.ok) {
        const err = await entRes.json();
        setEditError(err.error ?? "Errore durante il salvataggio.");
        return;
      }

      // Update uscita if present, or skip adding (API does not support creating new records via PUT)
      if (editTurno.uscita && editOraUsc) {
        const uscData = {
          noteModifica: editNote.trim(),
          orario: `${editTurno.uscita.data}T${editOraUsc}:00`,
          ...(editSedeId !== "" ? { sedeId: editSedeId } : {}),
        };
        await fetch(`/api/timbrature/${editTurno.uscita.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uscData),
        });
      }

      // Refresh data
      const params = new URLSearchParams();
      if (dataInizio) params.set("dataInizio", dataInizio);
      if (dataFine) params.set("dataFine", dataFine);
      if (filtroDip) params.set("userId", filtroDip);
      if (filtroSede) params.set("sedeId", filtroSede);
      const fresh = await fetch(`/api/timbrature?${params.toString()}`).then((r) => r.json());
      setTimbrature((fresh as ApiTimbratura[]).map(fromApi));
      setEditTurno(null);
    } finally {
      setSaving(false);
    }
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
          {dipendenti.map((d) => (
            <option key={d.id} value={String(d.id)}>{d.nome} {d.cognome}</option>
          ))}
        </select>
        <select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} className={selectCls}>
          <option value="">Tutte le sedi</option>
          {sedi.map((s) => (
            <option key={s.id} value={String(s.id)}>{s.nome}</option>
          ))}
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
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
                          <button
                            onClick={() => setDeleteTurno(turno)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-red-400 transition-colors"
                            title="Elimina timbratura"
                          >
                            <TrashIcon className="h-4 w-4" />
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
        )}
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

      {/* ═══ MODALE ELIMINAZIONE ═══ */}
      {deleteTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteTurno(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card-bg shadow-2xl border-t-4 border-t-red-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-red-400">Elimina timbratura</h2>
              <button onClick={() => setDeleteTurno(null)} className="text-text-muted hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="rounded-lg border border-border bg-sidebar-bg/50 px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Dipendente</span>
                  <span className="font-medium text-foreground">{deleteTurno.entrata.dipendente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tipo</span>
                  <span className="font-medium text-foreground">
                    Entrata{deleteTurno.uscita ? " / Uscita" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Data</span>
                  <span className="font-medium text-foreground">{formatDate(deleteTurno.entrata.data)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Orario</span>
                  <span className="font-mono font-medium text-foreground">
                    {deleteTurno.entrata.orario}{deleteTurno.uscita ? ` → ${deleteTurno.uscita.orario}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Sede</span>
                  <span className="font-medium text-foreground">{deleteTurno.entrata.sede}</span>
                </div>
              </div>
              <p className="text-sm text-red-400 font-medium">
                Questa azione è irreversibile. La timbratura verrà eliminata definitivamente.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setDeleteTurno(null)}
                className="min-h-[48px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="min-h-[48px] flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting && <SpinnerIcon className="h-4 w-4 animate-spin" />}
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

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
                <select value={editSedeId} onChange={(e) => setEditSedeId(Number(e.target.value))} className={`${selectCls} w-full`}>
                  {sedi.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
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
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-60">
                {saving && <SpinnerIcon className="h-4 w-4 animate-spin" />}
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
