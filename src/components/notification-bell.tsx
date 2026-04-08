"use client";

import { useState, useEffect, useCallback } from "react";
import { usePush } from "@/hooks/usePush";

interface Notifica {
  id: number; tipo: string; titolo: string; messaggio: string;
  link: string | null; letto: boolean; createdAt: string;
}

export default function NotificationBell() {
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const { supported, permission, requestPermission } = usePush();

  const fetchNotifiche = useCallback(async () => {
    try {
      const res = await fetch("/api/notifiche");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifiche(data);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchNotifiche(); const t = setInterval(fetchNotifiche, 30000); return () => clearInterval(t); }, [fetchNotifiche]);

  // Mostra richiesta permesso se non ancora concesso
  useEffect(() => {
    if (supported && permission === "default") {
      const dismissed = localStorage.getItem("push-prompt-dismissed");
      if (!dismissed) setShowPermission(true);
    }
  }, [supported, permission]);

  async function handleEnableNotifiche() {
    const ok = await requestPermission();
    setShowPermission(false);
    if (!ok) localStorage.setItem("push-prompt-dismissed", "1");
  }

  async function markAllRead() {
    await fetch("/api/notifiche", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    fetchNotifiche();
  }

  const nonLette = notifiche.filter(n => !n.letto).length;

  return (
    <>
      {/* Banner richiesta permesso */}
      {showPermission && (
        <div className="fixed top-0 inset-x-0 z-50 bg-accent/95 px-4 py-3 flex items-center justify-between" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <p className="text-sm text-white font-medium">Attiva le notifiche per ricevere aggiornamenti sui turni</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setShowPermission(false); localStorage.setItem("push-prompt-dismissed", "1"); }} className="text-xs text-white/70">No grazie</button>
            <button onClick={handleEnableNotifiche} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-accent">Attiva</button>
          </div>
        </div>
      )}

      {/* Campanella */}
      <button onClick={() => setShowPanel(!showPanel)} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:text-foreground transition-colors">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {nonLette > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{nonLette > 9 ? "9+" : nonLette}</span>
        )}
      </button>

      {/* Pannello notifiche */}
      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifiche</p>
              {nonLette > 0 && <button onClick={markAllRead} className="text-xs text-accent">Segna lette</button>}
            </div>
            {notifiche.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-muted">Nessuna notifica</p>
            ) : (
              <div className="divide-y divide-border">
                {notifiche.slice(0, 20).map(n => (
                  <a key={n.id} href={n.link || "#"} onClick={() => setShowPanel(false)}
                    className={`block px-4 py-3 transition-colors ${n.letto ? "" : "bg-accent/[0.03]"}`}>
                    <p className={`text-sm ${n.letto ? "text-text-muted" : "text-foreground font-medium"}`}>{n.titolo}</p>
                    <p className="text-xs text-text-muted mt-0.5">{n.messaggio}</p>
                    <p className="text-[10px] text-text-muted mt-1">{new Date(n.createdAt).toLocaleString("it-IT")}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
