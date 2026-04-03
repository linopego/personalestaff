"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; assegnati: number; sedeId: number|null; sedeAltro: string|null; }

const SEDE_CARD: Record<string, string> = { "La Casa dei Gelsi": "bg-amber-500/10 border-amber-500/25", "Tenuta Villa Peggy's": "bg-emerald-500/10 border-emerald-500/25", "Studios Club / TooLate": "bg-blue-500/10 border-blue-500/25" };
const SEDE_TXT: Record<string, string> = { "La Casa dei Gelsi": "text-amber-400", "Tenuta Villa Peggy's": "text-emerald-400", "Studios Club / TooLate": "text-blue-400" };
function eCardStyle(sede: string) { return SEDE_CARD[sede] || "bg-zinc-500/10 border-zinc-500/25"; }
function eTxtStyle(sede: string) { return SEDE_TXT[sede] || "text-zinc-400"; }
interface Sede { id: number; nome: string; }

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

function isoD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function getMonday(d: Date) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }
function fmtDataCorta(iso: string) { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${MESI[d.getMonth()].slice(0,3)}`; }

export default function PianificazionePage() {
  const [tab, setTab] = useState<"settimana" | "giorno">("settimana");
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [sedi, setSedi] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekOffset, setWeekOffset] = useState(0);
  const monday = useMemo(() => { const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m; }, [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);

  const [selectedDate, setSelectedDate] = useState(isoD(new Date()));

  // Evento form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ nome: "", data: "", oraInizio: "", oraFine: "", sedeId: 0, sedeAltro: "", descrizione: "", sedeType: "sede" as "sede"|"altro" });

  useEffect(() => { fetch("/api/sedi").then(r => r.json()).then(setSedi).catch(() => {}); }, []);

  const fetchEventi = useCallback(async () => {
    setLoading(true);
    const dataInizio = tab === "settimana" ? isoD(monday) : selectedDate;
    const dataFine = tab === "settimana" ? isoD(sunday) : selectedDate;
    try {
      const res = await fetch(`/api/eventi?dataInizio=${dataInizio}&dataFine=${dataFine}`);
      if (res.ok) setEventi(await res.json());
    } catch {}
    setLoading(false);
  }, [tab, monday, sunday, selectedDate]);

  useEffect(() => { fetchEventi(); }, [fetchEventi]);

  function openAdd(data: string) {
    setEditId(null);
    setForm({ nome: "", data, oraInizio: "", oraFine: "", sedeId: sedi[0]?.id || 0, sedeAltro: "", descrizione: "", sedeType: "sede" });
    setShowForm(true);
  }

  async function saveForm() {
    if (!form.nome || !form.data) { alert("Nome e data obbligatori"); return; }
    const body = { nome: form.nome, data: form.data, oraInizio: form.oraInizio || null, oraFine: form.oraFine || null, sedeId: form.sedeType === "sede" ? form.sedeId : null, sedeAltro: form.sedeType === "altro" ? form.sedeAltro : null, descrizione: form.descrizione || null, stato: "confermato" };
    const url = editId ? `/api/eventi/${editId}` : "/api/eventi";
    const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || "Errore"); return; }
    setShowForm(false); fetchEventi();
  }

  const oggi = isoD(new Date());
  const fmtPeriod = `Lun ${fmtDataCorta(isoD(monday))} — Dom ${fmtDataCorta(isoD(sunday))} ${sunday.getFullYear()}`;
  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pianificazione</h1>
        <button onClick={() => openAdd(tab === "giorno" ? selectedDate : oggi)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">+ Nuovo Evento</button>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("settimana")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "settimana" ? "bg-accent text-white" : "text-text-muted hover:bg-white/5"}`}>Vista Settimana</button>
        <button onClick={() => setTab("giorno")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "giorno" ? "bg-accent text-white" : "text-text-muted hover:bg-white/5"}`}>Vista Giorno</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : tab === "settimana" ? (
        <>
          <div className="mb-4 flex items-center gap-3">
            <button onClick={() => setWeekOffset(p => p - 1)} className="rounded-lg border border-border p-2 text-text-muted hover:text-foreground transition-colors">◀</button>
            <span className="text-sm font-semibold text-foreground flex-1 text-center">{fmtPeriod}</span>
            <button onClick={() => setWeekOffset(p => p + 1)} className="rounded-lg border border-border p-2 text-text-muted hover:text-foreground transition-colors">▶</button>
          </div>

          {/* Griglia settimanale */}
          <div className="grid grid-cols-7 gap-2">
            {GIORNI.map((g, i) => {
              const d = new Date(monday); d.setDate(d.getDate() + i);
              const dayStr = isoD(d);
              const isOggi = dayStr === oggi;
              const dayEventi = eventi.filter(e => e.data === dayStr);
              return (
                <div key={i} className={`rounded-xl border p-2 min-h-[120px] ${isOggi ? "border-accent/40 bg-accent/[0.03]" : "border-border bg-card-bg"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`text-xs font-bold ${isOggi ? "text-accent" : "text-text-muted"}`}>{g}</p>
                      <p className={`text-lg font-bold ${isOggi ? "text-accent" : "text-foreground"}`}>{d.getDate()}</p>
                    </div>
                    {isOggi && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[8px] font-bold text-accent">OGGI</span>}
                  </div>
                  {dayEventi.map(e => (
                    <Link key={e.id} href={`/admin/eventi/${e.id}`}
                      className={`block w-full mb-1.5 rounded-lg p-2 text-left transition-all hover:brightness-110 border ${eCardStyle(e.sede)}`}>
                      <p className={`text-xs font-semibold truncate ${eTxtStyle(e.sede)}`}>{e.nome}</p>
                      <p className="text-[10px] text-text-muted">{e.oraInizio || "—"} · {e.sede}</p>
                      <p className="text-[10px] text-text-muted">{e.assegnati} persone</p>
                    </Link>
                  ))}
                  <button onClick={() => openAdd(dayStr)} className="w-full rounded-lg border border-dashed border-border p-1.5 text-xs text-text-muted hover:text-accent hover:border-accent transition-colors mt-1">+ Aggiungi</button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ══ VISTA GIORNO ══ */
        <>
          <div className="mb-4 flex gap-3 items-center flex-wrap">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground" />
            <button onClick={() => openAdd(selectedDate)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">+ Nuovo evento</button>
          </div>
          <div className="space-y-3">
            {eventi.length === 0 && <p className="text-center text-text-muted py-12">Nessun evento per questo giorno.</p>}
            {eventi.map(e => (
              <Link key={e.id} href={`/admin/eventi/${e.id}`} className={`block rounded-xl border p-4 transition-all hover:brightness-105 ${eCardStyle(e.sede)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-foreground">{e.nome}</p>
                    <p className="text-sm text-text-muted">{e.sede}</p>
                  </div>
                  <span className="text-sm text-text-muted">{e.assegnati}p</span>
                </div>
                {(e.oraInizio || e.oraFine) && <p className="text-2xl font-bold text-foreground tabular-nums">{e.oraInizio || "—"} – {e.oraFine || "—"}</p>}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ═══ MODALE NUOVO EVENTO ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card-bg shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Nuovo Evento</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-foreground text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs text-text-muted mb-1 block">Nome evento *</label><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="es. Catering Villa Rossi" className={inputCls} /></div>
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
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted">Annulla</button>
              <button onClick={saveForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">Crea evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
