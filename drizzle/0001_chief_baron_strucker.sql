CREATE TABLE "google_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"nome" varchar(100),
	"cognome" varchar(100),
	"tipo_contratto" varchar(30) DEFAULT 'Fisso' NOT NULL,
	"ore_settimanali" integer DEFAULT 40 NOT NULL,
	"creata_da" integer NOT NULL,
	"creata_at" timestamp DEFAULT now() NOT NULL,
	"utilizzata" boolean DEFAULT false NOT NULL,
	CONSTRAINT "google_whitelist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "utenti" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "utenti" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "utenti" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "utenti" ADD COLUMN "metodo_accesso" varchar(10) DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "utenti" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "google_whitelist" ADD CONSTRAINT "google_whitelist_creata_da_utenti_id_fk" FOREIGN KEY ("creata_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utenti" ADD CONSTRAINT "utenti_google_id_unique" UNIQUE("google_id");