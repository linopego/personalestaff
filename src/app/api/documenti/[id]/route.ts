import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentiDipendente } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

// GET: scarica il documento (contenuto base64)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { id } = await params;
  const [doc] = await db.select().from(documentiDipendente).where(eq(documentiDipendente.id, parseInt(id))).limit(1);

  if (!doc) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  // Staff può vedere solo i propri
  if (user.ruolo !== "admin" && doc.dipendenteId !== parseInt(user.id)) {
    return forbidden();
  }

  // Segna come letto se è il dipendente che lo apre
  if (user.ruolo !== "admin" && !doc.lettoDaDipendente) {
    await db.update(documentiDipendente).set({ lettoDaDipendente: true }).where(eq(documentiDipendente.id, parseInt(id)));
  }

  return NextResponse.json({ contenuto: doc.contenuto, nomeFile: doc.nomeFile });
}

// DELETE: admin elimina documento
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  await db.delete(documentiDipendente).where(eq(documentiDipendente.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
