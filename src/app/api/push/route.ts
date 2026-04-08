import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

// POST: registra subscription
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const userId = parseInt(user.id);

  // Evita duplicati
  const [existing] = await db.select().from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))).limit(1);

  if (!existing) {
    await db.insert(pushSubscriptions).values({
      userId, endpoint, p256dh: keys.p256dh, auth: keys.auth,
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE: rimuovi subscription
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { endpoint } = await req.json();
  await db.delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, parseInt(user.id)), eq(pushSubscriptions.endpoint, endpoint)));

  return NextResponse.json({ success: true });
}
