import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature, utenti, sedi, eventi, eventiAssegnazioni } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") || "completo"; // completo, timbrature, turni

  // Settimana precedente
  const oggi = new Date();
  const lunediCorrente = getMonday(oggi);
  const lunediPrecedente = new Date(lunediCorrente);
  lunediPrecedente.setDate(lunediPrecedente.getDate() - 7);
  const domenicaPrecedente = new Date(lunediPrecedente);
  domenicaPrecedente.setDate(domenicaPrecedente.getDate() + 6);

  const dataInizio = isoLocal(lunediPrecedente);
  const dataFine = isoLocal(domenicaPrecedente);
  const inizioUTC = new Date(dataInizio + "T00:00:00Z");
  inizioUTC.setHours(inizioUTC.getHours() - 2);
  const fineUTC = new Date(dataFine + "T23:59:59Z");
  fineUTC.setHours(fineUTC.getHours() + 2);

  // Fetch dipendenti
  const dips = await db.select({ id: utenti.id, nome: utenti.nome, cognome: utenti.cognome, tipoContratto: utenti.tipoContratto, oreSettimanali: utenti.oreSettimanali })
    .from(utenti).where(eq(utenti.ruolo, "staff"));

  let csv = "";

  if (tipo === "completo" || tipo === "timbrature") {
    // ── TIMBRATURE ──
    const timbr = await db.select({
      userId: timbrature.userId, tipo: timbrature.tipo, orario: timbrature.orario,
      sedeNome: sedi.nome, tipoAccesso: timbrature.tipoAccesso,
      dipNome: utenti.nome, dipCognome: utenti.cognome,
    }).from(timbrature)
      .innerJoin(utenti, eq(timbrature.userId, utenti.id))
      .leftJoin(sedi, eq(timbrature.sedeId, sedi.id))
      .where(and(gte(timbrature.orario, inizioUTC), lte(timbrature.orario, fineUTC)))
      .orderBy(utenti.cognome, utenti.nome, timbrature.orario);

    csv += `TIMBRATURE SETTIMANA ${dataInizio} - ${dataFine}\n`;
    csv += `Dipendente,Data,Ora,Tipo,Sede,Modalità\n`;
    for (const t of timbr) {
      const d = new Date(t.orario);
      csv += `"${t.dipNome} ${t.dipCognome}",${isoLocal(d)},${d.toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit" })},${t.tipo},${t.sedeNome || "Remoto"},${t.tipoAccesso || "sede"}\n`;
    }

    // Calcola ore per dipendente
    csv += `\nRIEPILOGO ORE PER DIPENDENTE\n`;
    csv += `Dipendente,Tipo Contratto,Ore Contrattuali,Ore Lavorate,Differenza\n`;

    for (const dip of dips) {
      const dipTimbr = timbr.filter(t => t.userId === dip.id).sort((a, b) => new Date(a.orario).getTime() - new Date(b.orario).getTime());
      let oreTotali = 0;
      let entrata: Date | null = null;

      for (const t of dipTimbr) {
        if (t.tipo === "Entrata") {
          entrata = new Date(t.orario);
        } else if (t.tipo === "Uscita" && entrata) {
          let diff = (new Date(t.orario).getTime() - entrata.getTime()) / 3600000;
          if (diff < 0) diff += 24;
          oreTotali += diff;
          entrata = null;
        }
      }

      const oreRound = Math.round(oreTotali * 100) / 100;
      const differenza = Math.round((oreRound - dip.oreSettimanali) * 100) / 100;
      csv += `"${dip.nome} ${dip.cognome}",${dip.tipoContratto},${dip.oreSettimanali},${oreRound},${differenza > 0 ? "+" : ""}${differenza}\n`;
    }
  }

  if (tipo === "completo" || tipo === "turni") {
    // ── EVENTI/TURNI ──
    const eventiList = await db.select({
      id: eventi.id, nome: eventi.nome, data: eventi.data,
      oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
      sedeNome: sedi.nome, sedeAltro: eventi.sedeAltro,
    }).from(eventi)
      .leftJoin(sedi, eq(eventi.sedeId, sedi.id))
      .where(and(gte(eventi.data, dataInizio), lte(eventi.data, dataFine)));

    if (eventiList.length > 0) {
      csv += `\nEVENTI SETTIMANA ${dataInizio} - ${dataFine}\n`;
      csv += `Evento,Data,Ora Inizio,Ora Fine,Sede,Dipendente,Orario Dip.,Mansione,Postazione\n`;

      for (const ev of eventiList) {
        const ass = await db.select({
          dipNome: utenti.nome, dipCognome: utenti.cognome,
          orarioInizio: eventiAssegnazioni.orarioInizio, orarioFine: eventiAssegnazioni.orarioFine,
          mansione: eventiAssegnazioni.mansione, postazione: eventiAssegnazioni.postazione,
        }).from(eventiAssegnazioni)
          .innerJoin(utenti, eq(eventiAssegnazioni.userId, utenti.id))
          .where(eq(eventiAssegnazioni.eventoId, ev.id));

        const sede = ev.sedeNome || ev.sedeAltro || "";

        if (ass.length === 0) {
          csv += `"${ev.nome}",${ev.data},${ev.oraInizio || ""},${ev.oraFine || ""},"${sede}",,,,\n`;
        } else {
          for (const a of ass) {
            csv += `"${ev.nome}",${ev.data},${ev.oraInizio || ""},${ev.oraFine || ""},"${sede}","${a.dipNome} ${a.dipCognome}",${a.orarioInizio || ""}-${a.orarioFine || ""},${a.mansione || ""},${a.postazione || ""}\n`;
          }
        }
      }
    }
  }

  // Genera response
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="report_${dataInizio}_${dataFine}.csv"`);

  return new NextResponse(csv, { headers });
}
