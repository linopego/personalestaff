import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventiAssegnazioni } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

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

  return NextResponse.json({ success: true });
}
