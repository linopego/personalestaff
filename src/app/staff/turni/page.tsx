"use client";

import { useState, useEffect, useMemo } from "react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const MANSIONE_COLORS: Record<string, string> = { barista: "bg-amber-500/15 text-amber-400", cassa: "bg-green-500/15 text-green-400", sala: "bg-blue-500/15 text-blue-400", guardaroba: "bg-purple-500/15 text-purple-400" };

interface MioEvento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; stato: string; orarioInizio: string|null; orarioFine: string|null; mansione: string|null; note: string|null; }

function fmtData(iso: string) { const d = new Date(iso + "T00:00:00"); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; }

export default function StaffTurniPage() {
  const [eventi, setEventi] = useState<MioEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"prossimi"|"passati">("prossimi");

  useEffect(() => {
    fetch("/api/eventi/miei")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEventi(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const oggi = new Date().toISOString().slice(0, 10);
  const domani = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const prossimi = useMemo(() => eventi.filter(e => e.data >= oggi).sort((a, b) => a.data.localeCompare(b.data)), [eventi, oggi]);
  const passati = useMemo(() => eventi.filter(e => e.data < oggi).sort((a, b) => b.data.localeCompare(a.data)), [eventi, oggi]);

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
            <div key={`${e.id}-${i}`} className={`rounded-2xl border p-4 ${e.data === oggi ? "border-accent/40 bg-accent/[0.04]" : tab === "passati" ? "border-border bg-card-bg opacity-60" : "border-border bg-card-bg"}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-base font-bold text-foreground">{e.nome}</p>
                  <p className="text-sm text-text-muted">{fmtData(e.data)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {e.data === oggi && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">OGGI</span>}
                  {e.data === domani && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">DOMANI</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.stato === "confermato" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>{e.stato === "confermato" ? "Confermato" : "In attesa"}</span>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-2">{e.sede}</p>

              <p className="text-2xl font-bold text-foreground tabular-nums">
                {e.orarioInizio || e.oraInizio || "—"} – {e.orarioFine || e.oraFine || "—"}
              </p>

              {e.mansione && (
                <span className={`inline-flex mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${MANSIONE_COLORS[e.mansione.toLowerCase()] || "bg-zinc-500/15 text-zinc-400"}`}>{e.mansione}</span>
              )}
              {e.note && <p className="text-xs text-text-muted italic mt-1">{e.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
