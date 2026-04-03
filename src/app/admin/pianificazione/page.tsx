"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Assegnazione { id: number; turnoId: number; userId: number; mansione: string | null; dipNome: string; dipCognome: string; }
interface Turno { id: number; data: string; sedeId: number; areaOperativa: string; orarioInizio: string; orarioFine: string; note: string | null; stato: string; sedeNome: string; assegnazioni: Assegnazione[]; }
interface Evento { id: number; nome: string; data: string; oraInizio: string|null; oraFine: string|null; sede: string; stato: string; assegnati: number; sedeId: number|null; }
interface Dip { id: number; nome: string; cognome: string; tipoContratto: string; attivo: boolean; }
interface Sede { id: number; nome: string; }

const AREE = ["sala", "bar", "cassa", "guardaroba", "altro"];
const AREA_COLORS: Record<string, string> = { sala: "bg-blue-500/15 text-blue-400", bar: "bg-amber-500/15 text-amber-400", cassa: "bg-green-500/15 text-green-400", guardaroba: "bg-purple-500/15 text-purple-400", altro: "bg-zinc-500/15 text-zinc-400" };
const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function isoD(d: Date) { return d.toISOString().slice(0, 10); }
function getMonday(d: Date) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function PianificazionePage() {
  const [tab, setTab] = useState<"settimana" | "giorno">("settimana");
  const [turni, setTurni] = useState<Turno[]>([]);
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [sedi, setSedi] = useState<Sede[]>([]);
  const [dipendenti, setDipendenti] = useState<Dip[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekOffset, setWeekOffset] = useState(0);
  const monday = useMemo(() => { const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m; }, [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);

  const [selectedDate, setSelectedDate] = useState(isoD(new Date()));
  const [filtroSede, setFiltroSede] = useState("");

  // Turno form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ data: "", sedeId: 0, areaOperativa: "sala", orarioInizio: "09:00", orarioFine: "17:00", note: "", stato: "bozza" });
  const [assignTurno, setAssignTurno] = useState<Turno | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Turno | null>(null);
  const [confirmConferma, setConfirmConferma] = useState<Turno | null>(null);

  useEffect(() => { fetch("/api/sedi").then(r => r.json()).then(setSedi).catch(() => {}); }, []);
  useEffect(() => { fetch("/api/dipendenti").then(r => r.json()).then(d => setDipendenti(d.filter((x: Dip) => x.attivo))).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const dataInizio = tab === "settimana" ? isoD(monday) : selectedDate;
    const dataFine = tab === "settimana" ? isoD(sunday) : selectedDate;
    try {
      const [turniRes, eventiRes] = await Promise.all([
        fetch(`/api/turni?dataInizio=${dataInizio}&dataFine=${dataFine}`),
        fetch(`/api/eventi?dataInizio=${dataInizio}&dataFine=${dataFine}`),
      ]);
      if (turniRes.ok) setTurni(await turniRes.json());
      if (eventiRes.ok) setEventi(await eventiRes.json());
    } catch {}
    setLoading(false);
  }, [tab, monday, sunday, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Turno CRUD
  function openAdd(data: string, sedeId: number) { setEditId(null); setForm({ data, sedeId, areaOperativa: "sala", orarioInizio: "09:00", orarioFine: "17:00", note: "", stato: "bozza" }); setShowForm(true); }
  function openEdit(t: Turno) { setEditId(t.id); setForm({ data: t.data, sedeId: t.sedeId, areaOperativa: t.areaOperativa, orarioInizio: t.orarioInizio, orarioFine: t.orarioFine, note: t.note || "", stato: t.stato }); setShowForm(true); }
  async function saveForm() {
    const url = editId ? `/api/turni/${editId}` : "/api/turni";
    const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || "Errore"); return; }
    setShowForm(false); fetchData();
  }
  async function deleteTurno() { if (!confirmDelete) return; await fetch(`/api/turni/${confirmDelete.id}`, { method: "DELETE" }); setConfirmDelete(null); fetchData(); }
  async function confermaTurno() { if (!confirmConferma) return; await fetch(`/api/turni/${confirmConferma.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stato: "confermato" }) }); setConfirmConferma(null); fetchData(); }
  async function addAssegnazione(turnoId: number, userId: number) { const res = await fetch(`/api/turni/${turnoId}/assegnazioni`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) }); if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || "Errore"); return; } fetchData(); }
  async function removeAssegnazione(turnoId: number, assegnazioneId: number) { await fetch(`/api/turni/${turnoId}/assegnazioni?assegnazioneId=${assegnazioneId}`, { method: "DELETE" }); fetchData(); }

  const fmtPeriod = `${monday.getDate()}/${monday.getMonth() + 1} – ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pianificazione</h1>
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
            <button onClick={() => setWeekOffset(p => p - 1)} className="rounded-lg border border-border p-1.5 text-text-muted hover:text-foreground">◀</button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{fmtPeriod}</span>
            <button onClick={() => setWeekOffset(p => p + 1)} className="rounded-lg border border-border p-1.5 text-text-muted hover:text-foreground">▶</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs text-text-muted font-medium text-left w-32">Sede / Evento</th>
                  {GIORNI.map((g, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return <th key={g} className="p-2 text-xs text-text-muted font-medium text-center">{g} {d.getDate()}/{d.getMonth() + 1}</th>; })}
                </tr>
              </thead>
              <tbody>
                {/* Righe sedi (turni) */}
                {sedi.map(sede => (
                  <tr key={sede.id} className="border-t border-border">
                    <td className="p-2 text-sm font-medium text-foreground align-top">{sede.nome}</td>
                    {GIORNI.map((_, i) => {
                      const d = new Date(monday); d.setDate(d.getDate() + i); const dayStr = isoD(d);
                      const dayTurni = turni.filter(t => t.data === dayStr && t.sedeId === sede.id);
                      return (
                        <td key={i} className="p-1 align-top min-w-[100px]">
                          {dayTurni.map(t => (
                            <button key={t.id} onClick={() => openEdit(t)} className={`w-full mb-1 rounded-lg p-1.5 text-[10px] text-left transition-colors ${t.stato === "confermato" ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                              <div className="font-semibold text-foreground">{t.orarioInizio}-{t.orarioFine}</div>
                              <div className="text-text-muted">{t.areaOperativa} · {t.assegnazioni.length}p</div>
                            </button>
                          ))}
                          <button onClick={() => openAdd(dayStr, sede.id)} className="w-full rounded-lg border border-dashed border-border p-1 text-xs text-text-muted hover:text-accent hover:border-accent transition-colors">+</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Riga eventi */}
                {eventi.length > 0 && (
                  <tr className="border-t-2 border-accent/30">
                    <td className="p-2 text-sm font-bold text-accent align-top">⭐ Eventi</td>
                    {GIORNI.map((_, i) => {
                      const d = new Date(monday); d.setDate(d.getDate() + i); const dayStr = isoD(d);
                      const dayEventi = eventi.filter(e => e.data === dayStr);
                      return (
                        <td key={i} className="p-1 align-top min-w-[100px]">
                          {dayEventi.map(e => (
                            <Link key={e.id} href={`/admin/eventi/${e.id}`} className={`block w-full mb-1 rounded-lg p-1.5 text-[10px] text-left transition-colors ${e.stato === "confermato" ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-500/5 border border-purple-500/10"}`}>
                              <div className="font-semibold text-purple-400">{e.nome}</div>
                              <div className="text-text-muted">{e.oraInizio || "—"} · {e.assegnati}p</div>
                            </Link>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ══ VISTA GIORNO ══ */
        <>
          <div className="mb-4 flex gap-3 items-center flex-wrap">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground" />
            <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)} className="rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer">
              <option value="">Tutte le sedi</option>
              {sedi.map(s => <option key={s.id} value={String(s.id)}>{s.nome}</option>)}
            </select>
            <button onClick={() => openAdd(selectedDate, sedi[0]?.id || 0)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">+ Nuovo turno</button>
          </div>

          {/* Eventi del giorno */}
          {eventi.filter(e => e.data === selectedDate).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">⭐ Eventi</p>
              <div className="space-y-2">
                {eventi.filter(e => e.data === selectedDate).map(e => (
                  <Link key={e.id} href={`/admin/eventi/${e.id}`} className="block rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4 hover:bg-purple-500/[0.08] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-foreground">{e.nome}</p>
                        <p className="text-sm text-text-muted">{e.sede} {e.oraInizio && `· ${e.oraInizio}`}{e.oraFine && ` – ${e.oraFine}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted">{e.assegnati}p</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.stato === "confermato" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>{e.stato}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Turni del giorno */}
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Turni</p>
          <div className="space-y-3">
            {turni.filter(t => !filtroSede || t.sedeId === parseInt(filtroSede)).map(t => (
              <div key={t.id} className={`rounded-xl border p-4 ${t.stato === "confermato" ? "border-green-500/30 bg-green-500/[0.03]" : "border-amber-500/30 bg-amber-500/[0.03]"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.sedeNome}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${AREA_COLORS[t.areaOperativa] || AREA_COLORS.altro}`}>{t.areaOperativa}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.stato === "confermato" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>{t.stato === "confermato" ? "Confermato" : "Bozza"}</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{t.orarioInizio} – {t.orarioFine}</p>
                {t.note && <p className="text-xs text-text-muted mt-1 italic">{t.note}</p>}
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-xs font-semibold text-text-muted mb-1">{t.assegnazioni.length} assegnati</p>
                  {t.assegnazioni.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">{a.dipNome} {a.dipCognome}</span>
                      <button onClick={() => removeAssegnazione(t.id, a.id)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setAssignTurno(t)} className="mt-1 text-xs text-accent font-medium">+ Assegna</button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(t)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-foreground">Modifica</button>
                  {t.stato === "bozza" && (
                    <>
                      <button onClick={() => setConfirmConferma(t)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white">Conferma</button>
                      <button onClick={() => setConfirmDelete(t)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400">Elimina</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {turni.filter(t => !filtroSede || t.sedeId === parseInt(filtroSede)).length === 0 && (
              <p className="text-center text-text-muted py-8">Nessun turno per questo giorno.</p>
            )}
          </div>
        </>
      )}

      {/* ═══ MODALI ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card-bg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">{editId ? "Modifica Turno" : "Nuovo Turno"}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-foreground text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-text-muted mb-1 block">Data</label><input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground" /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Sede</label><select value={form.sedeId} onChange={e => setForm({...form, sedeId: parseInt(e.target.value)})} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground">{sedi.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
              </div>
              <div><label className="text-xs text-text-muted mb-1 block">Area</label><select value={form.areaOperativa} onChange={e => setForm({...form, areaOperativa: e.target.value})} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground">{AREE.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-text-muted mb-1 block">Inizio</label><input type="time" value={form.orarioInizio} onChange={e => setForm({...form, orarioInizio: e.target.value})} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground" /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Fine</label><input type="time" value={form.orarioFine} onChange={e => setForm({...form, orarioFine: e.target.value})} className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground" /></div>
              </div>
              <div><label className="text-xs text-text-muted mb-1 block">Note</label><input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Opzionale" className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground placeholder:text-text-muted" /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted">Annulla</button>
              <button onClick={saveForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">Salva</button>
            </div>
          </div>
        </div>
      )}

      {assignTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAssignTurno(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card-bg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Assegna — {assignTurno.areaOperativa} {assignTurno.orarioInizio}-{assignTurno.orarioFine}</h2>
              <button onClick={() => setAssignTurno(null)} className="text-text-muted text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-xs font-semibold text-text-muted mb-2 uppercase">Assegnati ({assignTurno.assegnazioni.length})</p>
              {assignTurno.assegnazioni.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{a.dipNome} {a.dipCognome}</span>
                  <button onClick={() => removeAssegnazione(assignTurno.id, a.id)} className="text-xs text-red-400">Rimuovi</button>
                </div>
              ))}
              <p className="text-xs font-semibold text-text-muted mt-4 mb-2 uppercase">Disponibili</p>
              {dipendenti.filter(d => !assignTurno.assegnazioni.some(a => a.userId === d.id)).map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{d.nome} {d.cognome}</span>
                  <button onClick={() => addAssegnazione(assignTurno.id, d.id)} className="text-xs text-accent font-medium">+ Aggiungi</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">Elimina turno?</h3>
            <p className="mt-2 text-sm text-text-muted">{confirmDelete.areaOperativa} ({confirmDelete.orarioInizio}-{confirmDelete.orarioFine})</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted">Annulla</button>
              <button onClick={deleteTurno} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Elimina</button>
            </div>
          </div>
        </div>
      )}

      {confirmConferma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmConferma(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">Conferma turno?</h3>
            <p className="mt-2 text-sm text-text-muted">Non potrà più essere eliminato.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setConfirmConferma(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted">Annulla</button>
              <button onClick={confermaTurno} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Conferma</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
