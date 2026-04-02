import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visibilitySettings, utenti } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const result = await db
    .select({
      id: visibilitySettings.id,
      userId: visibilitySettings.userId,
      dataReset: visibilitySettings.dataReset,
      note: visibilitySettings.note,
      creataDa: visibilitySettings.creataDa,
      creataAt: visibilitySettings.creataAt,
      dipNome: utenti.nome,
      dipCognome: utenti.cognome,
    })
    .from(visibilitySettings)
    .leftJoin(utenti, eq(visibilitySettings.userId, utenti.id));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { userId, dataReset, note } = body;

  if (!dataReset) {
    return NextResponse.json({ error: "Data reset obbligatoria" }, { status: 400 });
  }

  // Sovrascrivi se esiste già un setting per lo stesso target
  if (userId) {
    await db.delete(visibilitySettings).where(eq(visibilitySettings.userId, userId));
  } else {
    await db.delete(visibilitySettings).where(isNull(visibilitySettings.userId));
  }

  const [created] = await db.insert(visibilitySettings).values({
    userId: userId || null,
    dataReset: new Date(dataReset),
    note: note || null,
    creataDa: parseInt(user.id),
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
