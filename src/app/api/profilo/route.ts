import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { utenti } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

// PUT: aggiorna foto profilo
export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { avatarUrl } = body;

  if (!avatarUrl) {
    return NextResponse.json({ error: "Immagine mancante" }, { status: 400 });
  }

  // Limita dimensione (max ~200KB in base64)
  if (avatarUrl.length > 300000) {
    return NextResponse.json({ error: "Immagine troppo grande (max 200KB)" }, { status: 400 });
  }

  await db.update(utenti).set({ avatarUrl, updatedAt: new Date() })
    .where(eq(utenti.id, parseInt(user.id)));

  return NextResponse.json({ success: true });
}

// DELETE: rimuovi foto profilo
export async function DELETE() {
  const user = await getSession();
  if (!user) return unauthorized();

  await db.update(utenti).set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(utenti.id, parseInt(user.id)));

  return NextResponse.json({ success: true });
}
