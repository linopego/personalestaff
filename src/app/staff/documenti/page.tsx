"use client";

import { useState, useEffect } from "react";

const TIPO_LABELS: Record<string, string> = { contratto: "Contratto", busta_paga: "Busta Paga", primo_soccorso: "Primo Soccorso", visita_medica: "Visita Medica", altro: "Altro" };
const TIPO_COLORS: Record<string, string> = { contratto: "bg-blue-500/15 text-blue-400", busta_paga: "bg-green-500/15 text-green-400", primo_soccorso: "bg-red-500/15 text-red-400", visita_medica: "bg-purple-500/15 text-purple-400", altro: "bg-zinc-500/15 text-zinc-400" };

interface Doc { id: number; nomeFile: string; tipoDocumento: string; lettoDaDipendente: boolean; createdAt: string; }

export default function DocumentiPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documenti").then(r => r.json()).then(d => { if (Array.isArray(d)) setDocs(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function scaricaDoc(doc: Doc) {
    const res = await fetch("/api/documenti/" + doc.id);
    if (!res.ok) { alert("Errore nel download"); return; }
    const data = await res.json();

    // Segna come letto localmente
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, lettoDaDipendente: true } : d));

    // Apri direttamente dalla API (redirect al contenuto)
    window.location.href = "/api/documenti/" + doc.id + "?download=1";
  }

  const nonLetti = docs.filter(d => !d.lettoDaDipendente).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">I Miei Documenti</h1>
        {nonLetti > 0 && <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">{nonLetti} nuovi</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-lg font-semibold text-foreground">Nessun documento</p>
          <p className="mt-1 text-sm text-text-muted">I tuoi documenti appariranno qui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map(doc => (
            <button key={doc.id} onClick={() => scaricaDoc(doc)}
              className={"flex items-center gap-3 rounded-xl border p-4 min-h-[56px] text-left active:scale-[0.98] transition-all " + (doc.lettoDaDipendente ? "border-border bg-card-bg" : "border-accent/30 bg-accent/[0.04]")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-bg">
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={"text-sm font-medium truncate " + (doc.lettoDaDipendente ? "text-foreground" : "text-accent font-semibold")}>{doc.nomeFile}</p>
                  {!doc.lettoDaDipendente && <span className="flex h-2 w-2 rounded-full bg-accent shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (TIPO_COLORS[doc.tipoDocumento] || TIPO_COLORS.altro)}>{TIPO_LABELS[doc.tipoDocumento] || doc.tipoDocumento}</span>
                  <span className="text-xs text-text-muted">{new Date(doc.createdAt).toLocaleDateString("it-IT")}</span>
                </div>
              </div>
              <svg className="h-4 w-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
