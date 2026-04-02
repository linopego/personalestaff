import { NextResponse } from "next/server";
import { db } from "@/db";
import { logAccessi } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const logs = await db.select().from(logAccessi).orderBy(desc(logAccessi.createdAt)).limit(50);
  return NextResponse.json(logs);
}
