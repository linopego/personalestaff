import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventi, eventiAssegnazioni, utenti, sedi } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

// Accessibile a tutti gli autenticati — mostra personale senza info sensibili
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { id } = await params;
  const [evento] = await db.select({
    id: eventi.id, nome: eventi.nome, data: eventi.data,
    oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
    sedeAltro: eventi.sedeAltro, descrizione: eventi.descrizione,
    sedeNome: sedi.nome,
  }).from(eventi).leftJoin(sedi, eq(eventi.sedeId, sedi.id))
    .where(eq(eventi.id, parseInt(id))).limit(1);

  if (!evento) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const assegnazioni = await db.select({
    nome: utenti.nome, cognome: utenti.cognome,
    mansione: eventiAssegnazioni.mansione,
    postazione: eventiAssegnazioni.postazione,
    orarioInizio: eventiAssegnazioni.orarioInizio,
    orarioFine: eventiAssegnazioni.orarioFine,
  }).from(eventiAssegnazioni)
    .innerJoin(utenti, eq(eventiAssegnazioni.userId, utenti.id))
    .where(eq(eventiAssegnazioni.eventoId, parseInt(id)));

  return NextResponse.json({
    ...evento,
    sede: evento.sedeNome || evento.sedeAltro || "—",
    personale: assegnazioni,
  });
}
