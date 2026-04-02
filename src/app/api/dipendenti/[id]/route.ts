import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { utenti } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const [dip] = await db.select().from(utenti).where(eq(utenti.id, parseInt(id))).limit(1);
  if (!dip) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const { passwordHash, ...safe } = dip;
  return NextResponse.json(safe);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();
  const { nome, cognome, email, telefono, ruolo, tipoContratto, oreSettimanali, dataAssunzione, attivo, timbraturaRemotaAbilitata } = body;

  try {
    await db.update(utenti)
      .set({
        ...(nome !== undefined && { nome }),
        ...(cognome !== undefined && { cognome }),
        ...(email !== undefined && { email }),
        ...(telefono !== undefined && { telefono: telefono || null }),
        ...(ruolo !== undefined && { ruolo }),
        ...(tipoContratto !== undefined && { tipoContratto }),
        ...(oreSettimanali !== undefined && { oreSettimanali }),
        ...(dataAssunzione !== undefined && { dataAssunzione: dataAssunzione || null }),
        ...(attivo !== undefined && { attivo }),
        ...(timbraturaRemotaAbilitata !== undefined && { timbraturaRemotaAbilitata }),
        updatedAt: new Date(),
      })
      .where(eq(utenti.id, parseInt(id)));

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
  // Soft delete
  await db.update(utenti).set({ attivo: false, updatedAt: new Date() }).where(eq(utenti.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
