import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventi, eventiAssegnazioni, sedi } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

// Accessibile a tutti gli utenti autenticati — restituisce solo info pubbliche degli eventi
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const dataInizio = searchParams.get("dataInizio");
  const dataFine = searchParams.get("dataFine");

  const conditions = [];
  if (dataInizio) conditions.push(gte(eventi.data, dataInizio));
  if (dataFine) conditions.push(lte(eventi.data, dataFine));

  const result = await db
    .select({
      id: eventi.id, nome: eventi.nome, data: eventi.data,
      oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
      sedeAltro: eventi.sedeAltro, stato: eventi.stato,
      sedeNome: sedi.nome,
    })
    .from(eventi)
    .leftJoin(sedi, eq(eventi.sedeId, sedi.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(eventi.data);

  // Count assegnazioni
  const counts = await db
    .select({ eventoId: eventiAssegnazioni.eventoId, count: sql<number>`count(*)` })
    .from(eventiAssegnazioni)
    .groupBy(eventiAssegnazioni.eventoId);

  const countMap = new Map(counts.map(c => [c.eventoId, Number(c.count)]));

  return NextResponse.json(result.map(e => ({
    id: e.id, nome: e.nome, data: e.data,
    oraInizio: e.oraInizio, oraFine: e.oraFine,
    sede: e.sedeNome || e.sedeAltro || "—",
    stato: e.stato,
    assegnati: countMap.get(e.id) ?? 0,
  })));
}
