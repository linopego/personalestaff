/**
 * Seed script — eseguire con: npx tsx src/db/seed.ts
 * Richiede DATABASE_URL nel .env.local
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import { sedi, utenti } from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("🌱 Seeding database...");

  // Sedi
  await db.insert(sedi).values([
    { nome: "La Casa dei Gelsi", indirizzo: "Via dei Gelsi 24, 36061 Bassano del Grappa (VI)", lat: 45.698997, lng: 11.770444, raggio: 100, note: "Sede principale — ristorante e sala eventi" },
    { nome: "Tenuta Villa Peggy's", indirizzo: "Via Villa Peggy 8, 36061 Bassano del Grappa (VI)", lat: 45.672833, lng: 11.732111, raggio: 100, note: "Location eventi e cerimonie" },
    { nome: "Studios Club / TooLate", indirizzo: "Viale delle Fosse 16, 36061 Bassano del Grappa (VI)", lat: 45.775361, lng: 11.689500, raggio: 100, note: "Club notturno — apertura serale/notturna" },
  ]);
  console.log("✅ Sedi inserite");

  // Admin
  await db.insert(utenti).values({
    nome: "Marco", cognome: "Bianchi",
    email: "admin@azienda.it",
    passwordHash: hashSync("Admin2024", 10),
    telefono: "339 1234567",
    ruolo: "admin",
    tipoContratto: "Fisso",
    oreSettimanali: 40,
    dataAssunzione: "2019-03-15",
  });
  console.log("✅ Admin creato");

  // Dipendenti
  const dipendenti = [
    { nome: "Laura", cognome: "Rossi", email: "dipendente@azienda.it", pw: "Staff2024", tel: "347 2345678", contratto: "Fisso", ore: 40, data: "2020-06-01" },
    { nome: "Alessandro", cognome: "Conti", email: "a.conti@azienda.it", pw: "Staff2024", tel: "333 3456789", contratto: "Part-time", ore: 24, data: "2022-01-10" },
    { nome: "Francesca", cognome: "Romano", email: "f.romano@azienda.it", pw: "Staff2024", tel: "340 4567890", contratto: "Fisso", ore: 40, data: "2018-09-20" },
    { nome: "Luca", cognome: "Moretti", email: "l.moretti@azienda.it", pw: "Staff2024", tel: "328 5678901", contratto: "A chiamata", ore: 0, data: "2023-04-01" },
    { nome: "Sara", cognome: "Colombo", email: "s.colombo@azienda.it", pw: "Staff2024", tel: "349 6789012", contratto: "Part-time", ore: 20, data: "2023-09-15" },
    { nome: "Elena", cognome: "Galli", email: "e.galli@azienda.it", pw: "Staff2024", tel: "320 8901234", contratto: "Fisso", ore: 36, data: "2021-11-01" },
    { nome: "Andrea", cognome: "Marino", email: "a.marino@azienda.it", pw: "Staff2024", tel: "338 9012345", contratto: "Part-time", ore: 24, data: "2024-06-10" },
    { nome: "Chiara", cognome: "Greco", email: "c.greco@azienda.it", pw: "Staff2024", tel: "342 0123456", contratto: "A chiamata", ore: 0, data: "2025-02-01" },
    { nome: "Davide", cognome: "Ricci", email: "d.ricci@azienda.it", pw: "Staff2024", tel: "335 7890123", contratto: "A chiamata", ore: 0, data: "2024-01-20" },
    { nome: "Giulia", cognome: "Ferretti", email: "g.ferretti@azienda.it", pw: "Staff2024", tel: "347 2345679", contratto: "Fisso", ore: 40, data: "2020-06-01" },
  ];

  for (const d of dipendenti) {
    await db.insert(utenti).values({
      nome: d.nome, cognome: d.cognome, email: d.email,
      passwordHash: hashSync(d.pw, 10),
      telefono: d.tel, ruolo: "staff", tipoContratto: d.contratto,
      oreSettimanali: d.ore, dataAssunzione: d.data,
    });
  }
  console.log("✅ Dipendenti creati");

  console.log("🎉 Seed completato!");
}

seed().catch(console.error);
