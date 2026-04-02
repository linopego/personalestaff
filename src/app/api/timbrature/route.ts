import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature, sedi, utenti } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/api-auth";
import { calcolaDistanza } from "@/lib/geo";
import { getVisibilityDate } from "@/lib/visibility";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const sedeId = searchParams.get("sedeId");
  const dataInizio = searchParams.get("dataInizio");
  const dataFine = searchParams.get("dataFine");
  const tipo = searchParams.get("tipo");

  const conditions = [];

  // Staff vede solo le proprie + filtro visibilità
  if (user.ruolo !== "admin") {
    conditions.push(eq(timbrature.userId, parseInt(user.id)));
    const visDate = await getVisibilityDate(parseInt(user.id));
    if (visDate) {
      conditions.push(gte(timbrature.orario, visDate));
    }
  } else if (userId) {
    conditions.push(eq(timbrature.userId, parseInt(userId)));
  }

  if (sedeId) conditions.push(eq(timbrature.sedeId, parseInt(sedeId)));
  if (tipo) conditions.push(eq(timbrature.tipo, tipo));
  if (dataInizio) conditions.push(gte(timbrature.orario, new Date(dataInizio)));
  if (dataFine) {
    const fine = new Date(dataFine);
    fine.setHours(23, 59, 59, 999);
    conditions.push(lte(timbrature.orario, fine));
  }

  const result = await db
    .select({
      id: timbrature.id,
      userId: timbrature.userId,
      sedeId: timbrature.sedeId,
      tipo: timbrature.tipo,
      orario: timbrature.orario,
      lat: timbrature.lat,
      lng: timbrature.lng,
      modificataManualmente: timbrature.modificataManualmente,
      noteModifica: timbrature.noteModifica,
      tipoAccesso: timbrature.tipoAccesso,
      motivoRemoto: timbrature.motivoRemoto,
      modifiedBy: timbrature.modifiedBy,
      dipNome: utenti.nome,
      dipCognome: utenti.cognome,
      sedeNome: sedi.nome,
    })
    .from(timbrature)
    .innerJoin(utenti, eq(timbrature.userId, utenti.id))
    .leftJoin(sedi, eq(timbrature.sedeId, sedi.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(timbrature.orario))
    .limit(500);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { sedeId, tipo, lat, lng, tipoAccesso, motivoRemoto } = body;
  const isRemoto = tipoAccesso === "remoto";

  if (!tipo || lat == null || lng == null) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const userId = parseInt(user.id);

  if (isRemoto) {
    // Verifica che il dipendente abbia timbratura remota abilitata
    const [dbUser] = await db.select({ timbraturaRemotaAbilitata: utenti.timbraturaRemotaAbilitata })
      .from(utenti).where(eq(utenti.id, userId)).limit(1);
    if (!dbUser?.timbraturaRemotaAbilitata) {
      return NextResponse.json({ error: "Timbratura remota non autorizzata per questo account" }, { status: 403 });
    }
  } else {
    // Timbratura in sede: verifica geofence
    if (!sedeId) {
      return NextResponse.json({ error: "Sede mancante" }, { status: 400 });
    }
    const [sede] = await db.select().from(sedi).where(eq(sedi.id, sedeId)).limit(1);
    if (!sede) {
      return NextResponse.json({ error: "Sede non trovata" }, { status: 404 });
    }
    const distanza = calcolaDistanza(lat, lng, sede.lat, sede.lng);
    if (distanza > sede.raggio) {
      return NextResponse.json(
        { error: "Posizione non autorizzata", distanza: Math.round(distanza), raggio: sede.raggio },
        { status: 403 }
      );
    }
  }

  // COOLDOWN SERVER-SIDE: rifiuta se ultima timbratura < 60 secondi fa
  const [ultima] = await db
    .select({ orario: timbrature.orario })
    .from(timbrature)
    .where(eq(timbrature.userId, userId))
    .orderBy(desc(timbrature.orario))
    .limit(1);

  if (ultima) {
    const secondiFaUltima = (Date.now() - new Date(ultima.orario).getTime()) / 1000;
    if (secondiFaUltima < 60) {
      return NextResponse.json(
        { error: `Devi attendere ${Math.ceil(60 - secondiFaUltima)} secondi prima di timbrare di nuovo` },
        { status: 429 }
      );
    }
  }

  const [nuova] = await db.insert(timbrature).values({
    userId,
    sedeId: isRemoto ? null : sedeId,
    tipo,
    orario: new Date(),
    lat,
    lng,
    tipoAccesso: isRemoto ? "remoto" : "sede",
    motivoRemoto: isRemoto ? (motivoRemoto || null) : null,
  }).returning();

  return NextResponse.json(nuova, { status: 201 });
}
