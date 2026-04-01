"use client";
import { useState, useCallback } from "react";

export function useReportSettimanale() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (settimana: number, anno: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/report/settimanale?settimana=${settimana}&anno=${anno}`);
      if (!res.ok) throw new Error("Errore nel caricamento report");
      setData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  return { data, loading, error, fetch: fetch_ };
}

export function useReportMensile() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (mese: number, anno: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/report/mensile?mese=${mese}&anno=${anno}`);
      if (!res.ok) throw new Error("Errore nel caricamento report");
      setData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  return { data, loading, error, fetch: fetch_ };
}
