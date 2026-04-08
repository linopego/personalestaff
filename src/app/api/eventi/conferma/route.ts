import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventiAssegnazioni, eventi, utenti, sedi } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";
import { inviaNotifica } from "@/lib/push";

// PUT /api/eventi/conferma — dipendente conferma o rifiuta
export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { assegnazioneId, statoConferma, motivoRifiuto } = body;

  if (!assegnazioneId || !["confermato", "rifiutato"].includes(statoConferma)) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  // Verifica che l'assegnazione appartenga al dipendente
  const [ass] = await db.select().from(eventiAssegnazioni)
    .where(and(eq(eventiAssegnazioni.id, assegnazioneId), eq(eventiAssegnazioni.userId, parseInt(user.id))))
    .limit(1);

  if (!ass) {
    return NextResponse.json({ error: "Assegnazione non trovata" }, { status: 404 });
  }

  await db.update(eventiAssegnazioni).set({
    statoConferma,
    ...(statoConferma === "rifiutato" && motivoRifiuto ? { motivoRifiuto } : {}),
  }).where(eq(eventiAssegnazioni.id, assegnazioneId));

  // Notifica all'admin (creatore dell'evento)
  try {
    const [evento] = await db.select({ nome: eventi.nome, creatoDa: eventi.creatoDa })
      .from(eventi)
      .innerJoin(eventiAssegnazioni, eq(eventi.id, eventiAssegnazioni.eventoId))
      .where(eq(eventiAssegnazioni.id, assegnazioneId)).limit(1);
    const [dip] = await db.select({ nome: utenti.nome, cognome: utenti.cognome })
      .from(utenti).where(eq(utenti.id, parseInt(user.id))).limit(1);

    if (evento && dip) {
      const nome = `${dip.nome} ${dip.cognome}`;
      if (statoConferma === "confermato") {
        await inviaNotifica({ userId: evento.creatoDa, tipo: "conferma_ricevuta", titolo: "Turno confermato", messaggio: `${nome} ha confermato per "${evento.nome}"`, link: `/admin/eventi/${ass.eventoId}` });
      } else {
        await inviaNotifica({ userId: evento.creatoDa, tipo: "rifiuto_ricevuto", titolo: "Turno rifiutato", messaggio: `${nome} non è disponibile per "${evento.nome}"${motivoRifiuto ? `: ${motivoRifiuto}` : ""}`, link: `/admin/eventi/${ass.eventoId}` });
      }
    }
  } catch { /* */ }

  return NextResponse.json({ success: true });
}
