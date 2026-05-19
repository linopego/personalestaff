CREATE TABLE "postazioni" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"creato_da" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "postazioni_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
ALTER TABLE "postazioni" ADD CONSTRAINT "postazioni_creato_da_utenti_id_fk" FOREIGN KEY ("creato_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;