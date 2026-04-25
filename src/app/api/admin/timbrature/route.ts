import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature } from "@/db/schema";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

// POST: admin crea una timbratura con orario specifico (no cooldown, no geofence)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { userId, sedeId, tipo, orario, lat, lng, noteModifica } = body;

  if (!userId || !tipo || !orario) {
    return NextResponse.json({ error: "Dati mancanti: userId, tipo, orario" }, { status: 400 });
  }

  try {
    const [created] = await db.insert(timbrature).values({
      userId,
      sedeId: sedeId || null,
      tipo,
      orario: new Date(orario),
      lat: lat || 0,
      lng: lng || 0,
      tipoAccesso: "sede",
      modificataManualmente: true,
      noteModifica: noteModifica || "Inserita manualmente dall'admin",
      modifiedBy: parseInt(user.id),
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
