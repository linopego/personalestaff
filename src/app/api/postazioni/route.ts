import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { postazioni } from "@/db/schema";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();

  const result = await db.select({ id: postazioni.id, nome: postazioni.nome }).from(postazioni).orderBy(postazioni.nome);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

  try {
    const [created] = await db.insert(postazioni).values({ nome: nome.trim(), creatoDa: parseInt(user.id) }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Postazione già esistente" }, { status: 400 });
  }
}
