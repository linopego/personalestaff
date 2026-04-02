import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { turni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();

  try {
    await db.update(turni).set({
      ...(body.data && { data: body.data }),
      ...(body.sedeId && { sedeId: body.sedeId }),
      ...(body.areaOperativa && { areaOperativa: body.areaOperativa }),
      ...(body.orarioInizio && { orarioInizio: body.orarioInizio }),
      ...(body.orarioFine && { orarioFine: body.orarioFine }),
      ...(body.note !== undefined && { note: body.note || null }),
      ...(body.stato && { stato: body.stato }),
      aggiornatoAt: new Date(),
    }).where(eq(turni.id, parseInt(id)));
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
  const [turno] = await db.select().from(turni).where(eq(turni.id, parseInt(id))).limit(1);
  if (!turno) return NextResponse.json({ error: "Turno non trovato" }, { status: 404 });
  if (turno.stato === "confermato") {
    return NextResponse.json({ error: "Un turno confermato non può essere eliminato, solo modificato" }, { status: 400 });
  }

  await db.delete(turni).where(eq(turni.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
