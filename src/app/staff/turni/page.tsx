"use client";

import { useState, useEffect, useMemo } from "react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const MANSIONE_COLORS: Record<string, string> = { barista: "bg-amber-500/15 text-amber-400", cassa: "bg-green-500/15 text-green-400", sala: "bg-blue-500/15 text-blue-400", guardaroba: "bg-purple-500/15 text-purple-400" };

interface MioEvento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; orarioInizio: string|null; orarioFine: string|null; mansione: string|null; postazione: string|null; note: string|null; assegnazioneId: number; statoConferma: string; }

function fmtData(iso: string) { const d = new Date(iso + "T00:00:00"); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; }

export default function StaffTurniPage() {
  const [eventi, setEventi] = useState<MioEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"prossimi"|"passati">("prossimi");
  const [showRifiuta, setShowRifiuta] = useState<MioEvento|null>(null);
  const [motivoRifiuto, setMotivoRifiuto] = useState("");

  function fetchEventi() {
    setLoading(true);
    fetch("/api/eventi/miei")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEventi(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchEventi(); }, []);

  async function conferma(assId: number) {
    await fetch("/api/eventi/conferma", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assegnazioneId: assId, statoConferma: "confermato" }) });
    fetchEventi();
  }

  async function rifiuta() {
    if (!showRifiuta) return;
    await fetch("/api/eventi/conferma", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assegnazioneId: showRifiuta.assegnazioneId, statoConferma: "rifiutato", motivoRifiuto: motivoRifiuto || null }) });
    setShowRifiuta(null); setMotivoRifiuto("");
    fetchEventi();
  }

  const oggi = new Date().toLocaleDateString("sv-SE");
  const domani = new Date(Date.now() + 86400000).toLocaleDateString("sv-SE");

  const prossimi = useMemo(() => eventi.filter(e => e.data >= oggi && e.statoConferma !== "rifiutato").sort((a, b) => {
    // Da confermare prima
    if (a.statoConferma === "in_attesa" && b.statoConferma !== "in_attesa") return -1;
    if (b.statoConferma === "in_attesa" && a.statoConferma !== "in_attesa") return 1;
    return a.data.localeCompare(b.data);
  }), [eventi, oggi]);
  const passati = useMemo(() => eventi.filter(e => e.data < oggi && e.statoConferma !== "rifiutato").sort((a, b) => b.data.localeCompare(a.data)), [eventi, oggi]);

  const lista = tab === "prossimi" ? prossimi : passati;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">I Miei Turni</h1>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setTab("prossimi")} className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${tab === "prossimi" ? "bg-accent text-white" : "bg-card-bg border border-border text-text-muted"}`}>Prossimi</button>
        <button onClick={() => setTab("passati")} className={`rounded-xl py-3.5 text-base font-semibold min-h-[48px] transition-all active:scale-[0.97] ${tab === "passati" ? "bg-accent text-white" : "bg-card-bg border border-border text-text-muted"}`}>Passati</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-semibold text-foreground">{tab === "prossimi" ? "Nessun turno in programma" : "Nessun turno passato"}</p>
          <p className="mt-1 text-sm text-text-muted">I tuoi turni appariranno qui quando verrai assegnato a un evento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((e, i) => (
            <div key={`${e.id}-${i}`} className={`rounded-2xl border p-4 ${e.statoConferma === "in_attesa" ? "border-amber-500/40 bg-amber-500/[0.04]" : e.data === oggi ? "border-accent/40 bg-accent/[0.04]" : tab === "passati" ? "border-border bg-card-bg opacity-60" : "border-border bg-card-bg"}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-base font-bold text-foreground">{e.nome}</p>
                  <p className="text-sm text-text-muted">{fmtData(e.data)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {e.data === oggi && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">OGGI</span>}
                  {e.data === domani && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">DOMANI</span>}
                  {e.statoConferma === "in_attesa" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">Da confermare</span>}
                  {e.statoConferma === "confermato" && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">Confermato</span>}
                </div>
              </div>

              <p className="text-xs text-text-muted mb-2">{e.sede}</p>

              <p className="text-2xl font-bold text-foreground tabular-nums">
                {e.orarioInizio || e.oraInizio || "—"} – {e.orarioFine || e.oraFine || "—"}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {e.mansione && (
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${MANSIONE_COLORS[e.mansione.toLowerCase()] || "bg-zinc-500/15 text-zinc-400"}`}>{e.mansione}</span>
                )}
                {e.postazione && (
                  <span className="inline-flex rounded-full bg-zinc-500/15 px-2.5 py-0.5 text-xs font-medium text-zinc-400">{e.postazione}</span>
                )}
              </div>
              {e.note && <p className="text-xs text-text-muted italic mt-1">{e.note}</p>}

              {/* Pulsanti conferma/rifiuta */}
              {e.statoConferma === "in_attesa" && e.data >= oggi && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => conferma(e.assegnazioneId)} className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white active:bg-green-700 active:scale-[0.97] transition-all min-h-[48px]">
                    ✓ Confermo
                  </button>
                  <button onClick={() => { setShowRifiuta(e); setMotivoRifiuto(""); }} className="flex-1 rounded-xl border border-red-500/30 py-3 text-sm font-semibold text-red-400 active:bg-red-500/10 active:scale-[0.97] transition-all min-h-[48px]">
                    ✕ Non disponibile
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODALE RIFIUTO ═══ */}
      {showRifiuta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowRifiuta(null)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
                  <span className="text-2xl">✕</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">Non disponibile</h2>
                <p className="mt-1 text-sm text-text-muted">{showRifiuta.nome} — {fmtData(showRifiuta.data)}</p>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Motivazione (opzionale)</label>
                <textarea
                  value={motivoRifiuto}
                  onChange={e => setMotivoRifiuto(e.target.value)}
                  placeholder="Es. Ho un impegno personale..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRifiuta(null)} className="flex-1 rounded-xl border border-border py-3.5 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[48px]">
                  Annulla
                </button>
                <button onClick={rifiuta} className="flex-1 rounded-xl bg-red-600 py-3.5 text-base font-semibold text-white active:bg-red-700 active:scale-[0.97] transition-all min-h-[48px]">
                  Rifiuta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
