"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const MANSIONE_COLORS: Record<string, string> = { barista: "bg-amber-500/15 text-amber-400", cassa: "bg-green-500/15 text-green-400", sala: "bg-blue-500/15 text-blue-400", guardaroba: "bg-purple-500/15 text-purple-400" };

interface Assegnazione { id: number; userId: number; orarioInizio: string|null; orarioFine: string|null; mansione: string|null; note: string|null; dipNome: string; dipCognome: string; tipoContratto: string; }
interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; stato: string; assegnazioni: Assegnazione[]; }
interface Dip { id: number; nome: string; cognome: string; tipoContratto: string; }

function fmtData(iso: string) { const d = new Date(iso + "T00:00:00"); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; }

export default function EventoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [evento, setEvento] = useState<Evento|null>(null);
  const [dipendenti, setDipendenti] = useState<Dip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"assegnati"|"aggiungi">("assegnati");
  const [search, setSearch] = useState("");
  const [addForm, setAddForm] = useState<Record<number, { orarioInizio: string; orarioFine: string; mansione: string; note: string }>>({});
  const [expandedDip, setExpandedDip] = useState<number|null>(null);

  useEffect(() => { fetch("/api/dipendenti").then(r=>r.json()).then(d => setDipendenti(d.filter((x: Dip & {attivo: boolean}) => x.attivo))).catch(()=>{}); }, []);

  const fetchEvento = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/eventi/${id}`); if (res.ok) setEvento(await res.json()); } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchEvento(); }, [fetchEvento]);

  async function toggleStato() {
    if (!evento) return;
    await fetch(`/api/eventi/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stato: evento.stato === "bozza" ? "confermato" : "bozza" }) });
    fetchEvento();
  }

  async function addAssegnazione(userId: number) {
    const f = addForm[userId] || { orarioInizio: "", orarioFine: "", mansione: "", note: "" };
    const res = await fetch(`/api/eventi/${id}/assegnazioni`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, orarioInizio: f.orarioInizio||null, orarioFine: f.orarioFine||null, mansione: f.mansione||null, note: f.note||null }) });
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.error||"Errore"); return; }
    setExpandedDip(null);
    fetchEvento();
  }

  async function removeAssegnazione(assId: number) {
    if (!confirm("Rimuovere questo dipendente dall'evento?")) return;
    await fetch(`/api/eventi/${id}/assegnazioni?assegnazioneId=${assId}`, { method: "DELETE" });
    fetchEvento();
  }

  // Fetch altri eventi dello stesso giorno per vedere chi è occupato
  const [altriEventi, setAltriEventi] = useState<{ nome: string; sede: string; assegnazioni: { userId: number }[] }[]>([]);
  useEffect(() => {
    if (!evento) return;
    fetch(`/api/eventi?dataInizio=${evento.data}&dataFine=${evento.data}`)
      .then(r => r.json())
      .then(async (eventiGiorno) => {
        const altri = eventiGiorno.filter((e: { id: number }) => e.id !== evento.id);
        const dettagli = await Promise.all(
          altri.map(async (e: { id: number; nome: string; sede?: string; sedeNome?: string; sedeAltro?: string }) => {
            const res = await fetch(`/api/eventi/${e.id}`);
            if (!res.ok) return { nome: e.nome, sede: e.sede || e.sedeNome || e.sedeAltro || "—", assegnazioni: [] };
            const det = await res.json();
            return { nome: det.nome, sede: det.sede, assegnazioni: det.assegnazioni || [] };
          })
        );
        setAltriEventi(dettagli);
      })
      .catch(() => {});
  }, [evento]);

  if (loading || !evento) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;

  // Mappa: userId → nome evento dove è occupato
  const occupatiMap = new Map<number, string>();
  for (const alt of altriEventi) {
    for (const a of alt.assegnazioni) {
      occupatiMap.set(a.userId, `${alt.nome} (${alt.sede})`);
    }
  }

  const assegnatiIds = new Set(evento.assegnazioni.map(a => a.userId));
  const tuttiDisponibili = dipendenti.filter(d => !assegnatiIds.has(d.id) && (!search || `${d.nome} ${d.cognome}`.toLowerCase().includes(search.toLowerCase())));
  // Separa: prima i liberi, poi gli occupati
  const liberi = tuttiDisponibili.filter(d => !occupatiMap.has(d.id));
  const occupati = tuttiDisponibili.filter(d => occupatiMap.has(d.id));
  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{evento.nome}</h1>
            <p className="text-sm text-text-muted mt-1">{fmtData(evento.data)} {evento.oraInizio && `· ${evento.oraInizio}`}{evento.oraFine && ` – ${evento.oraFine}`}</p>
            <p className="text-sm text-text-muted">{evento.sede}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleStato} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${evento.stato === "bozza" ? "bg-green-600" : "bg-amber-600"}`}>
              {evento.stato === "bozza" ? "Conferma" : "Riporta a bozza"}
            </button>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold self-center ${evento.stato === "confermato" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>{evento.stato}</span>
          </div>
        </div>
      </div>

      {/* Tabs (mobile) */}
      <div className="mb-4 flex gap-2 lg:hidden">
        <button onClick={() => setTab("assegnati")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "assegnati" ? "bg-accent text-white" : "text-text-muted border border-border"}`}>Assegnati ({evento.assegnazioni.length})</button>
        <button onClick={() => setTab("aggiungi")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "aggiungi" ? "bg-accent text-white" : "text-text-muted border border-border"}`}>Aggiungi</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assegnati */}
        <div className={`${tab === "aggiungi" ? "hidden lg:block" : ""}`}>
          <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-lg font-bold text-foreground">{evento.assegnazioni.length} assegnati</p>
            </div>
            <div className="divide-y divide-border">
              {evento.assegnazioni.length === 0 && <p className="px-4 py-8 text-center text-text-muted">Nessun dipendente assegnato.</p>}
              {evento.assegnazioni.sort((a, b) => (a.orarioInizio||"").localeCompare(b.orarioInizio||"")).map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">{a.dipNome[0]}{a.dipCognome[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.dipNome} {a.dipCognome}</p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          {(a.orarioInizio || a.orarioFine) && <span className="font-mono">{a.orarioInizio||"—"} – {a.orarioFine||"—"}</span>}
                          {a.mansione && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${MANSIONE_COLORS[a.mansione.toLowerCase()] || "bg-zinc-500/15 text-zinc-400"}`}>{a.mansione}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeAssegnazione(a.id)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                  </div>
                  {a.note && <p className="text-xs text-text-muted italic mt-1 ml-10">{a.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aggiungi */}
        <div className={`${tab === "assegnati" ? "hidden lg:block" : ""}`}>
          <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca dipendente..." className={inputCls} />
            </div>
            <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {/* Dipendenti liberi */}
              {liberi.map(d => (
                <div key={d.id}>
                  <button onClick={() => setExpandedDip(expandedDip === d.id ? null : d.id)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">{d.nome[0]}{d.cognome[0]}</div>
                      <span className="text-sm font-medium text-foreground">{d.nome} {d.cognome}</span>
                    </div>
                    <span className="text-xs text-accent font-medium">+ Aggiungi</span>
                  </button>
                  {expandedDip === d.id && (
                    <div className="px-4 pb-3 space-y-2 bg-sidebar-bg/50">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" placeholder="Inizio" value={addForm[d.id]?.orarioInizio||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), orarioInizio: e.target.value}})} className={`${inputCls} text-xs`} />
                        <input type="time" placeholder="Fine" value={addForm[d.id]?.orarioFine||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), orarioFine: e.target.value}})} className={`${inputCls} text-xs`} />
                      </div>
                      <input placeholder="Mansione" value={addForm[d.id]?.mansione||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), mansione: e.target.value}})} className={`${inputCls} text-xs`} />
                      <button onClick={() => addAssegnazione(d.id)} className="w-full rounded-lg bg-accent py-2 text-xs font-semibold text-white">Aggiungi</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Separatore se ci sono occupati */}
              {occupati.length > 0 && liberi.length > 0 && (
                <div className="px-4 py-2 bg-sidebar-bg/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Già impegnati in altri eventi</p>
                </div>
              )}

              {/* Dipendenti occupati in altri eventi — visibili ma con stile attenuato */}
              {occupati.map(d => (
                <div key={d.id} className="opacity-50">
                  <button onClick={() => setExpandedDip(expandedDip === d.id ? null : d.id)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-500/10 text-[10px] font-bold text-zinc-500">{d.nome[0]}{d.cognome[0]}</div>
                      <div>
                        <span className="text-sm font-medium text-text-muted">{d.nome} {d.cognome}</span>
                        <p className="text-[10px] text-amber-400 font-medium">⚠ {occupatiMap.get(d.id)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">+ Aggiungi</span>
                  </button>
                  {expandedDip === d.id && (
                    <div className="px-4 pb-3 space-y-2 bg-sidebar-bg/50">
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400 mb-1">
                        Attenzione: già assegnato a <strong>{occupatiMap.get(d.id)}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" placeholder="Inizio" value={addForm[d.id]?.orarioInizio||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), orarioInizio: e.target.value}})} className={`${inputCls} text-xs`} />
                        <input type="time" placeholder="Fine" value={addForm[d.id]?.orarioFine||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), orarioFine: e.target.value}})} className={`${inputCls} text-xs`} />
                      </div>
                      <input placeholder="Mansione" value={addForm[d.id]?.mansione||""} onChange={e => setAddForm({...addForm, [d.id]: {...(addForm[d.id]||{orarioInizio:"",orarioFine:"",mansione:"",note:""}), mansione: e.target.value}})} className={`${inputCls} text-xs`} />
                      <button onClick={() => addAssegnazione(d.id)} className="w-full rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white">Aggiungi comunque</button>
                    </div>
                  )}
                </div>
              ))}

              {liberi.length === 0 && occupati.length === 0 && <p className="px-4 py-8 text-center text-text-muted text-sm">Nessun dipendente disponibile.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
