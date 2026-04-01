import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sedi } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();

  await db.update(sedi).set({
    ...(body.nome !== undefined && { nome: body.nome }),
    ...(body.indirizzo !== undefined && { indirizzo: body.indirizzo }),
    ...(body.lat !== undefined && { lat: body.lat }),
    ...(body.lng !== undefined && { lng: body.lng }),
    ...(body.raggio !== undefined && { raggio: Math.max(50, Math.min(500, body.raggio)) }),
    ...(body.note !== undefined && { note: body.note }),
    ...(body.attiva !== undefined && { attiva: body.attiva }),
  }).where(eq(sedi.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
