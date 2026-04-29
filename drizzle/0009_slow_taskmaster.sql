CREATE TABLE "documenti_dipendente" (
	"id" serial PRIMARY KEY NOT NULL,
	"dipendente_id" integer NOT NULL,
	"nome_file" varchar(255) NOT NULL,
	"tipo_documento" varchar(30) NOT NULL,
	"contenuto" text NOT NULL,
	"caricato_da" integer NOT NULL,
	"letto_da_dipendente" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documenti_dipendente" ADD CONSTRAINT "documenti_dipendente_dipendente_id_utenti_id_fk" FOREIGN KEY ("dipendente_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_dipendente" ADD CONSTRAINT "documenti_dipendente_caricato_da_utenti_id_fk" FOREIGN KEY ("caricato_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;