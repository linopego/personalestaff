import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentiDipendente } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

// GET: lista documenti — admin vede tutti (filtro per dipendenteId), staff vede solo i suoi
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const dipendenteId = searchParams.get("dipendenteId");

  try {
    if (user.ruolo === "admin" && dipendenteId) {
      const docs = await db.select({
        id: documentiDipendente.id, nomeFile: documentiDipendente.nomeFile,
        tipoDocumento: documentiDipendente.tipoDocumento,
        lettoDaDipendente: documentiDipendente.lettoDaDipendente,
        createdAt: documentiDipendente.createdAt,
      }).from(documentiDipendente)
        .where(eq(documentiDipendente.dipendenteId, parseInt(dipendenteId)))
        .orderBy(desc(documentiDipendente.createdAt));
      return NextResponse.json(docs);
    } else {
      // Staff: solo i propri
      const docs = await db.select({
        id: documentiDipendente.id, nomeFile: documentiDipendente.nomeFile,
        tipoDocumento: documentiDipendente.tipoDocumento,
        lettoDaDipendente: documentiDipendente.lettoDaDipendente,
        createdAt: documentiDipendente.createdAt,
      }).from(documentiDipendente)
        .where(eq(documentiDipendente.dipendenteId, parseInt(user.id)))
        .orderBy(desc(documentiDipendente.createdAt));
      return NextResponse.json(docs);
    }
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}

// POST: admin carica documento
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const body = await req.json();
  const { dipendenteId, nomeFile, tipoDocumento, contenuto } = body;

  if (!dipendenteId || !nomeFile || !tipoDocumento || !contenuto) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  // Max 5MB in base64 (~6.7MB stringa)
  if (contenuto.length > 7000000) {
    return NextResponse.json({ error: "File troppo grande (max 5MB)" }, { status: 400 });
  }

  try {
    const [created] = await db.insert(documentiDipendente).values({
      dipendenteId, nomeFile, tipoDocumento, contenuto,
      caricatoDa: parseInt(user.id),
    }).returning({ id: documentiDipendente.id });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
