import { NextResponse } from "next/server";
import { db } from "@/db";
import { utenti } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const result = await db
    .select()
    .from(utenti)
    .where(eq(utenti.ruolo, "staff"));

  // Non esporre password hash
  const safe = result.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json(safe);
}
