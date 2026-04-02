CREATE TABLE "impostazioni" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_azienda" varchar(255) DEFAULT 'PresenzApp' NOT NULL,
	"fuso_orario" varchar(50) DEFAULT 'Europe/Rome' NOT NULL,
	"formato_ora" varchar(5) DEFAULT '24h' NOT NULL,
	"primo_giorno" varchar(10) DEFAULT 'lunedi' NOT NULL,
	"max_ore_giornaliere" integer DEFAULT 10 NOT NULL,
	"tolleranza_minuti" integer DEFAULT 5 NOT NULL,
	"notif_turni_incompleti" boolean DEFAULT true NOT NULL,
	"notif_turni_incompleti_email" varchar(255) DEFAULT '',
	"notif_ore_max" boolean DEFAULT true NOT NULL,
	"notif_ore_max_email" varchar(255) DEFAULT '',
	"notif_riepilogo_sett" boolean DEFAULT false NOT NULL,
	"notif_riepilogo_sett_email" varchar(255) DEFAULT '',
	"notif_timbrature_anomale" boolean DEFAULT true NOT NULL,
	"notif_timbrature_anomale_email" varchar(255) DEFAULT '',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_accessi" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"utente" varchar(255) NOT NULL,
	"dispositivo" varchar(255),
	"ip" varchar(50),
	"esito" varchar(20) DEFAULT 'Successo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log_accessi" ADD CONSTRAINT "log_accessi_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;