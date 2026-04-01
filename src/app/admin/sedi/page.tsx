"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface SedeData {
  id: number;
  nome: string;
  indirizzo: string;
  lat: number;
  lng: number;
  raggio: number;
  note: string;
  attiva: boolean;
  dipAssegnati: number;
  dipInSede: number;
  oreOggi: number;
  oreMese: number;
}

const SEDE_ACCENTS = ["#3b82f6", "#f59e0b", "#10b981"];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function SediPage() {
  const [sedi, setSedi] = useState<SedeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSedi = useCallback(async () => {
    setLoading(true);
    try {
      const [sediRes, timbRes] = await Promise.all([
        fetch("/api/sedi"),
        fetch(`/api/timbrature?dataInizio=${new Date().toISOString().slice(0, 10)}&dataFine=${new Date().toISOString().slice(0, 10)}`),
      ]);
      const sediData = sediRes.ok ? await sediRes.json() : [];
      const timbData = timbRes.ok ? await timbRes.json() : [];

      // Calcola stats per sede
      setSedi(sediData.map((s: Record<string, unknown>) => {
        const sedeTimb = Array.isArray(timbData) ? timbData.filter((t: Record<string, unknown>) => t.sedeNome === s.nome) : [];
        const entrate = sedeTimb.filter((t: Record<string, unknown>) => t.tipo === "Entrata");
        const uscite = sedeTimb.filter((t: Record<string, unknown>) => t.tipo === "Uscita");
        const entrateIds = new Set(entrate.map((t: Record<string, unknown>) => t.userId));
        const usciteIds = new Set(uscite.map((t: Record<string, unknown>) => t.userId));
        const inSede = [...entrateIds].filter((id) => !usciteIds.has(id)).length;
        return {
          id: s.id as number, nome: s.nome as string, indirizzo: (s.indirizzo ?? "") as string,
          lat: s.lat as number, lng: s.lng as number, raggio: s.raggio as number,
          note: (s.note ?? "") as string, attiva: s.attiva as boolean,
          dipAssegnati: entrateIds.size, dipInSede: inSede, oreOggi: 0, oreMese: 0,
        };
      }));
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSedi(); }, [fetchSedi]);
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Geofence form state
  const [geoForm, setGeoForm] = useState({ lat: 0, lng: 0, raggio: 100, note: "" });
  const [savedMsg, setSavedMsg] = useState<number | null>(null);

  function handleAddSede() {
    alert("Il numero massimo di sedi è stato raggiunto (3/3).");
  }

  function startEditName(sede: SedeData) {
    setEditingNameId(sede.id);
    setEditNameValue(sede.nome);
  }

  async function saveEditName(id: number) {
    if (editNameValue.trim()) {
      await fetch(`/api/sedi/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNameValue.trim() }),
      });
      fetchSedi();
    }
    setEditingNameId(null);
  }

  function toggleExpand(sede: SedeData) {
    if (expandedId === sede.id) {
      setExpandedId(null);
    } else {
      setExpandedId(sede.id);
      setGeoForm({ lat: sede.lat, lng: sede.lng, raggio: sede.raggio, note: sede.note });
      setSavedMsg(null);
    }
  }

  async function saveGeoFence(id: number) {
    await fetch(`/api/sedi/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: geoForm.lat, lng: geoForm.lng, raggio: geoForm.raggio, note: geoForm.note }),
    });
    setSavedMsg(id);
    setTimeout(() => setSavedMsg((prev) => (prev === id ? null : prev)), 3000);
    fetchSedi();
  }

  // Riepilogo aziendale
  const totDip = sedi.reduce((s, x) => s + x.dipAssegnati, 0);
  const totInSede = sedi.reduce((s, x) => s + x.dipInSede, 0);
  const totOreOggi = sedi.reduce((s, x) => s + x.oreOggi, 0);
  const sedePiuAttiva = [...sedi].sort((a, b) => b.oreMese - a.oreMese)[0];

  const inputCls =
    "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Sedi</h1>
          <p className="mt-1 text-sm text-text-muted">{sedi.length} sedi configurate</p>
        </div>
        <button
          onClick={handleAddSede}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Aggiungi Sede
        </button>
      </div>

      {/* Sede Cards */}
      <div className="space-y-4">
        {sedi.map((sede, idx) => {
          const accent = SEDE_ACCENTS[idx];
          const isExpanded = expandedId === sede.id;
          const isEditingName = editingNameId === sede.id;

          return (
            <div
              key={sede.id}
              className="rounded-xl border border-border bg-card-bg overflow-hidden"
              style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_1fr] gap-0">
                {/* ── Left: Info ── */}
                <div className="p-5 lg:p-6">
                  {/* Nome */}
                  <div className="flex items-center gap-2 mb-3">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEditName(sede.id); if (e.key === "Escape") setEditingNameId(null); }}
                          className={`${inputCls} max-w-xs`}
                          autoFocus
                        />
                        <button onClick={() => saveEditName(sede.id)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">OK</button>
                        <button onClick={() => setEditingNameId(null)} className="text-xs text-text-muted hover:text-foreground">Annulla</button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold" style={{ color: accent }}>{sede.nome}</h2>
                        <button onClick={() => startEditName(sede)} className="rounded p-1 text-text-muted hover:text-foreground transition-colors" title="Modifica nome">
                          <PenIcon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-text-muted mb-3">{sede.indirizzo}</p>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="font-mono text-foreground">{sede.lat.toFixed(6)}, {sede.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadiusIcon className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="text-foreground">Raggio: <span className="font-mono">{sede.raggio}m</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sede.attiva ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sede.attiva ? "bg-green-400" : "bg-zinc-500"}`} />
                        {sede.attiva ? "Attiva" : "Disattivata"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Center: Map Simulation ── */}
                <div className="flex items-center justify-center p-4 lg:p-6">
                  <div className="relative flex items-center justify-center w-[160px] h-[160px] rounded-xl bg-sidebar-bg border border-border overflow-hidden">
                    {/* Grid pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`grid-${sede.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#71717a" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#grid-${sede.id})`} />
                    </svg>
                    {/* Radius circle */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                      <circle
                        cx="80" cy="80"
                        r={Math.max(20, Math.min(65, sede.raggio / 500 * 65))}
                        fill={accent}
                        fillOpacity="0.12"
                        stroke={accent}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                      {/* Center dot */}
                      <circle cx="80" cy="80" r="4" fill={accent} />
                    </svg>
                    {/* Coords text */}
                    <div className="relative z-10 text-center">
                      <p className="text-[10px] font-mono text-text-muted">{sede.lat.toFixed(4)}</p>
                      <p className="text-[10px] font-mono text-text-muted">{sede.lng.toFixed(4)}</p>
                      <p className="mt-1 text-[9px] text-text-muted">{sede.raggio}m raggio</p>
                    </div>
                  </div>
                </div>

                {/* ── Right: Stats ── */}
                <div className="p-5 lg:p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Statistiche</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBlock label="Dipendenti" value={String(sede.dipAssegnati)} accent={accent} />
                    <StatBlock label="In sede ora" value={String(sede.dipInSede)} accent="#10b981" />
                    <StatBlock label="Ore oggi" value={`${sede.oreOggi}h`} accent={accent} />
                    <StatBlock label="Ore mese" value={`${sede.oreMese}h`} accent={accent} />
                  </div>
                </div>
              </div>

              {/* ── Geofence expand button ── */}
              <div className="border-t border-border">
                <button
                  onClick={() => toggleExpand(sede)}
                  className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-text-muted hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <GeoIcon className="h-4 w-4" />
                    Modifica Configurazione Geofence
                  </span>
                  <ChevronIcon className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-6 py-5">
                    {savedMsg === sede.id && (
                      <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 font-medium">
                        Configurazione geofence aggiornata con successo.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Latitudine</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={geoForm.lat}
                          onChange={(e) => setGeoForm({ ...geoForm, lat: parseFloat(e.target.value) || 0 })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Longitudine</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={geoForm.lng}
                          onChange={(e) => setGeoForm({ ...geoForm, lng: parseFloat(e.target.value) || 0 })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Raggio (m)</label>
                        <input
                          type="number"
                          min={50}
                          max={500}
                          value={geoForm.raggio}
                          onChange={(e) => setGeoForm({ ...geoForm, raggio: parseInt(e.target.value) || 50 })}
                          className={inputCls}
                        />
                        <p className="mt-1 text-[11px] text-text-muted">Min 50m — Max 500m</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Note sulla sede</label>
                      <textarea
                        value={geoForm.note}
                        onChange={(e) => setGeoForm({ ...geoForm, note: e.target.value })}
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Note interne sulla sede..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setExpandedId(null)}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={() => saveGeoFence(sede.id)}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
                      >
                        Salva configurazione
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Riepilogo aziendale ── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryBox label="Totale dipendenti" value={String(totDip)} accent="text-blue-400" />
        <SummaryBox label="Attualmente al lavoro" value={String(totInSede)} accent="text-green-400" />
        <SummaryBox label="Ore lavorate oggi" value={`${totOreOggi}h`} accent="text-amber-400" />
        <SummaryBox label="Sede più attiva (mese)" value={sedePiuAttiva.nome} accent="text-foreground" sub={`${sedePiuAttiva.oreMese}h`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function StatBlock({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg bg-sidebar-bg px-3 py-2.5">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="text-lg font-bold" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function SummaryBox({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-bg p-5">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function RadiusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5M20.25 16.5V18A2.25 2.25 0 0 1 18 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 0 0 6 20.25h1.5M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
    </svg>
  );
}

function GeoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
