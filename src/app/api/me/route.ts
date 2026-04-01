import { NextResponse } from "next/server";
import { db } from "@/db";
import { utenti, timbrature } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  const [row] = await db
    .select({
      id: utenti.id,
      nome: utenti.nome,
      cognome: utenti.cognome,
      email: utenti.email,
      telefono: utenti.telefono,
      ruolo: utenti.ruolo,
      tipoContratto: utenti.tipoContratto,
      oreSettimanali: utenti.oreSettimanali,
      dataAssunzione: utenti.dataAssunzione,
      attivo: utenti.attivo,
    })
    .from(utenti)
    .where(eq(utenti.id, parseInt(user.id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

  // ── Riepilogo Rapido ──────────────────────────────────────────────────────
  // Settimana corrente (lunedì–domenica)
  const oggi = new Date();
  const giornoSettimana = oggi.getDay(); // 0=dom, 1=lun, …
  const offsetLunedi = giornoSettimana === 0 ? -6 : 1 - giornoSettimana;
  const lunedi = new Date(oggi);
  lunedi.setDate(oggi.getDate() + offsetLunedi);
  lunedi.setHours(0, 0, 0, 0);
  const domenica = new Date(lunedi);
  domenica.setDate(lunedi.getDate() + 6);
  domenica.setHours(23, 59, 59, 999);

  // Mese corrente
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1, 0, 0, 0, 0);
  const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0, 23, 59, 59, 999);

  const userId = parseInt(user.id);

  const [timbratureSett, timbratureMese] = await Promise.all([
    db
      .select({ tipo: timbrature.tipo, orario: timbrature.orario })
      .from(timbrature)
      .where(and(eq(timbrature.userId, userId), gte(timbrature.orario, lunedi), lte(timbrature.orario, domenica))),
    db
      .select({ tipo: timbrature.tipo, orario: timbrature.orario })
      .from(timbrature)
      .where(and(eq(timbrature.userId, userId), gte(timbrature.orario, inizioMese), lte(timbrature.orario, fineMese))),
  ]);

  function calcolaOre(rows: { tipo: string; orario: Date }[]) {
    // Pair up Entrata/Uscita in chronological order
    const sorted = [...rows].sort((a, b) => new Date(a.orario).getTime() - new Date(b.orario).getTime());
    let oreAccumulate = 0;
    let entrata: Date | null = null;
    for (const r of sorted) {
      if (r.tipo === "Entrata") {
        entrata = new Date(r.orario);
      } else if (r.tipo === "Uscita" && entrata) {
        oreAccumulate += (new Date(r.orario).getTime() - entrata.getTime()) / 3600000;
        entrata = null;
      }
    }
    return oreAccumulate;
  }

  function calcolaGiorni(rows: { tipo: string; orario: Date }[]) {
    const giorni = new Set<string>();
    for (const r of rows) {
      if (r.tipo === "Entrata") {
        const d = new Date(r.orario);
        giorni.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
    return giorni.size;
  }

  return NextResponse.json({
    ...row,
    riepilogo: {
      oreSett: calcolaOre(timbratureSett),
      oreMese: calcolaOre(timbratureMese),
      giorniMese: calcolaGiorni(timbratureMese),
    },
  });
}
