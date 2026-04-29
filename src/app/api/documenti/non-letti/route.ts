import { NextResponse } from "next/server";
import { db } from "@/db";
import { documentiDipendente } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(documentiDipendente)
      .where(and(eq(documentiDipendente.dipendenteId, parseInt(user.id)), eq(documentiDipendente.lettoDaDipendente, false)));
    return NextResponse.json({ count: Number(result?.count ?? 0) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
