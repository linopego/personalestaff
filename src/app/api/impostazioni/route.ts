import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { impostazioni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const rows = await db.select().from(impostazioni).limit(1);
  if (rows.length === 0) {
    // Crea riga iniziale
    const [created] = await db.insert(impostazioni).values({}).returning();
    return NextResponse.json(created);
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const rows = await db.select().from(impostazioni).limit(1);

  if (rows.length === 0) {
    const [created] = await db.insert(impostazioni).values({ ...body, updatedAt: new Date() }).returning();
    return NextResponse.json(created);
  }

  await db.update(impostazioni).set({ ...body, updatedAt: new Date() }).where(eq(impostazioni.id, rows[0].id));
  const [updated] = await db.select().from(impostazioni).where(eq(impostazioni.id, rows[0].id));
  return NextResponse.json(updated);
}
