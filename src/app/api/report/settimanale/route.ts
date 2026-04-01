import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature, utenti, sedi } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const settimana = parseInt(searchParams.get("settimana") ?? "1");
  const anno = parseInt(searchParams.get("anno") ?? "2026");

  // Calcola lunedì della settimana
  const jan1 = new Date(anno, 0, 1);
  const monday = new Date(jan1);
  monday.setDate(jan1.getDate() + (settimana - 1) * 7 - ((jan1.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      id: timbrature.id,
      userId: timbrature.userId,
      tipo: timbrature.tipo,
      orario: timbrature.orario,
      dipNome: utenti.nome,
      dipCognome: utenti.cognome,
      tipoContratto: utenti.tipoContratto,
      oreSettimanali: utenti.oreSettimanali,
      sedeNome: sedi.nome,
    })
    .from(timbrature)
    .innerJoin(utenti, eq(timbrature.userId, utenti.id))
    .innerJoin(sedi, eq(timbrature.sedeId, sedi.id))
    .where(and(gte(timbrature.orario, monday), lte(timbrature.orario, sunday)));

  return NextResponse.json({
    periodo: { da: monday.toISOString(), a: sunday.toISOString() },
    timbrature: result,
  });
}
