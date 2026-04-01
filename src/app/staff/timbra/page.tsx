"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { calcolaDistanza, type RisultatoGeo, type Sede as SedeTipo } from "@/lib/geo";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type GeoStatus = "loading" | "unsupported" | "denied" | "ready";

interface Timbratura {
  tipo: "Entrata" | "Uscita";
  orario: string; // HH:mm:ss
  sede: string;
  lat: number;
  lng: number;
  timestamp: number;
}

/* ═══════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════ */

const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function formatData(d: Date) {
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

function formatOra(d: Date) {
  return d.toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatOraBreve(d: Date) {
  return d.toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function calcolaDurata(inizio: number, fine?: number) {
  const ms = (fine ?? Date.now()) - inizio;
  const minTot = Math.floor(ms / 60000);
  const ore = Math.floor(minTot / 60);
  const min = minTot % 60;
  return `${ore}h ${min.toString().padStart(2, "0")}m`;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function TimbraPage() {
  const { user } = useAuth();

  // Orologio
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Durata aggiornata ogni minuto
  const [, setDurataTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDurataTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Sedi dal DB
  const [sediDB, setSediDB] = useState<(SedeTipo & { id: number })[]>([]);
  useEffect(() => {
    fetch("/api/sedi").then(r => r.json()).then((data) => {
      setSediDB(data.map((s: Record<string, unknown>) => ({ id: s.id, nome: s.nome as string, lat: s.lat as number, lng: s.lng as number, raggio: s.raggio as number })));
    }).catch(() => {});
  }, []);

  // Geo
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [risultato, setRisultato] = useState<RisultatoGeo | null>(null);
  const [matchedSedeId, setMatchedSedeId] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Timbrature di oggi dal DB
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  useEffect(() => {
    const oggi = new Date().toISOString().slice(0, 10);
    fetch(`/api/timbrature?dataInizio=${oggi}&dataFine=${oggi}`)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTimbrature(data.map((t: Record<string, unknown>) => ({
            tipo: t.tipo as "Entrata" | "Uscita",
            orario: new Date(t.orario as string).toLocaleTimeString("it-IT", { hour12: false }),
            sede: t.sedeNome as string,
            lat: t.lat as number, lng: t.lng as number,
            timestamp: new Date(t.orario as string).getTime(),
          })));
        }
      }).catch(() => {});
  }, []);
  const entrata = timbrature.find((t) => t.tipo === "Entrata");
  const uscita = timbrature.find((t) => t.tipo === "Uscita");
  const turnoAperto = entrata && !uscita;

  // Modale
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ── Rileva posizione ── */
  const rilevaPos = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        // Usa sedi dal DB se disponibili, altrimenti fallback a hardcoded
        const sediToCheck = sediDB.length > 0 ? sediDB : [
          { id: 1, nome: "La Casa dei Gelsi", lat: 45.698997, lng: 11.770444, raggio: 100 },
          { id: 2, nome: "Tenuta Villa Peggy's", lat: 45.672833, lng: 11.732111, raggio: 100 },
          { id: 3, nome: "Studios Club / TooLate", lat: 45.775361, lng: 11.689500, raggio: 100 },
        ];
        let minDist = Infinity;
        let closest = sediToCheck[0];
        let matchSede: typeof closest | null = null;
        for (const sede of sediToCheck) {
          const d = calcolaDistanza(c.lat, c.lng, sede.lat, sede.lng);
          if (d < minDist) { minDist = d; closest = sede; }
          if (d <= sede.raggio && !matchSede) matchSede = sede;
        }
        setRisultato({ inSede: !!matchSede, sede: matchSede, distanza: Math.round(minDist), sedeVicina: closest });
        setMatchedSedeId(matchSede?.id ?? null);
        setGeoStatus("ready");
        setGeoLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          // Timeout o errore generico — riprova o mostra denied
          setGeoStatus("denied");
        }
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [sediDB]);

  useEffect(() => { rilevaPos(); }, [rilevaPos]);

  /* ── Conferma timbratura ── */
  async function confermaTimbra() {
    if (!risultato?.inSede || !risultato.sede || !coords || !matchedSedeId) return;
    const tipo = turnoAperto ? "Uscita" : "Entrata";

    try {
      const res = await fetch("/api/timbrature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sedeId: matchedSedeId, tipo, lat: coords.lat, lng: coords.lng }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Errore durante la timbratura");
        setShowModal(false);
        return;
      }

      const t: Timbratura = {
        tipo,
        orario: formatOra(new Date()),
        sede: risultato.sede.nome,
        lat: coords.lat,
        lng: coords.lng,
        timestamp: Date.now(),
      };
      setTimbrature((prev) => [...prev, t]);
    } catch {
      alert("Errore di connessione. Riprova.");
    }

    setShowModal(false);
    setShowSuccess(true);
    if (successTimeout.current) clearTimeout(successTimeout.current);
    successTimeout.current = setTimeout(() => setShowSuccess(false), 2500);
  }

  const tipoTimbra = turnoAperto ? "Uscita" : "Entrata";
  const canTimbra = risultato?.inSede && !(entrata && uscita);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Data e ora ── */}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{user?.name ?? "Dipendente"}</p>
        <p className="mt-1 text-sm text-text-muted">{formatData(now)}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums">{formatOra(now)}</p>
      </div>

      {/* ── Area Geo ── */}
      {geoStatus === "loading" && <GeoLoading />}
      {geoStatus === "unsupported" && <GeoUnsupported />}
      {geoStatus === "denied" && <GeoDenied onRetry={rilevaPos} />}
      {geoStatus === "ready" && risultato && !risultato.inSede && (
        <GeoFuoriSede risultato={risultato} turnoCompleto={!!(entrata && uscita)} />
      )}
      {geoStatus === "ready" && risultato?.inSede && (
        <GeoInSede
          risultato={risultato}
          tipo={tipoTimbra}
          canTimbra={canTimbra!}
          onTimbra={() => setShowModal(true)}
        />
      )}

      {/* ── Stato turno ── */}
      <div className="rounded-2xl border border-border bg-card-bg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Turno di oggi</p>
        {!entrata && (
          <p className="text-base text-text-muted">Nessuna timbratura oggi</p>
        )}
        {entrata && !uscita && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Entrata</p>
              <p className="text-xl font-bold text-green-400 tabular-nums">{entrata.orario.slice(0, 5)}</p>
              <p className="text-xs text-text-muted mt-0.5">{entrata.sede}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">In corso da</p>
              <p className="text-xl font-bold text-accent tabular-nums">{calcolaDurata(entrata.timestamp)}</p>
            </div>
          </div>
        )}
        {entrata && uscita && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Entrata</p>
              <p className="text-lg font-bold text-green-400 tabular-nums">{entrata.orario.slice(0, 5)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-muted">Totale</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{calcolaDurata(entrata.timestamp, uscita.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Uscita</p>
              <p className="text-lg font-bold text-red-400 tabular-nums">{uscita.orario.slice(0, 5)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Aggiorna posizione ── */}
      {geoStatus === "ready" && (
        <button
          onClick={rilevaPos}
          disabled={geoLoading}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card-bg py-3.5 text-sm font-medium text-text-muted active:bg-white/5 active:scale-[0.98] transition-all min-h-[48px] disabled:opacity-50"
        >
          <RefreshIcon className={`h-5 w-5 ${geoLoading ? "animate-spin" : ""}`} />
          {geoLoading ? "Rilevamento..." : "Aggiorna Posizione"}
        </button>
      )}

      {/* ═══ MODALE CONFERMA ═══ */}
      {showModal && risultato?.sede && coords && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card-bg animate-slide-up"
          >
            {/* Handle bar mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="px-6 py-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground text-center">
                Conferma {tipoTimbra}
              </h2>

              <div className="rounded-xl bg-sidebar-bg p-4 space-y-2.5">
                <InfoRow label="Tipo" value={`Timbratura ${tipoTimbra}`} valueColor={tipoTimbra === "Entrata" ? "text-green-400" : "text-red-400"} />
                <InfoRow label="Sede" value={risultato.sede.nome} />
                <InfoRow label="Ora" value={formatOraBreve(now)} />
                <InfoRow label="GPS" value={`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`} small />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-border py-4 text-base font-semibold text-text-muted active:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]"
                >
                  Annulla
                </button>
                <button
                  onClick={confermaTimbra}
                  className={`flex-1 rounded-xl py-4 text-base font-semibold text-white active:scale-[0.97] transition-all min-h-[56px] ${
                    tipoTimbra === "Entrata"
                      ? "bg-green-600 active:bg-green-700"
                      : "bg-red-600 active:bg-red-700"
                  }`}
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FEEDBACK SUCCESSO ═══ */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-card-bg border border-green-500/30 px-8 py-6 shadow-2xl animate-fade-in text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
              <CheckIcon className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {timbrature[timbrature.length - 1]?.tipo === "Entrata" ? "Entrata registrata" : "Uscita registrata"}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {timbrature[timbrature.length - 1]?.orario.slice(0, 5)} — {timbrature[timbrature.length - 1]?.sede}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   GEO STATE COMPONENTS
   ═══════════════════════════════════════════ */

function GeoLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full bg-accent/20 animate-ping" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <MapPinIcon className="h-8 w-8 text-accent" />
        </div>
      </div>
      <p className="text-lg font-semibold text-foreground">Rilevamento posizione in corso</p>
      <p className="text-sm text-text-muted">Attendi qualche secondo...</p>
    </div>
  );
}

function GeoUnsupported() {
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
        <XCircleIcon className="h-8 w-8 text-red-400" />
      </div>
      <p className="text-lg font-bold text-red-400">Geolocalizzazione non supportata</p>
      <p className="mt-2 text-sm text-text-muted leading-relaxed">
        Il tuo browser non supporta la geolocalizzazione.
        Usa un browser moderno come <strong className="text-foreground">Safari</strong> su iPhone
        o <strong className="text-foreground">Chrome</strong> su Android.
      </p>
    </div>
  );
}

function GeoDenied({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
        <MapPinOffIcon className="h-8 w-8 text-amber-400" />
      </div>
      <p className="text-lg font-bold text-amber-400 text-center">Permesso posizione negato</p>
      <p className="mt-2 text-sm text-text-muted text-center">
        Per timbrare devi autorizzare l&apos;accesso alla tua posizione.
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-sidebar-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">iPhone (Safari)</p>
          <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
            <li>Apri <strong>Impostazioni</strong> → <strong>Safari</strong></li>
            <li>Tocca <strong>Posizione</strong></li>
            <li>Seleziona <strong>Consenti</strong></li>
            <li>Torna qui e tocca Riprova</li>
          </ol>
        </div>
        <div className="rounded-xl bg-sidebar-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Android (Chrome)</p>
          <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
            <li>Tocca l&apos;icona <strong>lucchetto</strong> nella barra URL</li>
            <li>Tocca <strong>Autorizzazioni</strong></li>
            <li>Abilita <strong>Posizione</strong></li>
            <li>Torna qui e tocca Riprova</li>
          </ol>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="mt-4 w-full rounded-xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700 active:scale-[0.98] transition-all min-h-[56px]"
      >
        Riprova
      </button>
    </div>
  );
}

function GeoFuoriSede({ risultato, turnoCompleto }: { risultato: RisultatoGeo; turnoCompleto: boolean }) {
  return (
    <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/20 p-6 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
        <MapPinXIcon className="h-9 w-9 text-red-400" />
      </div>
      <p className="text-xl font-bold text-red-400">NON SEI IN NESSUNA SEDE AUTORIZZATA</p>
      <p className="mt-2 text-sm text-text-muted">
        Sede più vicina: <strong className="text-foreground">{risultato.sedeVicina.nome}</strong>
      </p>
      <p className="text-sm text-text-muted">
        Distanza: <strong className="text-red-400">{risultato.distanza}m</strong> (max {risultato.sedeVicina.raggio}m)
      </p>

      <button
        disabled
        className="mt-6 w-full rounded-xl bg-zinc-700/50 py-5 text-base font-semibold text-zinc-500 min-h-[56px] cursor-not-allowed"
      >
        {turnoCompleto ? "TURNO COMPLETATO" : "TIMBRATURA NON DISPONIBILE"}
      </button>
    </div>
  );
}

function GeoInSede({
  risultato,
  tipo,
  canTimbra,
  onTimbra,
}: {
  risultato: RisultatoGeo;
  tipo: "Entrata" | "Uscita";
  canTimbra: boolean;
  onTimbra: () => void;
}) {
  const isEntrata = tipo === "Entrata";

  return (
    <div className="rounded-2xl bg-green-500/[0.06] border border-green-500/20 p-6 flex flex-col items-center">
      {/* Sede badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5 mb-6">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-sm font-semibold text-green-400">{risultato.sede!.nome}</span>
        <span className="text-xs text-green-400/60">{risultato.distanza}m</span>
      </div>

      {/* Pulsante timbra */}
      {canTimbra ? (
        <button
          onClick={onTimbra}
          className={`flex flex-col items-center justify-center rounded-full w-[200px] h-[200px] shadow-lg active:scale-[0.95] active:brightness-90 transition-all duration-150 ${
            isEntrata
              ? "bg-green-600 shadow-green-600/20"
              : "bg-red-600 shadow-red-600/20"
          }`}
        >
          {isEntrata ? (
            <ArrowDownIcon className="h-12 w-12 text-white mb-1" />
          ) : (
            <ArrowUpIcon className="h-12 w-12 text-white mb-1" />
          )}
          <span className="text-lg font-bold text-white">TIMBRA</span>
          <span className="text-sm font-semibold text-white/80">{tipo.toUpperCase()}</span>
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-full w-[200px] h-[200px] bg-zinc-700/50">
          <CheckIcon className="h-12 w-12 text-zinc-500 mb-1" />
          <span className="text-lg font-bold text-zinc-500">TURNO</span>
          <span className="text-sm font-semibold text-zinc-500">COMPLETATO</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════ */

function InfoRow({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className={`${small ? "text-xs font-mono" : "text-sm font-semibold"} ${valueColor ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function MapPinOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" strokeWidth={2} />
    </svg>
  );
}

function MapPinXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 8.25l-4.5 4.5m0-4.5l4.5 4.5" strokeWidth={2} />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.015 4.356v4.992" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
