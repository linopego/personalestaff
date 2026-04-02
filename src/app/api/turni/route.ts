import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { turni, turniAssegnazioni, utenti, sedi } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const dataInizio = searchParams.get("dataInizio");
  const dataFine = searchParams.get("dataFine");
  const sedeId = searchParams.get("sedeId");
  const stato = searchParams.get("stato");

  const conditions = [];
  if (dataInizio) conditions.push(gte(turni.data, dataInizio));
  if (dataFine) conditions.push(lte(turni.data, dataFine));
  if (sedeId) conditions.push(eq(turni.sedeId, parseInt(sedeId)));
  if (stato) conditions.push(eq(turni.stato, stato));

  const result = await db
    .select({
      id: turni.id, data: turni.data, sedeId: turni.sedeId,
      areaOperativa: turni.areaOperativa, orarioInizio: turni.orarioInizio,
      orarioFine: turni.orarioFine, note: turni.note, stato: turni.stato,
      sedeNome: sedi.nome,
    })
    .from(turni)
    .innerJoin(sedi, eq(turni.sedeId, sedi.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(turni.data, turni.orarioInizio);

  // Fetch assegnazioni per ogni turno
  const turniIds = result.map((t) => t.id);
  const assegnazioni = turniIds.length > 0
    ? await db
        .select({
          id: turniAssegnazioni.id, turnoId: turniAssegnazioni.turnoId,
          userId: turniAssegnazioni.userId, mansione: turniAssegnazioni.mansione,
          dipNome: utenti.nome, dipCognome: utenti.cognome,
        })
        .from(turniAssegnazioni)
        .innerJoin(utenti, eq(turniAssegnazioni.userId, utenti.id))
    : [];

  const turniConAssegnazioni = result.map((t) => ({
    ...t,
    assegnazioni: assegnazioni.filter((a) => a.turnoId === t.id),
  }));

  return NextResponse.json(turniConAssegnazioni);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { data, sedeId, areaOperativa, orarioInizio, orarioFine, note, stato } = body;

  if (!data || !sedeId || !areaOperativa || !orarioInizio || !orarioFine) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  try {
    const [created] = await db.insert(turni).values({
      data, sedeId, areaOperativa, orarioInizio, orarioFine,
      note: note || null, stato: stato || "bozza",
      creatoDa: parseInt(user.id),
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
