"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];

const SEDE_BORDER: Record<string, string> = { "La Casa dei Gelsi": "border-amber-500/30", "Tenuta Villa Peggy's": "border-emerald-500/30", "Studios Club / TooLate": "border-blue-500/30" };
function sedeBorder(sede: string) { return SEDE_BORDER[sede] || "border-border"; }

interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; stato: string; assegnati: number; sedeId: number|null; sedeAltro: string|null; }
interface Sede { id: number; nome: string; }

function fmtData(iso: string) { const d = new Date(iso + "T00:00:00"); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; }

export default function EventiPage() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [sedi, setSedi] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStato, setFiltroStato] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ nome: "", data: "", oraInizio: "", oraFine: "", sedeId: 0, sedeAltro: "", descrizione: "", stato: "bozza", sedeType: "sede" as "sede"|"altro" });

  useEffect(() => { fetch("/api/sedi").then(r=>r.json()).then(setSedi).catch(()=>{}); }, []);

  const fetchEventi = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroStato) params.set("stato", filtroStato);
    try { const res = await fetch(`/api/eventi?${params}`); if (res.ok) setEventi(await res.json()); } catch {}
    setLoading(false);
  }, [filtroStato]);

  useEffect(() => { fetchEventi(); }, [fetchEventi]);

  function openAdd() { setEditId(null); setForm({ nome: "", data: new Date().toISOString().slice(0,10), oraInizio: "", oraFine: "", sedeId: sedi[0]?.id||0, sedeAltro: "", descrizione: "", stato: "bozza", sedeType: "sede" }); setShowForm(true); }
  function openEdit(e: Evento) { setEditId(e.id); setForm({ nome: e.nome, data: e.data, oraInizio: e.oraInizio||"", oraFine: e.oraFine||"", sedeId: e.sedeId||0, sedeAltro: e.sedeAltro||"", descrizione: "", stato: e.stato, sedeType: e.sedeId ? "sede" : "altro" }); setShowForm(true); }

  async function saveForm() {
    if (!form.nome || !form.data) { alert("Nome e data obbligatori"); return; }
    const body = { nome: form.nome, data: form.data, oraInizio: form.oraInizio||null, oraFine: form.oraFine||null, sedeId: form.sedeType === "sede" ? form.sedeId : null, sedeAltro: form.sedeType === "altro" ? form.sedeAltro : null, descrizione: form.descrizione||null, stato: form.stato };
    const url = editId ? `/api/eventi/${editId}` : "/api/eventi";
    const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.error||"Errore"); return; }
    setShowForm(false); fetchEventi();
  }

  async function deleteEvento(id: number) { if (!confirm("Eliminare questo evento?")) return; const res = await fetch(`/api/eventi/${id}`, { method: "DELETE" }); if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.error||"Errore"); return; } fetchEventi(); }

  const oggi = new Date().toISOString().slice(0,10);
  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gestione Eventi</h1>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">+ Nuovo Evento</button>
      </div>

      <div className="mb-4 flex gap-2">
        <select value={filtroStato} onChange={e => setFiltroStato(e.target.value)} className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer">
          <option value="">Tutti gli stati</option>
          <option value="bozza">Bozza</option>
          <option value="confermato">Confermato</option>
        </select>
      </div>

      {loading ? <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div> : (
        <div className="space-y-3">
          {eventi.length === 0 && <p className="text-center text-text-muted py-12">Nessun evento trovato.</p>}
          {eventi.map(e => {
            const passato = e.data < oggi;
            return (
              <div key={e.id} className={`rounded-xl border p-4 transition-colors ${e.data === oggi ? "border-accent/40 bg-accent/[0.03]" : passato ? "border-border bg-card-bg opacity-60" : `${sedeBorder(e.sede)} bg-card-bg`}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-foreground">{e.nome}</p>
                    <p className="text-sm text-text-muted">{fmtData(e.data)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${e.stato === "confermato" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>{e.stato === "confermato" ? "Confermato" : "Bozza"}</span>
                </div>
                {(e.oraInizio || e.oraFine) && <p className="text-xl font-bold text-foreground tabular-nums">{e.oraInizio || "—"} – {e.oraFine || "—"}</p>}
                <p className="text-sm text-text-muted mt-1">{e.sede}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-text-muted">{e.assegnati} persone assegnate</span>
                  <div className="flex gap-2">
                    <Link href={`/admin/eventi/${e.id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-foreground">Dettaglio</Link>
                    <button onClick={() => openEdit(e)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-foreground">Modifica</button>
                    {e.stato === "bozza" && <button onClick={() => deleteEvento(e.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">Elimina</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modale */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card-bg shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">{editId ? "Modifica Evento" : "Nuovo Evento"}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-foreground text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs text-text-muted mb-1 block">Nome evento *</label><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="es. Catering Matrimonio Rossi" className={inputCls} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-text-muted mb-1 block">Data *</label><input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className={inputCls} /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Ora inizio</label><input type="time" value={form.oraInizio} onChange={e => setForm({...form, oraInizio: e.target.value})} className={inputCls} /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Ora fine</label><input type="time" value={form.oraFine} onChange={e => setForm({...form, oraFine: e.target.value})} className={inputCls} /></div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">Sede</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {sedi.map(s => <button key={s.id} type="button" onClick={() => setForm({...form, sedeType: "sede", sedeId: s.id, sedeAltro: ""})} className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${form.sedeType === "sede" && form.sedeId === s.id ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted"}`}>{s.nome}</button>)}
                  <button type="button" onClick={() => setForm({...form, sedeType: "altro", sedeId: 0})} className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${form.sedeType === "altro" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted"}`}>Altro</button>
                </div>
                {form.sedeType === "altro" && <input value={form.sedeAltro} onChange={e => setForm({...form, sedeAltro: e.target.value})} placeholder="Indirizzo o nome location" className={inputCls} />}
              </div>
              <div><label className="text-xs text-text-muted mb-1 block">Descrizione</label><textarea value={form.descrizione} onChange={e => setForm({...form, descrizione: e.target.value})} rows={2} className={`${inputCls} resize-none`} /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-foreground">Annulla</button>
              <button onClick={saveForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
