"use client";

import { useState, useEffect } from "react";

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

export default function VisibilityBanner() {
  const [visDate, setVisDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.visibilitaDal) setVisDate(data.visibilitaDal);
      })
      .catch(() => {});
  }, []);

  if (!visDate) return null;

  const d = new Date(visDate);
  const label = `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-2.5">
      <svg className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      <p className="text-sm text-amber-300">
        Le ore visualizzate sono relative al periodo dal <strong className="text-amber-200">{label}</strong> in poi.
      </p>
    </div>
  );
}
