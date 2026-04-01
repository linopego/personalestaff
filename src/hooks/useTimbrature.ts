"use client";
import { useState, useEffect, useCallback } from "react";

export interface TimbraturaDB {
  id: number; userId: number; sedeId: number; tipo: string;
  orario: string; lat: number; lng: number;
  modificataManualmente: boolean; noteModifica: string | null;
  modifiedBy: number | null;
  dipNome: string; dipCognome: string; sedeNome: string;
}

interface Filters {
  userId?: number; sedeId?: number; dataInizio?: string;
  dataFine?: string; tipo?: string;
}

export function useTimbrature(filters: Filters = {}) {
  const [data, setData] = useState<TimbraturaDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.set("userId", String(filters.userId));
      if (filters.sedeId) params.set("sedeId", String(filters.sedeId));
      if (filters.dataInizio) params.set("dataInizio", filters.dataInizio);
      if (filters.dataFine) params.set("dataFine", filters.dataFine);
      if (filters.tipo) params.set("tipo", filters.tipo);
      const res = await fetch(`/api/timbrature?${params}`);
      if (!res.ok) throw new Error("Errore nel caricamento timbrature");
      setData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.userId, filters.sedeId, filters.dataInizio, filters.dataFine, filters.tipo]);

  useEffect(() => { refresh(); }, [refresh]);
  return { timbrature: data, loading, error, refresh };
}
