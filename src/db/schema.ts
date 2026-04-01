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
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 30 }),
  ruolo: varchar("ruolo", { length: 20 }).notNull().default("staff"), // "admin" | "staff"
  tipoContratto: varchar("tipo_contratto", { length: 30 }).notNull().default("Fisso"), // "Fisso" | "Part-time" | "A chiamata"
  oreSettimanali: integer("ore_settimanali").notNull().default(40),
  dataAssunzione: date("data_assunzione"),
  attivo: boolean("attivo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
