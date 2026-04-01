"use client";
import { useState, useEffect, useCallback } from "react";

export interface DipendenteDB {
  id: number; nome: string; cognome: string; email: string;
  telefono: string | null; ruolo: string; tipoContratto: string;
  oreSettimanali: number; dataAssunzione: string | null;
  attivo: boolean; createdAt: string; updatedAt: string;
}

export function useDipendenti() {
  const [data, setData] = useState<DipendenteDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/dipendenti");
      if (!res.ok) throw new Error(res.status === 401 ? "Non autenticato" : "Errore nel caricamento");
      setData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { dipendenti: data, loading, error, refresh };
}
