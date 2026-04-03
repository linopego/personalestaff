CREATE TABLE "eventi" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"data" date NOT NULL,
	"ora_inizio" varchar(5),
	"ora_fine" varchar(5),
	"sede_id" integer,
	"sede_altro" text,
	"descrizione" text,
	"stato" varchar(15) DEFAULT 'bozza' NOT NULL,
	"creato_da" integer NOT NULL,
	"creato_at" timestamp DEFAULT now() NOT NULL,
	"aggiornato_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventi_assegnazioni" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"orario_inizio" varchar(5),
	"orario_fine" varchar(5),
	"mansione" text,
	"note" text,
	"aggiunto_da" integer NOT NULL,
	"aggiunto_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eventi" ADD CONSTRAINT "eventi_sede_id_sedi_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventi" ADD CONSTRAINT "eventi_creato_da_utenti_id_fk" FOREIGN KEY ("creato_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ADD CONSTRAINT "eventi_assegnazioni_evento_id_eventi_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ADD CONSTRAINT "eventi_assegnazioni_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ADD CONSTRAINT "eventi_assegnazioni_aggiunto_da_utenti_id_fk" FOREIGN KEY ("aggiunto_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;