"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

const TIPI = ["contratto", "busta_paga", "primo_soccorso", "visita_medica", "altro"];
const TIPO_LABELS: Record<string, string> = { contratto: "Contratto", busta_paga: "Busta Paga", primo_soccorso: "Primo Soccorso", visita_medica: "Visita Medica", altro: "Altro" };

interface Doc { id: number; nomeFile: string; tipoDocumento: string; lettoDaDipendente: boolean; createdAt: string; }
interface Dip { nome: string; cognome: string; email: string; }

export default function DipDocumentiPage() {
  const params = useParams();
  const dipId = params.id as string;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [dip, setDip] = useState<Dip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTipo, setUploadTipo] = useState("contratto");
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const [docsRes, dipRes] = await Promise.all([
        fetch("/api/documenti?dipendenteId=" + dipId),
        fetch("/api/dipendenti/" + dipId),
      ]);
      if (docsRes.ok) { const d = await docsRes.json(); if (Array.isArray(d)) setDocs(d); }
      if (dipRes.ok) setDip(await dipRes.json());
    } catch {}
    setLoading(false);
  }, [dipId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File troppo grande (max 5MB)"); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch("/api/documenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dipendenteId: parseInt(dipId), nomeFile: file.name, tipoDocumento: uploadTipo, contenuto: base64 }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || "Errore"); }
      setUploading(false);
      setShowUpload(false);
      fetchDocs();
    };
    reader.readAsDataURL(file);
  }

  async function viewDoc(id: number) {
    window.open("/api/documenti/" + id + "?download=1", "_blank");
  }

  async function deleteDoc(id: number) {
    if (!confirm("Eliminare questo documento?")) return;
    await fetch("/api/documenti/" + id, { method: "DELETE" });
    fetchDocs();
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documenti</h1>
          {dip && <p className="text-sm text-text-muted mt-1">{dip.nome} {dip.cognome}</p>}
        </div>
        <button onClick={() => setShowUpload(true)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">+ Carica</button>
      </div>

      {docs.length === 0 ? (
        <p className="text-center text-text-muted py-12">Nessun documento caricato.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3 font-medium">Nome file</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Letto</th>
                <th className="px-4 py-3 font-medium text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-foreground">{doc.nomeFile}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{TIPO_LABELS[doc.tipoDocumento] || doc.tipoDocumento}</span></td>
                  <td className="px-4 py-3 text-sm text-text-muted">{new Date(doc.createdAt).toLocaleDateString("it-IT")}</td>
                  <td className="px-4 py-3">{doc.lettoDaDipendente ? <span className="text-green-400 text-xs">✓ Letto</span> : <span className="text-amber-400 text-xs">Non letto</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => viewDoc(doc.id)} className="text-xs text-accent hover:text-accent-hover">Apri</button>
                      <button onClick={() => deleteDoc(doc.id)} className="text-xs text-red-400 hover:text-red-300">Elimina</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale upload */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Carica Documento</h2>
              <button onClick={() => setShowUpload(false)} className="text-text-muted hover:text-foreground text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Tipo documento</label>
                <select value={uploadTipo} onChange={e => setUploadTipo(e.target.value)} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground appearance-none cursor-pointer">
                  {TIPI.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">File PDF</label>
                <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} disabled={uploading} className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover" />
                {uploading && <p className="text-xs text-accent mt-2">Caricamento in corso...</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
