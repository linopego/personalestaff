import { NextResponse } from "next/server";
import { db } from "@/db";
import { turni, turniAssegnazioni, sedi } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  const oggi = new Date().toISOString().slice(0, 10);

  const result = await db
    .select({
      id: turni.id, data: turni.data, sedeId: turni.sedeId,
      areaOperativa: turni.areaOperativa, orarioInizio: turni.orarioInizio,
      orarioFine: turni.orarioFine, note: turni.note, stato: turni.stato,
      sedeNome: sedi.nome,
      assegnazioneId: turniAssegnazioni.id,
      mansione: turniAssegnazioni.mansione,
    })
    .from(turniAssegnazioni)
    .innerJoin(turni, eq(turniAssegnazioni.turnoId, turni.id))
    .innerJoin(sedi, eq(turni.sedeId, sedi.id))
    .where(eq(turniAssegnazioni.userId, parseInt(user.id)))
    .orderBy(turni.data, turni.orarioInizio);

  return NextResponse.json(result);
}
