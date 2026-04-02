import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { turniAssegnazioni, turni } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const turnoId = parseInt(id);
  const body = await req.json();
  const { userId, mansione } = body;

  if (!userId) return NextResponse.json({ error: "userId mancante" }, { status: 400 });

  // Verifica turno esiste
  const [turno] = await db.select().from(turni).where(eq(turni.id, turnoId)).limit(1);
  if (!turno) return NextResponse.json({ error: "Turno non trovato" }, { status: 404 });

  // Verifica conflitti orario
  const turniStessoGiorno = await db
    .select({ id: turni.id, orarioInizio: turni.orarioInizio, orarioFine: turni.orarioFine, areaOperativa: turni.areaOperativa })
    .from(turni)
    .innerJoin(turniAssegnazioni, eq(turni.id, turniAssegnazioni.turnoId))
    .where(and(eq(turniAssegnazioni.userId, userId), eq(turni.data, turno.data)));

  for (const t of turniStessoGiorno) {
    if (t.id === turnoId) continue;
    // Check overlap
    if (turno.orarioInizio < t.orarioFine && turno.orarioFine > t.orarioInizio) {
      return NextResponse.json({
        error: `Conflitto orario: il dipendente è già assegnato a ${t.areaOperativa} (${t.orarioInizio}-${t.orarioFine})`,
      }, { status: 409 });
    }
  }

  // Verifica duplicato
  const [existing] = await db.select().from(turniAssegnazioni)
    .where(and(eq(turniAssegnazioni.turnoId, turnoId), eq(turniAssegnazioni.userId, userId))).limit(1);
  if (existing) return NextResponse.json({ error: "Dipendente già assegnato a questo turno" }, { status: 400 });

  try {
    const [created] = await db.insert(turniAssegnazioni).values({
      turnoId, userId, mansione: mansione || null,
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

  await db.delete(turniAssegnazioni).where(eq(turniAssegnazioni.id, parseInt(assegnazioneId)));
  return NextResponse.json({ success: true });
}
