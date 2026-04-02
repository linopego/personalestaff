import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  doublePrecision,
  date,
} from "drizzle-orm/pg-core";

/* ── Sedi ── */
export const sedi = pgTable("sedi", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  indirizzo: text("indirizzo"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  raggio: integer("raggio").notNull().default(100),
  note: text("note"),
  attiva: boolean("attiva").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Utenti (admin + dipendenti) ── */
export const utenti = pgTable("utenti", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  cognome: varchar("cognome", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  telefono: varchar("telefono", { length: 30 }),
  ruolo: varchar("ruolo", { length: 20 }).notNull().default("staff"),
  tipoContratto: varchar("tipo_contratto", { length: 30 }).notNull().default("Fisso"),
  oreSettimanali: integer("ore_settimanali").notNull().default(40),
  dataAssunzione: date("data_assunzione"),
  attivo: boolean("attivo").notNull().default(true),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  metodoAccesso: varchar("metodo_accesso", { length: 10 }).notNull().default("email"), // "email" | "google"
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Whitelist Google (email autorizzate dall'admin) ── */
export const googleWhitelist = pgTable("google_whitelist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }),
  cognome: varchar("cognome", { length: 100 }),
  tipoContratto: varchar("tipo_contratto", { length: 30 }).notNull().default("Fisso"),
  oreSettimanali: integer("ore_settimanali").notNull().default(40),
  creataDa: integer("creata_da").notNull().references(() => utenti.id),
  creataAt: timestamp("creata_at").defaultNow().notNull(),
  utilizzata: boolean("utilizzata").notNull().default(false),
});

/* ── Timbrature ── */
export const timbrature = pgTable("timbrature", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => utenti.id),
  sedeId: integer("sede_id").notNull().references(() => sedi.id),
  tipo: varchar("tipo", { length: 10 }).notNull(), // "Entrata" | "Uscita"
  orario: timestamp("orario").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  modificataManualmente: boolean("modificata_manualmente").notNull().default(false),
  noteModifica: text("note_modifica"),
  modifiedBy: integer("modified_by").references(() => utenti.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Impostazioni App (singleton — una sola riga) ── */
export const impostazioni = pgTable("impostazioni", {
  id: serial("id").primaryKey(),
  nomeAzienda: varchar("nome_azienda", { length: 255 }).notNull().default("PresenzApp"),
  fusoOrario: varchar("fuso_orario", { length: 50 }).notNull().default("Europe/Rome"),
  formatoOra: varchar("formato_ora", { length: 5 }).notNull().default("24h"),
  primoGiorno: varchar("primo_giorno", { length: 10 }).notNull().default("lunedi"),
  maxOreGiornaliere: integer("max_ore_giornaliere").notNull().default(10),
  tolleranzaMinuti: integer("tolleranza_minuti").notNull().default(5),
  notifTurniIncompleti: boolean("notif_turni_incompleti").notNull().default(true),
  notifTurniIncompletiEmail: varchar("notif_turni_incompleti_email", { length: 255 }).default(""),
  notifOreMax: boolean("notif_ore_max").notNull().default(true),
  notifOreMaxEmail: varchar("notif_ore_max_email", { length: 255 }).default(""),
  notifRiepilogoSett: boolean("notif_riepilogo_sett").notNull().default(false),
  notifRiepilogoSettEmail: varchar("notif_riepilogo_sett_email", { length: 255 }).default(""),
  notifTimbratureAnomale: boolean("notif_timbrature_anomale").notNull().default(true),
  notifTimbratureAnomaleEmail: varchar("notif_timbrature_anomale_email", { length: 255 }).default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Log Accessi ── */
export const logAccessi = pgTable("log_accessi", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => utenti.id),
  email: varchar("email", { length: 255 }).notNull(),
  utente: varchar("utente", { length: 255 }).notNull(),
  dispositivo: varchar("dispositivo", { length: 255 }),
  ip: varchar("ip", { length: 50 }),
  esito: varchar("esito", { length: 20 }).notNull().default("Successo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Visibilità Ore (filtro staff) ── */
export const visibilitySettings = pgTable("visibility_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => utenti.id), // null = globale, valorizzato = specifico per dipendente
  dataReset: timestamp("data_reset").notNull(),
  note: text("note"),
  creataDa: integer("creata_da").notNull().references(() => utenti.id),
  creataAt: timestamp("creata_at").defaultNow().notNull(),
});
