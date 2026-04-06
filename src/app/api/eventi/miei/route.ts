import { NextResponse } from "next/server";
import { db } from "@/db";
import { eventi, eventiAssegnazioni, sedi } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  const d = new Date(); const oggi = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const result = await db
    .select({
      id: eventi.id, nome: eventi.nome, data: eventi.data,
      oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
      sedeId: eventi.sedeId, sedeAltro: eventi.sedeAltro,
      stato: eventi.stato, sedeNome: sedi.nome,
      assegnazioneId: eventiAssegnazioni.id,
      orarioInizio: eventiAssegnazioni.orarioInizio,
      orarioFine: eventiAssegnazioni.orarioFine,
      mansione: eventiAssegnazioni.mansione,
      postazione: eventiAssegnazioni.postazione,
      note: eventiAssegnazioni.note,
      statoConferma: eventiAssegnazioni.statoConferma,
    })
    .from(eventiAssegnazioni)
    .innerJoin(eventi, eq(eventiAssegnazioni.eventoId, eventi.id))
    .leftJoin(sedi, eq(eventi.sedeId, sedi.id))
    .where(eq(eventiAssegnazioni.userId, parseInt(user.id)))
    .orderBy(eventi.data);

  return NextResponse.json(result.map(r => ({
    ...r,
    sede: r.sedeNome || r.sedeAltro || "—",
  })));
}
