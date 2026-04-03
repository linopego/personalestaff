import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventi, eventiAssegnazioni, utenti, sedi } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const [evento] = await db.select({
    id: eventi.id, nome: eventi.nome, data: eventi.data,
    oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
    sedeId: eventi.sedeId, sedeAltro: eventi.sedeAltro,
    descrizione: eventi.descrizione, stato: eventi.stato,
    sedeNome: sedi.nome,
  }).from(eventi).leftJoin(sedi, eq(eventi.sedeId, sedi.id)).where(eq(eventi.id, parseInt(id))).limit(1);

  if (!evento) return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });

  const assegnazioni = await db.select({
    id: eventiAssegnazioni.id, userId: eventiAssegnazioni.userId,
    orarioInizio: eventiAssegnazioni.orarioInizio, orarioFine: eventiAssegnazioni.orarioFine,
    mansione: eventiAssegnazioni.mansione, note: eventiAssegnazioni.note,
    dipNome: utenti.nome, dipCognome: utenti.cognome, tipoContratto: utenti.tipoContratto,
  }).from(eventiAssegnazioni).innerJoin(utenti, eq(eventiAssegnazioni.userId, utenti.id))
    .where(eq(eventiAssegnazioni.eventoId, parseInt(id)));

  return NextResponse.json({ ...evento, sede: evento.sedeNome || evento.sedeAltro || "—", assegnazioni });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();
  try {
    await db.update(eventi).set({
      ...(body.nome && { nome: body.nome }),
      ...(body.data && { data: body.data }),
      ...(body.oraInizio !== undefined && { oraInizio: body.oraInizio || null }),
      ...(body.oraFine !== undefined && { oraFine: body.oraFine || null }),
      ...(body.sedeId !== undefined && { sedeId: body.sedeId || null }),
      ...(body.sedeAltro !== undefined && { sedeAltro: body.sedeAltro || null }),
      ...(body.descrizione !== undefined && { descrizione: body.descrizione || null }),
      ...(body.stato && { stato: body.stato }),
      aggiornatoAt: new Date(),
    }).where(eq(eventi.id, parseInt(id)));
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
  const [evento] = await db.select().from(eventi).where(eq(eventi.id, parseInt(id))).limit(1);
  if (!evento) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (evento.stato === "confermato") return NextResponse.json({ error: "Un evento confermato non può essere eliminato" }, { status: 400 });

  await db.delete(eventi).where(eq(eventi.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
