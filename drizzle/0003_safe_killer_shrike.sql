CREATE TABLE "visibility_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"data_reset" timestamp NOT NULL,
	"note" text,
	"creata_da" integer NOT NULL,
	"creata_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visibility_settings" ADD CONSTRAINT "visibility_settings_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_settings" ADD CONSTRAINT "visibility_settings_creata_da_utenti_id_fk" FOREIGN KEY ("creata_da") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;