import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();
  const { noteModifica } = body;

  if (!noteModifica?.trim()) {
    return NextResponse.json({ error: "Le note sono obbligatorie per le correzioni manuali" }, { status: 400 });
  }

  try {
    // Costruisci l'oggetto update
    const updateData: Record<string, unknown> = {
      modificataManualmente: true,
      noteModifica: noteModifica.trim(),
      modifiedBy: parseInt(user.id),
    };

    if (body.orario) {
      // body.orario arriva come "2026-04-04T10:30:00+02:00" (con timezone dal frontend)
      updateData.orario = new Date(body.orario);
    }
    if (body.sedeId) updateData.sedeId = body.sedeId;

    await db.update(timbrature)
      .set(updateData)
      .where(eq(timbrature.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const idNum = parseInt(id);

  // Verifica che esista
  const [existing] = await db.select().from(timbrature).where(eq(timbrature.id, idNum)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Timbratura non trovata" }, { status: 404 });
  }

  // Cancella fisicamente
  await db.delete(timbrature).where(eq(timbrature.id, idNum));

  return NextResponse.json({ message: "Timbratura eliminata" });
}
