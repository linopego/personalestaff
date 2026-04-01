CREATE TABLE "sedi" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"indirizzo" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"raggio" integer DEFAULT 100 NOT NULL,
	"note" text,
	"attiva" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timbrature" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sede_id" integer NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"orario" timestamp NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"modificata_manualmente" boolean DEFAULT false NOT NULL,
	"note_modifica" text,
	"modified_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utenti" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"cognome" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"telefono" varchar(30),
	"ruolo" varchar(20) DEFAULT 'staff' NOT NULL,
	"tipo_contratto" varchar(30) DEFAULT 'Fisso' NOT NULL,
	"ore_settimanali" integer DEFAULT 40 NOT NULL,
	"data_assunzione" date,
	"attivo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utenti_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "timbrature" ADD CONSTRAINT "timbrature_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timbrature" ADD CONSTRAINT "timbrature_sede_id_sedi_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timbrature" ADD CONSTRAINT "timbrature_modified_by_utenti_id_fk" FOREIGN KEY ("modified_by") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;