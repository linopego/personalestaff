"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type Tab = "generale" | "utenti" | "notifiche" | "sicurezza";
type TipoContratto = "Fisso" | "Part-time" | "A chiamata";

interface Utente {
  id: number;
  nome: string;
  email: string;
  contratto: TipoContratto;
  ultimoAccesso: string;
  attivo: boolean;
}

interface NotificaPref {
  turniIncompleti: boolean;
  turniIncompletiEmail: string;
  oreMax: boolean;
  oreMaxEmail: string;
  riepilogoSett: boolean;
  riepilogoSettEmail: string;
  timbratureAnomale: boolean;
  timbratureAnomaleEmail: string;
}

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */


const logAccessi = [
  { data: "01/04/2026 09:15", utente: "Admin (Marco Bianchi)", dispositivo: "Chrome / macOS", ip: "93.42.118.xxx", esito: "Successo" as const },
  { data: "01/04/2026 08:02", utente: "Marco Bianchi", dispositivo: "App iOS 17.4", ip: "93.42.118.xxx", esito: "Successo" as const },
  { data: "01/04/2026 06:30", utente: "Francesca Romano", dispositivo: "App Android 14", ip: "151.38.22.xxx", esito: "Successo" as const },
  { data: "31/03/2026 23:58", utente: "Utente sconosciuto", dispositivo: "Firefox / Windows", ip: "185.220.101.xxx", esito: "Fallito" as const },
  { data: "31/03/2026 20:00", utente: "Elena Galli", dispositivo: "App iOS 17.4", ip: "2.237.84.xxx", esito: "Successo" as const },
  { data: "31/03/2026 18:05", utente: "Admin (Marco Bianchi)", dispositivo: "Safari / macOS", ip: "93.42.118.xxx", esito: "Successo" as const },
  { data: "31/03/2026 11:00", utente: "Sara Colombo", dispositivo: "App Android 14", ip: "79.18.55.xxx", esito: "Successo" as const },
  { data: "30/03/2026 22:30", utente: "Luca Moretti", dispositivo: "App iOS 17.4", ip: "5.90.167.xxx", esito: "Successo" as const },
  { data: "30/03/2026 19:12", utente: "Utente sconosciuto", dispositivo: "Chrome / Linux", ip: "45.155.205.xxx", esito: "Fallito" as const },
  { data: "30/03/2026 10:05", utente: "Andrea Marino", dispositivo: "App Android 14", ip: "151.38.22.xxx", esito: "Successo" as const },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function contrattoStyle(c: TipoContratto) {
  switch (c) {
    case "Fisso": return "bg-green-500/10 text-green-400";
    case "Part-time": return "bg-amber-500/10 text-amber-400";
    case "A chiamata": return "bg-orange-500/10 text-orange-400";
  }
}

function contrattoLabel(c: TipoContratto) {
  switch (c) {
    case "Fisso": return "Dipendente Fisso";
    case "Part-time": return "Part-time";
    case "A chiamata": return "A Chiamata";
  }
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function ImpostazioniPage() {
  const [tab, setTab] = useState<Tab>("generale");

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-accent text-white" : "text-text-muted hover:bg-white/5 hover:text-foreground"
    }`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="mt-1 text-sm text-text-muted">Configurazione dell&apos;applicazione</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button className={tabCls(tab === "generale")} onClick={() => setTab("generale")}>Generale</button>
        <button className={tabCls(tab === "utenti")} onClick={() => setTab("utenti")}>Utenti e Ruoli</button>
        <button className={tabCls(tab === "notifiche")} onClick={() => setTab("notifiche")}>Notifiche</button>
        <button className={tabCls(tab === "sicurezza")} onClick={() => setTab("sicurezza")}>Sicurezza</button>
      </div>

      {tab === "generale" && <TabGenerale />}
      {tab === "utenti" && <TabUtenti />}
      {tab === "notifiche" && <TabNotifiche />}
      {tab === "sicurezza" && <TabSicurezza />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB GENERALE
   ═══════════════════════════════════════════ */

function TabGenerale() {
  const [nomeAzienda, setNomeAzienda] = useState("Presenze Staff");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fusoOrario, setFusoOrario] = useState("Europe/Rome");
  const [formatoOra, setFormatoOra] = useState<"24h" | "12h">("24h");
  const [primoGiorno, setPrimoGiorno] = useState<"lunedi" | "domenica">("lunedi");
  const [maxOreGiornaliere, setMaxOreGiornaliere] = useState(10);
  const [tolleranza, setTolleranza] = useState(5);
  const [saved, setSaved] = useState(false);

  function handleLogoUpload() {
    // Simula upload
    setLogoPreview("PS");
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="max-w-2xl">
      {saved && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 font-medium">
          Impostazioni salvate con successo.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card-bg p-6 space-y-5">
        {/* Nome azienda */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome azienda</label>
          <input type="text" value={nomeAzienda} onChange={(e) => setNomeAzienda(e.target.value)} className={inputCls} />
        </div>

        {/* Logo */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Logo azienda</label>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-sidebar-bg text-lg font-bold text-accent">
              {logoPreview || "PS"}
            </div>
            <button onClick={handleLogoUpload} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
              Carica logo
            </button>
          </div>
        </div>

        {/* Fuso orario */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Fuso orario</label>
          <select value={fusoOrario} onChange={(e) => setFusoOrario(e.target.value)} className={selectCls}>
            <option value="Europe/Rome">Europa/Roma (CET/CEST)</option>
            <option value="Europe/London">Europa/Londra (GMT/BST)</option>
            <option value="Europe/Berlin">Europa/Berlino (CET/CEST)</option>
          </select>
        </div>

        {/* Formato ora + Primo giorno */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Formato ora</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormatoOra("24h")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${formatoOra === "24h" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-foreground"}`}
              >
                24h
              </button>
              <button
                onClick={() => setFormatoOra("12h")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${formatoOra === "12h" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-foreground"}`}
              >
                12h (AM/PM)
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Primo giorno settimana</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPrimoGiorno("lunedi")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${primoGiorno === "lunedi" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-foreground"}`}
              >
                Lunedì
              </button>
              <button
                onClick={() => setPrimoGiorno("domenica")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${primoGiorno === "domenica" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-foreground"}`}
              >
                Domenica
              </button>
            </div>
          </div>
        </div>

        {/* Max ore + Tolleranza */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Max ore giornaliere</label>
            <input type="number" min={1} max={24} value={maxOreGiornaliere} onChange={(e) => setMaxOreGiornaliere(parseInt(e.target.value) || 1)} className={inputCls} />
            <p className="mt-1 text-[11px] text-text-muted">Oltre questo valore verrà generato un avviso</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tolleranza arrotondamento</label>
            <select value={tolleranza} onChange={(e) => setTolleranza(parseInt(e.target.value))} className={selectCls}>
              <option value={0}>0 minuti (esatto)</option>
              <option value={5}>5 minuti</option>
              <option value={10}>10 minuti</option>
              <option value={15}>15 minuti</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button onClick={handleSave} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
            Salva Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB UTENTI E RUOLI
   ═══════════════════════════════════════════ */

function TabUtenti() {
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<Utente | null>(null);
  const [editForm, setEditForm] = useState({ contratto: "Fisso" as TipoContratto, attivo: true });

  const fetchUtenti = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dipendenti");
      if (res.ok) {
        const data = await res.json();
        setUtenti(data.map((d: Record<string, unknown>) => ({
          id: d.id as number,
          nome: `${d.nome} ${d.cognome}`,
          email: d.email as string,
          contratto: d.tipoContratto as TipoContratto,
          ultimoAccesso: "—",
          attivo: d.attivo as boolean,
        })));
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUtenti(); }, [fetchUtenti]);

  function openEdit(u: Utente) {
    setEditUser(u);
    setEditForm({ contratto: u.contratto, attivo: u.attivo });
  }

  async function saveEdit() {
    if (!editUser) return;
    await fetch(`/api/dipendenti/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipoContratto: editForm.contratto, attivo: editForm.attivo }),
    });
    setEditUser(null);
    fetchUtenti();
  }

  const selectCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      {/* Nota informativa */}
      <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
        <p className="font-medium mb-1">Come funzionano i ruoli</p>
        <p className="text-blue-300/80 text-xs leading-relaxed">
          Esiste un solo ruolo amministratore (<strong>Admin</strong>) che ha accesso completo a questa dashboard.
          Tutti gli altri utenti sono <strong>dipendenti</strong> e si distinguono solo per tipo contratto: Fisso, Part-time o A Chiamata.
          I dipendenti vedono esclusivamente i propri dati e possono timbrare solo se fisicamente presenti in una delle sedi (geofence GPS).
          Part-time e A Chiamata sono evidenziati separatamente nelle statistiche e nei report.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 font-medium">Dipendente</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Tipo contratto</th>
                <th className="px-5 py-3 font-medium">Ultimo accesso</th>
                <th className="px-5 py-3 font-medium">Stato</th>
                <th className="px-5 py-3 font-medium text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {utenti.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                        {u.nome.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-foreground">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${contrattoStyle(u.contratto)}`}>
                      {contrattoLabel(u.contratto)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{u.ultimoAccesso}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.attivo ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.attivo ? "bg-green-400" : "bg-zinc-500"}`} />
                      {u.attivo ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-amber-400 transition-colors" title="Modifica">
                      <PenIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale modifica utente */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditUser(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Modifica Utente</h2>
              <button onClick={() => setEditUser(null)} className="text-text-muted hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-sidebar-bg px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {editUser.nome.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{editUser.nome}</p>
                  <p className="text-xs text-text-muted">{editUser.email}</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo contratto</label>
                <select value={editForm.contratto} onChange={(e) => setEditForm({ ...editForm, contratto: e.target.value as TipoContratto })} className={selectCls}>
                  <option value="Fisso">Dipendente Fisso</option>
                  <option value="Part-time">Part-time</option>
                  <option value="A chiamata">A Chiamata</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Stato</label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, attivo: !editForm.attivo })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editForm.attivo ? "bg-green-500" : "bg-zinc-600"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${editForm.attivo ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-text-muted">{editForm.attivo ? "Attivo" : "Disattivato"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditUser(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors">Annulla</button>
              <button onClick={saveEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB NOTIFICHE
   ═══════════════════════════════════════════ */

function TabNotifiche() {
  const [prefs, setPrefs] = useState<NotificaPref>({
    turniIncompleti: true,
    turniIncompletiEmail: "admin@presenzestaff.it",
    oreMax: true,
    oreMaxEmail: "admin@presenzestaff.it",
    riepilogoSett: false,
    riepilogoSettEmail: "admin@presenzestaff.it",
    timbratureAnomale: true,
    timbratureAnomaleEmail: "admin@presenzestaff.it",
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  const notifiche: { key: keyof NotificaPref; emailKey: keyof NotificaPref; label: string; desc: string }[] = [
    { key: "turniIncompleti", emailKey: "turniIncompletiEmail", label: "Turni incompleti", desc: "Notifica a fine giornata se ci sono turni senza uscita registrata" },
    { key: "oreMax", emailKey: "oreMaxEmail", label: "Superamento ore massime", desc: "Avviso quando un dipendente supera le ore massime giornaliere configurate" },
    { key: "riepilogoSett", emailKey: "riepilogoSettEmail", label: "Riepilogo settimanale", desc: "Report automatico inviato ogni lunedì mattina con il riepilogo della settimana precedente" },
    { key: "timbratureAnomale", emailKey: "timbratureAnomaleEmail", label: "Timbrature anomale", desc: "Allarme per timbrature con entrata senza uscita da più di 12 ore" },
  ];

  return (
    <div className="max-w-2xl">
      {saved && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 font-medium">
          Preferenze notifiche salvate con successo.
        </div>
      )}

      <div className="space-y-3">
        {notifiche.map((n) => (
          <div key={n.key} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{n.label}</p>
                <p className="mt-0.5 text-xs text-text-muted">{n.desc}</p>
              </div>
              <button
                onClick={() => setPrefs({ ...prefs, [n.key]: !prefs[n.key] })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${prefs[n.key] ? "bg-accent" : "bg-zinc-600"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[n.key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {prefs[n.key] && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-text-muted">Email destinatario</label>
                <input
                  type="email"
                  value={prefs[n.emailKey] as string}
                  onChange={(e) => setPrefs({ ...prefs, [n.emailKey]: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button onClick={handleSave} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
          Salva Preferenze Notifiche
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB SICUREZZA
   ═══════════════════════════════════════════ */

function TabSicurezza() {
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  function handleChangePw() {
    setPwError("");
    if (!pwCurrent) { setPwError("Inserisci la password attuale."); return; }
    if (pwNew.length < 8) { setPwError("La nuova password deve avere almeno 8 caratteri."); return; }
    if (pwNew !== pwConfirm) { setPwError("Le password non coincidono."); return; }
    setPwSaved(true);
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setTimeout(() => setPwSaved(false), 3000);
  }

  const inputCls = "w-full rounded-lg border border-border bg-sidebar-bg px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="space-y-6">
      {/* Cambio password */}
      <div className="max-w-md rounded-xl border border-border bg-card-bg p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Cambio password</h3>

        {pwSaved && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 font-medium">
            Password aggiornata con successo.
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
            {pwError}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password attuale</label>
            <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nuova password</label>
            <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Conferma nuova password</label>
            <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-sidebar-bg px-3 py-2 text-xs text-text-muted space-y-0.5">
          <p>Requisiti password:</p>
          <p className={pwNew.length >= 8 ? "text-green-400" : ""}>• Minimo 8 caratteri</p>
          <p className={/[A-Z]/.test(pwNew) ? "text-green-400" : ""}>• Almeno una lettera maiuscola</p>
          <p className={/[0-9]/.test(pwNew) ? "text-green-400" : ""}>• Almeno un numero</p>
          <p className={/[^A-Za-z0-9]/.test(pwNew) ? "text-green-400" : ""}>• Almeno un carattere speciale</p>
        </div>

        <div className="mt-4">
          <button onClick={handleChangePw} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
            Aggiorna Password
          </button>
        </div>
      </div>

      {/* Log accessi */}
      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">Log accessi</h3>
          <button
            onClick={() => alert("Funzione di esportazione log in arrivo.")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Scarica log completo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 font-medium">Data e ora</th>
                <th className="px-5 py-3 font-medium">Utente</th>
                <th className="px-5 py-3 font-medium">Dispositivo</th>
                <th className="px-5 py-3 font-medium">IP</th>
                <th className="px-5 py-3 font-medium">Esito</th>
              </tr>
            </thead>
            <tbody>
              {logAccessi.map((log, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm font-mono text-foreground">{log.data}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{log.utente}</td>
                  <td className="px-5 py-3 text-sm text-text-muted">{log.dispositivo}</td>
                  <td className="px-5 py-3 text-sm font-mono text-text-muted">{log.ip}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${log.esito === "Successo" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {log.esito}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
