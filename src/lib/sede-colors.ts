/**
 * Colori sedi centralizzati — usare ovunque per coerenza.
 * Casa dei Gelsi = ambra, Studios Club/TooLate = blu, Tenuta Villa Peggy's = verde
 */

// Colori HEX per grafici, SVG, style inline
export const SEDE_HEX: Record<string, string> = {
  "La Casa dei Gelsi": "#f59e0b",
  "Tenuta Villa Peggy's": "#10b981",
  "Studios Club / TooLate": "#3b82f6",
};

// Array ordinato per la pagina Sedi
export const SEDE_ACCENTS_ORDERED = ["#f59e0b", "#10b981", "#3b82f6"];

// Classi Tailwind per testo
export const SEDE_TEXT: Record<string, string> = {
  "La Casa dei Gelsi": "text-amber-400",
  "Tenuta Villa Peggy's": "text-emerald-400",
  "Studios Club / TooLate": "text-blue-400",
};
