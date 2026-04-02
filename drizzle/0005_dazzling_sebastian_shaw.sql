CREATE TABLE "turni" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" date NOT NULL,
	"sede_id" integer NOT NULL,
	"area_operativa" varchar(30) NOT NULL,
	"orario_inizio" varchar(5) NOT NULL,
	"orario_fine" varchar(5) NOT NULL,
	"note" text,
	"stato" varchar(15) DEFAULT 'bozza' NOT NULL,
	"creato_da" integer NOT NULL,
	"creato_at" timestamp DEFAULT now() NOT NULL,
	"aggiornato_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turni_assegnazioni" (
	"id" serial PRIMARY KEY NOT NULL,
	"turno_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"mansione" text,
	"aggiunto_da" integer NOT NULL,
	"aggiunto_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "turni" ADD CONSTRAINT "turni_sede_id_sedi_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turni" ADD CONSTRAINT "turni_creato_da_utenti_id_fk" FOREIGN KEY ("creato_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turni_assegnazioni" ADD CONSTRAINT "turni_assegnazioni_turno_id_turni_id_fk" FOREIGN KEY ("turno_id") REFERENCES "public"."turni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turni_assegnazioni" ADD CONSTRAINT "turni_assegnazioni_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turni_assegnazioni" ADD CONSTRAINT "turni_assegnazioni_aggiunto_da_utenti_id_fk" FOREIGN KEY ("aggiunto_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;