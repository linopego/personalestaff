import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { googleWhitelist } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const result = await db.select().from(googleWhitelist).orderBy(googleWhitelist.creataAt);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { email, nome, cognome, tipoContratto, oreSettimanali } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  // Controlla duplicati
  const [existing] = await db.select().from(googleWhitelist).where(eq(googleWhitelist.email, email.toLowerCase())).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Questa email è già in whitelist" }, { status: 400 });
  }

  const [created] = await db.insert(googleWhitelist).values({
    email: email.toLowerCase(),
    nome: nome || null,
    cognome: cognome || null,
    tipoContratto: tipoContratto || "Fisso",
    oreSettimanali: oreSettimanali ?? 40,
    creataDa: parseInt(user.id),
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
