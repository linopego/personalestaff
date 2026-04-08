import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventiAssegnazioni, eventi, sedi } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";
import { inviaNotifica } from "@/lib/push";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const eventoId = parseInt(id);
  const body = await req.json();
  const { userId, orarioInizio, orarioFine, mansione, postazione, note } = body;

  if (!userId) return NextResponse.json({ error: "userId mancante" }, { status: 400 });

  // Check duplicato
  const [existing] = await db.select().from(eventiAssegnazioni)
    .where(and(eq(eventiAssegnazioni.eventoId, eventoId), eq(eventiAssegnazioni.userId, userId))).limit(1);
  if (existing) return NextResponse.json({ error: "Dipendente già assegnato" }, { status: 400 });

  try {
    const [created] = await db.insert(eventiAssegnazioni).values({
      eventoId, userId,
      orarioInizio: orarioInizio || null, orarioFine: orarioFine || null,
      mansione: mansione || null, postazione: postazione || null, note: note || null,
      aggiuntoDa: parseInt(user.id),
    }).returning();

    // Invia notifica al dipendente
    try {
      const [evento] = await db.select({ nome: eventi.nome, data: eventi.data, sedeNome: sedi.nome, sedeAltro: eventi.sedeAltro })
        .from(eventi).leftJoin(sedi, eq(eventi.sedeId, sedi.id)).where(eq(eventi.id, eventoId)).limit(1);
      if (evento) {
        const sede = evento.sedeNome || evento.sedeAltro || "";
        await inviaNotifica({
          userId,
          tipo: "turno_assegnato",
          titolo: "Nuovo turno assegnato",
          messaggio: `Sei stato assegnato a "${evento.nome}" del ${evento.data}${sede ? ` (${sede})` : ""}. Conferma la tua disponibilità.`,
          link: "/staff/turni",
        });
      }
    } catch { /* non bloccare per errore notifica */ }

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { assegnazioneId, orarioInizio, orarioFine, mansione, postazione, note } = body;

  if (!assegnazioneId) return NextResponse.json({ error: "assegnazioneId mancante" }, { status: 400 });

  await db.update(eventiAssegnazioni).set({
    ...(orarioInizio !== undefined && { orarioInizio: orarioInizio || null }),
    ...(orarioFine !== undefined && { orarioFine: orarioFine || null }),
    ...(mansione !== undefined && { mansione: mansione || null }),
    ...(postazione !== undefined && { postazione: postazione || null }),
    ...(note !== undefined && { note: note || null }),
  }).where(eq(eventiAssegnazioni.id, parseInt(assegnazioneId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const assegnazioneId = searchParams.get("assegnazioneId");
  if (!assegnazioneId) return NextResponse.json({ error: "assegnazioneId mancante" }, { status: 400 });

  await db.delete(eventiAssegnazioni).where(eq(eventiAssegnazioni.id, parseInt(assegnazioneId)));
  return NextResponse.json({ success: true });
}
