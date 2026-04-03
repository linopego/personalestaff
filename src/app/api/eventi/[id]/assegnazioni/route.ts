import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventiAssegnazioni } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const eventoId = parseInt(id);
  const body = await req.json();
  const { userId, orarioInizio, orarioFine, mansione, note } = body;

  if (!userId) return NextResponse.json({ error: "userId mancante" }, { status: 400 });

  // Check duplicato
  const [existing] = await db.select().from(eventiAssegnazioni)
    .where(and(eq(eventiAssegnazioni.eventoId, eventoId), eq(eventiAssegnazioni.userId, userId))).limit(1);
  if (existing) return NextResponse.json({ error: "Dipendente già assegnato" }, { status: 400 });

  try {
    const [created] = await db.insert(eventiAssegnazioni).values({
      eventoId, userId,
      orarioInizio: orarioInizio || null, orarioFine: orarioFine || null,
      mansione: mansione || null, note: note || null,
      aggiuntoDa: parseInt(user.id),
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
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
