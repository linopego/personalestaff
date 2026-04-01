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

  await db.update(timbrature)
    .set({
      modificataManualmente: true,
      noteModifica: noteModifica.trim(),
      modifiedBy: parseInt(user.id),
      ...(body.orario && { orario: new Date(body.orario) }),
      ...(body.sedeId && { sedeId: body.sedeId }),
    })
    .where(eq(timbrature.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
