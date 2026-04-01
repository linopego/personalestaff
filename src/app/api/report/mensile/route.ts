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
  const mese = parseInt(searchParams.get("mese") ?? "4");
  const anno = parseInt(searchParams.get("anno") ?? "2026");

  const inizio = new Date(anno, mese - 1, 1);
  const fine = new Date(anno, mese, 0, 23, 59, 59, 999);

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
    .where(and(gte(timbrature.orario, inizio), lte(timbrature.orario, fine)));

  return NextResponse.json({
    periodo: { mese, anno, da: inizio.toISOString(), a: fine.toISOString() },
    timbrature: result,
  });
}
