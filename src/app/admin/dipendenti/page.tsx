"use client";

import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type TipoContratto = "Fisso" | "Part-time" | "A chiamata";
type Sede = "La Casa dei Gelsi" | "Tenuta Villa Peggy's" | "Studios Club / TooLate";

interface Dipendente {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: string;
  contratto: TipoContratto;
  oreSettimanali: number;
  dataAssunzione: string;
  attivo: boolean;
  oreMese: number;
  timbrature: { data: string; tipo: "Entrata" | "Uscita"; orario: string; sede: Sede }[];
  oreSett: number[];
}

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const CONTRATTI: TipoContratto[] = ["Fisso", "Part-time", "A chiamata"];

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-amber-500/20 text-amber-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-purple-500/20 text-purple-400",
  "bg-rose-500/20 text-rose-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-orange-500/20 text-orange-400",
  "bg-indigo-500/20 text-indigo-400",
];

const initialDipendenti: Dipendente[] = [
  {
    id: 1, nome: "Marco", cognome: "Bianchi", email: "m.bianchi@presenzestaff.it", telefono: "339 1234567",
    ruolo: "Responsabile sala", contratto: "Fisso", oreSettimanali: 40,
    dataAssunzione: "2019-03-15", attivo: true, oreMese: 162,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "08:02", sede: "La Casa dei Gelsi" },
      { data: "01/04", tipo: "Uscita", orario: "16:05", sede: "La Casa dei Gelsi" },
      { data: "31/03", tipo: "Entrata", orario: "07:58", sede: "Tenuta Villa Peggy's" },
      { data: "31/03", tipo: "Uscita", orario: "16:10", sede: "Tenuta Villa Peggy's" },
      { data: "30/03", tipo: "Entrata", orario: "08:00", sede: "La Casa dei Gelsi" },
    ],
    oreSett: [40, 38, 41, 39, 40],
  },
  {
    id: 2, nome: "Giulia", cognome: "Ferretti", email: "g.ferretti@presenzestaff.it", telefono: "347 2345678",
    ruolo: "Barista", contratto: "Fisso", oreSettimanali: 40,
    dataAssunzione: "2020-06-01", attivo: true, oreMese: 158,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "09:00", sede: "Tenuta Villa Peggy's" },
      { data: "01/04", tipo: "Uscita", orario: "17:02", sede: "Tenuta Villa Peggy's" },
      { data: "31/03", tipo: "Entrata", orario: "08:55", sede: "La Casa dei Gelsi" },
      { data: "31/03", tipo: "Uscita", orario: "17:00", sede: "La Casa dei Gelsi" },
      { data: "30/03", tipo: "Entrata", orario: "09:05", sede: "Studios Club / TooLate" },
    ],
    oreSett: [38, 40, 39, 40, 38],
  },
  {
    id: 3, nome: "Alessandro", cognome: "Conti", email: "a.conti@presenzestaff.it", telefono: "333 3456789",
    ruolo: "Cameriere", contratto: "Part-time", oreSettimanali: 24,
    dataAssunzione: "2022-01-10", attivo: true, oreMese: 96,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "18:00", sede: "Studios Club / TooLate" },
      { data: "01/04", tipo: "Uscita", orario: "00:05", sede: "Studios Club / TooLate" },
      { data: "30/03", tipo: "Entrata", orario: "18:00", sede: "Studios Club / TooLate" },
      { data: "30/03", tipo: "Uscita", orario: "00:10", sede: "Studios Club / TooLate" },
      { data: "29/03", tipo: "Entrata", orario: "18:05", sede: "Tenuta Villa Peggy's" },
    ],
    oreSett: [24, 22, 24, 20, 24],
  },
  {
    id: 4, nome: "Francesca", cognome: "Romano", email: "f.romano@presenzestaff.it", telefono: "340 4567890",
    ruolo: "Cuoca", contratto: "Fisso", oreSettimanali: 40,
    dataAssunzione: "2018-09-20", attivo: true, oreMese: 168,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "06:30", sede: "La Casa dei Gelsi" },
      { data: "01/04", tipo: "Uscita", orario: "14:35", sede: "La Casa dei Gelsi" },
      { data: "31/03", tipo: "Entrata", orario: "06:28", sede: "Tenuta Villa Peggy's" },
      { data: "31/03", tipo: "Uscita", orario: "14:30", sede: "Tenuta Villa Peggy's" },
      { data: "30/03", tipo: "Entrata", orario: "06:32", sede: "La Casa dei Gelsi" },
    ],
    oreSett: [42, 40, 41, 40, 42],
  },
  {
    id: 5, nome: "Luca", cognome: "Moretti", email: "l.moretti@presenzestaff.it", telefono: "328 5678901",
    ruolo: "DJ / Fonico", contratto: "A chiamata", oreSettimanali: 0,
    dataAssunzione: "2023-04-01", attivo: true, oreMese: 48,
    timbrature: [
      { data: "30/03", tipo: "Entrata", orario: "22:00", sede: "Studios Club / TooLate" },
      { data: "31/03", tipo: "Uscita", orario: "04:00", sede: "Studios Club / TooLate" },
      { data: "29/03", tipo: "Entrata", orario: "22:30", sede: "Studios Club / TooLate" },
      { data: "30/03", tipo: "Uscita", orario: "04:15", sede: "Studios Club / TooLate" },
      { data: "23/03", tipo: "Entrata", orario: "22:00", sede: "Tenuta Villa Peggy's" },
    ],
    oreSett: [12, 0, 12, 6, 12],
  },
  {
    id: 6, nome: "Sara", cognome: "Colombo", email: "s.colombo@presenzestaff.it", telefono: "349 6789012",
    ruolo: "Cameriera", contratto: "Part-time", oreSettimanali: 20,
    dataAssunzione: "2023-09-15", attivo: true, oreMese: 80,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "11:00", sede: "Tenuta Villa Peggy's" },
      { data: "01/04", tipo: "Uscita", orario: "15:00", sede: "Tenuta Villa Peggy's" },
      { data: "31/03", tipo: "Entrata", orario: "11:05", sede: "La Casa dei Gelsi" },
      { data: "31/03", tipo: "Uscita", orario: "15:02", sede: "La Casa dei Gelsi" },
      { data: "30/03", tipo: "Entrata", orario: "11:00", sede: "Tenuta Villa Peggy's" },
    ],
    oreSett: [20, 18, 20, 20, 16],
  },
  {
    id: 7, nome: "Davide", cognome: "Ricci", email: "d.ricci@presenzestaff.it", telefono: "335 7890123",
    ruolo: "Barman", contratto: "A chiamata", oreSettimanali: 0,
    dataAssunzione: "2024-01-20", attivo: false, oreMese: 0,
    timbrature: [
      { data: "15/02", tipo: "Entrata", orario: "19:00", sede: "La Casa dei Gelsi" },
      { data: "15/02", tipo: "Uscita", orario: "01:00", sede: "La Casa dei Gelsi" },
      { data: "14/02", tipo: "Entrata", orario: "19:00", sede: "Studios Club / TooLate" },
      { data: "14/02", tipo: "Uscita", orario: "01:05", sede: "Studios Club / TooLate" },
      { data: "10/02", tipo: "Entrata", orario: "19:30", sede: "Tenuta Villa Peggy's" },
    ],
    oreSett: [0, 0, 0, 0, 0],
  },
  {
    id: 8, nome: "Elena", cognome: "Galli", email: "e.galli@presenzestaff.it", telefono: "320 8901234",
    ruolo: "Responsabile bar", contratto: "Fisso", oreSettimanali: 36,
    dataAssunzione: "2021-11-01", attivo: true, oreMese: 144,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "20:00", sede: "Studios Club / TooLate" },
      { data: "02/04", tipo: "Uscita", orario: "02:10", sede: "Studios Club / TooLate" },
      { data: "31/03", tipo: "Entrata", orario: "20:00", sede: "Studios Club / TooLate" },
      { data: "01/04", tipo: "Uscita", orario: "02:00", sede: "Studios Club / TooLate" },
      { data: "29/03", tipo: "Entrata", orario: "20:05", sede: "La Casa dei Gelsi" },
    ],
    oreSett: [36, 34, 36, 36, 30],
  },
  {
    id: 9, nome: "Andrea", cognome: "Marino", email: "a.marino@presenzestaff.it", telefono: "338 9012345",
    ruolo: "Aiuto cuoco", contratto: "Part-time", oreSettimanali: 24,
    dataAssunzione: "2024-06-10", attivo: true, oreMese: 92,
    timbrature: [
      { data: "01/04", tipo: "Entrata", orario: "10:00", sede: "La Casa dei Gelsi" },
      { data: "01/04", tipo: "Uscita", orario: "16:00", sede: "La Casa dei Gelsi" },
      { data: "31/03", tipo: "Entrata", orario: "10:05", sede: "Tenuta Villa Peggy's" },
      { data: "31/03", tipo: "Uscita", orario: "16:00", sede: "Tenuta Villa Peggy's" },
      { data: "30/03", tipo: "Entrata", orario: "10:00", sede: "La Casa dei Gelsi" },
    ],
    oreSett: [24, 22, 24, 24, 18],
  },
  {
    id: 10, nome: "Chiara", cognome: "Greco", email: "c.greco@presenzestaff.it", telefono: "342 0123456",
    ruolo: "Hostess", contratto: "A chiamata", oreSettimanali: 0,
    dataAssunzione: "2025-02-01", attivo: true, oreMese: 32,
    timbrature: [
      { data: "30/03", tipo: "Entrata", orario: "18:30", sede: "Tenuta Villa Peggy's" },
      { data: "30/03", tipo: "Uscita", orario: "00:30", sede: "Tenuta Villa Peggy's" },
      { data: "29/03", tipo: "Entrata", orario: "18:00", sede: "Studios Club / TooLate" },
      { data: "29/03", tipo: "Uscita", orario: "00:00", sede: "Studios Club / TooLate" },
      { data: "23/03", tipo: "Entrata", orario: "18:30", sede: "La Casa dei Gelsi" },
    ],
    oreSett: [12, 6, 6, 0, 12],
  },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function contrattoStyle(c: TipoContratto) {
  switch (c) {
    case "Fisso":
      return "bg-blue-500/10 text-blue-400";
    case "Part-time":
      return "bg-amber-500/10 text-amber-400";
    case "A chiamata":
      return "bg-purple-500/10 text-purple-400";
  }
}

function emptyForm(): Omit<Dipendente, "id" | "oreMese" | "timbrature" | "oreSett"> {
  return {
    nome: "", cognome: "", email: "", telefono: "", ruolo: "",
    contratto: "Fisso", oreSettimanali: 40,
    dataAssunzione: "", attivo: true,
  };
}

const SEDE_COLORS: Record<Sede, string> = {
  "La Casa dei Gelsi": "text-blue-400",
  "Tenuta Villa Peggy's": "text-amber-400",
  "Studios Club / TooLate": "text-emerald-400",
};

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function DipendentiPage() {
  const [dipendenti, setDipendenti] = useState(initialDipendenti);
  const [search, setSearch] = useState("");
  const [filtroContratto, setFiltroContratto] = useState<string>("");

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

  const [detailDip, setDetailDip] = useState<Dipendente | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<Dipendente | null>(null);

  /* ── Filtri combinati ── */
  const filtered = useMemo(() => {
    return dipendenti.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.nome.toLowerCase().includes(q) || d.cognome.toLowerCase().includes(q);
      const matchContratto = !filtroContratto || d.contratto === filtroContratto;
      return matchSearch && matchContratto;
    });
  }, [dipendenti, search, filtroContratto]);

  /* ── Form handlers ── */
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(d: Dipendente) {
    setEditingId(d.id);
    setForm({
      nome: d.nome, cognome: d.cognome, email: d.email, telefono: d.telefono,
      ruolo: d.ruolo, contratto: d.contratto,
      oreSettimanali: d.oreSettimanali, dataAssunzione: d.dataAssunzione, attivo: d.attivo,
    });
    setFormOpen(true);
  }

  function saveForm() {
    if (!form.nome || !form.cognome) return;
    if (editingId !== null) {
      setDipendenti((prev) =>
        prev.map((d) => (d.id === editingId ? { ...d, ...form } : d))
      );
    } else {
      const newId = Math.max(...dipendenti.map((d) => d.id)) + 1;
      setDipendenti((prev) => [
        ...prev,
        { ...form, id: newId, oreMese: 0, timbrature: [], oreSett: [0, 0, 0, 0, 0] } as Dipendente,
      ]);
    }
    setFormOpen(false);
  }

  function toggleAttivo(d: Dipendente) {
    setDipendenti((prev) =>
      prev.map((x) => (x.id === d.id ? { ...x, attivo: !x.attivo } : x))
    );
    setConfirmDisable(null);
  }

  const [confirmDelete, setConfirmDelete] = useState<Dipendente | null>(null);

  function deleteDipendente(d: Dipendente) {
    setDipendenti((prev) => prev.filter((x) => x.id !== d.id));
    setConfirmDelete(null);
  }

  /* ── Ultima sede timbrata ── */
  function ultimaSede(d: Dipendente): Sede | null {
    if (d.timbrature.length === 0) return null;
    return d.timbrature[0].sede;
  }

  /* ── Select styling ── */
  const selectCls =
    "rounded-lg border border-border bg-sidebar-bg px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer";
  const inputCls =
    "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Dipendenti</h1>
          <p className="mt-1 text-sm text-text-muted">{filtered.length} dipendenti trovati</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Aggiungi Dipendente
        </button>
      </div>

      {/* ── Filtri ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cerca per nome o cognome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={filtroContratto} onChange={(e) => setFiltroContratto(e.target.value)} className={selectCls}>
          <option value="">Tutti i contratti</option>
          {CONTRATTI.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Tabella ── */}
      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 font-medium">Dipendente</th>
                <th className="px-5 py-3 font-medium">Ruolo</th>
                <th className="px-5 py-3 font-medium">Contratto</th>
                <th className="px-5 py-3 font-medium">Ultima sede</th>
                <th className="px-5 py-3 font-medium">Stato</th>
                <th className="px-5 py-3 font-medium text-right">Ore mese</th>
                <th className="px-5 py-3 font-medium text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const sede = ultimaSede(d);
                return (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {d.nome[0]}{d.cognome[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.nome} {d.cognome}</p>
                          <p className="text-xs text-text-muted">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{d.ruolo}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${contrattoStyle(d.contratto)}`}>
                        {d.contratto}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {sede ? (
                        <span className={`text-sm font-medium ${SEDE_COLORS[sede]}`}>{sede}</span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${d.attivo ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${d.attivo ? "bg-green-400" : "bg-zinc-500"}`} />
                        {d.attivo ? "Attivo" : "Disattivato"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-mono text-foreground">{d.oreMese}h</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailDip(d)} className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-blue-400 transition-colors" title="Dettaglio">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-amber-400 transition-colors" title="Modifica">
                          <PenIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDisable(d)} className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-red-400 transition-colors" title={d.attivo ? "Disattiva" : "Riattiva"}>
                          <PowerIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(d)} className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-red-400 transition-colors" title="Elimina">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">
                    Nessun dipendente trovato con i filtri selezionati.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODALE FORM (Aggiungi / Modifica) ═══ */}
      {formOpen && (
        <ModalOverlay onClose={() => setFormOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? "Modifica Dipendente" : "Nuovo Dipendente"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-text-muted hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} placeholder="Marco" />
                <Field label="Cognome" value={form.cognome} onChange={(v) => setForm({ ...form, cognome: v })} placeholder="Bianchi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m.bianchi@email.it" type="email" />
                <Field label="Telefono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} placeholder="339 1234567" />
              </div>
              <Field label="Ruolo aziendale" value={form.ruolo} onChange={(v) => setForm({ ...form, ruolo: v })} placeholder="Cameriere, Barista, ecc." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo contratto</label>
                  <select
                    value={form.contratto}
                    onChange={(e) => setForm({ ...form, contratto: e.target.value as TipoContratto })}
                    className={`${selectCls} w-full`}
                  >
                    {CONTRATTI.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field
                  label="Ore settimanali"
                  value={String(form.oreSettimanali)}
                  onChange={(v) => setForm({ ...form, oreSettimanali: Number(v) || 0 })}
                  type="number"
                  placeholder="40"
                />
              </div>
              <Field
                label="Data assunzione"
                value={form.dataAssunzione}
                onChange={(v) => setForm({ ...form, dataAssunzione: v })}
                type="date"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Stato</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, attivo: !form.attivo })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.attivo ? "bg-green-500" : "bg-zinc-600"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.attivo ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-text-muted">{form.attivo ? "Attivo" : "Disattivato"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setFormOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                Annulla
              </button>
              <button onClick={saveForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
                {editingId ? "Salva modifiche" : "Aggiungi"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ MODALE DETTAGLIO ═══ */}
      {detailDip && (
        <ModalOverlay onClose={() => setDetailDip(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Dettaglio Dipendente</h2>
              <button onClick={() => setDetailDip(null)} className="text-text-muted hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${AVATAR_COLORS[detailDip.id % AVATAR_COLORS.length]}`}>
                  {detailDip.nome[0]}{detailDip.cognome[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{detailDip.nome} {detailDip.cognome}</p>
                  <p className="text-sm text-text-muted">{detailDip.ruolo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Email" value={detailDip.email} />
                <InfoRow label="Telefono" value={detailDip.telefono} />
                <InfoRow label="Contratto" value={detailDip.contratto} />
                <InfoRow label="Ore settimanali" value={detailDip.oreSettimanali > 0 ? `${detailDip.oreSettimanali}h` : "Su chiamata"} />
                <InfoRow label="Data assunzione" value={detailDip.dataAssunzione} />
                <InfoRow label="Stato" value={detailDip.attivo ? "Attivo" : "Disattivato"} />
              </div>

              {/* Ore ultima settimana */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Ore lavorate — ultima settimana</h3>
                <div className="flex items-end gap-1.5 h-20">
                  {detailDip.oreSett.map((h, i) => {
                    const max = Math.max(...detailDip.oreSett, 1);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] text-text-muted">{h}h</span>
                        <div
                          className="w-full rounded-t bg-accent/60"
                          style={{ height: `${(h / max) * 48}px` }}
                        />
                        <span className="text-[10px] text-text-muted">
                          {["Lun", "Mar", "Mer", "Gio", "Ven"][i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ultime 5 timbrature con sede */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Ultime 5 timbrature</h3>
                <div className="space-y-1.5">
                  {detailDip.timbrature.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-sidebar-bg px-3 py-2 text-sm">
                      <span className="text-text-muted">{t.data}</span>
                      <span className={`text-xs font-medium ${SEDE_COLORS[t.sede]}`}>{t.sede}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.tipo === "Entrata" ? "text-green-400" : "text-red-400"}`}>
                        {t.tipo === "Entrata" ? "↓" : "↑"} {t.tipo}
                      </span>
                      <span className="font-mono text-foreground">{t.orario}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-border px-6 py-4">
              <button onClick={() => setDetailDip(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                Chiudi
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ MODALE CONFERMA DISATTIVA ═══ */}
      {confirmDisable && (
        <ModalOverlay onClose={() => setConfirmDisable(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <PowerIcon className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {confirmDisable.attivo ? "Disattiva" : "Riattiva"} dipendente?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              {confirmDisable.attivo
                ? `Stai per disattivare ${confirmDisable.nome} ${confirmDisable.cognome}. Non potrà più timbrare fino alla riattivazione.`
                : `Stai per riattivare ${confirmDisable.nome} ${confirmDisable.cognome}. Potrà nuovamente timbrare.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmDisable(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                Annulla
              </button>
              <button
                onClick={() => toggleAttivo(confirmDisable)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${confirmDisable.attivo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {confirmDisable.attivo ? "Disattiva" : "Riattiva"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ MODALE CONFERMA ELIMINA ═══ */}
      {confirmDelete && (
        <ModalOverlay onClose={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <TrashIcon className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Eliminare dipendente?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Stai per eliminare definitivamente <strong>{confirmDelete.nome} {confirmDelete.cognome}</strong>. Questa azione non può essere annullata e tutti i dati associati andranno persi.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                Annulla
              </button>
              <button
                onClick={() => deleteDipendente(confirmDelete)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sidebar-bg px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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

function PowerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
