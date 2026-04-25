import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timbrature, utenti, sedi, eventi, eventiAssegnazioni } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";
import ExcelJS from "exceljs";

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
  const tipo = searchParams.get("tipo") || "completo";
  const customInizio = searchParams.get("dataInizio");
  const customFine = searchParams.get("dataFine");

  let dataInizio: string;
  let dataFine: string;

  if (customInizio && customFine) {
    dataInizio = customInizio;
    dataFine = customFine;
  } else {
    const oggi = new Date();
    const lunediCorrente = getMonday(oggi);
    const lunediPrecedente = new Date(lunediCorrente);
    lunediPrecedente.setDate(lunediPrecedente.getDate() - 7);
    const domenicaPrecedente = new Date(lunediPrecedente);
    domenicaPrecedente.setDate(domenicaPrecedente.getDate() + 6);
    dataInizio = isoLocal(lunediPrecedente);
    dataFine = isoLocal(domenicaPrecedente);
  }

  const inizioUTC = new Date(dataInizio + "T00:00:00+02:00");
  const fineUTC = new Date(dataFine + "T23:59:59+01:00");

  // Fetch dipendenti
  const dips = await db.select({ id: utenti.id, nome: utenti.nome, cognome: utenti.cognome, tipoContratto: utenti.tipoContratto, oreSettimanali: utenti.oreSettimanali })
    .from(utenti).where(eq(utenti.ruolo, "staff"));

  // Fetch timbrature
  const timbr = await db.select({
    userId: timbrature.userId, tipo: timbrature.tipo, orario: timbrature.orario,
    sedeNome: sedi.nome, tipoAccesso: timbrature.tipoAccesso,
    dipNome: utenti.nome, dipCognome: utenti.cognome,
  }).from(timbrature)
    .innerJoin(utenti, eq(timbrature.userId, utenti.id))
    .leftJoin(sedi, eq(timbrature.sedeId, sedi.id))
    .where(and(gte(timbrature.orario, inizioUTC), lte(timbrature.orario, fineUTC)))
    .orderBy(utenti.cognome, utenti.nome, timbrature.orario);

  // ── Crea workbook Excel ──
  const wb = new ExcelJS.Workbook();
  wb.creator = "Creazioni Staff";

  const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
  const TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, size: 12 };
  const BORDER: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } },
  };

  if (tipo === "completo" || tipo === "timbrature") {
    const ws = wb.addWorksheet("Timbrature");

    // Titolo
    ws.mergeCells("A1:F1");
    const titleCell = ws.getCell("A1");
    titleCell.value = `REPORT TIMBRATURE — ${dataInizio} / ${dataFine}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
    titleCell.alignment = { horizontal: "center" };

    ws.addRow([]);

    // Raggruppa per dipendente
    const perDip = new Map<number, typeof timbr>();
    for (const t of timbr) {
      if (!perDip.has(t.userId)) perDip.set(t.userId, []);
      perDip.get(t.userId)!.push(t);
    }

    // Ordina per cognome
    const dipIds = [...perDip.keys()].sort((a, b) => {
      const da = perDip.get(a)![0];
      const db2 = perDip.get(b)![0];
      return `${da.dipCognome} ${da.dipNome}`.localeCompare(`${db2.dipCognome} ${db2.dipNome}`);
    });

    let grandTotal = 0;

    for (const dipId of dipIds) {
      const records = perDip.get(dipId)!;
      const nome = `${records[0].dipNome} ${records[0].dipCognome}`;

      // Nome dipendente come sezione
      const nameRow = ws.addRow([nome]);
      nameRow.font = { bold: true, size: 12, color: { argb: "FF1E3A5F" } };
      ws.mergeCells(`A${nameRow.number}:F${nameRow.number}`);

      // Header tabella
      const headerRow = ws.addRow(["Data", "Sede", "Entrata", "Uscita", "Ore", "Note"]);
      headerRow.eachCell(cell => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; cell.border = BORDER; cell.alignment = { horizontal: "center" }; });

      // Paira entrate/uscite
      const sorted = [...records].sort((a, b) => new Date(a.orario).getTime() - new Date(b.orario).getTime());
      let dipTotal = 0;

      let i = 0;
      while (i < sorted.length) {
        if (sorted[i].tipo === "Entrata") {
          const ent = sorted[i];
          const entDate = new Date(ent.orario);
          const entDateStr = entDate.toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" });
          const entTime = entDate.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
          const sede = ent.sedeNome || "Remoto";

          let uscTime = "";
          let ore = 0;
          let nota = "";

          if (i + 1 < sorted.length && sorted[i + 1].tipo === "Uscita") {
            const usc = sorted[i + 1];
            const uscDate = new Date(usc.orario);
            uscTime = uscDate.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
            // Se giorno diverso, aggiungi la data
            const uscDateStr = uscDate.toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit" });
            if (entDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }) !== uscDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" })) {
              uscTime += ` (${uscDateStr})`;
            }
            ore = Math.round(((uscDate.getTime() - entDate.getTime()) / 3600000) * 100) / 100;
            if (usc.tipoAccesso === "remoto") nota = "Uscita remota";
            i += 2;
          } else {
            nota = "Turno incompleto";
            i += 1;
          }

          dipTotal += ore;

          const row = ws.addRow([entDateStr, sede, entTime, uscTime, ore || "", nota]);
          row.eachCell(cell => { cell.border = BORDER; cell.alignment = { horizontal: "center" }; });
          // Colonna ore in grassetto
          if (ore > 0) row.getCell(5).font = { bold: true };
        } else {
          i += 1;
        }
      }

      grandTotal += dipTotal;

      // Riga totale dipendente
      const totalRow = ws.addRow(["", "", "", "TOTALE", Math.round(dipTotal * 100) / 100, "ore"]);
      totalRow.eachCell(cell => { cell.fill = TOTAL_FILL; cell.border = BORDER; cell.alignment = { horizontal: "center" }; });
      totalRow.getCell(4).font = TOTAL_FONT;
      totalRow.getCell(5).font = { bold: true, size: 13, color: { argb: "FF1E7A3F" } };

      ws.addRow([]); // Riga vuota tra dipendenti
    }

    // Riga grand total
    ws.addRow([]);
    const gtRow = ws.addRow(["", "", "", "TOTALE GENERALE", Math.round(grandTotal * 100) / 100, "ore"]);
    gtRow.eachCell(cell => { cell.font = { bold: true, size: 14 }; cell.alignment = { horizontal: "center" }; });
    gtRow.getCell(5).font = { bold: true, size: 16, color: { argb: "FF1E3A5F" } };

    // Larghezza colonne
    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 25;
    ws.getColumn(3).width = 10;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 10;
    ws.getColumn(6).width = 18;
  }

  if (tipo === "completo" || tipo === "turni") {
    const eventiList = await db.select({
      id: eventi.id, nome: eventi.nome, data: eventi.data,
      oraInizio: eventi.oraInizio, oraFine: eventi.oraFine,
      sedeNome: sedi.nome, sedeAltro: eventi.sedeAltro,
    }).from(eventi)
      .leftJoin(sedi, eq(eventi.sedeId, sedi.id))
      .where(and(gte(eventi.data, dataInizio), lte(eventi.data, dataFine)));

    if (eventiList.length > 0) {
      const ws = wb.addWorksheet("Eventi");

      ws.mergeCells("A1:G1");
      const titleCell = ws.getCell("A1");
      titleCell.value = `EVENTI — ${dataInizio} / ${dataFine}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
      titleCell.alignment = { horizontal: "center" };
      ws.addRow([]);

      const headerRow = ws.addRow(["Evento", "Data", "Orario", "Sede", "Dipendente", "Mansione", "Postazione"]);
      headerRow.eachCell(cell => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; cell.border = BORDER; cell.alignment = { horizontal: "center" }; });

      for (const ev of eventiList) {
        const ass = await db.select({
          dipNome: utenti.nome, dipCognome: utenti.cognome,
          orarioInizio: eventiAssegnazioni.orarioInizio, orarioFine: eventiAssegnazioni.orarioFine,
          mansione: eventiAssegnazioni.mansione, postazione: eventiAssegnazioni.postazione,
        }).from(eventiAssegnazioni)
          .innerJoin(utenti, eq(eventiAssegnazioni.userId, utenti.id))
          .where(eq(eventiAssegnazioni.eventoId, ev.id));

        const sede = ev.sedeNome || ev.sedeAltro || "";
        const orario = ev.oraInizio ? `${ev.oraInizio}${ev.oraFine ? " - " + ev.oraFine : ""}` : "";

        if (ass.length === 0) {
          const row = ws.addRow([ev.nome, ev.data, orario, sede, "", "", ""]);
          row.eachCell(cell => { cell.border = BORDER; });
        } else {
          for (const a of ass) {
            const dipOrario = a.orarioInizio ? `${a.orarioInizio}-${a.orarioFine === "chiusura" ? "Chiusura" : (a.orarioFine || "")}` : "";
            const row = ws.addRow([ev.nome, ev.data, dipOrario || orario, sede, `${a.dipNome} ${a.dipCognome}`, a.mansione || "", a.postazione || ""]);
            row.eachCell(cell => { cell.border = BORDER; });
          }
        }
      }

      ws.getColumn(1).width = 25;
      ws.getColumn(2).width = 12;
      ws.getColumn(3).width = 16;
      ws.getColumn(4).width = 25;
      ws.getColumn(5).width = 22;
      ws.getColumn(6).width = 16;
      ws.getColumn(7).width = 16;
    }
  }

  // Genera buffer e response
  const buffer = await wb.xlsx.writeBuffer();

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  headers.set("Content-Disposition", `attachment; filename="report_${dataInizio}_${dataFine}.xlsx"`);

  return new NextResponse(buffer, { headers });
}
