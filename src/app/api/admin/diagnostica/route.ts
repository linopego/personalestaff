import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { utenti, timbrature } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const nome = searchParams.get("nome") || "Leonardo";

  const tuttiUtenti = await db
    .select({
      id: utenti.id,
      nome: utenti.nome,
      cognome: utenti.cognome,
      email: utenti.email,
      ruolo: utenti.ruolo,
      googleId: utenti.googleId,
      attivo: utenti.attivo,
    })
    .from(utenti)
    .where(sql`LOWER(${utenti.nome}) LIKE ${"%" + nome.toLowerCase() + "%"} OR LOWER(${utenti.cognome}) LIKE ${"%" + nome.toLowerCase() + "%"}`);

  const risultati = [];
  for (const u of tuttiUtenti) {
    const [count] = await db
      .select({ tot: sql<number>`COUNT(*)` })
      .from(timbrature)
      .where(eq(timbrature.userId, u.id));

    const ultime = await db
      .select({ id: timbrature.id, tipo: timbrature.tipo, orario: timbrature.orario })
      .from(timbrature)
      .where(eq(timbrature.userId, u.id))
      .orderBy(sql`${timbrature.orario} DESC`)
      .limit(5);

    risultati.push({
      utente: u,
      totaleTimbrature: count?.tot ?? 0,
      ultime5: ultime.map(t => ({
        id: t.id,
        tipo: t.tipo,
        orario: t.orario instanceof Date ? t.orario.toISOString() : String(t.orario),
      })),
    });
  }

  return NextResponse.json({ query: nome, risultati });
}
