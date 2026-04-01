"use client";
import { useState, useEffect, useCallback } from "react";

interface Sede {
  id: number; nome: string; indirizzo: string | null;
  lat: number; lng: number; raggio: number; note: string | null; attiva: boolean;
}

export function useSedi() {
  const [data, setData] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/sedi");
      if (!res.ok) throw new Error("Errore nel caricamento sedi");
      setData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { sedi: data, loading, error, refresh };
}
