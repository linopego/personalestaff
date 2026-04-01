import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { googleWhitelist } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const [wl] = await db.select().from(googleWhitelist).where(eq(googleWhitelist.id, parseInt(id))).limit(1);
  if (!wl) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (wl.utilizzata) return NextResponse.json({ error: "Non modificabile: l'utente ha già effettuato l'accesso" }, { status: 400 });

  const body = await req.json();
  await db.update(googleWhitelist).set({
    ...(body.tipoContratto && { tipoContratto: body.tipoContratto }),
    ...(body.oreSettimanali !== undefined && { oreSettimanali: body.oreSettimanali }),
    ...(body.nome !== undefined && { nome: body.nome }),
    ...(body.cognome !== undefined && { cognome: body.cognome }),
  }).where(eq(googleWhitelist.id, parseInt(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const [wl] = await db.select().from(googleWhitelist).where(eq(googleWhitelist.id, parseInt(id))).limit(1);
  if (!wl) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (wl.utilizzata) {
    return NextResponse.json({ error: "Non eliminabile: l'utente ha già effettuato l'accesso. Gestisci dalla sezione Dipendenti." }, { status: 400 });
  }

  await db.delete(googleWhitelist).where(eq(googleWhitelist.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
