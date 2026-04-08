import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifiche } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

// GET: le mie notifiche
export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
    const result = await db.select().from(notifiche)
      .where(eq(notifiche.userId, parseInt(user.id)))
      .orderBy(desc(notifiche.createdAt))
      .limit(50);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

// PUT: segna come lette
export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { ids } = await req.json();
  if (Array.isArray(ids)) {
    for (const id of ids) {
      await db.update(notifiche).set({ letto: true })
        .where(and(eq(notifiche.id, id), eq(notifiche.userId, parseInt(user.id))));
    }
  } else {
    // Segna tutte come lette
    await db.update(notifiche).set({ letto: true })
      .where(eq(notifiche.userId, parseInt(user.id)));
  }

  return NextResponse.json({ success: true });
}
