import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventi, eventiAssegnazioni, sedi, utenti } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const dataInizio = searchParams.get("dataInizio");
  const dataFine = searchParams.get("dataFine");
  const stato = searchParams.get("stato");

  const conditions = [];
  if (dataInizio) conditions.push(gte(eventi.data, dataInizio));
  if (dataFine) conditions.push(lte(eventi.data, dataFine));
  if (stato) conditions.push(eq(eventi.stato, stato));

  const result = await db
    .select({
      id: eventi.id, nome: eventi.nome, data: eventi.data,
      oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
      sedeId: eventi.sedeId, sedeAltro: eventi.sedeAltro,
      descrizione: eventi.descrizione, stato: eventi.stato,
      sedeNome: sedi.nome,
    })
    .from(eventi)
    .leftJoin(sedi, eq(eventi.sedeId, sedi.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(eventi.data));

  // Count assegnazioni
  const counts = await db
    .select({ eventoId: eventiAssegnazioni.eventoId, count: sql<number>`count(*)` })
    .from(eventiAssegnazioni)
    .groupBy(eventiAssegnazioni.eventoId);

  const countMap = new Map(counts.map(c => [c.eventoId, Number(c.count)]));

  return NextResponse.json(result.map(e => ({
    ...e,
    sede: e.sedeNome || e.sedeAltro || "—",
    assegnati: countMap.get(e.id) ?? 0,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { nome, data, oraInizio, oraFine, sedeId, sedeAltro, descrizione, stato } = body;

  if (!nome || !data) {
    return NextResponse.json({ error: "Nome e data sono obbligatori" }, { status: 400 });
  }
  if (!sedeId && !sedeAltro) {
    return NextResponse.json({ error: "Specifica una sede o una location" }, { status: 400 });
  }

  try {
    const [created] = await db.insert(eventi).values({
      nome, data, oraInizio: oraInizio || null, oraFine: oraFine || null,
      sedeId: sedeId || null, sedeAltro: sedeAltro || null,
      descrizione: descrizione || null, stato: stato || "bozza",
      creatoDa: parseInt(user.id),
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
