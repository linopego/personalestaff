import { NextResponse } from "next/server";
import { db } from "@/db";
import { utenti, timbrature } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";
import { getVisibilityDate } from "@/lib/visibility";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
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
      timbraturaRemotaAbilitata: utenti.timbraturaRemotaAbilitata,
      avatarUrl: utenti.avatarUrl,
    })
    .from(utenti)
    .where(eq(utenti.id, parseInt(user.id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

  // ── Riepilogo Rapido ──────────────────────────────────────────────────────
  // Calcola date in timezone italiana
  // Vercel è UTC — usiamo offset fisso +2h (CEST estate) per sicurezza
  const nowIt = new Date(Date.now() + 2 * 3600000); // approssimazione ora italiana
  const oggiStr = `${nowIt.getUTCFullYear()}-${String(nowIt.getUTCMonth() + 1).padStart(2, "0")}-${String(nowIt.getUTCDate()).padStart(2, "0")}`;

  // Settimana corrente
  const oggiDate = new Date(oggiStr + "T00:00:00+02:00"); // mezzanotte italiana
  const giornoSettimana = oggiDate.getDay();
  const offsetLunedi = giornoSettimana === 0 ? -6 : 1 - giornoSettimana;
  const lunedi = new Date(oggiDate);
  lunedi.setDate(oggiDate.getDate() + offsetLunedi);
  const domenica = new Date(lunedi);
  domenica.setDate(lunedi.getDate() + 6);
  const domenicaFine = new Date(domenica.getTime() + 24 * 3600000 - 1);

  // Mese corrente
  const inizioMese = new Date(`${nowIt.getUTCFullYear()}-${String(nowIt.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00+02:00`);
  const ultimoGiorno = new Date(nowIt.getUTCFullYear(), nowIt.getUTCMonth() + 1, 0).getDate();
  const fineMese = new Date(`${nowIt.getUTCFullYear()}-${String(nowIt.getUTCMonth() + 1).padStart(2, "0")}-${ultimoGiorno}T23:59:59+01:00`);

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

  const visDate = await getVisibilityDate(userId);

  return NextResponse.json({
    ...row,
    visibilitaDal: visDate?.toISOString() ?? null,
    riepilogo: {
      oreSett: calcolaOre(timbratureSett),
      oreMese: calcolaOre(timbratureMese),
      giorniMese: calcolaGiorni(timbratureMese),
    },
  });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
